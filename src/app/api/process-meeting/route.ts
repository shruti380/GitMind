import { processMeeting } from "~/lib/assembly";
import { db } from "~/server/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodyParser = z.object({
  meetingUrl: z.string(),
  projectId: z.string(),
  meetingId: z.string(),
});

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("Parsed body:", body);

    const { meetingUrl, projectId, meetingId } = bodyParser.parse(body);
    console.log("Body parsed successfully");
    console.log("Meeting URL:", meetingUrl);
    console.log("Project ID:", projectId);
    console.log("Meeting ID:", meetingId);

    console.log("Starting processMeeting...");
    const { summaries } = await processMeeting(meetingUrl);
    console.log(
      "Process meeting successful. Summaries count:",
      summaries.length,
    );

    if (!summaries || summaries.length === 0) {
      console.error("No summaries returned from processMeeting");
      return NextResponse.json(
        { error: "No summaries generated" },
        { status: 400 },
      );
    }

    console.log("Creating issues in database...");
    await db.issue.createMany({
      data: summaries.map((summary) => ({
        start: summary.start,
        end: summary.end,
        gist: summary.gist,
        headline: summary.headline,
        summary: summary.summary,
        meetingId,
      })),
    });
    console.log("Issues created successfully");

    console.log("Updating meeting status...");
    await db.meeting.update({
      where: { id: meetingId },
      data: {
        status: "COMPLETED",
        name: summaries[0]!.headline,
      },
    });
    console.log("Meeting updated successfully");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in process-meeting API:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
