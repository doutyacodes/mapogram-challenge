import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { BRANDS } from '@/utils/schema/complaints_schema';

export async function GET(req) {
  try {
    const brands = await db.select().from(BRANDS).orderBy(BRANDS.name);
    
    return NextResponse.json({ brands }, { status: 200 });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ message: 'Failed to fetch brands' }, { status: 500 });
  }
}