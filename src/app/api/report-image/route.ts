import { NextRequest, NextResponse } from 'next/server';
import { put, head, list } from '@vercel/blob';
import { BlobNotFoundError } from '@vercel/blob';

const REPORTS_BLOB_PATH = 'fightingbooks/admin/image-reports.json';

interface ImageReport {
  id: string;
  animal_a: string;
  animal_b: string;
  page_id: string;
  image_url: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reported_at: string;
  resolved_at?: string;
}

// Load reports from Vercel Blob
async function loadReports(): Promise<ImageReport[]> {
  try {
    const blobInfo = await head(REPORTS_BLOB_PATH);
    const response = await fetch(blobInfo.url);
    return await response.json();
  } catch (error) {
    if (error instanceof BlobNotFoundError) return [];
    console.error('Error loading reports:', error);
    return [];
  }
}

// Save reports to Vercel Blob
async function saveReports(reports: ImageReport[]): Promise<void> {
  await put(REPORTS_BLOB_PATH, JSON.stringify(reports, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}

// POST: Report a specific image
export async function POST(request: NextRequest) {
  try {
    const { animalA, animalB, pageId, imageUrl, reason } = await request.json();

    if (!animalA || !animalB || !pageId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reports = await loadReports();

    // Check for duplicate pending report
    const existing = reports.find(
      r => r.animal_a === animalA.toLowerCase() &&
           r.animal_b === animalB.toLowerCase() &&
           r.page_id === pageId &&
           r.status === 'pending'
    );
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already flagged' });
    }

    const report: ImageReport = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      animal_a: animalA.toLowerCase(),
      animal_b: animalB.toLowerCase(),
      page_id: pageId,
      image_url: imageUrl,
      reason: reason || 'bad_quality',
      status: 'pending',
      reported_at: new Date().toISOString(),
    };

    reports.push(report);
    await saveReports(reports);

    console.log('🚩 IMAGE FLAGGED:', `${animalA} vs ${animalB} - ${pageId}`);
    return NextResponse.json({ success: true, message: 'Image flagged for review' });

  } catch (error) {
    console.error('Image report error:', error);
    return NextResponse.json({ success: true, message: 'Report received' });
  }
}

// GET: List image reports (admin only)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer fightingbooks-admin-2026`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status') || 'pending';
  const reports = await loadReports();
  const filtered = reports.filter(r => r.status === status);

  return NextResponse.json({ reports: filtered });
}

// PATCH: Update report status (admin - mark as resolved/dismissed)
export async function PATCH(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer fightingbooks-admin-2026`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, status } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
  }

  const reports = await loadReports();
  const report = reports.find(r => r.id === id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  report.status = status;
  report.resolved_at = new Date().toISOString();
  await saveReports(reports);

  return NextResponse.json({ success: true });
}
