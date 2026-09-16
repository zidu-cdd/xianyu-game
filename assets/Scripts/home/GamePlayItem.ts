import {
    _decorator,
    Component,
    Node,
    Sprite,
    SpriteFrame,
    Label,
    resources,
    tween,
    Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

export interface GamePlayData {

    /**
     * true  = 当前选中
     * false = 当前未选中
     */
    active: boolean;

    iconPath: string;

    name: string;

    position: {
        x: number;
        y: number;
    };

    target: string;
}

@ccclass('GamePlaytem')
export class GamePlaytem extends Component {

    @property(Sprite)
    icon: Sprite | null = null;

    @property(Node)
    effect: Node | null = null;

    /**
     * 当前玩法数据
     */
    private data: GamePlayData | null = null;

    /**
     * GamePlay 管理器
     */
    private manager: any = null;

    onLoad() {

        // Effect 初始隐藏
        if (this.effect) {
            this.effect.active = false;
        }

        // 根节点保持正常缩放
        this.node.setScale(1, 1, 1);

        // 点击事件
        this.node.on(
            Node.EventType.TOUCH_END,
            this.onItemClick,
            this
        );
    }

    onDestroy() {

        this.node.off(
            Node.EventType.TOUCH_END,
            this.onItemClick,
            this
        );

        // 停止动画
        if (this.icon) {
            tween(this.icon.node).stop();
        }



        if (this.effect) {
            tween(this.effect).stop();
        }
    }

    /**
     * 设置 GamePlay 管理器
     */
    public setManager(manager: any) {
        this.manager = manager;
    }

    /**
     * 设置玩法数据
     */
    public setData(data: GamePlayData) {

        this.data = data;

        
        // 加载 Icon
        this.loadIcon(data.iconPath);

        // 设置选中状态
        this.setSelected(data.active);

        // 注意：
        // 这里不播放显示动画。
        //
        // GamePlay 会等待 480ms 后
        // 再调用 playShowAnimation()
    }

    /**
     * 加载 Icon
     */
    private loadIcon(path: string) {

        if (!this.icon) {
            console.error(
                `[GamePlaytem] ${this.node.name} 没有绑定 Icon`
            );
            return;
        }

        resources.load(
            path + '/spriteFrame',
            SpriteFrame,
            (err, spriteFrame) => {

                if (err) {
                    console.error(
                        `[GamePlaytem] 图标加载失败：${path}`,
                        err
                    );
                    return;
                }

                if (!spriteFrame) {
                    return;
                }

                // 防止节点已经被销毁
                if (!this.node || !this.node.isValid) {
                    return;
                }

                this.icon!.spriteFrame = spriteFrame;
            }
        );
    }

    /**
     * 480ms 后由 GamePlay 调用
     *
     * 播放玩法的显示动画
     */
    public playShowAnimation() {

        // Icon 入场动画
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

    }

    /**
     * 点击玩法
     */
    private onItemClick() {

        if (!this.data) {
            return;
        }

        if (!this.manager) {
            console.error(
                '[GamePlaytem] 没有找到 GamePlay 管理器'
            );
            return;
        }

        // 所有玩法都可以点击
        this.manager.selectItem(this);
    }

    /**
     * 设置选中状态
     *
     * active：
     * true  = 选中
     * false = 未选中
     */
    public setSelected(selected: boolean) {

        if (!this.data) {
            return;
        }

        // active 只表示选中状态
        this.data.active = selected;

        if (!this.effect) {
            return;
        }

        // 停止之前动画
        tween(this.effect).stop();

        if (selected) {

            // 显示 Effect
            this.effect.active = true;

            // 初始缩放
            this.effect.setScale(
                0.7,
                0.7,
                1
            );

            // Effect 放大动画
            tween(this.effect)
                .to(
                    0.2,
                    {
                        scale: new Vec3(
                            1.08,
                            1.08,
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

        } else {

            // 隐藏 Effect
            this.effect.active = false;

            // 恢复缩放
            this.effect.setScale(
                1,
                1,
                1
            );
        }
    }

    /**
     * 获取玩法名称
     */
    public getGameName(): string {

        if (!this.data) {
            return '';
        }

        return this.data.name;
    }

    /**
     * 获取玩法数据
     */
    public getData(): GamePlayData | null {
        return this.data;
    }

    /**
     * 是否选中
     */
    public isSelected(): boolean {

        if (!this.data) {
            return false;
        }

        return this.data.active;
    }
}