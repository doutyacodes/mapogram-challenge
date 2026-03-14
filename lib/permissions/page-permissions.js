import { db } from '@/utils';
import { PAGE_ADMINS } from '@/utils/schema/schema';
import { eq, and } from 'drizzle-orm';

export async function isUserPageAdmin(userId, pageId) {
  const [adminRow] = await db
    .select()
    .from(PAGE_ADMINS)
    .where(and(
      eq(PAGE_ADMINS.user_id, userId),
      eq(PAGE_ADMINS.page_id, pageId)
    ))
    .limit(1);

  return !!adminRow; // true if admin exists
}

export async function isUserPageOwner(userId, pageId) {
  const [adminRow] = await db
    .select()
    .from(PAGE_ADMINS)
    .where(and(
      eq(PAGE_ADMINS.user_id, userId),
      eq(PAGE_ADMINS.page_id, pageId),
      eq(PAGE_ADMINS.is_owner, true)
    ))
    .limit(1);

  return !!adminRow;
}

// 🧪 In API Route Example
// const isAdmin = await isUserPageAdmin(userId, pageId);
// 🧠 In Client-Side Code

// const [isPageAdmin, setIsPageAdmin] = useState(false);

// useEffect(() => {
//   const check = async () => {
//     const res = await fetch(`/api/page/is-admin?pageId=${pageId}`);
//     const data = await res.json();
//     setIsPageAdmin(data.isAdmin);
//   };
//   check();
// }, [pageId]);