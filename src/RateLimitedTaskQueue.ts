type PromiseCallback<T> = (value: T) => void;
interface RequestQueueEntry {
    resolve: PromiseCallback<any>;
    reject: PromiseCallback<any>;
    execute: () => Promise<any>;
    key?: string;
}

export default class RateLimitedTaskQueue {
    private _lastRequestTime: number = 0;
    private _isProcessingQueue: boolean = false;
    private _requestQueue: Array<RequestQueueEntry> = [];

    constructor(private readonly _maxRequestInterval: number) {}

    public enqueue<T>(task: () => Promise<T>, key?: string): Promise<T> {
        return new Promise((resolve, reject) => {
            const entry: RequestQueueEntry = {
                resolve,
                reject,
                execute: task,
                key
            };

            if (key) {
                const existingEntryIndex = this._requestQueue.findIndex(item => item.key === key);

                if (existingEntryIndex >= 0) {
                    const existingEntry = this._requestQueue[existingEntryIndex];

                    existingEntry.execute = task;

                    const chainCallbacks = function <T>(callbacks: PromiseCallback<T>[]): PromiseCallback<T> {
                        return (value: T) => {
                            callbacks.forEach(callback => callback(value));
                        };
                    }
                    existingEntry.resolve = chainCallbacks([existingEntry.resolve, resolve]);
                    existingEntry.reject = chainCallbacks([existingEntry.reject, reject]);

                    this.processQueue();
                    return;
                }
            }

            this._requestQueue.push(entry);
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
            queueEntry.key = undefined;
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
