import { NextRequest, NextResponse } from 'next/server';
import { generateUserInfo } from '@/lib/userGenerator';
import { createGmailAccount } from '@/lib/gmailCreator';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        const userInfo = generateUserInfo();
        
        const account = await createGmailAccount(userInfo, (status) => {
          send({ type: 'status', message: status });
        });
        
        send({ type: 'result', account });
        controller.close();
      } catch (error: any) {
        send({ type: 'error', message: error.message || 'Failed to create account' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
