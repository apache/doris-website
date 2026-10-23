---
{
    "title": "Logstash",
    "language": "ru",
    "description": "Используйте плагин вывода Logstash для Doris, чтобы собирать логи в формате TEXT или JSON и записывать их в Apache Doris в реальном времени через Stream Load для ETL-обработки, поиска и анализа логов.",
    "keywords": [
        "Logstash",
        "плагин вывода Logstash для Doris",
        "Doris Stream Load",
        "сбор логов",
        "ETL-обработка логов"
    ]
}
---

# Плагин вывода Logstash для Doris {#logstash-doris-output-plugin}

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenario: Use Logstash to collect, preprocess, and write logs to Doris in real time -->

Logstash — это фреймворк ETL для логов, который собирает данные, выполняет их предварительную обработку и отправляет в системы хранения. Плагин вывода Logstash для Doris позволяет Logstash записывать данные в Apache Doris. Он подходит для загрузки логов в формате TEXT или JSON в Doris в реальном времени для последующего поиска и анализа.

Плагин использует HTTP-интерфейс [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) для записи данных в реальном времени и поддерживает многопоточную обработку, повторные попытки при сбоях, настройку форматов и параметров Stream Load, а также запись сведений о скорости загрузки в лог.

## Сценарии использования и порядок работы {#use-cases-and-workflow}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choose Logstash as the log collection method for writing to Doris -->

Выберите подходящий пример в зависимости от формата логов:

| Сценарий использования | Подходящие данные | Рекомендуемый раздел |
| --- | --- | --- |
| Сбор обычных текстовых логов и обработка многострочных записей, например трассировок стека Java | Логи TEXT, в которых одна запись приложения может занимать несколько строк | [Сбор многострочных логов TEXT](#collect-text-multi-line-logs) |
| Сбор структурированных логов с одним объектом JSON в каждой строке | Построчные логи JSON, в которых каждую строку можно сразу разобрать на поля | [Сбор построчных логов JSON](#collect-json-line-logs) |

Полный порядок работы с плагином вывода Logstash для Doris:

1. Получите и установите плагин вывода Logstash для Doris.
2. Создайте целевую базу данных и таблицу в Doris.
3. Настройте параметры ввода, преобразования и вывода в Doris для Logstash.
4. Запустите Logstash для записи логов в Doris в реальном времени.
5. Отслеживайте результаты загрузки по ответам Stream Load и сведениям о скорости записи в логах.

## Установка плагина {#install-the-plugin}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Deploy the Logstash Doris output plugin -->

### Получение плагина {#obtain-the-plugin}

Плагин вывода Logstash для Doris можно получить, скачав установочный пакет или собрав его из исходного кода.

| Способ | Когда подходит | Действие |
| --- | --- | --- |
| Скачивание с официального сайта | Нужно получить готовый установочный пакет с зависимостями | Скачайте `logstash-output-doris-1.2.0-java.gem` |
| Сборка из исходного кода | У вас уже есть исходный код плагина и нужно самостоятельно собрать пакет | Выполните `gem build` в каталоге `extension/logstash/` |

Скачивание с официального сайта:

```shell
# Installation package that includes dependencies
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/logstash-output-doris-1.2.0-java.gem
```

Сборка из исходного кода:

```shell
cd extension/logstash/
gem build logstash-output-doris.gemspec
```

### Стандартная установка {#standard-installation}

`${LOGSTASH_HOME}` — каталог установки Logstash. Выполните команду `${LOGSTASH_HOME}/bin/logstash-plugin` для установки плагина, заменив `<plugin_file>.gem` фактическим именем файла пакета плагина:

```shell
${LOGSTASH_HOME}/bin/logstash-plugin install <plugin_file>.gem
```

После успешной установки Logstash выводит примерно следующий результат:

```text
Validating logstash-output-doris-1.2.0.gem
Installing logstash-output-doris
Installation successful
```

При стандартной установке автоматически устанавливаются модули Ruby, от которых зависит плагин. Если сеть недоступна, установка может зависнуть или не завершиться. В этом случае можно скачать установочный пакет с зависимостями и выполнить автономную установку.

### Автономная установка {#offline-installation}

Для автономной установки сначала отключите обработку зависимостей JAR, а затем используйте установочный пакет плагина из локальной файловой системы. При использовании локального пути укажите расположение пакета через `file://`, как того требует Logstash:

```shell
export JARS_SKIP="true"
${LOGSTASH_HOME}/bin/logstash-plugin install file:///path/to/<plugin_file>.gem
```

## Параметры конфигурации {#configuration-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the Logstash Doris output plugin to write to Doris -->

Плагин вывода Logstash для Doris поддерживает следующие параметры конфигурации:

| Параметр | Описание |
| --- | --- |
| `http_hosts` | HTTP-адрес Stream Load. Задаётся массивом строк, содержащим один или несколько элементов. Каждый элемент имеет вид `host:port`, например `["http://fe1:8030", "http://fe2:8030"]`. |
| `user` | Имя пользователя Doris. У этого пользователя должны быть права на загрузку данных в целевую базу данных и таблицу Doris. |
| `password` | Пароль пользователя Doris. |
| `db` | База данных Doris для записи. |
| `table` | Таблица Doris для записи. |
| `label_prefix` | Префикс Label для Doris Stream Load. Итоговый Label имеет вид `<label_prefix>_<db>_<table>_<yyyymmdd_hhmmss>_<uuid>`. Значение по умолчанию — `logstash`. |
| `headers` | Параметр заголовков Doris Stream Load. Используется синтаксис ассоциативного массива Ruby, например `headers => { "format" => "json" "read_json_by_line" => "true" }`. |
| `mapping` | Сопоставление полей Logstash с полями таблицы Doris. Примеры использования приведены ниже. |
| `message_only` | Особый вариант `mapping`, при котором в Doris выводится только поле Logstash `@message`. Значение по умолчанию — `false`. |
| `max_retries` | Число повторных попыток после сбоя запроса Doris Stream Load. Значение по умолчанию — `-1`, то есть неограниченное число повторных попыток для обеспечения надёжности данных. |
| `log_request` | Выводить ли в лог метаданные запросов и ответов Doris Stream Load для диагностики. Значение по умолчанию — `false`. |
| `log_speed_interval` | Интервал вывода скорости записи в лог, в секундах. Значение по умолчанию — `10`. Установите `0`, чтобы отключить вывод скорости в лог. |

## Сбор многострочных логов TEXT {#collect-text-multi-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use Logstash to collect Java TEXT logs and write them to Doris -->

В этом примере на основе логов FE Doris показано, как собирать логи TEXT и записывать их в Doris.

### Описание сценария {#scenario-description}

Файл логов FE обычно находится по пути `fe/log/fe.log` в каталоге установки Doris. Такие логи приложений Java содержат поля с отметкой времени, уровнем логирования, именем потока, местом в коде и текстом сообщения.

Логи FE включают как однострочные записи, так и записи об исключениях с трассировками стека. Поскольку трассировка стека занимает несколько строк, при сборе необходимо объединять основную запись и трассировку стека в одну запись лога.

Пример лога:

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### Создание таблицы в Doris {#create-the-table-in-doris}

Целевая таблица содержит поля с временем создания записи лога, временем сбора, именем хоста, путём к файлу лога, типом лога, уровнем логирования, именем потока, местом в коде и текстом сообщения:

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

### Настройка Logstash {#configure-logstash}

Logstash использует два основных типа файлов конфигурации:

| Файл конфигурации | Назначение |
| --- | --- |
| `config/logstash.yml` | Глобальный файл конфигурации Logstash. В нём можно настроить размер пакета и задержку пакетной обработки для повышения производительности записи в Doris. |
| `logstash_doris_log.conf` | Файл конфигурации отдельной задачи сбора логов. Обычно содержит три раздела: `input`, `filter` и `output`. |

Для логов со средним размером записи в несколько сотен байтов задайте размер пакета 1,000,000 строк и задержку пакетной обработки 10 с. Эти параметры можно настроить в `config/logstash.yml`:

```yaml
pipeline.batch.size: 1000000
pipeline.batch.delay: 10000
```

`logstash_doris_log.conf` содержит следующие три раздела:

| Раздел | Назначение | Основные настройки в этом примере |
| --- | --- | --- |
| `input` | Чтение исходных данных. | Использует источник `file` для чтения логов FE и кодек `multiline`, чтобы присоединять строки, которые не начинаются с отметки времени, к предыдущей строке. |
| `filter` | Преобразование данных. | Использует `grok` для извлечения `log_time`, `level`, `thread` и `position` из поля `message`. |
| `output` | Вывод в Doris. | Использует плагин вывода `doris` для записи в Doris через Stream Load и сопоставляет поля с помощью `mapping`. |

Пример конфигурации:

```text
# 1. input: read FE logs and merge stacktraces using the multiline codec
input {
    file {
        path => "/mnt/disk2/xiaokang/opt/doris_master/fe/log/fe.log"
        add_field => {"type" => "fe.log"}
        codec => multiline {
            # valid line starts with timestamp
            pattern => "^%{TIMESTAMP_ISO8601} "
            # any line not starting with a timestamp should be merged with the previous line
            negate => true
            what => "previous"
        }
    }
}

# 2. filter: extract log fields from the message using grok
filter {
    grok {
        match => {
            # parse log_time, level, thread, position fields from message
            "message" => "%{TIMESTAMP_ISO8601:log_time} (?<level>[A-Z]+) \((?<thread>[^\[]*)\) \[(?<position>[^\]]*)\]"
        }
    }
}

# 3. output: write to Doris through Doris Stream Load
output {
    doris {
        http_hosts => ["http://localhost:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "doris_log"
        headers => {
            "format" => "json"
            "read_json_by_line" => "true"
            "load_to_single_tablet" => "true"
        }
        mapping => {
            "log_time" => "%{log_time}"
            "collect_time" => "%{@timestamp}"
            "host" => "%{[host][name]}"
            "path" => "%{[log][file][path]}"
            "type" => "%{type}"
            "level" => "%{level}"
            "thread" => "%{thread}"
            "position" => "%{position}"
            "message" => "%{message}"
        }
        log_request => true
    }
}
```

В конфигурации `output` параметр `headers` задаёт формат данных JSON для Stream Load, а `mapping` определяет сопоставление полей Logstash с полями JSON. Поскольку в `headers` задано `"format" => "json"`, Stream Load автоматически разбирает поля JSON и записывает их в соответствующие поля таблицы Doris.

### Запуск Logstash {#run-logstash}

Для запуска Logstash выполните следующую команду:

```shell
${LOGSTASH_HOME}/bin/logstash -f config/logstash_doris_log.conf
```

Если параметр `log_request` равен `true`, в лог выводятся параметры запроса и результат ответа для каждой операции Stream Load. Пример ответа:

```json
{
    "TxnId": 45464,
    "Label": "logstash_log_db_doris_log_20240708_223532_539_6c20a0d1-dcab-4b8e-9bc0-76b46a929bd1",
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

По умолчанию каждые 10 с Logstash выводит в лог сведения о скорости записи, включая суммарный объём данных с момента запуска (MB и ROWS), общую скорость (MB/s и R/s) и скорость за последние 10 с:

```text
[2024-07-08T22:35:38,285][INFO ][logstash.outputs.doris   ][main] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## Сбор построчных логов JSON {#collect-json-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use Logstash to collect JSON line logs and write them to Doris -->

В этом примере на основе данных GitHub Events Archive показано, как собирать построчные логи JSON и записывать их в Doris.

### Описание сценария {#scenario-description-1}

GitHub Events Archive — это архив событий активности пользователей GitHub. Данные представлены в формате JSON, их можно скачать с <https://www.gharchive.org/>. Каждое событие занимает одну строку, поэтому данные удобно разбирать с помощью кодека Logstash `json`.

Скачайте данные за 23:00 1 апреля 2024 года и распакуйте их в файл `.json`, который сможет прочитать Logstash:

```shell
mkdir -p /tmp/github_events
cd /tmp/github_events
wget https://data.gharchive.org/2024-04-01-23.json.gz
gunzip 2024-04-01-23.json.gz
```

Ниже приведён пример данных. В исходном файле каждая запись занимает одну строку; здесь данные отформатированы для удобства чтения:

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

### Создание таблицы в Doris {#create-the-table-in-doris-1}

Создайте таблицу `github_events` для хранения полей событий GitHub, хоста, на котором выполняется сбор, и пути к файлу:

```sql
CREATE DATABASE log_db;
USE log_db;

CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id` BIGINT,
    `type` TEXT,
    `public` BOOLEAN,
    `actor.id` BIGINT,
    `actor.login` TEXT,
    `actor.display_login` TEXT,
    `actor.gravatar_id` TEXT,
    `actor.url` TEXT,
    `actor.avatar_url` TEXT,
    `repo.id` BIGINT,
    `repo.name` TEXT,
    `repo.url` TEXT,
    `payload` TEXT,
    `host` TEXT,
    `path` TEXT,
    INDEX `idx_id` (`id`) USING INVERTED,
    INDEX `idx_type` (`type`) USING INVERTED,
    INDEX `idx_actor.id` (`actor.id`) USING INVERTED,
    INDEX `idx_actor.login` (`actor.login`) USING INVERTED,
    INDEX `idx_repo.id` (`repo.id`) USING INVERTED,
    INDEX `idx_repo.name` (`repo.name`) USING INVERTED,
    INDEX `idx_host` (`host`) USING INVERTED,
    INDEX `idx_path` (`path`) USING INVERTED,
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

### Настройка Logstash {#configure-logstash-1}

Конфигурация для построчных логов JSON отличается от конфигурации для многострочных логов TEXT в двух основных аспектах:

1. Параметр `codec` источника `file` имеет значение `json`. Logstash разбирает каждую строку текста как JSON, а полученные поля используются при последующей обработке.
2. Плагин `filter` не требуется, поскольку данные JSON уже можно напрямую разобрать на поля.

Пример конфигурации:

```text
input {
    file {
        path => "/tmp/github_events/2024-04-01-23.json"
        codec => json
    }
}

output {
    doris {
        http_hosts => ["http://fe1:8630", "http://fe2:8630", "http://fe3:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "github_events"
        headers => {
            "format" => "json"
            "read_json_by_line" => "true"
            "load_to_single_tablet" => "true"
        }
        mapping => {
            "created_at" => "%{created_at}"
            "id" => "%{id}"
            "type" => "%{type}"
            "public" => "%{public}"
            "actor.id" => "%{[actor][id]}"
            "actor.login" => "%{[actor][login]}"
            "actor.display_login" => "%{[actor][display_login]}"
            "actor.gravatar_id" => "%{[actor][gravatar_id]}"
            "actor.url" => "%{[actor][url]}"
            "actor.avatar_url" => "%{[actor][avatar_url]}"
            "repo.id" => "%{[repo][id]}"
            "repo.name" => "%{[repo][name]}"
            "repo.url" => "%{[repo][url]}"
            "payload" => "%{[payload]}"
            "host" => "%{[host][name]}"
            "path" => "%{[log][file][path]}"
        }
        log_request => true
    }
}
```

### Запуск Logstash {#run-logstash-1}

Для запуска Logstash выполните следующую команду:

```shell
${LOGSTASH_HOME}/bin/logstash -f logstash_github_events.conf
```

## Распространённые проблемы и их устранение {#common-issues-and-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Check the installation, import, and runtime status of Logstash writing to Doris -->

| Проблема | Решение |
| --- | --- |
| Стандартная установка зависает из-за сетевого сбоя | Используйте установочный пакет с зависимостями для автономной установки и укажите путь в локальной файловой системе через `file://`. |
| Нужно просматривать каждый запрос записи в Doris и соответствующий ответ | Задайте `log_request => true` в плагине вывода `doris`. После этого в лог будут выводиться параметры запросов Stream Load и результаты ответов. |
| Нужно отслеживать скорость записи | Используйте значение `log_speed_interval` по умолчанию. Logstash выводит суммарный объём данных, общую скорость и скорость за последние 10 с каждые 10 с. |
| Нужно отключить вывод скорости записи в лог | Установите `log_speed_interval` в `0`. |
| Трассировки стека в логах TEXT разбиваются на несколько записей | Используйте кодек `multiline` в источнике `file`, чтобы присоединять строки, которые не начинаются с отметки времени, к предыдущей строке. |
