import { useState } from "react";

const TMDB_API_KEY_STORAGE_KEY = "tmdb_api_key";

export function useTmdb() {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TMDB_API_KEY_STORAGE_KEY);
    }
    return null;
  });

  const updateApiKey = (key: string | null) => {
    if (key) {
      localStorage.setItem(TMDB_API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(TMDB_API_KEY_STORAGE_KEY);
    }
    setApiKey(key);
  };

  const isLogged = !!apiKey && apiKey.length > 0;

  return {
    apiKey,
    isLogged,
    updateApiKey,
  };
}
