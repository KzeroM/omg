export async function copyTrackUrl(
  artistName: string,
  trackId: string
): Promise<void> {
  try {
    const url = `${window.location.origin}/artist/${encodeURIComponent(
      artistName
    )}?track=${trackId}`;
    await navigator.clipboard.writeText(url);
  } catch (error) {
    throw error;
  }
}
