import { _decorator, Component, Node, Label, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RankingItem')
export class RankingItem extends Component {
    @property(Node)
    numNode: Node = null!;      // 对应 Num 节点

    @property(Sprite)
    iconSprite: Sprite = null!; // 对应 Icon 节点上的 Sprite

    @property(Label)
    nicknameLabel: Label = null!; // 对应 Nickname 节点

    @property(Label)
    numsLabel: Label = null!;   // 对应 Nums 节点

    @property([SpriteFrame])
    topThreeIcons: SpriteFrame[] = []; // 前三名的专属图标 (金、银、铜)

    /**
     * 设置单条数据
     * @param rank 排名 (1, 2, 3...)
     * @param nickname 昵称
     * @param score 分数
     */
    public setData(rank: number, nickname: string, score: number) {
        // 1. 设置昵称和分数
        this.nicknameLabel.string = nickname;
        this.numsLabel.string = score.toString();

        // 2. 处理排名显示 (1-3名用Icon，4名及以后用Label)
        if (rank <= 3) {
            // 显示 Icon，隐藏 Num
            this.numNode.active = false;
            this.iconSprite.node.active = true;
            
            // 设置前三名对应的图标 (确保数组里有3张图)
            if (this.topThreeIcons.length >= rank) {
                this.iconSprite.spriteFrame = this.topThreeIcons[rank - 1];
            }
        } else {
            // 显示 Num，隐藏 Icon
            this.numNode.active = true;
            this.iconSprite.node.active = false;
            
            // 设置数字文本
            // 注意：如果 Num 节点上挂的是 Label，获取并设置它
            const numLabel = this.numNode.getComponent(Label);
            if (numLabel) {
                numLabel.string = rank.toString();
            } else {
                console.warn("Num 节点上未找到 Label 组件！");
            }
        }
    }
}