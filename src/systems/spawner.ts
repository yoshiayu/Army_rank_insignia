/**
 * スポーンシステム: ピース生成と操作（左右移動→落下確定）
 */

import Phaser from 'phaser';
import { Piece, createPieceData } from '../domain/piece';
import { getRankDef, getRandomSpawnRankId } from '../domain/rankDefinition';

export class Spawner {
  private scene: Phaser.Scene;
  private pieces: Map<number, Piece>; // bodyId -> Piece
  private currentPiece: Piece | null = null;
  private nextRankId: number = 0;
  private spawnX: number = 270; // 初期X位置
  private spawnY: number = 100;
  private canDrop: boolean = false;
  private dropCooldown: number = 0;

  constructor(scene: Phaser.Scene, pieces: Map<number, Piece>) {
    this.scene = scene;
    this.pieces = pieces;
    this.nextRankId = getRandomSpawnRankId();
  }

  /**
   * 新しいピースをスポーン（操作可能状態）
   */
  spawnNewPiece(): void {
    if (this.currentPiece) return; // 既にスポーン中

    const rankId = this.nextRankId;
    const rankDef = getRankDef(rankId);
    if (!rankDef) return;

    // 次のピースを決定
    this.nextRankId = getRandomSpawnRankId();

    console.log('📦 新しいピースをスポーン:', rankDef.name, 'radius:', rankDef.radius);

    // Matter Body作成（静的：衝突なし）
    const body = (this.scene.matter.add.circle(
      this.spawnX,
      this.spawnY,
      rankDef.radius,
      {
        restitution: 0.2,      // 反発係数（低め = あまり跳ねない）
        friction: 0.8,         // 摩擦（高め = 滑りにくい）
        frictionAir: 0.02,     // 空気抵抗
        density: 0.002,        // 密度（重さ）
        isStatic: true,        // スポーン中は静的
      }
    ) as unknown) as MatterJS.BodyType;

    console.log('  物理ボディID:', body.id, 'isStatic:', body.isStatic);

    // 描画オブジェクト作成（円）
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(rankDef.color, 1);
    graphics.fillCircle(0, 0, rankDef.radius);
    graphics.lineStyle(2, 0xffffff, 0.8); // 白い枠線
    graphics.strokeCircle(0, 0, rankDef.radius);
    graphics.setDepth(10);

    // テキスト（サイズを階級に応じて調整）
    const fontSize = Math.max(10, Math.min(16, rankDef.radius / 4));
    const text = this.scene.add.text(0, 0, rankDef.name, {
      fontSize: `${fontSize}px`,
      color: '#000',
      fontStyle: 'bold',
      stroke: '#fff',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(11);

    // Pieceデータ作成
    const piece = createPieceData(rankId, body, graphics, text);
    this.pieces.set(body.id, piece);
    this.currentPiece = piece;
    this.canDrop = false;
    this.dropCooldown = 300; // 300ms後にドロップ可能

    console.log('  ピース作成完了。300ms後にドロップ可能');
  }

  /**
   * 毎フレーム更新: マウス追従のみ
   */
  update(deltaMs: number): void {
    // クールダウン処理
    if (this.dropCooldown > 0) {
      this.dropCooldown -= deltaMs;
      if (this.dropCooldown <= 0) {
        this.canDrop = true;
        console.log('✨ ドロップ可能になりました！画面をクリックしてください');
      }
    }

    if (!this.currentPiece) return;

    // マウス/タッチX座標を取得
    const pointer = this.scene.input.activePointer;
    let targetX = pointer.worldX;

    // 壁に当たらないよう制限（左壁=30、右壁=510）
    const rankDef = getRankDef(this.currentPiece.rankId);
    if (!rankDef) return;
    const minX = 30 + rankDef.radius + 5;
    const maxX = 510 - rankDef.radius - 5;
    targetX = Phaser.Math.Clamp(targetX, minX, maxX);

    // ピース位置を更新（物理ボディを直接移動）
    this.scene.matter.body.setPosition(this.currentPiece.body, { x: targetX, y: this.spawnY });
  }

  /**
   * ドロップを試行（外部から呼び出し）
   */
  tryDrop(): void {
    console.log('🎯 tryDrop() 呼び出し - canDrop:', this.canDrop, 'currentPiece:', !!this.currentPiece);
    
    if (!this.canDrop) {
      console.log('  ❌ ドロップ不可（クールダウン中: ', this.dropCooldown, 'ms）');
      return;
    }

    if (!this.currentPiece) {
      console.log('  ❌ ドロップ不可（現在のピースなし）');
      return;
    }

    this.dropCurrentPiece();
  }

  /**
   * 現在のピースをドロップ（動的化）
   */
  private dropCurrentPiece(): void {
    if (!this.currentPiece) return;

    const rankDef = getRankDef(this.currentPiece.rankId);
    const pos = this.currentPiece.body.position;
    
    console.log('==================');
    console.log('🔽 ピースをドロップ！');
    console.log('  階級:', rankDef?.name);
    console.log('  位置:', pos.x.toFixed(1), pos.y.toFixed(1));
    console.log('  ドロップ前 isStatic:', this.currentPiece.body.isStatic);

    // 静的Bodyを削除して動的Bodyを作り直す（確実に落下させるため）
    const oldBodyId = this.currentPiece.bodyId;
    this.scene.matter.world.remove(this.currentPiece.body);

    const newBody = (this.scene.matter.add.circle(
      pos.x,
      pos.y,
      rankDef?.radius ?? 20,
      {
        restitution: 0.2,
        friction: 0.8,
        frictionAir: 0.02,
        density: 0.002,
        isStatic: false,
      }
    ) as unknown) as MatterJS.BodyType;

    this.pieces.delete(oldBodyId);
    this.currentPiece.body = newBody;
    this.currentPiece.bodyId = newBody.id;
    this.currentPiece.isStatic = false;
    this.pieces.set(newBody.id, this.currentPiece);

    console.log('  ドロップ後 isStatic:', newBody.isStatic);
    console.log('  ⚠️ falseなら成功。trueなら失敗');
    console.log('==================');
    
    // currentPieceをクリア
    this.canDrop = false;
    this.currentPiece = null;

    // 少し待ってから次のピースをスポーン
    this.scene.time.delayedCall(500, () => {
      this.spawnNewPiece();
    });
  }

  /**
   * 次に出現するランクIDを取得（HUD表示用）
   */
  getNextRankId(): number {
    return this.nextRankId;
  }

  /**
   * 現在のピースを取得
   */
  getCurrentPiece(): Piece | null {
    return this.currentPiece;
  }

  /**
   * ゲームオーバー時などに強制停止
   */
  stop(): void {
    this.canDrop = false;
    if (this.currentPiece) {
      // 現在のピースがあれば削除
      this.scene.matter.world.remove(this.currentPiece.body);
      this.currentPiece.graphics.destroy();
      this.currentPiece.text.destroy();
      this.pieces.delete(this.currentPiece.bodyId);
      this.currentPiece = null;
    }
  }
}
