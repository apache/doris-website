---
{
  "title": "FEロック管理",
  "language": "ja",
  "description": "FE Lock Managementは、FEプロセス内の潜在的なデッドロックと低速ロックを検出するために使用されます。"
}
---
FE Lock Managementは、FEプロセス内の潜在的なデッドロックと低速ロックを検出するために使用され、ユーザーが本番環境での問題を特定・トラブルシューティングし、ロック使用状況を監視することを容易にします。

:::tip
この機能は実験的機能であり、バージョン2.1.6以降でサポートされています。
:::

## デッドロック検出

FE Lock Managementモジュールは、デッドロックを自動的に識別するように設計された機能であるデッドロック検出を提供します。

デフォルトでは、この機能は無効になっていますが、設定により有効にできます。有効にすると、デッドロック検出は定期的にデッドロックをチェックし、デフォルトの間隔は5分です。`deadlock_detection_interval_minute`パラメータを設定することで、この間隔を調整できます。

デッドロック検出の結果はログに記録され、デッドロックが検出された場合、対応する警告ログが生成されます。
デッドロックを確認するには、ログで`Deadlocks detected`キーワードを検索してください。

ログ内容例（元のログは1行のテキスト）：

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
### 設定パラメータ

`fe.conf`設定ファイルにおけるデッドロック検出関連のパラメータは以下の通りです：

| パラメータ名                               | 説明         | デフォルト値   |
|------------------------------------|--------------|-------|
| enable_deadlock_detection          | 	デッドロック検出を有効にします   | false |
| deadlock_detection_interval_minute | デッドロック検出間隔（分単位） | 5     |

## 低速ロック検出
FE Lock Managementモジュールには低速ロック検出も含まれています。この機能は、データベース、テーブル、およびトランザクションに関連するすべてのロックを監視します。ロックが指定された閾値（デフォルトでは10秒）より長く保持されている場合、対応する警告ログが生成されます。
低速ロックを確認するには、ログで`Lock held for`キーワードを検索してください。

ログ内容の例（元のログは1行のテキスト）：

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
### 設定パラメータ
以下は、`fe.conf`設定ファイルにおける低速ロック検出関連のパラメータです：

| Parameter Name                               | Description         | Default Value   |
| --- | --- | --- |
| max_lock_hold_threshold_seconds | 低速ロック警告の閾値（秒） | 10 |
