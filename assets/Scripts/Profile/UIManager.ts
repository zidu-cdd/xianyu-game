import { _decorator, Component, Node, Label, Sprite, director, Prefab, instantiate, UITransform, resources, SpriteFrame } from 'cc';
import { ITEM_CONFIGS, ItemConfig, loadItemCounts } from './ItemData';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {

    // ================= HeaderLayer =================
    @property({ type: Node, tooltip: "返回首页按钮" })
    btnHome: Node = null;

    @property({ type: Node, tooltip: "排行榜按钮" })
    btnRank: Node = null;

    // ================= ContentLayer -> Card =================
    @property({ type: Label, tooltip: "昵称" })
    lblNickname: Label = null;

    @property({ type: Label, tooltip: "等级" })
    lblLevel: Label = null;

    // ExpBar 相关
    @property({ type: Node, tooltip: "ExpBar 节点 (用作计算宽度基准)" })
    expBarNode: Node = null;

    @property({ type: Sprite, tooltip: "ExpBar 下的 Fill" })
    expBarFill: Sprite = null;

    @property({ type: Node, tooltip: "ExpBar 下的 Effect" })
    expBarEffect: Node = null;

    // ================= ContentLayer -> HasObtained =================
    @property({ type: Prefab, tooltip: "道具预制体" })
    propItemPrefab: Prefab = null;

    @property({ type: Node, tooltip: "道具列表的父节点 (View/Content)" })
    propContentNode: Node = null;

    start() {
        this.initEvents();
        this.refreshUserData(); // 假设数据在这里初始化
        this.refreshObtainedItems();
    }

    // 1. 初始化 HeaderLayer 按钮事件
    private initEvents() {
        if (this.btnHome) {
            this.btnHome.on(Node.EventType.TOUCH_END, this.onClickHome, this);
        }
        if (this.btnRank) {
            this.btnRank.on(Node.EventType.TOUCH_END, this.onClickRank, this);
        }
    }

    private onClickHome() {
        console.log("点击了返回首页");
       
        director.loadScene("Home");
    }

    private onClickRank() {
        console.log("点击了排行榜");
        // TODO: 实现打开排行榜弹窗逻辑
        director.loadScene("Rankings");
    }

    // 2. 刷新用户动态数据 (昵称、等级、经验条)
    // 假设这些数据从服务器获取
    private refreshUserData() {
        // 模拟数据
        const nickname = "玩家昵称";
        const level = 10;
        const currentExp = 350;
        const maxExp = 1000;

        // 设置昵称和等级
        if (this.lblNickname) this.lblNickname.string = nickname;
        if (this.lblLevel) this.lblLevel.string = `Lv.${level}`;

        // 计算经验进度 (0~1)
        const progress = Math.min(Math.max(currentExp / maxExp, 0), 1);

        this.updateExpBar(progress);
    }

    // 3. 更新经验条 Fill 宽度和 Effect 位置
    private updateExpBar(progress: number) {
        if (!this.expBarNode || !this.expBarFill || !this.expBarEffect) return;

        this.expBarFill.fillRange = progress;

        // 更新 Effect 位置
        const barTransform = this.expBarNode.getComponent(UITransform);
        if (barTransform) {
            const fullWidth = barTransform.width;
            // 假设 expBarNode 的锚点 (anchorPoint) 是 (0.5, 0.5)，即中心点。
            // 左边缘坐标 = -fullWidth / 2
            // Effect 的 x = 左边缘 + 当前进度宽度
            const effectX = -fullWidth / 2 + (fullWidth * progress);
            
            // 保持 Effect 的 y 轴不变
            const currentPos = this.expBarEffect.position;
            this.expBarEffect.setPosition(effectX, currentPos.y, currentPos.z);
        }
    }

    private refreshObtainedItems() {
        const counts = loadItemCounts();
        const itemsData = Object.keys(ITEM_CONFIGS).map((id) => ({
            id,
            config: ITEM_CONFIGS[id],
            count: counts[id] ?? 0,
        }));

        this.spawnObtainedItems(itemsData);
    }

    // 4. 生成已获得道具列表
    public spawnObtainedItems(itemsData: { id: string, config: ItemConfig, count: number }[]) {
        if (!this.propContentNode || !this.propItemPrefab) return;

        // 清空当前列表
        this.propContentNode.removeAllChildren();

        // 遍历数据生成预制体
        itemsData.forEach((data) => {
            const itemNode = instantiate(this.propItemPrefab);
            
            const iconNode = itemNode.getChildByName("Icon");
            const numsNode = itemNode.getChildByName("Nums");

            if (iconNode) {
                const iconSprite = iconNode.getComponent(Sprite);
                this.loadSpriteFrame(data.config.profileIconPath, iconSprite);
            }

            if (numsNode) {
                const numsSprite = numsNode.getComponent(Sprite);
                data.count !== 0 && this.loadSpriteFrame(`Profile/x${data.count}`, numsSprite);
                const countLabel = numsNode.getComponent(Label) ?? numsNode.addComponent(Label);
                countLabel.string = `x${data.count}`;
            }

            // 添加到 Content 节点下
            this.propContentNode.addChild(itemNode);
        });
    }

    private loadSpriteFrame(path: string, target: Sprite | null) {
        if (!target) return;

        resources.load(path + '/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error(`[UIManager] 图片加载失败：${path}`, err);
                return;
            }

            if (target.isValid) target.spriteFrame = spriteFrame;
        });
    }
}