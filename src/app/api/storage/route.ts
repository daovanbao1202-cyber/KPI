import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data.json');
const BACKUP_DIR = 'D:/KPI/KPI App';
const BACKUP_FILE = path.join(BACKUP_DIR, 'data.json');

export async function GET() {
  try {
    // Try local first
    if (await fs.access(DATA_FILE).then(() => true).catch(() => false)) {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }
    // Fallback to Drive D
    const data = await fs.readFile(BACKUP_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'No data found' }, { status: 404 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dataString = JSON.stringify(body, null, 2);
    
    // 1. Save to local project directory
    await fs.writeFile(DATA_FILE, dataString, 'utf-8');
    
    // 2. Save to Drive D (Backup)
    try {
      await fs.writeFile(BACKUP_FILE, dataString, 'utf-8');
    } catch (e) {
      console.warn('Failed to save backup to Drive D. Ensure drive is connected.');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
