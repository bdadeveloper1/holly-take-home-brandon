//Route for the chat API


import { NextRequest, NextResponse } from 'next/server';
import { handleChatMessage } from '../../actions';

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const response = await handleChatMessage(message);
  return NextResponse.json({ response });
} 