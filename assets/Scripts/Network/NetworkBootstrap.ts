import { _decorator, Component } from 'cc';
import { GameDataManager } from './GameDataManager';
import { HttpUtil } from './HttpUtil';
import { Login } from './Login';
import { RankingList } from '../Profile/Ranking/RankingList';

const { ccclass, property } = _decorator;

/** 挂到启动场景节点，在首页静态 UI 创建之外负责账号和服务端数据。 */
@ccclass('NetworkBootstrap')
export class NetworkBootstrap extends Component {
    @property(RankingList)
    rankingList: RankingList | null = null;

    @property
    apiBaseUrl = 'https://your-api.example.com';

    protected async start(): Promise<void> {
        HttpUtil.configure(this.apiBaseUrl);
        Login.setupTokenRefresh();

        try {
            await Login.login();
            const dataManager = GameDataManager.getInstance();
            await dataManager.loadAll();

            if (this.rankingList) {
                this.rankingList.updateRankings(dataManager.getRankings());
            }
        } catch (error) {
            console.error('[NetworkBootstrap] 登录或业务数据加载失败:', error);
        }
    }
}