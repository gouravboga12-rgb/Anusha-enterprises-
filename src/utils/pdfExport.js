// Client-side PDF export utility using html2pdf.js with mobile-safe positive-coordinate staging
import html2pdf from 'html2pdf.js';

/**
 * Export an HTML element directly as a downloaded PDF file.
 *
 * Solves the mobile blank page issue:
 * 1. Positions staging container at positive coordinates (left: 0, top: 0, width: 794px)
 *    instead of negative offscreen coordinates (-9999px) which cause html2canvas to paint
 *    outside the canvas boundaries on mobile browsers.
 * 2. Uses scale: 1.15 on mobile (vs 2 on desktop) to stay safely below iOS Safari and Android
 *    canvas buffer memory limits (which otherwise silently produce blank white canvases).
 * 3. Strips all classes that cause `display: none !important` under mobile media queries
 *    (such as .desktop-table-view, .customer-ledger-panel, .supplier-ledger-panel, .mobile-hide).
 * 4. Strips .mobile-cards-view and .no-print elements so the PDF statement is a clean A4 portrait table.
 * 5. Forces .print-header to display: block !important so document letterheads and summaries render.
 * 6. Fixes scroll coordinates (scrollX: 0, scrollY: 0) so mobile scroll positions never cause blank offsets.
 * 7. Displays an overlay spinner on the UI during generation for immediate user feedback.
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

  const cleanFilename = filename ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`) : 'statement.pdf';
  if (title) {
    try {
      document.title = title;
    } catch (e) {
      // ignore
    }
  }

  // Detect mobile devices (screen width <= 768px or mobile user agent)
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  // 1. Create a sleek loading feedback overlay for the user
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'pdf-export-loading-overlay';
  loadingOverlay.style.position = 'fixed';
  loadingOverlay.style.inset = '0';
  loadingOverlay.style.background = 'rgba(15, 23, 42, 0.75)';
  loadingOverlay.style.backdropFilter = 'blur(4px)';
  loadingOverlay.style.zIndex = '999999';
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.flexDirection = 'column';
  loadingOverlay.style.alignItems = 'center';
  loadingOverlay.style.justifyContent = 'center';
  loadingOverlay.style.gap = '12px';
  loadingOverlay.style.color = '#ffffff';
  loadingOverlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  loadingOverlay.innerHTML = `
    <div style="width: 44px; height: 44px; border: 3.5px solid rgba(255,255,255,0.25); border-top-color: #38bdf8; border-radius: 50%; animation: pdfSpin 0.75s linear infinite;"></div>
    <div style="font-size: 15px; font-weight: 700; letter-spacing: -0.01em;">Preparing Statement PDF...</div>
    <div style="font-size: 12px; color: #94a3b8;">Formatting statement records for portrait A4</div>
    <style>@keyframes pdfSpin { to { transform: rotate(360deg); } }</style>
  `;
  document.body.appendChild(loadingOverlay);

  // 2. Create the staging container at POSITIVE screen coordinates (left: 0, top: 0)
  // It is placed beneath loadingOverlay (z-index: 99990 vs 999999) so it is never seen by the user,
  // but html2canvas has valid, in-bounds layout coordinates (0, 0) and captures every single pixel!
  const stagingWrapper = document.createElement('div');
  stagingWrapper.id = 'pdf-render-staging-wrapper';
  stagingWrapper.style.position = 'fixed';
  stagingWrapper.style.top = '0';
  stagingWrapper.style.left = '0';
  stagingWrapper.style.width = '794px'; // Standard A4 portrait width at 96 DPI
  stagingWrapper.style.maxWidth = '794px';
  stagingWrapper.style.minHeight = '1000px';
  stagingWrapper.style.background = '#ffffff';
  stagingWrapper.style.color = '#0f172a';
  stagingWrapper.style.padding = '20px 24px';
  stagingWrapper.style.margin = '0';
  stagingWrapper.style.boxSizing = 'border-box';
  stagingWrapper.style.zIndex = '99990';
  stagingWrapper.style.overflow = 'visible';
  stagingWrapper.style.pointerEvents = 'none';

  // 3. Deep clone target
  const clone = target.cloneNode(true);
  clone.id = 'pdf-render-clone';

  // Remove elements that should not appear in PDF
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());
  clone.querySelectorAll('.mobile-cards-view').forEach((el) => el.remove());

  // Reveal all print headers
  clone.querySelectorAll('.print-header').forEach((h) => {
    h.style.setProperty('display', 'block', 'important');
    h.style.setProperty('visibility', 'visible', 'important');
  });

  // Strip all hiding classes so mobile media queries cannot hide tables or cards
  const hideClasses = ['desktop-table-view', 'customer-ledger-panel', 'supplier-ledger-panel', 'mobile-hide'];
  hideClasses.forEach((cls) => {
    clone.classList.remove(cls);
    clone.querySelectorAll('.' + cls).forEach((el) => {
      el.classList.remove(cls);
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
    });
  });

  // Ensure clone base appearance
  clone.style.setProperty('display', 'block', 'important');
  clone.style.setProperty('visibility', 'visible', 'important');
  clone.style.setProperty('opacity', '1', 'important');
  clone.style.setProperty('width', '100%', 'important');
  clone.style.setProperty('max-width', '100%', 'important');
  clone.style.setProperty('background', '#ffffff', 'important');
  clone.style.setProperty('color', '#0f172a', 'important');
  clone.style.setProperty('box-sizing', 'border-box', 'important');

  // Format 5 summary metrics grid for portrait A4 (5-column layout)
  const metricsGrid = clone.querySelector('.daybook-metrics-grid');
  if (metricsGrid) {
    metricsGrid.style.setProperty('display', 'grid', 'important');
    metricsGrid.style.setProperty('grid-template-columns', 'repeat(5, 1fr)', 'important');
    metricsGrid.style.setProperty('gap', '6px', 'important');
    metricsGrid.style.setProperty('margin-bottom', '14px', 'important');
    metricsGrid.querySelectorAll(':scope > div').forEach((card) => {
      card.style.setProperty('padding', '6px 8px', 'important');
      card.style.setProperty('grid-column', 'auto', 'important');
      card.style.setProperty('background', '#ffffff', 'important');
      card.style.setProperty('border', '1px solid #cbd5e1', 'important');
    });
  }

  // Format tables for unclipped natural multi-page flow
  clone.querySelectorAll('.table-responsive').forEach((el) => {
    el.style.setProperty('overflow', 'visible', 'important');
    el.style.setProperty('width', '100%', 'important');
    el.style.setProperty('max-width', '100%', 'important');
  });

  clone.querySelectorAll('table, .data-table').forEach((table) => {
    table.style.setProperty('width', '100%', 'important');
    table.style.setProperty('max-width', '100%', 'important');
    table.style.setProperty('border-collapse', 'collapse', 'important');
    table.style.setProperty('table-layout', 'auto', 'important');
  });

  clone.querySelectorAll('th, td').forEach((cell) => {
    cell.style.setProperty('white-space', 'normal', 'important');
    cell.style.setProperty('word-break', 'break-word', 'important');
  });

  // Ensure all containers inside clone have visible overflow and unconstrained heights
  clone.querySelectorAll('*').forEach((el) => {
    if (el.style.overflow === 'hidden' || el.style.overflowX === 'hidden' || el.style.overflowY === 'hidden') {
      el.style.overflow = 'visible';
    }
    if (el.style.maxHeight) el.style.maxHeight = 'none';
  });

  stagingWrapper.appendChild(clone);
  document.body.appendChild(stagingWrapper);

  const opt = {
    margin: [8, 8, 8, 8],
    filename: cleanFilename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: isMobile ? 1.15 : 2, // 1.15 on mobile completely prevents iOS canvas buffer overflow
      useCORS: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      x: 0,
      y: 0,
      width: 794,
      windowWidth: 794,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Ensure the staging container in html2canvas clonedDoc is 100% visible and un-hidden
        const stagingInDoc = clonedDoc.getElementById('pdf-render-staging-wrapper');
        if (stagingInDoc) {
          stagingInDoc.style.setProperty('opacity', '1', 'important');
          stagingInDoc.style.setProperty('visibility', 'visible', 'important');
          stagingInDoc.style.setProperty('display', 'block', 'important');
        }
        const overlayInDoc = clonedDoc.querySelector('.html2pdf__overlay');
        if (overlayInDoc) {
          overlayInDoc.style.setProperty('opacity', '1', 'important');
        }
      }
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    // 120ms delay to allow all styles, SVGs, and fonts to settle in staging
    await new Promise((resolve) => setTimeout(resolve, 120));
    await html2pdf().set(opt).from(stagingWrapper).save();
  } catch (err) {
    console.error('html2pdf export failed, falling back to window.print()', err);
    window.print();
  } finally {
    if (stagingWrapper.parentNode) {
      stagingWrapper.parentNode.removeChild(stagingWrapper);
    }
    if (loadingOverlay.parentNode) {
      loadingOverlay.parentNode.removeChild(loadingOverlay);
    }
  }
};
