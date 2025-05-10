import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'data.json');

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    const dataDir = path.dirname(dataFilePath);
    await mkdir(dataDir, { recursive: true });

    let existing: any[] = [];
    try {
      const oldContent = await readFile(dataFilePath, 'utf-8');
      existing = JSON.parse(oldContent);
    } catch (e) {
      existing = [];
    }

    existing.push({
      ...formData,
      submittedAt: new Date().toISOString(),
    });

    await writeFile(dataFilePath, JSON.stringify(existing, null, 2), 'utf-8');

    return NextResponse.json({ message: 'Form saved to data.json' }, { status: 200 });
  } catch (error) {
    console.error('❌ Error saving form:', error);
    return NextResponse.json({ message: 'Failed to save form' }, { status: 500 });
  }
}
