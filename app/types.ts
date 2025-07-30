export interface ModelProfile {
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  resultImage: string | null;
  error: string | null;
}

export interface Tab {
  id: string;
  imageSrc: string;
  title: string;
  modelProfile: ModelProfile;
}