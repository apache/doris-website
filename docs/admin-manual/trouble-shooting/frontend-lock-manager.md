---
{
  "title": "FE Lock Management",
  "language": "en"
}


---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

FE Lock Management is used to detect potential deadlocks and slow locks within the FE process, making it easier for users to identify and troubleshoot issues in production, as well as monitor lock usage.

:::tip
This feature is experimental and is supported starting from version 2.1.6.
:::

## Deadlock Detection

The FE Lock Management module offers deadlock detection, a feature designed to automatically identify deadlocks.

By default, this feature is disabled but can be enabled via configuration settings. When enabled, deadlock detection will periodically check for deadlocks, with a default interval of 5 minutes. You can adjust this interval by setting the `deadlock_detection_interval_minute` parameter.

The results of deadlock detection will be logged, and if any deadlocks are detected, corresponding warning logs will be generated. 
To check for deadlocks, search the logs for the keyword `Deadlocks detected`.

Log Content Example (Original Log in a Single Line of Text):
```log
2024-08-15 12:55:46  [ pool-1-thread-1:1034 ] - [ WARN ]  Find dead lock, info ["Thread-0" prio=5 Id=15 WAITING on java.util.concurrent.locks.ReentrantLock$NonfairSync@5b7e0fca owned by "Thread-1" Id=16
	at java.base@17.0.6/jdk.internal.misc.Unsafe.park(Native Method)
	-  waiting on java.util.concurrent.locks.ReentrantLock$NonfairSync@5b7e0fca
	at java.base@17.0.6/java.util.concurrent.locks.LockSupport.park(LockSupport.java:211)
	at java.base@17.0.6/java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(AbstractQueuedSynchronizer.java:715)
	at java.base@17.0.6/java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(AbstractQueuedSynchronizer.java:938)
	at java.base@17.0.6/java.util.concurrent.locks.ReentrantLock$Sync.lock(ReentrantLock.java:153)
	at java.base@17.0.6/java.util.concurrent.locks.ReentrantLock.lock(ReentrantLock.java:322)
	at app//org.example.lock.MonitoredReentrantLock.lock(MonitoredReentrantLock.java:22)
	at app//org.example.Main.lambda$testDeadLock$3(Main.java:79)
	...

	Number of locked synchronizers = 1
	- java.util.concurrent.locks.ReentrantLock$NonfairSync@9abbac5

, "Thread-1" prio=5 Id=16 WAITING on java.util.concurrent.locks.ReentrantLock$NonfairSync@9abbac5 owned by "Thread-0" Id=15
	at java.base@17.0.6/jdk.internal.misc.Unsafe.park(Native Method)
	-  waiting on java.util.concurrent.locks.ReentrantLock$NonfairSync@9abbac5
	at java.base@17.0.6/java.util.concurrent.locks.LockSupport.park(LockSupport.java:211)
	at java.base@17.0.6/java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(AbstractQueuedSynchronizer.java:715)
	at java.base@17.0.6/java.util.concurrent.locks.AbstractQueuedSynchronizer.acquire(AbstractQueuedSynchronizer.java:938)
	at java.base@17.0.6/java.util.concurrent.locks.ReentrantLock$Sync.lock(ReentrantLock.java:153)
	at java.base@17.0.6/java.util.concurrent.locks.ReentrantLock.lock(ReentrantLock.java:322)
	at app//org.example.lock.MonitoredReentrantLock.lock(MonitoredReentrantLock.java:22)
	at app//org.example.Main.lambda$testDeadLock$4(Main.java:93)
	...

	Number of locked synchronizers = 1
	- java.util.concurrent.locks.ReentrantLock$NonfairSync@5b7e0fca

]
```
### Configuration Parameters

The following are the deadlock detection-related parameters in the `fe.conf` configuration file:

| Parameter Name                               | Description         | Default Value   |
|------------------------------------|--------------|-------|
| enable_deadlock_detection          | 	Enables deadlock detection   | false |
| deadlock_detection_interval_minute | Deadlock detection interval (in minutes) | 5     |

## Slow Lock Detection
The FE Lock Management module also includes slow lock detection. This feature monitors all locks related to databases, tables, and transactions. If a lock is held for longer than a specified threshold (10 seconds by default), a corresponding warning log will be generated.
To check for slow locks, search the logs for the keyword `Lock held for`.

Log Content Example (Original Log in a Single Line of Text):
```log
2024-08-12 16:38:51,004 INFO (mysql-nio-pool-0|242) [StreamEncoder.writeBytes():234] 2024-08-12 16:38:51  [ mysql-nio-pool-0:47482 ] - [ WARN ]  Thread ID: 242, Thread Name: mysql-nio-pool-0 - Lock held for 1923 ms, exceeding hold timeout of 1923 ms Thread stack trace:	at java.base/java.lang.Thread.getStackTrace(Thread.java:1610)
	at org.apache.doris.common.lock.AbstractMonitoredLock.afterUnlock(AbstractMonitoredLock.java:59)
	at org.apache.doris.common.lock.MonitoredReentrantLock.unlock(MonitoredReentrantLock.java:59)
	at org.apache.doris.datasource.InternalCatalog.unlock(InternalCatalog.java:370)
	at org.apache.doris.datasource.InternalCatalog.createDb(InternalCatalog.java:443)
	at org.apache.doris.catalog.Env.createDb(Env.java:3150)
	at org.apache.doris.qe.DdlExecutor.execute(DdlExecutor.java:168)
	at org.apache.doris.qe.StmtExecutor.handleDdlStmt(StmtExecutor.java:3066)
	at org.apache.doris.qe.StmtExecutor.executeByLegacy(StmtExecutor.java:1059)
	at org.apache.doris.qe.StmtExecutor.execute(StmtExecutor.java:644)
	at org.apache.doris.qe.StmtExecutor.queryRetry(StmtExecutor.java:562)
	at org.apache.doris.qe.StmtExecutor.execute(StmtExecutor.java:552)
	at org.apache.doris.qe.ConnectProcessor.executeQuery(ConnectProcessor.java:385)
	at org.apache.doris.qe.ConnectProcessor.handleQuery(ConnectProcessor.java:237)
	at org.apache.doris.qe.MysqlConnectProcessor.handleQuery(MysqlConnectProcessor.java:272)
	at org.apache.doris.qe.MysqlConnectProcessor.dispatch(MysqlConnectProcessor.java:300)
	at org.apache.doris.qe.MysqlConnectProcessor.processOnce(MysqlConnectProcessor.java:359)
	at org.apache.doris.mysql.ReadListener.lambda$handleEvent$0(ReadListener.java:52)
	at java.base/java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1136)
	at java.base/java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:635)
	at java.base/java.lang.Thread.run(Thread.java:833)

```
### Configuration Parameters
The following are the slow lock detection-related parameters in the `fe.conf` configuration file:

| Parameter Name                               | Description         | Default Value   |
| --- | --- | --- |
| max_lock_hold_threshold_seconds | Threshold for slow lock warnings (in seconds) | 10 |

