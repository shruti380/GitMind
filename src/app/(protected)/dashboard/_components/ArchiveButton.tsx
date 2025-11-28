"use client";

import { Button } from "~/components/ui/button";
import useProject from "~/hooks/use-project";
import useRefetch from "~/hooks/use-refetch";
import { api } from "~/trpc/react";
import React from "react";
import { toast } from "sonner";

const ArchiveButton = () => {
  const archiveProject = api.project.archiveProject.useMutation();
  const { projectId } = useProject();
  const refetch = useRefetch();
  const [mounted, setMounted] = React.useState(false);

  // ✅ Only render after component mounts to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleArchive = () => {
    if (!projectId) {
      toast.error("No project selected");
      return;
    }

    const confirm = window.confirm(
      "Are you sure you want to archive this project?",
    );

    if (confirm) {
      archiveProject.mutate(
        { projectId },
        {
          onSuccess: () => {
            toast.success("Project archived");
            refetch();
          },
          onError: () => {
            toast.error("Failed to archive project");
          },
        },
      );
    }
  };

  // ✅ Show consistent disabled state before mount (prevents hydration error)
  if (!mounted) {
    return (
      <div>
        <Button disabled size="sm" variant="destructive">
          Archive
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        disabled={archiveProject.isPending || !projectId}
        size="sm"
        variant="destructive"
        onClick={handleArchive}
      >
        Archive
      </Button>
    </div>
  );
};

export default ArchiveButton;
