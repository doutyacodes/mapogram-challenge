import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({ message: "Logged out" });
  
  // Clear the auth token by setting its expiration in the past
  response.cookies.set('user_token', '', {
    httpOnly: true,
    secure: true,
    path: '/',
    expires: new Date(0)
  });

  return response;
}
