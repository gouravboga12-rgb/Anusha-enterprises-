// Client-side PDF export utility using html2pdf.js with mobile-safe off-screen clone
import html2pdf from 'html2pdf.js';

/**
 * Export an HTML element directly as a downloaded PDF file
 * Uses an off-screen clone with standard A4 portrait width (794px) to ensure:
 * - Flawless mobile rendering without blank screens or viewport squishing
 * - Portrait A4 format with crisp typography
 * - No clipped data (unrestricted heights, visible overflow, naturally wrapping tables)
 * - Complete metric summary cards included
 *
 * @param {Object} options
 * @param {string|HTMLElement} options.element - Element or selector to export
 * @param {string} options.filename - Desired filename (e.g. "DayBook_Statement_2026-09-25.pdf")
 * @param {string} options.title - Document title for the PDF
 * @returns {Promise<void>}
 */
export const exportElementToPdf = async ({ element, filename, title }) => {
  const target = typeof element === 'string' ? document.querySelector(element) : element;
  if (!target) {
    console.warn('PDF export target element not found, falling back to window.print()');
    window.print();
    return;
  }

  const cleanFilename = filename ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`) : 'document.pdf';
  if (title) {
    try {
      document.title = title;
    } catch (e) {
      // ignore
    }
  }

  // Create an off-screen staging clone with fixed standard A4 portrait dimensions
  const stagingWrapper = document.createElement('div');
  stagingWrapper.id = 'pdf-render-staging-wrapper';
  stagingWrapper.style.position = 'fixed';
  stagingWrapper.style.left = '-9999px';
  stagingWrapper.style.top = '0';
  stagingWrapper.style.width = '794px'; // 794px = standard A4 width at 96 DPI
  stagingWrapper.style.minHeight = '1123px';
  stagingWrapper.style.background = '#ffffff';
  stagingWrapper.style.color = '#0f172a';
  stagingWrapper.style.padding = '16px';
  stagingWrapper.style.boxSizing = 'border-box';
  stagingWrapper.style.zIndex = '-99999';
  stagingWrapper.style.overflow = 'visible';

  // Deep clone target to avoid mutating user-facing active DOM
  const clone = target.cloneNode(true);
  clone.id = 'pdf-render-clone';
  clone.style.width = '100%';
  clone.style.overflow = 'visible';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';

  // 1. Remove all .no-print elements inside the clone
  const noPrintEls = clone.querySelectorAll('.no-print');
  noPrintEls.forEach((el) => el.remove());

  // 2. Reveal all .print-header elements
  const printHeaders = clone.querySelectorAll('.print-header');
  printHeaders.forEach((h) => {
    h.style.display = 'block';
    h.style.visibility = 'visible';
  });

  // 3. Ensure all containers have visible overflow and unconstrained heights
  const allContainers = clone.querySelectorAll('*');
  allContainers.forEach((el) => {
    const s = window.getComputedStyle(el);
    if (s.overflow === 'hidden' || s.overflowX === 'hidden' || s.overflowY === 'hidden') {
      el.style.overflow = 'visible';
    }
    if (el.classList.contains('table-responsive')) {
      el.style.overflow = 'visible';
      el.style.display = 'block';
      el.style.width = '100%';
    }
  });

  stagingWrapper.appendChild(clone);
  document.body.appendChild(stagingWrapper);

  const opt = {
    margin: [8, 8, 8, 8],
    filename: cleanFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 800
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    // Small delay to allow any fonts/images to settle in the staging clone
    await new Promise((resolve) => setTimeout(resolve, 80));
    await html2pdf().set(opt).from(stagingWrapper).save();
  } catch (err) {
    console.error('html2pdf export failed, falling back to window.print()', err);
    window.print();
  } finally {
    if (stagingWrapper.parentNode) {
      stagingWrapper.parentNode.removeChild(stagingWrapper);
    }
  }
};
