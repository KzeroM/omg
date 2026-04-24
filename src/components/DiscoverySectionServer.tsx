import { getDiscoveryTagsServer } from "@/utils/supabase/tags";
import { DiscoverySection } from "./DiscoverySection";

export async function DiscoverySectionServer() {
  const initialTags = await getDiscoveryTagsServer();
  return <DiscoverySection initialTags={initialTags} />;
}
