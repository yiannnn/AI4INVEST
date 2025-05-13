import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'data.json');

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    const username = formData.username;

    if (!username || !formData.profile) {
      return NextResponse.json({ message: 'Missing username or profile' }, { status: 400 });
    }

    const dataDir = path.dirname(dataFilePath);
    await mkdir(dataDir, { recursive: true });

    let users: any[] = [];
    try {
      const content = await readFile(dataFilePath, 'utf-8');
      users = JSON.parse(content);
    } catch {
      users = [];
    }

    const index = users.findIndex((u) => u.username === username);

    if (index === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // ✅ 僅更新現有使用者
    users[index] = {
      ...users[index],
      ...formData,
      profile: {
        ...users[index].profile,
        ...formData.profile,
      },
      updatedAt: new Date().toISOString(),
    };

    await writeFile(dataFilePath, JSON.stringify(users, null, 2), 'utf-8');

    return NextResponse.json({ message: 'User updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ message: 'Failed to update form' }, { status: 500 });
  }
}
