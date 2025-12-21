import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface FreeboxFile {
  name: string;
  type: "file" | "directory";
  size: number;
  modifiedAt: string | undefined;
}

export class FreeboxService {
  private host: string;
  private user: string;
  private password: string;

  constructor() {
    this.host = process.env.FREEBOX_HOST ?? "mafreebox.freebox.fr";
    this.user = process.env.FREEBOX_USER ?? "freebox";
    this.password = process.env.FREEBOX_PASSWORD ?? "";
  }

  async listFiles(path = "/"): Promise<FreeboxFile[]> {
    const ftpUrl = `ftp://${this.user}:${this.password}@${this.host}${path}`;
    const { stdout } = await execAsync(
      `curl -s --connect-timeout 10 --max-time 30 --ftp-pasv "${ftpUrl}"`,
    );

    if (!stdout.trim()) {
      return [];
    }

    return stdout
      .trim()
      .split("\n")
      .map((line) => {
        // Parse FTP LIST output: drwxr-xr-x 3 freebox freebox 60 Dec 31 2024 foldername
        const parts = line.split(/\s+/);
        const permissions = parts[0];
        const isDirectory = permissions.startsWith("d");
        const size = Number.parseInt(parts[4], 10) || 0;
        const dateStr = `${parts[5]} ${parts[6]} ${parts[7]}`;
        const name = parts.slice(8).join(" ");

        const type: "file" | "directory" = isDirectory ? "directory" : "file";
        return {
          name,
          type,
          size,
          modifiedAt: dateStr,
        };
      })
      .filter((file) => file.name && file.name !== "." && file.name !== "..");
  }
}

export const freeboxService = new FreeboxService();
