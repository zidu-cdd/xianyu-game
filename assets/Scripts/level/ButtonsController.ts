import { _decorator, Component, Node, EventTouch, director } from 'cc';
const { ccclass, property } = _decorator;
import { Popup } from './Popup/Popup';
import { LevelPassDataManager } from '../levelSelect/LevelPassData';
import { GameManager } from './GameManager';

@ccclass('ButtonsController')
export class ButtonsController extends Component {
    @property(Popup)
    popup: Popup = null!;   
    /**
     * 统一处理所有按钮的点击事件
     * @param event 触摸事件
     * @param customEventData 在编辑器里填写的自定义参数字符串
     */
    public onBtnClick(event: EventTouch, customEventData: string) {
        // 获取当前被点击的节点
        const clickedNode = event.target as Node;
        const btnName = clickedNode.name;
        
        // 获取该按钮所属的父节点（状态节点，如 Cleared, Failed）
        const stateNode = clickedNode.parent;
        const stateName = stateNode ? stateNode.name : 'Unknown';

        console.log(`[点击事件] 状态: ${stateName}, 按钮: ${btnName}, 自定义参数: ${customEventData}`);

        // 根据点击时拿到的自定义参数来分发逻辑
        this.handleButtonLogic(stateName, btnName, customEventData);
    }

    private handleButtonLogic(stateName: string, btnName: string, customEventData: string) {
        // 这里写你的具体业务逻辑
        switch (btnName) {
            case 'ShareBtn':
                console.log('>>> 执行分享逻辑');
                wx.shareAppMessage({
                    title: '别笑, 你也过不了第二关'
                })
                break;
            case 'NextLevel':
                this.goToNextLevel();
                break;
            case 'AdGet':
                // 看视频领取：从当前弹窗中读取道具 ID，再走广告回调流程
                this.handleAdGet();
                break;
            case 'NormalGet':
                console.log('>>> 执行立即领取逻辑');
                break;
            case 'MaskBack':
                console.log('>>> 执行点击遮罩返回逻辑');
                this.popup?.close();
                break;
            case 'Supplementary':
                // 看视频翻倍领取：从当前弹窗中读取道具 ID
                this.handleSupplement();
                break;
            case 'Buy':
                console.log('>>> 执行购买逻辑');
                break;
            default:
                console.log(`>>> 未知按钮: ${btnName}`);
                break;
        }
        
        // 你还可以根据状态做更细致的判断
        if (stateName === 'Cleared' && btnName === 'NextLevel') {
            // 比如只有 Cleared 状态下的 NextLevel 才有效
        }
    }

    private goToNextLevel() {
        const nextData = LevelPassDataManager.getNextLevelData();

        if (!nextData) {
            console.log('[ButtonsController] 没有下一关，返回选关');
            director.loadScene('LevelSelect');
            return;
        }

        LevelPassDataManager.setData(nextData);

        console.log('[ButtonsController] 进入下一关：', nextData.target, nextData.levelName);
        director.loadScene('Level');
    }

    private handleAdGet() {
        const itemId = this.popup?.getCurrentItemId();

        if (!itemId) {
            console.warn('[ButtonsController] 当前弹窗中没有可用的道具 ID');
            return;
        }

        const gameManager = this.getGameManager();

        if (!gameManager) {
            console.warn('[ButtonsController] 未找到 GameManager，无法处理看视频领取');
            return;
        }

        const item = gameManager.getItemMeta(itemId);
        if (!item) {
            console.warn('[ButtonsController] 未找到道具信息:', itemId);
            return;
        }

    
        
      

        
    }

    private handleSupplement() {
        const itemId = this.popup?.getCurrentItemId();

        if (!itemId) {
            console.warn('[ButtonsController] 当前弹窗中没有可用的道具 ID');
            return;
        }

        const gameManager = this.getGameManager();

        if (!gameManager) {
            console.warn('[ButtonsController] 未找到 GameManager，无法补充道具');
            return;
        }

        gameManager.supplementItem(itemId);

        const item = gameManager.getItemMeta(itemId);
        if (!item) {
            console.warn('[ButtonsController] 未找到道具信息:', itemId);
            return;
        }

        this.popup.show('Getting', {
            itemId,
            iconPath: item.iconPath,
            name: item.name,
            count: 1,
            countPath: `${item.iconPath}Tips`,
        });
    }

    private getGameManager(): GameManager | null {
        let current: Node | null = this.node;

        // 从当前节点向上走 3 层，然后在该节点下取 BackgroundLayer，最后拿到 GameManager
        for (let i = 0; i < 3 && current; i++) {
            current = current.parent;
        }

        if (!current) {
            console.warn('[ButtonsController] 未找到向上 3 层的节点');
            return null;
        }

        const backgroundLayer = current.getChildByName('BackgroundLayer');
        if (!backgroundLayer) {
            console.warn('[ButtonsController] 未找到 BackgroundLayer');
            return null;
        }

        return backgroundLayer.getComponent(GameManager);
    }
}