import {
    _decorator,
    Component,
    Prefab,
    Node,
    instantiate,
    director,
    tween,
    Vec3,
} from 'cc';

import { GamePlaytem, GamePlayData } from './GamePlayItem';

const { ccclass, property } = _decorator;

@ccclass('GamePlay')
export class GamePlay extends Component {

    @property(Prefab)
    gamePrefab: Prefab | null = null;

    /**
     * 场景中独立的 Start 按钮
     */
    @property(Node)
    startButton: Node | null = null;

    /**
     * 当前选中的玩法
     */
    private selectedItem: GamePlaytem | null = null;

    /**
     * 所有玩法
     */
    private itemList: GamePlaytem[] = [];

    start() {

        // Start 初始隐藏
        if (this.startButton) {
            this.startButton.active = false;

            this.startButton.on(
                Node.EventType.TOUCH_END,
                this.onStartClick,
                this
            );
        }

        this.createItems();
    }

    onDestroy() {

        if (this.startButton?.isValid) {
            this.startButton.off(
                Node.EventType.TOUCH_END,
                this.onStartClick,
                this
            );

            tween(this.startButton).stop();
        }
    }

    /**
     * 创建所有玩法
     */
    private createItems() {

        if (!this.gamePrefab) {
            console.error('[GamePlay] gamePrefab 没有设置！');
            return;
        }

        const dataList = this.getGamePlayData();

        this.itemList = [];

        for (const data of dataList) {

            // 创建玩法
            const itemNode = instantiate(this.gamePrefab);

            // 加入 GamePlay
            this.node.addChild(itemNode);

            // 设置位置
            itemNode.setPosition(
                data.position.x,
                data.position.y,
                0
            );

            // 创建后先隐藏
            itemNode.active = false;

            // 获取 GamePlaytem
            const item = itemNode.getComponent(GamePlaytem);

            if (!item) {
                console.error(
                    '[GamePlay] GamePlaytemItem.prefab 上没有找到 GamePlaytem.ts'
                );
                continue;
            }

            // 设置数据
            item.setData(data);

            // 设置管理器
            item.setManager(this);

            // 保存
            this.itemList.push(item);

            // 480ms 后显示
            this.scheduleOnce(() => {

                if (!itemNode || !itemNode.isValid) {
                    return;
                }

                itemNode.active = true;

                // 显示后播放入场动画
                item.playShowAnimation();

            }, 0.48);
        }

        console.log(
            `[GamePlay] 玩法创建完成，共 ${this.itemList.length} 个`
        );
    }

    /**
     * 选择玩法
     */
    public selectItem(item: GamePlaytem) {

        // 已经是当前选中的，不重复处理
        if (this.selectedItem === item) {
            return;
        }

        // 取消之前的选中状态
        if (this.selectedItem) {
            this.selectedItem.setSelected(false);
        }

        // 设置新的选中
        this.selectedItem = item;

        item.setSelected(true);

        // 显示 Start
        if (this.startButton) {

            // 只有第一次显示时启动 Loop
            if (!this.startButton.active) {
                this.startButton.active = true;

                this.playStartLoopAnimation();
            }
        }

        console.log(
            `[GamePlay] 当前选中：${item.getGameName()}`
        );
    }

    /**
     * Start 按钮循环动画
     */
    private playStartLoopAnimation() {

        if (!this.startButton) {
            return;
        }

        // 防止重复创建 Tween
        tween(this.startButton).stop();

        // 恢复初始缩放
        this.startButton.setScale(1, 1, 1);

        // 呼吸循环
        tween(this.startButton)
            .repeatForever(
                tween()
                    .to(
                        0.6,
                        {
                            scale: new Vec3(
                                1.08,
                                1.08,
                                1
                            )
                        }
                    )
                    .to(
                        0.6,
                        {
                            scale: new Vec3(
                                1,
                                1,
                                1
                            )
                        }
                    )
            )
            .start();
    }

    /**
     * 点击 Start
     */
    private onStartClick(event: Event) {

        event.propagationStopped = true;

        if (!this.selectedItem) {
            console.log(
                '[GamePlay] 当前没有选择玩法'
            );
            return;
        }

        const data = this.selectedItem.getData();

        if (!data) {
            return;
        }

        console.log(
            `[GamePlay] 开始玩法：${data.name}`
        );

        console.log(
            `[GamePlay] target：${data.target}`
        );

        // 点击反馈
        if (this.startButton) {

            // 停止呼吸动画
            tween(this.startButton).stop();

            tween(this.startButton)
                .set({
                    scale: new Vec3(
                        0.92,
                        0.92,
                        1
                    )
                })
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
                .call(() => {

                    // 点击动画结束后恢复 Loop
                    this.playStartLoopAnimation();

                })
                .start();
        }

        // 场景跳转
        if (data.target) {

            console.log(
                `[GamePlay] 准备进入：${data.target}`
            );

            // 后面接你的场景切换
            // SceneTransition.loadScene(data.target);
            director.loadScene('LevelSelect');   // 改成你的实际场景名
        }
    }

    /**
     * 获取当前选中的玩法
     */
    public getSelectedItem(): GamePlaytem | null {
        return this.selectedItem;
    }

    /**
     * 获取当前选中的玩法数据
     */
    public getSelectedData(): GamePlayData | null {

        if (!this.selectedItem) {
            return null;
        }

        return this.selectedItem.getData();
    }

    /**
     * 获取玩法配置
     */
    private getGamePlayData(): GamePlayData[] {

        return [
            {
                active: false,
                iconPath: 'Home/GamePlay1',
                name: '外门风波',
                position: {
                    x: -432,
                    y: -217
                },
                target: '1'
            },
            {
                active: false,
                iconPath: 'Home/GamePlay2',
                name: '秘境真相',
                position: {
                    x: 159,
                    y: -48
                },
                target: '2'
            },
            {
                active: false,
                iconPath: 'Home/GamePlay3',
                name: '凡尘求生',
                position: {
                    x: -303,
                    y: -747
                },
                target: '3'
            },
            {
                active: false,
                iconPath: 'Home/GamePlay4',
                name: '仙门初试',
                position: {
                    x: 440,
                    y: -527
                },
                target: '4'
            }
        ];
    }
}


