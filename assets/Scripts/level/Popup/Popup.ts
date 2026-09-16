import {
    _decorator,
    Component,
    Node,
    Prefab,
    instantiate,
    tween,
    Vec3,
    UIOpacity,
    UITransform,
} from 'cc';

import {
    PopupType,
    LevelClearedData,
    GettingData,
    InsufficientData,
    FailedData,
} from './PopupTypes';

import { LevelCleared } from './LevelCleared';
import { Getting } from './Getting';
import { Insufficient } from './Insufficient';
import { Failed } from './Failed';

const { ccclass, property } = _decorator;

@ccclass('Popup')
export class Popup extends Component {

    // =========================================================
    // Title
    // =========================================================

    @property(Node)
    titleLevelCleared: Node | null = null;

    @property(Node)
    titleGetting: Node | null = null;

    @property(Node)
    titleInsufficient: Node | null = null;

    @property(Node)
    titleFailed: Node | null = null;


    // =========================================================
    // Content 容器
    // =========================================================

    @property(Node)
    content: Node | null = null;


    // =========================================================
    // Content Prefab
    // =========================================================

    @property(Prefab)
    contentLevelCleared: Prefab | null = null;

    @property(Prefab)
    contentGetting: Prefab | null = null;

    @property(Prefab)
    contentInsufficient: Prefab | null = null;

    @property(Prefab)
    contentFailed: Prefab | null = null;


    // =========================================================
    // Buttons
    // =========================================================

    @property(Node)
    buttonsCleared: Node | null = null;

    @property(Node)
    buttonsGetting: Node | null = null;

    @property(Node)
    buttonsInsufficient: Node | null = null;

    @property(Node)
    buttonsFailed: Node | null = null;


    // =========================================================
    // Mask
    // =========================================================

    @property(Node)
    mask: Node | null = null;


    // 当前动态创建的 Content
    private currentContent: Node | null = null;

    // 当前弹窗对应的道具 itemId（如 Getting / Insufficient）
    private currentItemId: string | null = null;


    protected onLoad() {
        this.hideAll();

        this.node.active = false;
        this.node.setScale(0.8, 0.8, 1);

        if (this.mask) {
            this.setActive(this.mask, false);
            const opacity = this.mask.getComponent(UIOpacity);
            if (opacity) {
                opacity.opacity = 0;
            }
        }
    }


    // =========================================================
    // 对外显示接口
    // =========================================================

    public show(type: 'LevelCleared', data: LevelClearedData): void;
    public show(type: 'Getting', data: GettingData): void;
    public show(type: 'Insufficient', data: InsufficientData): void;
    public show(type: 'Failed', data: FailedData): void;

    public show(
        type: PopupType,
        data: LevelClearedData | GettingData | InsufficientData | FailedData
    ): void {

        this.currentItemId = this.getItemIdFromData(data);

        this.clearCurrentContent();
        this.hideAll();

        switch (type) {
            case 'LevelCleared':
                this.showLevelCleared(data as LevelClearedData);
                break;

            case 'Getting':
                this.showGetting(data as GettingData);
                break;

            case 'Insufficient':
                this.showInsufficient(data as InsufficientData);
                break;

            case 'Failed':
                this.showFailed(data as FailedData);
                break;
        }

        this.setActive(this.mask, true);
        this.node.active = true;

        this.playOpenAnimation();
    }

    // =========================================================
    // 闯关成功
    // =========================================================

    private showLevelCleared(data: LevelClearedData): void {

        this.setActive(this.titleLevelCleared, true);
        this.setActive(this.buttonsCleared, true);

        const node = this.createContent(this.contentLevelCleared);

        if (!node) {
            return;
        }

        const component = node.getComponent(LevelCleared);

        if (!component) {
            console.error(
                'LevelCleared.prefab 上没有找到 LevelCleared.ts'
            );
            return;
        }

        component.setData(data);
    }


    // =========================================================
    // 获取道具
    // =========================================================

    private showGetting(data: GettingData): void {

        this.setActive(this.titleGetting, true);
        this.setActive(this.buttonsGetting, true);

        const node = this.createContent(this.contentGetting);

        if (!node) {
            return;
        }

        const component = node.getComponent(Getting);

        if (!component) {
            console.error(
                'Getting.prefab 上没有找到 Getting.ts'
            );
            return;
        }

        component.setData(data);
    }


    // =========================================================
    // 道具不足
    // =========================================================

    private showInsufficient(data: InsufficientData): void {

        this.setActive(this.titleInsufficient, true);
        this.setActive(this.buttonsInsufficient, true);

        const node = this.createContent(this.contentInsufficient);

        if (!node) {
            return;
        }

        const component = node.getComponent(Insufficient);

        if (!component) {
            console.error(
                'Insufficient.prefab 上没有找到 Insufficient.ts'
            );
            return;
        }

        component.setData(data);
    }


    // =========================================================
    // 闯关失败
    // =========================================================

    private showFailed(data: FailedData): void {

        this.setActive(this.titleFailed, true);
        this.setActive(this.buttonsFailed, true);

        const node = this.createContent(this.contentFailed);

        if (!node) {
            return;
        }

        const component = node.getComponent(Failed);

        if (!component) {
            console.error(
                'Failed.prefab 上没有找到 Failed.ts'
            );
            return;
        }

        component.setData(data);
    }


    public getCurrentItemId(): string | null {
        return this.currentItemId;
    }

    private getItemIdFromData(data: LevelClearedData | GettingData | InsufficientData | FailedData): string | null {
        return 'itemId' in data ? data.itemId : null;
    }

    // =========================================================
    // 创建 Content Prefab
    // =========================================================

    private createContent(prefab: Prefab | null): Node | null {

        if (!prefab) {
            console.error('Popup Content Prefab 未设置');
            return null;
        }

        if (!this.content) {
            console.error('Popup 的 Content 节点未设置');
            return null;
        }

        const node = instantiate(prefab);

        node.parent = this.content;
        node.setPosition(0, 0, 0);

        this.currentContent = node;

        return node;
    }


    // =========================================================
    // 清理当前 Content
    // =========================================================

    private clearCurrentContent(): void {

        if (this.currentContent && this.currentContent.isValid) {
            this.currentContent.destroy();
        }

        this.currentContent = null;
    }


    // =========================================================
    // 隐藏所有标题和按钮
    // =========================================================

    private hideAll(): void {

        this.setActive(this.titleLevelCleared, false);
        this.setActive(this.titleGetting, false);
        this.setActive(this.titleInsufficient, false);
        this.setActive(this.titleFailed, false);

        this.setActive(this.buttonsCleared, false);
        this.setActive(this.buttonsGetting, false);
        this.setActive(this.buttonsInsufficient, false);
        this.setActive(this.buttonsFailed, false);

        this.setActive(this.mask, false);
    }


    private setActive(node: Node | null, active: boolean): void {
        if (node) {
            node.active = active;
        }
    }

    private getScreenHeight(): number {
        const parent = this.node.parent;
        const parentTransform = parent?.getComponent(UITransform);

        return parentTransform ? parentTransform.height : 720;
    }

    private getOrAddUIOpacity(node: Node): UIOpacity {
        const opacity = node.getComponent(UIOpacity);

        if (opacity) {
            return opacity;
        }

        return node.addComponent(UIOpacity);
    }


    // =========================================================
    // 打开动画
    // =========================================================

    private playOpenAnimation(): void {

        const screenHeight = this.getScreenHeight();
        const startY = screenHeight;
        const popupOpacity = this.getOrAddUIOpacity(this.node);

        this.node.setPosition(0, startY, 0);
        this.node.setScale(0.95, 0.95, 1);
        popupOpacity.opacity = 0;

        if (this.mask) {
            const opacity = this.getOrAddUIOpacity(this.mask);
            opacity.opacity = 0;
            this.setActive(this.mask, true);

            tween(opacity)
                .to(0.40, { opacity: 102 }, { easing: 'sineOut' })
                .start();
        }

        tween(this.node)
            .to(
                0.55,
                {
                    position: new Vec3(0, 267, 0),
                    scale: new Vec3(1, 1, 1),
                },
                {
                    easing: 'backOut',
                }
            )
            .start();

        tween(popupOpacity)
            .to(
                0.55,
                { opacity: 255 },
                { easing: 'backOut' }
            )
            .start();
    }


    // =========================================================
    // 关闭
    // =========================================================

    public close(): void {

        const screenHeight = this.getScreenHeight();
        const popupOpacity = this.getOrAddUIOpacity(this.node);
        const targetY = -screenHeight;

        if (this.mask) {
            const opacity = this.getOrAddUIOpacity(this.mask);

            tween(opacity)
                .delay(0.30)
                .to(0.70, { opacity: 0 }, { easing: 'sineIn' })
                .start();
        }

        tween(this.node)
            .to(
                0.15,
                {
                    position: new Vec3(0, 28, 0),
                    scale: new Vec3(1.03, 1.03, 1),
                },
                {
                    easing: 'sineOut',
                }
            )
            .delay(0.12)
            .to(
                0.55,
                {
                    position: new Vec3(0, targetY, 0),
                    scale: new Vec3(0.9, 0.9, 1),
                },
                {
                    easing: 'sineIn',
                }
            )
            .call(() => {

                this.currentItemId = null;
                this.clearCurrentContent();
                this.node.active = false;
                this.setActive(this.mask, false);

                if (this.mask) {
                    const opacity = this.getOrAddUIOpacity(this.mask);
                    opacity.opacity = 0;
                }
            })
            .start();

        tween(popupOpacity)
            .delay(0.27)
            .to(0.55, { opacity: 0 }, { easing: 'sineIn' })
            .start();
    }
}
