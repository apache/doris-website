---
{
    "title": "FE 잠금 관리",
    "language": "ko",
    "description": "FE 잠금 관리는 FE 프로세스 내에서 잠재적인 교착 상태와 장시간 유지되는 잠금을 감지하는 데 사용됩니다."
}
---

FE 잠금 관리는 FE 프로세스 내에서 잠재적인 교착 상태와 장시간 유지되는 잠금을 감지하여, 사용자가 운영 환경에서 문제를 파악하고 해결하며 잠금 사용 현황을 모니터링하기 쉽게 해 줍니다.

:::tip
이 기능은 실험적 기능이며 2.1.6 버전부터 지원됩니다.
:::

## 교착 상태 감지 {#deadlock-detection}

FE 잠금 관리 모듈은 교착 상태를 자동으로 식별하는 교착 상태 감지 기능을 제공합니다.

이 기능은 기본적으로 비활성화되어 있으며 설정을 통해 활성화할 수 있습니다. 활성화하면 주기적으로 교착 상태를 확인하며, 기본 간격은 5분입니다. `deadlock_detection_interval_minute` 매개변수를 설정하여 이 간격을 조정할 수 있습니다.

교착 상태 감지 결과는 로그에 기록되며, 교착 상태가 감지되면 해당 경고 로그가 생성됩니다. 
교착 상태를 확인하려면 로그에서 `Deadlocks detected` 키워드를 검색하세요.

로그 내용 예시(원본 로그는 한 줄로 기록됨):
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
### 설정 매개변수 {#configuration-parameters}

`fe.conf` 설정 파일의 교착 상태 감지 관련 매개변수는 다음과 같습니다.

| 매개변수 이름                               | 설명         | 기본값   |
|------------------------------------|--------------|-------|
| enable_deadlock_detection          | 	교착 상태 감지 활성화   | false |
| deadlock_detection_interval_minute | 교착 상태 감지 간격(분) | 5     |

## 장시간 잠금 감지 {#slow-lock-detection}
FE 잠금 관리 모듈에는 장시간 잠금 감지 기능도 포함되어 있습니다. 이 기능은 데이터베이스, 테이블 및 트랜잭션과 관련된 모든 잠금을 모니터링합니다. 잠금을 유지한 시간이 지정된 임계값(기본값 10초)을 초과하면 해당 경고 로그가 생성됩니다.
장시간 유지되는 잠금을 확인하려면 로그에서 `Lock held for` 키워드를 검색하세요.

로그 내용 예시(원본 로그는 한 줄로 기록됨):
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
### 설정 매개변수 {#configuration-parameters-1}
`fe.conf` 설정 파일의 장시간 잠금 감지 관련 매개변수는 다음과 같습니다.

| 매개변수 이름                               | 설명         | 기본값   |
| --- | --- | --- |
| max_lock_hold_threshold_seconds | 장시간 잠금 경고 임계값(초) | 10 |
