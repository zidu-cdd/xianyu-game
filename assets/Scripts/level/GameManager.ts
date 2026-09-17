import { _decorator, Component, Node, Prefab, instantiate, Sprite, Label, Vec3, UIOpacity, tween, NodePool, JsonAsset, UITransform, resources, SpriteFrame, director, Tween, ScrollView } from 'cc';
import { LevelConfig, TargetConfig } from './LevelConfig';
import { TargetItem } from './TargetItem';
import { SlotItem } from './SlotItem';
import { InteractiveElement } from './InteractiveElement';
import { Popup } from './Popup/Popup';


import { LevelPassDataManager, LevelPassData } from '../levelSelect/LevelPassData';
import { PopupType } from './Popup/PopupTypes';
import { MenuType } from '../settings/MenuData';
import { MenuPanel } from '../settings/MenuPanel';
import { ITEM_CONFIGS, ITEM_STORAGE_KEY, ItemConfig } from '../Profile/ItemData';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(Node)
    topHeaderLayer: Node = null!;          // TopHeaderLayer

    @property(Node)
    levelNameNode: Node = null!;           // LevelName 节点

    @property(Label)
    nameLabel: Label = null!;              // Name 文本

    @property(Label)
    levelLabel: Label = null!;             // Level 文本（Lv.X）

    @property(Node)
    starRatingLayer: Node = null!;              // 星级节点

    @property(Node)
    footerLayer: Node = null!;             // FooterLayer

    @property(ScrollView)
    slotScrollView: ScrollView = null!;    // SlotScrollView

    @property(Prefab)
    slotItemPrefab: Prefab = null!;        // SlotItem 预制体

    @property(Node)
    clickLayer: Node = null!;              // ClickLayer

    @property(Prefab)
    targetPrefab: Prefab = null!;          // Target 预制体

    @property(Sprite)
    bgSprite: Sprite = null!;              // 场景背景

    @property(Prefab)
    starPrefab: Prefab = null!;


    @property(Popup)
    popup: Popup = null!;              // 弹窗层

    @property(Prefab)
    popupLayerPrefab: Prefab = null!; // 设置弹窗预制体

    @property({ tooltip: '关卡超时时间（秒）' })
    public timeoutSeconds: number = 10;    // 关卡超时时间（秒）

    

    // 当前关卡数据
    private currentLevel: LevelConfig = null!;
    private foundCount = 0;
    private currentStarCount = 0;
    private lastVisibleStarCount = 0;
    private slotItems: SlotItem[] = [];
    private targetItems: TargetItem[] = [];
    private timeLeft = 0;
    private levelEnded = false;

    private _starPool: NodePool = new NodePool();
    private readonly itemConfigs: Record<string, ItemConfig> = ITEM_CONFIGS;

    private readonly inventory: Record<string, number> = {
        Magnifier: 0,
        PassCleaning: 0,
    };

    private settingsPopupLayer: Node | null = null;
    private settingsMenuPanel: MenuPanel | null = null;

    private readonly itemStorageKey = ITEM_STORAGE_KEY;

    start() {
        this.hideStarRating();
        this.loadPersistedItemCounts();

        const passData = LevelPassDataManager.data ?? {
            target: LevelPassDataManager.levelKey,
            levelName: '',
            star: 0,
            levelId: 0,
        };

        const levelKey = passData.target || LevelPassDataManager.levelKey;
        console.log('进入关卡：', passData.levelName || '默认关卡', levelKey);

        this.loadLevelByKey(levelKey, passData);
    }

    onLoad() {

        for (let i = 0; i < 30; i++) {
            const star = instantiate(this.starPrefab);
            this._starPool.put(star);
        }
    }
    /**
     * @param levelKey  例如 Level1-1（也兼容 Level1_1）
     * @param passData  从选关带过来的基础信息
     */
    loadLevelByKey(levelKey: string, passData?: LevelPassData) {

        // 约定资源目录：
        // resources/Level/Level1-1/config.json
        // resources/Level/Level1-1/BgNormal
        // resources/Level/Level1-1/Hat
        // resources/Level/Level1-1/HatIcon

        const levelKeys = this.getLevelKeyCandidates(levelKey);

        const tryLoadLevel = (index: number) => {
            const currentKey = levelKeys[index];
            const configPath = `Level/${currentKey}/config`;

            resources.load(configPath, (err: any, res: JsonAsset) => {
                if (err) {
                    if (index < levelKeys.length - 1) {
                        tryLoadLevel(index + 1);
                        return;
                    }

                    console.error(`关卡配置加载失败: ${configPath}`, err);
                    return;
                }

                const config = res.json as LevelConfig;

                // 仅在传入数据有效时才覆盖配置中的默认值，避免未传入关卡信息时覆盖掉 config.json 自带数据
                if (passData) {
                    if (passData.levelName) {
                        config.levelName = passData.levelName;
                    }
                    
                    if (passData.levelId > 0) {
                        config.levelId = passData.levelId;
                    }
                }

                // 自动拼接资源路径
                config.bgPath = `Level/${currentKey}/BgNormal`;
                config.targets.forEach(t => {
                    t.spritePath = this.normalizeLevelAssetPath(currentKey, t.spritePath || `Hat`);
                    t.iconPath = this.normalizeLevelAssetPath(currentKey, t.iconPath || `HatIcon`);
                });

                this.loadLevel(config);
            });
        };

        tryLoadLevel(0);
    }

    private getLevelKeyCandidates(levelKey: string): string[] {
        const uniqueCandidates = new Set<string>();
        const candidates = [levelKey];

        if (levelKey.includes('_')) {
            candidates.push(levelKey.replace(/_/g, '-'));
        }

        if (levelKey.includes('-')) {
            candidates.push(levelKey.replace(/-/g, '_'));
        }

        candidates.forEach(candidate => uniqueCandidates.add(candidate.trim()));

        return Array.from(uniqueCandidates);
    }

    private normalizeLevelAssetPath(levelKey: string, assetPath: string): string {
        const normalized = assetPath.replace(/\\/g, '/').trim();

        if (!normalized) {
            return `Level/${levelKey}`;
        }

        if (normalized === `Level/${levelKey}` || normalized.startsWith(`Level/${levelKey}/`)) {
            return normalized;
        }

        if (normalized.startsWith(`${levelKey}/`)) {
            return `Level/${normalized}`;
        }

        const trimmed = normalized.replace(/^\/+/, '');

        if (trimmed.startsWith('Level/')) {
            const rest = trimmed.substring('Level/'.length);
            return `Level/${levelKey}/${rest.replace(/^\/+/, '')}`;
        }

        return `Level/${levelKey}/${trimmed.replace(/^\/+/, '')}`;
    }

    update(dt: number) {
        if (this.levelEnded || this.timeLeft <= 0) {
            return;
        }

        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            console.log('[GameManager] 倒计时结束，触发关卡失败');
            this.onLevelFail();
        }
    }

    /** 加载关卡 */
    loadLevel(config: LevelConfig) {
        this.currentLevel = config;
        this.foundCount = 0;
        this.currentStarCount = 0;
        this.lastVisibleStarCount = 0;
        this.slotItems = [];
        this.targetItems = [];
        this.levelEnded = false;
        this.timeLeft = this.timeoutSeconds;        
        this.hideStarRating();        
        console.log('[GameManager] 加载关卡:', config.levelId, '超时时间:', this.timeoutSeconds);

        // 1. 设置顶部关卡信息  
        this.nameLabel.string = config.levelName.replace(/^Lv.\./i, '');
        this.levelLabel.string = `Lv.${config.levelId}`;

        // 2. 设置背景（可加简单淡入动画）
        this.setBackground(config.bgPath);

        // 3. 清空旧节点
        this.slotScrollView.content?.removeAllChildren();
        this.clickLayer.removeAllChildren();

        // 4. 根据星级创建底部 SlotItem，并提前加载对应图标
        this.createSlotItems(config.star, config.targets);

        // 5. 创建场景中的 Target
        this.createTargets(config.targets);
    }

    private hideStarRating(): void {
        if (!this.starRatingLayer) {
            return;
        }

        for (let i = 1; i <= 3; i++) {
            const starNode = this.starRatingLayer.getChildByName(`Star${i}`);
            if (starNode) {
                starNode.active = false;
                starNode.setScale(1, 1, 1);
            }
        }
    }

    private playStarAppearAnimation(starNode: Node, delay: number = 0): void {
        if (!starNode || !starNode.isValid) return;

        // 初始状态：小 + 透明
        starNode.active = true;
        starNode.setScale(0.4, 0.4, 1);

        const uiOpacity = starNode.getComponent(UIOpacity) ?? starNode.addComponent(UIOpacity);
        uiOpacity.opacity = 0;

        // 延迟 → 淡入 + 弹出
        tween(starNode)
            .delay(delay)
            .call(() => {
                tween(uiOpacity).to(0.14, { opacity: 255 }).start();
            })
            .to(0.14, { scale: new Vec3(1.25, 1.25, 1) }, { easing: 'backOut' })
            .to(0.08, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
            .start();
    }

    private updateStarRating(): void {
        if (!this.starRatingLayer || !this.currentLevel) {
            return;
        }

        const goalTargetCount = this.currentLevel.targets.filter(t => t.isTarget !== false).length;

        if (goalTargetCount <= 0) {
            this.currentStarCount = 0;
            this.lastVisibleStarCount = 0;
            this.hideStarRating();
            return;
        }

        // 关卡总共固定 3 颗星，按阶段性进度显示。
        // 例如：4 个通关 target 时，分别在 2 / 3 / 4 个目标完成时显示 Star1 / Star2 / Star3。
        const starThresholds = [
            Math.ceil(goalTargetCount / 3),
            Math.ceil((goalTargetCount * 2) / 3),
            goalTargetCount,
        ];

        let visibleStarCount = 0;

        if (this.foundCount >= starThresholds[2]) {
            visibleStarCount = 3;
        } else if (this.foundCount >= starThresholds[1]) {
            visibleStarCount = 2;
        } else if (this.foundCount >= starThresholds[0]) {
            visibleStarCount = 1;
        }

        this.currentStarCount = visibleStarCount;

        for (let i = 1; i <= 3; i++) {
            const starNode = this.starRatingLayer.getChildByName(`Star${i}`);

            if (!starNode) {
                continue;
            }

            if (i <= visibleStarCount) {
                if (i > this.lastVisibleStarCount) {
                    this.playStarAppearAnimation(starNode);
                } else {
                    starNode.active = true;
                }
            } else {
                starNode.active = false;
                starNode.setScale(1, 1, 1);
            }
        }

        this.lastVisibleStarCount = visibleStarCount;
    }

    /** 设置背景 + 简单动画 */
    private setBackground(path: string) {
        resources.load(path + '/spriteFrame', SpriteFrame, (err, sf) => {
            if (err) {
                console.error('背景加载失败', err);
                return;
            }
            this.bgSprite.spriteFrame = sf;

            // 简单淡入
            this.bgSprite.node.setScale(1.05, 1.05, 1);
            tween(this.bgSprite.node)
                .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: 'sineOut' })
                .start();
        });
    }

    /** 根据星级创建底部圆圈 */
    private createSlotItems(starCount: number, targets: TargetConfig[] = []) {
        for (let i = 0; i < starCount; i++) {
            const node = instantiate(this.slotItemPrefab);
            this.slotScrollView.content?.addChild(node);

            const slot = node.getComponent(SlotItem)!;
            const iconPath = targets[i]?.iconPath ?? null;
            slot.init(i, iconPath ?? undefined);
            this.slotItems.push(slot);
        }
    }

    /** 创建场景通关物品 */
    private createTargets(targets: TargetConfig[]) {
        targets.forEach((cfg, index) => {
            const node = instantiate(this.targetPrefab);
            this.clickLayer.addChild(node);

            // 设置位置（配置驱动）
            node.setPosition(cfg.pos.x, cfg.pos.y, 0);
            node.active = cfg.hidden !== true;

            const target = node.getComponent(TargetItem)!;
            target.init(
                cfg,
                index,
                this.onTargetFound.bind(this),
                cfg.isTarget === false ? this.onInteractiveElement.bind(this) : undefined,
            );
            this.targetItems.push(target);
        });
    }

    /** 找到物品回调 */
    private onTargetFound(target: TargetItem, slotIndex: number) {
        console.log('[GameManager] 发现目标:', target.node.name, 'slotIndex:', slotIndex, '当前已找到:', this.foundCount + 1);
        this.foundCount++;
        

        // 找到对应的 Slot
        const slot = this.slotItems[slotIndex];
        if (!slot) {
            console.warn('[GameManager] 找不到对应 Slot，slotIndex:', slotIndex);
            return;
        }

        this.scrollSlotIntoView(slot.node);

        // 飞入圆圈
        this.flyToSlot(target.node, slot.node, () => {
            // 飞入完成后
            target.node.active = false;
            slot.setCollected(target.config.iconPath);

            // 只有明确标记为通关目标的项才参与通关条件
            const goalTargetCount = this.currentLevel.targets.filter(t => t.isTarget !== false).length;
            if (this.foundCount >= goalTargetCount) {
                this.onLevelComplete();
            }
        });
    }

    private onInteractiveElement(node: Node, id: string): void {
        console.log('[GameManager] 交互元素点击:', node.name, 'id:', id);

        switch (id) {
            case 'stone':
                InteractiveElement.disappear(node);
                break;
            case 'interactiveAnimation':
                InteractiveElement.playAnimation(node);
                break;
            default:
                break;
        }
    }

    private scrollSlotIntoView(slotNode: Node): void {
        if (!this.slotScrollView) {
            console.warn('[GameManager] 未绑定 SlotScrollView，无法滚动到目标 Slot');
            return;
        }

        const slotIndex = this.slotItems.indexOf(slotNode.getComponent(SlotItem)!);
        const lastIndex = Math.max(this.slotItems.length - 1, 1);
        const percent = Math.max(0, Math.min(1, slotIndex / lastIndex));

        this.slotScrollView.scrollToPercentHorizontal(percent, 0.25, true);
    }

    /** 物品飞入底部圆圈 */
     private flyToSlot(itemNode: Node, slotNode: Node, onComplete: () => void) {
        tween(itemNode)
            .to(0.12, { scale: new Vec3(1.25, 1.25, 1) })
            .to(0.08, { scale: new Vec3(1, 1, 1) })
            .call(() => {
                const parent = itemNode.parent!;
                const worldPos = slotNode.worldPosition;
                const localPos = parent.inverseTransformPoint(new Vec3(), worldPos);

                const startLocal = itemNode.position.clone();
                const FLY_TIME = 1.2;

                const uiOpacity = itemNode.getComponent(UIOpacity)
                    ?? itemNode.addComponent(UIOpacity);
                tween(uiOpacity).to(0.06, { opacity: 0 }).start();
                // ★ D 效果：密集星尘
                this.spawnDustTrail(parent, startLocal, localPos, FLY_TIME);

                tween(itemNode)
                    .to(FLY_TIME, {
                        position: localPos,
                        scale: new Vec3(0.35, 0.35, 1)
                    }, { easing: 'sineInOut' })
                    .delay(0.2)
                    .call(() => {
                        if(this.starRatingLayer){
                            this.updateStarRating()
                        }
                        
                        onComplete()
                    })
                    .start();
            })
            .start();
    }

    /**
     * D 密集星尘：星星数量多、体积小、紧紧裹在物品周围，
     * 沿飞行方向形成一条稠密的星尘带。
     */
    private spawnDustTrail(parent: Node, startLocal: Vec3, endLocal: Vec3, flyTime: number) {
        const COUNT = 40;                // 数量多
        const SPAWN_INTERVAL = flyTime / COUNT;    // 间隔小，形成稠密感

        // 飞行方向 与 垂直方向
        const dir  = endLocal.clone().subtract(startLocal).normalize();
        const perp = new Vec3(-dir.y, dir.x, 0);

        for (let i = 0; i < COUNT; i++) {
            const spawnDelay = i * SPAWN_INTERVAL;

            this.scheduleOnce(() => {
                const star = this.getStarFromPool(parent);

                // 1. 当前物品位置（与 sineInOut 对齐）
                const progress = Math.min(spawnDelay / flyTime, 1);
                const eased = -(Math.cos(Math.PI * progress) - 1) / 2;
                const curPos = new Vec3();
                Vec3.lerp(curPos, startLocal, endLocal, eased);

                // 2. D 的关键：横向偏移小、后方偏移小 → 紧贴物品
                //    左右随机（正负都有），距离 25~60
                const sideSign = Math.random() > 0.5 ? 1 : -1;
                const sideDist = 60 + Math.random() * 80;
                //    后方偏移也小，20~40
                const backDist = 60 + Math.random() * 200;

                const offset = new Vec3();
                offset.add(perp.clone().multiplyScalar(sideDist * sideSign));
                offset.add(dir.clone().multiplyScalar(-backDist));

                const starStart = curPos.clone().add(offset);

                // 3. 终点：向目标点大幅收拢（D 效果收得比较紧）
                const starEnd = endLocal.clone().add(
                    perp.clone().multiplyScalar(sideDist * sideSign * 0.35)
                );

                // 4. D 特征：星星体积小、大小差异大
                const s   = 0.35 + Math.random() * 0.65;   // 0.35 ~ 1.0
                const rot = (Math.random() > 0.5 ? 1 : -1) * (30 + Math.random() * 90);

                star.setPosition(starStart);
                star.setScale(s, s, 1);

                const remainTime = Math.max(flyTime - spawnDelay, 0.3);

                // 位置飞行 + 缩放
                tween(star)
                    .to(remainTime, {
                        position: starEnd,
                        scale: new Vec3(s * 0.25, s * 0.25, 1)
                    }, { easing: 'sineInOut' })
                    .call(() => this.recycleStar(star))
                    .start();

                // 自转，速度差异大 → 星尘闪烁感
                tween(star).by(remainTime, { angle: rot }).start();

                // 5. D 的可选小技巧：随机稍作淡出，让星尘有"呼吸感"
                const opacity = star.getComponent('cc.UIOpacity') as any;
                if (opacity) {
                    opacity.opacity = 180 + Math.floor(Math.random() * 75); // 180~255
                }
            }, spawnDelay);
        }
    }


    private getStarFromPool(parent: Node): Node {
        let star: Node;
        if (this._starPool.size() > 0) {
            star = this._starPool.get()!;
        } else {
            star = instantiate(this.starPrefab);
        }
        star.parent = parent;
        star.active = true;
        // D 效果星尘贴在物品下面
        star.setSiblingIndex(0);
        return star;
    }

    private recycleStar(star: Node) {
        // 停止该节点上所有未完成的 tween，避免干扰下次复用
        Tween.stopAllByTarget(star);
        star.active = false;
        this._starPool.put(star); // 放回对象池
    }

    /** 关卡完成 */
    private onLevelComplete() {
        if (this.levelEnded) return;
        setTimeout(() => {
            this.levelEnded = true;
            console.log('[GameManager] 关卡完成！');

            const currentStar = Math.max(0, Math.min(3, this.currentStarCount || this.currentLevel.star));
            const historyStar = LevelPassDataManager.getSavedStar(LevelPassDataManager.levelKey);
            const exp = Math.max(0, currentStar - historyStar) * 600;
            const nextStar = Math.max(historyStar, currentStar);

            LevelPassDataManager.saveProgress(LevelPassDataManager.levelKey, nextStar, true);

            this.showPopup('LevelCleared', {
                level: this.currentLevel.levelId,
                name: this.currentLevel.levelName,
                score: exp,
                star: currentStar,
            });
        },800)
        
    }

    /** 关卡失败 */
    public onLevelFail() {
        if (this.levelEnded) return;

        this.levelEnded = true;
        console.log('[GameManager] 关卡失败！');
        console.log(this.currentLevel)
        this.showPopup('Failed', {
            level: this.currentLevel.levelId,
            name: this.currentLevel.levelName,
            star: this.currentLevel.star,
        });
    }

    public useMagnifier(): void {
        if (!this.tryUseItem('Magnifier')) {
            return;
        }

        console.log('[GameManager] 执行放大镜逻辑...');
    }

    public usePassCleaning(): void {
        if (!this.tryUseItem('PassCleaning')) {
            return;
        }

        console.log('[GameManager] 执行通关清理逻辑...');
    }

    public useBenefits(): void {
        console.log('[GameManager] 执行福利逻辑...');
    }

    public useSettings(): void {
        if (!this.popupLayerPrefab) {
            console.warn('[GameManager] 未配置 popupLayerPrefab，无法显示设置弹窗');
            return;
        }

        if (this.settingsPopupLayer && this.settingsPopupLayer.isValid) {
            this.hideSettingsPopup();
            return;
        }

        this.showSettingsPopup();
    }

    public getItemCount(itemId: string): number {
        return this.inventory[itemId] ?? 0;
    }

    public getItemMeta(itemId: string): { name: string; iconPath: string; requiredCount: number } | null {
        const config = this.itemConfigs[itemId];
        if (!config) {
            return null;
        }

        return {
            name: config.name,
            iconPath: config.iconPath,
            requiredCount: config.requiredCount,
        };
    }

    private showSettingsPopup(): void {
        const parent = this.node.parent ?? this.node;
        const popupLayer = instantiate(this.popupLayerPrefab);

        parent.addChild(popupLayer);
        this.settingsPopupLayer = popupLayer;

        const menuPanel = popupLayer.getComponent(MenuPanel)
            ?? popupLayer.getComponentInChildren(MenuPanel);

        if (!menuPanel) {
            console.warn('[GameManager] 未找到设置弹窗下的 MenuPanel');
            this.hideSettingsPopup();
            return;
        }

        this.settingsMenuPanel = menuPanel;
        menuPanel.onItemClick = (id) => this.onSettingsMenuClick(id);
        menuPanel.show(MenuType.IN_GAME);

        const maskNode = popupLayer.getChildByName('Mask');
        if (maskNode) {
            maskNode.on(Node.EventType.TOUCH_END, this.onSettingsMaskClick, this);
        }

        const closeNode = popupLayer.getChildByName('X') ?? popupLayer.getChildByName('Close');
        if (closeNode) {
            closeNode.on(Node.EventType.TOUCH_END, this.onSettingsMaskClick, this);
        }
    }

    private hideSettingsPopup(): void {
        if (!this.settingsPopupLayer || !this.settingsPopupLayer.isValid) {
            this.settingsPopupLayer = null;
            this.settingsMenuPanel = null;
            return;
        }

        const popupLayer = this.settingsPopupLayer;
        const maskNode = popupLayer.getChildByName('Mask');
        if (maskNode) {
            maskNode.off(Node.EventType.TOUCH_END, this.onSettingsMaskClick, this);
        }

        const closeNode = popupLayer.getChildByName('X') ?? popupLayer.getChildByName('Close');
        if (closeNode) {
            closeNode.off(Node.EventType.TOUCH_END, this.onSettingsMaskClick, this);
        }

        this.settingsMenuPanel = null;
        popupLayer.destroy();
        this.settingsPopupLayer = null;
    }

    private onSettingsMaskClick(): void {
        this.hideSettingsPopup();
    }

    private onSettingsMenuClick(id: string): void {
        console.log('[GameManager] 设置菜单点击：', id);

        switch (id) {
            case 'music':

                break;
            case 'sound':

                break;
            case 'exitLevel': 
                director.loadScene("LevelSelect");
                break;
            case 'service':
                console.log("客服")
                break;
            case 'reChallenge':
                this.restartCurrentLevel();
                break;
            default:
                this.hideSettingsPopup();
                break;
        }
    }

    private restartCurrentLevel(): void {
        const currentData = LevelPassDataManager.data;
        const levelData: LevelPassData = currentData
            ? { ...currentData }
            : {
                target: LevelPassDataManager.levelKey,
                levelName: this.currentLevel?.levelName ?? '',
                star: this.currentLevel?.star ?? 0,
                levelId: this.currentLevel?.levelId ?? 0,
            };

        LevelPassDataManager.setData(levelData);
        this.hideSettingsPopup();
        console.log('[GameManager] 重新挑战关卡:', levelData.target);
        director.loadScene('Level');
    }

    public supplementItem(itemId: string): void {
        const config = this.itemConfigs[itemId];

        if (!config) {
            console.warn('[GameManager] 未知道具补充类型:', itemId);
            return;
        }

        const currentCount = this.getItemCount(itemId);
        this.inventory[itemId] = Math.max(0, currentCount + 1);
        this.persistItemCounts();

        console.log(`[GameManager] 道具补充：${config.name}，当前数量：${this.inventory[itemId]}`);

        
    }

    private tryUseItem(itemId: string): boolean {
        const config = this.itemConfigs[itemId];

        if (!config) {
            console.warn('[GameManager] 未知道具类型:', itemId);
            return false;
        }

        const currentCount = this.getItemCount(itemId);

        if (currentCount < config.requiredCount) {
            this.showInsufficientPopup(itemId, config.requiredCount);
            return false;
        }

        this.inventory[itemId] = currentCount - config.requiredCount;
        this.persistItemCounts();
        console.log(`[GameManager] 使用道具：${config.name}，剩余数量：${this.inventory[itemId]}`);
        return true;
    }

    private loadPersistedItemCounts(): void {
        const storage = (globalThis as any).cc?.sys?.localStorage ?? (typeof localStorage !== 'undefined' ? localStorage : null);

        if (!storage) {
            return;
        }

        try {
            const raw = storage.getItem(this.itemStorageKey);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') {
                return;
            }

            for (const itemId of Object.keys(this.itemConfigs)) {
                const savedValue = Number((parsed as Record<string, any>)[itemId]);
                this.inventory[itemId] = Number.isFinite(savedValue) ? Math.max(0, Math.floor(savedValue)) : this.inventory[itemId] ?? 0;
            }
        } catch (error) {
            console.warn('[GameManager] 读取持久化道具数量失败，已忽略缓存。', error);
        }
    }

    private persistItemCounts(): void {
        const storage = (globalThis as any).cc?.sys?.localStorage ?? (typeof localStorage !== 'undefined' ? localStorage : null);

        if (!storage) {
            return;
        }

        storage.setItem(this.itemStorageKey, JSON.stringify(this.inventory));
    }

    private showInsufficientPopup(itemId: string, requiredCount: number) {
        const config = this.itemConfigs[itemId];

        if (!config) {
            console.warn('[GameManager] 无法显示数量不足弹窗，未知道具类型:', itemId);
            return;
        }

        this.showPopup('Insufficient', {
            itemId,
            iconPath: config.iconPath,
            name: config.name,
            currentCount: this.getItemCount(itemId),
            requiredCount,
        });
    }

    private showPopup(type: PopupType, data: any) {
        if (!this.popup) {
            console.warn('[GameManager] popupLayer 未绑定，无法显示弹窗');
            return;
        }

        console.log('[GameManager] 显示弹窗:', type);
        this.popup.show(type as any, data);
    }
}