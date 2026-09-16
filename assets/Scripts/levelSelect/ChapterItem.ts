import {
    _decorator,
    Component,
    Node,
    Prefab,
    instantiate,
    Sprite,
    SpriteFrame,
    resources,
    tween,
    Vec3,
} from 'cc';

import {
    LevelItem,
    LevelData,
} from './LevelItem';

const { ccclass, property } = _decorator;

/**
 * 一个章节的数据
 */
export interface ChapterData {

    /**
     * 章节 ID
     *
     * 例如：
     * 2 = 山野寻食
     * 4 = 消逝藏物
     */
    id: number;

    /**
     * 章节名称
     */
    name: string;

    /**
     * ChapterTitle/Background 的图片
     */
    titleBackgroundPath: string;

    /**
     * 当前章节的小关
     */
    levels: LevelData[];
}

@ccclass('ChapterItem')
export class ChapterItem extends Component {

    /**
     * ChapterTitle/Background
     */
    @property(Sprite)
    titleBackground: Sprite | null = null;

    /**
     * LevelGrid
     *
     * 这里挂的是你场景/Prefab 中已经存在的 Grid 节点。
     */
    @property(Node)
    levelGrid: Node | null = null;

    /**
     * LevelItem.prefab
     */
    @property(Prefab)
    levelPrefab: Prefab | null = null;

    /**
     * 当前章节数据
     */
    private data: ChapterData | null = null;

    onLoad() {

        // 根节点保持正常缩放
        this.node.setScale(1, 1, 1);
    }

    onDestroy() {

        tween(this.node).stop();
    }

    /**
     * 设置章节数据
     */
    public setData(data: ChapterData) {

        this.data = data;

        // 加载章节标题
        this.loadTitleBackground(
            data.titleBackgroundPath
        );

        // 创建小关
        this.createLevels(data.levels);
    }

    /**
     * 加载章节标题图片
     */
    private loadTitleBackground(path: string) {

        if (!this.titleBackground) {
            console.error(
                `[ChapterItem] ${this.node.name} 没有绑定 ChapterTitle/Background`
            );
            return;
        }

        resources.load(
            path + '/spriteFrame',
            SpriteFrame,
            (err, spriteFrame) => {

                if (err) {
                    console.error(
                        `[ChapterItem] 章节标题加载失败：${path}`,
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

                this.titleBackground!.spriteFrame =
                    spriteFrame;
            }
        );
    }

    /**
     * 创建当前章节的小关
     */
    private createLevels(
        levelList: LevelData[]
    ) {

        if (!this.levelGrid) {
            console.error(
                '[ChapterItem] levelGrid 没有设置！'
            );
            return;
        }

        if (!this.levelPrefab) {
            console.error(
                '[ChapterItem] levelPrefab 没有设置！'
            );
            return;
        }

        for (const data of levelList) {

            // 创建 LevelItem
            const levelNode = instantiate(
                this.levelPrefab
            );

            // 加入 LevelGrid
            //
            // 不设置 position。
            //
            // 由 LevelGrid 上的 Grid 组件
            // 自动计算位置。
            this.levelGrid.addChild(
                levelNode
            );

            // 创建后先隐藏
            levelNode.active = false;

            // 获取 LevelItem
            const levelItem =
                levelNode.getComponent(LevelItem);

            if (!levelItem) {
                console.error(
                    '[ChapterItem] LevelItem.prefab 上没有找到 LevelItem.ts'
                );
                continue;
            }

            // 设置数据
            levelItem.setData(data);

            // 480ms 后显示
            this.scheduleOnce(() => {

                if (
                    !levelNode ||
                    !levelNode.isValid
                ) {
                    return;
                }

                levelNode.active = true;

                // 播放入场动画
                levelItem.playShowAnimation();

            }, 0.48);
        }

        console.log(
            `[ChapterItem] ${this.data?.name ?? ''} 创建 ${levelList.length} 个小关`
        );
    }

    /**
     * ChapterNode 的显示动画
     */
    public playShowAnimation() {

        tween(this.node)
            .stop()
            .set({
                scale: new Vec3(
                    0.96,
                    0.96,
                    1
                )
            })
            .to(
                0.25,
                {
                    scale: new Vec3(
                        1.02,
                        1.02,
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

    /**
     * 获取章节数据
     */
    public getData(): ChapterData | null {
        return this.data;
    }

    /**
     * 获取章节 ID
     */
    public getChapterId(): number {

        if (!this.data) {
            return 0;
        }

        return this.data.id;
    }

    /**
     * 获取章节名称
     */
    public getChapterName(): string {

        if (!this.data) {
            return '';
        }

        return this.data.name;
    }
}