import { NextRequest, NextResponse } from "next/server";

import { createInsforgeServer } from "@/lib/insforge-server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const insforge = await createInsforgeServer();

    const { data: profile } = await insforge.database
      .from("profiles")
      .select("resume_pdf_url")
      .eq("id", user.id)
      .maybeSingle<{ resume_pdf_url: string | null }>();

    if (!profile?.resume_pdf_url) {
      return NextResponse.json({ error: "No resume on file" }, { status: 404 });
    }

    const { data: blob, error } = await insforge.storage
      .from("resumes")
      .download(profile.resume_pdf_url);

    if (error || !blob) {
      console.error("[api/resume/download]", error);
      return NextResponse.json(
        { error: "Failed to download resume" },
        { status: 500 },
      );
    }

    const buffer = await blob.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
      },
    });
  } catch (error) {
    console.error("[api/resume/download]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
