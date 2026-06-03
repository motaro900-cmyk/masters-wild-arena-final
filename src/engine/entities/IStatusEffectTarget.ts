import * as PIXI from 'pixi.js';

export interface IStatusEffectTarget {
  destroyed: boolean;
  animTime: number;
  bodyContainer: PIXI.Container | null;
  bodySprite: PIXI.Sprite | null;
  config: any;
  addChild(...children: any[]): any;
  removeChild(...children: any[]): any;

  showStunEffect(): void;
  removeStunEffect(): void;
  showFreezeEffect(): void;
  removeFreezeEffect(): void;
  showPoisonEffect(): void;
  removePoisonEffect(): void;
  showBurnEffect(): void;
  removeBurnEffect(): void;
}
