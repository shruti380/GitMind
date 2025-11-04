"use client";
import useProject from "~/hooks/use-project";
import { ExternalLink, Github } from "lucide-react";
import Link from "next/link";
import CommitLog from "./_components/CommitLog";
import AskQuestionCard from "./_components/AskQuestionCard";
import MeetingCard from "./_components/MeetingCard";
import ArchiveButton from "./_components/ArchiveButton";
const InviteButton = dynamic(() => import("./_components/InviteButton"), {
  ssr: false,
});

import TeamMembers from "./_components/TeamMembers";
import dynamic from "next/dynamic";

type Props = {};

const page = ({}: Props) => {
  const { project } = useProject();
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        {/* GITHUB LINK */}
        <div className="bg-primary w-fit rounded-md px-4 py-3">
          <div className="flex items-center">
            <Github className="size-5 text-white" />
            <div className="ml-2">
              <p className="text-sm font-medium text-white">
                This project is linked to{" "}
                <Link
                  href={project?.githubUrl ?? ""}
                  className="inline-flex items-center text-white/80 hover:underline"
                  target="_blank"
                >
                  {project?.githubUrl}
                  <ExternalLink className="ml-1 size-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="h-4"></div>

        {/* TEAM MEMBERS, INVITE, ARCHIVE */}
        <div className="flex items-center gap-4">
          <TeamMembers />
          <InviteButton />
          <ArchiveButton />
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <AskQuestionCard />
          <MeetingCard />
        </div>
      </div>

      <div className="mt-8"></div>

      <CommitLog />
    </div>
  );
};

export default page;
