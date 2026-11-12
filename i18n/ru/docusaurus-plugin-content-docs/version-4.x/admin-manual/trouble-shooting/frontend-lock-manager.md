---
{
    "title": "Управление блокировками FE",
    "language": "ru",
    "description": "Управление блокировками FE позволяет выявлять потенциальные взаимные блокировки и длительное удержание блокировок в процессе FE,"
}
---

Управление блокировками FE позволяет выявлять потенциальные взаимные блокировки и длительное удержание блокировок в процессе FE, упрощая поиск и устранение проблем в рабочей среде, а также мониторинг использования блокировок.

:::tip
Эта функция является экспериментальной и поддерживается начиная с версии 2.1.6.
:::

## Обнаружение взаимных блокировок {#deadlock-detection}

Модуль управления блокировками FE поддерживает автоматическое обнаружение взаимных блокировок.

По умолчанию эта функция отключена, но её можно включить в настройках конфигурации. После включения проверка на наличие взаимных блокировок выполняется периодически, по умолчанию каждые 5 минут. Этот интервал можно изменить с помощью параметра `deadlock_detection_interval_minute`.

Результаты проверок записываются в журнал. При обнаружении взаимных блокировок в журнал добавляются соответствующие предупреждения. 
Чтобы проверить наличие взаимных блокировок, найдите в журналах ключевую фразу `Deadlocks detected`.

Пример записи в журнале (исходная запись представляет собой одну строку текста):
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
### Параметры конфигурации {#configuration-parameters}

Ниже приведены параметры обнаружения взаимных блокировок в файле конфигурации `fe.conf`:

| Имя параметра                               | Описание         | Значение по умолчанию   |
|------------------------------------|--------------|-------|
| enable_deadlock_detection          | 	Включает обнаружение взаимных блокировок   | false |
| deadlock_detection_interval_minute | Интервал проверки на наличие взаимных блокировок (в минутах) | 5     |

## Обнаружение длительного удержания блокировок {#slow-lock-detection}
Модуль управления блокировками FE также позволяет обнаруживать длительное удержание блокировок. Эта функция отслеживает все блокировки, связанные с базами данных, таблицами и транзакциями. Если блокировка удерживается дольше заданного порогового значения (по умолчанию 10 секунд), в журнал добавляется соответствующее предупреждение.
Чтобы выявить длительное удержание блокировок, найдите в журналах ключевую фразу `Lock held for`.

Пример записи в журнале (исходная запись представляет собой одну строку текста):
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
### Параметры конфигурации {#configuration-parameters-1}
Ниже приведены параметры обнаружения длительного удержания блокировок в файле конфигурации `fe.conf`:

| Имя параметра                               | Описание         | Значение по умолчанию   |
| --- | --- | --- |
| max_lock_hold_threshold_seconds | Пороговое значение для предупреждений о длительном удержании блокировок (в секундах) | 10 |
