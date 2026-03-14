// app\api\communities\post\create\route.js
import { NextResponse } from 'next/server';
import { db } from '@/utils';
import {
  COMMUNITY_POSTS,
  COMMUNITY_JOB_DETAILS,
  COMMUNITY_EVENT_DETAILS,
  COMMUNITY_PRODUCT_LAUNCH_DETAILS,
  COMMUNITY_JOB_EXPERIENCE,
  COMMUNITY_JOB_SKILLS_MAP,
  COMMUNITY_JOB_EDUCATION_MAP,
  USER_COMPLAINT_DETAILS, COMPLAINT_DEPARTMENTS 
} from '@/utils/schema/community_schema';
import { jwtVerify } from 'jose';

export async function POST(request) {
  try {
    // 🔐 Auth: get token from cookies
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const decoded = await jwtVerify(token, secret);
    const payload = decoded.payload;
    const userId = payload.id;

    // 📦 Read body
    const body = await request.json();
    const {
      communityId,
      title,
      description,
      imageUrl,
      imageFileName,
      latitude,
      longitude,
      categoryId,
      deleteAfterHours,
      postedByEntityId,
      postType,
      jobData,
      eventData,
      productLaunchData,
      categoryName
    } = body;

    // 📝 Create community post
    const [post] = await db.insert(COMMUNITY_POSTS).values({
      title,
      description,
      image_url: imageFileName || null,
      latitude: latitude ? String(latitude) : null,
      longitude: longitude ? String(longitude) : null,
      category_id: categoryId,
      community_id: communityId,
      created_by: userId,
      posted_by_entity_id: postedByEntityId,
      delete_after_hours: deleteAfterHours,
      is_permanent: false,
    });

    const postId = post.insertId;

    // District community specific handling
      if (postType === 'city') {
        // For complaint types (all except Official Notice)
        if (categoryName !== 'Official Notice / Public Announcement') {
          const [complaintDetail] = await db.insert(USER_COMPLAINT_DETAILS).values({
            post_id: postId,
            location_description: body.complaintData?.locationDescription || null,
            severity: body.complaintData?.severity || 'low',
            status: 'submitted',
          });

          const complaintId = complaintDetail.insertId;

          // Insert selected departments
          if (body.complaintData?.selectedDepartments && body.complaintData.selectedDepartments.length > 0) {
            const departmentMappings = body.complaintData.selectedDepartments.map(deptId => ({
              complaint_id: complaintId,
              department_id: deptId,
            }));
            await db.insert(COMPLAINT_DEPARTMENTS).values(departmentMappings);
          }
        }
      }

    // 📂 Post type-specific insertions
    if (postType === 'job' && jobData && jobData.jobType !== 'Collaboration') {

    let formattedSalary = jobData.salaryOrStipend;
      if (jobData.jobType === 'Jobs') {
        formattedSalary = `${jobData.salaryOrStipend} LPA`;
      } else if (jobData.jobType === 'Internship' || jobData.jobType === 'Gigs') {
        formattedSalary = `${jobData.salaryOrStipend}/month`;
      }

      const [newJobDetail] =await db.insert(COMMUNITY_JOB_DETAILS).values({
        post_id: postId,
        job_type: jobData.jobType,
        link: jobData.link,
        is_paid: jobData.isPaid,
        salary_or_stipend: formattedSalary,
        location_type: jobData.locationType,
        duration: jobData.duration,
        min_experience: jobData.minExperience,
        max_experience: jobData.maxExperience,
        application_deadline: jobData.applicationDeadline,
        additional_info: jobData.additionalInfo || null,
      });

      const jobId = newJobDetail.insertId;
      
      if (jobData.minExperience !== undefined && jobData.maxExperience !== undefined) {
        await db.insert(COMMUNITY_JOB_EXPERIENCE).values({
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
        await db.insert(COMMUNITY_JOB_SKILLS_MAP).values(skillMappings);
      }

      if (jobData.selectedEducation && jobData.selectedEducation.length > 0) {
        const educationMappings = jobData.selectedEducation.map(educationId => ({
          job_id: jobId,
          education_id: educationId,
        }));
        await db.insert(COMMUNITY_JOB_EDUCATION_MAP).values(educationMappings);
      }

    } else if (postType === 'event' && eventData) {
      await db.insert(COMMUNITY_EVENT_DETAILS).values({
        post_id: postId,
        event_type: eventData.event_type,
        event_name: eventData.event_name,
        event_date: eventData.event_date,
        link: eventData.link || null,
        additional_info: eventData.additional_info || null,
      });

    } else if (postType === 'announcement' && productLaunchData && productLaunchData.product_name) {
      await db.insert(COMMUNITY_PRODUCT_LAUNCH_DETAILS).values({
        post_id: postId,
        product_name: productLaunchData.product_name,
        launch_date: productLaunchData.launch_date,
        link: productLaunchData.link || null,
        additional_info: productLaunchData.additional_info || null,
      });
    }

    // ✅ Return success
    return NextResponse.json({ success: true, postId }, { status: 200 });

  } catch (error) {
    console.error('Error creating community post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
