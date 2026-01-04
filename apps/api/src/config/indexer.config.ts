/**
 * Transform localhost URLs to work in Docker or remote environments
 *
 * When the API runs in Docker and Prowlarr/Jackett runs on the host,
 * `localhost` URLs won't work. This function can transform them to use
 * the host's IP or Docker's host.docker.internal
 *
 * Environment Variables:
 * - INDEXER_HOST: Force transformation to this host (e.g., "host.docker.internal", "192.168.1.100", "prowlarr", etc.)
 * - TRANSFORM_LOCALHOST: Set to "true" to enable transformation even in local dev (useful for debugging)
 *
 * @param url - The original URL from the indexer (e.g., http://localhost:9696/...)
 * @returns The transformed URL that works in the current environment
 */
export function transformIndexerUrl(url: string): string {
  // Check if URL contains localhost
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    return url;
  }

  // Check if we have a custom indexer host configured (highest priority)
  const customHost = process.env.INDEXER_HOST;
  if (customHost) {
    const transformedUrl = url.replace(/localhost|127\.0\.0\.1/g, customHost);
    console.log(`[INDEXER] Transformed URL: ${url} -> ${transformedUrl}`);
    return transformedUrl;
  }

  // Check if transformation is explicitly enabled
  const forceTransform = process.env.TRANSFORM_LOCALHOST === "true";

  // Auto-detect Docker environment
  const isDocker =
    process.env.DOCKER === "true" ||
    process.env.IS_DOCKER === "true" ||
    // Check if running in container (common Docker indicator)
    process.env.HOSTNAME?.startsWith("docker") ||
    // Check for .dockerenv file
    require("node:fs").existsSync("/.dockerenv");

  if (isDocker || forceTransform) {
    // Use host.docker.internal for Docker Desktop or the gateway IP
    const dockerHost = "host.docker.internal";
    const transformedUrl = url.replace(/localhost|127\.0\.0\.1/g, dockerHost);
    console.log(
      `[INDEXER] ${isDocker ? "Docker" : "Force"} transform: ${url} -> ${transformedUrl}`,
    );
    return transformedUrl;
  }

  // For local development, return as-is
  console.log(`[INDEXER] Using original URL: ${url}`);
  return url;
}

/**
 * Get the base URL for the indexer from environment variables
 * This is useful when Prowlarr/Jackett URLs need to be overridden
 */
export function getIndexerBaseUrl(): string | undefined {
  return process.env.INDEXER_BASE_URL;
}
