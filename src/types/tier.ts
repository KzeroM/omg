export type ArtistTier = 'basic' | 'silver' | 'gold' | 'diamond';

export interface TierInfo {
  tier_name: ArtistTier;
  display_name: string;
  min_followers: number;
  min_monthly_plays: number;
  revenue_share_rate: number;
  sort_order: number;
  badge_color: string;
}

export interface TierBadgeProps {
  tier: ArtistTier;
  size?: 'sm' | 'md';  // sm: 트랙 목록, md: 프로필 헤더
}
