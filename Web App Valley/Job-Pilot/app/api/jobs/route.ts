import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { createInsforgeServer } from "@/lib/insforge-server";
import { MATCH_THRESHOLD } from "@/lib/utils";
import type { Job } from "@/types";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const insforge = await createInsforgeServer();

    const { searchParams } = req.nextUrl;
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
    const matchFilter = searchParams.get("matchFilter") ?? "all";
    const sortOption = searchParams.get("sortOption") ?? "score";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

    let query = insforge.database
      .from("jobs")
      .select("*", { count: "exact" })
      .eq("user_id", user.id);

    if (matchFilter === "high") {
      query = query.gte("match_score", MATCH_THRESHOLD);
    } else if (matchFilter === "low") {
      query = query.lt("match_score", MATCH_THRESHOLD);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,company.ilike.%${search}%`,
      );
    }

    if (sortOption === "score") {
      query = query.order("match_score", { ascending: false, nullsFirst: false });
    } else if (sortOption === "newest") {
      query = query.order("found_at", { ascending: false });
    } else if (sortOption === "oldest") {
      query = query.order("found_at", { ascending: true });
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("[api/jobs]", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch jobs" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobs: (data as Job[] | null) ?? [],
        totalCount: count ?? 0,
        page,
        pageSize: PAGE_SIZE,
      },
    });
  } catch (error) {
    console.error("[api/jobs]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
