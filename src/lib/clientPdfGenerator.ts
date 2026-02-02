'use client';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BookPage {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface GeneratePdfOptions {
  animalA: string;
  animalB: string;
  pages: BookPage[];
  winner: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Generate PDF by capturing rendered HTML pages
 * This runs entirely client-side in the browser
 */
export async function generatePdfClientSide(options: GeneratePdfOptions): Promise<Blob> {
  const { animalA, animalB, pages, winner, onProgress } = options;
  
  // Create PDF document (Letter size: 8.5 x 11 inches)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });
  
  const pageWidth = 8.5;
  const pageHeight = 11;
  
  // Create a hidden container for rendering
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 816px;
    height: 1056px;
    background: white;
    overflow: hidden;
  `;
  document.body.appendChild(container);
  
  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, pages.length);
      }
      
      // Render page HTML
      container.innerHTML = renderPageHtml(page, animalA, animalB, winner, i);
      
      // Wait for images to load
      await waitForImages(container);
      
      // Small delay for rendering
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture as canvas
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      
      // Add to PDF
      if (i > 0) {
        pdf.addPage();
      }
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    }
    
    // Return as blob
    return pdf.output('blob');
    
  } finally {
    // Cleanup
    document.body.removeChild(container);
  }
}

/**
 * Wait for all images in container to load
 */
async function waitForImages(container: HTMLElement): Promise<void> {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Don't fail on broken images
    });
  });
  await Promise.all(promises);
}

/**
 * Render a single page to HTML matching the website styling
 */
function renderPageHtml(page: BookPage, animalA: string, animalB: string, winner: string, index: number): string {
  const isCover = page.type === 'cover';
  const isVictory = page.type === 'victory';
  const isStats = page.type === 'stats';
  
  // Background colors matching the website
  const bgColors: Record<string, string> = {
    cover: 'linear-gradient(135deg, #0077be 0%, #005a8c 100%)',
    intro: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
    stats: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
    battle: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
    victory: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  };
  
  const bgColor = bgColors[page.type] || bgColors.intro;
  
  // Base styles
  const baseStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body, html {
        width: 816px;
        height: 1056px;
        font-family: 'Comic Neue', cursive;
      }
      
      .page {
        width: 816px;
        height: 1056px;
        padding: 40px;
        background: ${bgColor};
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .page-title {
        font-family: 'Bangers', cursive;
        font-size: 42px;
        color: #ff5722;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        margin-bottom: 20px;
        letter-spacing: 2px;
        text-transform: uppercase;
      }
      
      .cover-banner {
        font-family: 'Bangers', cursive;
        font-size: 48px;
        color: #ff0000;
        background: #ffeb3b;
        padding: 15px 40px;
        border: 5px solid #ff0000;
        border-radius: 10px;
        text-shadow: 2px 2px 0px rgba(0,0,0,0.3);
        letter-spacing: 3px;
        margin-bottom: 30px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        text-transform: uppercase;
      }
      
      .cover-title {
        font-family: 'Bangers', cursive;
        font-size: 64px;
        color: #FFD700;
        text-align: center;
        text-shadow: 4px 4px 0px rgba(0,0,0,0.5);
        margin: 15px 0;
        text-transform: uppercase;
        letter-spacing: 3px;
      }
      
      .cover-vs {
        font-family: 'Bangers', cursive;
        font-size: 80px;
        color: white;
        text-align: center;
        text-shadow: 5px 5px 10px rgba(0,0,0,0.6);
        margin: 20px 0;
        letter-spacing: 5px;
      }
      
      .cover-subtitle {
        font-size: 28px;
        color: white;
        text-align: center;
        margin-top: 25px;
        font-family: 'Bangers', cursive;
        letter-spacing: 2px;
      }
      
      .page-image {
        max-width: 100%;
        max-height: 400px;
        margin: 20px auto;
        display: block;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      }
      
      .page-content {
        font-size: 18px;
        line-height: 1.7;
        color: #333;
        flex: 1;
      }
      
      .page-content p { margin-bottom: 12px; }
      .page-content strong { color: #d32f2f; }
      .page-content em { color: #1565c0; font-style: italic; }
      
      .did-you-know {
        background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%);
        border: 3px solid white;
        border-radius: 12px;
        padding: 15px;
        margin: 15px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .fun-fact {
        background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
        border: 3px solid white;
        border-radius: 12px;
        padding: 15px;
        margin: 15px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .weapon-box {
        background: linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%);
        border: 3px solid white;
        border-radius: 12px;
        padding: 15px;
        margin: 15px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .defense-box {
        background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%);
        border: 3px solid white;
        border-radius: 12px;
        padding: 15px;
        margin: 15px 0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .victory-title {
        font-family: 'Bangers', cursive;
        font-size: 64px;
        color: #d32f2f;
        text-align: center;
        text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
        margin-bottom: 20px;
      }
      
      .winner-name {
        font-family: 'Bangers', cursive;
        font-size: 48px;
        color: #0077be;
        text-align: center;
        text-transform: uppercase;
        margin-bottom: 20px;
      }
      
      .page-number {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 14px;
        color: #666;
      }
    </style>
  `;
  
  // Generate page HTML based on type
  if (isCover) {
    return `
      ${baseStyles}
      <div class="page" style="justify-content: center; align-items: center;">
        <div class="cover-banner">WHO WOULD WIN?</div>
        ${page.imageUrl ? `<img src="${page.imageUrl}" class="page-image" style="max-height: 320px; margin-bottom: 25px; border: 4px solid white;" crossorigin="anonymous" />` : ''}
        <div class="cover-title">${animalA}</div>
        <div class="cover-vs">VS</div>
        <div class="cover-title">${animalB}</div>
      </div>
    `;
  }
  
  if (isVictory) {
    return `
      ${baseStyles}
      <style>
        .victory-page {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
          justify-content: center;
          align-items: center;
          position: relative;
        }
        .victory-crown {
          font-size: 120px;
          margin-bottom: 20px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
        }
        .victory-label {
          font-family: 'Bangers', cursive;
          font-size: 36px;
          color: #d4af37;
          letter-spacing: 8px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          margin-bottom: 10px;
        }
        .victory-winner {
          font-family: 'Bangers', cursive;
          font-size: 72px;
          color: white;
          text-shadow: 4px 4px 8px rgba(0,0,0,0.9);
          letter-spacing: 4px;
          text-transform: uppercase;
          margin-bottom: 30px;
        }
        .victory-image {
          max-width: 80%;
          max-height: 400px;
          border-radius: 16px;
          border: 4px solid #d4af37;
          box-shadow: 0 12px 40px rgba(212, 175, 55, 0.4);
        }
        .victory-tagline {
          font-family: 'Comic Neue', cursive;
          font-size: 24px;
          color: #ccc;
          margin-top: 30px;
          font-style: italic;
        }
      </style>
      <div class="page victory-page">
        <div class="victory-crown">👑</div>
        <div class="victory-label">THE WINNER</div>
        <div class="victory-winner">${winner}</div>
        ${page.imageUrl ? `<img src="${page.imageUrl}" class="victory-image" crossorigin="anonymous" />` : ''}
        <div class="victory-tagline">The ultimate champion!</div>
        <div class="page-number" style="color: rgba(255,255,255,0.5);">Page ${index + 1}</div>
      </div>
    `;
  }
  
  // Regular page
  return `
    ${baseStyles}
    <div class="page">
      <div class="page-title">${page.title}</div>
      ${page.imageUrl ? `<img src="${page.imageUrl}" class="page-image" crossorigin="anonymous" />` : ''}
      <div class="page-content">
        ${page.content}
      </div>
      <div class="page-number">Page ${index + 1}</div>
    </div>
  `;
}

/**
 * Trigger download of PDF blob
 */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
