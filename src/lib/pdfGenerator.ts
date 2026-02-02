/**
 * PDF Generator - Converts web book pages to PDF format
 * Uses puppeteer-core with @sparticuz/chromium for Vercel serverless
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

interface BookPage {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
  choices?: { id: string; text: string; emoji: string }[];
}

interface PDFOptions {
  animalA: string;
  animalB: string;
  pages: BookPage[];
  winner: string;
}

/**
 * Generate a full HTML document from book pages
 */
function generateBookHTML(options: PDFOptions): string {
  const { animalA, animalB, pages, winner } = options;
  
  const htmlPages = pages.map(page => {
    const hasImage = page.imageUrl && !page.imageUrl.includes('placehold.co');
    
    return `
      <div class="book-page" style="page-break-after: always; padding: 40px; min-height: 100vh; position: relative;">
        ${page.title ? `<h1 style="font-size: 36px; font-weight: bold; color: #d4af37; text-align: center; margin-bottom: 24px;">${page.title}</h1>` : ''}
        
        ${hasImage ? `
          <div style="text-align: center; margin: 20px 0;">
            <img src="${page.imageUrl}" alt="${page.title}" style="max-width: 600px; max-height: 400px; width: auto; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" />
          </div>
        ` : ''}
        
        <div style="font-size: 18px; line-height: 1.8; color: #333; ${hasImage ? 'margin-top: 20px;' : ''}">
          ${page.content}
        </div>
        
        ${page.choices ? `
          <div style="margin-top: 30px;">
            <h3 style="font-size: 24px; color: #d4af37; margin-bottom: 16px;">Choose Your Path:</h3>
            ${page.choices.map((choice, i) => `
              <div style="background: #f5f5f5; padding: 16px; margin: 12px 0; border-left: 4px solid #d4af37; border-radius: 4px;">
                <span style="font-size: 24px; margin-right: 12px;">${choice.emoji}</span>
                <strong>${choice.text}</strong>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${animalA} vs ${animalB} - Who Would Win?</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@400;700&display=swap');
        
        body {
          font-family: 'Comic Neue', cursive, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
        }
        
        h1, h2, h3, h4 {
          font-family: 'Bangers', cursive;
          letter-spacing: 1px;
        }
        
        .book-page ul {
          list-style-position: inside;
          margin-left: 0;
          padding-left: 20px;
        }
        
        .book-page li {
          margin: 8px 0;
        }
        
        .book-page strong {
          color: #c62828;
        }
        
        .book-page em {
          font-style: italic;
          color: #666;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        table td {
          padding: 12px;
          border: 1px solid #ddd;
        }
        
        .victory-content {
          text-align: center;
          padding: 40px;
        }
      </style>
    </head>
    <body>
      ${htmlPages}
    </body>
    </html>
  `;
}

/**
 * Generate PDF from book pages
 * Returns PDF as Buffer
 */
export async function generatePDF(options: PDFOptions): Promise<Buffer> {
  const html = generateBookHTML(options);
  
  // Launch puppeteer with @sparticuz/chromium for Vercel
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  
  try {
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
