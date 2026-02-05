/**
 * PDF Generator - "Who Would Win?" Style Book PDFs
 * Uses @react-pdf/renderer for serverless-compatible PDF generation
 */

import React from 'react';
import { renderToBuffer, Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
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
  factGreen: '#c8e6c9',
  factYellow: '#fff9c4',
  factPurple: '#e1bee7',
  factPink: '#f8bbd9',
  weaponRed: '#ffcdd2',
  defenseBlue: '#bbdefb',
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
  coverImage: {
    width: '100%',
    maxHeight: 350,
    marginBottom: 20,
    borderRadius: 8,
    objectFit: 'contain',
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  coverVs: {
    fontSize: 48,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 10,
  },
  coverSubtitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 15,
  },
  
  // Regular pages
  page: {
    padding: 30,
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
    fontSize: 24,
    fontWeight: 700,
    color: colors.titleOrange,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  
  // Content
  content: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#333333',
    marginBottom: 8,
  },
  
  // Images
  pageImage: {
    width: '100%',
    maxHeight: 250,
    marginVertical: 10,
    alignSelf: 'center',
    borderRadius: 8,
    objectFit: 'contain',
  },
  
  // Fact boxes
  factBox: {
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  funFact: { backgroundColor: colors.factGreen },
  didYouKnow: { backgroundColor: colors.factYellow },
  weaponBox: { backgroundColor: colors.weaponRed },
  defenseBox: { backgroundColor: colors.defenseBlue },
  
  factTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: colors.darkRed,
    marginBottom: 4,
  },
  factContent: {
    fontSize: 11,
    color: '#333',
    lineHeight: 1.5,
  },
  
  // Stats comparison
  statsContainer: {
    marginVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
  },
  statsHeader: {
    flexDirection: 'row',
    backgroundColor: colors.gold,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  statsLabel: {
    flex: 2,
    fontSize: 10,
    fontWeight: 700,
    color: '#333',
  },
  statsValueA: {
    flex: 1,
    fontSize: 10,
    color: colors.darkRed,
    textAlign: 'center',
    fontWeight: 700,
  },
  statsValueB: {
    flex: 1,
    fontSize: 10,
    color: colors.darkBlue,
    textAlign: 'center',
    fontWeight: 700,
  },
  
  // Victory page
  victoryPage: {
    padding: 40,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
  },
  victoryTitle: {
    fontSize: 42,
    fontWeight: 700,
    color: colors.darkRed,
    textAlign: 'center',
    marginBottom: 15,
  },
  winnerName: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.coverBlue,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  victoryImage: {
    width: '80%',
    maxHeight: 280,
    marginVertical: 15,
    borderRadius: 8,
    objectFit: 'contain',
  },
  victoryText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
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

// Helper to strip HTML tags and clean content
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<ul[^>]*>/gi, '')
    .replace(/<\/ul>/gi, '')
    .replace(/<strong>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<em>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

// Check if URL is valid for images
function isValidImageUrl(url?: string): boolean {
  if (!url) return false;
  if (url.includes('placehold.co')) return false;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  return false;
}

// Get background color based on page type and index
function getBackgroundColor(pageType: string, index: number): string {
  const typeColors: Record<string, string> = {
    'intro': '#e8f5e9',
    'habitat': '#e3f2fd',
    'size': '#fff8e1',
    'weapons': '#fce4ec',
    'defense': '#e3f2fd',
    'secrets': '#ede7f6',
    'battle': '#fce4ec',
    'stats': '#fff8e1',
  };
  
  if (typeColors[pageType]) return typeColors[pageType];
  
  const bgColors = ['#e8f5e9', '#fff8e1', '#e3f2fd', '#fce4ec', '#ede7f6'];
  return bgColors[index % bgColors.length];
}

// Create PDF Document
function BookDocument({ animalA, animalB, pages, winner }: PDFOptions) {
  const pageElements: React.ReactElement[] = [];
  
  // Find cover page if exists
  const coverPage = pages.find(p => p.type === 'cover');
  const hasCoverImage = isValidImageUrl(coverPage?.imageUrl);
  
  // Cover page
  pageElements.push(
    React.createElement(
      Page,
      { key: 'cover', size: 'LETTER', style: styles.coverPage },
      React.createElement(Text, { style: { fontSize: 16, color: '#fff', marginBottom: 10 } }, 'WHO WOULD WIN?'),
      hasCoverImage && React.createElement(Image, { style: styles.coverImage, src: coverPage!.imageUrl }),
      React.createElement(Text, { style: styles.coverTitle }, animalA),
      React.createElement(Text, { style: styles.coverVs }, 'VS'),
      React.createElement(Text, { style: styles.coverTitle }, animalB),
      !hasCoverImage && React.createElement(Text, { style: styles.coverSubtitle }, 'THE ULTIMATE BATTLE!')
    )
  );
  
  // Content pages (skip cover page type)
  const contentPages = pages.filter(p => p.type !== 'cover');
  
  contentPages.forEach((page, index) => {
    const hasImage = isValidImageUrl(page.imageUrl);
    const plainContent = stripHtml(page.content);
    const isVictory = page.type === 'victory' || page.title?.toLowerCase().includes('victory') || page.title?.toLowerCase().includes('winner');
    const isStats = page.type === 'stats';
    
    if (isVictory) {
      // Victory page with special styling
      pageElements.push(
        React.createElement(
          Page,
          { key: page.id || `page-${index}`, size: 'LETTER', style: styles.victoryPage },
          React.createElement(Text, { style: styles.victoryTitle }, '🏆 WINNER! 🏆'),
          React.createElement(Text, { style: styles.winnerName }, winner || 'THE CHAMPION'),
          hasImage && React.createElement(Image, { style: styles.victoryImage, src: page.imageUrl }),
          React.createElement(Text, { style: styles.victoryText }, plainContent),
          React.createElement(Text, { style: styles.footer }, `Page ${index + 2}`)
        )
      );
    } else {
      // Regular content page
      const bgColor = getBackgroundColor(page.type, index);
      
      pageElements.push(
        React.createElement(
          Page,
          { key: page.id || `page-${index}`, size: 'LETTER', style: { ...styles.page, backgroundColor: bgColor } },
          // Title
          page.title && React.createElement(Text, { style: styles.pageTitle }, page.title),
          
          // Image
          hasImage && React.createElement(Image, { style: styles.pageImage, src: page.imageUrl }),
          
          // Content
          React.createElement(Text, { style: styles.content }, plainContent),
          
          // Page number
          React.createElement(Text, { style: styles.footer }, `Page ${index + 2}`)
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
  console.log(`PDF Generator: Creating PDF for ${options.animalA} vs ${options.animalB}`);
  console.log(`PDF Generator: ${options.pages.length} pages, winner: ${options.winner}`);
  console.log(`PDF Generator: Pages with images: ${options.pages.filter(p => isValidImageUrl(p.imageUrl)).length}`);
  
  const buffer = await renderToBuffer(BookDocument(options));
  return Buffer.from(buffer);
}
