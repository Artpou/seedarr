import { describe, expect, it } from "vitest";

import { parseInfoHashFromMagnet } from "./magnet";

describe("parseInfoHashFromMagnet", () => {
  it("parses hex btih from magnet", () => {
    const hash = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
    expect(parseInfoHashFromMagnet(`magnet:?xt=urn:btih:${hash}`)).toBe(hash);
  });

  it("parses bare hex hash", () => {
    const hash = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
    expect(parseInfoHashFromMagnet(hash.toUpperCase())).toBe(hash);
  });
});
