// lib/github/config/createGitHubClient.ts
import axios, { AxiosInstance } from "axios";

export function createGitHubClient(token: string): AxiosInstance {
  return axios.create({
    baseURL: "https://api.github.com",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });
}