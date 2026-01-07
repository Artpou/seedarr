/**
 * Converts SRT subtitle format to WebVTT format
 * @param srtContent - The SRT file content as string
 * @returns WebVTT formatted string
 */
export function srt2webvtt(srtContent: string): string {
  // Normalize line endings
  let vtt = srtContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Replace commas with dots in timestamps (e.g., 00:00:20,000 -> 00:00:20.000)
  vtt = vtt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");

  // Remove sequence numbers (lines that are just digits)
  vtt = vtt.replace(/^\d+\n/gm, "");

  // Remove excessive blank lines
  vtt = vtt.replace(/\n{3,}/g, "\n\n");

  // Prepend WEBVTT header
  return `WEBVTT\n\n${vtt.trim()}\n`;
}
