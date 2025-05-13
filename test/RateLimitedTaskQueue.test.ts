import RateLimitedTaskQueue from '../src/RateLimitedTaskQueue';

describe('RateLimitedTaskQueue', () => {
    // Helper function to create tracked tasks
    function createTrackedTask<T>(result: T, taskName: string, executionLog: string[]): () => Promise<T> {
        return async () => {
            executionLog.push(taskName);
            return result;
        };
    }

    // Helper function to wait for a specified time
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should execute tasks in the order they were added', async () => {
        // Arrange
        const queue = new RateLimitedTaskQueue(0); // No interval between requests
        const executionLog: string[] = [];

        // Act
        const promise1 = queue.enqueue(createTrackedTask('Task 1 Result', 'Task 1', executionLog));
        const promise2 = queue.enqueue(createTrackedTask('Task 2 Result', 'Task 2', executionLog));
        const promise3 = queue.enqueue(createTrackedTask('Task 3 Result', 'Task 3', executionLog));

        // Wait for all promises to resolve
        await Promise.all([promise1, promise2, promise3]);

        // Assert
        expect(executionLog).toEqual(['Task 1', 'Task 2', 'Task 3']);
        expect(await promise1).toBe('Task 1 Result');
        expect(await promise2).toBe('Task 2 Result');
        expect(await promise3).toBe('Task 3 Result');
    });

    test('should maintain proper waiting time between tasks', async () => {
        // Arrange
        const maxRequestInterval = 100; // 100ms wait time between requests
        const queue = new RateLimitedTaskQueue(maxRequestInterval);
        const executionLog: string[] = [];
        
        // Spy on setTimeout to verify timing
        const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
        
        // Act - Add first task that should execute immediately
        const startTime = Date.now();
        const promise1 = queue.enqueue(createTrackedTask('Task 1 Result', 'Task 1', executionLog));
        await promise1;
        
        // Add second task - should be delayed
        const promise2 = queue.enqueue(createTrackedTask('Task 2 Result', 'Task 2', executionLog));
        
        // Add third task - will be queued
        const promise3 = queue.enqueue(createTrackedTask('Task 3 Result', 'Task 3', executionLog));
        
        // Wait for all promises to resolve
        await Promise.all([promise2, promise3]);
        const endTime = Date.now();
        
        // Assert
        expect(executionLog).toEqual(['Task 1', 'Task 2', 'Task 3']);
        expect(await promise1).toBe('Task 1 Result');
        expect(await promise2).toBe('Task 2 Result');
        expect(await promise3).toBe('Task 3 Result');
        
        // Verify timing - should take at least 2 * maxRequestInterval total time
        const totalTime = endTime - startTime;
        expect(totalTime).toBeGreaterThanOrEqual(maxRequestInterval * 2);
        
        // Verify setTimeout was called at least once
        expect(setTimeoutSpy).toHaveBeenCalled();
    }, 10000); // Increased timeout to account for real timers

    test('should properly relay errors in tasks', async () => {
        // Arrange
        const queue = new RateLimitedTaskQueue(0);
        const error = new Error('Test Error');
        
        // Act & Assert
        const failingTask = () => Promise.reject(error);
        await expect(queue.enqueue(failingTask)).rejects.toThrow('Test Error');
    });

    test('should execute tasks immediately when enough time has passed', async () => {
        // Arrange
        const maxRequestInterval = 100;
        const queue = new RateLimitedTaskQueue(maxRequestInterval);
        const executionLog: string[] = [];

        // Act - First task
        const promise1 = queue.enqueue(createTrackedTask('Task 1 Result', 'Task 1', executionLog));
        await promise1;
        
        // Wait longer than the maxRequestInterval
        await wait(maxRequestInterval + 50);
        
        // The second task should execute immediately
        const beforeSecondTask = Date.now();
        const promise2 = queue.enqueue(createTrackedTask('Task 2 Result', 'Task 2', executionLog));
        await promise2;
        const afterSecondTask = Date.now();
        
        // Assert
        expect(executionLog).toEqual(['Task 1', 'Task 2']);
        
        // The second task should execute almost immediately (less than maxRequestInterval)
        const secondTaskTime = afterSecondTask - beforeSecondTask;
        expect(secondTaskTime).toBeLessThan(maxRequestInterval);
    }, 10000);

    test('should queue multiple tasks and execute them in order', async () => {
        // Arrange
        const maxRequestInterval = 100;
        const queue = new RateLimitedTaskQueue(maxRequestInterval);
        const executionLog: string[] = [];

        // Act - Add 5 tasks to the queue
        const startTime = Date.now();
        const promises = [];
        for (let i = 1; i <= 5; i++) {
            promises.push(queue.enqueue(createTrackedTask(`Result ${i}`, `Task ${i}`, executionLog)));
        }

        // Wait for all tasks to complete
        await Promise.all(promises);
        const endTime = Date.now();
        
        // Assert - Check execution order
        expect(executionLog).toEqual(['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5']);
        
        // Check that all results are correct
        const results = await Promise.all(promises);
        results.forEach((result, index) => {
            expect(result).toBe(`Result ${index + 1}`);
        });
        
        // Verify total execution time is at least (n-1) * maxRequestInterval
        const totalTime = endTime - startTime;
        expect(totalTime).toBeGreaterThanOrEqual(maxRequestInterval * 4);
    }, 10000);
});
