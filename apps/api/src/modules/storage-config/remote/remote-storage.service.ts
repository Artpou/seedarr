import { VIDEO_EXTENSIONS } from "@seedarr/shared";

import { getDownloadsRoot } from "@/shared/helpers/path.helper";

import { absoluteOrganizedPath, resolveLibraryBase } from "@/modules/download/local/local-library-hardlink";
import { moduleRepository } from "@/modules/module/module.repository";
import fs from "node:fs/promises";
import path from "node:path";
import { decrypt } from "../../../shared/helpers/crypto.helper";
import { FtpAdapter } from "../adapters/ftp.adapter";
import type {
  RemoteDirectoryEntry,
  RemoteFileEntry,
  StorageAdapter,
  StorageConnectionOptions,
  StorageDiskSpace,
  StorageProtocol,
} from "../adapters/storage.adapter";
import { WebdavAdapter } from "../adapters/webdav.adapter";

function getAdapter(protocol: StorageProtocol): StorageAdapter {
  switch (protocol) {
    case "ftp":
      return new FtpAdapter();
    case "webdav":
      return new WebdavAdapter();
  }
}

function assertSafePath(remotePath: string): void {
  if (path.posix.normalize(remotePath).includes("..")) {
    throw new Error("Path traversal detected");
  }
}

function normalizeBasePath(basePath: string | null | undefined): string {
  if (!basePath) return "";
  return basePath.replace(/^\/+|\/+$/g, "");
}

interface StorageConfigFull {
  connectionOptions: StorageConnectionOptions | null;
  enabled: boolean;
  autoTransfer: boolean;
  moviePath: string;
  tvPath: string;
  deleteLocalAfterTransfer: boolean;
  diskQuotaGb: number | null;
}

/** Kept for ModuleService / tests — config is always loaded fresh (no TTL cache). */
export function invalidateStorageConfigCache(): void {}

/** Roots scanned by library sync: remote module paths or local HARDLINK_* dirs. */
export type SyncRoots = {
  moviePath: string;
  tvPath: string;
  storageModuleId: string | null;
  local: boolean;
};

export function formatSyncRootsForLog(roots: SyncRoots | null): string | null {
  if (!roots) return null;
  const label = roots.local ? "local" : "remote";
  const parts = [roots.moviePath && `movies: ${roots.moviePath}`, roots.tvPath && `tv: ${roots.tvPath}`].filter(
    Boolean,
  );
  return parts.length > 0 ? `${label} (${parts.join(", ")})` : label;
}

async function loadConfig(): Promise<StorageConfigFull> {
  const storageModule = await moduleRepository.findFirstByCategory("storage");

  if (storageModule) {
    const cfg = storageModule.config as {
      host?: string;
      port?: number;
      username?: string;
      password?: string;
      secure?: boolean;
      allowSelfSigned?: boolean;
      moviePath?: string;
      tvPath?: string;
      autoTransfer?: boolean;
      deleteLocalAfterTransfer?: boolean;
      diskQuotaGb?: number;
    };
    const protocol = storageModule.type === "webdav" ? "webdav" : "ftp";
    return {
      connectionOptions: cfg.host
        ? {
            protocol,
            host: cfg.host,
            port: cfg.port ?? (protocol === "webdav" ? 443 : 21),
            username: cfg.username ?? null,
            password: cfg.password
              ? (() => {
                  try {
                    return decrypt(cfg.password);
                  } catch {
                    return cfg.password;
                  }
                })()
              : null,
            secure: cfg.secure ?? false,
            rejectUnauthorized: cfg.allowSelfSigned === false,
          }
        : null,
      enabled: storageModule.enabled === true,
      autoTransfer: cfg.autoTransfer === true,
      moviePath: normalizeBasePath(cfg.moviePath),
      tvPath: normalizeBasePath(cfg.tvPath),
      deleteLocalAfterTransfer: cfg.deleteLocalAfterTransfer === true,
      diskQuotaGb: cfg.diskQuotaGb ?? null,
    };
  }

  return {
    connectionOptions: null,
    enabled: false,
    autoTransfer: false,
    moviePath: "",
    tvPath: "",
    deleteLocalAfterTransfer: false,
    diskQuotaGb: null,
  };
}

class RemoteStorageService {
  private async withAdapter<T>(
    fallback: T,
    fn: (adapter: StorageAdapter, opts: StorageConnectionOptions) => Promise<T>,
  ): Promise<T> {
    const opts = await this.getConnectionOptions();
    if (!opts) return fallback;
    return fn(getAdapter(opts.protocol), opts);
  }

  private async withRequiredAdapter<T>(
    fn: (adapter: StorageAdapter, opts: StorageConnectionOptions) => Promise<T>,
  ): Promise<T> {
    const opts = await this.getConnectionOptions();
    if (!opts) throw new Error("Remote storage is not configured");
    return fn(getAdapter(opts.protocol), opts);
  }

  async getConnectionOptions(): Promise<StorageConnectionOptions | null> {
    const config = await loadConfig();
    return config.connectionOptions;
  }

  async resolveTransferPath(torrentName: string, mediaType?: "movie" | "tv" | null): Promise<string> {
    const config = await loadConfig();
    const basePath = mediaType === "tv" ? config.tvPath : config.moviePath;
    return basePath ? path.posix.join(basePath, torrentName) : torrentName;
  }

  async isEnabled(): Promise<boolean> {
    const config = await loadConfig();
    return config.enabled;
  }

  async isAutoTransferEnabled(): Promise<boolean> {
    const config = await loadConfig();
    return config.enabled && config.autoTransfer;
  }

  async getProtocol(): Promise<StorageProtocol | null> {
    const config = await loadConfig();
    return config.connectionOptions?.protocol ?? null;
  }

  async getDiskQuotaBytes(): Promise<number | null> {
    const config = await loadConfig();
    if (config.diskQuotaGb == null || config.diskQuotaGb <= 0) return null;
    return config.diskQuotaGb * 1024 * 1024 * 1024;
  }

  async isAvailable(): Promise<boolean> {
    try {
      return await this.withAdapter(false, async (adapter, opts) => {
        const result = await adapter.testConnection(opts);
        return result.success;
      });
    } catch {
      return false;
    }
  }

  async getMediaPaths(): Promise<{ moviePath: string; tvPath: string }> {
    const config = await loadConfig();
    return { moviePath: config.moviePath, tvPath: config.tvPath };
  }

  /** Remote module paths → HARDLINK_* → DOWNLOADS_PATH (staging). */
  async getSyncRoots(): Promise<SyncRoots> {
    const config = await loadConfig();
    if (config.enabled && config.connectionOptions) {
      return {
        moviePath: config.moviePath,
        tvPath: config.tvPath,
        storageModuleId: await moduleRepository.getEnabledStorageModuleId(),
        local: false,
      };
    }

    const moviePath = resolveLibraryBase("movie");
    const tvPath = resolveLibraryBase("tv");
    if (moviePath || tvPath) {
      return {
        moviePath: moviePath ?? "",
        tvPath: tvPath ?? "",
        storageModuleId: null,
        local: true,
      };
    }

    const staging = getDownloadsRoot();
    return { moviePath: staging, tvPath: staging, storageModuleId: null, local: true };
  }

  normalizeSyncRoot(roots: SyncRoots, basePath: string): string {
    if (!basePath) return "";
    return roots.local ? path.resolve(basePath) : basePath.replace(/\/+$/, "");
  }

  joinSyncPath(roots: SyncRoots, base: string, name: string): string {
    return roots.local ? path.join(base, name) : `${base}/${name}`;
  }

  resolveOrganizedPath(roots: SyncRoots, basePath: string, organized: string): string {
    return roots.local ? absoluteOrganizedPath(basePath, organized) : organized;
  }

  async listSyncChildren(roots: SyncRoots, dir: string): Promise<RemoteDirectoryEntry[]> {
    const base = this.normalizeSyncRoot(roots, dir);
    if (!base) return [];

    if (roots.local) {
      try {
        const entries = await fs.readdir(base, { withFileTypes: true });
        return entries.map((entry) => ({
          name: entry.name,
          path: path.join(base, entry.name),
          type: entry.isDirectory() ? "directory" : "file",
        }));
      } catch {
        return [];
      }
    }

    return this.listDirectories(base);
  }

  /** True when the sync path exists; on remote listing errors returns true (fail-safe). */
  async syncPathExists(roots: SyncRoots, location: string): Promise<boolean> {
    if (!location) return false;

    if (roots.local) {
      try {
        await fs.access(path.resolve(location));
        return true;
      } catch {
        return false;
      }
    }

    try {
      const normalized = location.replace(/\/+$/, "");
      const parent = path.posix.dirname(normalized);
      const baseName = path.posix.basename(normalized);
      const parentKey = parent === "." ? "" : parent;
      const children = await this.listDirectories(parentKey);
      return children.some((entry) => entry.name === baseName || entry.path === normalized || entry.path === baseName);
    } catch {
      return true;
    }
  }

  async organizeSyncFile(roots: SyncRoots, from: string, targetDir: string, fileName: string): Promise<void> {
    const to = roots.local ? path.join(targetDir, fileName) : `${targetDir}/${fileName}`;
    if (roots.local) {
      await fs.mkdir(path.resolve(targetDir), { recursive: true });
      await fs.rename(path.resolve(from), path.resolve(to));
      return;
    }
    await this.ensureDirectory(targetDir);
    await this.moveFile(from, to);
  }

  async sumSyncVideoBytes(roots: SyncRoots, location: string): Promise<number | null> {
    try {
      const files = roots.local ? await this.listLocalVideos(location) : await this.listFiles(location);
      const total = files.reduce((sum, f) => sum + f.length, 0);
      return total > 0 ? total : null;
    } catch {
      return null;
    }
  }

  private async listLocalVideos(dirPath: string): Promise<RemoteFileEntry[]> {
    const root = path.resolve(dirPath);
    const entries = await fs.readdir(root, { recursive: true, withFileTypes: true });
    const files: RemoteFileEntry[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !VIDEO_EXTENSIONS.test(entry.name)) continue;
      const filePath = path.join(entry.parentPath || root, entry.name);
      const stat = await fs.stat(filePath);
      files.push({ name: entry.name, path: filePath, length: stat.size });
    }
    return files;
  }

  async testConnection(opts: StorageConnectionOptions): Promise<{ success: boolean; error?: string }> {
    return getAdapter(opts.protocol).testConnection(opts);
  }

  async transferDirectory(localDir: string, remoteDir: string, onProgress?: (progress: number) => void): Promise<void> {
    assertSafePath(remoteDir);
    return this.withRequiredAdapter((adapter, opts) =>
      adapter.transferDirectory(localDir, remoteDir, opts, onProgress),
    );
  }

  async shouldDeleteLocalAfterTransfer(): Promise<boolean> {
    const config = await loadConfig();
    return config.deleteLocalAfterTransfer;
  }

  async remove(remotePath: string): Promise<void> {
    assertSafePath(remotePath);
    return this.withAdapter(undefined, (adapter, opts) => adapter.remove(remotePath, opts));
  }

  async listDirectories(remotePath: string): Promise<RemoteDirectoryEntry[]> {
    assertSafePath(remotePath);
    return this.withAdapter([], (adapter, opts) => adapter.listDirectories(remotePath, opts));
  }

  async listFiles(remotePath: string): Promise<RemoteFileEntry[]> {
    assertSafePath(remotePath);
    return this.withAdapter([], (adapter, opts) => adapter.listFiles(remotePath, opts));
  }

  async moveFile(from: string, to: string): Promise<void> {
    assertSafePath(from);
    assertSafePath(to);
    return this.withRequiredAdapter((adapter, opts) => adapter.moveFile(from, to, opts));
  }

  async ensureDirectory(remotePath: string): Promise<void> {
    assertSafePath(remotePath);
    return this.withRequiredAdapter((adapter, opts) => adapter.ensureDirectory(remotePath, opts));
  }

  async createReadStream(
    remotePath: string,
    range?: { start: number; end: number },
  ): Promise<{ stream: NodeJS.ReadableStream; size: number; cleanup?: () => void } | null> {
    assertSafePath(remotePath);
    return this.withAdapter(null, (adapter, opts) => adapter.createReadStream(remotePath, opts, range));
  }

  async getDiskSpace(): Promise<StorageDiskSpace | null> {
    const fromAdapter = await this.withAdapter(null, (adapter, opts) => adapter.getDiskSpace(opts));
    if (fromAdapter) return fromAdapter;

    const config = await loadConfig();
    if (!config.enabled || !config.connectionOptions) return null;
    const quotaBytes = await this.getDiskQuotaBytes();
    if (quotaBytes == null) return null;

    return {
      used: 0,
      total: quotaBytes,
      protocol: config.connectionOptions.protocol,
    };
  }
}

export const remoteStorageService = new RemoteStorageService();
