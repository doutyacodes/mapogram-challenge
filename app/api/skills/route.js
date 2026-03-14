import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { SKILLS } from '@/utils/schema/schema';

export async function GET() {
  try {
    const skills = await db.select().from(SKILLS);
    
    return NextResponse.json({
      skills: skills,
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { message: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}