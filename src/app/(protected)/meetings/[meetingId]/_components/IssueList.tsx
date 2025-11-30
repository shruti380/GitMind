"use client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api, RouterOutputs } from "~/trpc/react";
import { VideoIcon } from "lucide-react";
import React from "react";

function IssueCard({
  issue,
}: {
  issue: NonNullable<
    RouterOutputs["project"]["getMeetingById"]
  >["issues"][number];
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white">
          <DialogHeader className="space-y-3 pr-6">
            <DialogTitle className="text-xl font-semibold leading-relaxed text-gray-900">
              {issue.gist}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {issue.createdAt.toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="leading-relaxed text-gray-700">{issue.headline}</p>
            <blockquote className="rounded-r border-l-4 border-gray-200 bg-gray-50 p-4">
              <span className="mb-2 block text-sm text-gray-500">
                {issue.start} - {issue.end}
              </span>
              <p className="font-medium italic leading-relaxed text-gray-900">
                {issue.summary}
              </p>
            </blockquote>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="relative flex h-full flex-col transition-shadow hover:shadow-lg">
        <CardHeader className="flex-1 pb-4">
          <div className="space-y-2">
            <CardTitle className="line-clamp-2 break-words text-lg font-semibold leading-tight">
              {issue.gist}
            </CardTitle>
            <div className="text-xs text-gray-500">
              {issue.createdAt.toLocaleDateString()}
            </div>
          </div>
          <div className="my-3 border-b"></div>
          <CardDescription className="line-clamp-4 text-sm leading-relaxed text-gray-600">
            {issue.headline}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto pt-0">
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            size="sm"
            className="w-full"
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

type Props = {
  meetingId: string;
};

const IssueList = ({ meetingId }: Props) => {
  const { data: meeting, isLoading } = api.project.getMeetingById.useQuery(
    { meetingId },
    {
      refetchInterval: 4000,
    },
  );

  if (isLoading || !meeting) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-x-8 border-b pb-6 lg:mx-0 lg:max-w-none">
        <div className="flex items-center gap-x-6">
          <div className="rounded-full border bg-white p-3 shadow-sm">
            <VideoIcon className="h-6 w-6 text-gray-700" />
          </div>
          <div>
            <div className="text-sm leading-6 text-gray-600">
              Meeting on {meeting.createdAt.toLocaleDateString()}
            </div>
            <h1 className="mt-1 text-base font-semibold leading-6 text-gray-900">
              {meeting.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {meeting.issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>
    </div>
  );
};

export default IssueList;
