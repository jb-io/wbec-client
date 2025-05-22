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
    private _timeoutHandle: NodeJS.Timeout | null = null;

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

    public reset(): void {
        // Cancel the current timeout if exists
        if (this._timeoutHandle !== null) {
            clearTimeout(this._timeoutHandle);
            this._timeoutHandle = null;
        }

        // Reject all pending tasks in the queue
        const resetError = new Error("Operation cancelled: The request queue was reset");
        while (this._requestQueue.length > 0) {
            const entry = this._requestQueue.shift()!;
            entry.reject(resetError);
        }

        // Reset state to initial values
        this._lastRequestTime = 0;
        this._isProcessingQueue = false;
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
            this._timeoutHandle = null;
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
            this._timeoutHandle = setTimeout(executeRequest, this._maxRequestInterval - timeSinceLastRequest);
        } else {
            executeRequest();
        }
    }
}
