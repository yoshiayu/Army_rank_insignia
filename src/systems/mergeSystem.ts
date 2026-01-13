/**
 * 合体システム: 衝突検知→同ランク合体→多重合体防止
 */

import Phaser from 'phaser';
import { Piece, createPieceData } from '../domain/piece';
import { getRankDef, MAX_RANK_ID } from '../domain/rankDefinition';

export class MergeSystem {
  private scene: Phaser.Scene;
  private pieces: Map<number, Piece>;
  private processedPairs: Set<string> = new Set(); // ペアキー記録（多重防止）
  private onScoreAdd: (score: number) => void;

  constructor(
    scene: Phaser.Scene,
    pieces: Map<number, Piece>,
    onScoreAdd: (score: number) => void
  ) {
    this.scene = scene;
    this.pieces = pieces;
    this.onScoreAdd = onScoreAdd;

    // 衝突開始イベントをリッスン
    this.scene.matter.world.on('collisionstart', this.handleCollision, this);
  }

  /**
   * 衝突イベントハンドラ
   */
  private handleCollision(event: Phaser.Physics.Matter.Events.CollisionStartEvent): void {
    const pairs = event.pairs;

    for (const pair of pairs) {
      const bodyA = pair.bodyA as MatterJS.BodyType;
      const bodyB = pair.bodyB as MatterJS.BodyType;

      // 両方ともピースか確認
      const pieceA = this.pieces.get(bodyA.id);
      const pieceB = this.pieces.get(bodyB.id);
      if (!pieceA || !pieceB) continue;

      // 同じランクか確認
      if (pieceA.rankId !== pieceB.rankId) continue;

      // 最大ランクは合体しない
      if (pieceA.rankId >= MAX_RANK_ID) continue;

      // 既にロック中は処理しない（多重合体防止）
      if (pieceA.mergeLock || pieceB.mergeLock) continue;

      // ペアキー生成（順序を統一）
      const pairKey = this.getPairKey(bodyA.id, bodyB.id);
      if (this.processedPairs.has(pairKey)) continue;
      this.processedPairs.add(pairKey);

      // 合体実行
      this.merge(pieceA, pieceB);
    }
  }

  /**
   * 合体処理: 2つのピースを削除し、上位ランクを生成
   */
  private merge(pieceA: Piece, pieceB: Piece): void {
    // ロックON（削除まで維持）
    pieceA.mergeLock = true;
    pieceB.mergeLock = true;

    // 合体位置（2つの中点）
    const posA = pieceA.body.position;
    const posB = pieceB.body.position;
    const mergeX = (posA.x + posB.x) / 2;
    const mergeY = (posA.y + posB.y) / 2;

    // 新しいランク
    const newRankId = pieceA.rankId + 1;
    const newRankDef = getRankDef(newRankId);
    if (!newRankDef) return;

    // スコア加算
    this.onScoreAdd(newRankDef.score);

    // 古いピースを削除
    this.removePiece(pieceA);
    this.removePiece(pieceB);

    // 新しいピース生成
    const newBody = (this.scene.matter.add.circle(
      mergeX,
      mergeY,
      newRankDef.radius,
      {
        restitution: 0.2,      // 反発係数
        friction: 0.8,         // 摩擦
        frictionAir: 0.02,     // 空気抵抗
        density: 0.002,        // 密度
        isStatic: false,
      }
    ) as unknown) as MatterJS.BodyType;

    const graphics = this.scene.add.graphics();
    graphics.fillStyle(newRankDef.color, 1);
    graphics.fillCircle(0, 0, newRankDef.radius);
    graphics.lineStyle(2, 0xffffff, 0.8); // 白い枠線
    graphics.strokeCircle(0, 0, newRankDef.radius);
    graphics.setDepth(10);

    // テキスト（サイズを階級に応じて調整）
    const fontSize = Math.max(10, Math.min(16, newRankDef.radius / 4));
    const text = this.scene.add.text(0, 0, newRankDef.name, {
      fontSize: `${fontSize}px`,
      color: '#000',
      fontStyle: 'bold',
      stroke: '#fff',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(11);

    const newPiece = createPieceData(newRankId, newBody, graphics, text);
    newPiece.isStatic = false;
    this.pieces.set(newBody.id, newPiece);

    // 少し跳ねるような初速を与える（演出）
    this.scene.matter.body.setVelocity(newBody, { x: 0, y: -2 });
  }

  /**
   * ピースを削除
   */
  private removePiece(piece: Piece): void {
    this.scene.matter.world.remove(piece.body);
    piece.graphics.destroy();
    piece.text.destroy();
    this.pieces.delete(piece.bodyId);
  }

  /**
   * ペアキー生成（IDの小さい方を先に）
   */
  private getPairKey(idA: number, idB: number): string {
    return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
  }

  /**
   * 毎フレーム処理: processedPairsをクリア（次フレーム用）
   */
  update(): void {
    // 衝突ペア記録をクリア（毎フレームリセット）
    this.processedPairs.clear();
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    this.scene.matter.world.off('collisionstart', this.handleCollision, this);
  }
}

