// Freebox API response types

export interface FreeboxFile {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  modified?: number;
}

export interface FreeboxFilesResponse {
  path: string;
  files: FreeboxFile[];
}
