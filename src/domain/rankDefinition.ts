/**
 * 自衛隊階級定義データ
 * ここを編集すればランク名/半径/色/点数が全体に反映される
 */

export interface RankDef {
  id: number;
  name: string;      // 階級名
  radius: number;    // 円の半径（px）
  color: number;     // 色（16進数）
  score: number;     // 合体時の獲得スコア
}

export const RANKS: RankDef[] = [
  { id: 0,  name: '二等陸士', radius: 18, color: 0xff6b6b, score: 1 },
  { id: 1,  name: '一等陸士', radius: 24, color: 0xff8c42, score: 2 },
  { id: 2,  name: '陸士長',   radius: 30, color: 0xffa726, score: 3 },
  { id: 3,  name: '三等陸曹', radius: 36, color: 0xffca28, score: 5 },
  { id: 4,  name: '二等陸曹', radius: 42, color: 0xd4e157, score: 8 },
  { id: 5,  name: '一等陸曹', radius: 48, color: 0x9ccc65, score: 13 },
  { id: 6,  name: '曹長',     radius: 54, color: 0x66bb6a, score: 21 },
  { id: 7,  name: '准尉',     radius: 60, color: 0x26a69a, score: 34 },
  { id: 8,  name: '三等陸尉', radius: 66, color: 0x29b6f6, score: 55 },
  { id: 9,  name: '二等陸尉', radius: 72, color: 0x42a5f5, score: 89 },
  { id: 10, name: '一等陸尉', radius: 78, color: 0x5c6bc0, score: 144 },
  { id: 11, name: '三等陸佐', radius: 84, color: 0x7e57c2, score: 233 },
  { id: 12, name: '陸将補',   radius: 90, color: 0xab47bc, score: 377 },
  { id: 13, name: '陸将',     radius: 96, color: 0xec407a, score: 610 },
];

export const MAX_RANK_ID = RANKS.length - 1;

export function getRankDef(id: number): RankDef | undefined {
  return RANKS.find(r => r.id === id);
}

export function getRandomSpawnRankId(): number {
  // スポーン時は下位5種のみ（id: 0〜4）からランダム
  return Math.floor(Math.random() * 5);
}

