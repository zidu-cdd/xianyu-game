import {
    _decorator, Component, Node, Prefab, instantiate, UITransform,
    Widget, Layers, director, tween, UIOpacity, Vec3, Sprite
} from 'cc';
import { MenuPanel } from './MenuPanel';
const { ccclass, property } = _decorator;

export interface PopupConfig {
    prefab: Prefab;
    destroyOnClose?: boolean;
    openDuration?: number;
    closeDuration?: number;
    showMask?: boolean;
    closeOnMaskClick?: boolean;
}

@ccclass('PopupManager')
export class PopupManager extends Component {

    private static _instance: PopupManager = null;
    public static get instance(): PopupManager {
        return PopupManager._instance;
    }

    @property(MenuPanel)
    private menuPanel: MenuPanel = null;

    public getMenuPanel(): MenuPanel {
        return this.menuPanel;
    }

    private _popupRoot: Node = null;
    private _maskNode: Node = null;

    private _popupStack: Node[] = [];
    private _pool: Map<string, Node[]> = new Map();
    private _configs: Map<string, PopupConfig> = new Map();

    private _openDuration: number = 0.35;
    private _closeDuration: number = 0.3;

    protected onLoad() {
        if (PopupManager._instance) {
            this.destroy();
            return;
        }
        PopupManager._instance = this;
        director.addPersistRootNode(this.node);
        this._initRoot();
    }

    private _initRoot() {
        this._popupRoot = new Node('PopupRoot');
        this._popupRoot.layer = Layers.Enum.UI_2D;
        this._popupRoot.addComponent(UITransform).setContentSize(0, 0);
        const widget = this._popupRoot.addComponent(Widget);
        widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
        widget.top = widget.bottom = widget.left = widget.right = 0;
        this.node.addChild(this._popupRoot);

        this._maskNode = new Node('PopupMask');
        this._maskNode.layer = Layers.Enum.UI_2D;
        this._maskNode.addComponent(UITransform).setContentSize(2000, 2000);
        const maskWidget = this._maskNode.addComponent(Widget);
        maskWidget.isAlignTop = maskWidget.isAlignBottom = maskWidget.isAlignLeft = maskWidget.isAlignRight = true;
        maskWidget.top = maskWidget.bottom = maskWidget.left = maskWidget.right = 0;
        const maskOpacity = this._maskNode.addComponent(UIOpacity);
        maskOpacity.opacity = 0;
        const sprite = this._maskNode.addComponent(Sprite);
        sprite.color.set(0, 0, 0, 180);
        this._maskNode.active = false;
        this._popupRoot.addChild(this._maskNode);
    }

    public register(key: string, config: PopupConfig) {
        this._configs.set(key, config);
    }

    public open(key: string, onOpened?: (node: Node) => void): Node {
        const config = this._configs.get(key);
        if (!config) {
            console.error(`[PopupManager] 未注册的弹窗：${key}`);
            return null;
        }

        const existing = this._popupStack.find(n => n.name === key);
        if (existing) {
            existing.active = true;
            this._playOpenAnim(existing, config, onOpened);
            return existing;
        }

        const popup = this._getFromPool(key, config);
        popup.name = key;
        popup.parent = this._popupRoot;

        if (config.showMask !== false) {
            this._showMask(config.closeOnMaskClick !== false);
        }

        this._playOpenAnim(popup, config, () => {
            this._popupStack.push(popup);
            onOpened && onOpened(popup);
        });

        return popup;
    }

    public close(key?: string, onClosed?: () => void) {
        if (this._popupStack.length === 0) {
            onClosed && onClosed();
            return;
        }

        let popup: Node;
        if (key) {
            const idx = this._popupStack.findIndex(n => n.name === key);
            if (idx === -1) {
                onClosed && onClosed();
                return;
            }
            popup = this._popupStack.splice(idx, 1)[0];
        } else {
            popup = this._popupStack.pop();
        }

        const config = this._configs.get(popup.name) || { prefab: null };
        const closeDuration = config.closeDuration ?? this._closeDuration;

        this._playCloseAnim(popup, closeDuration, () => {
            if (config.destroyOnClose) {
                popup.destroy();
            } else {
                popup.active = false;
                this._recycleToPool(popup.name, popup);
            }

            if (this._popupStack.length === 0) {
                this._hideMask();
            }

            onClosed && onClosed();
        });
    }

    public closeAll() {
        while (this._popupStack.length > 0) {
            this.close();
        }
    }

    public getTopPopup(): Node | null {
        return this._popupStack.length > 0 ? this._popupStack[this._popupStack.length - 1] : null;
    }

    public isOpen(key: string): boolean {
        return this._popupStack.some(n => n.name === key);
    }

    private _getFromPool(key: string, config: PopupConfig): Node {
        const pool = this._pool.get(key);
        if (pool && pool.length > 0) {
            return pool.pop();
        }
        return instantiate(config.prefab);
    }

    private _recycleToPool(key: string, popup: Node) {
        if (!this._pool.has(key)) {
            this._pool.set(key, []);
        }
        popup.setPosition(0, 0, 0);
        popup.setScale(1, 1, 1);
        const opacity = popup.getComponent(UIOpacity);
        if (opacity) opacity.opacity = 255;
        this._pool.get(key).push(popup);
    }

    private _showMask(closeOnClick: boolean) {
        this._maskNode.active = true;
        const opacity = this._maskNode.getComponent(UIOpacity);
        tween(opacity).to(0.25, { opacity: 180 }).start();

        this._maskNode?.off(Node.EventType.TOUCH_END);
        if (closeOnClick) {
            this._maskNode.on(Node.EventType.TOUCH_END, () => {
                this.close();
            });
        }
    }

    private _hideMask() {
        const opacity = this._maskNode.getComponent(UIOpacity);
        tween(opacity).to(0.2, { opacity: 0 }).call(() => {
            this._maskNode.active = false;
        }).start();
    }

    private _playOpenAnim(popup: Node, config: PopupConfig, onComplete?: (node: Node) => void) {
        const duration = config.openDuration ?? this._openDuration;
        const opacity = popup.getComponent(UIOpacity) || popup.addComponent(UIOpacity);

        popup.setScale(0.95, 0.95, 1);
        popup.setPosition(0, 200, 0);
        opacity.opacity = 0;

        tween(popup).to(duration, { position: new Vec3(0, 0, 0) }, { easing: 'backOut' }).start();
        tween(opacity).to(duration * 0.7, { opacity: 255 }).call(() => onComplete && onComplete(popup)).start();
    }

    private _playCloseAnim(popup: Node, duration: number, onComplete?: () => void) {
        const opacity = popup.getComponent(UIOpacity);
        if (!opacity) {
            onComplete && onComplete();
            return;
        }

        tween(popup)
            .to(duration * 0.2, { position: new Vec3(0, 28, 0), scale: new Vec3(1.03, 1.03, 1) }, { easing: 'quadOut' })
            .delay(duration * 0.15)
            .to(duration * 0.65, { position: new Vec3(0, -1200, 0), scale: new Vec3(0.9, 0.9, 1) }, { easing: 'quadIn' })
            .call(() => onComplete && onComplete())
            .start();

        tween(opacity)
            .delay(duration * 0.5)
            .to(duration * 0.5, { opacity: 0 })
            .start();
    }
}