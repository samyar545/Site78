import { getCurrentSession } from "./session";

export class UnauthenticatedError extends Error {
  status = 401;
}

/** برای Routeهایی که فقط نیاز به کاربر لاگین‌شده دارند (بدون Permission خاص) */
export async function requireUser() {
  const session = await getCurrentSession();
  if (!session) throw new UnauthenticatedError("لطفاً ابتدا وارد حساب کاربری خود شوید");
  return session.user;
}
