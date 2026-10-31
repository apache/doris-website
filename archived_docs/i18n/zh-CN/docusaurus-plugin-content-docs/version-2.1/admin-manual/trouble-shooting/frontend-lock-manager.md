---
{
    "title": "FE 锁管理",
    "language": "zh-CN",
    "description": "FE 锁管理用于检测 FE 进程中可能出现的死锁和慢锁问题。方便用户定位线上问题以及监控锁的占用情况。"
}
---

FE 锁管理用于检测 FE 进程中可能出现的死锁和慢锁问题。方便用户定位线上问题以及监控锁的占用情况。

:::tip
该功能为实验功能，自 2.1.6 版本开始支持。
:::

## 死锁检测

FE 锁管理模块提供了死锁检测功能，用于自动检测死锁，该功能默认关闭，可以通过配置参数开启。

如果开启死锁检测功能，则会周期性地检测死锁，默认周期为 5 分钟，我们也可以设置 `deadlock_detection_interval_minute`
参数，来调整检测周期。

我们会再日志中输出死锁检测的结果，如果检测到死锁，则会输出对应的告警日志。可以搜索关键字 `Deadlocks detected` 来查看是否存在死锁。

日志内容示例（原始日志为一行文本）：

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
### 配置参数

fe.conf 配置文件中的死锁检测相关参数如下：

| 参数名                                | 参数说明         | 默认值   |
|------------------------------------|--------------|-------|
| enable_deadlock_detection          | 是否开启死锁检测功能   | false |
| deadlock_detection_interval_minute | 死锁检测周期，单位为分钟 | 5     |

## 慢锁检测

FE 锁管理模块提供了慢锁检测功能，我们会监控所有 DB、Table、Transaction 相关的锁，如果锁的持有时间超过一定阈值（默认为 10
秒），则会输出对应告警日志。

我们可以搜索日志关键字 `Lock held for` 来查看是否存在慢锁。

日志内容示例（原始日志为一行文本）：

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
### 配置参数

fe.conf 配置文件中的慢锁检测相关参数如下：

| 参数名 | 参数说明 | 默认值 |
| --- | --- | --- |
| max_lock_hold_threshold_seconds | 慢锁告警阈值，单位为秒 | 10 |

