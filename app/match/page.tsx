import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BatchMatchContent } from "./BatchMatchContent";

export default async function MatchPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <BatchMatchContent />;
}