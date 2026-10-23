---
{
    "title": "Мониторинг хода выполнения запросов и использования ресурсов в реальном времени",
    "language": "ru",
    "description": "Узнайте, как в реальном времени просматривать ход выполнения и показатели использования ресурсов (CPU, память, shuffle, spill и другие) для выполняющихся запросов в Apache Doris с помощью SQL-команд или REST API.",
    "keywords": ["мониторинг запросов", "выполняющиеся запросы", "ход выполнения запроса", "ресурсы запроса", "SHOW PROC", "current_queries", "Trace ID", "управление рабочими нагрузками"],
    "sidebar_label": "Мониторинг хода выполнения запросов"
}
---

<!-- Knowledge type: Concept introduction + Operational steps -->

Apache Doris предоставляет два способа просмотра выполняющихся запросов и потребления ими ресурсов в реальном времени: **SQL-команды** (`SHOW PROC`) и **REST API**. Оба способа возвращают сведения о ходе выполнения на уровне задач, а также ключевые показатели, такие как объём сканирования, CPU, память, shuffle, spill и кеш.

## Просмотр выполняющихся запросов с помощью SQL-команд {#view-running-queries-via-sql-commands}

<!-- Knowledge type: Operational steps -->

Используйте команду `SHOW PROC`, чтобы получить список всех выполняющихся в данный момент запросов со статистикой в реальном времени.

```sql
SHOW PROC "/current_queries";
```

`SHOW PROC "/current_query_stmts"` возвращает ту же статистику. Начиная с Doris 4.1.1, обе команды используют единый расширенный формат статистики.

### Пример вывода {#example-output}

```
*************************** 1. row ***************************
                       QueryId: e00b00b1155d4042-98862b60016a768a
                  ConnectionId: 394
                       Catalog: internal
                      Database: wzhtest
                          User: root
                      ExecTime: 20717
                       SqlHash: cf263b08302d8be436c97dd5e6f0d283
                     Statement: INSERT INTO test_query_progress_tb
                                  SELECT DISTINCT k, CONCAT(v, CAST(k AS STRING))
                                  FROM test_query_progress_tb
                                  WHERE k % 2 = 0
                      ScanRows: 45400000 Rows
                     ScanBytes: 2.70 GB
                   ProcessRows: 75598123 Rows
                         CpuMs: 178336
            MaxPeakMemoryBytes: 13.03 GB
        CurrentUsedMemoryBytes: 8.69 GB
               WorkloadGroupId: 1777125330381
              ShuffleSendBytes: 0.00
               ShuffleSendRows: 0 Rows
     ScanBytesFromLocalStorage: 31.48 MB
    ScanBytesFromRemoteStorage: 0.00
 SpillWriteBytesToLocalStorage: 0.00
SpillReadBytesFromLocalStorage: 0.00
           BytesWriteIntoCache: 0.00
                    TotalTasks: 74
                 FinishedTasks: 51
                      Progress: 68%
*************************** 2. row ***************************
                       QueryId: e2b8c99658a94743-9ebbf0d036d83295
                  ConnectionId: 9
                       Catalog: hive_test
                      Database: tpch100_parquet
                          User: root
                      ExecTime: 10807
                       SqlHash: f8a30e4182d72cce3eff6cb385005b1f
                     Statement: select ... from supplier, lineitem l1, orders, nation ... limit 100
                      ScanRows: 1102562592 Rows
                     ScanBytes: 9.20 GB
                   ProcessRows: 112176670 Rows
                         CpuMs: 53808
            MaxPeakMemoryBytes: 3.13 GB
        CurrentUsedMemoryBytes: 2.50 GB
               WorkloadGroupId: 1777253545394
              ShuffleSendBytes: 0.00
               ShuffleSendRows: 0 Rows
     ScanBytesFromLocalStorage: 0.00
    ScanBytesFromRemoteStorage: 9.20 GB
 SpillWriteBytesToLocalStorage: 0.00
SpillReadBytesFromLocalStorage: 0.00
           BytesWriteIntoCache: 0.00
                    TotalTasks: 138
                 FinishedTasks: 65
                      Progress: 47%
```

### Описание полей {#field-descriptions}

<!-- Knowledge type: Reference table -->

| Поле | Описание |
|---|---|
| QueryId | Уникальный идентификатор запроса |
| ConnectionId | Идентификатор соединения MySQL |
| Catalog | Имя Catalog, к которому относится запрос, например `internal` или `hive_test` |
| Database | Имя базы данных или схемы |
| User | Пользователь, отправивший запрос |
| ExecTime | Время, прошедшее с начала выполнения, в миллисекундах |
| SqlHash | MD5-хеш SQL-оператора, позволяющий выявлять одинаковые запросы |
| Statement | Текст SQL-оператора (обрезается, если он слишком длинный) |
| ScanRows | Общее количество строк, просканированных на уровне хранения |
| ScanBytes | Общее количество байтов, просканированных на уровне хранения |
| ProcessRows | Количество строк, обработанных конвейером выполнения, отражающее фактическую пропускную способность операторов |
| CpuMs | Затраченное время CPU в миллисекундах |
| MaxPeakMemoryBytes | Пиковый объём памяти, использованный при выполнении запроса |
| CurrentUsedMemoryBytes | Объём памяти, занимаемый запросом в данный момент |
| WorkloadGroupId | Идентификатор группы рабочих нагрузок, к которой относится запрос |
| ShuffleSendBytes | Общее количество байтов, отправленных при обмене данными между узлами (shuffle) |
| ShuffleSendRows | Общее количество строк, отправленных при обмене данными между узлами (shuffle) |
| ScanBytesFromLocalStorage | Количество байтов, просканированных с локальных дисков |
| ScanBytesFromRemoteStorage | Количество байтов, просканированных из удалённого хранилища (например, HDFS или S3) |
| SpillWriteBytesToLocalStorage | Количество байтов, выгруженных на локальные диски из-за нехватки памяти (spill) |
| SpillReadBytesFromLocalStorage | Количество байтов, прочитанных обратно из данных, выгруженных на локальные диски при spill |
| BytesWriteIntoCache | Количество байтов, записанных в кеш данных |
| TotalTasks | Общее количество задач конвейера выполнения в запросе |
| FinishedTasks | Количество завершённых задач конвейера выполнения |
| Progress | Ход выполнения запроса в процентах, рассчитываемый как `FinishedTasks / TotalTasks` |

## Просмотр выполняющихся запросов через REST API {#view-running-queries-via-the-rest-api}

<!-- Knowledge type: Operational steps -->

**Назначение**: программное получение статистики выполняющихся запросов в реальном времени.

**Команда**:

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/current_queries
```

**Описание**: этот эндпоинт возвращает в формате JSON те же данные столбцов, что и `SHOW PROC`; значения полей имеют тот же смысл.

### Параметры запроса {#query-parameters}

| Параметр | Тип | Описание |
|---|---|---|
| is_all_node | Boolean (необязательный) | При значении `true` возвращает выполняющиеся запросы на всех узлах FE. По умолчанию — `true`. |

### Пример ответа {#example-response}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "columnNames": [
            "Frontend", "QueryId", "ConnectionId", "Catalog", "Database",
            "User", "ExecTime", "SqlHash", "Statement",
            "ScanRows", "ScanBytes", "ProcessRows", "CpuMs",
            "MaxPeakMemoryBytes", "CurrentUsedMemoryBytes", "WorkloadGroupId",
            "ShuffleSendBytes", "ShuffleSendRows",
            "ScanBytesFromLocalStorage", "ScanBytesFromRemoteStorage",
            "SpillWriteBytesToLocalStorage", "SpillReadBytesFromLocalStorage",
            "BytesWriteIntoCache",
            "TotalTasks", "FinishedTasks", "Progress"
        ],
        "rows": [
            [
                "172.19.0.3", "108e47ab438a4560-ab1651d16c036491", "2", "internal",
                "testdb", "root", "6074",
                "1a35f62f4b14b9d7961b057b77c3102f", "select sleep(60)",
                "0", "0.00", "0", "0",
                "0.00", "0.00", "0",
                "0.00", "0",
                "0.00", "0.00",
                "0.00", "0.00",
                "0.00",
                "1", "1", "100%"
            ]
        ]
    },
    "count": 0
}
```

## Отслеживание хода выполнения отдельного запроса в реальном времени по Trace ID {#track-real-time-progress-of-a-single-query-via-trace-id}

<!-- Knowledge type: Operational steps -->

Чтобы непрерывно отслеживать ход выполнения конкретного запроса, назначьте ему Trace ID, а затем опрашивайте эндпоинт статистики из отдельного сеанса для получения текущего состояния запроса в реальном времени.

**Шаг 1: задайте Trace ID перед выполнением запроса**

```sql
SET session_context="trace_id:my_trace_id";
SELECT ...;
```

**Шаг 2: опрашивайте статистику в другом сеансе**

```bash
curl http://<fe_ip>:<fe_http_port>/rest/v2/manager/query/statistics/my_trace_id
```

**Описание**: периодически вызывайте этот эндпоинт, чтобы получать актуальные сведения о ходе выполнения запроса до его завершения.

### Пример ответа {#example-response-1}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "scanRows": 1102562592,
        "scanBytes": 9878424780,
        "returnedRows": 12345,
        "processRows": 112176670,
        "cpuMs": 53808,
        "maxPeakMemoryBytes": 3355443200,
        "currentUsedMemoryBytes": 2684354560,
        "shuffleSendBytes": 0,
        "shuffleSendRows": 0,
        "scanBytesFromLocalStorage": 0,
        "scanBytesFromRemoteStorage": 9878424780,
        "spillWriteBytesToLocalStorage": 0,
        "spillReadBytesFromLocalStorage": 0,
        "bytesWriteIntoCache": 0,
        "totalTasksNum": 138,
        "finishedTasksNum": 65,
        "progress": "47%"
    },
    "count": 0
}
```
