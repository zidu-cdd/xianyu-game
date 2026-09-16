import {
    _decorator,
    Component,
    Sprite,
    Label,
    Animation,
    UITransform,
    director,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Loading')
export class Loading extends Component {

    @property(Sprite)
    fillBar: Sprite | null = null;

    @property(Sprite)
    effect: Sprite | null = null;

    @property(Label)
    loadingText: Label | null = null;

    @property(Sprite)
    progressBar: Sprite = null;

    @property
    loadingDuration = 3;

    private progress = 0;

    private isLoading = false;

    private elapsedTime = 0;

    onLoad() {
        this.initLoading();
    }

    start() {
       
    }

    update(deltaTime: number) {

        if (!this.isLoading) {
            return;
        }

        this.elapsedTime += deltaTime;

        this.progress = Math.min(
            this.elapsedTime / this.loadingDuration,
            1
        );

        this.updateProgressUI();

        if (this.progress >= 1) {
            this.finishLoading();
        }
    }

    private initLoading() {

        this.progress = 0;
        this.elapsedTime = 0;
        this.isLoading = true;

        this.updateProgressUI();
    }

    private updateProgressUI() {

        const percent = Math.floor(this.progress * 100);

        // Fill
        if (this.fillBar && this.fillBar.spriteFrame) {
            this.fillBar.fillRange = this.progress;
        }

        // Effect
        this.updateEffectPosition();

        // Text
        if (this.loadingText) {
            this.loadingText.string =
                `加载中... ${percent}%`;
        }
    }

    private updateEffectPosition() {

        if (!this.effect || !this.fillBar) {
            return;
        }

        const progressBarTransform =
            this.progressBar.getComponent(UITransform);

        if (!progressBarTransform) {
            return;
        }
        const effectTransform = 
            this.effect.getComponent(UITransform)

        const width =
            progressBarTransform.contentSize.width;

        const effectWidth =
            effectTransform.contentSize.width;

        const leftX = -width / 2;

        const x =
            leftX + width * this.progress - effectWidth / 2 ;

        this.effect.node.setPosition(
            x,
            this.effect.node.position.y,
            0
        );
    }


    private finishLoading() {

        if (!this.isLoading) {
            return;
        }

        this.isLoading = false;

        this.progress = 1;

        this.updateProgressUI();

    
        director.loadScene('Home');
    }
}