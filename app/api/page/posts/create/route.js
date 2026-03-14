// 4. /api/posts/create/route.js - Create a new post
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import { 
  USER_POSTS, 
  USER_NEWS_DETAILS, 
  USER_JOB_DETAILS,
  POST_LAYER_MAP, 
  JOB_EXPERIENCE,
  JOB_SKILLS_MAP,
  JOB_EDUCATION_MAP,
  USER_EVENT_DETAILS,
  USER_OFFER_DETAILS
} from '@/utils/schema/schema';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export async function POST(request) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const body = await request.json();
    const {
      pageId,
      title,
      description,
      imageUrl,
      imageFileName,
      latitude,
      longitude,
      categoryId,
      deleteAfterHours,
      selectedLayers,
      postType,
      newsData,
      jobData,
      eventData,
      offerData, // Add offerData to the destructuring
    } = body;

    // Validate required fields
    if (!title || !categoryId || !latitude || !longitude) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add this validation after the basic required fields check
    if (postType === 'offers' && (!offerData || !offerData.valid_from || !offerData.valid_until)) {
      return NextResponse.json(
        { message: 'Offer validity dates are required' },
        { status: 400 }
      );
    }

    // Validate that valid_until is after valid_from for offers
    if (postType === 'offers' && offerData) {
      const validFrom = new Date(offerData.valid_from);
      const validUntil = new Date(offerData.valid_until);
      
      if (validUntil <= validFrom) {
        return NextResponse.json(
          { message: 'Valid until date must be after valid from date' },
          { status: 400 }
        );
      }
      
      // Validate that valid_until is not in the past
      const now = new Date();
      if (validUntil < now) {
        return NextResponse.json(
          { message: 'Valid until date cannot be in the past' },
          { status: 400 }
        );
      }
    }

    // Create the main post
    const [newPost] = await db
      .insert(USER_POSTS)
      .values({
        creator_type: 'page',
        creator_id: pageId,
        title,
        description,
        image_url: (postType === 'job' || postType === 'event') ? null : (imageUrl || imageFileName),
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        category_id: categoryId,
        post_type: postType,
        delete_after_hours: deleteAfterHours,
        is_permanent: false,
      })
      .execute();

    const postId = newPost.insertId;

    // Handle post type specific data
    if (postType === 'news' && newsData) {
      // Generate AI summary
      const summary = await generateSummaryWithOpenAI(newsData.articleText);

      await db.insert(USER_NEWS_DETAILS).values({
        post_id: postId,
        article_url: newsData.articleUrl,
        summary: summary,
        language_id: newsData.languageId ? parseInt(newsData.languageId) : null,
        is_high_priority: newsData.isHighPriority,
        is_breaking: false,
      });
    }

    if (postType === 'job' && jobData) {
      // Remove the jobType condition since we no longer have "Others"
      let formattedSalary = jobData.salaryOrStipend;
      if (jobData.jobType === 'Jobs') {
        formattedSalary = `${jobData.salaryOrStipend} LPA`;
      } else if (jobData.jobType === 'Internship' || jobData.jobType === 'Gigs') {
        formattedSalary = `${jobData.salaryOrStipend}/month`;
      }

      // Insert job details - remove event_name and event_date fields
      const [newJobDetail] = await db.insert(USER_JOB_DETAILS).values({
        post_id: postId,
        job_type: jobData.jobType,
        link: jobData.link,
        is_paid: jobData.isPaid,
        salary_or_stipend: formattedSalary,
        location_type: jobData.locationType,
        duration: jobData.duration,
        application_deadline: jobData.applicationDeadline,
        additional_info: jobData.additionalInfo || null,
      });

      // Rest of the job handling remains the same...
      const jobId = newJobDetail.insertId;

      if (jobData.minExperience !== undefined && jobData.maxExperience !== undefined) {
        await db.insert(JOB_EXPERIENCE).values({
          job_id: jobId,
          min_years: jobData.minExperience,
          max_years: jobData.maxExperience,
        });
      }

      if (jobData.selectedSkills && jobData.selectedSkills.length > 0) {
        const skillMappings = jobData.selectedSkills.map(skillId => ({
          job_id: jobId,
          skill_id: skillId,
        }));
        await db.insert(JOB_SKILLS_MAP).values(skillMappings);
      }

      if (jobData.selectedEducation && jobData.selectedEducation.length > 0) {
        const educationMappings = jobData.selectedEducation.map(educationId => ({
          job_id: jobId,
          education_id: educationId,
        }));
        await db.insert(JOB_EDUCATION_MAP).values(educationMappings);
      }
    }

    if (postType === 'event' && eventData) {
      await db.insert(USER_EVENT_DETAILS).values({
        post_id: postId,
        event_type: eventData.event_type,
        event_name: title, // Using title as event name
        event_date: eventData.event_date,
        link: eventData.link || null,
        additional_info: eventData.additional_info || null,
      });
    }

    // Handle offer data
    if (postType === 'offers' && offerData) {
      // Validate required offer fields
      if (!offerData.valid_from || !offerData.valid_until) {
        return NextResponse.json(
          { message: 'Offer validity dates are required' },
          { status: 400 }
        );
      }

      await db.insert(USER_OFFER_DETAILS).values({
        post_id: postId,
        valid_from: offerData.valid_from,
        valid_until: offerData.valid_until,
        coupon_code: offerData.coupon_code || null,
        website_url: offerData.website_url || null,
      });
    }

    // Handle layer mappings
    if (selectedLayers && selectedLayers.length > 0) {
      const layerMappings = selectedLayers.map(layerId => ({
        post_id: postId,
        layer_id: layerId,
      }));

      await db.insert(POST_LAYER_MAP).values(layerMappings);
    }

    return NextResponse.json({
      message: 'Post created successfully',
      postId: postId,
    });

  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: 'Failed to create post' },
      { status: 500 }
    );
  }
}

async function generateSummaryWithOpenAI(articleText) {
  try {
    const prompt = `
      Generate a concise news summary from the following article text. 
      The summary must be exactly between 220-230 characters (including spaces and punctuation).
      Make it engaging and informative, capturing the key points of the news.
      Return only the summary text, nothing else.
      
      Article text: ${articleText}
    `;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Input tokens: ${response.data.usage.prompt_tokens}`);
    console.log(`Output tokens: ${response.data.usage.completion_tokens}`);
    console.log(`Total tokens: ${response.data.usage.total_tokens}`);

    let summary = response.data.choices[0].message.content.trim();
    summary = summary.replace(/```json|```/g, "").trim();
    console.log("Generated summary:", summary);
    
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary");
  }
}