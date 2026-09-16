import {
    _decorator,
    Component,
    Label,
    Sprite,
    Node,
    director,
} from 'cc';

import { FailedData } from './PopupTypes';

const { ccclass, property } = _decorator;

@ccclass('Failed')
export class Failed extends Component {

    @property(Label)
    levelLabel: Label | null = null;

    @property(Sprite)
    starBg: Sprite | null = null;

    @property(Node)
    replayBtn: Node | null = null;

    protected onLoad(): void {
        const replayNode = this.replayBtn ?? this.node.getChildByName('Restart');
        if (replayNode) {
            replayNode.on(Node.EventType.TOUCH_END, this.onReplay, this);
        }
    }


    protected onDestroy(): void {
        const replayNode = this.replayBtn ?? this.node.getChildByName('Restart');
        if (replayNode && replayNode.isValid) {
            replayNode.off(Node.EventType.TOUCH_END, this.onReplay, this);
        }
    }

    public setData(data: FailedData): void {

        if (this.levelLabel) {
            this.levelLabel.string = `${data.name}`;
        }
    }

    private onReplay(): void {
        director.loadScene('Level');
    }
}
