export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export function validateEnvironment(): GitHubConfig | null {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return null;
  }

  return { token, owner, repo };
}
