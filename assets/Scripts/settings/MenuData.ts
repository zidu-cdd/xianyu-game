import { SpriteFrame } from 'cc';

export enum MenuType {
    MAIN = 'main',
    IN_GAME = 'inGame',
}

export interface MenuItemData {
    id: string;
    disabled?: boolean;
    label: string;
    iconMain: SpriteFrame;
    onClick?: (data: MenuItemData) => void;
}

/** 每个场景显示哪些项、按什么顺序（存的是源数组的索引） */
export const MENU_ORDER: Record<MenuType, number[]> = {
    // 主界面：0,1,2,3,4 → 背景音乐、音效、永久免广告、客服、签到（5 项）
    [MenuType.MAIN]: [0, 1, 2, 3, 4],
    // 游戏内：0,1,5,6,7,3 → 背景音乐、音效、退出本关、继续闯关、重新挑战、客服（6 项）
    [MenuType.IN_GAME]: [0, 1, 5, 6, 7, 3],
};