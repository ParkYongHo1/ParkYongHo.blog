// lib/github/commit/commitFilesToGitHub.ts
import { AxiosInstance } from "axios";

export interface FileToCommit {
  path: string;
  content: string;
}

export async function commitFilesToGitHub(
  githubApi: AxiosInstance,
  owner: string,
  repo: string,
  files: FileToCommit[],
  commitMessage: string
): Promise<void> {
  const { data: refData } = await githubApi.get(
    `/repos/${owner}/${repo}/git/ref/heads/main`
  );
  const latestCommitSha = refData.object.sha;

  const { data: commitData } = await githubApi.get(
    `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`
  );
  const baseTreeSha = commitData.tree.sha;

  const tree = await Promise.all(
    files.map(async (file) => {
      let blobContent;
      let encoding: "utf-8" | "base64";

      const isTextFile =
        file.path.endsWith(".mdx") ||
        file.path.endsWith(".json") ||
        file.path.endsWith(".md") ||
        file.path.endsWith(".txt");

      if (isTextFile) {
        blobContent = file.content;
        encoding = "utf-8";
      } else {
        blobContent = file.content;
        encoding = "base64";
      }

      const { data: blob } = await githubApi.post(
        `/repos/${owner}/${repo}/git/blobs`,
        {
          content: blobContent,
          encoding: encoding,
        }
      );

      return {
        path: file.path,
        mode: "100644" as const,
        type: "blob" as const,
        sha: blob.sha,
      };
    })
  );

  const { data: newTree } = await githubApi.post(
    `/repos/${owner}/${repo}/git/trees`,
    { base_tree: baseTreeSha, tree }
  );

  const { data: newCommit } = await githubApi.post(
    `/repos/${owner}/${repo}/git/commits`,
    {
      message: commitMessage,
      tree: newTree.sha,
      parents: [latestCommitSha],
    }
  );

  await githubApi.patch(`/repos/${owner}/${repo}/git/refs/heads/main`, {
    sha: newCommit.sha,
  });
}
