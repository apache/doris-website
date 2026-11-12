---
{
    "title": "Beats",
    "language": "ru",
    "description": "Описывает использование плагина вывода Beats Doris для записи данных, собранных Filebeat и другими компонентами Beats, в Apache Doris в реальном времени через Stream Load."
}
---

[Beats](https://github.com/elastic/beats) представляет собой агент сбора данных, который поддерживает запись данных в системы хранения через пользовательские плагины вывода. Плагин вывода Beats Doris передаёт данные, собранные Beats, в Doris.

Для записи данных, собранных Filebeat и другими компонентами Beats, в Doris в реальном времени можно использовать плагин вывода Beats Doris. Этот плагин записывает данные через HTTP-интерфейс [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) и поддерживает параллельную работу в нескольких потоках, повторные попытки при сбоях, настройку формата и параметров Stream Load, а также вывод информации о скорости записи.

Плагин вывода Beats Doris поддерживает следующие компоненты Beats:

| Компонент Beats | Описание |
| --- | --- |
| [Filebeat](https://github.com/elastic/beats/tree/master/filebeat) | Собирает файлы журналов |
| [Metricbeat](https://github.com/elastic/beats/tree/master/metricbeat) | Собирает данные метрик |
| [Packetbeat](https://github.com/elastic/beats/tree/master/packetbeat) | Собирает сетевые данные |
| [Winlogbeat](https://github.com/elastic/beats/tree/master/winlogbeat) | Собирает журналы событий Windows |
| [Auditbeat](https://github.com/elastic/beats/tree/master/auditbeat) | Собирает данные аудита |
| [Heartbeat](https://github.com/elastic/beats/tree/master/heartbeat) | Собирает данные проверок доступности |

Использование плагина вывода Beats Doris обычно включает три шага:

1. Скачайте или соберите исполняемый файл Beats с плагином вывода в Doris.
2. Укажите адрес вывода в Doris и другие параметры в файле конфигурации Beats.
3. Запустите Beats для записи данных в Doris в реальном времени.

## Установка {#installation}

Вы можете скачать исполняемый файл Beats, в который уже включён плагин вывода в Doris, или собрать его из исходного кода.

### Загрузка с официального сайта {#download-from-the-official-site}

Скачайте [filebeat-doris-2.1.1](https://apache-doris-releases.oss-accelerate.aliyuncs.com/extension/filebeat-doris-2.1.1).

### Сборка из исходного кода {#compile-from-source}

В каталоге `extension/beats/` исходного кода Doris выполните следующие команды:

```bash
cd doris/extension/beats

go build -o filebeat-doris filebeat/filebeat.go
go build -o metricbeat-doris metricbeat/metricbeat.go
go build -o winlogbeat-doris winlogbeat/winlogbeat.go
go build -o packetbeat-doris packetbeat/packetbeat.go
go build -o auditbeat-doris auditbeat/auditbeat.go
go build -o heartbeat-doris heartbeat/heartbeat.go
```

## Настройка вывода в Doris {#configure-the-doris-output}

В файле конфигурации Beats настройте вывод в Doris с помощью `output.doris`. Ниже приведены основные параметры конфигурации:

| Параметр конфигурации | Значение по умолчанию | Описание |
| --- | --- | --- |
| `fenodes` | Нет | HTTP-адрес Stream Load. Задаётся в виде массива строк; можно указать один или несколько адресов. Например: `["http://fe1:8030", "http://fe2:8030"]`. |
| `user` | Нет | Имя пользователя Doris. У этого пользователя должны быть права на загрузку в целевую базу данных и таблицу. |
| `password` | Нет | Пароль пользователя Doris. |
| `database` | Нет | Имя базы данных Doris для записи. |
| `table` | Нет | Имя таблицы Doris для записи. |
| `label_prefix` | `beats` | Префикс Label для Doris Stream Load. Итоговый формат Label: `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}`. |
| `headers` | Нет | Параметр headers для Doris Stream Load. Задаётся в виде словаря YAML. |
| `codec_format_string` | Нет | Строка формата для данных, передаваемых в Doris Stream Load. Используйте `%{[a][b]}` для обращения к полю `a.b` во входных данных. |
| `bulk_max_size` | `100000` | Размер пакета для Doris Stream Load. |
| `max_retries` | `-1` | Количество повторных попыток после сбоя запроса Doris Stream Load. Значение `-1` означает неограниченное количество повторных попыток и используется для обеспечения надёжности передачи данных. |
| `log_request` | `true` | Определяет, выводить ли в журнал метаданные запросов и ответов Doris Stream Load для диагностики проблем. |
| `log_progress_interval` | `10` | Интервал вывода информации о скорости записи в журнал, в секундах. Установите значение `0`, чтобы отключить этот вывод. |

## Сценарий 1: сбор журналов TEXT {#scenario-1-collecting-text-logs}

В этом сценарии на примере журналов Doris FE показано, как собирать обычные текстовые записи и многострочные трассировки стека и записывать их в Doris.

### Шаг 1: подготовка данных {#step-1-prepare-the-data}

Файлы журналов Doris FE обычно находятся по пути `fe/log/fe.log` в каталоге установки Doris. Журнал FE представляет собой типичный журнал Java-программы и содержит такие поля, как временная метка, уровень журналирования, имя потока, место в коде и содержимое записи. В журнале есть как обычные записи, так и записи об исключениях с трассировками стека. Поскольку трассировка стека занимает несколько строк, при сборе данных основную запись журнала и соответствующую трассировку стека необходимо объединить в одну запись.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### Шаг 2: создание таблицы Doris {#step-2-create-a-doris-table}

Схема таблицы включает такие поля, как время создания записи журнала, время её сбора, имя хоста, путь к файлу журнала, тип журнала, уровень журналирования, имя потока, место в коде и содержимое записи.

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

### Шаг 3: настройка Filebeat {#step-3-configure-filebeat}

Файл конфигурации сбора журналов Filebeat (например, `filebeat_doris_log.yml`) использует формат YAML и состоит из четырёх основных частей:

1. `input`: читает исходный файл журнала.
2. `processors`: преобразует и разбирает содержимое журнала.
3. `queue.mem`: настраивает внутреннюю буферную очередь Filebeat.
4. `output`: выводит данные в Doris.

```yaml
# 1. input is responsible for reading raw data.
# type: log is the log input plugin, which lets you configure the path of the log file to read.
# multiline appends lines that do not start with a timestamp to the previous line, used to merge stack traces with the main log entry.
# The log input stores the log content in the message field, and also generates metadata fields such as agent.host and log.file.path.
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/your/log
  multiline:
    type: pattern
    # A line starting with yyyy-mm-dd HH:MM:SS is recognized as a new log entry; other lines are appended to the previous entry.
    pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
    negate: true
    match: after
    skip_newline: true

# 2. processors handle data transformation.
processors:
# Use the js script plugin to replace \t in the log with spaces, to avoid JSON parsing errors.
- script:
    lang: javascript
    source: >
        function process(event) {
            var msg = event.Get("message");
            msg = msg.replace(/\t/g, "  ");
            event.Put("message", msg);
        }
# Use the dissect plugin for simple log parsing.
- dissect:
    # 2024-06-08 18:26:25,481 INFO (report-thread|199) [ReportHandler.cpuReport():617] begin to handle
    tokenizer: "%{day} %{time} %{log_level} (%{thread}) [%{position}] %{content}"
    target_prefix: ""
    ignore_failure: true
    overwrite_keys: true

# 3. queue.mem configures the total number of events in the internal buffer queue, the flush batch size, and the flush time interval.
queue.mem:
  events: 1000000
  flush.min_events: 100000
  flush.timeout: 10s

# 4. output is responsible for sending data to Doris.
# doris output uses the Stream Load HTTP interface to write to Doris.
# headers specifies the Stream Load data format as JSON.
# codec_format_string formats the output content in a printf-like manner.
# In the example, you can reference Filebeat built-in fields (such as agent.hostname) or fields generated by processors (such as day).
output.doris:
  fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
  user: "your_username"
  password: "your_password"
  database: "your_db"
  table: "your_table"
  # output string format
  ## %{[agent][hostname]} and %{[log][file][path]} are Filebeat built-in metadata.
  ## Other commonly used Filebeat metadata includes the collection timestamp %{[@timestamp]}.
  ## %{[day]} and %{[time]} are fields obtained from the dissect parsing above.
  codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}"}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

### Шаг 4: запуск Filebeat {#step-4-run-filebeat}

Выполните следующую команду для запуска Filebeat:

```bash
./filebeat-doris -f config/filebeat_doris_log.yml
```

Если `log_request` имеет значение `true`, в журнал выводятся параметры запроса и результат ответа для каждого вызова Stream Load.

```text
doris stream load response:
{
    "TxnId": 45464,
    "Label": "beats_log_db_doris_log_20240708_223532_539_6c20a0d1-dcab-4b8e-9bc0-76b46a929bd1",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 452,
    "NumberLoadedRows": 452,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 277230,
    "LoadTimeMs": 1797,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 18,
    "ReadDataTimeMs": 9,
    "WriteDataTimeMs": 1758,
    "CommitAndPublishTimeMs": 18
}
```

По умолчанию информация о скорости записи выводится в журнал каждые 10 секунд. Она включает объём данных с момента запуска (в MB и ROWS), общую скорость (в MB/s и R/s) и скорость за последние 10 секунд.

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## Сценарий 2: сбор журналов JSON {#scenario-2-collecting-json-logs}

В этом сценарии на примере данных GitHub Events Archive показано, как собирать журналы JSON и записывать их в Doris.

### Шаг 1: подготовка данных {#step-1-prepare-the-data-1}

GitHub Events Archive содержит архивные данные о событиях, связанных с действиями пользователей GitHub, в формате JSON. Эти данные можно скачать с сайта [GitHub Archive](https://www.gharchive.org/). Например, чтобы скачать данные за 15:00 1 января 2024 года:

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

Ниже приведён пример записи. В исходных данных каждая строка содержит одну запись JSON; здесь запись отформатирована для удобства чтения.

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

### Шаг 2: создание таблицы Doris {#step-2-create-a-doris-table-1}

```sql
CREATE DATABASE log_db;
USE log_db;

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

### Шаг 3: настройка Filebeat {#step-3-configure-filebeat-1}

По сравнению с конфигурацией сбора журналов TEXT сценарий JSON имеет два отличия:

1. `processors` не используется, поскольку дополнительные преобразования не нужны.
2. `codec_format_string` напрямую выводит всё содержимое `message`, то есть исходное содержимое JSON.

```yaml
# input
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/your/log

# queue and batch
queue.mem:
  events: 1000000
  flush.min_events: 100000
  flush.timeout: 10s

# output
output.doris:
  fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
  user: "your_username"
  password: "your_password"
  database: "your_db"
  table: "your_table"
  # output string format
  ## Output the message of each line in the original file as-is.
  ## headers specifies format: "json", so Stream Load automatically parses JSON fields and writes them into the corresponding fields of the Doris table.
  codec_format_string: '%{[message]}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

### Шаг 4: запуск Filebeat {#step-4-run-filebeat-1}

Выполните следующую команду для запуска Filebeat:

```bash
./filebeat-doris -f config/filebeat_github_events.yml
```
