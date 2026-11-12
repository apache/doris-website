---
{
    "title": "Vector",
    "language": "ru",
    "description": "Описывает, как с помощью Vector Doris Sink записывать в Apache Doris данные наблюдаемости, такие как логи, метрики и трассировки, в реальном времени через Stream Load. Приведены примеры сбора логов в форматах TEXT и JSON.",
    "keywords": [
        "Vector",
        "Vector Doris Sink",
        "Сбор логов Apache Doris",
        "Stream Load",
        "Конвейер данных наблюдаемости",
        "Сбор логов в формате JSON",
        "Сбор многострочных логов"
    ]
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenario: Use Vector to write observability data such as logs, metrics, and traces into Apache Doris -->

[Vector](https://vector.dev/) представляет собой высокопроизводительный конвейер данных наблюдаемости, написанный на Rust и предназначенный для сбора, преобразования и маршрутизации логов, метрик и трассировок. Для лучшей поддержки экосистемы Doris сообщество Doris разработало для Vector компонент **Doris Sink**, который эффективно записывает данные из различных источников в Apache Doris через [Stream Load](../../data-operate/import/import-way/stream-load-manual.md) для аналитической обработки.

### Сценарии применения {#applicable-scenarios}

Vector + Doris Sink в первую очередь подходит для следующих сценариев загрузки данных:

- **Сбор логов приложений**: запись в Doris в реальном времени многострочных или однострочных текстовых логов, создаваемых приложениями, веб-серверами, базами данных и другими подобными источниками.
- **Структурированные логи JSON**: сбор потоков событий NDJSON, например GitHub Events или логов доступа Nginx в формате JSON.
- **Метрики и трассировки**: сохранение в Doris данных наблюдаемости из таких источников, как Prometheus и OpenTelemetry, для анализа.
- **Агрегация данных из нескольких источников**: использование возможностей Source и Transform в Vector для преобразования данных из разнородных источников и их записи в Doris в едином виде.

### Конвейер данных {#data-pipeline}

Типичный поток данных выглядит следующим образом:

```text
Data source (Source) -> Vector Transform -> Doris Sink (Stream Load) -> Apache Doris
```

## Установка и развёртывание {#installation-and-deployment}

### Вариант 1: загрузка готового пакета {#option-1-download-the-pre-compiled-package}

Подходит для Linux на платформе x86_64. После загрузки распакуйте пакет и используйте его сразу:

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/vector-x86_64-unknown-linux-gnu.tar.gz
```

### Вариант 2: сборка из исходного кода {#option-2-compile-from-source}

Подходит для случаев, когда требуется собственная сборка или используются платформы, отличные от x86_64:

```shell
cd ${VECTOR_HOME}

# Choose a target based on the deployment environment. The Makefile provides multiple target platform options.
make package-x86_64-unknown-linux-gnu
```

## Быстрый старт {#quick-start}

Минимальный пример ниже показывает, как с помощью Vector записать содержимое файла в Doris через Doris Sink:

```toml
[sources.demo]
    type = "file"
    include = ["/path/to/input.json"]

[sinks.doris]
    type = "doris"
    inputs = ["demo"]
    endpoints = ["http://fe_ip:8030"]
    database = "log_db"
    table = "demo_table"

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"
```

Запустите Vector:

```shell
${VECTOR_HOME}/bin/vector --config vector_config.toml
```

## Примеры {#examples}

### Пример 1: сбор многострочных логов TEXT (логи Doris FE) {#example-1-text-multi-line-log-collection-doris-fe-logs}

Этот пример показывает, как собирать логи Java-приложения Doris FE. Логи FE содержат такие поля, как временная метка, уровень логирования, имя потока, позиция в коде и содержимое сообщения, а также часто включают многострочные трассировки стека исключений. Основную строку лога и её трассировку стека необходимо объединить в одну запись.

#### 1. Пример данных {#1-sample-data}

Логи FE обычно находятся в файле `fe/log/fe.log` в каталоге установки Doris:

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

#### 2. Создание таблицы Doris {#2-create-the-doris-table}

Схема таблицы включает поля времени создания записи лога, времени сбора, имени хоста, пути к файлу лога, типа лога, уровня логирования, имени потока, позиции в коде и содержимого сообщения. Для полей, часто используемых в запросах, создаются инвертированные индексы:

```sql
CREATE TABLE `doris_log` (
    `log_time`     datetime NULL COMMENT 'log content time',
    `collect_time` datetime NULL COMMENT 'log agent collect time',
    `host`         text     NULL COMMENT 'hostname or ip',
    `path`         text     NULL COMMENT 'log file path',
    `type`         text     NULL COMMENT 'log type',
    `level`        text     NULL COMMENT 'log level',
    `thread`       text     NULL COMMENT 'log thread',
    `position`     text     NULL COMMENT 'log code position',
    `message`      text     NULL COMMENT 'log message',
    INDEX idx_host     (`host`)     USING INVERTED,
    INDEX idx_path     (`path`)     USING INVERTED,
    INDEX idx_type     (`type`)     USING INVERTED,
    INDEX idx_level    (`level`)    USING INVERTED,
    INDEX idx_thread   (`thread`)   USING INVERTED,
    INDEX idx_position (`position`) USING INVERTED,
    INDEX idx_message  (`message`)  USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
) ENGINE=OLAP
DUPLICATE KEY(`log_time`)
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

#### 3. Настройка Vector {#3-vector-configuration}

```toml
# ==================== Sources ====================
[sources.fe_log_input]
    type = "file"
    include = ["/path/fe/log/fe.log"]
    start_at_beginning = true
    max_line_bytes = 102400
    ignore_older_secs = 0
    fingerprint.strategy = "device_and_inode"

    # Multi-line log handling: lines that start with a timestamp are treated as a new log; other lines are merged into the previous line (handles stacktraces).
    multiline.start_pattern     = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
    multiline.mode              = "halt_before"
    multiline.condition_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
    multiline.timeout_ms        = 10000

# ==================== Transforms ====================
# Use VRL to parse log content
[transforms.parse_log]
    inputs = ["fe_log_input"]
    type = "remap"
    source = '''
        # Add the type field
        .type = "fe.log"

        # Add collect_time (use the Asia/Shanghai time zone, consistent with log_time)
        .collect_time = format_timestamp!(.timestamp, format: "%Y-%m-%d %H:%M:%S", timezone: "Asia/Shanghai")

        # Parse the log format: 2024-01-01 12:00:00,123 INFO (thread-name) [position] message
        # Use (?s) to enable DOTALL mode so that .* matches newlines (handles multi-line logs)
        parsed, err = parse_regex(.message, r'(?s)^(?P<log_time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<level>[A-Z]+) \((?P<thread>[^\)]+)\) \[(?P<position>[^\]]+)\] (?P<content>.*)')

        if err == null {
            .log_time = parsed.log_time
            .level    = parsed.level
            .thread   = parsed.thread
            .position = parsed.position
            # Keep the full original message (including multi-line stacktrace information)
        } else {
            # On parse failure, set default values to avoid NULL causing partition errors
            .log_time = .collect_time
            .level    = "UNKNOWN"
            .thread   = ""
            .position = ""
        }

        # Extract host and path (Vector adds these metadata automatically)
        .host = .host
        .path = .file
    '''

# ==================== Sinks ====================
[sinks.doris]
    inputs = ["parse_log"]
    type = "doris"
    endpoints = ["http://fe_ip:http_port"]
    database = "log_db"
    table = "doris_log"
    label_prefix = "vector_fe_log"
    log_request = true

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"

[sinks.doris.framing]
    method = "newline_delimited"

[sinks.doris.request]
    concurrency = 10

[sinks.doris.headers]
    format = "json"
    read_json_by_line = "true"
    load_to_single_tablet = "true"

[sinks.doris.batch]
    max_events = 10000
    timeout_secs = 3
    max_bytes = 100000000
```

#### 4. Запуск Vector {#4-start-vector}

```shell
${VECTOR_HOME}/bin/vector --config vector_fe_log.toml
```

При `log_request = true` Vector выводит параметры и ответ каждого запроса Stream Load, что помогает при отладке:

```text
2025-11-19T10:14:40.822071Z  INFO sink{component_kind="sink" component_id=doris component_type=doris}:request{request_id=82}: vector::sinks::doris::service: Doris stream load response received. status_code=200 OK stream_load_status=Successful response={
  "TxnId": 169721,
  "Label": "vector_fe_log_log_db_doris_log_1763547280791_e2e619ee-4067-4fe8-974e-9f35f0d4e48e",
  "Comment": "",
  "TwoPhaseCommit": "false",
  "Status": "Success",
  "Message": "OK",
  "NumberTotalRows": 10,
  "NumberLoadedRows": 10,
  "NumberFilteredRows": 0,
  "NumberUnselectedRows": 0,
  "LoadBytes": 7301,
  "LoadTimeMs": 30,
  "BeginTxnTimeMs": 0,
  "StreamLoadPutTimeMs": 1,
  "ReadDataTimeMs": 0,
  "WriteDataTimeMs": 8,
  "ReceiveDataTimeMs": 2,
  "CommitAndPublishTimeMs": 18
} internal_log_rate_limit=true
```

### Пример 2: сбор логов JSON (GitHub Events) {#example-2-json-log-collection-github-events}

Этот пример показывает, как собирать структурированные логи в формате NDJSON, используя данные [GitHub Events Archive](https://www.gharchive.org/) в качестве источника.

#### 1. Пример данных {#1-sample-data-1}

GitHub Events Archive содержит архивные данные о действиях пользователей GitHub в формате JSON. Например, загрузите данные за 15:00 1 января 2024 года:

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

В исходных данных каждая строка представляет собой полный объект JSON. Пример ниже отформатирован для удобства чтения:

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

#### 2. Создание таблицы Doris {#2-create-the-doris-table-1}

Используйте тип `VARIANT` для непосредственного хранения вложенных объектов JSON и создайте инвертированные индексы для полей, используемых в запросах:

```sql
CREATE DATABASE log_db;
USE log_db;

CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id`         BIGINT,
    `type`       TEXT,
    `public`     BOOLEAN,
    `actor`      VARIANT,
    `repo`       VARIANT,
    `payload`    TEXT,
    INDEX `idx_id`      (`id`)      USING INVERTED,
    INDEX `idx_type`    (`type`)    USING INVERTED,
    INDEX `idx_actor`   (`actor`)   USING INVERTED,
    INDEX `idx_host`    (`repo`)    USING INVERTED,
    INDEX `idx_payload` (`payload`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
)
ENGINE = OLAP
DUPLICATE KEY(`created_at`)
PARTITION BY RANGE(`created_at`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
    "inverted_index_storage_format" = "v2",
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

#### 3. Настройка Vector {#3-vector-configuration-1}

```toml
# ==================== Sources ====================
[sources.github_events_reload]
    type = "file"
    include = ["/path/2024-01-01-15.json"]
    read_from = "beginning"
    ignore_checkpoints = true
    max_line_bytes = 10485760
    ignore_older_secs = 0
    line_delimiter = "\n"
    fingerprint.strategy = "device_and_inode"

# ==================== Transforms ====================
# Parse the JSON-formatted GitHub Events data. The VARIANT type can store nested objects directly.
[transforms.parse_json]
    inputs = ["github_events_reload"]
    type = "remap"
    source = '''
        # Parse the JSON data (each line is a complete JSON object)
        . = parse_json!(.message)

        # Convert the payload field to a JSON string (TEXT type)
        .payload = encode_json(.payload)

        # Keep only the fields required by the table
        . = {
            "created_at": .created_at,
            "id":         .id,
            "type":       .type,
            "public":     .public,
            "actor":      .actor,
            "repo":       .repo,
            "payload":    .payload
        }
    '''

# ==================== Sinks ====================
[sinks.doris]
    inputs = ["parse_json"]
    type = "doris"
    endpoints = ["http://fe_ip:http_port"]
    database = "log_db"
    table = "github_events"
    label_prefix = "vector_github_events"
    log_request = true

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"

[sinks.doris.framing]
    method = "newline_delimited"

[sinks.doris.request]
    concurrency = 10

[sinks.doris.headers]
    format = "json"
    read_json_by_line = "true"
    load_to_single_tablet = "true"

[sinks.doris.batch]
    max_events = 10000
    timeout_secs = 3
    max_bytes = 100000000
```

#### 4. Запуск Vector {#4-start-vector-1}

```shell
vector --config vector_config.toml
```

## Справочник параметров конфигурации {#configuration-parameter-reference}

<!-- Knowledge type: Configuration parameters -->

Doris Sink поддерживает широкий набор параметров конфигурации для записи данных в различных сценариях. Ниже параметры сгруппированы по назначению.

### Основные настройки {#basic-configuration}

| Параметр       | Тип              | По умолчанию | Описание                                                                                             |
| -------------- | ---------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `type`         | string           | -          | Фиксированное значение `doris`                                                                       |
| `inputs`       | array            | -          | Список имён вышестоящих источников данных                                                             |
| `endpoints`    | array\<string\>  | -          | HTTP/HTTPS-адреса Doris FE. Обязательно укажите протокол и порт, например `["https://fe1:8030"]` |
| `database`     | string / template | -         | Имя целевой базы данных. Поддерживает [шаблоны](https://vector.dev/docs/reference/configuration/template-syntax/) |
| `table`        | string / template | -         | Имя целевой таблицы. Поддерживает шаблоны                                                              |
| `label_prefix` | string           | `"vector"` | Префикс метки Stream Load. Итоговая метка имеет вид `{label_prefix}_{database}_{table}_{timestamp}_{uuid}` |

### Настройка аутентификации {#authentication-configuration}

| Параметр        | Тип    | По умолчанию | Описание                                                             |
| --------------- | ------ | --------- | -------------------------------------------------------------------- |
| `auth.strategy` | string | `"basic"` | Способ аутентификации. В настоящее время Doris поддерживает только Basic Auth |
| `auth.user`     | string | -         | Имя пользователя Doris                                               |
| `auth.password` | string | -         | Пароль Doris. Можно использовать совместно с переменными окружения или системой управления секретами |

### Настройка запросов и параллелизма {#request-and-concurrency-configuration}

| Параметр                              | Тип              | По умолчанию  | Описание                                                                             |
| ------------------------------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------ |
| `request.concurrency`                 | string / integer | `"adaptive"`  | Стратегия параллелизма. Поддерживает `"adaptive"`, `"none"` (последовательное выполнение) или положительное целое число, ограничивающее число параллельных запросов |
| `request.timeout_secs`                | integer          | `60`          | Тайм-аут отдельного запроса Stream Load в секундах                                    |
| `request.rate_limit_duration_secs`    | integer          | `1`           | Временное окно ограничения частоты запросов в секундах                               |
| `request.rate_limit_num`              | integer          | `i64::MAX`    | Допустимое число запросов за временное окно. По умолчанию практически не ограничено   |
| `request.retry_attempts`              | integer          | `usize::MAX`  | Максимальное число повторных попыток для промежуточного ПО Tower. По умолчанию число попыток не ограничено |
| `request.retry_initial_backoff_secs`  | integer          | `1`           | Время ожидания перед первой повторной попыткой в секундах. Для последующих попыток задержка растёт по последовательности Фибоначчи |
| `request.retry_max_duration_secs`     | integer          | `30`          | Максимальное время ожидания перед отдельной повторной попыткой в секундах            |
| `request.retry_jitter_mode`           | string           | `"full"`      | Режим случайного разброса задержек повторных попыток (jitter). Поддерживает `full` или `none` |

#### Адаптивный параллелизм {#adaptive-concurrency}

Действует только при `request.concurrency = "adaptive"`.

| Параметр                                              | Тип     | По умолчанию | Описание                                   |
| ----------------------------------------------------- | ------- | ------- | ------------------------------------------ |
| `request.adaptive_concurrency.initial_concurrency`    | integer | `1`     | Начальное число параллельных запросов в адаптивном режиме |
| `request.adaptive_concurrency.max_concurrency_limit`  | integer | `200`   | Верхний предел числа параллельных запросов в адаптивном режиме для предотвращения перегрузки |
| `request.adaptive_concurrency.decrease_ratio`         | float   | `0.9`   | Коэффициент уменьшения параллелизма при срабатывании механизма замедления |
| `request.adaptive_concurrency.ewma_alpha`             | float   | `0.4`   | Вес экспоненциального скользящего среднего для метрики RTT |
| `request.adaptive_concurrency.rtt_deviation_scale`    | float   | `2.5`   | Масштабный коэффициент отклонения RTT, позволяющий игнорировать обычные колебания |

### Кодирование и формат данных {#encoding-and-data-format}

Doris Sink использует раздел `encoding` для управления сериализацией событий. По умолчанию данные выводятся в формате NDJSON (JSON с разделением объектов переводом строки):

| Параметр                                          | Тип              | По умолчанию | Описание                                                                     |
| ------------------------------------------------- | ---------------- | ---------- | ---------------------------------------------------------------------------- |
| `encoding.codec`                                  | string           | `"json"`   | Кодировка сериализации. Доступны значения `json`, `text`, `csv` и другие |
| `encoding.timestamp_format`                       | string           | -          | Формат вывода временных меток. Поддерживает `rfc3339`, `unix` и другие        |
| `encoding.only_fields` / `encoding.except_fields` | array\<string\>  | -          | Задаёт список разрешённых или исключённых полей                              |
| `encoding.framing.method`                         | string           | определяется автоматически | Пользовательский формат фрейминга, например `newline_delimited` или `character_delimited` |

#### Заголовки Stream Load (`headers`) {#stream-load-headers-headers}

`headers` представляет собой набор пар «ключ-значение», который напрямую передаётся в HTTP-заголовках запроса Doris Stream Load. Он принимает все параметры заголовков, поддерживаемые Stream Load (все значения должны быть строками). Часто используемые настройки:

| Параметр                       | Тип    | По умолчанию | Описание                                                             |
| ------------------------------ | ------ | -------- | -------------------------------------------------------------------- |
| `headers.format`               | string | `"json"` | Формат данных. Поддерживает `json`, `csv`, `parquet` и другие        |
| `headers.read_json_by_line`    | string | `"true"` | Читать ли JSON построчно (NDJSON)                                     |
| `headers.strip_outer_array`    | string | `"false"`| Удалять ли внешний массив                                            |
| `headers.column_separator`     | string | -        | Разделитель столбцов CSV (действует при `format = csv`)                |
| `headers.columns`              | string | -        | Порядок столбцов для сопоставления CSV/JSON, например `timestamp,client_ip,status_code` |
| `headers.where`                | string | -        | Условие фильтрации `where` для Stream Load                            |

### Настройка пакетной обработки {#batch-configuration}

| Параметр              | Тип              | По умолчанию | Описание                                                     |
| --------------------- | ---------------- | ----------- | ------------------------------------------------------------ |
| `batch.max_bytes`     | integer          | `10485760`  | Максимальный размер пакета в байтах (10 MB)                   |
| `batch.max_events`    | integer / `null` | `null`      | Максимальное число событий в пакете. По умолчанию не ограничено; пакеты формируются по размеру в байтах |
| `batch.timeout_secs`  | float            | `1`         | Максимальное время ожидания формирования пакета в секундах    |

### Настройки надёжности и безопасности {#reliability-and-security-configuration}

| Параметр                                                                                                        | Тип      | По умолчанию  | Описание                                                                             |
| --------------------------------------------------------------------------------------------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------ |
| `max_retries`                                                                                                   | integer  | `-1`          | Максимальное число повторных попыток на уровне sink. `-1` означает отсутствие ограничения |
| `log_request`                                                                                                   | boolean  | `false`       | Выводить ли каждый запрос Stream Load и ответ на него (в рабочей среде включайте по необходимости) |
| `compression`                                                                                                   | -        | не поддерживается | -                                                                                 |
| `distribution.retry_initial_backoff_secs`                                                                       | integer  | `1`           | Начальная задержка в секундах между повторными проверками работоспособности конечной точки при восстановлении |
| `distribution.retry_max_duration_secs`                                                                          | integer  | `3600`        | Максимальная задержка между проверками работоспособности в секундах                   |
| `tls.verify_certificate`                                                                                        | boolean  | `true`        | Включение или отключение проверки сертификата вышестоящего сервера                    |
| `tls.verify_hostname`                                                                                           | boolean  | `true`        | Включение или отключение проверки имени хоста                                         |
| `tls.ca_file` / `tls.crt_file` / `tls.key_file` / `tls.key_pass` / `tls.alpn_protocols` / `tls.server_name`     | различные | -             | Стандартные параметры конфигурации TLS-клиента Vector для собственных центров сертификации, взаимной аутентификации или SNI |
| `acknowledgements.enabled`                                                                                      | boolean  | `false`       | Включение сквозных подтверждений; используется совместно с компонентами Source, поддерживающими подтверждения |

## Рекомендации {#best-practices}

- **Размер пакета**: для сценариев сбора логов с высокой пропускной способностью установите `batch.max_bytes` примерно в 100 MB и соответственно увеличьте `batch.timeout_secs`, чтобы сократить число запросов Stream Load.
- **Стратегия параллелизма**: при стабильном входящем потоке явно задайте для `request.concurrency` фиксированное целое число. При значительных колебаниях потока используйте `"adaptive"`, чтобы Vector автоматически регулировал параллелизм.
- **Запись в один tablet**: установите `load_to_single_tablet = "true"` в `headers`, чтобы снизить затраты ресурсов на стороне BE при записи множества небольших файлов крупными пакетами.
- **Динамическое партиционирование и компактация временных рядов**: включите `dynamic_partition` и задайте `compaction_policy = "time_series"` для таблиц логов, чтобы значительно сократить затраты на хранение и слияние данных.
- **Отладка в рабочей среде**: оставляйте `log_request` отключённым по умолчанию и включайте только при поиске неисправностей, чтобы избежать чрезмерного роста логов.
- **TLS и аутентификация**: используйте параметры `tls.*` для включения проверки HTTPS. Передавайте `auth.password` через переменные окружения или систему управления секретами, чтобы не хранить учётные данные в открытом виде.
