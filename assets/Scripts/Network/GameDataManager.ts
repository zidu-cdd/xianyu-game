import { HttpUtil } from './HttpUtil';

export interface UserLevelData {
    level: number;
    experience: number;
    requiredExperience: number;
}

export interface LevelProgress {
    levelId: string;
    unlocked: boolean;
    current: boolean;
    stars: number;
}

export interface ItemCount {
    itemId: string;
    count: number;
}

export interface RankingData {
    rank: number;
    nickname: string;
    score: number;
}

export class GameDataManager {
    private static instance: GameDataManager | null = null;
    private levelData: UserLevelData | null = null;
    private levels: LevelProgress[] = [];
    private items: ItemCount[] = [];
    private rankings: RankingData[] = [];

    public static getInstance(): GameDataManager {
        if (!this.instance) this.instance = new GameDataManager();
        return this.instance;
    }

    public async loadAll(): Promise<void> {
        const [level, levels, items, rankings] = await Promise.all([
            this.fetchLevel(),
            this.fetchLevels(),
            this.fetchItems(),
            this.fetchRankings(),
        ]);
        this.levelData = level;
        this.levels = levels;
        this.items = items;
        this.rankings = rankings;
    }

    public async fetchLevel(): Promise<UserLevelData> {
        this.levelData = await HttpUtil.get<UserLevelData>('/api/user/level');
        return this.levelData;
    }

    public async fetchLevels(): Promise<LevelProgress[]> {
        this.levels = await HttpUtil.get<LevelProgress[]>('/api/user/levels');
        return this.levels;
    }

    public async fetchItems(): Promise<ItemCount[]> {
        this.items = await HttpUtil.get<ItemCount[]>('/api/user/items');
        return this.items;
    }

    public async fetchRankings(): Promise<RankingData[]> {
        this.rankings = await HttpUtil.get<RankingData[]>('/api/rankings');
        return this.rankings;
    }

    public async updateExperience(amount: number): Promise<UserLevelData> {
        return this.updateLevelData(await HttpUtil.post<UserLevelData>('/api/user/experience', { amount }));
    }

    public async consumeItem(itemId: string, count = 1): Promise<ItemCount[]> {
        return this.updateItems(await HttpUtil.post<ItemCount[]>('/api/user/items/consume', { itemId, count }));
    }

    public async addItem(itemId: string, count = 1): Promise<ItemCount[]> {
        return this.updateItems(await HttpUtil.post<ItemCount[]>('/api/user/items/add', { itemId, count }));
    }

    public getLevel(): UserLevelData | null { return this.levelData; }
    public getLevels(): LevelProgress[] { return this.levels.slice(); }
    public getItems(): ItemCount[] { return this.items.slice(); }
    public getRankings(): RankingData[] { return this.rankings.slice(); }

    private updateLevelData(data: UserLevelData): UserLevelData {
        this.levelData = data;
        return data;
    }

    private updateItems(items: ItemCount[]): ItemCount[] {
        this.items = items;
        return items;
    }
}