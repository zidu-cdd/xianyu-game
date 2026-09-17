import { ApiResponse, HttpError, HttpRequestOptions, WxApi } from './HttpTypes';

export type TokenExpiredHandler = () => Promise<void>;

/** 微信小游戏使用 wx.request，浏览器预览使用 fetch。 */
export class HttpUtil {
    private static baseUrl = '';
    private static tokenExpiredHandler: TokenExpiredHandler | null = null;
    private static refreshingToken: Promise<void> | null = null;

    public static configure(baseUrl: string): void {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    public static setTokenExpiredHandler(handler: TokenExpiredHandler | null): void {
        this.tokenExpiredHandler = handler;
    }

    public static async get<T>(
        url: string,
        query?: Record<string, string | number | boolean | null | undefined>,
    ): Promise<T> {
        return this.request<T>({ url, method: 'GET', query });
    }

    public static async post<T>(url: string, body?: unknown): Promise<T> {
        return this.request<T>({ url, method: 'POST', body });
    }

    public static async request<T>(options: HttpRequestOptions): Promise<T> {
        const requestOptions = {
            ...options,
            url: this.buildUrl(options.url, options.query),
            method: options.method ?? 'GET',
        };
        const wxApi = this.getWxApi();
        const token = wxApi?.getStorageSync('token') ?? this.getBrowserToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers.Authorization = `Bearer ${String(token)}`;
        }

        try {
            const response = wxApi
                ? await this.requestByWx<T>(requestOptions.url, requestOptions.method, options.body, headers, wxApi)
                : await this.requestByFetch<T>(requestOptions.url, requestOptions.method, options.body, headers);
            return this.unwrapResponse<T>(response.data, response.statusCode, options.refreshOnUnauthorized !== false);
        } catch (error) {
            const httpError = this.toHttpError(error);
            if (this.shouldRefreshToken(httpError, options.refreshOnUnauthorized !== false)) {
                await this.refreshTokenOnce();
                return this.request<T>({ ...options, refreshOnUnauthorized: false });
            }

            this.showError(httpError.message);
            throw httpError;
        }
    }

    private static buildUrl(url: string, query?: Record<string, string | number | boolean | null | undefined>): string {
        const fullUrl = /^https?:\/\//.test(url) ? url : `${this.baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
        if (!query) return fullUrl;

        const queryString = Object.keys(query)
            .filter((key) => query[key] !== null && query[key] !== undefined)
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(query[key]))}`)
            .join('&');
        return queryString ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}` : fullUrl;
    }

    private static requestByWx<T>(
        url: string,
        method: 'GET' | 'POST',
        body: unknown,
        headers: Record<string, string>,
        wxApi: WxApi,
    ): Promise<{ statusCode: number; data: unknown }> {
        return new Promise((resolve, reject) => {
            wxApi.request<T>({
                url,
                method,
                data: body,
                header: headers,
                success: resolve,
                fail: reject,
            });
        });
    }

    private static async requestByFetch<T>(
        url: string,
        method: 'GET' | 'POST',
        body: unknown,
        headers: Record<string, string>,
    ): Promise<{ statusCode: number; data: unknown }> {
        if (typeof fetch !== 'function') {
            throw new HttpError('当前环境不支持 wx.request 或 fetch');
        }

        const response = await fetch(url, {
            method,
            headers,
            body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
        });
        const data = await response.json().catch(() => null);
        return { statusCode: response.status, data };
    }

    private static unwrapResponse<T>(data: unknown, statusCode: number, refreshOnUnauthorized: boolean): T {
        if (statusCode < 200 || statusCode >= 300) {
            const response = data as Partial<ApiResponse<unknown>> | null;
            throw new HttpError(response?.message || `请求失败（${statusCode}）`, statusCode, response?.code, data);
        }

        if (!data || typeof data !== 'object' || !('code' in data)) {
            return data as T;
        }

        const response = data as ApiResponse<T>;
        if (!this.isSuccessCode(response.code)) {
            throw new HttpError(response.message || '业务请求失败', statusCode, response.code, response.data);
        }

        return response.data;
    }

    private static isSuccessCode(code: number | string): boolean {
        return code === 0 || code === 200 || code === '0' || code === '200' || code === 'SUCCESS';
    }

    private static shouldRefreshToken(error: HttpError, enabled: boolean): boolean {
        if (!enabled || !this.tokenExpiredHandler) return false;
        return error.status === 401 || error.status === 403 || error.code === 'TOKEN_EXPIRED' || error.code === 40101;
    }

    private static async refreshTokenOnce(): Promise<void> {
        if (!this.refreshingToken && this.tokenExpiredHandler) {
            this.refreshingToken = this.tokenExpiredHandler().then(
                () => {
                    this.refreshingToken = null;
                },
                (error) => {
                    this.refreshingToken = null;
                    throw error;
                },
            );
        }
        if (this.refreshingToken) await this.refreshingToken;
    }

    private static toHttpError(error: unknown): HttpError {
        if (error instanceof HttpError) return error;
        const message = error instanceof Error ? error.message : '网络请求失败';
        return new HttpError(message);
    }

    private static showError(message: string): void {
        const wxApi = this.getWxApi();
        if (wxApi?.showToast) {
            wxApi.showToast({ title: message || '网络请求失败', icon: 'none' });
        } else {
            console.error('[HttpUtil]', message);
        }
    }

    private static getWxApi(): WxApi | null {
        return (globalThis as unknown as { wx?: WxApi }).wx ?? null;
    }

    private static getBrowserToken(): string | null {
        return typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
    }
}