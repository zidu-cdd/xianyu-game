import {
    _decorator, Component, Node, Layout,
    Sprite, SpriteFrame, tween, Vec3, NodePool, UITransform
} from 'cc';
import { MenuItemData, MenuType, MENU_ORDER } from './MenuData';
const { ccclass, property } = _decorator;

@ccclass('MenuPanel')
export class MenuPanel extends Component {

    @property(Node)
    private content: Node = null;

    @property
    private itemsPerRow: number = 2;

    @property(Node)
    arrow: Node = null;

    // ============ 图标资源：在 Inspector 里拖 ============
    @property(SpriteFrame) iconMusic: SpriteFrame = null;
    @property(SpriteFrame) iconSound: SpriteFrame = null;
    @property(SpriteFrame) iconAd: SpriteFrame = null;
    @property(SpriteFrame) iconService: SpriteFrame = null;
    @property(SpriteFrame) iconSign: SpriteFrame = null;
    @property(SpriteFrame) iconExitLevel: SpriteFrame = null;
    @property(SpriteFrame) iconContinue: SpriteFrame = null;
    @property(SpriteFrame) iconReChallenge: SpriteFrame = null;

    /** 统一点击回调，外部设置 */
    public onItemClick: ((id: string) => void) | null = null;

    private _rows: Node[] = [];
    private _rowPool: NodePool = new NodePool();
    private _itemPool: NodePool = new NodePool();
    private _itemHandlers: Map<Node, () => void> = new Map();

    /**
     * 外部唯一入口：传场景类型，内部决定显示什么
     */
    public show(type: MenuType) {
        if (this.arrow) {
            this.arrow.active = type !== 'inGame';
        }
        const items = this._buildItems(type);
        this._render(items);

        // 
    }

    /**
     * 内部根据场景类型构建数据
     */
    private _buildItems(type: MenuType): MenuItemData[] {
         const pool: MenuItemData[] = [
            // 前两项：两处都一样，只传 iconMain
            { id: 'music', disabled: false,   label: '背景音乐',   iconMain: this.iconMusic },
            { id: 'sound', disabled: false,   label: '音效',       iconMain: this.iconSound },
            // 后面几项：两处图标不同
            {
                id: 'ad', label: '永久免广告',
                iconMain: this.iconAd
            },
            {
                id: 'service', label: '客服',
                iconMain: this.iconService
            },
            {
                id: 'sign', label: '签到',
                iconMain: this.iconSign
            },
            {
                id: 'exitLevel', label: '退出本关',
                iconMain: this.iconExitLevel
            },
            {
                id: 'continue', label: '继续闯关',
                iconMain: this.iconContinue
            },
            {
                id: 'reChallenge', label: '重新挑战',
                iconMain: this.iconReChallenge
            }
        ]

        const order = MENU_ORDER[type] ?? [];
        return order.map(i => pool[i]).filter(Boolean);
    }

    // ============ 渲染 ============

    private _render(items: MenuItemData[]) {
        if (!this.content) {
            console.error('[MenuPanel] content 未配置');
            return;
        }
        
        this._clear();

        for (let i = 0; i < items.length; i += this.itemsPerRow) {
            const rowItems = items.slice(i, i + this.itemsPerRow);
            const rowNode = this._createRow();
            rowItems.forEach(itemData => {
                rowNode.addChild(this._createSpriteItem(itemData));
            });
            this.content.addChild(rowNode);
            this._rows.push(rowNode);
        }

        const layout = this.content.getComponent(Layout);
        if (layout) layout.updateLayout();
    }

    private _createRow(): Node {
        let row: Node;
        if (this._rowPool.size() > 0) {
            row = this._rowPool.get();
            row.active = true;
        } else {
            row = new Node('Row');
            row.addComponent(UITransform);
        }
        row.name = 'Row';

        let layout = row.getComponent(Layout);
        if (!layout) layout = row.addComponent(Layout);
        layout.type = Layout.Type.HORIZONTAL;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
        layout.spacingX = 40;

        return row;
    }

    private _createSpriteItem(data: MenuItemData): Node {
        let item: Node;
        if (this._itemPool.size() > 0) {
            item = this._itemPool.get();
            item.active = true;
        } else {
            item = new Node('Item');
            item.addComponent(UITransform);
            item.addComponent(Sprite);
        }

        item.name = data.id;
        item.setScale(1, 1, 1);

        // 设置图片
        const sprite = item.getComponent(Sprite);
        if (sprite && data.iconMain) {
            sprite.spriteFrame = data.iconMain;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        }

        // 点击
        const handler = () => {
            if (this.onItemClick) this.onItemClick(data.id);
            this._playClickAnim(item);
        };
        item.on(Node.EventType.TOUCH_END, handler, this);
        this._itemHandlers.set(item, handler);

        return item;
    }

    private _playClickAnim(item: Node) {
        tween(item)
            .to(0.08, { scale: new Vec3(0.9, 0.9, 1) })
            .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    private _clear() {
        this._itemHandlers.forEach((handler, item) => {
            item.isValid && item.off(Node.EventType.TOUCH_END, handler, this);
        });
        this._itemHandlers.clear();

        this._rows.forEach(row => {
            row.children.slice().forEach(child => {
                child.removeFromParent();
                this._itemPool.put(child);
            });
            row.removeFromParent();
            this._rowPool.put(row);
        });
        this._rows = [];
    }

    protected onDestroy() {
        this._itemHandlers.forEach((handler, item) => {
            item.isValid && item.off(Node.EventType.TOUCH_END, handler, this);
        });
        this._itemHandlers.clear();
        this._itemPool.clear();
        this._rowPool.clear();
    }
}

