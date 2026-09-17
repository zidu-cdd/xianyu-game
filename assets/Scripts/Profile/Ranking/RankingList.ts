import { _decorator, Component, Node, Prefab, instantiate, director } from 'cc';
import { RankingItem } from './RankingItem';
const { ccclass, property } = _decorator;

// 定义数据结构
export interface RankData {
    rank: number;
    nickname: string;
    score: number;
}

@ccclass('RankingList')
export class RankingList extends Component {
    @property(Node)
    contentNode: Node = null!; // 对应 ScrollView 里的 Content 节点

    @property(Prefab)
    itemPrefab: Prefab = null!; // 将 Ranking 节点拖成预制体后拖入

    @property(Node)
    backHome: Node = null!;

    protected start(): void {
        this.initEvents()
    }

    private initEvents() {
        if (this.backHome) {
            this.backHome.on(Node.EventType.TOUCH_END, this.onClickHome, this);
        }
    }

    private onClickHome() {
        console.log("点击了返回首页");
        
        director.loadScene("Home");
    }
    /**
     * 刷新排行榜
     * @param dataList 排行榜数据数组
     */
    public updateRankings(dataList: RankData[]) {
        // 1. 清空当前列表
        this.contentNode.removeAllChildren();

        // 2. 遍历数据生成节点
        dataList.forEach((data, index) => {
            // 实例化预制体
            const itemNode = instantiate(this.itemPrefab);
            
            // 挂载到 Content 下
            itemNode.parent = this.contentNode;

            // 获取脚本组件并赋值
            const itemScript = itemNode.getComponent(RankingItem);
            if (itemScript) {
                itemScript.setData(data.rank || index + 1, data.nickname, data.score);
            }
        });

        // 3. 注意：如果你的 Content 挂了 Layout 组件，它会自动排版，不需要手动计算 Y 轴
    }
}