import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "~/server/db";
import { Octokit } from "octokit";

// Helper function to parse GitHub URL
const parseGithubUrl = (url: string): { owner: string; repo: string } => {
  // Remove trailing slash and .git if present
  const cleanUrl = url.replace(/\/$/, "").replace(/\.git$/, "");

  // Handle different URL formats
  let owner: string;
  let repo: string;

  if (cleanUrl.includes("github.com")) {
    // Extract owner and repo from URL
    const parts = cleanUrl.split("/");
    const githubIndex = parts.findIndex((part) => part.includes("github.com"));
    owner = parts[githubIndex + 1] || "";
    repo = parts[githubIndex + 2] || "";
  } else {
    // Assume format is "owner/repo"
    const parts = cleanUrl.split("/");
    owner = parts[0] || "";
    repo = parts[1] || "";
  }

  // Double check - remove .git suffix if still present
  repo = repo.replace(/\.git$/, "");

  return { owner, repo };
};

// Get the default branch of a repository
const getDefaultBranch = async (
  githubUrl: string,
  githubToken?: string,
): Promise<string> => {
  const octokit = new Octokit({
    auth: githubToken || process.env.GITHUB_TOKEN,
  });

  const { owner, repo } = parseGithubUrl(githubUrl);

  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    console.log(
      `Repository found: ${owner}/${repo}, default branch: ${data.default_branch}`,
    );
    return data.default_branch;
  } catch (error: any) {
    console.error("Error fetching default branch:", error.message);
    throw new Error(
      `Cannot access repository ${owner}/${repo}: ${error.message}`,
    );
  }
};

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  // Validate and parse URL first
  const { owner, repo } = parseGithubUrl(githubUrl);

  if (!owner || !repo) {
    throw new Error(`Invalid GitHub URL: ${githubUrl}`);
  }

  // Get the default branch first
  const branch = await getDefaultBranch(githubUrl, githubToken);

  console.log(`Loading repository: ${owner}/${repo} from branch: ${branch}`);
  console.log(`Using URL: ${githubUrl}`);
  console.log(
    `Token provided: ${githubToken ? "Yes (custom)" : process.env.GITHUB_TOKEN ? "Yes (env)" : "No"}`,
  );

  // Ensure the URL format is correct for GithubRepoLoader
  // It expects: https://github.com/owner/repo (without .git)
  const normalizedUrl = `https://github.com/${owner}/${repo}`;

  console.log(`Normalized URL for loader: ${normalizedUrl}`);

  const loader = new GithubRepoLoader(normalizedUrl, {
    accessToken: githubToken || process.env.GITHUB_TOKEN || "",
    branch,
    ignoreFiles: [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lockb",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });

  try {
    console.log("Starting to load documents...");
    const docs = await loader.load();
    console.log(`✓ Successfully loaded ${docs.length} files`);
    return docs;
  } catch (error: any) {
    console.error("Error loading repository:", error);

    // Provide more specific error messages
    if (error.message.includes("404")) {
      throw new Error(
        `Repository not found or not accessible: ${owner}/${repo}. ` +
          `Please check:\n` +
          `1. The repository URL is correct\n` +
          `2. The repository is public OR you've provided a valid GitHub token\n` +
          `3. If private, your token has 'repo' scope permissions`,
      );
    }

    throw new Error(
      `Failed to load repository ${owner}/${repo}. Error: ${error.message}`,
    );
  }
};

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  console.log(`Starting indexing for project ${projectId}`);
  const docs = await loadGithubRepo(githubUrl, githubToken);

  if (docs.length === 0) {
    console.warn("No documents loaded from repository");
    return;
  }

  console.log(`Generating embeddings for ${docs.length} files...`);
  const allEmbeddings = await generateEmbeddings(docs);

  await Promise.allSettled(
    allEmbeddings.map(async (embedding, index) => {
      console.log(`Processing ${index + 1} of ${allEmbeddings.length}`);

      if (!embedding) return;

      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          summary: embedding.summary,
          sourceCode: embedding.sourceCode,
          fileName: embedding.fileName,
          projectId,
        },
      });

      await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding"=${embedding.embedding}::vector
        WHERE "id"=${sourceCodeEmbedding.id}
        `;
    }),
  );

  console.log(`✓ Indexing complete for project ${projectId}`);
};

const generateEmbeddings = async (docs: Document[]) => {
  return await Promise.all(
    docs.map(async (doc) => {
      const summary = await summariseCode(doc);
      const embedding = await generateEmbedding(summary);

      return {
        summary,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName: doc.metadata.source,
      };
    }),
  );
};

//recursive function to calculate number of files in a github repository.
const getFileCount = async (
  path: string,
  octokit: Octokit,
  githubOwner: string,
  githubRepo: string,
  acc: number = 0,
) => {
  try {
    // get the contents of the path
    const { data } = await octokit.rest.repos.getContent({
      owner: githubOwner,
      repo: githubRepo,
      path,
    });

    // if data is not array, then it is just one file
    if (!Array.isArray(data) && data.type === "file") {
      return acc + 1;
    }

    // if data is array, means there are subfolders
    if (Array.isArray(data)) {
      let fileCount = 0;
      const directories: string[] = [];

      for (const item of data) {
        // if item is a directory, add it to the list of directories. else, fileCount++
        if (item.type === "dir") {
          directories.push(item.path);
        } else {
          fileCount++;
        }
      }

      // Now if number of directories is more than 0, then do a recursive call to  getFileCount to each directory
      if (directories.length > 0) {
        const directoryCounts = await Promise.all(
          directories.map((dirPath) =>
            getFileCount(dirPath, octokit, githubOwner, githubRepo, 0),
          ),
        );

        fileCount += directoryCounts.reduce((acc, count) => acc + count, 0);
      }

      return acc + fileCount;
    }

    return acc;
  } catch (error: any) {
    console.error(
      `Error fetching file count for ${githubOwner}/${githubRepo}:`,
      error.message,
    );
    throw new Error(
      `Failed to access repository: ${error.message}. Make sure the repository exists and is accessible.`,
    );
  }
};

export const checkCredits = async (githubUrl: string, githubToken?: string) => {
  console.log(`Checking credits for: ${githubUrl}`);

  // find out how many files are in the repo
  const octokit = new Octokit({
    auth: githubToken || process.env.GITHUB_TOKEN,
  });

  const { owner: githubOwner, repo: githubRepo } = parseGithubUrl(githubUrl);

  if (!githubOwner || !githubRepo) {
    throw new Error(
      "Invalid GitHub URL format. Expected format: https://github.com/owner/repo",
    );
  }

  console.log(`Parsed as: ${githubOwner}/${githubRepo}`);

  // Verify the repository exists first
  try {
    const { data } = await octokit.rest.repos.get({
      owner: githubOwner,
      repo: githubRepo,
    });
    console.log(
      `✓ Repository found: ${data.full_name}, visibility: ${data.visibility}`,
    );
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(
        `Repository not found: ${githubOwner}/${githubRepo}. ` +
          `Please verify:\n` +
          `1. The repository URL is correct\n` +
          `2. The repository exists\n` +
          `3. If private, you need to provide a GitHub token with 'repo' access`,
      );
    }
    throw new Error(`Failed to access repository: ${error.message}`);
  }

  const fileCount = await getFileCount("", octokit, githubOwner, githubRepo, 0);
  console.log(`✓ File count: ${fileCount}`);
  return fileCount;
};
