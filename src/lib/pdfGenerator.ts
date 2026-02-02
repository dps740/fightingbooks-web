/**
 * PDF Generator - Converts book pages to PDF format
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

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Comic Neue',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#c62828',
    marginBottom: 10,
    marginTop: 15,
  },
  content: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#333333',
    marginBottom: 10,
  },
  image: {
    maxWidth: '100%',
    maxHeight: 300,
    marginVertical: 15,
    alignSelf: 'center',
    borderRadius: 8,
  },
  choiceBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#d4af37',
  },
  choiceText: {
    fontSize: 12,
    color: '#333',
  },
  factBox: {
    backgroundColor: '#fffde7',
    padding: 12,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
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

// Helper to strip HTML tags and convert to plain text
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<strong>/gi, '')
    .replace(/<\/strong>/gi, '')
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

// Create PDF Document component
function BookDocument({ animalA, animalB, pages, winner }: PDFOptions) {
  return React.createElement(
    Document,
    { title: `${animalA} vs ${animalB} - Who Would Win?`, author: 'FightingBooks' },
    pages.map((page, index) => {
      const hasValidImage = page.imageUrl && !page.imageUrl.includes('placehold.co');
      const plainContent = stripHtml(page.content);
      
      return React.createElement(
        Page,
        { key: page.id || index, size: 'LETTER', style: styles.page },
        // Title
        page.title && React.createElement(Text, { style: styles.title }, page.title),
        
        // Image
        hasValidImage && React.createElement(Image, { style: styles.image, src: page.imageUrl }),
        
        // Content
        React.createElement(Text, { style: styles.content }, plainContent),
        
        // Choices (for CYOA mode)
        page.choices && React.createElement(
          View,
          { style: { marginTop: 20 } },
          React.createElement(Text, { style: styles.subtitle }, 'Choose Your Path:'),
          ...page.choices.map((choice, i) =>
            React.createElement(
              View,
              { key: choice.id || i, style: styles.choiceBox },
              React.createElement(Text, { style: styles.choiceText }, `${choice.emoji} ${choice.text}`)
            )
          )
        ),
        
        // Page number
        React.createElement(
          Text,
          { style: styles.footer },
          `${index + 1} / ${pages.length}`
        )
      );
    })
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
