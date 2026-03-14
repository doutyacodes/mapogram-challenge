import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/jwtMiddleware';
import { QUIZ_SEQUENCES, USER_DETAILS } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';
import { db } from '@/utils';
import axios from 'axios';

const languageOptions = {
  en: 'in English',
  hi: 'in Hindi',
  mar: 'in Marathi',
  ur: 'in Urdu',
  sp: 'in Spanish',
  ben: 'in Bengali',
  assa: 'in Assamese',
  ge: 'in German',
  mal:'in malayalam',
  tam:'in Tamil'
};
export const maxDuration = 40; // This function can run for a maximum of 5 seconds
export const dynamic = 'force-dynamic';

export async function GET(req) {
  console.log('got')
  const authResult = await authenticate(req);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const userData = authResult.decoded_Data;
  const userId = userData.userId;

  const language = req.headers.get('accept-language') || 'en';
  console.log('Language:', language);

  const country_db = await db.select({
    country: USER_DETAILS.country
  })
    .from(USER_DETAILS)
    .where(
      eq(USER_DETAILS.id, userId)
    )
    .execute();
  console.log(country_db)

  let country;
  if (!country_db[0].country) {
    country = 'your country';
  } else {
    country = country_db[0].country
  }

  const personalityTypes = await db.select({
    typeSequence: QUIZ_SEQUENCES.type_sequence,
    quizId: QUIZ_SEQUENCES.quiz_id
  }).from(QUIZ_SEQUENCES)
    .where(eq(QUIZ_SEQUENCES.user_id, userId))
    .execute();

  const type1 = personalityTypes.find(pt => pt.quizId === 1)?.typeSequence;
  const type2 = personalityTypes.find(pt => pt.quizId === 2)?.typeSequence;
  const type3 = null

  // const prompt = `Provide a list of the 5 best indsutries ${
  //   country ? "in " + country : ""
  // } for an individual with an ${type1} personality type and RIASEC interest types of ${type2}. For each industry, include the following information:
  //     industry_name: A brief title of the industry?.

  //     Ensure that the response is valid JSON, using the specified field names, but do not include the terms '${type1}' or 'RIASEC' in the data.Give it as a single JSON data without any wrapping other than []`


  const prompt = `Provide a list of the 3 normal, 3 trending, and 3 off-beat sectors ${country ? "in " + country : ""
    } for an individual with RIASEC interest types of ${type2}${type3 ? " and Gallup Strengths types of " + type3 : ""
    }. For each industry, include the following information:
            industry_name: A brief title of the industry?.
            
            Ensure that the response is valid JSON, using the specified field names, but do not include the terms 'RIASEC' in the data.
            Provide the response ${languageOptions[language] || 'in English'} keeping the keys in english only. Give it as a single JSON data without any wrapping other than []`;


  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini", // or 'gpt-4' if you have access
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500, // Adjust the token limit as needed
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  let responseText = response.data.choices[0].message.content.trim();
  responseText = responseText.replace(/```json|```/g, "").trim();
  // const response = await chatModel.invoke(prompt)
  console.log(responseText)
  return NextResponse.json({ result: responseText });
}