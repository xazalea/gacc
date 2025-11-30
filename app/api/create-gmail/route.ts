import { NextRequest, NextResponse } from 'next/server';
import { generateUserInfo } from '@/lib/userGenerator';
import { createGmailAccount } from '@/lib/gmailCreator';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const userInfo = generateUserInfo();
    const account = await createGmailAccount(userInfo);
    return NextResponse.json({ success: true, account }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userInfo = generateUserInfo();
    const account = await createGmailAccount(userInfo);
    return NextResponse.json({ success: true, account }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
