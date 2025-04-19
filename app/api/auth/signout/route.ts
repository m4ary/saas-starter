import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  cookies().delete('session');
  
  return NextResponse.json({
    success: true,
    message: 'Signed out successfully'
  });
} 