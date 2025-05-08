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


const DEFAULT_OPTIONS: Required<WbecDeviceOptions> = {
    timeout: 5000,
    maxRequestInterval: 1000,
};

export class WbecClient {

    private readonly _host: string;
    private readonly _timeout: number;
    private readonly _maxRequestInterval: number;

    private _lastRequestTime: number = 0;
    private _requestQueue: Array<{
        resolve: (value: any) => void;
        reject: (error: any) => void;
        execute: () => Promise<any>;
    }> = [];
    private _isProcessingQueue: boolean = false;

    constructor(host: string, options: WbecDeviceOptions) {
        this._host = host;

        const fullOptions: Required<WbecDeviceOptions> = {...DEFAULT_OPTIONS, ...options};
        this._timeout = fullOptions.timeout;
        this._maxRequestInterval = fullOptions.maxRequestInterval;
    }

    get host(): string {
        return 'http://' + this._host;
    }

    private processRequestQueue(): void {
        if (this._isProcessingQueue || this._requestQueue.length === 0) {
            return;
        }

        this._isProcessingQueue = true;
        const now = Date.now();
        const timeSinceLastRequest = now - this._lastRequestTime;
        const queueEntry = this._requestQueue.shift()!;

        const executeRequest = () => {
            queueEntry.execute()
                .then(queueEntry.resolve)
                .catch(queueEntry.reject)
                .finally(() => {
                    this._lastRequestTime = Date.now();
                    this._isProcessingQueue = false;
                    this.processRequestQueue();
                });
        };

        if (timeSinceLastRequest < this._maxRequestInterval) {
            setTimeout(executeRequest, this._maxRequestInterval - timeSinceLastRequest);
        } else {
            executeRequest();
        }
    }

    private requestGet<T>(uri: string, config?: AxiosRequestConfig<any>): Promise<T> {
        return new Promise((resolve, reject) => {
            const execute = () => axios.get(`${this.host}${uri}`, {
                timeout: this._timeout,
                ...config,
            }).then(response => response.data);

            this._requestQueue.push({ resolve, reject, execute });
            this.processRequestQueue();
        });
    }

    private async requestGetJsonResponse<T>(uri: string): Promise<T> {
        return this.requestGet(uri, {responseType: 'json'});
    }

    public async requestConfig(): Promise<WbecConfigResponse> {
        return this.requestGetJsonResponse<WbecConfigResponse>(`/cfg`);
    }

    public async requestJson(id: BoxId | null = null): Promise<WbecJsonResponse> {
        const idQuery = id !== null ? `?id=${id}` : '';
        return this.requestGetJsonResponse<WbecJsonResponse>(`/json${idQuery}`);
    }

    public async requestPv(): Promise<WbecPvResponse> {
        return this.requestGetJsonResponse<WbecPvResponse>(`/pv`);
    }

    public async requestStatus(id: BoxId): Promise<WbecStatusResponse> {
        return this.requestGetJsonResponse<WbecStatusResponse>(`/status?box=${id}`);
    }

    public async requestChargeLog(id: BoxId, length: number = 10): Promise<WbecChargeLogResponse> {
        return this.requestGetJsonResponse<WbecChargeLogResponse>(`/chargelog?id=${id}&len=${length}`);
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
        return this.requestGetJsonResponse<WbecPvResponse>(`/pv?${queryString}`);
    }

    public async setCurrentLimit(id: BoxId, currentLimit: number): Promise<WbecJsonResponse> {
        const queryString = `?currLim=${currentLimit}&id=${id}`;
        return this.requestGetJsonResponse<WbecJsonResponse>(`/json` + queryString);
    }

    public async reset(): Promise<void> {
        await this.requestGet('/reset');
    }

}
