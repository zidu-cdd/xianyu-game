
import {
    _decorator,
    Component,
    Prefab,
    instantiate,
} from 'cc';

import { LevelPassDataManager } from './LevelPassData';
import { levelCatalog } from './LevelCatalog';

import {
    ChapterItem,
} from './ChapterItem';

const { ccclass, property } = _decorator;

@ccclass('LevelSelect')
export class LevelSelect extends Component {

    /**
     * ChapterNode.prefab
     */
    @property(Prefab)
    chapterPrefab: Prefab | null = null;

    start() {
        this.createChapters();
    }

    /**
     * 创建所有章节
     */
    private createChapters() {

        if (!this.chapterPrefab) {
            console.error(
                '[LevelSelect] chapterPrefab 没有设置！'
            );
            return;
        }

        const chapterList = this.getChapterData();
        LevelPassDataManager.setLevelCatalog(chapterList);

        for (const data of chapterList) {

            // 创建 ChapterNode
            const chapterNode = instantiate(
                this.chapterPrefab
            );

            // 加入 Content
            //
            // Content 上如果有 Layout，
            // 由 Layout 自动排列 ChapterNode
            this.node.addChild(chapterNode);

            // 创建出来先隐藏
            chapterNode.active = false;

            // 获取 ChapterItem
            const chapterItem =
                chapterNode.getComponent(ChapterItem);

            if (!chapterItem) {
                console.error(
                    '[LevelSelect] ChapterNode.prefab 上没有找到 ChapterItem.ts'
                );
                continue;
            }

            // 设置数据
            chapterItem.setData(data);

            // 480ms 后显示
            this.scheduleOnce(() => {

                if (
                    !chapterNode ||
                    !chapterNode.isValid
                ) {
                    return;
                }

                chapterNode.active = true;

                // 播放章节显示动画
                chapterItem.playShowAnimation();

            }, 0.48);
        }

        console.log(
            `[LevelSelect] 章节创建完成，共 ${chapterList.length} 个`
        );
    }

    /**
     * 章节数据
     *
     * 后面如果增加章节，
     * 直接继续往这里添加即可。
     */
    private getChapterData() {
        const chapterList = levelCatalog;
        const allLevels: Array<{ target?: string, unlocked?: boolean, star?: number }> = [];

        for (const chapter of chapterList) {
            for (const level of chapter.levels) {
                allLevels.push(level);
            }
        }

        LevelPassDataManager.applyProgressToLevels(allLevels);
        LevelPassDataManager.setLevelCatalog(chapterList);

        return chapterList;
    }
}
