---
{
    "title": "OpenTelemetry",
    "language": "ru",
    "description": "Описывает запись логов, трассировок и метрик в Apache Doris через Doris Exporter для OpenTelemetry Collector для совместного анализа данных наблюдаемости.",
    "keywords": [
        "OpenTelemetry Doris",
        "OpenTelemetry Collector",
        "Doris Exporter",
        "данные наблюдаемости",
        "сбор логов",
        "данные трассировок"
    ]
}
---

<!-- Knowledge type: Operation guide / Configuration reference -->
<!-- Applicable scenario: Use OpenTelemetry to write logs, traces, and metrics into Apache Doris -->

OpenTelemetry (сокращённо OTel) представляет собой независимую от поставщиков платформу наблюдаемости с открытым исходным кодом, предназначенную для мониторинга, генерации, сбора и экспорта данных наблюдаемости, таких как логи, трассировки и метрики. OpenTelemetry определяет набор стандартов и протоколов наблюдаемости, которые получили широкое распространение среди сообщества и поставщиков решений и постепенно становятся стандартом де-факто в этой области.

OpenTelemetry предоставляет платформы и SDK для сбора данных наблюдаемости, позволяющие отслеживать работу приложений и систем на разных языках программирования, в разных инфраструктурах и средах выполнения. Doris может служить хранилищем для OpenTelemetry, обеспечивая высокую производительность, низкую стоимость и единые возможности хранения и анализа данных наблюдаемости. Общая архитектура показана ниже:

![Интеграция Doris с OpenTelemetry](/images/next/connection-integration/data-integration/opentelemetry/opentelemetry.jpg)

## Сценарии применения и процесс интеграции {#applicable-scenarios-and-integration-process}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choose OpenTelemetry Collector configuration based on observability data type -->

Выберите подходящий способ интеграции в зависимости от типа данных:

| Пользовательский сценарий | Рекомендуемая конфигурация | Справочный раздел |
| --- | --- | --- |
| Сбор обычных логов TEXT, например логов Doris FE, и обработка многострочных логов, например трассировок стека Java | Используйте приёмник `filelog`, `multiline` и `regex_parser`, чтобы объединять многострочные логи и разбирать их перед записью в Doris | [Сбор логов Doris FE в формате TEXT](#collect-doris-fe-text-logs) |
| Сбор структурированных логов, в которых каждая строка содержит один объект JSON | Используйте приёмник `filelog` и `json_parser`, чтобы разбирать логи с объектом JSON в каждой строке и записывать их в Doris | [Сбор логов GitHub Events в формате JSON](#collect-github-events-json-logs) |
| Сбор данных трассировок приложений | Используйте приёмник `otlp` для получения данных, отправляемых OpenTelemetry Java Agent, а затем записывайте их в Doris через Doris Exporter | [Сбор данных трассировок приложений](#collect-application-trace-data) |
| Настройка целевого расположения данных в Doris, автоматического создания таблиц, срока хранения партиций и параметров Stream Load | Настройте в Doris Exporter такие параметры, как `endpoint`, `database`, `table.*`, `create_schema` и `headers` | [Настройка Doris Exporter](#configure-doris-exporter) |

Основной процесс интеграции с Doris с помощью Doris Exporter для OpenTelemetry Collector:

1. Скачайте и распакуйте OpenTelemetry Collector Contrib.
2. Настройте Doris Exporter, указав адрес Doris FE, учётную запись, целевую базу данных и таблицу, а также параметры Stream Load.
3. Настройте приёмник, процессор и конвейер в зависимости от типа данных.
4. Запустите Collector и начните запись логов, трассировок или метрик в Doris.
5. Отслеживайте результаты загрузки по логам ответов Stream Load и логам скорости записи.

## Установка OpenTelemetry Collector Contrib {#install-opentelemetry-collector-contrib}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the OpenTelemetry Collector runtime environment that includes the Doris Exporter -->

Скачайте установочный пакет OpenTelemetry Collector Contrib с [официальной страницы релизов OpenTelemetry](https://github.com/open-telemetry/opentelemetry-collector-releases/releases). Версия Contrib включает Doris Exporter. Пример скачивания:

```bash
wget https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.132.2/otelcol-contrib_0.132.2_linux_amd64.tar.gz
```

После скачивания распакуйте установочный пакет, чтобы получить исполняемый файл `otelcol-contrib`.

## Настройка Doris Exporter {#configure-doris-exporter}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the OpenTelemetry Collector to write observability data into Doris -->

Doris Exporter для OpenTelemetry Collector записывает данные через HTTP-интерфейс [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual). Основные параметры конфигурации:

| Параметр конфигурации | Значение по умолчанию | Описание |
| --- | --- | --- |
| `endpoint` | Не задано | HTTP-адрес Doris FE в формате `host:port`, например `127.0.0.1:8030`. |
| `mysql_endpoint` | Не задано | Адрес MySQL для Doris FE в формате `host:port`, например `127.0.0.1:9030`. |
| `username` | Не задано | Имя пользователя Doris. Пользователь должен иметь право записи в соответствующую базу данных и таблицу. |
| `password` | Не задано | Пароль пользователя Doris. |
| `database` | Не задано | Имя базы данных Doris, в которую записываются данные. |
| `table.logs` | `otel_logs` | Имя таблицы Doris, в которую записываются логи. |
| `table.traces` | `otel_traces` | Имя таблицы Doris, в которую записываются трассировки. |
| `table.metrics` | `otel_metrics` | Имя таблицы Doris, в которую записываются метрики. |
| `create_schema` | `true` | Создавать ли базу данных и таблицу Doris автоматически. |
| `history_days` | `0` | Срок хранения исторических данных в автоматически создаваемой таблице Doris, в днях. `0` означает бессрочное хранение. |
| `create_history_days` | `0` | Количество дней, для которых изначально создаются партиции в автоматически создаваемой таблице Doris. `0` означает, что партиции не создаются. |
| `label_prefix` | `open_telemetry` | Префикс Label для Doris Stream Load. Итоговый формат Label: `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}`. |
| `headers` | Не задано | Параметр заголовков Doris Stream Load. Задаётся в формате отображения YAML. |
| `log_progress_interval` | `10` | Интервал вывода скорости записи в лог, в секундах. Установите значение `0`, чтобы отключить вывод этих сообщений. |

Дополнительные параметры описаны в [документации Doris Exporter для OpenTelemetry Collector Contrib](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter).

## Сбор логов Doris FE в формате TEXT {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect general text logs and handle multi-line stacktraces -->

В этом сценарии на примере логов Doris FE показано, как собирать логи TEXT и записывать их в Doris.

### Шаг 1: Подготовка файла логов {#step-1-prepare-the-log-file}

Файлы логов Doris FE обычно находятся по пути `fe/log/fe.log` в каталоге установки Doris. Логи FE представляют собой типичные логи Java-программ и содержат такие поля, как временная метка, уровень логирования, имя потока, расположение в коде и содержимое записи. В них встречаются как обычные записи, так и сообщения об исключениях с трассировками стека. Поскольку трассировка стека занимает несколько строк, при сборе основную запись лога и соответствующую ей трассировку стека необходимо объединять в одну запись.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### Шаг 2: Создание конфигурации OpenTelemetry {#step-2-write-the-opentelemetry-configuration}

Файл конфигурации сбора логов `opentelemetry_java_log.yml` состоит в основном из трёх частей:

| Раздел конфигурации | Назначение |
| --- | --- |
| `receivers` | Чтение исходных данных. |
| `processors` | Преобразование и пакетная обработка данных. |
| `exporters` | Вывод данных в Doris. |

```yaml
# 1. receivers are responsible for reading raw data.
# filelog is a local receiver that can read log files from the local file system.
# multiline appends lines that do not start with a timestamp to the previous line, used to merge stacktraces with the main log.
receivers:
  filelog:
    include:
      - /path/to/fe.log
    start_at: beginning
    multiline:
      line_start_pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}' # Match the timestamp as the start of a new log
    operators:
      - type: regex_parser
        regex: '^(?P<time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<severity>INFO|WARN|ERROR) (?P<message>.*)'
        timestamp:
          parse_from: attributes.time
          layout: '%Y-%m-%d %H:%M:%S,%f'
        severity:
          parse_from: attributes.severity
          trace: TRACE
          debug: DEBUG
          info: INFO
          warn: WARN
          error: ERROR
          fatal: FATAL

# 2. processors are responsible for data transformation.
# The batch processor accumulates data into batches before sending.
processors:
  batch:
    send_batch_size: 100000 # Number of data entries per batch. It is recommended that the batch data size be between 100M and 1G.
    timeout: 10s

# 3. exporters are responsible for outputting data.
# The doris exporter writes to Doris through the Stream Load HTTP interface.
# The default Stream Load data format is JSON. Stream Load parses JSON fields and writes them to the corresponding fields in the Doris table.
exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP address
    mysql_endpoint: localhost:9030 # FE MySQL address
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      logs: otel_logs
    create_schema: true # Whether to automatically create the schema. If set to false, the table must be created manually.
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load client timeout
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [batch]
      exporters: [doris]
```

### Шаг 3: Запуск OpenTelemetry Collector {#step-3-run-the-opentelemetry-collector}

```bash
./otelcol-contrib --config config/opentelemetry_java_log.yml
```

### Шаг 4: Просмотр результатов записи {#step-4-view-the-write-results}

Если `log_response` имеет значение `true`, в лог выводятся параметры запроса и результат ответа для каждой операции Stream Load:

```text
2025-08-18T00:33:22.543+0800    info    dorisexporter@v0.132.0/exporter_logs.go:181    log response:
{
    "TxnId": 52,
    "Label": "open_telemetry_otel_otel_logs_20250818003321_498bb8ec-040c-4982-9eb4-452b15129782",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 50355,
    "NumberLoadedRows": 50355,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 31130235,
    "LoadTimeMs": 680,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 106,
    "WriteDataTimeMs": 653,
    "ReceiveDataTimeMs": 11,
    "CommitAndPublishTimeMs": 23
}
```

По умолчанию информация о скорости записи выводится каждые 10 секунд и включает объём данных с момента запуска (MB и ROWS), общую скорость (MB/s и R/s) и скорость за последние 10 секунд:

```text
2025-08-18T00:05:00.017+0800    info    dorisexporter@v0.132.0/progress_reporter.go:63    [LOG] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## Сбор логов GitHub Events в формате JSON {#collect-github-events-json-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect structured logs with one JSON object per line -->

В этом сценарии на примере данных GitHub Events Archive показано, как собирать логи JSON и записывать их в Doris.

### Шаг 1: Подготовка данных JSON {#step-1-prepare-the-json-data}

GitHub Events Archive представляет собой архив событий действий пользователей GitHub в формате JSON, который можно скачать с сайта [https://www.gharchive.org/](https://www.gharchive.org/). В следующем примере скачиваются данные за 15:00 1 января 2024 года:

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

Ниже приведён пример записи данных. В исходных данных каждая строка содержит один объект JSON; здесь он отформатирован для удобства чтения.

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

### Шаг 2: Создание конфигурации OpenTelemetry {#step-2-write-the-opentelemetry-configuration-1}

В отличие от сбора логов TEXT, при сборе логов JSON используется `json_parser` в приёмнике `filelog`. `json_parser` разбирает каждую строку текста как JSON, а полученные поля используются при последующей обработке.

```yaml
receivers:
  filelog:
    include:
      - /path/to/2024-01-01-15.json
    start_at: beginning
    operators:
      - type: json_parser
        timestamp:
          parse_from: attributes.created_at
          layout: '%Y-%m-%dT%H:%M:%SZ'

processors:
  batch:
    send_batch_size: 100000 # Number of data entries per batch. It is recommended that the batch data size be between 100M and 1G.
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP address
    mysql_endpoint: localhost:9030 # FE MySQL address
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      logs: otel_logs
    create_schema: true # Whether to automatically create the schema. If set to false, the table must be created manually.
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load client timeout
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [batch]
      exporters: [doris]
```

### Шаг 3: Запуск OpenTelemetry Collector {#step-3-run-the-opentelemetry-collector-1}

```bash
./otelcol-contrib --config config/opentelemetry_json_log.yml
```

## Сбор данных трассировок приложений {#collect-application-trace-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use the OpenTelemetry Java Agent to collect application traces and write them into Doris -->

В этом сценарии показано, как получать данные трассировок, отправляемые приложением по протоколу OTLP, и записывать трассировки в Doris.

### Шаг 1: Создание конфигурации OpenTelemetry {#step-1-write-the-opentelemetry-configuration}

Создайте файл конфигурации `otel_trace.yaml`:

```yaml
receivers:
  otlp: # OTLP protocol, receives data sent by the OpenTelemetry Java Agent
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    send_batch_size: 100000 # Number of data entries per batch. It is recommended that the batch data size be between 100M and 1G.
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP address
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      traces: doris_table_name
    create_schema: true # Whether to automatically create the schema. If set to false, the table must be created manually.
    mysql_endpoint: localhost:9030 # FE MySQL address
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load client timeout
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [doris]
```

### Шаг 2: Запуск OpenTelemetry Collector {#step-2-run-the-opentelemetry-collector}

```bash
./otelcol-contrib --config otel_trace.yaml
```

### Шаг 3: Интеграция OpenTelemetry SDK в приложение {#step-3-integrate-the-opentelemetry-sdk-on-the-application-side}

В следующем примере для интеграции OpenTelemetry Java SDK используется демонстрационное приложение Spring Boot. Приложение взято из официального [примера](https://docs.spring.io/spring-boot/tutorial/first-application/index.html) и возвращает простую строку `Hello World!` при обращении по пути `/`.

Скачайте [OpenTelemetry Java Agent](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases). Преимущество Java Agent в том, что он не требует изменения существующего кода приложения. Для других языков и способов интеграции см. разделы [API и SDK для разных языков](https://opentelemetry.io/docs/languages/) и [Инструментирование без изменения кода](https://opentelemetry.io/docs/zero-code/) на официальном сайте OpenTelemetry.

Перед запуском приложения добавьте следующие переменные окружения:

```bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS} -javaagent:/your/path/to/opentelemetry-javaagent.jar" # Path to the OpenTelemetry Java Agent
export OTEL_JAVAAGENT_LOGGING="none" # Disable OTel logs to avoid interfering with the service's own logs
export OTEL_SERVICE_NAME="myproject"
export OTEL_TRACES_EXPORTER="otlp" # Use the OTLP protocol to send trace data
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317" # Address of the OpenTelemetry Collector

java -jar myproject-0.0.1-SNAPSHOT.jar
```
