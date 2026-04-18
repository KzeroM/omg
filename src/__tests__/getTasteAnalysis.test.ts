import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HistoryTrack } from '@/types/player';
import { getTasteAnalysis } from '@/utils/supabase/tracks';

// Mock getPlayHistory
vi.mock('@/utils/supabase/tracks', async () => {
  const actual = await vi.importActual('@/utils/supabase/tracks');
  return {
    ...actual,
    getPlayHistory: vi.fn(),
  };
});

import * as tracksModule from '@/utils/supabase/tracks';

describe('getTasteAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when play history is empty', async () => {
    vi.mocked(tracksModule.getPlayHistory).mockResolvedValue([]);
    const result = await getTasteAnalysis();
    expect(result).toBeNull();
  });

  it('aggregates top 5 artists correctly by count', async () => {
    const mockHistory: HistoryTrack[] = [
      {
        id: '1',
        title: 'Song A',
        artist: 'Artist A',
        file_path: 'path',
        coverColor: 'gradient',
        isFoundingMember: false,
        rank: 0,
        played_at: '2026-04-18T10:00:00Z',
        like_count: 0,
        play_count: 0,
      },
      {
        id: '2',
        title: 'Song B',
        artist: 'Artist A',
        file_path: 'path',
        coverColor: 'gradient',
        isFoundingMember: false,
        rank: 0,
        played_at: '2026-04-18T10:05:00Z',
        like_count: 0,
        play_count: 0,
      },
      {
        id: '3',
        title: 'Song C',
        artist: 'Artist B',
        file_path: 'path',
        coverColor: 'gradient',
        isFoundingMember: false,
        rank: 0,
        played_at: '2026-04-18T10:10:00Z',
        like_count: 0,
        play_count: 0,
      },
    ];

    vi.mocked(tracksModule.getPlayHistory).mockResolvedValue(mockHistory);
    const result = await getTasteAnalysis();

    expect(result).not.toBeNull();
    expect(result!.topArtists).toHaveLength(2);
    expect(result!.topArtists[0].artist).toBe('Artist A');
    expect(result!.topArtists[0].count).toBe(2);
    expect(result!.topArtists[1].artist).toBe('Artist B');
    expect(result!.topArtists[1].count).toBe(1);
  });

  it('limits top artists to 5', async () => {
    const mockHistory: HistoryTrack[] = Array.from({ length: 15 }, (_, i) => ({
      id: `${i}`,
      title: `Song ${i}`,
      artist: `Artist ${i % 10}`,
      file_path: 'path',
      coverColor: 'gradient',
      isFoundingMember: false,
      rank: 0,
      played_at: '2026-04-18T10:00:00Z',
      like_count: 0,
      play_count: 0,
    }));

    vi.mocked(tracksModule.getPlayHistory).mockResolvedValue(mockHistory);
    const result = await getTasteAnalysis();

    expect(result!.topArtists.length).toBeLessThanOrEqual(5);
  });

  it('generates 7 days of data in MM/DD format', async () => {
    const mockHistory: HistoryTrack[] = [
      {
        id: '1',
        title: 'Song',
        artist: 'Artist',
        file_path: 'path',
        coverColor: 'gradient',
        isFoundingMember: false,
        rank: 0,
        played_at: '2026-04-18T10:00:00Z',
        like_count: 0,
        play_count: 0,
      },
    ];

    vi.mocked(tracksModule.getPlayHistory).mockResolvedValue(mockHistory);
    const result = await getTasteAnalysis();

    expect(result!.last7Days).toHaveLength(7);
    expect(result!.last7Days[0].date).toMatch(/\d{2}\/\d{2}/);
  });

  it('counts plays by date correctly', async () => {
    const mockHistory: HistoryTrack[] = [
      {
        id: '1',
        title: 'Song A',
        artist: 'Artist A',
        file_path: 'path',
        coverColor: 'gradient',
        isFoundingMember: false,
        rank: 0,
        played_at: '2026-04-18T10:00:00Z',
        like_count: 0,
        play_count: 0,
      },
      {
        id: '2',
        title: 'Song B',
        artist: 'Artist B',
        file_path: 'path',
        coverColor: 'gradient',
        isFoundingMember: false,
        rank: 0,
        played_at: '2026-04-18T15:00:00Z',
        like_count: 0,
        play_count: 0,
      },
    ];

    vi.mocked(tracksModule.getPlayHistory).mockResolvedValue(mockHistory);
    const result = await getTasteAnalysis();

    const todayEntry = result!.last7Days.find((d) => d.date === '04/18');
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.count).toBe(2);
  });

  it('returns correct total played count', async () => {
    const mockHistory: HistoryTrack[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      title: `Song ${i}`,
      artist: 'Artist',
      file_path: 'path',
      coverColor: 'gradient',
      isFoundingMember: false,
      rank: 0,
      played_at: '2026-04-18T10:00:00Z',
      like_count: 0,
      play_count: 0,
    }));

    vi.mocked(tracksModule.getPlayHistory).mockResolvedValue(mockHistory);
    const result = await getTasteAnalysis();

    expect(result!.totalPlayed).toBe(10);
  });

  it('handles old plays outside 7-day window', async () => {
    const mockHistory: HistoryTrack[] = [
      {
        id: '1',
        title: 'Recent',
        artist: 'Artist A',
        file_path: 'path',
        coverColor: 'gradient',
        isFoundingMember: false,
        rank: 0,
        played_at: '2026-04-18T10:00:00Z',
        like_count: 0,
        play_count: 0,
      },
      {
        id: '2',
        title: 'Old',
        artist: 'Artist B',
        file_path: 'path',
        coverColor: 'gradient',
        isFoundingMember: false,
        rank: 0,
        played_at: '2026-04-10T10:00:00Z', // 8 days ago
        like_count: 0,
        play_count: 0,
      },
    ];

    vi.mocked(tracksModule.getPlayHistory).mockResolvedValue(mockHistory);
    const result = await getTasteAnalysis();

    // Old play should be in topArtists but count should be 1 (it's still counted)
    expect(result!.totalPlayed).toBe(2);
    // But should not appear in last7Days
    const april10 = result!.last7Days.find((d) => d.date === '04/10');
    expect(april10).toBeUndefined();
  });
});
