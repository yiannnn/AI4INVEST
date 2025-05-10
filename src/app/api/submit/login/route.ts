// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const usersFile = path.join(process.cwd(), 'data', 'data.json');

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const content = await readFile(usersFile, 'utf-8');
    const users = JSON.parse(content) as { email: string; password: string; username: string;  risk_bucket:string}[];

    const foundUser = users.find(
      (user) => user.email === email && user.password === password
    );

    if (!foundUser) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Login successful', username: foundUser.username, risk_bucket:foundUser.risk_bucket }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
