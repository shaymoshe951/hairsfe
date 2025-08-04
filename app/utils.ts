export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.error(...args);
    }
  },
};

export async function fetchWithErrorHandling(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }
  return res.json();
}

export async function pollTaskStatus(taskId: string, onProgress: (progress: number) => void, context: string) {
  let isDone = false;
  let progData: any = {};
  while (!isDone) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!taskId) throw new Error(`Task ID is missing for context: ${context}`);
    const progRes = await fetchWithErrorHandling(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/status/${taskId}`);
    progData = progRes;
    isDone = progData.done; // || (progData.progress >= 100);
    onProgress(progData.progress ?? 0);
  }
  logger.log(`Task completed for ${context}:`, progData);
  return progData;
}

export type StatusHandlerParams = {
  status: string;
  result?: string;
  error?: string;
  progress?: number;
};

export function handleTaskStatus<T>(
  params: StatusHandlerParams,
  onSuccess: (result: string) => T,
  onError: (error: string) => T,
  onUnknown?: (status: string) => T
): T {
  const { status, result, error, progress = 0 } = params;
  if (status === "Failed") {
    return onError(error || "Failed to process");
  } else if (status === "Completed" && result) {
    return onSuccess(result);
  } else if (status === "Canceled") {
    return onError("Canceled");
  } else if (onUnknown) {
    return onUnknown(status);
  } else {
    return onError("Unknown status: " + status);
  }
}