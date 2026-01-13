/**
 * ゲームオーバー判定システム: 上限ライン超過チェック
 */

import { Piece } from '../domain/piece';

export class GameOverSystem {
  private limitY: number;
  private overLimitTime: number = 0; // 上限超過の累積時間（ms）
  private gameOverThreshold: number = 3000; // 3秒超過でゲームオーバー
  private isGameOver: boolean = false;
  private onGameOver: () => void;

  constructor(limitY: number, onGameOver: () => void) {
    this.limitY = limitY;
    this.onGameOver = onGameOver;
  }

  /**
   * 毎フレーム更新: 上限ラインを超えているピースをチェック
   */
  update(deltaMs: number, pieces: Map<number, Piece>): void {
    if (this.isGameOver) return;

    let hasOverLimit = false;

    // 動的なピース（isStatic=false）のみチェック
    for (const piece of pieces.values()) {
      if (piece.isStatic) continue;
      if (piece.body.position.y < this.limitY) {
        hasOverLimit = true;
        break;
      }
    }

    if (hasOverLimit) {
      this.overLimitTime += deltaMs;
      if (this.overLimitTime >= this.gameOverThreshold) {
        this.isGameOver = true;
        this.onGameOver();
      }
    } else {
      // ラインより下に戻ったらリセット
      this.overLimitTime = 0;
    }
  }

  /**
   * 上限超過時間の割合（0.0〜1.0）を取得（UI表示用）
   */
  getOverLimitRatio(): number {
    return Math.min(this.overLimitTime / this.gameOverThreshold, 1.0);
  }

  /**
   * ゲームオーバー状態か
   */
  isOver(): boolean {
    return this.isGameOver;
  }

  /**
   * リセット（リトライ用）
   */
  reset(): void {
    this.overLimitTime = 0;
    this.isGameOver = false;
  }
}

