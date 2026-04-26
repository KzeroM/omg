/**
 * 온보딩 설문 코드 정의
 * DB에는 smallint로 저장, 앱 코드에서는 이 상수로 참조
 * 새 항목 추가 시 이 파일만 수정 (DB migration 불필요)
 */

export const GENDER = {
  MALE: 1,       // 남성
  FEMALE: 2,     // 여성
  NON_BINARY: 3, // 논바이너리
  NO_ANSWER: 4,  // 응답안함
} as const;

export const PRIMARY_PURPOSE = {
  DISCOVER: 1,  // 새로운 음악 발견
  SUPPORT: 2,   // 좋아하는 아티스트 지원
  SHARE: 3,     // 내 음악 공유
} as const;

export const REFERRAL_SOURCE = {
  SNS: 1,      // SNS (인스타/트위터/유튜브 등)
  FRIEND: 2,   // 지인 추천
  SEARCH: 3,   // 검색 (구글 등)
  OTHER: 4,    // 기타
} as const;

export type GenderValue = typeof GENDER[keyof typeof GENDER];
export type PrimaryPurposeValue = typeof PRIMARY_PURPOSE[keyof typeof PRIMARY_PURPOSE];
export type ReferralSourceValue = typeof REFERRAL_SOURCE[keyof typeof REFERRAL_SOURCE];

export const GENDER_LABELS: Record<GenderValue, string> = {
  1: "남성",
  2: "여성",
  3: "논바이너리",
  4: "응답안함",
};

export const PURPOSE_LABELS: Record<PrimaryPurposeValue, string> = {
  1: "새로운 음악 발견",
  2: "좋아하는 아티스트 지원",
  3: "내 음악 공유",
};

export const REFERRAL_LABELS: Record<ReferralSourceValue, string> = {
  1: "SNS (인스타/트위터/유튜브)",
  2: "지인 추천",
  3: "검색 (구글 등)",
  4: "기타",
};
