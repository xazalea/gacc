import { NextRequest, NextResponse } from 'next/server';
import { generateUserInfo } from '@/lib/userGenerator';
import { createGmailAccount } from '@/lib/gmailCreator';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro plan allows 60s, Hobby is 10s

export async function POST(request: NextRequest) {
  try {
    // Generate user info
    const userInfo = generateUserInfo();

    // Create Gmail account
    const account = await createGmailAccount(userInfo);

    // Return account info in JSON format
    return NextResponse.json(
      {
        success: true,
        account: {
          email: account.email,
          password: account.password,
          firstName: account.firstName,
          lastName: account.lastName,
          username: account.username,
          createdAt: account.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in create-gmail API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create Gmail account',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET requests for testing
  try {
    const userInfo = generateUserInfo();
    const account = await createGmailAccount(userInfo);

    return NextResponse.json(
      {
        success: true,
        account: {
          email: account.email,
          password: account.password,
          firstName: account.firstName,
          lastName: account.lastName,
          username: account.username,
          createdAt: account.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in create-gmail API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create Gmail account',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

