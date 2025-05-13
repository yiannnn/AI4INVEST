import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'data.json');

export async function POST(request: Request) {
  try {

    const text = await request.text();
    if (!text) {
      console.warn("❌ Empty request body");
      return NextResponse.json({ message: "Empty request body" }, { status: 400 });
    }
    const formData = JSON.parse(text);
    console.log("📨 Received formData:", formData);

    // try {
    //   formData = JSON.parse(text);
    // } catch (err) {
    //   console.error("❌ Invalid JSON format:", err);
    //   return NextResponse.json({ message: "Invalid JSON format" }, { status: 400 });
    // }

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
