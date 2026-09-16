import {
    _decorator,
    Component,
    Label,
    Sprite,
    SpriteFrame,
    resources,
} from 'cc';

import { InsufficientData } from './PopupTypes';

const { ccclass, property } = _decorator;

@ccclass('Insufficient')
export class Insufficient extends Component {

    @property(Sprite)
    itemIcon: Sprite | null = null;

    public setData(data: InsufficientData): void {

        this.loadIcon(data.iconPath);
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
                        `道具不足弹窗图片加载失败：${path}`,
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
}
