import { beforeEach, describe, expect, it, vi } from "vitest";

import { listVideoFilesAtLocation } from "@/modules/download/paths.helper";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const { listFiles } = vi.hoisted(() => ({ listFiles: vi.fn() }));

vi.mock("@/modules/storage-config/remote/remote-storage.service", () => ({
  remoteStorageService: { listFiles },
}));

describe("listVideoFilesAtLocation", () => {
  beforeEach(() => {
    listFiles.mockReset().mockResolvedValue([{ name: "remote.mkv", path: "remote.mkv", length: 3 }]);
  });

  it("lists videos on disk when location is under DOWNLOADS_PATH", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "seedarr-paths-"));
    const previous = process.env.DOWNLOADS_PATH;
    process.env.DOWNLOADS_PATH = root;
    const dir = path.join(root, "Title (2024)");
    await fs.mkdir(dir);
    await fs.writeFile(path.join(dir, "clip.mkv"), "12345");

    const files = await listVideoFilesAtLocation(dir);
    expect(files).toEqual([expect.objectContaining({ name: "clip.mkv", length: 5 })]);
    expect(listFiles).not.toHaveBeenCalled();

    if (previous === undefined) delete process.env.DOWNLOADS_PATH;
    else process.env.DOWNLOADS_PATH = previous;
  });

  it("delegates to remote storage for non-local paths", async () => {
    await expect(listVideoFilesAtLocation("movies/X")).resolves.toHaveLength(1);
    expect(listFiles).toHaveBeenCalledWith("movies/X");
  });
});
