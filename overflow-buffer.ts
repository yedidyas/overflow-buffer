function start() {
    // Start running health check and monitoring endless loops
    startHealthCheck();
    startMonitoring();
     
    // Create the SQS throttled client (inherits regular SQS client)
    client = new ThrottledSqsClient(
        config.get('queue') as QueueConfig,
        new DbMessagesHandler(),
        // Promises mechanism: only when all the promises are returned, the SQS keep popping messages.
        // This is what actually creates the delay or the the freeze of the DB writes.
        // Every Throttle logic of the following check different environment parameters and decide if the SQS is allowed to pop more messages.
        new MultiThrottle([
            // Checks if a DB parameter is lower/greater than X, and if so - totally stop the SQS messages popping (configured now to greater than 90% CPU)
            new RdsHealthThrottle(),
            // If there are not enough DB connections in the connection pool for the current worker, wait until there are free connections
            new DbQueueThrottle(),
            // If the SQS is empty, wait until the next pop (configured to one second)
            new EmptyQueueThrottle(),
            // If there are more than X threads, wait until they are decreased (configured to 100 threads now)
            new MaxThreadsThrottle(),
            // Similar to the first throttle logic (RdsHealthThrottle), but smarter: knows to decrease the pop pace according to the DB parameter
            // (for example: 72% CPU will decrease the pace by 5%, 74% by 8% etc.)
            new RdsThresholdThrottle()
        ])
    )
     
    client.listen();
}
