import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isMockAdminAllowed } from "@/lib/auth/oidc";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    const loginUrl = isMockAdminAllowed()
      ? "/api/auth/login?mock=true&role=admin&redirect=/admin"
      : "/api/auth/login?redirect=/admin";
    redirect(loginUrl);
  }
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  return <AdminShell>{children}</AdminShell>;
}

