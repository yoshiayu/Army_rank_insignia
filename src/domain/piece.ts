/**
 * ピース（落下オブジェクト）の型定義
 */

export interface Piece {
  rankId: number;              // ランクID（0〜13）
  bodyId: number;              // Matter.Body.id
  body: MatterJS.BodyType;     // Matter.js の物理ボディ
  graphics: Phaser.GameObjects.Graphics; // 円の描画オブジェクト
  text: Phaser.GameObjects.Text;         // 階級名テキスト
  mergeLock: boolean;          // 合体処理ロック（二重合体防止）
  isStatic: boolean;           // 静的状態（スポーン操作中はtrue）
}

export function createPieceData(
  rankId: number,
  body: MatterJS.BodyType,
  graphics: Phaser.GameObjects.Graphics,
  text: Phaser.GameObjects.Text
): Piece {
  return {
    rankId,
    bodyId: body.id,
    body,
    graphics,
    text,
    mergeLock: false,
    isStatic: true, // 初期は静的（スポーン中）
  };
}

