---
{
    "title": "Загрузка с помощью INSERT INTO VALUES",
    "language": "ru",
    "description": "Оператор INSERT INTO VALUES позволяет атомарно и синхронно загружать в таблицы Doris данные, заданные непосредственно в SQL, и подходит для проверки возможностей, демонстраций и загрузки небольших пакетов данных.",
    "keywords": [
        "INSERT INTO VALUES",
        "Doris synchronous load",
        "SQL write to Doris",
        "atomic load",
        "group commit",
        "insert_max_filter_ratio",
        "enable_insert_strict",
        "insert_load_default_timeout_second"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Feature validation / Demo / Small-batch data ingestion -->

Оператор INSERT INTO VALUES загружает в таблицу Doris значения, заданные непосредственно в SQL. Это **синхронный способ загрузки**: результат возвращается сразу после выполнения, поэтому по ответу можно определить, прошла ли загрузка успешно. Этот способ гарантирует **атомарность** задачи загрузки: либо все данные загружаются успешно, либо не загружается ничего.

## Сценарии использования {#use-cases}

INSERT INTO VALUES предназначен для следующих двух сценариев:

| Сценарий | Описание |
| --- | --- |
| Проверка возможностей / Демонстрация | Загрузка небольшого объёма тестовых данных для проверки возможностей Doris. Синтаксис совпадает с MySQL. |
| Загрузка небольших пакетов данных | Использование в сценариях с низким уровнем параллелизма и небольшим объёмом данных. |

:::tip Совет по производительности
Производительность параллельных операций INSERT INTO VALUES ограничена пропускной способностью этапа фиксации. При больших объёмах данных включите [Group Commit](../load-best-practices/group-commit-manual.md), чтобы повысить пропускную способность.
:::

## Принцип работы {#how-it-works}

INSERT INTO VALUES отправляет задания на узел FE для выполнения по протоколу MySQL. Общая последовательность действий:

1. Клиент отправляет оператор INSERT INTO VALUES в FE по протоколу MySQL.
2. FE формирует план выполнения: начальная часть содержит операторы запроса, а последний оператор, `OlapTableSink`, записывает результат запроса в целевую таблицу.
3. FE передаёт план выполнения узлам BE и выбирает один BE в качестве узла **Coordinator**.
4. Узел Coordinator получает данные и распределяет их между другими узлами BE для завершения записи.

## Быстрый старт {#quick-start}

INSERT INTO VALUES отправляется и передаётся по протоколу MySQL. В примере ниже весь процесс отправки показан с помощью командной строки MySQL. Подробное описание синтаксиса см. в разделе [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT).

### Предварительные требования {#prerequisites}

Для выполнения INSERT INTO VALUES требуется **привилегия INSERT** на целевую таблицу. Если у текущего пользователя нет этой привилегии, предоставьте её с помощью команды [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO).

### Создание задания загрузки {#create-a-load-job}

#### Шаг 1: создание целевой таблицы {#step-1-create-the-target-table}

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### Шаг 2: выполнение INSERT INTO VALUES для записи данных {#step-2-run-insert-into-values-to-write-data}

:::caution Не рекомендуется для промышленной эксплуатации
INSERT INTO VALUES обычно используется только для демонстраций или тестирования и не рекомендуется для загрузки данных при промышленной эксплуатации.
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

#### Шаг 3: проверка загруженных данных {#step-3-verify-the-loaded-data}

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

Используйте команду `SHOW LOAD` для просмотра завершённых заданий INSERT INTO VALUES:

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

В клиенте MySQL используйте `Ctrl-C`, чтобы отменить выполняющееся задание INSERT INTO VALUES.

## Справочная информация {#reference}

### Синтаксис команды загрузки {#load-command-syntax}

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

:::note
INSERT INTO VALUES обычно используется только для демонстраций и не рекомендуется для промышленной эксплуатации.
:::

### Параметры настройки загрузки {#load-configuration-parameters}

#### Настройки FE {#fe-configuration}

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400 (4 часа) | Время ожидания завершения задачи загрузки в секундах. Если задача загрузки не завершается за это время, система отменяет её, а статус меняется на `CANCELLED`. |

#### Переменные сеанса {#session-variables}

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `insert_timeout` | 14400 (4 часа) | Время ожидания завершения INSERT INTO при выполнении в качестве оператора SQL, в секундах. |
| `enable_insert_strict` | true | При значении `true` загрузка завершается ошибкой, если встречаются данные, не соответствующие требованиям. При значении `false` строки, не соответствующие требованиям, игнорируются, а загрузка считается успешной, если хотя бы одна строка загружена корректно. В версиях 2.1.4 и более ранних INSERT INTO не позволяет управлять допустимой долей ошибок; этот параметр позволяет либо строго проверять качество данных, либо полностью игнорировать данные с ошибками. |
| `insert_max_filter_ratio` | 1.0 | Поддерживается начиная с версии 2.1.5. **Действует только при `enable_insert_strict=false`.** Управляет допустимой долей ошибок для `INSERT INTO FROM S3/HDFS/LOCAL()`. Диапазон значений: от 0 до 1. Значение по умолчанию 1.0 допускает любые ошибки. Если доля строк с ошибками превышает это значение, задача INSERT завершается ошибкой. |

:::info Распространённые причины несоответствия данных требованиям
Длина исходного столбца превышает длину целевого столбца, не совпадают типы столбцов, партиции, порядок столбцов и т. д.
:::

### Результаты загрузки {#load-return-values}

INSERT INTO VALUES является оператором SQL. Возвращаемый результат содержит строку JSON со следующими полями:

| Параметр | Описание |
| -------- | ------------------------------------------------------------ |
| `Label`  | Метка задания загрузки. Её можно задать с помощью `INSERT INTO tbl WITH LABEL label ...`. |
| `Status` | Статус видимости загруженных данных:<br />- `visible`: загрузка прошла успешно, данные видимы.<br />- `committed`: загрузка завершена; данные могут стать видимыми с задержкой, повторять загрузку не требуется.<br />- `Label Already Exists`: метка уже существует, её необходимо заменить.<br />- `Fail`: загрузка завершилась ошибкой. |
| `Err`    | Сообщение об ошибке загрузки. |
| `TxnId`  | Идентификатор транзакции загрузки. |

Ниже приведены четыре типичных варианта результата.

#### Сценарий 1: INSERT выполнен успешно {#scenario-1-insert-executed-successfully}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

- `Query OK`: оператор выполнен успешно.
- `5 rows affected`: всего загружено 5 строк.

#### Сценарий 2: INSERT выполнен успешно с предупреждениями {#scenario-2-insert-executed-successfully-with-warnings}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

- `Query OK`: оператор выполнен успешно.
- `4 rows affected`: всего загружено 4 строки.
- `1 warnings`: отфильтрована 1 строка.

Используйте оператор [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md) для просмотра отфильтрованных строк. Поле `URL` в результате позволяет получить данные с ошибками. См. раздел [Просмотр строк с ошибками](#view-error-rows) ниже.

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

#### Сценарий 3: INSERT выполнен успешно, но статус равен committed {#scenario-3-insert-executed-successfully-but-status-is-committed}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

Невидимость данных является временным состоянием; этот пакет данных со временем станет видимым. Используйте оператор [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md) для проверки статуса видимости. Когда значение столбца `TransactionStatus` станет `VISIBLE`, данные будут видимы.

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

#### Сценарий 4: выполнение INSERT завершилось ошибкой {#scenario-4-insert-execution-failed}

Ошибка выполнения означает, что никакие данные не были успешно загружены:

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` указывает причину ошибки.
- URL в конце сообщения позволяет получить данные с ошибками. См. раздел [Просмотр строк с ошибками](#view-error-rows) ниже.

## Рекомендации {#best-practices}

### Объём данных {#data-volume}

INSERT INTO VALUES обычно используется для тестирования и демонстраций. Он **не рекомендуется** для загрузки больших объёмов данных. Если требуется записывать данные большими пакетами, используйте [Group Commit](../load-best-practices/group-commit-manual.md) или другие способы пакетной загрузки.

### Просмотр строк с ошибками {#view-error-rows}

Если результат INSERT INTO содержит поле `url`, используйте следующую команду для просмотра строк с ошибками:

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

- Длина исходного столбца превышает длину целевого столбца.
- Типы столбцов не совпадают.
- Партиции не совпадают.
- Порядок столбцов не совпадает.

Используйте переменную сеанса `enable_insert_strict`, чтобы управлять тем, игнорирует ли INSERT INTO строки с ошибками.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

**Вопрос 1: INSERT INTO VALUES работает синхронно или асинхронно?**

Ответ: синхронно. Результат загрузки возвращается сразу после выполнения оператора, дополнительный опрос состояния не требуется.

**Вопрос 2: Гарантирует ли INSERT INTO VALUES атомарность?**

Ответ: да. В рамках одного INSERT INTO VALUES либо все данные успешно загружаются, либо загрузка полностью завершается неудачей; частичная запись не происходит.

**Вопрос 3: Означает ли возвращённый статус `COMMITTED`, что загрузка завершилась ошибкой?**

Ответ: нет. `COMMITTED` означает, что загрузка завершена и данные вскоре станут видимыми; повторять загрузку не требуется. Используйте `SHOW TRANSACTION` для проверки `TransactionStatus`, пока его значение не станет `VISIBLE`.

**Вопрос 4: Почему при загрузке возникает ошибка `Insert has too many filtered data`?**

Ответ: при `enable_insert_strict=false` доля отфильтрованных данных превысила порог, заданный в `insert_max_filter_ratio`. Увеличьте значение `insert_max_filter_ratio` или проверьте, соответствуют ли исходные данные схеме таблицы (типы столбцов, допустимость NULL и т. д.).

**Вопрос 5: Какой способ следует использовать для загрузки больших пакетов данных?**

Ответ: при высоком уровне параллелизма или больших объёмах данных производительность INSERT INTO VALUES ограничена пропускной способностью этапа фиксации. Включите [Group Commit](../load-best-practices/group-commit-manual.md) или выберите специализированные способы загрузки, такие как Stream Load или Broker Load.

## Устранение неполадок {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| Проблема | Возможная причина | Решение |
| --- | --- | --- |
| Ошибка `null value for not null column` | В столбец NOT NULL было вставлено значение NULL. | Исправьте исходные данные или разрешите NULL в целевом столбце. |
| Ошибка `Insert has too many filtered data` | Доля отфильтрованных строк превышает `insert_max_filter_ratio`. | Увеличьте порог `insert_max_filter_ratio` или исправьте исходные данные. |
| Ошибка `Label Already Exists` | Указанная метка уже используется. | Используйте другую метку или не указывайте метку, чтобы система создала её автоматически. |
| Задача отменяется после длительного выполнения, так и не завершившись. | Превышено время ожидания, заданное в `insert_load_default_timeout_second` или `insert_timeout`. | Увеличьте соответствующие параметры времени ожидания или разделите загрузку на несколько пакетов. |
| Низкая пропускная способность при высоком уровне параллелизма. | Ограничение пропускной способности этапа фиксации. | Включите [Group Commit](../load-best-practices/group-commit-manual.md). |

## Дополнительная справка {#more-help}

Подробное описание синтаксиса INSERT INTO см. в руководстве по команде [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md). Для получения дополнительной справки также можно ввести `HELP INSERT` в командной строке клиента MySQL.
