import { HttpUtil } from './HttpUtil';
import { WxApi } from './HttpTypes';

export interface LoginUser {
    id: string;
    nickname: string;
    avatarUrl?: string;
}

export interface LoginResponse {
    token: string;
    user: LoginUser;
}

export class Login {
    public static async login(): Promise<LoginResponse> {
        const code = await this.getWxLoginCode();
        const result = await HttpUtil.request<LoginResponse>({
            url: '/api/login',
            method: 'POST',
            body: { code },
            refreshOnUnauthorized: false,
        });
        this.saveToken(result.token);
        return result;
    }

    public static setupTokenRefresh(): void {
        HttpUtil.setTokenExpiredHandler(async () => {
            await this.login();
        });
    }

    private static getWxLoginCode(): Promise<string> {
        const wxApi = (globalThis as unknown as { wx?: WxApi }).wx;
        if (!wxApi?.login) {
            return Promise.resolve(`browser-${Date.now()}`);
        }

        return new Promise((resolve, reject) => {
            wxApi.login({
                success: (result) => result.code ? resolve(result.code) : reject(new Error('微信登录未返回 code')),
                fail: reject,
            });
        });
    }

    private static saveToken(token: string): void {
        const wxApi = (globalThis as unknown as { wx?: WxApi }).wx;
        if (wxApi) {
            wxApi.setStorageSync('token', token);
        } else if (typeof localStorage !== 'undefined') {
            localStorage.setItem('token', token);
        }
    }
}