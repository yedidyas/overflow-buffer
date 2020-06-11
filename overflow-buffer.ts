function start() {
    // Start running health check and monitoring endless loops
    startHealthCheck();
    startMonitoring();
     
    client = new ThrottledSqsClient(
        config.get('queue') as QueueConfig,
        new DbMessagesHandler(),
        new MultiThrottle([
            new RdsHealthThrottle(),
            new DbQueueThrottle(),
            new EmptyQueueThrottle(),
            new MaxThreadsThrottle(),
            new RdsThresholdThrottle()
        ])
    )
     
    client.listen();
}
