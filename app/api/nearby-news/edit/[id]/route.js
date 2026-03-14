// /api/hyperlocal/edit/[id]/route.js
import { NextResponse } from 'next/server';
import { HYPERLOCAL_NEWS, CLASSIFIED_ADS, OBITUARIES } from '@/utils/schema/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '@/lib/jwtMiddleware';
import { db } from '@/utils';

export async function GET(req, { params }) {
  // Authenticate user
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  const userData = authResult.decoded_Data;
  const userId = userData.id;

  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { message: "Type parameter is required (news, classified, or obituary)" },
        { status: 400 }
      );
    }

    let content = null;
    let table = null;

    // Query the specific table based on type
    switch (type.toLowerCase()) {
      case 'news':
        table = HYPERLOCAL_NEWS;
        break;
      case 'classified':
        table = CLASSIFIED_ADS;
        break;
      case 'obituary':
        table = OBITUARIES;
        break;
      default:
        return NextResponse.json(
          { message: "Invalid type. Must be 'news', 'classified', or 'obituary'" },
          { status: 400 }
        );
    }

    // Query the specific table
    const result = await db
      .select()
      .from(table)
      .where(eq(table.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { message: `${type} content not found with ID ${id}` },
        { status: 404 }
      );
    }

    content = result[0];

    // Parse images JSON string for classified ads
    if (type === 'classified' && content.images) {
      content.images = JSON.parse(content.images);
    }

    // Check if user owns this content
    if (content.created_by !== userId) {
      return NextResponse.json(
        { message: "Unauthorized to edit this content" },
        { status: 403 }
      );
    }

    // Return content with type
    return NextResponse.json({
      ...content,
      content_type: type
    });

  } catch (error) {
    console.error("Error fetching content for edit:", error);
    return NextResponse.json(
      { message: "Error fetching content", details: error.message },
      { status: 500 }
    );
  }
}