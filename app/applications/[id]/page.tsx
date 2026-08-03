import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ApplicationDetail } from "./ApplicationDetail";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  return <ApplicationDetail applicationId={id} />;
}