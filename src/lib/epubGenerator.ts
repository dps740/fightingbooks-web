/**
 * EPUB Generator - Converts book pages to EPUB format
 */

import epub from 'epub-gen-memory';

interface BookPage {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface EPUBOptions {
  animalA: string;
  animalB: string;
  pages: BookPage[];
  winner: string;
}

export async function generateEPUB(options: EPUBOptions): Promise<Buffer> {
  const { animalA, animalB, pages, winner } = options;
  
  const title = `${animalA} vs ${animalB} - Who Would Win?`;
  
  // Convert pages to EPUB chapters
  const chapters = pages.map((page, index) => {
    let chapterTitle = page.title || `Chapter ${index + 1}`;
    
    // Build chapter content
    let content = '';
    
    // Add image if available
    if (page.imageUrl && !page.imageUrl.includes('placehold.co')) {
      content += `<div style="text-align: center; margin: 20px 0;">
        <img src="${page.imageUrl}" alt="${chapterTitle}" style="max-width: 100%; height: auto;" />
      </div>`;
    }
    
    // Add page content
    content += `<div>${page.content}</div>`;
    
    return {
      title: chapterTitle,
      content: content,
    };
  });

  const epubOptions = {
    title,
    author: 'FightingBooks',
    publisher: 'FightingBooks',
    description: `An epic battle between ${animalA} and ${animalB}! Who will win?`,
    tocTitle: 'Contents',
    css: `
      body { font-family: Georgia, serif; line-height: 1.6; }
      h1, h2, h3 { font-family: Arial, sans-serif; color: #d4af37; }
      img { max-width: 100%; height: auto; }
      .did-you-know { background: #fffde7; padding: 15px; border-left: 4px solid #ff9800; margin: 15px 0; }
      .weapon-box { background: #ffebee; padding: 12px; border-left: 4px solid #f44336; margin: 10px 0; }
      .defense-box { background: #e3f2fd; padding: 12px; border-left: 4px solid #2196f3; margin: 10px 0; }
    `,
  };

  try {
    const epubBuffer = await epub(epubOptions, chapters);
    return Buffer.from(epubBuffer);
  } catch (error) {
    console.error('EPUB generation error:', error);
    throw error;
  }
}
