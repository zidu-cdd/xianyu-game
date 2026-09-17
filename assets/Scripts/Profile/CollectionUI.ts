import { _decorator, Component, Node, Prefab, instantiate, Sprite, SpriteFrame, director, resources, ScrollView } from 'cc';
import { COLLECTION_ITEM_IDS, ITEM_CONFIGS, ItemConfig, loadItemCounts } from './ItemData';
const { ccclass, property } = _decorator;

@ccclass('CollectionUI')
export class CollectionUI extends Component {

    private readonly lockedIconPath = 'Profile/LockedProps';

    // ================= HeaderLayer =================
    @property({ type: Node, tooltip: "返回首页按钮 (BackHome)" })
    btnBackHome: Node = null;

    // ================= ContentLayer -> HasObtained =================
    @property({ type: Node, tooltip: "已获得道具的父节点 (UnlockedView/ItemView)" })
    unlockedItemParent: Node = null;

    @property({ type: Node, tooltip: "未获得道具的父节点 (LockedView/ItemView)" })
    lockedItemParent: Node = null;

    @property({ type: Prefab, tooltip: "道具预制体 (PropItem)" })
    propItemPrefab: Prefab = null;

    onLoad() {
        // 绑定返回首页按钮事件
        if (this.btnBackHome) {
            this.btnBackHome.on(Node.EventType.TOUCH_END, this.onClickBackHome, this);
        }
    }

    start() {
        this.refreshCollection(this.loadCollectionData());
    }

    // --- 按钮事件 ---
    private onClickBackHome() {
        console.log("点击返回首页");
        director.loadScene("Home"); 
    }

    // --- 图鉴渲染逻辑 ---
    
    private loadCollectionData(): { id: string, config: ItemConfig, count: number, isUnlocked: boolean }[] {
        const counts = loadItemCounts();

        return COLLECTION_ITEM_IDS.map((id) => {
            const config = ITEM_CONFIGS[id] ?? this.createMissingItemConfig(id);
            const count = counts[id] ?? 0;
            const isUnlocked = config.profileIconPath.length > 0;
            return { id, config, count, isUnlocked };
        });
    }

    private createMissingItemConfig(id: string): ItemConfig {
        return {
            name: id,
            iconPath: '',
            displayIconPath: '',
            profileIconPath: '',
            requiredCount: 1,
        };
    }

    /**
     * 刷新图鉴列表
     * @param dataList 数据列表
     */
    public refreshCollection(dataList: { id: string, config: ItemConfig, count: number, isUnlocked: boolean }[]) {
        if (!this.unlockedItemParent || !this.lockedItemParent || !this.propItemPrefab) {
            console.warn("图鉴节点或预制体未绑定！");
            return;
        }

        // 1. 清空当前列表 (如果节点多，建议使用对象池优化)
        this.unlockedItemParent.removeAllChildren();
        this.lockedItemParent.removeAllChildren();

        // 2. 遍历数据生成节点
        dataList.forEach((data) => {
            const itemNode = instantiate(this.propItemPrefab);
            
            // 获取 Icon 节点并设置图片
            const iconNode = itemNode.getChildByName("Icon");
            if (iconNode) {
                const iconSprite = iconNode.getComponent(Sprite);
                if (iconSprite) {
                    const iconPath = data.isUnlocked
                        ? data.config.profileIconPath
                        : this.lockedIconPath;
                    this.loadSpriteFrame(iconPath, iconSprite);
                }
            }

            const numsNode = itemNode.getChildByName('Nums');
            numsNode.active = false;

            // 3. 根据获得状态添加到对应的父节点下
            if (data.isUnlocked) {
                this.unlockedItemParent.addChild(itemNode);
            } else {
                this.lockedItemParent.addChild(itemNode);
            }
        });

        
    }


    private loadSpriteFrame(path: string, target: Sprite | null) {
        if (!target) return;

        resources.load(path + '/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error(`[CollectionUI] 图片加载失败：${path}`, err);
                return;
            }

            if (target.isValid) target.spriteFrame = spriteFrame;
        });
    }

    onDestroy() {
        if (this.btnBackHome) {
            this.btnBackHome.off(Node.EventType.TOUCH_END, this.onClickBackHome, this);
        }
    }
}