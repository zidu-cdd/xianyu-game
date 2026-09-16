import { _decorator, Component, Node, Sprite, SpriteFrame, resources, UITransform, EventTouch, Vec3, tween } from 'cc';
import { TargetConfig } from './LevelConfig';
import { InteractiveElement } from './InteractiveElement';

const { ccclass, property } = _decorator;

@ccclass('TargetItem')
export class TargetItem extends Component {

    @property(Sprite)
    sprite: Sprite = null!;          // Target 下的 Background（或 Sprite）

    public config: TargetConfig = null!;
    private slotIndex = 0;
    private onFound: (target: TargetItem, slotIndex: number) => void = null!;
    private onInteractive: ((node: Node, id: string) => void) | null = null;
    private isFound = false;
    private clickNode: Node = null!;

    init(
        cfg: TargetConfig,
        slotIndex: number,
        onFound: (t: TargetItem, idx: number) => void,
        onInteractive?: (node: Node, id: string) => void,
    ) {
        this.config = cfg;
        this.slotIndex = slotIndex;
        this.onFound = onFound;
        this.onInteractive = onInteractive ?? null;
        this.isFound = false;
        this.clickNode = this.sprite?.node ?? this.node;
        console.log('[TargetItem] init:', this.node.name, 'clickNode:', this.clickNode.name, 'sprite:', !!this.sprite);

        // 加载场景物品图片
        resources.load(cfg.spritePath + '/spriteFrame', SpriteFrame, (err, sf) => {
            if (!err && this.sprite) {
                this.sprite.spriteFrame = sf;
            }
        });

        // 设置点击热区（可选）
        if (cfg.clickSize) {
            const ui = this.clickNode.getComponent(UITransform)!;
            ui.setContentSize(cfg.clickSize.w, cfg.clickSize.h);
        }

        if (cfg.isTarget === false) {
            InteractiveElement.bind(this.clickNode, cfg.id, (node, id) => {
                console.log('[TargetItem] 交互元素点击:', node.name, id);
                this.onInteractive?.(node, id);
            });
        } else {
            // 绑定点击，优先挂到实际显示节点，避免点击目标无响应
            this.clickNode.on(Node.EventType.TOUCH_END, this.onClick, this);
            console.log('[TargetItem] 已绑定 TOUCH_END:', this.clickNode.name);
        }
    }

    private onClick(event: EventTouch) {
        console.log('[TargetItem] 点击事件触发:', this.node.name, 'event:', event && event.type);
        if (this.isFound) return;
        this.isFound = true;

        // 取消点击，避免重复触发
        this.clickNode.off(Node.EventType.TOUCH_END, this.onClick, this);

        // 给目标一个轻微点击反馈
        tween(this.node)
            .to(0.06, { scale: new Vec3(1.08, 1.08, 1) })
            .to(0.08, { scale: new Vec3(1, 1, 1) })
            .start();

        // 通知 GameManager
        this.onFound && this.onFound(this, this.slotIndex);
    }

    protected onDestroy(): void {
        if (this.clickNode?.isValid && this.config?.isTarget === false) {
            InteractiveElement.unbind(this.clickNode);
        }
    }
}