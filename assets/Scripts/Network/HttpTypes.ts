export interface HttpRequestOptions {
    url: string;
    method?: 'GET' | 'POST';
    query?: Record<string, string | number | boolean | null | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
    /** 登录接口等场景可关闭 401 后自动刷新 Token。 */
    refreshOnUnauthorized?: boolean;
}

export interface ApiResponse<T> {
    code: number | string;
    message?: string;
    data: T;
    [key: string]: unknown;
}

export interface HttpErrorShape {
    status?: number;
    code?: number | string;
    message: string;
    data?: unknown;
}

export class HttpError extends Error implements HttpErrorShape {
    public readonly status?: number;
    public readonly code?: number | string;
    public readonly data?: unknown;

    constructor(message: string, status?: number, code?: number | string, data?: unknown) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.code = code;
        this.data = data;
    }
}

export interface WxRequestSuccess<T> {
    statusCode: number;
    data: T;
}

export interface WxRequestTask {
    abort?: () => void;
}

export interface WxRequestOptions<T> {
    url: string;
    method: 'GET' | 'POST';
    data?: unknown;
    header?: Record<string, string>;
    success: (result: WxRequestSuccess<T>) => void;
    fail: (error: unknown) => void;
}

export interface WxLoginSuccess {
    code: string;
}

export interface WxStorage {
    getStorageSync: (key: string) => unknown;
    setStorageSync: (key: string, value: unknown) => void;
    removeStorageSync: (key: string) => void;
}

export interface WxApi extends WxStorage {
    request: <T>(options: WxRequestOptions<T>) => WxRequestTask;
    login: (options: {
        success: (result: WxLoginSuccess) => void;
        fail: (error: unknown) => void;
    }) => void;
    showToast?: (options: { title: string; icon?: 'none' | 'success' | 'error' }) => void;
}