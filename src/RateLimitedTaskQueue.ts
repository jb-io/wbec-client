interface RequestQueueEntry {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    execute: () => Promise<any>;
}

export default class RateLimitedTaskQueue {
    private _lastRequestTime: number = 0;
    private _isProcessingQueue: boolean = false;
    private _requestQueue: Array<RequestQueueEntry> = [];

    constructor(private readonly _maxRequestInterval: number) {}

    public enqueue<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this._requestQueue.push({
                resolve,
                reject,
                execute: task
            });
            this.processQueue();
        });
    }

    private processQueue(): void {
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
                    this.processQueue();
                });
        };

        if (timeSinceLastRequest < this._maxRequestInterval) {
            setTimeout(executeRequest, this._maxRequestInterval - timeSinceLastRequest);
        } else {
            executeRequest();
        }
    }
}
