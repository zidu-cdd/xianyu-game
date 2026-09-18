import {
    _decorator,
    Component,
    AudioSource,
    resources,
    AudioClip,
    director,
    Node,
    sys
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {

    private static readonly BGM_ENABLED_KEY = 'audio.bgm.enabled';
    private static readonly SFX_ENABLED_KEY = 'audio.sfx.enabled';
    private static instance: AudioManager | null = null;

    @property(AudioSource)
    bgmSource: AudioSource | null = null;

    @property(AudioSource)
    sfxSource: AudioSource | null = null;

    private bgmEnabled: boolean = true;
    private sfxEnabled: boolean = true;

    onLoad() {
        if (AudioManager.instance) {
            this.node.destroy();
            return;
        }

        AudioManager.instance = this;

        this.bgmEnabled = this.loadEnabled(AudioManager.BGM_ENABLED_KEY);
        this.sfxEnabled = this.loadEnabled(AudioManager.SFX_ENABLED_KEY);

        if (!this.bgmSource) {
            this.bgmSource = this.node.addComponent(AudioSource);
        }
        if (!this.sfxSource) {
            this.sfxSource = this.node.addComponent(AudioSource);
        }

        // 跨场景不销毁
        // 如果你的项目需要跨场景保持 BGM，打开这一行
        director.addPersistRootNode(this.node);

        this.playBGM();
    }

    /**
     * 播放背景音乐
     */
    public playBGM() {

        if (!this.bgmEnabled) {
            return;
        }

        resources.load(
            'audio/bgm/bgm',
            AudioClip,
            (err, clip) => {

                if (err) {
                    console.error('[AudioManager] BGM 加载失败:', err);
                    return;
                }

                if (!this.bgmSource) {
                    console.error('[AudioManager] bgmSource 没有绑定');
                    return;
                }

                this.bgmSource.clip = clip;
                this.bgmSource.loop = true;
                this.bgmSource.play();
            }
        );
    }

    /**
     * 播放音效
     */
    public playSFX(path: string) {

        if (!this.sfxEnabled) {
            return;
        }

        resources.load(
            path,
            AudioClip,
            (err, clip) => {

                if (err) {
                    console.error(
                        '[AudioManager] 音效加载失败:',
                        path,
                        err
                    );
                    return;
                }

                if (!this.sfxSource) {
                    console.error('[AudioManager] sfxSource 没有绑定');
                    return;
                }

                this.sfxSource.playOneShot(clip);
            }
        );
    }

    /**
     * BGM 开关
     */
    public setBGMEnabled(enabled: boolean) {

        this.bgmEnabled = enabled;
        this.saveEnabled(AudioManager.BGM_ENABLED_KEY, enabled);

        if (!this.bgmSource) {
            return;
        }

        if (enabled) {
            this.playBGM();
        } else {
            this.bgmSource.stop();
        }
    }

    /**
     * 音效开关
     */
    public setSFXEnabled(enabled: boolean) {
        this.sfxEnabled = enabled;
        this.saveEnabled(AudioManager.SFX_ENABLED_KEY, enabled);
    }

    public isBGMEnabled(): boolean {
        return this.bgmEnabled;
    }

    public isSFXEnabled(): boolean {
        return this.sfxEnabled;
    }

    public toggleBGM(): boolean {
        this.setBGMEnabled(!this.bgmEnabled);
        return this.bgmEnabled;
    }

    public toggleSFX(): boolean {
        this.setSFXEnabled(!this.sfxEnabled);
        return this.sfxEnabled;
    }

    /**
     * 停止 BGM
     */
    public stopBGM() {

        if (this.bgmSource) {
            this.bgmSource.stop();
        }
    }

    /**
     * 获取实例
     */
    public static getInstance(): AudioManager | null {
        if (!AudioManager.instance) {
            const node = new Node('AudioManager');
            AudioManager.instance = node.addComponent(AudioManager);
        }
        return AudioManager.instance;
    }

    private loadEnabled(key: string): boolean {
        const saved = sys.localStorage.getItem(key);
        return saved === null ? true : saved === 'true';
    }

    private saveEnabled(key: string, enabled: boolean): void {
        sys.localStorage.setItem(key, String(enabled));
    }
}