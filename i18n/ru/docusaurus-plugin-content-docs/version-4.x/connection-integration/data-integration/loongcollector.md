---
{
    "title": "LoongCollector",
    "language": "ru",
    "description": "Используйте LoongCollector Doris Flusher для записи логов TEXT или JSON в Apache Doris в реальном времени через Stream Load с поддержкой многострочных логов, повторных попыток при сбоях и параллельной загрузки данных.",
    "keywords": [
        "LoongCollector",
        "iLogtail",
        "Doris Flusher",
        "Doris Stream Load",
        "сбор логов",
        "запись логов в Doris"
    ]
}
---

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenario: Use LoongCollector to write logs into Apache Doris in real time -->

[LoongCollector (iLogtail)](https://github.com/alibaba/loongcollector) — высокопроизводительный фреймворк с открытым исходным кодом для сбора и обработки логов, разработанный в Alibaba Cloud. До версии 3.0 он назывался Logtail/iLogtail. Он поддерживает запись данных в системы хранения с помощью пользовательских плагинов вывода. LoongCollector Doris Flusher — плагин вывода для записи в Apache Doris, который подходит для загрузки логов TEXT или JSON в Doris в реальном времени с целью поиска и анализа логов.

Doris Flusher вызывает HTTP-интерфейс [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) для записи данных в реальном времени и предоставляет следующие возможности:

- Многопоточная параллельная запись.
- Повторные попытки при сбоях запросов Doris Stream Load.
- Настраиваемые форматы и параметры Stream Load.
- Вывод статистики скорости записи.

## Сценарии использования и порядок работы {#use-cases-and-workflow}

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Choose a LoongCollector-based log collection method for writing into Doris -->

Выберите подходящий пример в зависимости от формата логов:

| Сценарий использования | Подходящие данные | Рекомендуемый раздел |
| --- | --- | --- |
| Сбор логов Doris FE в формате TEXT, содержащих `stacktrace` | Логи TEXT, в которых одна запись приложения может занимать несколько строк | [Сбор логов Doris FE в формате TEXT](#collect-doris-fe-text-logs) |
| Сбор логов событий с одним объектом JSON на строку | Логи JSON, в которых каждую строку можно сразу разобрать на поля | [Сбор логов JSON с одной записью на строку](#collect-json-line-logs) |

Полный порядок работы с LoongCollector Doris Flusher:

1. Установите LoongCollector.
2. Создайте целевую базу данных и таблицу в Doris.
3. Настройте в LoongCollector параметры ввода, преобразования и вывода в Doris.
4. Запустите LoongCollector для записи логов в Doris в реальном времени.

## Установка LoongCollector {#install-loongcollector}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the LoongCollector runtime environment -->

Вы можете скачать готовый установочный пакет или собрать LoongCollector из исходного кода.

### Скачивание с официального сайта {#download-from-the-official-site}

Скачайте готовый установочный пакет:

```bash
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/loongcollector-linux-amd64.tar.gz
```

### Сборка из исходного кода {#build-from-source}

Клонируйте репозиторий LoongCollector и выполните сборку:

```shell
# Clone the repository
git clone https://github.com/alibaba/loongcollector.git
cd loongcollector
git submodule update --init

# Build LoongCollector
make all
cd output
```

## Настройка параметров вывода в Doris {#configure-doris-output-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the LoongCollector Doris Flusher to write into Doris -->

Плагин LoongCollector Doris Flusher поддерживает следующие параметры конфигурации:

| Параметр конфигурации | Описание |
| --- | --- |
| `Addresses` | HTTP-адреса Stream Load в виде массива строк, содержащего один или несколько элементов. Каждый элемент имеет формат `host:port`, например `["http://fe1:8030", "http://fe2:8030"]`. |
| `Database` | Имя базы данных Doris для записи. |
| `Table` | Имя таблицы Doris для записи. |
| `Authentication.PlainText.Username` | Имя пользователя Doris. У этого пользователя должны быть права на загрузку данных в соответствующую базу данных и таблицу Doris. |
| `Authentication.PlainText.Password` | Пароль пользователя Doris. |
| `LoadProperties` | Параметры заголовков Doris Stream Load. Задаются в виде отображения, например `LoadProperties: {"format": "json", "read_json_by_line": "true"}`. |
| `LogProgressInterval` | Интервал в секундах, с которым скорость записи выводится в лог. Значение по умолчанию — `10`; установите `0`, чтобы отключить этот вывод. |
| `GroupCommit` | Режим group commit. Допустимые значения: `sync`, `async` или `off`. Значение по умолчанию — `off`. |
| `Concurrency` | Количество goroutines, отправляющих данные параллельно. Значение по умолчанию — `1` (синхронный режим). |
| `QueueCapacity` | Вместимость очереди задач в асинхронном режиме. Значение по умолчанию — `1024`. |
| `Convert.Protocol` | Протокол преобразования данных. Значение по умолчанию — `custom_single`. |
| `Convert.Encoding` | Кодировка преобразования данных. Значение по умолчанию — `json`. |
| `Convert.TagFieldsRename` | Переименование одного или нескольких полей из тегов. |
| `Convert.ProtocolFieldsRename` | Переименование полей протокола. Допустимые значения полей протокола: `contents`, `tags` и `time`. |

## Сбор логов Doris FE в формате TEXT {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect multi-line Java TEXT logs and write them into Doris -->

В этом сценарии на примере логов Doris FE показан сбор логов TEXT. Для многострочных логов исключений, содержащих `stacktrace`, сначала необходимо объединить основную запись лога и `stacktrace` в одну запись, затем разобрать поля и записать их в Doris.

### 1. Подготовка примера лога {#1-prepare-a-log-sample}

Файлы логов FE обычно находятся в `fe/log/fe.log` внутри каталога установки Doris. Логи FE — типичные логи Java-приложения, содержащие такие поля, как временная метка, уровень логирования, имя потока, место в коде и содержимое лога. В логах встречаются как обычные записи, так и записи об исключениях со `stacktrace`. Поскольку `stacktrace` занимает несколько строк, при сборе и сохранении основную запись лога и `stacktrace` необходимо объединять в одну запись.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. Создание таблицы Doris {#2-create-the-doris-table}

Целевая таблица содержит такие поля, как время создания записи лога, время сбора, имя хоста, путь к файлу лога, тип лога, уровень логирования, имя потока, место в коде и содержимое лога.

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

### 3. Настройка LoongCollector {#3-configure-loongcollector}

Файл конфигурации LoongCollector состоит из трёх основных частей:

1. `inputs`: чтение исходных данных.
2. `processors`: преобразование и разбор содержимого логов.
3. `flushers`: вывод данных в Doris.

Поместите файл конфигурации в каталог `conf/continuous_pipeline_config/local/`, например создав файл `loongcollector_doris_log.yaml`:

```yaml
enable: true

inputs:
  # 1. inputs are responsible for reading raw data
  # input_file is an input plugin where you can configure the log file path to read
  # The multiline configuration appends lines that do not start with a timestamp to the previous line, so the stacktrace is merged with the main log
  - Type: input_file
    FilePaths:
      - /path/fe.log
    Multiline:
      Mode: custom
      StartPattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'

processors:
  # 2. processors are responsible for data transformation
  # processor_regex is a commonly used data transformation plugin that extracts fields with regular expressions
  - Type: processor_regex
    SourceKey: content
    Regex: '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) ([A-Z]+) \(([^\)]*)\) \[([^\]]*)\] (.*)'
    Keys:
      - log_time
      - level
      - thread
      - position
      - message
  # Add extra fields
  - Type: processor_add_fields
    Fields:
      type: fe.log
    IgnoreIfExist: false

flushers:
  # 3. flushers are responsible for data output
  # flusher_doris outputs data to Doris through the Stream Load HTTP interface
  # The LoadProperties parameter sets the Stream Load data format to JSON
  - Type: flusher_doris
    Addresses:
      - "http://fe_ip:http_port"
    Database: log_db
    Table: doris_log
    Authentication:
      PlainText:
        Username: root
        Password: ""
    LoadProperties:
      format: json
      read_json_by_line: "true"
      load_to_single_tablet: "true"
      columns: "log_time,collect_time,host,path,type,level,thread,position,message,log_time=replace(log_time,',','.'),collect_time=from_unixtime(collect_time)"
    Convert:
      Protocol: custom_single_flatten
      Encoding: json
      TagFieldsRename:
        host.ip: host
        log.file.path: path
      ProtocolFieldsRename:
        time: collect_time
    LogProgressInterval: 10
```

### 4. Запуск LoongCollector {#4-start-loongcollector}

Запустите LoongCollector:

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```

По умолчанию скорость записи выводится в лог каждые 10 секунд. Запись включает объём данных с момента запуска (в MB и ROWS), общую скорость (в MB/s и R/s) и скорость за последние 10 секунд. Пример строки лога:

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## Сбор логов JSON с одной записью на строку {#collect-json-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect single-line JSON event logs and write them into Doris -->

В этом сценарии на примере данных из GitHub Events Archive показан сбор логов событий с одним объектом JSON на строку.

### 1. Подготовка данных JSON {#1-prepare-json-data}

[GitHub Events Archive](https://www.gharchive.org/) содержит архивные данные о действиях пользователей GitHub в формате JSON. Вы можете скачать данные за 15:00 1 января 2024 года. Путь к файлу в приведённом ниже примере конфигурации должен указывать на распакованный файл JSON:

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

В исходных данных каждая строка содержит один объект JSON. Пример ниже отформатирован для удобства чтения:

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

### 2. Создание таблицы Doris {#2-create-the-doris-table-1}

Создайте целевую базу данных и таблицу для хранения логов событий GitHub.

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

### 3. Настройка LoongCollector {#3-configure-loongcollector-1}

Основные отличия этой конфигурации от примера сбора логов TEXT:

1. `input_file` использует режим разбора JSON, поэтому LoongCollector разбирает каждую строку текста как JSON.
2. Данные JSON уже содержат структурированные поля, поэтому сложный плагин обработки не требуется.

Поместите файл конфигурации в каталог `conf/continuous_pipeline_config/local/`, например создав файл `loongcollector_doris_log.yaml`:

```yaml
enable: true

inputs:
  # input_file reads JSON-format log files
  - Type: input_file
    FilePaths:
      - /path/2024-01-01-15.json

processors:
  # Parse content and expand only the first level (actor and repo remain as JSON strings for the VARIANT type)
  - Type: processor_json
    SourceKey: content
    KeepSource: false
    ExpandDepth: 1
    ExpandConnector: ""

flushers:
  # flusher_doris outputs data to Doris
  - Type: flusher_doris
    Addresses:
      - "http://fe_ip:http_port"
    Database: log_db
    Table: github_events
    Authentication:
      PlainText:
        Username: root
        Password: ""
    LoadProperties:
      format: json
      read_json_by_line: "true"
      load_to_single_tablet: "true"
    Convert:
      Protocol: custom_single_flatten
      Encoding: json
    LogProgressInterval: 10
    Concurrency: 3
```

### 4. Запуск LoongCollector {#4-start-loongcollector-1}

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```
