import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/utils';
import { USER_COMPANIES, USER_ENTITIES } from '@/utils/schema/community_schema';
import { eq, innerJoin } from 'drizzle-orm';

export async function GET(req) {
  try {
    const token = req.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get user companies
    const companies = await db
      .select()
      .from(USER_COMPANIES)
      .where(eq(USER_COMPANIES.user_id, userId))
      .execute();

    return NextResponse.json({
      companies
    });

  } catch (error) {
    console.error('Error fetching user companies:', error);
    return NextResponse.json(
      { message: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { companies } = await req.json();

    if (!Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { message: 'At least one company must be provided.' },
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

    // Validate each company entry
    for (const [index, company] of companies.entries()) {
      if (!company.name?.trim()) {
        return NextResponse.json(
          { message: `Company name is required for company #${index + 1}.` },
          { status: 400 }
        );
      }

      if (!company.description?.trim()) {
        return NextResponse.json(
          { message: `Description is required for company #${index + 1}.` },
          { status: 400 }
        );
      }

      if (company.website_url && company.website_url.trim() !== '') {
        try {
          new URL(company.website_url);
        } catch (_) {
          return NextResponse.json(
            { message: `Please provide a valid URL for company #${index + 1}.` },
            { status: 400 }
          );
        }
      }
    }

    // Insert all companies in a transaction
    await db.transaction(async (tx) => {
      for (const company of companies) {
        // Insert into USER_COMPANIES
        const [inserted] = await tx.insert(USER_COMPANIES).values({
          user_id: userId,
          name: company.name,
          description: company.description,
          logo_url: company.logo_url || null,
          website_url: company.website_url || null,
        }).execute();

        const companyId = inserted.insertId; // Use the inserted company ID

        // Insert into USER_ENTITIES
        await tx.insert(USER_ENTITIES).values({
          user_id: userId,
          type: 'company',
          reference_id: companyId,
        }).execute();
      }
    });


    return NextResponse.json(
      { message: 'Company information saved successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving company information:', error);
    return NextResponse.json(
      { message: 'Failed to save company information' },
      { status: 500 }
    );
  }
}
