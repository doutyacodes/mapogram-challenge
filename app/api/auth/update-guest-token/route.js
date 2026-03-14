// app/api/auth/update-guest-token/route.js

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';

export async function POST(request) {
  try {
    const { hasFollowedLayer } = await request.json();
    
    const token = request.cookies.get('user_token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;

    // Only allow guests to use this endpoint
    if (!payload.isGuest) {
      return NextResponse.json({ message: 'This endpoint is for guests only' }, { status: 400 });
    }

    // Update the token with new hasFollowedLayer status
    const newTokenPayload = {
      ...payload,
      hasFollowedLayer: hasFollowedLayer
    };

    const newToken = jwt.sign(
      newTokenPayload,
      process.env.JWT_SECRET
      // No expiration for guest tokens
    );

    const response = NextResponse.json({
      message: 'Token updated successfully',
      hasFollowedLayer: hasFollowedLayer
    });

    response.cookies.set("user_token", newToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;

  } catch (error) {
    console.error('Error updating guest token:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}