import { create } from "zustand";

interface GitHubProfile {
  name: string;
  avatarUrl: string;
  login: string;
}

interface GitHubCommit {
  date: string;
  count: number;
}

interface GitHubStore {
  profile: GitHubProfile | null;
  postCommits: GitHubCommit[];
  loading: boolean;
  error: string | null;

  setProfile: (profile: GitHubProfile) => void;
  setPostCommits: (commits: GitHubCommit[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  fetchGitHubData: () => Promise<void>;
}

export const useGitHubStore = create<GitHubStore>((set) => ({
  profile: null,
  postCommits: [],
  loading: false,
  error: null,

  setProfile: (profile) => set({ profile }),
  setPostCommits: (commits) => set({ postCommits: commits }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchGitHubData: async () => {
    set({ loading: true, error: null });

    try {
      // 프로필 정보 가져오기
      const profileRes = await fetch("/api/profile?type=profile");
      if (!profileRes.ok) throw new Error("프로필 로드 실패");

      const profileData = await profileRes.json();
      set({
        profile: {
          name: profileData.data.name,
          avatarUrl: profileData.data.avatar_url,
          login: profileData.data.login,
        },
      });

      // 커밋 정보 가져오기
      const eventsRes = await fetch("/api/profile?type=events");
      if (!eventsRes.ok) throw new Error("이벤트 로드 실패");

      const eventsData = await eventsRes.json();

      // "Add post"로 시작하는 커밋만 필터링
      const postCommits = eventsData.data
        .filter((event: any) => {
          if (event.type === "PushEvent") {
            return event.payload.commits?.some((commit: any) =>
              commit.message.startsWith("Add post")
            );
          }
          return false;
        })
        .map((event: any) => ({
          date: event.created_at.split("T")[0],
          count: event.payload.commits.filter((commit: any) =>
            commit.message.startsWith("Add post")
          ).length,
        }))
        .reduce((acc: GitHubCommit[], curr: GitHubCommit) => {
          const existing = acc.find((item) => item.date === curr.date);
          if (existing) {
            existing.count += curr.count;
          } else {
            acc.push(curr);
          }
          return acc;
        }, []);

      set({ postCommits, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "데이터 로드 실패",
        loading: false,
      });
    }
  },
}));
