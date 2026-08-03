import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RemindersContent } from "./RemindersContent";

export default async function RemindersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <RemindersContent />;
}