"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export function LatestPost() {
  const { data: projects } = api.project.getProjects.useQuery();
  const latestProject = projects?.[0];

  const utils = api.useUtils();
  const [name, setName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  
  const createProject = api.project.createProject.useMutation({
    onSuccess: async () => {
      await utils.project.invalidate();
      setName("");
      setGithubUrl("");
    },
  });

  return (
    <div className="w-full max-w-xs">
      {latestProject ? (
        <p className="truncate">Your most recent project: {latestProject.name}</p>
      ) : (
        <p>You have no projects yet.</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createProject.mutate({ name, githubUrl });
        }}
        className="flex flex-col gap-2"
      >
        <input
          type="text"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <input
          type="text"
          placeholder="GitHub URL"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="w-full rounded-full px-4 py-2 text-black"
        />
        <button
          type="submit"
          className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
          disabled={createProject.isPending}
        >
          {createProject.isPending ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}