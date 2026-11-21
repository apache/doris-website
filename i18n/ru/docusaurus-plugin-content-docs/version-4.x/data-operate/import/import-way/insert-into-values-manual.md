---
{
    "title": "Загрузка данных через INSERT INTO VALUES",
    "language": "ru",
    "description": "Используйте оператор INSERT INTO VALUES для атомарной синхронной загрузки данных, указанных непосредственно в SQL, в таблицы Doris. Подходит для проверки функций, демонстраций и загрузки небольших пакетов данных.",
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

Оператор INSERT INTO VALUES загружает значения, указанные непосредственно в SQL, в таблицу Doris. Это **синхронный способ загрузки**: результат возвращается сразу после выполнения оператора, поэтому по ответу можно определить, прошла ли загрузка успешно. Этот способ гарантирует **атомарность** задачи загрузки: либо все данные загружаются успешно, либо не загружается ни одна строка.

## Сценарии использования {#use-cases}

INSERT INTO VALUES предназначен для следующих двух сценариев:

| Сценарий | Описание |
| --- | --- |
| Проверка функций / Демонстрация | Загрузка небольшого объёма тестовых данных для проверки функций Doris. Синтаксис совпадает с MySQL. |
| Загрузка небольших пакетов данных | Использование при низкой степени параллелизма и небольшом объёме данных. |

:::tip Совет по производительности
Производительность параллельных операций INSERT INTO VALUES ограничена узким местом на этапе фиксации транзакции. При большом объёме данных включите [Group Commit](../load-best-practices/group-commit-manual.md), чтобы повысить пропускную способность.
:::

## Принцип работы {#how-it-works}

INSERT INTO VALUES отправляет задания узлу FE для выполнения по протоколу MySQL. Общая последовательность действий такова:

1. Клиент отправляет оператор INSERT INTO VALUES узлу FE по протоколу MySQL.
2. FE формирует план выполнения: в начале находятся операторы, связанные с запросом, а последним идёт `OlapTableSink`, который записывает результат запроса в целевую таблицу.
3. FE передаёт план выполнения узлам BE и выбирает один из них в качестве узла **Coordinator**.
4. Узел Coordinator получает данные и распределяет их между другими узлами BE для завершения записи.

## Быстрый старт {#quick-start}

INSERT INTO VALUES отправляется и передаётся по протоколу MySQL. В примере ниже показана полная последовательность отправки через командную строку MySQL. Подробный синтаксис приведён в разделе [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT).

### Предварительные условия {#prerequisites}

Для выполнения INSERT INTO VALUES требуется **право INSERT** на целевую таблицу. Если у текущего пользователя нет этого права, предоставьте его командой [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO).

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

#### Шаг 2: запись данных с помощью INSERT INTO VALUES {#step-2-run-insert-into-values-to-write-data}

:::caution Не рекомендуется для производственной среды
INSERT INTO VALUES обычно используют только для демонстраций или тестирования. Этот способ не рекомендуется для загрузки данных в производственной среде.
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
INSERT INTO VALUES обычно используют только для демонстраций; применять его в производственной среде не рекомендуется.
:::

### Параметры настройки загрузки {#load-configuration-parameters}

#### Конфигурация FE {#fe-configuration}

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400 (4 часа) | Время ожидания завершения задачи загрузки в секундах. Если задача не завершается за это время, система отменяет её, а статус меняется на `CANCELLED`. |

#### Переменные сеанса {#session-variables}

| Параметр | Значение по умолчанию | Описание |
| --- | --- | --- |
| `insert_timeout` | 14400 (4 часа) | Время ожидания выполнения INSERT INTO как оператора SQL, в секундах. |
| `enable_insert_strict` | true | При значении `true` загрузка завершается ошибкой, если обнаружены некорректные данные. При значении `false` некорректные строки игнорируются, а загрузка считается успешной, если хотя бы одна строка загружена правильно. В версии 2.1.4 и более ранних версиях INSERT INTO не позволяет управлять долей ошибок: этот параметр позволяет только включить строгую проверку качества данных или полностью игнорировать ошибочные данные. |
| `insert_max_filter_ratio` | 1.0 | Поддерживается начиная с версии 2.1.5. Действует только при `enable_insert_strict = false`. Задаёт максимальную долю отфильтрованных строк для `INSERT INTO ... VALUES` и `INSERT INTO ... SELECT`, включая запросы к таблицам Doris, внешним таблицам и файловым TVF, таким как S3, HDFS и LOCAL. Диапазон значений — от 0 до 1; значение по умолчанию — 1.0. INSERT завершается ошибкой, если `filtered_rows / (loaded_rows + filtered_rows)` превышает это значение. Значение 1.0 допускает фильтрацию всех строк, но не подавляет другие ошибки выполнения. |

:::info Распространённые причины некорректных данных
Длина исходного столбца превышает длину целевого столбца, типы столбцов не совпадают, разделы не совпадают, порядок столбцов не совпадает и так далее.
:::

### Возвращаемые значения загрузки {#load-return-values}

INSERT INTO VALUES — оператор SQL. Возвращаемый результат содержит строку JSON со следующими полями:

| Параметр | Описание |
| -------- | ------------------------------------------------------------ |
| `Label`  | Метка задания загрузки. Её можно указать с помощью `INSERT INTO tbl WITH LABEL label ...`. |
| `Status` | Статус видимости загруженных данных:<br />- `visible`: загрузка прошла успешно, данные видны.<br />- `committed`: загрузка завершена; данные могут стать видимыми с задержкой, повторять загрузку не нужно.<br />- `Label Already Exists`: метка уже существует, её нужно заменить.<br />- `Fail`: загрузка завершилась ошибкой. |
| `Err`    | Сообщение об ошибке загрузки. |
| `TxnId`  | Идентификатор транзакции загрузки. |

Ниже показаны четыре типичных варианта возвращаемого результата.

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

Для просмотра отфильтрованных строк используйте оператор [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md). Значение `URL` в результате можно использовать для получения данных об ошибках. См. раздел [Просмотр строк с ошибками](#view-error-rows) ниже.

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

Невидимость данных — временное состояние: этот пакет данных со временем станет видимым. Для проверки статуса видимости используйте оператор [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md). Когда значение столбца `TransactionStatus` изменится на `VISIBLE`, данные станут видимыми.

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

Ошибка выполнения означает, что данные не были загружены:

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` показывает причину ошибки.
- Адрес url в конце можно использовать для получения данных об ошибках. См. раздел [Просмотр строк с ошибками](#view-error-rows) ниже.

## Рекомендации {#best-practices}

### Объём данных {#data-volume}

INSERT INTO VALUES обычно используют для тестирования и демонстраций. Этот способ **не рекомендуется** для загрузки больших объёмов данных. Для записи крупных пакетов используйте [Group Commit](../load-best-practices/group-commit-manual.md) или другие способы пакетной загрузки.

### Просмотр строк с ошибками {#view-error-rows}

Если в результате INSERT INTO возвращается поле `url`, просмотрите строки с ошибками с помощью следующей команды:

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
- Разделы не совпадают.
- Порядок столбцов не совпадает.

Управлять игнорированием ошибочных строк при выполнении INSERT INTO можно с помощью переменной сеанса `enable_insert_strict`.

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

**Вопрос 1: INSERT INTO VALUES выполняется синхронно или асинхронно?**

Ответ: Синхронно. Результат загрузки возвращается сразу после выполнения оператора; дополнительный опрос состояния не требуется.

**Вопрос 2: Гарантирует ли INSERT INTO VALUES атомарность?**

Ответ: Да. Все данные одного оператора INSERT INTO VALUES либо загружаются полностью, либо не загружаются вовсе; частичной записи не происходит.

**Вопрос 3: Означает ли возвращённый статус `COMMITTED`, что загрузка завершилась ошибкой?**

Ответ: Нет. `COMMITTED` означает, что загрузка завершена и данные вскоре станут видимыми. Повторять загрузку не требуется. Проверяйте `TransactionStatus` с помощью `SHOW TRANSACTION`, пока значение не изменится на `VISIBLE`.

**Вопрос 4: Почему при загрузке появляется сообщение `Insert has too many filtered data`?**

Ответ: При `enable_insert_strict=false` доля отфильтрованных данных превысила порог `insert_max_filter_ratio`. Увеличьте `insert_max_filter_ratio` либо проверьте соответствие исходных данных схеме таблицы: типам столбцов, допустимости NULL и другим ограничениям.

**Вопрос 5: Какой способ использовать для загрузки крупных пакетов данных?**

Ответ: При высокой степени параллелизма или больших объёмах данных производительность INSERT INTO VALUES ограничена узким местом на этапе фиксации транзакции. Включите [Group Commit](../load-best-practices/group-commit-manual.md) либо выберите специализированный способ загрузки, например Stream Load или Broker Load.

## Устранение неполадок {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| Симптом | Возможная причина | Решение |
| --- | --- | --- |
| Ошибка `null value for not null column` | Значение NULL вставлено в столбец NOT NULL. | Исправьте исходные данные или разрешите NULL в целевом столбце. |
| Ошибка `Insert has too many filtered data` | Доля отфильтрованных строк превышает `insert_max_filter_ratio`. | Увеличьте порог `insert_max_filter_ratio` или исправьте исходные данные. |
| Ошибка `Label Already Exists` | Указанная метка уже используется. | Выберите другую метку либо не указывайте её, чтобы система сгенерировала метку автоматически. |
| Задание отменяется после длительного выполнения без завершения. | Превышено время ожидания `insert_load_default_timeout_second` или `insert_timeout`. | Увеличьте соответствующее время ожидания или разделите загрузку на несколько пакетов. |
| Низкая пропускная способность при высокой степени параллелизма. | Ограничение на этапе фиксации транзакции. | Включите [Group Commit](../load-best-practices/group-commit-manual.md). |

## Дополнительная информация {#more-help}

Подробный синтаксис INSERT INTO приведён в справочнике по команде [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md). Дополнительную справку также можно получить командой `HELP INSERT` в командной строке клиента MySQL.
