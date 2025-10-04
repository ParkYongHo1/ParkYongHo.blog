import { create } from "zustand";

interface PostStore {
  imageFile: File | null;
  imagePreview: string;
  title: string;
  content: string;
  category: string;
  tags: string;
  postCreating: boolean;
  result: any;
  isPreviewMode: boolean;

  handlePreviewMode: () => void;
  setImageFile: (file: File | null) => void;
  setImagePreview: (url: string) => void;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setCategory: (category: string) => void;
  setTags: (tags: string) => void;
  setPostCreating: (flag: boolean) => void;
  setResult: (res: any) => void;
}

export const usePostStore = create<PostStore>((set) => ({
  imageFile: null,
  imagePreview: "",
  title: "",
  content: "",
  category: "",
  tags: "",
  postCreating: false,
  result: null,
  isPreviewMode: false,

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
}));
