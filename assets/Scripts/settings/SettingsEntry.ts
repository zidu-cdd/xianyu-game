import { _decorator, Component, Prefab, instantiate } from 'cc';

import { MenuType } from './MenuData';
import { MenuPanel } from './MenuPanel';
import { AudioManager } from '../manager/AudioManager';

const { ccclass, property } = _decorator;
@ccclass('InitPopup')
export class InitPopup extends Component {

    @property(Prefab)
    private popupLayerPrefab: Prefab = null;
    private menuPanel: MenuPanel | null = null;

    onLoad() {
        if (!this.popupLayerPrefab) {
            console.error('[GameEntry] popupLayerPrefab 未配置');
            return;
        }

        // 实例化 PopupLayer 预制体
        const popupLayer = instantiate(this.popupLayerPrefab);
        this.node.parent?.addChild(popupLayer);

        const menuPanel = popupLayer.getComponent(MenuPanel)
            ?? popupLayer.getComponentInChildren(MenuPanel);

        if (!menuPanel) {
            console.error('[SettingsEntry] 未找到刚实例化的 MenuPanel');
            return;
        }

        this.menuPanel = menuPanel;

        // 设置点击回调
        menuPanel.onItemClick = (id) => this._onMenuClick(id);

        // 显示主界面菜单（内部自动选数据、图标、顺序）
        menuPanel.show(MenuType.MAIN);
        console.log('弹窗显示===');
    }

    private _onMenuClick(id: string) {
        console.log('主界面点击：', id);
        switch (id) {
            case 'music':
                AudioManager.getInstance()?.toggleBGM();
                this.menuPanel?.refreshAudioStates();
                break;
            case 'sound':
                AudioManager.getInstance()?.toggleSFX();
                this.menuPanel?.refreshAudioStates();
                break;
            case 'ad':      /* 打开免广告 */   break;
            case 'service': /* 打开客服 */     break;
            case 'sign':    /* 打开签到 */     break;
        }
    }
}


