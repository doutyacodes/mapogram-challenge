import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { communityId, requirementType } = await req.json();

    if (!communityId || !requirementType) {
      return NextResponse.json(
        { message: 'Community ID and requirement type are required' },
        { status: 400 }
      );
    }

    // Get token from cookies
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Here you can add any additional logic if needed
    // For now, we'll just return success since the requirement completion
    // is determined by the existence of the related data (e.g., user_company record)
    
    return NextResponse.json({
      message: 'Requirement marked as completed',
      userId,
      communityId,
      requirementType
    });

  } catch (error) {
    console.error('Error completing requirement:', error);
    return NextResponse.json(
      { message: 'Failed to complete requirement' },
      { status: 500 }
    );
  }
}