---
{
    "title": "Вставка значений с помощью INSERT INTO VALUES",
    "language": "ru",
    "description": "Используйте оператор INSERT INTO VALUES для атомарной синхронной загрузки данных, заданных непосредственно в SQL, в таблицы Doris. Этот способ подходит для проверки функций, демонстраций и загрузки небольших партий данных.",
    "keywords": [
        "INSERT INTO VALUES",
        "синхронная загрузка Doris",
        "запись в Doris через SQL",
        "атомарная загрузка",
        "group commit",
        "insert_max_filter_ratio",
        "enable_insert_strict",
        "insert_load_default_timeout_second"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Feature validation / Demo / Small-batch data ingestion -->

Оператор INSERT INTO VALUES загружает значения, заданные непосредственно в SQL, в таблицу Doris. Это **синхронный способ загрузки**: результат возвращается сразу после выполнения оператора, поэтому по ответу можно определить, прошла ли загрузка успешно. Способ гарантирует **атомарность** задачи загрузки: либо все данные загружаются успешно, либо не загружается ничего.

## Сценарии использования {#use-cases}

INSERT INTO VALUES предназначен для двух сценариев:

| Сценарий | Описание |
| --- | --- |
| Проверка функций / Демонстрация | Загрузите небольшой объём тестовых данных, чтобы проверить функции Doris. Синтаксис соответствует MySQL. |
| Загрузка небольших партий данных | Используйте при низкой параллельности и небольшом объёме данных. |

:::tip Совет по производительности
Производительность параллельных операций INSERT INTO VALUES ограничена этапом фиксации транзакции. При большом объёме данных включите [Group Commit](../load-best-practices/group-commit-manual.md), чтобы повысить пропускную способность.
:::

## Принцип работы {#how-it-works}

INSERT INTO VALUES отправляет задания на выполнение узлу FE через протокол MySQL. Процесс выглядит так:

1. Клиент отправляет оператор INSERT INTO VALUES узлу FE через протокол MySQL.
2. FE создаёт план выполнения: сначала идут операторы, связанные с запросом, а последним — `OlapTableSink`, который записывает результат запроса в целевую таблицу.
3. FE направляет план выполнения узлам BE и выбирает один из них в качестве узла **Coordinator**.
4. Узел Coordinator получает данные и распределяет их между другими узлами BE для завершения записи.

## Быстрый старт {#quick-start}

INSERT INTO VALUES отправляется и передаётся через протокол MySQL. Ниже полный процесс показан на примере командной строки MySQL. Подробный синтаксис приведён в описании [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT).

### Предварительные требования {#prerequisites}

Для выполнения INSERT INTO VALUES необходимо **право INSERT** на целевую таблицу. Если у текущего пользователя его нет, предоставьте право с помощью команды [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO).

### Создание задания загрузки {#create-a-load-job}

#### Шаг 1: Создайте целевую таблицу {#step-1-create-the-target-table}

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### Шаг 2: Запишите данные с помощью INSERT INTO VALUES {#step-2-run-insert-into-values-to-write-data}

:::caution Не рекомендуется для промышленной эксплуатации
INSERT INTO VALUES обычно используют только для демонстраций и тестирования. Для загрузки данных в промышленной среде этот способ не рекомендуется.
:::

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

Поскольку загрузка синхронная, результат возвращается непосредственно клиенту:

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

#### Шаг 3: Проверьте загруженные данные {#step-3-verify-the-loaded-data}

```sql
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```

### Просмотр задания загрузки {#view-the-load-job}

Для просмотра завершённых заданий INSERT INTO VALUES используйте команду `SHOW LOAD`:

```sql
mysql> SHOW LOAD FROM testdb\G
*************************** 1. row ***************************
         JobId: 77172
         Label: label_26eebc33411f441c_b2b286730d495e2c
         State: FINISHED
      Progress: Unknown id: 77172
          Type: INSERT
       EtlInfo: NULL
      TaskInfo: cluster:N/A; timeout(s):14400; max_filter_ratio:0.0
      ErrorMsg: NULL
    CreateTime: 2024-11-20 16:44:08
  EtlStartTime: 2024-11-20 16:44:08
 EtlFinishTime: 2024-11-20 16:44:08
 LoadStartTime: 2024-11-20 16:44:08
LoadFinishTime: 2024-11-20 16:44:08
           URL:
    JobDetails: {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0}
 TransactionId: 61071
  ErrorTablets: {}
          User: root
       Comment:
1 row in set (0.00 sec)
```

### Отмена задания загрузки {#cancel-the-load-job}

В клиенте MySQL нажмите `Ctrl-C`, чтобы отменить выполняющееся задание INSERT INTO VALUES.

## Справочник {#reference}

### Синтаксис команды загрузки {#load-command-syntax}

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

:::note
INSERT INTO VALUES обычно используют только для демонстраций. В промышленной среде этот способ не рекомендуется.
:::

### Параметры загрузки {#load-configuration-parameters}

#### Конфигурация FE {#fe-configuration}

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400 (4 часа) | Время ожидания завершения задачи загрузки в секундах. Если за это время задача не завершится, система отменит её, а статус изменится на `CANCELLED`. |

#### Переменные сеанса {#session-variables}

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `insert_timeout` | 14400 (4 часа) | Время ожидания при выполнении INSERT INTO как оператора SQL, в секундах. |
| `enable_insert_strict` | true | При значении `true` загрузка завершается ошибкой, если обнаружены данные, не отвечающие требованиям. При значении `false` такие строки игнорируются, а загрузка считается успешной, если хотя бы 1 строка загружена правильно. В версиях 2.1.4 и более ранних INSERT INTO не позволяет управлять долей ошибок: этот параметр позволяет только строго проверять качество данных или полностью игнорировать ошибочные данные. |
| `insert_max_filter_ratio` | 1.0 | Поддерживается начиная с версии 2.1.5. Действует только при `enable_insert_strict = false`. Задаёт максимально допустимую долю отфильтрованных строк для `INSERT INTO ... VALUES` и `INSERT INTO ... SELECT`, включая запросы к таблицам Doris, внешним таблицам и файловым TVF, таким как S3, HDFS и LOCAL. Допустимый диапазон — от 0 до 1; значение по умолчанию — 1.0. Если `filtered_rows / (loaded_rows + filtered_rows)` превышает заданное значение, INSERT завершается ошибкой. Значение 1.0 допускает фильтрацию всех строк, но не подавляет другие ошибки выполнения. |

:::info Распространённые причины несоответствия данных требованиям
Длина значения в исходном столбце превышает длину целевого столбца, типы столбцов не совпадают, партиции не соответствуют друг другу, порядок столбцов не совпадает и так далее.
:::

### Результат загрузки {#load-return-values}

INSERT INTO VALUES — оператор SQL. Возвращаемый результат содержит строку JSON со следующими полями:

| Параметр | Описание |
| -------- | ------------------------------------------------------------ |
| `Label`  | Метка задания загрузки. Её можно указать с помощью `INSERT INTO tbl WITH LABEL label ...`. |
| `Status` | Статус видимости загруженных данных:<br />- `visible`: загрузка прошла успешно, данные видны.<br />- `committed`: загрузка завершена; данные могут стать видимыми с задержкой, повторять загрузку не нужно.<br />- `Label Already Exists`: метка уже существует, её нужно заменить.<br />- `Fail`: загрузка завершилась ошибкой. |
| `Err`    | Сообщение об ошибке загрузки. |
| `TxnId`  | Идентификатор транзакции загрузки. |

Ниже показаны четыре типичных варианта результата.

#### Сценарий 1: INSERT выполнен успешно {#scenario-1-insert-executed-successfully}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

- `Query OK`: оператор выполнен успешно.
- `5 rows affected`: всего загружено 5 строк.

#### Сценарий 2: INSERT выполнен успешно, но есть предупреждение {#scenario-2-insert-executed-successfully-with-warnings}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

- `Query OK`: оператор выполнен успешно.
- `4 rows affected`: всего загружено 4 строки.
- `1 warnings`: отфильтрована 1 строка.

Чтобы просмотреть отфильтрованные строки, используйте оператор [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md). Поле `URL` в результате позволяет запросить данные об ошибках. См. раздел [Просмотр строк с ошибками](#view-error-rows) ниже.

```sql
mysql> SHOW LOAD WHERE label="label_a8d99ae931194d2b_93357aac59981a18"\G
*************************** 1. row ***************************
         JobId: 77158
         Label: label_a8d99ae931194d2b_93357aac59981a18
         State: FINISHED
      Progress: Unknown id: 77158
          Type: INSERT
       EtlInfo: NULL
      TaskInfo: cluster:N/A; timeout(s):14400; max_filter_ratio:0.0
      ErrorMsg: NULL
    CreateTime: 2024-11-20 16:35:40
  EtlStartTime: 2024-11-20 16:35:40
 EtlFinishTime: 2024-11-20 16:35:40
 LoadStartTime: 2024-11-20 16:35:40
LoadFinishTime: 2024-11-20 16:35:40
           URL: http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19
    JobDetails: {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0}
 TransactionId: 61068
  ErrorTablets: {}
          User: root
       Comment:
1 row in set (0.00 sec)
```

#### Сценарий 3: INSERT выполнен успешно, но статус — committed {#scenario-3-insert-executed-successfully-but-status-is-committed}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

Данные временно остаются невидимыми; впоследствии эта партия станет видимой. Проверьте статус видимости с помощью оператора [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md). Когда значение столбца `TransactionStatus` изменится на `VISIBLE`, данные станут видимыми.

```sql
mysql> SHOW TRANSACTION WHERE id=61074\G
*************************** 1. row ***************************
     TransactionId: 61074
             Label: label_78bf5396d9594d4d_a8d9a914af40f73d
       Coordinator: FE: 10.16.10.7
 TransactionStatus: VISIBLE
 LoadJobSourceType: INSERT_STREAMING
       PrepareTime: 2024-11-20 16:51:54
     PreCommitTime: NULL
        CommitTime: 2024-11-20 16:51:54
       PublishTime: 2024-11-20 16:51:54
        FinishTime: 2024-11-20 16:51:54
            Reason:
ErrorReplicasCount: 0
        ListenerId: -1
         TimeoutMs: 14400000
            ErrMsg:
1 row in set (0.00 sec)
```

#### Сценарий 4: INSERT завершился ошибкой {#scenario-4-insert-execution-failed}

Если выполнение завершилось ошибкой, данные не загружены:

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` показывает причину ошибки.
- Адрес url в конце сообщения позволяет запросить данные об ошибках. См. раздел [Просмотр строк с ошибками](#view-error-rows) ниже.

## Рекомендации {#best-practices}

### Объём данных {#data-volume}

INSERT INTO VALUES обычно используют для тестирования и демонстраций. Этот способ **не рекомендуется** для загрузки больших объёмов данных. Для записи крупных партий используйте [Group Commit](../load-best-practices/group-commit-manual.md) или другие способы пакетной загрузки.

### Просмотр строк с ошибками {#view-error-rows}

Если результат INSERT INTO содержит поле `url`, просмотрите строки с ошибками следующей командой:

```sql
SHOW LOAD WARNINGS ON "url";
```

Пример:

```sql
mysql> SHOW LOAD WARNINGS ON "http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19"\G
*************************** 1. row ***************************
         JobId: -1
         Label: NULL
ErrorMsgDetail: Reason: column_name[user_id], null value for not null column, type=BIGINT. src line [];
1 row in set (0.00 sec)
```

Распространённые причины ошибок:

- Длина значения в исходном столбце превышает длину целевого столбца.
- Типы столбцов не совпадают.
- Партиции не соответствуют друг другу.
- Порядок столбцов не совпадает.

Переменная сеанса `enable_insert_strict` определяет, будет ли INSERT INTO игнорировать строки с ошибками.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

**В1: INSERT INTO VALUES выполняется синхронно или асинхронно?**

Ответ: Синхронно. Результат загрузки возвращается сразу после выполнения оператора; дополнительный опрос статуса не требуется.

**В2: Гарантирует ли INSERT INTO VALUES атомарность?**

Ответ: Да. Все данные в рамках одного INSERT INTO VALUES либо полностью загружаются, либо загрузка целиком завершается ошибкой; частичной записи не происходит.

**В3: Означает ли статус `COMMITTED`, что загрузка завершилась ошибкой?**

Ответ: Нет. `COMMITTED` означает, что загрузка завершена и данные вскоре станут видимыми; повторять загрузку не нужно. Проверяйте `TransactionStatus` с помощью `SHOW TRANSACTION`, пока значение не станет `VISIBLE`.

**В4: Почему появляется ошибка `Insert has too many filtered data`?**

Ответ: При `enable_insert_strict=false` доля отфильтрованных данных превысила порог, заданный параметром `insert_max_filter_ratio`. Увеличьте порог `insert_max_filter_ratio` или проверьте, соответствуют ли исходные данные схеме таблицы, включая типы столбцов и допустимость NULL.

**В5: Как загружать крупные партии данных?**

Ответ: При высокой параллельности или большом объёме данных производительность INSERT INTO VALUES ограничена этапом фиксации транзакции. Включите [Group Commit](../load-best-practices/group-commit-manual.md) или выберите специализированный способ загрузки, например Stream Load или Broker Load.

## Устранение неполадок {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| Симптом | Возможная причина | Решение |
| --- | --- | --- |
| Ошибка `null value for not null column` | Значение NULL вставлено в столбец с ограничением NOT NULL. | Исправьте исходные данные или разрешите NULL в целевом столбце. |
| Ошибка `Insert has too many filtered data` | Доля отфильтрованных строк превышает `insert_max_filter_ratio`. | Увеличьте порог `insert_max_filter_ratio` или исправьте исходные данные. |
| Ошибка `Label Already Exists` | Указанная метка уже используется. | Выберите другую метку или не указывайте её, чтобы система создала метку автоматически. |
| Задание долго выполняется и затем отменяется. | Превышено время ожидания `insert_load_default_timeout_second` или `insert_timeout`. | Увеличьте соответствующие значения времени ожидания или разбейте загрузку на несколько партий. |
| При высокой параллельности пропускная способность низкая. | Ограничение на этапе фиксации транзакции. | Включите [Group Commit](../load-best-practices/group-commit-manual.md). |

## Дополнительная информация {#more-help}

Подробный синтаксис INSERT INTO приведён в [справочнике команды INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md). Дополнительную справку также можно получить, введя `HELP INSERT` в командной строке клиента MySQL.
