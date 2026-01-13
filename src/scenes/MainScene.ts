/**
 * MainScene: ゲームのメインシーン
 * ワールド構築、システム統合、メインループ
 */

import Phaser from 'phaser';
import { Piece } from '../domain/piece';
import { Spawner } from '../systems/spawner';
import { MergeSystem } from '../systems/mergeSystem';
import { GameOverSystem } from '../systems/gameOverSystem';
import { HUD } from '../ui/hud';

export class MainScene extends Phaser.Scene {
  private pieces!: Map<number, Piece>;
  private spawner!: Spawner;
  private mergeSystem!: MergeSystem;
  private gameOverSystem!: GameOverSystem;
  private hud!: HUD;
  private isGameRunning: boolean = false;

  private limitLineY: number = 150; // 上限ライン

  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    console.log('🎮 MainScene.create() 開始');
    
    // 背景
    this.cameras.main.setBackgroundColor('#87CEEB');

    // Matter.js ワールド設定
    // setBounds(x, y, width, height, thickness, left, right, top, bottom)
    this.matter.world.setBounds(0, 0, 540, 960, 32, true, true, false, true);
    this.matter.world.setGravity(0, 1.2); // 重力を強化
    
    console.log('✅ Matter.js ワールド初期化完了');
    console.log('  重力:', this.matter.world.localWorld.gravity);

    // 壁と床を静的Bodyで作成
    this.createWalls();

    // 上限ライン表示
    this.createLimitLine();

    // ピース管理マップ
    this.pieces = new Map();

    // HUD初期化
    this.hud = new HUD(this);

    // システム初期化
    this.spawner = new Spawner(this, this.pieces);
    this.mergeSystem = new MergeSystem(this, this.pieces, (score) => {
      this.hud.addScore(score);
    });
    this.gameOverSystem = new GameOverSystem(this.limitLineY, () => {
      this.onGameOver();
    });

    // クリック/タッチイベント登録
    this.input.on('pointerdown', this.onPointerDown, this);
    console.log('✅ クリックイベントを登録しました');

    // 物理エンジンテスト（デバッグ用）
    this.testPhysics();

    // ゲーム開始
    this.startGame();
  }

  /**
   * 物理エンジンのテスト（デバッグ用）
   */
  private testPhysics(): void {
    console.log('🧪 物理エンジンテスト開始');
    console.log('  Matter.js有効:', !!this.matter);
    console.log('  重力:', this.matter.world.localWorld.gravity);
    
    // テスト用の落下物を生成（3秒後に削除）
    const testBody = this.matter.add.circle(270, 200, 20, {
      restitution: 0.5,
      isStatic: false,
    });
    console.log('  テスト円を生成（3秒後に自動削除）');
    console.log('  この円が落下すれば物理エンジンは正常です');
    
    this.time.delayedCall(3000, () => {
      this.matter.world.remove(testBody as any);
      console.log('  テスト円を削除');
    });
  }

  /**
   * クリック/タッチイベントハンドラ
   */
  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    console.log('🖱️ クリック検知！ 位置:', pointer.x, pointer.y);
    if (this.isGameRunning) {
      this.spawner.tryDrop();
    }
  }

  update(_time: number, delta: number): void {
    if (!this.isGameRunning) return;

    // スポーナー更新（マウス追従・ドロップ）
    this.spawner.update(delta);

    // 合体システム更新
    this.mergeSystem.update();

    // ゲームオーバー判定
    this.gameOverSystem.update(delta, this.pieces);

    // ピースの描画位置を物理ボディに同期
    this.syncPieceGraphics();

    // HUD更新
    this.hud.updateNextPiece(this.spawner.getNextRankId());
    this.hud.updateWarning(this.gameOverSystem.getOverLimitRatio());
  }

  /**
   * ワールドの壁と床を作成
   */
  private createWalls(): void {
    const wallThickness = 32;
    const wallOptions = { isStatic: true, friction: 0.5 };

    // 左壁
    this.matter.add.rectangle(
      wallThickness / 2,
      480,
      wallThickness,
      960,
      wallOptions
    );

    // 右壁
    this.matter.add.rectangle(
      540 - wallThickness / 2,
      480,
      wallThickness,
      960,
      wallOptions
    );

    // 床
    this.matter.add.rectangle(
      270,
      960 - wallThickness / 2,
      540,
      wallThickness,
      wallOptions
    );

    // 壁の視覚表示
    const wallGraphics = this.add.graphics();
    wallGraphics.fillStyle(0x8b4513, 1);
    wallGraphics.fillRect(0, 0, wallThickness, 960); // 左
    wallGraphics.fillRect(540 - wallThickness, 0, wallThickness, 960); // 右
    wallGraphics.fillRect(0, 960 - wallThickness, 540, wallThickness); // 床
    wallGraphics.setDepth(5);
  }

  /**
   * 上限ライン表示
   */
  private createLimitLine(): void {
    const line = this.add.graphics();
    line.lineStyle(2, 0xff0000, 0.8);
    line.lineBetween(30, this.limitLineY, 510, this.limitLineY);
    line.setDepth(50);

    // "DANGER"テキスト
    const dangerText = this.add.text(270, this.limitLineY - 15, 'DANGER', {
      fontSize: '16px',
      color: '#ff0000',
      fontStyle: 'bold',
    });
    dangerText.setOrigin(0.5);
    dangerText.setDepth(51);
  }

  /**
   * ピースの描画位置を物理ボディに同期
   */
  private syncPieceGraphics(): void {
    for (const piece of this.pieces.values()) {
      const pos = piece.body.position;
      piece.graphics.setPosition(pos.x, pos.y);
      piece.text.setPosition(pos.x, pos.y);
    }
  }

  /**
   * ゲーム開始
   */
  private startGame(): void {
    console.log('🎬 ゲーム開始');
    this.isGameRunning = true;
    this.spawner.spawnNewPiece();
    console.log('  isGameRunning:', this.isGameRunning);
  }

  /**
   * ゲームオーバー処理
   */
  private onGameOver(): void {
    this.isGameRunning = false;
    this.spawner.stop();
    this.hud.showGameOver(() => this.retryGame());
  }

  /**
   * リトライ処理
   */
  private retryGame(): void {
    // 全ピースを削除
    for (const piece of this.pieces.values()) {
      this.matter.world.remove(piece.body);
      piece.graphics.destroy();
      piece.text.destroy();
    }
    this.pieces.clear();

    // システムリセット
    this.gameOverSystem.reset();
    this.hud.reset();

    // ゲーム再開
    this.startGame();
  }

  /**
   * クリーンアップ
   */
  shutdown(): void {
    this.mergeSystem.destroy();
  }
}

