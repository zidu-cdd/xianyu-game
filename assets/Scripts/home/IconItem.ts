
import {
    _decorator,
    Component,
    Sprite,
    SpriteFrame,
    Label,
    resources,
    Node,
    director,
    tween,
    Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

export interface IconItemData {
    type: 'level' | 'function';

    name: string;

    /**
     * resources 目录下的资源路径
     *
     * 例如：
     * assets/resources/Home/CheckIn.png
     *
     * 写：
     * Home/CheckIn
     */
    iconPath: string;

    /**
     * 点击后要进入的场景
     */
    target?: string;

    /**
     * 等级
     */
    level?: number;

    /**
     * 是否显示红点
     */
    redPoint?: boolean;
}

@ccclass('IconItem')
export class IconItem extends Component {

    // =========================================================
    // Inspector
    // =========================================================

    /**
     * Icon 图片
     */
    @property(Sprite)
    icon: Sprite | null = null;

    /**
     * 等级文字
     */
    @property(Label)
    levelLabel: Label | null = null;

    /**
     * 红点
     */
    @property(Node)
    redPoint: Node | null = null;


    // =========================================================
    // 内部变量
    // =========================================================

    /**
     * 当前 Item 数据
     */
    private data: IconItemData | null = null;

    /**
     * 防止异步加载旧资源覆盖新数据
     */
    private loadVersion = 0;

    /**
     * 点击锁
     */
    private clicking = false;


    // =========================================================
    // 生命周期
    // =========================================================

    onLoad() {

        /**
         * -----------------------------------------------------
         * 非常重要：
         *
         * IconItem 是 GridLayout 的直接子节点。
         *
         * 所以 IconItem 本身始终保持 active。
         *
         * 不能因为 Icon 图片还没有加载完成，
         * 就把整个 IconItem 设置成 false。
         *
         * 否则 GridLayout 可能会因为 active 子节点数量变化，
         * 重新计算布局，从而导致不同设备 / 不同行出现位置变化。
         * -----------------------------------------------------
         */
        this.node.active = true;


        /**
         * IconItem 本身永远保持 1 倍缩放。
         *
         * GridLayout 管理的是 IconItem，
         * 所以不要让 IconItem 自己做缩放动画。
         */
        this.node.setScale(
            1,
            1,
            1
        );


        /**
         * Icon 初始隐藏。
         */
        if (this.icon) {

            this.icon.node.active = false;

            this.icon.node.setScale(
                1,
                1,
                1
            );
        }


        /**
         * 红点初始隐藏。
         */
        if (this.redPoint) {

            this.redPoint.active = false;

            this.redPoint.setScale(
                1,
                1,
                1
            );
        }


        /**
         * 等级文字初始隐藏。
         */
        if (this.levelLabel) {

            this.levelLabel.node.active = false;
        }

        this.node.on(
            Node.EventType.TOUCH_END,
            this.onClick,
            this
        );
    }


    // =========================================================
    // 设置数据
    // =========================================================

    async setData(data: IconItemData) {

        this.data = data;


        /**
         * 当前加载版本。
         *
         * 防止异步加载过程中，
         * Item 被重新设置数据以后旧资源覆盖新资源。
         */
        const version = ++this.loadVersion;


        /**
         * 停止之前可能存在的动画。
         */
        this.stopAnimations();


        /**
         * -----------------------------------------------------
         * 恢复默认状态
         * -----------------------------------------------------
         *
         * 注意：
         *
         * 这里绝对不能：
         *
         * this.node.active = false;
         *
         * 因为 IconItem 是 GridLayout 的子节点。
         */


        /**
         * IconItem 永远 1 倍。
         */
        this.node.active = true;

        this.node.setScale(
            1,
            1,
            1
        );


        /**
         * Icon 隐藏。
         */
        if (this.icon) {

            this.icon.node.active = false;

            this.icon.node.setScale(
                1,
                1,
                1
            );

            this.icon.spriteFrame = null;
        }


        /**
         * 红点隐藏。
         */
        if (this.redPoint) {

            this.redPoint.active = false;

            this.redPoint.setScale(
                1,
                1,
                1
            );
        }


        /**
         * 等级隐藏。
         */
        if (this.levelLabel) {

            this.levelLabel.node.active = false;
        }


        // =====================================================
        // 等级
        // =====================================================

        this.updateLevel(data);


        // =====================================================
        // 加载 Icon
        // =====================================================

        try {

            const spriteFrame =
                await this.loadSpriteFrame(
                    data.iconPath
                );


            /**
             * 如果 Item 在加载过程中被重新设置数据，
             * 当前加载结果直接丢弃。
             */
            if (version !== this.loadVersion) {
                return;
            }


            /**
             * Item 已经销毁。
             */
            if (!this.isValid) {
                return;
            }


            /**
             * 没有设置 Icon。
             */
            if (!this.icon) {

                console.error(
                    `[IconItem] ${this.node.name} 没有设置 Icon Sprite`
                );

                return;
            }


            // =================================================
            // 设置 Icon
            // =================================================

            this.icon.spriteFrame =
                spriteFrame;


            /**
             * 显示 Icon。
             */
            this.icon.node.active = true;


            /**
             * Icon 动画开始之前，
             * 确保 Icon 本身从 0.78 开始。
             */
            this.icon.node.setScale(
                0.78,
                0.78,
                1
            );


            // =================================================
            // 红点
            // =================================================

            if (
                data.redPoint === true &&
                this.redPoint
            ) {

                /**
                 * 先计算红点位置。
                 */
                this.updateRedPointPosition();


                /**
                 * 再显示红点。
                 */
                this.redPoint.active = true;
            }


            // =================================================
            // Icon 出现动画
            // =================================================

            this.playShowAnimation();


            // =================================================
            // 红点动画
            // =================================================

            if (
                data.redPoint === true &&
                this.redPoint
            ) {

                this.playRedPointAnimation();
            }


            /**
             * Icon 加载成功。
             */
            console.log(
                `[IconItem] Icon 加载成功: ${data.iconPath}`
            );

        } catch (error) {

            console.error(
                `[IconItem] Icon 加载失败: ${data.iconPath}`,
                error
            );


            /**
             * 加载失败时：
             *
             * 不隐藏 IconItem，
             * 因为它需要继续占据 GridLayout 的位置。
             *
             * 这里只是不显示 Icon。
             */
            if (this.icon) {

                this.icon.node.active = false;
            }
        }
    }


    // =========================================================
    // 等级
    // =========================================================

    private updateLevel(
        data: IconItemData
    ) {

        if (!this.levelLabel) {
            return;
        }


        if (
            data.type === 'level' &&
            data.level !== undefined
        ) {

            this.levelLabel.string =
                `LV.${data.level}`;

            this.levelLabel.node.active = true;

        } else {

            this.levelLabel.node.active = false;
        }
    }


    // =========================================================
    // 红点位置
    // =========================================================

    private updateRedPointPosition() {

        if (!this.redPoint) {
            return;
        }


        /**
         * -----------------------------------------------------
         * 等 GridLayout 完成布局以后，
         * 再计算一次红点位置。
         *
         * 因为 setData() 执行时，
         * GridLayout 可能还没有给 Item 设置最终 position。
         * -----------------------------------------------------
         */
        this.scheduleOnce(() => {

            if (!this.isValid) {
                return;
            }

            if (!this.redPoint) {
                return;
            }

            /**
             * Item 当前在 Grid 中的位置。
             */
            const itemX =
                this.node.position.x;


            /**
             * 红点偏移。
             */
            const offsetX = 57;
            const offsetY = 77;


            /**
             * 根据 Item X 判断红点左右。
             *
             * 左边 Item：
             * 红点放右边。
             *
             * 右边 Item：
             * 红点放左边。
             */
            const redPointX =
                itemX < 0
                    ? offsetX
                    : -offsetX;


            this.redPoint.setPosition(
                redPointX,
                offsetY,
                0
            );

        }, 0);
    }


    // =========================================================
    // Icon 出现动画
    // =========================================================

    private playShowAnimation() {

        if (!this.icon) {
            return;
        }


        const iconNode =
            this.icon.node;


        /**
         * 停止之前的 Icon 动画。
         */
        tween(iconNode).stop();


        /**
         * -----------------------------------------------------
         * 注意：
         *
         * 这里动画的是 iconNode，
         * 不是 this.node。
         *
         * this.node = IconItem
         * iconNode  = IconImg
         *
         * 所以 GridLayout 管理的 IconItem
         * 始终保持 Scale = 1。
         * -----------------------------------------------------
         */


        /**
         * 初始缩小。
         */
        iconNode.setScale(
            0.78,
            0.78,
            1
        );


        /**
         * 弹出：
         *
         * 0.78
         *   ↓
         * 1.08
         *   ↓
         * 1.00
         */
        tween(iconNode)
            .to(
                0.20,
                {
                    scale: new Vec3(
                        1.08,
                        1.08,
                        1
                    ),
                },
                {
                    easing: 'backOut',
                }
            )
            .to(
                0.10,
                {
                    scale: new Vec3(
                        1,
                        1,
                        1
                    ),
                },
                {
                    easing: 'sineOut',
                }
            )
            .call(() => {

                /**
                 * 强制恢复最终状态。
                 *
                 * 防止因为动画、
                 * 中断或浮点数导致最终 Scale 不是 1。
                 */
                if (
                    this.isValid &&
                    this.icon
                ) {

                    this.icon.node.setScale(
                        1,
                        1,
                        1
                    );
                }

            })
            .start();
    }


    // =========================================================
    // 红点动画
    // =========================================================

    private playRedPointAnimation() {

        if (!this.redPoint) {
            return;
        }


        const redPoint =
            this.redPoint;


        /**
         * 停止之前动画。
         */
        tween(redPoint).stop();


        /**
         * 从 0 开始。
         */
        redPoint.setScale(
            0,
            0,
            1
        );


        /**
         * 红点弹出。
         */
        tween(redPoint)

            /**
             * 0 → 1.18
             */
            .to(
                0.16,
                {
                    scale: new Vec3(
                        1.18,
                        1.18,
                        1
                    ),
                },
                {
                    easing: 'backOut',
                }
            )

            /**
             * 1.18 → 1
             */
            .to(
                0.10,
                {
                    scale: new Vec3(
                        1,
                        1,
                        1
                    ),
                },
                {
                    easing: 'sineOut',
                }
            )

            /**
             * 停留。
             */
            .delay(0.7)

            /**
             * 呼吸放大。
             */
            .to(
                0.75,
                {
                    scale: new Vec3(
                        1.08,
                        1.08,
                        1
                    ),
                },
                {
                    easing: 'sineInOut',
                }
            )

            /**
             * 呼吸恢复。
             */
            .to(
                0.75,
                {
                    scale: new Vec3(
                        1,
                        1,
                        1
                    ),
                },
                {
                    easing: 'sineInOut',
                }
            )

            .union()

            .repeatForever()

            .start();
    }


    // =========================================================
    // 点击动画
    // =========================================================

    onClick() {

        if (!this.data) {
            return;
        }


        /**
         * 防止连续点击。
         */
        if (this.clicking) {
            return;
        }


        if (!this.icon) {
            return;
        }


        this.clicking = true;


        console.log(
            `[IconItem] 点击: ${this.data.name}`,
            `target: ${this.data.target}`
        );


        const iconNode =
            this.icon.node;


        /**
         * 停止当前 Icon 出现动画。
         */
        tween(iconNode).stop();


        /**
         * 点击缩放。
         *
         * 注意：
         *
         * 还是只缩放 IconImg，
         * 不缩放 IconItem。
         */
        tween(iconNode)

            /**
             * 1 → 0.92
             */
            .to(
                0.07,
                {
                    scale: new Vec3(
                        0.92,
                        0.92,
                        1
                    ),
                }
            )

            /**
             * 0.92 → 1.04
             */
            .to(
                0.12,
                {
                    scale: new Vec3(
                        1.04,
                        1.04,
                        1
                    ),
                },
                {
                    easing: 'backOut',
                }
            )

            /**
             * 1.04 → 1
             */
            .to(
                0.08,
                {
                    scale: new Vec3(
                        1,
                        1,
                        1
                    ),
                }
            )

            .call(() => {

                /**
                 * 强制恢复。
                 */
                if (this.isValid) {

                    iconNode.setScale(
                        1,
                        1,
                        1
                    );
                }


                this.clicking = false;

                if (this.data?.target) {
                    director.loadScene(this.data.target);
                }

            })

            .start();
    }


    // =========================================================
    // SpriteFrame 加载
    // =========================================================

    private loadSpriteFrame(
        path: string
    ): Promise<SpriteFrame> {

        return new Promise(
            (resolve, reject) => {

                resources.load(
                    path + '/spriteFrame',
                    SpriteFrame,
                    (
                        err,
                        spriteFrame
                    ) => {

                        if (err) {

                            reject(err);

                            return;
                        }


                        if (!spriteFrame) {

                            reject(
                                new Error(
                                    `SpriteFrame 为空: ${path}`
                                )
                            );

                            return;
                        }


                        resolve(
                            spriteFrame
                        );
                    }
                );
            }
        );
    }


    // =========================================================
    // 停止动画
    // =========================================================

    private stopAnimations() {

        /**
         * Icon 动画。
         */
        if (
            this.icon?.node &&
            this.icon.node.isValid
        ) {

            tween(this.icon.node).stop();

            /**
             * 停止以后直接恢复 1。
             */
            this.icon.node.setScale(
                1,
                1,
                1
            );
        }


        /**
         * 红点动画。
         */
        if (
            this.redPoint &&
            this.redPoint.isValid
        ) {

            tween(this.redPoint).stop();

            this.redPoint.setScale(
                1,
                1,
                1
            );
        }


        /**
         * IconItem 本身永远保持 1。
         */
        if (this.node && this.node.isValid) {
            this.node.setScale(
                1,
                1,
                1
            );
        }
    }


    // =========================================================
    // 销毁
    // =========================================================

    onDestroy() {

        this.node.off(
            Node.EventType.TOUCH_END,
            this.onClick,
            this
        );

        /**
         * 让所有正在进行的异步加载结果失效。
         */
        this.loadVersion++;


        /**
         * 停止动画。
         */
        this.stopAnimations();
    }
}

