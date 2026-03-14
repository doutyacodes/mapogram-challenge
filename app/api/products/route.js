import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { PRODUCTS } from '@/utils/schema/complaints_schema';
import { eq } from 'drizzle-orm';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    
    let query = db.select().from(PRODUCTS);
    
    if (brandId) {
      query = query.where(eq(PRODUCTS.brand_id, parseInt(brandId)));
    }
    
    const products = await query.orderBy(PRODUCTS.name);
    
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 });
  }
}