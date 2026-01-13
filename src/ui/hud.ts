/**
 * HUD（Heads-Up Display）: スコア、次のピース、警告表示など
 */

import Phaser from 'phaser';
import { getRankDef } from '../domain/rankDefinition';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText: Phaser.GameObjects.Text;
  private nextPieceText: Phaser.GameObjects.Text;
  private warningBar: Phaser.GameObjects.Graphics;
  private gameOverText: Phaser.GameObjects.Text | null = null;
  private retryButton: Phaser.GameObjects.Text | null = null;

  private score: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // スコア表示
    this.scoreText = this.scene.add.text(20, 20, 'スコア: 0', {
      fontSize: '24px',
      color: '#fff',
      fontStyle: 'bold',
    });
    this.scoreText.setDepth(100);

    // 次のピース表示
    this.nextPieceText = this.scene.add.text(20, 60, 'NEXT: ', {
      fontSize: '18px',
      color: '#fff',
    });
    this.nextPieceText.setDepth(100);

    // 警告バー（上限超過時に赤くなる）
    this.warningBar = this.scene.add.graphics();
    this.warningBar.setDepth(99);
  }

  /**
   * スコア加算
   */
  addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`スコア: ${this.score}`);
  }

  /**
   * 次のピース表示を更新
   */
  updateNextPiece(rankId: number): void {
    const rankDef = getRankDef(rankId);
    if (rankDef) {
      this.nextPieceText.setText(`NEXT: ${rankDef.name}`);
    }
  }

  /**
   * 警告バー更新（上限超過の進行度 0.0〜1.0）
   */
  updateWarning(ratio: number): void {
    this.warningBar.clear();
    if (ratio > 0) {
      const barWidth = 540 * ratio;
      const alpha = 0.3 + 0.5 * ratio;
      this.warningBar.fillStyle(0xff0000, alpha);
      this.warningBar.fillRect(0, 150, barWidth, 5);
    }
  }

  /**
   * ゲームオーバー画面を表示
   */
  showGameOver(onRetry: () => void): void {
    // 半透明背景
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, 540, 960);
    overlay.setDepth(200);

    // ゲームオーバーテキスト
    this.gameOverText = this.scene.add.text(270, 400, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
    });
    this.gameOverText.setOrigin(0.5);
    this.gameOverText.setDepth(201);

    // 最終スコア表示
    const finalScoreText = this.scene.add.text(270, 470, `スコア: ${this.score}`, {
      fontSize: '32px',
      color: '#fff',
    });
    finalScoreText.setOrigin(0.5);
    finalScoreText.setDepth(201);

    // リトライボタン
    this.retryButton = this.scene.add.text(270, 550, 'もう一度プレイ', {
      fontSize: '28px',
      color: '#ffff00',
      fontStyle: 'bold',
      backgroundColor: '#333',
      padding: { x: 20, y: 10 },
    });
    this.retryButton.setOrigin(0.5);
    this.retryButton.setDepth(201);
    this.retryButton.setInteractive({ useHandCursor: true });
    this.retryButton.on('pointerdown', onRetry);
    this.retryButton.on('pointerover', () => {
      this.retryButton!.setStyle({ color: '#fff' });
    });
    this.retryButton.on('pointerout', () => {
      this.retryButton!.setStyle({ color: '#ffff00' });
    });
  }

  /**
   * リセット（リトライ時）
   */
  reset(): void {
    this.score = 0;
    this.scoreText.setText('スコア: 0');
    this.warningBar.clear();

    // ゲームオーバー表示を削除
    if (this.gameOverText) {
      this.gameOverText.destroy();
      this.gameOverText = null;
    }
    if (this.retryButton) {
      this.retryButton.destroy();
      this.retryButton = null;
    }
  }

  /**
   * 現在のスコアを取得
   */
  getScore(): number {
    return this.score;
  }
}

