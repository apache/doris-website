---
{
    "title": "Fluent Bit",
    "language": "ru",
    "description": "Описывает, как использовать Fluent Bit Doris Output Plugin для записи логов в форматах TEXT и JSON в Apache Doris в реальном времени через Stream Load.",
    "keywords": [
        "Fluent Bit",
        "Doris Stream Load",
        "сбор логов",
        "запись логов в Doris",
        "Fluent Bit Doris Output Plugin"
    ]
}
---

<!-- Knowledge type: One-sentence definition -->
<!-- Applicable scenario: Use Fluent Bit to write logs into Apache Doris in real time -->

[Fluent Bit](https://fluentbit.io/) — быстрый инструмент для обработки и пересылки логов, который поддерживает запись данных в системы хранения через пользовательские выходные плагины. Fluent Bit Doris Output Plugin — это выходной плагин для записи данных из Fluent Bit в Doris. Он вызывает HTTP-интерфейс [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) для записи данных в Doris в реальном времени.

Основные возможности:

- Параллельная запись в нескольких потоках.
- Повторные попытки при сбое запросов Doris Stream Load.
- Настраиваемые форматы и параметры Stream Load.
- Статистика скорости записи.

## Сценарии использования и порядок начала работы {#applicable-scenarios-and-onboarding-flow}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choosing a log collection solution -->

Выберите подходящий способ интеграции в зависимости от типа логов:

| Сценарий использования | Рекомендуемый подход | Пример в этом документе |
| --- | --- | --- |
| Сбор логов в формате TEXT, содержащих `stacktrace` | Используйте входной плагин `tail`, парсер многострочных логов и парсер полей лога, чтобы объединить многострочный лог в одну запись перед записью в Doris | [Сбор логов Doris FE в формате TEXT](#collect-doris-fe-text-logs) |
| Сбор однострочных логов событий в формате JSON | Используйте входной плагин `tail` и парсер JSON для записи JSON-записей непосредственно в Doris | [Сбор логов в формате JSON](#collect-json-logs) |

Основная последовательность действий для интеграции с Doris через Fluent Bit Doris Output Plugin:

1. Скачайте или скомпилируйте исполняемый файл Fluent Bit, включающий Doris Output Plugin.
2. Настройте параметры входного плагина, парсера и выходного плагина Doris в Fluent Bit в соответствии с типом логов.
3. Запустите Fluent Bit для записи логов в Doris в реальном времени.

## Установка Fluent Bit Doris Output Plugin (альфа-версия) {#install-the-fluent-bit-doris-output-plugin-alpha-version}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the runtime environment for the Fluent Bit Doris Output Plugin -->

Вы можете скачать готовый исполняемый файл или собрать его из исходного кода.

### Скачивание с официального сайта {#download-from-the-official-site}

Скачайте [fluent-bit-doris-3.1.9](https://apache-doris-releases.oss-accelerate.aliyuncs.com/integrations/fluent-bit-doris-3.1.9).

### Сборка из исходного кода {#build-from-source}

Клонируйте ветку `dev` репозитория [fluent-bit](https://github.com/joker-star-l/fluent-bit), затем выполните следующие команды в каталоге `build/`:

```shell
cmake -DFLB_RELEASE=ON ..
make
```

Результат сборки — `build/bin/fluent-bit`.

## Настройка параметров выходного плагина Doris {#configure-doris-output-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure Fluent Bit to write to Doris -->

Fluent Bit Doris Output Plugin поддерживает следующие параметры конфигурации:

| Параметр | Описание |
| --- | --- |
| `host` | Хост HTTP-интерфейса Stream Load. |
| `port` | Порт HTTP-интерфейса Stream Load. |
| `user` | Имя пользователя Doris. У пользователя должны быть права на импорт в соответствующую базу данных и таблицу. |
| `password` | Пароль пользователя Doris. |
| `database` | Имя базы данных Doris для записи. |
| `table` | Имя таблицы Doris для записи. |
| `label_prefix` | Префикс Label для Doris Stream Load. Итоговый Label имеет вид `{label_prefix}_{timestamp}_{uuid}`. Значение по умолчанию — `fluentbit`. Если задано `false`, Label не добавляется. |
| `time_key` | Имя столбца с меткой времени, добавляемого в данные. Значение по умолчанию — `date`. Если задано `false`, этот столбец не добавляется. |
| `header` | Параметры заголовков для Doris Stream Load. Можно задать несколько значений. |
| `log_request` | Выводить ли в лог метаданные запросов и ответов Doris Stream Load для диагностики проблем. Значение по умолчанию — `true`. |
| `log_progress_interval` | Интервал вывода скорости записи в лог, в секундах. Значение по умолчанию — `10`. Установите `0`, чтобы отключить вывод этих сведений. |
| `retry_limit` | Число повторных попыток после сбоя запроса Doris Stream Load. Значение по умолчанию — `1`. Если задано `false`, число повторных попыток не ограничено. |
| `workers` | Число рабочих потоков, выполняющих Doris Stream Load. Значение по умолчанию — `2`. |

## Сбор логов Doris FE в формате TEXT {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect multi-line Java logs and write them to Doris -->

В этом сценарии на примере логов Doris FE показано, как собирать логи в формате TEXT. Для многострочных логов исключений, содержащих `stacktrace`, сначала нужно объединить основную запись лога и `stacktrace` в одну запись, затем разобрать поля и записать их в Doris.

### 1. Подготовьте пример лога {#1-prepare-a-log-sample}

Файл логов FE обычно находится по пути `fe/log/fe.log` в каталоге установки Doris. Это типичный лог Java-программы, содержащий такие поля, как метка времени, уровень логирования, имя потока, место в коде и содержимое сообщения. В логах есть как обычные записи, так и записи об исключениях со `stacktrace`. Поскольку `stacktrace` занимает несколько строк, при сборе логов необходимо объединять основную запись лога и `stacktrace` в одну запись.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. Создайте таблицу Doris {#2-create-a-doris-table}

Схема таблицы включает такие поля, как время создания записи лога, время сбора, имя хоста, путь к файлу логов, тип лога, уровень логирования, имя потока, место в коде и содержимое сообщения.

```sql
CREATE TABLE `doris_log` (
    `log_time` datetime NULL COMMENT 'log content time',
    `collect_time` datetime NULL COMMENT 'log agent collect time',
    `host` text NULL COMMENT 'hostname or ip',
    `path` text NULL COMMENT 'log file path',
    `type` text NULL COMMENT 'log type',
    `level` text NULL COMMENT 'log level',
    `thread` text NULL COMMENT 'log thread',
    `position` text NULL COMMENT 'log code position',
    `message` text NULL COMMENT 'log message',
    INDEX idx_host (`host`) USING INVERTED COMMENT '',
    INDEX idx_path (`path`) USING INVERTED COMMENT '',
    INDEX idx_type (`type`) USING INVERTED COMMENT '',
    INDEX idx_level (`level`) USING INVERTED COMMENT '',
    INDEX idx_thread (`thread`) USING INVERTED COMMENT '',
    INDEX idx_position (`position`) USING INVERTED COMMENT '',
    INDEX idx_message (`message`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true") COMMENT ''
) ENGINE=OLAP
DUPLICATE KEY(`log_time`)
COMMENT 'OLAP'
PARTITION BY RANGE(`log_time`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-7",
    "dynamic_partition.end" = "1",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "10",
    "dynamic_partition.create_history_partition" = "true",
    "compaction_policy" = "time_series"
);
```

### 3. Настройте Fluent Bit {#3-configure-fluent-bit}

Для этого сценария нужны два файла конфигурации:

| Файл конфигурации | Назначение |
| --- | --- |
| `doris_log.conf` | Задаёт параметры службы Fluent Bit, входного плагина, фильтра и выходного плагина Doris. |
| `parsers.conf` | Определяет парсер многострочных логов и парсер полей логов FE. |

`doris_log.conf`:

```ini
# config for Fluent Bit service
[SERVICE]
    log_level info
    # parsers file
    parsers_file parsers.conf

# use input tail
[INPUT]
    name tail
    path /path/to/your/log
    # add log file name to the record, key is 'path'
    path_key path
    # set multiline parser
    multiline.parser multiline_java

# parse log
[FILTER]
    match *
    name parser
    key_name log
    parser fe_log
    reserve_data true

# add host info
[FILTER]
    name sysinfo
    match *
    # add hostname to the record, key is 'host'
    hostname_key host

# output to doris
[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    # add 'collect_time' to the record
    time_key collect_time
    # 'collect_time' is timestamp, change it to datatime
    header columns collect_time=from_unixtime(collect_time)
    log_request true
    log_progress_interval 10
```

`parsers.conf`:

```ini
[MULTILINE_PARSER]
    name          multiline_java
    type          regex
    flush_timeout 1000
    # Regex rules for multiline parsing
    # ---------------------------------
    #
    # configuration hints:
    #
    #  - first state always has the name: start_state
    #  - every field in the rule must be inside double quotes
    #
    # rules   |   state name   | regex pattern | next state name
    # --------|----------------|---------------|-----------------
    rule         "start_state"   "/(^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})(.*)/"  "cont"
    rule         "cont"          "/(^(?![0-9]{4}-[0-9]{2}-[0-9]{2}))(.*)/"     "cont"


[PARSER]
    name        fe_log
    format      regex
    # parse and add 'log_time', 'level', 'thread', 'position', 'message' to the record
    regex       ^(?<log_time>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) (?<level>[^ ]+) \((?<thread>[^\)]+)\) \[(?<position>[^\]]+)\] (?<message>(\n|.)*)\n$
```

### 4. Запустите Fluent Bit и проверьте результаты записи {#4-start-fluent-bit-and-check-the-write-results}

```shell
fluent-bit -c doris_log.conf
```

В лог будут выводиться метаданные ответа Stream Load:

```text
[2024/10/31 18:39:55] [ info] [output:doris:doris.1] 127.0.0.1:8040, HTTP status=200
{
    "TxnId": 32155,
    "Label": "fluentbit_1730371195_91cca1aa-c15f-45d2-b503-fe7d2e839c2a",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 836,
    "LoadTimeMs": 298,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 268,
    "CommitAndPublishTimeMs": 25
}
```

В лог также выводится скорость записи:

```text
[2024/10/31 18:40:13] [ info] [output:doris:doris.1] total 0 MB 2 ROWS, total speed 0 MB/s 0 R/s, last 10 seconds speed 0 MB/s 0 R/s
```

## Сбор логов в формате JSON {#collect-json-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect single-line JSON event logs and write them to Doris -->

В этом сценарии на примере данных GitHub Events Archive показано, как собирать логи в формате JSON. В отличие от сбора логов в формате TEXT, для логов JSON не требуется дополнительный `FILTER` для обработки и преобразования.

### 1. Подготовьте данные {#1-prepare-data}

[GitHub Events Archive](https://www.gharchive.org/) — архив данных о действиях пользователей GitHub в формате JSON. В следующем примере скачиваются данные за 15:00 1 января 2024 года:

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

В исходных данных каждая строка содержит один объект JSON. Ниже приведён отформатированный пример данных:

```json
{
    "id": "37066529221",
    "type": "PushEvent",
    "actor": {
        "id": 46139131,
        "login": "Bard89",
        "display_login": "Bard89",
        "gravatar_id": "",
        "url": "https://api.github.com/users/Bard89",
        "avatar_url": "https://avatars.githubusercontent.com/u/46139131?"
    },
    "repo": {
        "id": 780125623,
        "name": "Bard89/talk-to-me",
        "url": "https://api.github.com/repos/Bard89/talk-to-me"
    },
    "payload": {
        "repository_id": 780125623,
        "push_id": 17799451992,
        "size": 1,
        "distinct_size": 1,
        "ref": "refs/heads/add_mvcs",
        "head": "f03baa2de66f88f5f1754ce3fa30972667f87e81",
        "before": "85e6544ede4ae3f132fe2f5f1ce0ce35a3169d21"
    },
    "public": true,
    "created_at": "2024-04-01T23:00:00Z"
}
```

### 2. Создайте таблицу Doris {#2-create-a-doris-table-1}

```sql
CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id` BIGINT,
    `type` TEXT,
    `public` BOOLEAN,
    `actor` VARIANT,
    `repo` VARIANT,
    `payload` TEXT,
    INDEX `idx_id` (`id`) USING INVERTED,
    INDEX `idx_type` (`type`) USING INVERTED,
    INDEX `idx_actor` (`actor`) USING INVERTED,
    INDEX `idx_host` (`repo`) USING INVERTED,
    INDEX `idx_payload` (`payload`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
)
ENGINE = OLAP
DUPLICATE KEY(`created_at`)
PARTITION BY RANGE(`created_at`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
    "compaction_policy" = "time_series",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.create_history_partition" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-30",
    "dynamic_partition.end" = "1",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "10",
    "dynamic_partition.replication_num" = "1"
);
```

### 3. Настройте Fluent Bit {#3-configure-fluent-bit-1}

Для этого сценария нужны два файла конфигурации:

| Файл конфигурации | Назначение |
| --- | --- |
| `github_events.conf` | Задаёт параметры службы Fluent Bit, входного плагина и выходного плагина Doris. |
| `github_parsers.conf` | Определяет парсер JSON. |

`github_events.conf`:

```ini
[SERVICE]
    log_level info
    parsers_file github_parsers.conf

[INPUT]
    name tail
    parser github
    path /path/to/your/log

[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    time_key false
    log_request true
    log_progress_interval 10
```

`github_parsers.conf`:

```ini
[PARSER]
    name github
    format json
```

### 4. Запустите Fluent Bit {#4-start-fluent-bit}

```shell
fluent-bit -c github_events.conf
```
