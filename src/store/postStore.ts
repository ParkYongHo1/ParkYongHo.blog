import { create } from "zustand";

interface PostResult {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  contentImages?: string[];
  createdAt: string;
  updatedAt: string;
}

interface PostStore {
  imageFile: File | null;
  imagePreview: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  postCreating: boolean;
  result: PostResult | null;
  isPreviewMode: boolean;

  handlePreviewMode: () => void;
  setImageFile: (file: File | null) => void;
  setImagePreview: (url: string) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setCategory: (category: string) => void;
  setTags: (tags: string) => void;
  setPostCreating: (flag: boolean) => void;
  setResult: (res: PostResult | null) => void;
  resetStore: () => void;
}

const initialState = {
  imageFile: null,
  imagePreview: "",
  title: "",
  content: "",
  category: "",
  tags: "",
  postCreating: false,
  result: null,
  isPreviewMode: false,
};

export const usePostStore = create<PostStore>((set) => ({
  ...initialState,

  handlePreviewMode: () => {
    set((state) => ({ isPreviewMode: !state.isPreviewMode }));
  },
  setImageFile: (file) => set({ imageFile: file }),
  setImagePreview: (url) => set({ imagePreview: url }),
  setTitle: (title) => set({ title }),
  setContent: (content) => set({ content }),
  setCategory: (category) => set({ category }),
  setTags: (tags) => set({ tags }),
  setPostCreating: (flag) => set({ postCreating: flag }),
  setResult: (res) => set({ result: res }),
  resetStore: () => set(initialState),
}));
