import { getPublicAlbumsServer } from "@/utils/supabase/albums";
import { AlbumGrid } from "./AlbumGrid";

export async function AlbumGridServer() {
  const initialAlbums = await getPublicAlbumsServer();
  return <AlbumGrid initialAlbums={initialAlbums} />;
}
