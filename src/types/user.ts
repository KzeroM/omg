export interface UserProfile {
  user_id: string;
  nickname: string;
  bio?: string | null;
  social_links?: SocialLinks | null;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  youtube?: string;
  soundcloud?: string;
}

export interface UpdateProfileRequest {
  bio?: string | null;
  social_links?: SocialLinks | null;
}

export interface UpdateProfileResponse {
  ok: boolean;
  error?: string;
}
