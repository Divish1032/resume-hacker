import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdf(buffer);

    return NextResponse.json({ text: data.text });
  } catch (error: unknown) {
    console.error('Error extracting text from PDF:', error);
    const errorMessage = (error as Error).message || 'Failed to extract text from PDF';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
