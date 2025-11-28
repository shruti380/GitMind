"use client";
import useProject from "~/hooks/use-project";
import { api } from "~/trpc/react";
import React from "react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import MeetingCard from "../dashboard/_components/MeetingCard";

const MeetingsPage = () => {
  const { projectId } = useProject();

  // ✅ SIMPLE FIX: No auto-polling, just manual refetch when needed
  const { data: meetings, refetch } = api.project.getMeetings.useQuery(
    { projectId: projectId! }, // ✅ Non-null assertion (projectId is required in protected route)
    {
      enabled: !!projectId, // ✅ Only run query if projectId exists
      staleTime: 30000, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: false, // Don't refetch when switching tabs
    },
  );

  const deleteMeeting = api.project.deleteMeeting.useMutation();

  return (
    <>
      <MeetingCard />
      <div className="h-6" />
      <h1 className="text-xl font-semibold">Meetings</h1>
      <ul className="divide-y divide-gray-200">
        {meetings?.map((meeting) => (
          <li
            key={meeting.id}
            className="flex items-center justify-between gap-x-6 py-5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  href={`/meetings/${meeting.id}`}
                  className="text-sm font-semibold"
                >
                  {meeting.name}
                </Link>
                {meeting.status === "PROCESSING" && (
                  <Badge className="bg-yellow-500 text-white">
                    Processing...
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-x-2 text-xs text-gray-500">
                <p className="whitespace-nowrap">
                  {meeting.createdAt.toLocaleDateString()}
                </p>
                <p className="truncate">{meeting.issues.length} issues</p>
              </div>
            </div>

            <div className="flex flex-none items-center gap-x-4">
              <Link href={`/meetings/${meeting.id}`}>
                <Button size="sm" variant="outline">
                  View Meeting
                </Button>
              </Link>

              <Button
                size="sm"
                disabled={deleteMeeting.isPending}
                variant="destructive"
                onClick={() =>
                  deleteMeeting.mutate(
                    { meetingId: meeting.id },
                    {
                      onSuccess: () => {
                        toast.success("Meeting deleted successfully");
                        refetch();
                      },
                    },
                  )
                }
              >
                Delete Meeting
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
};

export default MeetingsPage;
