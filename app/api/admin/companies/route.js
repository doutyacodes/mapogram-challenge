import { NextResponse } from "next/server";
import { db } from "@/utils";
import { USER_COMPANIES, USER_ENTITIES } from "@/utils/schema/schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req) {
  try {
    // Get token from Authorization header or cookies
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                 req.cookies.get('user_token')?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    const { companies } = await req.json();

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        { message: "Company data is required" },
        { status: 400 }
      );
    }

    // Validate company data
    for (const company of companies) {
      if (!company.name || !company.description) {
        return NextResponse.json(
          { message: "Company name and description are required" },
          { status: 400 }
        );
      }
    }

    // Start transaction to create companies and user entities
    const result = await db.transaction(async (tx) => {
      const createdCompanies = [];

      for (const company of companies) {
        // Create company
        const companyData = {
          user_id: userId,
          name: company.name,
          description: company.description,
          website_url: company.website_url || null,
          logo_url: company.logo_url || null,
        };

        const [insertResult] = await tx
          .insert(USER_COMPANIES)
          .values(companyData)
          .execute();

        // Get the inserted company
        const createdCompany = await tx
          .select()
          .from(USER_COMPANIES)
          .where(eq(USER_COMPANIES.id, insertResult.insertId))
          .limit(1)
          .execute();

        if (createdCompany.length > 0) {
          createdCompanies.push(createdCompany[0]);

          // Create user entity for the company
          await tx.insert(USER_ENTITIES).values({
            user_id: userId,
            type: 'company',
            reference_id: createdCompany[0].id,
          });
        }
      }

      return createdCompanies;
    });

    return NextResponse.json(
      {
        message: "Companies created successfully",
        companies: result,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Error creating companies:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}