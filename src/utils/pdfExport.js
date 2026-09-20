// Client-side PDF export utility using html2pdf.js
import html2pdf from 'html2pdf.js';

/**
 * Export an HTML element directly as a downloaded PDF file
 * @param {Object} options
 * @param {string|HTMLElement} options.element - Element or selector to export
 * @param {string} options.filename - Desired filename (e.g. "Supplier_Ledger_SUP001.pdf")
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

  const opt = {
    margin: [6, 6, 6, 6],
    filename: cleanFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'landscape'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    // Show print headers temporarily if hidden
    const printHeaders = target.querySelectorAll('.print-header');
    printHeaders.forEach((h) => {
      h.dataset.prevDisplay = h.style.display;
      h.style.display = 'block';
    });

    await html2pdf().set(opt).from(target).save();

    // Restore print headers
    printHeaders.forEach((h) => {
      h.style.display = h.dataset.prevDisplay || 'none';
    });
  } catch (err) {
    console.error('html2pdf export failed, falling back to window.print()', err);
    window.print();
  }
};
