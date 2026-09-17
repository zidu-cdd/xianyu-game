export interface ItemConfig {
    name: string;
    /** 关卡弹窗和业务接口使用的图标。 */
    iconPath: string;
    /** 通用道具展示图标，例如图鉴使用。 */
    displayIconPath: string;
    /** Profile 页面专用道具图标，路径可单独维护。 */
    profileIconPath: string;
    requiredCount: number;
}

export const ITEM_CONFIGS: Record<string, ItemConfig> = {
    Magnifier: {
        name: '放大镜',
        iconPath: 'Level/Props1',
        displayIconPath: 'Level/Magnifier',
        profileIconPath: 'Profile/Mirror',
        requiredCount: 1,
    },
    PassCleaning: {
        name: '通关清理',
        iconPath: 'Level/Props1',
        displayIconPath: 'Level/PassCleaning',
        profileIconPath: 'Profile/DaoScroll',
        requiredCount: 1,
    },
};

/**
 * 图鉴总道具列表。
 * 数组长度代表图鉴总数；即使库存数量为 0，也会生成未获得道具。
 * 后续新增道具时，同时在 ITEM_CONFIGS 中补充对应配置。
 */
export const COLLECTION_ITEM_IDS: string[] = [
    'Magnifier',
    'PassCleaning',
    'Item3',
    'Item4',
    'Item5',
    'Item6',
    'Item7',
    'Item8',
    'Item9',
    'Item10',
];

export const ITEM_STORAGE_KEY = 'xianyu_global_item_counts_v1';

export function loadItemCounts(): Record<string, number> {
    const storage = (globalThis as any).cc?.sys?.localStorage
        ?? (typeof localStorage !== 'undefined' ? localStorage : null);

    if (!storage) {
        return {};
    }

    try {
        const raw = storage.getItem(ITEM_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        const counts: Record<string, number> = {};
        Object.keys(ITEM_CONFIGS).forEach((id) => {
            counts[id] = Math.max(0, Math.floor(Number(parsed[id]) || 0));
        });
        return counts;
    } catch (error) {
        console.warn('[ItemData] 读取道具数量失败:', error);
        return {};
    }
}