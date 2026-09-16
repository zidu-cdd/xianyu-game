import { _decorator, Component, Node, Sprite, SpriteFrame, resources, Animation } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('SlotItem')
export class SlotItem extends Component {

    @property(Sprite)
    iconSprite: Sprite = null!;      // 圆圈里的图标（可放在 Background 下）

    private index = 0;
    private isCollected = false;
    private iconPath: string | null = null;
    private backgroundAnimation: Animation | null = null;

    init(index: number, iconPath?: string) {
        this.index = index;
        this.isCollected = false;
        this.iconPath = iconPath ?? null;
        this.backgroundAnimation = this.node.getChildByName('Background')?.getComponent(Animation) || null;

        if (this.iconSprite) {
            this.iconSprite.node.active = false;
        }

        if (iconPath) {
            this.loadIcon(iconPath);
        }
    }

    private loadIcon(iconPath: string) {
        if (!this.iconSprite) {
            return;
        }

        this.iconPath = iconPath;

        resources.load(iconPath + '/spriteFrame', SpriteFrame, (err, sf) => {
            if (!err && this.iconSprite) {
                this.iconSprite.spriteFrame = sf;
                this.iconSprite.node.active = true;
            }
        });
    }

    /** 收集完成后设置图标 */
    setCollected(iconPath: string) {
        this.isCollected = true;
        this.loadIcon(iconPath);

        // Slot 的背景动画（prefab 里已经带了 Animation）
        if (this.backgroundAnimation) {
            this.backgroundAnimation.stop();
            this.backgroundAnimation.play();
        }
    }
}