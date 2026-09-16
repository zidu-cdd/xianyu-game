import { _decorator, Component, EventTouch, Node } from 'cc';

import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('FloatingUIController')
export class FloatingUIController extends Component {
    

    // 这个就是通用的点击事件函数
    // event: 触摸事件对象
    // customEventData: 你在编辑器里填的自定义字符串参数
    public onItemClick(event: EventTouch, customEventData: string) {
        const btnName = (event.target as Node).name;
        console.log(`>>> 悬浮按钮被点击: ${btnName}`);

        const gameManager = this.getGameManager();

        if (!gameManager) {
            console.warn('[FloatingUIController] 未找到 GameManager，无法执行道具逻辑');
            return;
        }

        switch (btnName) {
            case 'Magnifier':
                gameManager.useMagnifier();
                break;
            case 'PassCleaning':
                gameManager.usePassCleaning();
                break;
            case 'Benefits':
                gameManager.useBenefits();
                break;
            case 'Settings':
                gameManager.useSettings();
                break;
            default:
                console.warn('[FloatingUIController] 未处理的悬浮按钮:', btnName);
                break;
        }
    }

    private getGameManager(): GameManager | null {
        const parent = this.node.parent;

        if (!parent) {
            return null;
        }

        const backgroundLayer = parent.getChildByName('BackgroundLayer');

        if (!backgroundLayer) {
            console.warn('[FloatingUIController] 未找到 BackgroundLayer');
            return null;
        }

        return backgroundLayer.getComponent(GameManager);
    }
}