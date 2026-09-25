// Client-side PDF export utility using html2canvas + jsPDF with mobile-safe canvas slicing
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Export an HTML element directly as a downloaded PDF file.
 *
 * Mobile-Safe html2canvas + jsPDF engine:
 * 1. windowWidth: 1200 in html2canvas so @media (max-width: 1024px) CSS rules do NOT hide tables or panels.
 * 2. Injects explicit print/desktop styles inside staging container so nothing is hidden by media queries.
 * 3. Positioned absolutely at top 0 with window scroll normalized to avoid canvas clipping.
 * 4. Uses native jsPDF pdf.save() to avoid Android Chrome premature blob revocation.
 * 5. iOS Safari fallback with direct blob window preview.
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

  // Detect mobile & iOS environments
  const isMobile = typeof window !== 'undefined' && (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  );

  // 1. Sleek loading feedback overlay for immediate response
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'pdf-export-loading-overlay';
  loadingOverlay.style.position = 'fixed';
  loadingOverlay.style.inset = '0';
  loadingOverlay.style.background = 'rgba(15, 23, 42, 0.85)';
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
    <div style="font-size: 15px; font-weight: 700; letter-spacing: -0.01em;">Generating Statement PDF...</div>
    <div style="font-size: 12px; color: #94a3b8;">Compiling high-resolution portrait A4 document</div>
    <style>@keyframes pdfSpin { to { transform: rotate(360deg); } }</style>
  `;
  document.body.appendChild(loadingOverlay);

  // Preserve previous scroll
  const prevScrollX = window.scrollX || window.pageXOffset || 0;
  const prevScrollY = window.scrollY || window.pageYOffset || 0;

  // 2. High-z-index staging container positioned at top: 0, left: 0
  const stagingContainer = document.createElement('div');
  stagingContainer.id = 'pdf-export-staging-container';
  stagingContainer.style.position = 'absolute';
  stagingContainer.style.top = '0';
  stagingContainer.style.left = '0';
  stagingContainer.style.width = '794px'; // Standard A4 portrait width at 96 DPI
  stagingContainer.style.maxWidth = '794px';
  stagingContainer.style.minWidth = '794px';
  stagingContainer.style.minHeight = '1000px';
  stagingContainer.style.background = '#ffffff';
  stagingContainer.style.color = '#0f172a';
  stagingContainer.style.padding = '20px 24px';
  stagingContainer.style.margin = '0';
  stagingContainer.style.boxSizing = 'border-box';
  stagingContainer.style.zIndex = '10000000';
  stagingContainer.style.overflow = 'visible';
  stagingContainer.style.pointerEvents = 'none';

  // Inject CSS override to defeat @media (max-width: 1024px) hiding
  const overrideStyle = document.createElement('style');
  overrideStyle.textContent = `
    #pdf-export-staging-container * {
      box-sizing: border-box !important;
    }
    #pdf-export-staging-container .desktop-table-view,
    #pdf-export-staging-container .customer-ledger-panel,
    #pdf-export-staging-container .supplier-ledger-panel,
    #pdf-export-staging-container .table-responsive,
    #pdf-export-staging-container table,
    #pdf-export-staging-container .data-table {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      max-height: none !important;
      overflow: visible !important;
    }
    #pdf-export-staging-container table,
    #pdf-export-staging-container .data-table {
      display: table !important;
      width: 100% !important;
      border-collapse: collapse !important;
    }
    #pdf-export-staging-container thead { display: table-header-group !important; }
    #pdf-export-staging-container tbody { display: table-row-group !important; }
    #pdf-export-staging-container tr { display: table-row !important; }
    #pdf-export-staging-container th,
    #pdf-export-staging-container td { display: table-cell !important; }
    #pdf-export-staging-container .mobile-cards-view,
    #pdf-export-staging-container .no-print {
      display: none !important;
    }
    #pdf-export-staging-container .print-header {
      display: block !important;
      visibility: visible !important;
    }
  `;
  stagingContainer.appendChild(overrideStyle);

  // 3. Deep clone target element
  const clone = target.cloneNode(true);
  clone.id = 'pdf-render-clone';

  // Remove elements that must not appear in the PDF
  clone.querySelectorAll('.no-print').forEach((el) => el.remove());
  clone.querySelectorAll('.mobile-cards-view').forEach((el) => el.remove());

  // Reveal all print headers
  clone.querySelectorAll('.print-header').forEach((h) => {
    h.style.setProperty('display', 'block', 'important');
    h.style.setProperty('visibility', 'visible', 'important');
  });

  // Strip all hiding classes
  const hideClasses = ['desktop-table-view', 'customer-ledger-panel', 'supplier-ledger-panel', 'mobile-hide'];
  hideClasses.forEach((cls) => {
    clone.classList.remove(cls);
    clone.querySelectorAll('.' + cls).forEach((el) => {
      el.classList.remove(cls);
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
    });
  });

  // Base clone styling
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

  stagingContainer.appendChild(clone);
  document.body.appendChild(stagingContainer);

  try {
    // Normalise scroll before capture so html2canvas doesn't produce blank canvas
    if (window.scrollTo) {
      window.scrollTo(0, 0);
    }

    // Delay 250ms to allow fonts, SVGs, and cloned styles to settle in the DOM
    await new Promise((resolve) => setTimeout(resolve, 250));

    // Render directly with html2canvas (windowWidth: 1200 defeats mobile media query hiding)
    const canvas = await html2canvas(stagingContainer, {
      scale: isMobile ? 1.5 : 2,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      x: 0,
      y: 0,
      width: 794,
      windowWidth: 1200, // Forces desktop layout inside html2canvas
      backgroundColor: '#ffffff'
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas render produced empty dimensions');
    }

    // Create portrait A4 PDF via jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidthMm = 210;
    const pageHeightMm = 297;
    const marginMm = 8;
    const contentWidthMm = pageWidthMm - (marginMm * 2); // 194 mm
    const contentHeightMm = pageHeightMm - (marginMm * 2); // 281 mm

    // Pixels per page in the rendered canvas
    const pageHeightPx = Math.floor((contentHeightMm * canvas.width) / contentWidthMm);

    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < canvas.height) {
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedHeight);

      // Create slice canvas
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0, renderedHeight, canvas.width, sliceHeightPx,
        0, 0, canvas.width, sliceHeightPx
      );

      const sliceHeightMm = (sliceHeightPx * contentWidthMm) / canvas.width;
      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);

      if (pageIndex > 0) {
        pdf.addPage('a4', 'portrait');
      }
      pdf.addImage(sliceData, 'JPEG', marginMm, marginMm, contentWidthMm, sliceHeightMm);

      renderedHeight += sliceHeightPx;
      pageIndex++;
    }

    if (isIOS) {
      // iOS Safari handles blob preview best
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) {
        window.location.href = blobUrl;
      }
    } else {
      // Built-in pdf.save handles Android Chrome, mobile WebViews, and Desktop reliably
      pdf.save(cleanFilename);
    }
  } catch (err) {
    console.error('PDF export failed, falling back to window.print()', err);
    window.print();
  } finally {
    if (window.scrollTo) {
      window.scrollTo(prevScrollX, prevScrollY);
    }
    if (stagingContainer.parentNode) {
      stagingContainer.parentNode.removeChild(stagingContainer);
    }
    if (loadingOverlay.parentNode) {
      loadingOverlay.parentNode.removeChild(loadingOverlay);
    }
  }
};
