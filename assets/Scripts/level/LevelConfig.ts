// LevelConfig.ts
export interface TargetConfig {
    id: string;                     // 唯一ID
    spritePath: string;             // 场景中物品图片路径
    iconPath: string;               // 底部圆圈用的小图标
    pos: { x: number, y: number };  // 场景中的位置（相对 ClickLayer）
    clickSize?: { w: number, h: number }; // 可选，点击热区
    isTarget?: boolean;             // 可选，默认 true；false 表示这是交互元素，不参与通关计数
    hidden?: boolean;               // 可选，默认 false；true 表示创建时隐藏
}

export interface LevelConfig {
    levelId: number;                // 第几关
    levelName: string;              // 关卡名称（如「凡尘重逢」）
    star: number;                   // 星级（决定 SlotItem 数量）
    bgPath: string;                 // 背景图路径
    targets: TargetConfig[];        // 本关所有通关物品
}