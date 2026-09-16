import {
    _decorator,
    Component,
    Node,
    Sprite,
    SpriteFrame,
    Label,
    resources,
    instantiate,
    director,
    tween,
    Vec3,
} from 'cc';

import { LevelPassDataManager } from './LevelPassData';
const { ccclass, property } = _decorator;

/**
 * 一个小关的数据
 */
export interface LevelData {

    /**
     * 小关 ID
     */
    id: number;

    /**
     * 当前章节 ID
     */
    chapterId?: number;

    /**
     * 小关名称
     */
    name: string;

    /**
     * IconSprite 图片
     */
    iconPath: string;

    /**
     * 是否解锁
     */
    unlocked: boolean;

    /**
     * 通关星级
     *
     * 0 = 没有星
     * 1 = 一星
     * 2 = 两星
     * 3 = 三星
     */
    star: number;

    /**
     * 要进入的场景
     */
    target: string;
}

@ccclass('LevelItem')
export class LevelItem extends Component {

    /**
     * TitleLabel/Title
     */
    @property(Label)
    title: Label | null = null;

    /**
     * IconSprite
     */
    @property(Sprite)
    icon: Sprite | null = null;

    /**
     * LevelBorder
     */
    @property(Sprite)
    levelBorder: Sprite | null = null;

    /**
     * StarContainer
     */
    @property(Node)
    starContainer: Node | null = null;

    /**
     * UnlockNode
     */
    @property(Node)
    unlockNode: Node | null = null;

    /**
     * 当前关卡数据
     */
    private data: LevelData | null = null;

    onLoad() {

        // 根节点保持正常缩放
        this.node.setScale(1, 1, 1);

        // 点击事件
        this.node.on(
            Node.EventType.TOUCH_END,
            this.onLevelClick,
            this
        );
    }

    onDestroy() {

        this.node.off(
            Node.EventType.TOUCH_END,
            this.onLevelClick,
            this
        );

        if (this.icon) {
            tween(this.icon.node).stop();
        }

        if (this.title) {
            tween(this.title.node).stop();
        }

        tween(this.node).stop();
    }

    /**
     * 设置关卡数据
     */
    public setData(data: LevelData) {

        this.data = data;

        // 设置标题
        if (this.title) {
            this.title.string = data.name;
        }

        // 加载 Icon
        this.loadIcon(data.iconPath);

        // 设置解锁状态
        this.updateUnlockState();

        // 设置星级
        this.updateStars();
    }

    /**
     * 加载关卡 Icon
     */
    private loadIcon(path: string) {

        if (!this.icon) {
            console.error(
                `[LevelItem] ${this.node.name} 没有绑定 IconSprite`
            );
            return;
        }

        resources.load(
            path + '/spriteFrame',
            SpriteFrame,
            (err, spriteFrame) => {

                if (err) {
                    console.error(
                        `[LevelItem] 关卡图标加载失败：${path}`,
                        err
                    );
                    return;
                }

                if (!spriteFrame) {
                    return;
                }

                if (
                    !this.node ||
                    !this.node.isValid
                ) {
                    return;
                }

                this.icon!.spriteFrame =
                    spriteFrame;
            }
        );
    }

    /**
     * 设置解锁状态
     */
    private updateUnlockState() {

        if (!this.data) {
            return;
        }

        const unlocked = this.data.unlocked;

        // 解锁遮罩
        if (this.unlockNode) {
            this.unlockNode.active = !unlocked;
            this.icon.grayscale = !unlocked;
           
        }

        // 已解锁才显示星级
        if (this.starContainer) {
            this.starContainer.active = unlocked;
        }

        // Border 始终显示
        if (this.levelBorder) {
            this.levelBorder.grayscale = !unlocked;
        }
    }

    /**
     * 设置星级
     */
    private updateStars() {

        if (!this.starContainer) {
            return;
        }

        const starCount = this.data?.star ?? 0;

        // StarContainer 下现有的第一个 Star 
        const starGrid = this.starContainer.getChildByName('StarGrid'); 
        if (!starGrid) { 
            console.error( '[LevelItem] StarContainer 下没有找到 StarGrid！' ); 
            return; 
        } 
        // StarGrid 下的第一个 Sprite 作为模板 
        const starTemplate = starGrid.children[0];
        if (!starTemplate) {
            console.error( '[LevelItem] StarContainer 下没有 Star 模板节点！' ); 
            return; 
        } 
        // 先删除之前创建出来的 Star 
        const children = [...starGrid.children]; 
        for (let i = 1; i < children.length; i++) { 
            children[i].destroy();
        } 
        // 模板自己先隐藏 
        starTemplate.active = false; 

        console.log(
            `[LevelItem] ${starCount?? 0} 星级：${starCount}`
        );
        // 创建星星
        for (let i = 0; i < starCount; i++) { 
            const star = instantiate(starTemplate);
            starGrid.addChild(star); 
            star.active = true; 
        }
       
    }

    /**
     * 点击关卡
     */
    private onLevelClick(event: Event) {

        event.propagationStopped = true;

        if (!this.data) {
            return;
        }

        // 未解锁
        if (!this.data.unlocked) {

            console.log(
                `[LevelItem] 关卡未解锁：${this.data.name}`
            );

            // 后面如果需要做“提前解锁”弹窗，观看广告,回调解锁
            // 可以在这里处理。
            return;
        }

        // 已解锁
        console.log(
            `[LevelItem] 进入关卡：${this.data.name}`
        );

        console.log(
            `[LevelItem] target：${this.data.target}`
        );

        if (this.data.target) {

            // 存入传参数据
            LevelPassDataManager.setData({
                target: this.data.target,
                levelName: this.data.name,
                star: this.data.star,
                levelId: this.data.id,
                chapterId: this.data.chapterId,
            });

            // 跳转游戏场景
            director.loadScene('Level');   // 改成你的实际场景名
        }
    }

    /**
     * LevelItem 入场动画
     *
     * 由 ChapterItem 在 480ms 后调用
     */
    public playShowAnimation() {

        // Icon 动画
        if (this.icon) {

            tween(this.icon.node)
                .stop()
                .set({
                    scale: new Vec3(
                        0.75,
                        0.75,
                        1
                    )
                })
                .to(
                    0.22,
                    {
                        scale: new Vec3(
                            1.08,
                            1.08,
                            1
                        )
                    }
                )
                .to(
                    0.12,
                    {
                        scale: new Vec3(
                            1,
                            1,
                            1
                        )
                    }
                )
                .start();
        }

        // 标题动画
        if (this.title) {

            tween(this.title.node)
                .stop()
                .set({
                    scale: new Vec3(
                        0.8,
                        0.8,
                        1
                    )
                })
                .to(
                    0.18,
                    {
                        scale: new Vec3(
                            1.05,
                            1.05,
                            1
                        )
                    }
                )
                .to(
                    0.1,
                    {
                        scale: new Vec3(
                            1,
                            1,
                            1
                        )
                    }
                )
                .start();
        }
    }

    /**
     * 设置解锁状态
     *
     * 后面如果做自动解锁可以直接调用
     */
    public setUnlocked(unlocked: boolean) {

        if (!this.data) {
            return;
        }

        this.data.unlocked = unlocked;

        this.updateUnlockState();

        this.updateStars();
    }

    /**
     * 设置星级
     */
    public setStar(star: number) {

        if (!this.data) {
            return;
        }

        // 星级不再固定为 3 颗，可以按关卡真实配置展示
        this.data.star = Math.max(
            0,
            star
        );

        this.updateStars();
    }

    /**
     * 获取数据
     */
    public getData(): LevelData | null {
        return this.data;
    }

    /**
     * 获取关卡 ID
     */
    public getLevelId(): number {

        if (!this.data) {
            return 0;
        }

        return this.data.id;
    }

    /**
     * 获取关卡名称
     */
    public getLevelName(): string {

        if (!this.data) {
            return '';
        }

        return this.data.name;
    }

    /**
     * 是否解锁
     */
    public isUnlocked(): boolean {

        if (!this.data) {
            return false;
        }

        return this.data.unlocked;
    }

    /**
     * 获取星级
     */
    public getStar(): number {

        if (!this.data) {
            return 0;
        }

        return this.data.star;
    }
}