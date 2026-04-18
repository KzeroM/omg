export type TagCategory = 'genre' | 'mood' | 'bpm' | 'instrument';

export interface Tag {
  id: string;
  name: string;
  category: TagCategory;
}

export interface TrackTag {
  track_id: string;
  tag_id: string;
  tag: Tag;
}

export interface ArtistTag {
  user_id: string;
  tag_id: string;
  tag: Tag;
}

export type TagsByCategory = Record<TagCategory, Tag[]>;
