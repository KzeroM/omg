export async function copyTrackUrl(
  _artistName: string,
  trackId: string
): Promise<void> {
  try {
    const url = `${window.location.origin}/track/${trackId}`;
    await navigator.clipboard.writeText(url);
  } catch (error) {
    throw error;
  }
}
