import { _decorator, Component, Node, EventTouch, director } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('HeaderController')
export class HeaderController extends Component {

    public onBtnClick(event: EventTouch, customEventData: string) {
        // 获取当前被点击的节点
        const clickedNode = event.target as Node;
        const btnName = clickedNode.name;
        
        
        const stateNode = clickedNode.parent;
        const stateName = stateNode ? stateNode.name : 'Unknown';

        console.log(`[点击事件] 状态: ${stateName}, 按钮: ${btnName}, 自定义参数: ${customEventData}`);

        
        this.handleButtonLogic(stateName, btnName);
    }
    
    public handleButtonLogic(stateName: string, btnName: string) {

        switch(btnName) {
            case 'BackHome': 
                director.loadScene('Home');
                break;

            case 'Benefits':
                console.log('打开福利页');
                break;
        }

    }
}


