import { api } from "~/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import React from "react";

const useProject = () => {
  const { data: projects } = api.project.getProjects.useQuery();
  const [projectId, setProjectId] = useLocalStorage("GitMind-projectId", "");

  const project = projects?.find((project) => project.id === projectId);

  return {
    projects,
    project,
    projectId: projectId || undefined, // Convert empty string to undefined
    setProjectId,
  };
};

export default useProject;
