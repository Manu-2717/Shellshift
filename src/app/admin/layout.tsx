import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/AdminShell";
export default async function Layout({ children }: { children: React.ReactNode }) { const session=await getSession(); if(!session) redirect("/api/auth/login?redirect=/admin"); if(session.role!=="ADMIN") redirect("/"); return <AdminShell>{children}</AdminShell>; }
