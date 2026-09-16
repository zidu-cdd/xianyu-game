import {
    _decorator,
    Component,
    Label,
    Sprite,
    SpriteFrame,
    resources,
} from 'cc';

import { GettingData } from './PopupTypes';

const { ccclass, property } = _decorator;

@ccclass('Getting')
export class Getting extends Component {

    @property(Sprite)
    itemIcon: Sprite | null = null;

    @property(Label)
    itemName: Label | null = null;

    @property(Label)
    countLabel: Label | null = null;

    @property(Sprite)
    itemTipsBg: Sprite | null = null;


    public setData(data: GettingData): void {

        if (this.itemName) {
            this.itemName.string = data.name;
        }

        if (this.countLabel) {
            this.countLabel.string = `×${data.count}`;
        }

        this.loadIcon(data.iconPath);
        this.loadTipsPath(data.countPath);
    }


    private loadIcon(path: string): void {

        if (!this.itemIcon) {
            return;
        }

        resources.load(
            path + '/spriteFrame',
            SpriteFrame,
            (err, spriteFrame) => {

                if (err) {
                    console.error(
                        `获取弹窗道具图片加载失败：${path}`,
                        err
                    );
                    return;
                }

                if (!this.itemIcon || !this.itemIcon.isValid) {
                    return;
                }

                this.itemIcon.spriteFrame = spriteFrame;
            }
        );
    }

    private loadTipsPath(path: string): void {
        if(!this.itemTipsBg) {
            return
        }

        resources.load(
            path + '/spriteFrame',
            SpriteFrame,
            (err, spriteFrame) => {

                if (err) {
                    console.error(
                        `获取弹窗道具数量图片加载失败：${path}`,
                        err
                    );
                    return;
                }

                if (!this.itemTipsBg || !this.itemTipsBg.isValid) {
                    return;
                }

                this.itemTipsBg.spriteFrame = spriteFrame;
            }
        );
    }
}
