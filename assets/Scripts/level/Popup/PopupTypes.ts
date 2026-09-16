/**
 *  通关
 * 
 */

export interface LevelClearedData {

    level: number;

    name: string;

    score: number;

    star: number;
}

/**
 *  获得道具
 * 
 */
export interface GettingData {

    itemId: string;

    iconPath: string;

    name: string;

    count?: number;

    countPath?: string
}

/**
 *  补充道具
 * 
 */

export interface InsufficientData {

    itemId: string;

    iconPath: string;

    name: string;

    currentCount: number;

    requiredCount: number;
}

/**
 * 闯关失败
 * 
 */
export interface FailedData {

    level: number;

    name: string;

    star?: number;
}

export type PopupType =
    | 'LevelCleared'
    | 'Getting'
    | 'Insufficient'
    | 'Failed';