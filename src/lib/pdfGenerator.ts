/**
 * PDF Generator - "Who Would Win?" Style Book PDFs
 * Uses @react-pdf/renderer for serverless-compatible PDF generation
 */

import React from 'react';
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts - Comic Neue for body, system sans for headings
Font.register({
  family: 'Comic Neue',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/comicneue/v8/4UaHrEJDsxBrF37olUeDx63j5pN1MwI.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/comicneue/v8/4UaErEJDsxBrF37olUeD_xHMwpteLwtHJlc.ttf', fontWeight: 700 },
  ],
});

// Colors matching "Who Would Win?" style
const colors = {
  titleOrange: '#ff5722',
  darkBlue: '#1565c0',
  darkRed: '#d32f2f',
  gold: '#d4af37',
  coverBlue: '#0077be',
  factGreen: '#a5d6a7',
  factYellow: '#fff59d',
  factPurple: '#ce93d8',
  factPink: '#ff69b4',
};

// Styles
const styles = StyleSheet.create({
  // Cover page
  coverPage: {
    padding: 40,
    backgroundColor: colors.coverBlue,
    fontFamily: 'Comic Neue',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverTitle: {
    fontSize: 42,
    fontWeight: 700,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  coverVs: {
    fontSize: 60,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 15,
  },
  coverSubtitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
  
  // Regular pages
  page: {
    padding: 35,
    backgroundColor: '#ffffff',
    fontFamily: 'Comic Neue',
  },
  pageGreen: { backgroundColor: '#e8f5e9' },
  pageGold: { backgroundColor: '#fff8e1' },
  pageBlue: { backgroundColor: '#e3f2fd' },
  pagePink: { backgroundColor: '#fce4ec' },
  pagePurple: { backgroundColor: '#ede7f6' },
  
  // Titles
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: colors.titleOrange,
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.darkRed,
    marginBottom: 8,
    marginTop: 12,
  },
  
  // Content
  content: {
    fontSize: 13,
    lineHeight: 1.7,
    color: '#333333',
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 700,
    color: colors.darkRed,
  },
  
  // Scientific name banner
  scientificBanner: {
    backgroundColor: colors.factPink,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  scientificText: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.darkBlue,
    fontStyle: 'italic',
  },
  
  // Fact boxes
  factBox: {
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  funFact: {
    backgroundColor: colors.factGreen,
  },
  didYouKnow: {
    backgroundColor: colors.factYellow,
  },
  interestingFact: {
    backgroundColor: colors.factPurple,
  },
  factTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.darkRed,
    marginBottom: 5,
  },
  factContent: {
    fontSize: 12,
    color: '#333',
    lineHeight: 1.5,
  },
  
  // Images
  image: {
    maxWidth: '100%',
    maxHeight: 220,
    marginVertical: 12,
    alignSelf: 'center',
    borderRadius: 8,
  },
  
  // Stats table
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 6,
  },
  statsLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: 700,
    color: '#555',
  },
  statsValueA: {
    flex: 1,
    fontSize: 12,
    color: colors.darkRed,
    textAlign: 'center',
  },
  statsValueB: {
    flex: 1,
    fontSize: 12,
    color: colors.darkBlue,
    textAlign: 'center',
  },
  
  // Victory page
  victoryPage: {
    padding: 40,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  victoryTitle: {
    fontSize: 48,
    fontWeight: 700,
    color: colors.darkRed,
    textAlign: 'center',
    marginBottom: 20,
  },
  winnerName: {
    fontSize: 36,
    fontWeight: 700,
    color: colors.coverBlue,
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  victoryText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 35,
    right: 35,
    textAlign: 'center',
    fontSize: 10,
    color: '#999',
  },
});

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

// Helper to strip HTML tags
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<em>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

// Get background style based on page index
function getPageStyle(index: number) {
  const bgStyles = [styles.pageGreen, styles.pageGold, styles.pageBlue, styles.pagePink, styles.pagePurple];
  return bgStyles[index % bgStyles.length];
}

// Render a fact box
function FactBox({ type, title, content }: { type: 'fun' | 'know' | 'interesting'; title: string; content: string }) {
  const boxStyle = type === 'fun' ? styles.funFact : type === 'know' ? styles.didYouKnow : styles.interestingFact;
  return React.createElement(
    View,
    { style: [styles.factBox, boxStyle] },
    React.createElement(Text, { style: styles.factTitle }, title),
    React.createElement(Text, { style: styles.factContent }, content)
  );
}

// Create PDF Document
function BookDocument({ animalA, animalB, pages, winner }: PDFOptions) {
  const pageElements: React.ReactElement[] = [];
  
  // Cover page
  pageElements.push(
    React.createElement(
      Page,
      { key: 'cover', size: 'LETTER', style: styles.coverPage },
      React.createElement(Text, { style: { fontSize: 20, color: '#fff', marginBottom: 30 } }, 'WHO WOULD WIN?'),
      React.createElement(Text, { style: styles.coverTitle }, animalA),
      React.createElement(Text, { style: styles.coverVs }, 'VS'),
      React.createElement(Text, { style: styles.coverTitle }, animalB),
      React.createElement(Text, { style: styles.coverSubtitle }, 'THE ULTIMATE BATTLE!')
    )
  );
  
  // Content pages
  pages.forEach((page, index) => {
    const hasValidImage = page.imageUrl && !page.imageUrl.includes('placehold.co');
    const plainContent = stripHtml(page.content);
    const isVictory = page.type === 'victory' || page.title?.toLowerCase().includes('victory') || page.title?.toLowerCase().includes('winner');
    
    if (isVictory) {
      // Victory page with special styling
      pageElements.push(
        React.createElement(
          Page,
          { key: page.id || `page-${index}`, size: 'LETTER', style: styles.victoryPage },
          React.createElement(Text, { style: styles.victoryTitle }, '🏆 WINNER! 🏆'),
          React.createElement(Text, { style: styles.winnerName }, winner || 'THE CHAMPION'),
          hasValidImage && React.createElement(Image, { style: styles.image, src: page.imageUrl }),
          React.createElement(Text, { style: styles.victoryText }, plainContent),
          React.createElement(Text, { style: styles.footer }, `${index + 2}`)
        )
      );
    } else {
      // Regular content page
      const bgStyle = getPageStyle(index);
      
      // Detect if content has facts we can box
      const hasFunFact = plainContent.toLowerCase().includes('fun fact') || plainContent.toLowerCase().includes('did you know');
      
      pageElements.push(
        React.createElement(
          Page,
          { key: page.id || `page-${index}`, size: 'LETTER', style: [styles.page, bgStyle] },
          // Title
          page.title && React.createElement(Text, { style: styles.pageTitle }, page.title),
          
          // Image at top if present
          hasValidImage && React.createElement(Image, { style: styles.image, src: page.imageUrl }),
          
          // Main content
          React.createElement(Text, { style: styles.content }, plainContent),
          
          // Page number
          React.createElement(Text, { style: styles.footer }, `${index + 2}`)
        )
      );
    }
  });
  
  return React.createElement(
    Document,
    { title: `${animalA} vs ${animalB} - Who Would Win?`, author: 'FightingBooks' },
    ...pageElements
  );
}

/**
 * Generate PDF from book pages
 * Returns PDF as Buffer
 */
export async function generatePDF(options: PDFOptions): Promise<Buffer> {
  const buffer = await renderToBuffer(BookDocument(options));
  return Buffer.from(buffer);
}
