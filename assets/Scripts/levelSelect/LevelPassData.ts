/**
 * 选关场景 → 游戏场景 传参用
 */
export interface LevelPassData {
    /** 对应 resources/Level/ 下的文件夹名，例如 Level1-1 */
    target: string;
    /** 关卡显示名称，例如 LV1.凡尘匿迹 */
    levelName: string;
    /** 星级（决定底部 Slot 数量） */
    star: number;
    /** 小关 ID */
    levelId: number;
    /** 当前章节 ID */
    chapterId?: number;
}

export interface LevelProgressState {
    star: number;
    unlocked: boolean;
}

interface LevelCatalogItem {
    chapterId: number;
    levelId: number;
    target: string;
    name: string;
    star: number;
}

export class LevelPassDataManager {
    private static _data: LevelPassData | null = null;
    private static readonly STORAGE_KEY = 'xianyu_level_progress_v1';
    private static _levelCatalog: LevelCatalogItem[] = [];

    static setData(data: LevelPassData) {
        this._data = data;
    }

    static get data(): LevelPassData | null {
        return this._data;
    }

    /** 资源目录名 */
    static get levelKey(): string {
        return this._data?.target || 'Level1-1';
    }

    static clear() {
        this._data = null;
    }

    static setLevelCatalog(chapters: Array<{ id: number; levels: Array<{ id: number; target?: string; name?: string; star?: number }> }>) {
        const items: LevelCatalogItem[] = [];

        for (const chapter of chapters) {
            for (const level of chapter.levels) {
                if (!level.target) {
                    continue;
                }

                items.push({
                    chapterId: chapter.id,
                    levelId: level.id,
                    target: level.target,
                    name: level.name ?? '',
                    star: level.star ?? 0,
                });
            }
        }

        this._levelCatalog = items;
    }

    static getNextLevelData(): LevelPassData | null {
        const current = this._data;
        if (!current) {
            return null;
        }

        const currentIndex = this._levelCatalog.findIndex(item => {
            if (item.target === current.target) {
                return true;
            }

            return item.chapterId === current.chapterId && item.levelId === current.levelId;
        });

        if (currentIndex < 0) {
            return null;
        }

        const next = this._levelCatalog[currentIndex + 1];
        if (!next) {
            return null;
        }

        return {
            target: next.target,
            levelName: next.name,
            star: next.star,
            levelId: next.levelId,
            chapterId: next.chapterId,
        };
    }

    static loadProgress(): Record<string, LevelProgressState> {
        const storage = (globalThis as any).cc?.sys?.localStorage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
        if (!storage) {
            return {};
        }

        const raw = storage.getItem(this.STORAGE_KEY);
        if (!raw) {
            return {};
        }

        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            console.warn('[LevelPassDataManager] 读取关卡进度失败，已忽略缓存。', error);
            return {};
        }
    }

    static getSavedStar(levelKey: string): number {
        const progress = this.loadProgress();
        const saved = progress[levelKey];
        return Math.max(0, Math.floor(saved?.star ?? 0));
    }

    static saveProgress(levelKey: string, star: number, unlocked: boolean = true) {
        const storage = (globalThis as any).cc?.sys?.localStorage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
        if (!storage) {
            return;
        }

        const progress = this.loadProgress();
        const nextStar = Math.max(0, Math.floor(star || 0));

        progress[levelKey] = {
            star: nextStar,
            unlocked: unlocked || progress[levelKey]?.unlocked || false,
        };

        storage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    }

    static applyProgressToLevels(levels: Array<{ target?: string, unlocked?: boolean, star?: number }>) {
        const progress = this.loadProgress();

        for (const level of levels) {
            if (!level.target) {
                continue;
            }

            const saved = progress[level.target];
            if (!saved) {
                continue;
            }

            level.unlocked = true;
            level.star = Math.max(level.star ?? 0, saved.star);
        }

        for (let i = 0; i < levels.length; i++) {
            const level = levels[i];
            if (!level.target) {
                continue;
            }

            const saved = progress[level.target];
            if (!saved) {
                continue;
            }

            const nextLevel = levels[i + 1];
            if (nextLevel) {
                nextLevel.unlocked = true;
            }
        }
    }
}