import { db } from "@/utils";
import { 
  CHALLENGES, 
  CHALLENGE_MEDIA, 
  DISTRICTS,
  TASKS,
  TASK_MEDIA,
  QUESTIONS,
  ANSWERS,
  TASK_MAP,
  TASK_PEDOMETER,
  STORES,
  CHALLENGE_STORES,
  PAGES,
  REWARDS
} from "@/utils/schema/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const districtId = searchParams.get('district_id');
    const pageId = searchParams.get('page_id');
    const challengeId = searchParams.get('challenge_id');

    // 1. Fetch base challenges
    let query = db.select({
      challenge: CHALLENGES,
      district_name: DISTRICTS.name,
      page_name: PAGES.name
    })
    .from(CHALLENGES)
    .leftJoin(DISTRICTS, eq(CHALLENGES.district_id, DISTRICTS.id))
    .leftJoin(PAGES, eq(CHALLENGES.page_id, PAGES.id))
    .where(eq(CHALLENGES.is_active, true));

    if (districtId) {
      query = db.select({
        challenge: CHALLENGES,
        district_name: DISTRICTS.name,
        page_name: PAGES.name
      })
      .from(CHALLENGES)
      .leftJoin(DISTRICTS, eq(CHALLENGES.district_id, DISTRICTS.id))
      .leftJoin(PAGES, eq(CHALLENGES.page_id, PAGES.id))
      .where(and(eq(CHALLENGES.is_active, true), eq(CHALLENGES.district_id, parseInt(districtId))));
    } else if (pageId) {
      query = db.select({
        challenge: CHALLENGES,
        district_name: DISTRICTS.name,
        page_name: PAGES.name
      })
      .from(CHALLENGES)
      .leftJoin(DISTRICTS, eq(CHALLENGES.district_id, DISTRICTS.id))
      .leftJoin(PAGES, eq(CHALLENGES.page_id, PAGES.id))
      .where(and(eq(CHALLENGES.is_active, true), eq(CHALLENGES.page_id, parseInt(pageId))));
    } else if (challengeId) {
       query = db.select({
        challenge: CHALLENGES,
        district_name: DISTRICTS.name,
        page_name: PAGES.name
      })
      .from(CHALLENGES)
      .leftJoin(DISTRICTS, eq(CHALLENGES.district_id, DISTRICTS.id))
      .leftJoin(PAGES, eq(CHALLENGES.page_id, PAGES.id))
      .where(eq(CHALLENGES.id, parseInt(challengeId)));
    }

    const challengesRows = await query;

    if (!challengesRows || challengesRows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const challengeIds = challengesRows.map(row => row.challenge.id);

    // 2. Fetch all media for these challenges
    const allMedia = await db.select()
      .from(CHALLENGE_MEDIA)
      .where(inArray(CHALLENGE_MEDIA.challenge_id, challengeIds));
      
    // 3. Fetch Stores & Rewards mapped to these challenges
    const allChallengeStores = await db.select({
      challenge_id: CHALLENGE_STORES.challenge_id,
      store: STORES
    })
    .from(CHALLENGE_STORES)
    .innerJoin(STORES, eq(CHALLENGE_STORES.store_id, STORES.id))
    .where(and(inArray(CHALLENGE_STORES.challenge_id, challengeIds), eq(CHALLENGE_STORES.is_active, true)));

    const allRewards = await db.select()
      .from(REWARDS)
      .where(and(inArray(REWARDS.challenge_id, challengeIds), eq(REWARDS.is_active, true)));

    // 4. Fetch all tasks for these challenges
    const allTasks = await db.select()
      .from(TASKS)
      .where(and(inArray(TASKS.challenge_id, challengeIds), eq(TASKS.is_active, true)));

    const taskIds = allTasks.map(t => t.id);

    // 4. Fetch related task nested data if tasks exist
    let allTaskMedia = [];
    let allTaskMap = [];
    let allTaskPedometer = [];
    let allQuestions = [];
    let allAnswers = [];

    if (taskIds.length > 0) {
      allTaskMedia = await db.select().from(TASK_MEDIA).where(inArray(TASK_MEDIA.task_id, taskIds));
      allTaskMap = await db.select().from(TASK_MAP).where(inArray(TASK_MAP.task_id, taskIds));
      allTaskPedometer = await db.select().from(TASK_PEDOMETER).where(inArray(TASK_PEDOMETER.task_id, taskIds));
      
      allQuestions = await db.select().from(QUESTIONS).where(inArray(QUESTIONS.task_id, taskIds));
      const questionIds = allQuestions.map(q => q.id);
      
      if (questionIds.length > 0) {
        allAnswers = await db.select().from(ANSWERS).where(inArray(ANSWERS.question_id, questionIds));
      }
    }

    // 5. Structure the final JSON response
    const enrichedChallenges = challengesRows.map(({ challenge, district_name, page_name }) => {
      
      // Get challenge media
      const media = allMedia.filter(m => m.challenge_id === challenge.id);

      // Get challenge tasks
      const tasks = allTasks.filter(t => t.challenge_id === challenge.id).map(task => {
        const taskMedia = allTaskMedia.filter(tm => tm.task_id === task.id);
        const mapData = allTaskMap.find(tm => tm.task_id === task.id) || null;
        const pedometerData = allTaskPedometer.find(tp => tp.task_id === task.id) || null;
        
        // build quiz if it's a quiz task
        const questions = allQuestions.filter(q => q.task_id === task.id).map(q => {
          const answers = allAnswers.filter(a => a.question_id === q.id);
          return { ...q, answers };
        });

        return {
          ...task,
          media: taskMedia,
          map_data: mapData,
          pedometer_data: pedometerData,
          questions: questions.length > 0 ? questions : null
        };
      });

      // Sort tasks by order_index
      tasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

      // Get mapped stores and rewards
      const stores = allChallengeStores.filter(cs => cs.challenge_id === challenge.id).map(cs => cs.store);
      const rewards = allRewards.filter(r => r.challenge_id === challenge.id);

      // Find the first task that has map_data to use as the Challenge's primary coordinate
      const primaryMapTask = tasks.find(t => t.map_data);
      const latitude = primaryMapTask?.map_data?.latitude || challenge.latitude || null;
      const longitude = primaryMapTask?.map_data?.longitude || challenge.longitude || null;

      return {
        ...challenge,
        latitude,
        longitude,
        district_name,
        page_name,
        media,
        tasks,
        stores,
        rewards
      };
    });

    return NextResponse.json({ success: true, data: enrichedChallenges });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
