import { createApiError } from '../error/apiError';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export function validateEnvironment(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw createApiError("GitHub 설정이 올바르지 않습니다.", 500);
  }

  return { token, owner, repo };
}
