import {
    WbecDeviceOptions,
    BoxId,
    WbecJsonResponse,
    PvMode,
    WbecPvResponse,
    WbecConfigResponse,
    WbecStatusResponse,
    WbecChargeLogResponse,
} from "./types";
import {default as axios, AxiosRequestConfig} from 'axios';
import RateLimitedTaskQueue from './RateLimitedTaskQueue';


const DEFAULT_OPTIONS: Required<WbecDeviceOptions> = {
    timeout: 5000,
    maxRequestInterval: 1000,
};

export default class WbecClient {

    private readonly _host: string;
    private readonly _timeout: number;

    private readonly _requestQueue: RateLimitedTaskQueue;

    constructor(host: string, options: WbecDeviceOptions) {
        this._host = host;

        const fullOptions: Required<WbecDeviceOptions> = {...DEFAULT_OPTIONS, ...options};
        this._timeout = fullOptions.timeout;

        this._requestQueue = new RateLimitedTaskQueue(fullOptions.maxRequestInterval);
    }

    public clientReset(): void {
        this._requestQueue.reset();
    }

    get host(): string {
        return 'http://' + this._host;
    }

    private requestGet<T>(uri: string, config?: AxiosRequestConfig<any>, queueKey?: string): Promise<T> {
        return this._requestQueue.enqueue(() => axios.get(`${this.host}${uri}`, {
            timeout: this._timeout,
            ...config,
        }).then(response => response.data), queueKey);
    }

    private async requestGetJsonResponse<T>(uri: string, queueKey?: string): Promise<T> {
        return this.requestGet(uri, {responseType: 'json'}, queueKey);
    }

    public async requestConfig(): Promise<WbecConfigResponse> {
        return this.requestGetJsonResponse<WbecConfigResponse>(`/cfg`, 'cfg');
    }

    public async requestJson(id: BoxId | null = null): Promise<WbecJsonResponse> {
        const idQuery = id !== null ? `?id=${id}` : '';
        return this.requestGetJsonResponse<WbecJsonResponse>(`/json${idQuery}`, `json${id}`);
    }

    public async requestPv(): Promise<WbecPvResponse> {
        return this.requestGetJsonResponse<WbecPvResponse>(`/pv`, `pv`);
    }

    public async requestStatus(id: BoxId): Promise<WbecStatusResponse> {
        return this.requestGetJsonResponse<WbecStatusResponse>(`/status?box=${id}`, `status${id}`);
    }

    public async requestChargeLog(id: BoxId, length: number = 10): Promise<WbecChargeLogResponse> {
        return this.requestGetJsonResponse<WbecChargeLogResponse>(`/chargelog?id=${id}&len=${length}`, `chargelog${id}-${length}`);
    }

    public async setPvValue(parameters: {
        pvWbId?: BoxId,
        pvWatt?: number,
        pvBatt?: number,
        pvMode?: PvMode
    }): Promise<WbecPvResponse> {
        const queryParameters = [];
        for (const valueKey in parameters) {
            const value = parameters[valueKey as keyof typeof parameters];
            queryParameters.push(`${valueKey}=${value}`);
        }
        const queryString = queryParameters.join('&');
        return this.requestGetJsonResponse<WbecPvResponse>(`/pv?${queryString}`, 'pvset-' + Object.keys(parameters).join('+'));
    }

    public async setCurrentLimit(id: BoxId, currentLimit: number): Promise<WbecJsonResponse> {
        const queryString = `?currLim=${currentLimit}&id=${id}`;
        return this.requestGetJsonResponse<WbecJsonResponse>(`/json` + queryString, `jsonset${id}`);
    }

    public async reset(): Promise<void> {
        await this.requestGet('/reset', {},'reset');
    }

}
