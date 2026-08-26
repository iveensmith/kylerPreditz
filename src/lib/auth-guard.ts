import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { UserRole } from "@/generated/prisma/enums";
import { authOptions } from "./auth";

/** Redirects to /login unless the current session belongs to an ADMIN user. Call from admin layouts/pages. */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/login");
  }
  return session;
}
