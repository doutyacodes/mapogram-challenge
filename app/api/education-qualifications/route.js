import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { EDUCATION_QUALIFICATIONS } from '@/utils/schema/schema';

export async function GET() {
  try {
    const qualifications = await db.select().from(EDUCATION_QUALIFICATIONS);
    
    return NextResponse.json({
      qualifications: qualifications,
    });
  } catch (error) {
    console.error('Error fetching education qualifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch education qualifications' },
      { status: 500 }
    );
  }
}