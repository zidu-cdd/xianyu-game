import {
    _decorator,
    Component,
    Label,
    Node,
    Sprite,
    director,
    tween,
    Vec3,
    Color,
} from 'cc';

import { LevelClearedData } from './PopupTypes';

const { ccclass, property } = _decorator;

@ccclass('LevelCleared')
export class LevelCleared extends Component {

    @property(Label)
    levelLabel: Label | null = null;

    @property(Label)
    scoreLabel: Label | null = null;

    /**
     * StarContainer
     *   └── StarGrid
     *       ├── Star1
     *       ├── Star2
     *       └── Star3
     */
    @property(Node)
    starContainer: Node | null = null;

    /**
     * 返回选关按钮
     */
    @property(Node)
    backSelect: Node | null = null;

    protected onLoad(): void {
        const backSelectNode = this.backSelect ?? this.node.getChildByName('BackSelect');
        if (backSelectNode && backSelectNode.isValid) {
            backSelectNode.on(Node.EventType.TOUCH_END, this.onBackSelect, this);
        }
    }

    protected onDestroy(): void {
        const backSelectNode = this.backSelect ?? this.node.getChildByName('BackSelect');
        if (backSelectNode && backSelectNode.isValid) {
            backSelectNode.off(Node.EventType.TOUCH_END, this.onBackSelect, this);
        }
    }

    /**
     * 设置本次关卡结果
     */
    public setData(data: LevelClearedData): void {

        if (this.levelLabel) {
            this.levelLabel.string = `${data.name}`;
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = `+${data.score}修为！`;
        }

        this.updateStars(data.star);
    }

    private onBackSelect(): void {
        director.loadScene('LevelSelect');
    }


    /**
     * 更新星级
     */
    private updateStars(star: number): void {

        if (!this.starContainer) {
            return;
        }

        const starCount = Math.max(
            0,
            Math.min(3, Math.floor(star))
        );

        const starNodes = this.getStarNodes();

        for (let i = 0; i < starNodes.length; i++) {
            const starNode = starNodes[i];

            if (!starNode) {
                continue;
            }

            const sprite = starNode.getComponent(Sprite);
            const shouldShow = i < starCount;
            starNode.setScale(1, 1, 1);

            if (sprite) {
                const originalColor = sprite.color.clone();
                sprite.color = new Color(originalColor.r, originalColor.g, originalColor.b, 0);
            }

            if (shouldShow) {
                starNode.active = true;
                starNode.setScale(0.5, 0.5, 1);

                tween(starNode)
                    .delay(i * 0.12)
                    .call(() => {
                        if (sprite) {
                            sprite.color = new Color(sprite.color.r, sprite.color.g, sprite.color.b, 255);
                        }
                    })
                    .to(0.12, { scale: new Vec3(1.15, 1.15, 1) }, { easing: 'backOut' })
                    .to(0.08, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                    .start();

                if (sprite) {
                    tween(sprite)
                        .to(0.12, { color: new Color(sprite.color.r, sprite.color.g, sprite.color.b, 255) })
                        .start();
                }
            } else {
                starNode.active = false;
            }
        }
    }


    /**
     * 获取 StarContainer 下实际的星星节点。
     *
     * 如果你的结构是：
     * StarContainer
     *   └── StarGrid
     *       ├── Star
     *       ├── Star
     *       └── Star
     * 会自动找到 StarGrid 的子节点。
     */
    private getStarNodes(): Node[] {

        const starGrid = this.starContainer?.getChildByName('StarGrid');

        if (starGrid) {
            return starGrid.children;
        }

        return this.starContainer?.children ?? [];
    }
}
