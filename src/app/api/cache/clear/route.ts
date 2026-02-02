import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  // Simple auth check - require a secret
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.CACHE_CLEAR_SECRET || 'fightingbooks-clear-2026';
  
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cacheDir = path.join(process.cwd(), 'public', 'cache');
    
    if (!fs.existsSync(cacheDir)) {
      return NextResponse.json({ message: 'Cache directory does not exist', cleared: 0 });
    }

    const files = fs.readdirSync(cacheDir);
    let cleared = 0;
    
    for (const file of files) {
      // Only clear JSON and PDF files, keep stats-cache.json for now
      if ((file.endsWith('.json') && file !== 'stats-cache.json') || file.endsWith('.pdf')) {
        fs.unlinkSync(path.join(cacheDir, file));
        cleared++;
      }
    }

    return NextResponse.json({ 
      message: `Cache cleared successfully`, 
      cleared,
      remaining: fs.readdirSync(cacheDir).length
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({ 
      error: 'Failed to clear cache',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cacheDir = path.join(process.cwd(), 'public', 'cache');
    
    if (!fs.existsSync(cacheDir)) {
      return NextResponse.json({ files: [], count: 0 });
    }

    const files = fs.readdirSync(cacheDir);
    const fileInfo = files.map(file => {
      const stats = fs.statSync(path.join(cacheDir, file));
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime
      };
    });

    return NextResponse.json({ 
      files: fileInfo,
      count: files.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list cache' }, { status: 500 });
  }
}
