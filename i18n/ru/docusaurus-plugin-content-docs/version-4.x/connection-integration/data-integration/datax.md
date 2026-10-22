---
{
    "title": "DataX Doriswriter",
    "language": "ru",
    "description": "Описывает использование DataX Doriswriter для синхронизации данных из таких источников, как MySQL, Oracle и SQL Server, с Apache Doris через Stream Load, включая настройку параметров и примеры импорта.",
    "keywords": [
        "DataX Doriswriter",
        "DataX import to Doris",
        "Stream Load",
        "MySQL sync to Doris"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data integration / Offline batch synchronization -->

Плагин Doriswriter для [DataX](https://github.com/alibaba/DataX) синхронизирует данные из различных источников, таких как MySQL, Oracle и SQL Server, с Doris через Stream Load.

Если вы уже используете DataX для офлайн-синхронизации данных или вам нужно записать в Doris данные из источника, поддерживаемого DataX, используйте Doriswriter в качестве плагина Writer для DataX. В этом документе последовательно описаны получение плагина, настройка параметров и запуск задания, а также особенности импорта в форматах JSON и CSV.

Использование DataX Doriswriter включает следующие основные шаги:

1. Получите установочный пакет DataX или скомпилируйте плагин Doriswriter самостоятельно.
2. Настройте параметры подключения, пакетной обработки и Stream Load, необходимые Doriswriter для записи в Doris.
3. Создайте сценарий задания DataX и запустите задание синхронизации.
4. Настройте `loadProps` в соответствии с форматом данных, чтобы избежать конфликтов разделителей.

## Проверка перед началом работы {#pre-flight-check}

| Пункт | Описание |
| --- | --- |
| Служба DataX | Doriswriter необходимо использовать вместе со службой DataX. |
| Поддержка источников | DataX поддерживает множество источников данных. Их список приведён в разделе [Поддерживаемые каналы данных DataX](https://github.com/alibaba/DataX#support-data-channels). |
| Точка входа для импорта в Doris | Doriswriter записывает данные в Doris через Stream Load. В `loadUrl` необходимо указать `http_port` узла FE. |

## Получение DataX и Doriswriter {#obtain-datax-and-doriswriter}

### Скачивание готового установочного пакета DataX {#download-the-datax-installation-package-directly}

DataX предоставляет готовый установочный пакет. Ссылка для скачивания приведена в разделе [Скачивание установочного пакета DataX](https://github.com/alibaba/DataX?tab=readme-ov-file#download-datax%E4%B8%8B%E8%BD%BD%E5%9C%B0%E5%9D%80).

### Самостоятельная компиляция плагина Doriswriter {#compile-the-doriswriter-plugin-yourself}

Чтобы скомпилировать плагин Doriswriter самостоятельно, сначала скачайте [исходный код плагина Doriswriter](https://github.com/apache/doris/tree/master/extension/DataX).

1. Запустите `init-env.sh`.
2. Скомпилируйте плагин `doriswriter` отдельно:

    ```shell
    mvn clean install -pl plugin-rdbms-util,doriswriter -DskipTests
    ```

Инструкции по компиляции всего проекта DataX приведены в разделе [Быстрый старт DataX](https://github.com/alibaba/DataX/blob/master/userGuid.md#quick-start).

#### Устранение ошибки зависимости `datax-all` {#resolve-the-datax-all-dependency-error}

Если при компиляции появляется следующая ошибка:

```text
Could not find artifact com.alibaba.datax:datax-all:pom:0.0.1-SNAPSHOT ...
```

Устраните её следующим образом:

1. Скачайте [alibaba-datax-maven-m2-20210928.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/alibaba-datax-maven-m2-20210928.tar.gz).
2. После распаковки скопируйте полученный каталог `alibaba/datax/` в каталог `.m2/repository/com/alibaba/`, используемый вашей локальной установкой Maven, и повторите компиляцию.

## Настройка параметров Doriswriter {#configure-doriswriter-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: DataX job configuration -->

Параметры Doriswriter управляют подключением к Doris, выбором целевой базы данных и таблицы, размером пакета, повторными попытками при сбоях и свойствами запросов Stream Load.

| Параметр | Обязательный | По умолчанию | Описание |
| --- | --- | --- | --- |
| `jdbcUrl` | Да | Нет | Строка подключения JDBC к Doris, используемая для выполнения `preSql` или `postSql`. |
| `loadUrl` | Да | Нет | Целевой адрес Stream Load в формате `ip:port`, где `ip` — IP-адрес узла FE, а `port` — значение `http_port` узла FE. Можно указать несколько адресов через запятую (`,`); doriswriter обращается к ним по алгоритму round-robin. |
| `username` | Да | Нет | Имя пользователя для доступа к базе данных Doris. |
| `password` | Нет | Пустое значение | Пароль для доступа к базе данных Doris. |
| `connection.selectedDatabase` | Да | Нет | Имя базы данных Doris для записи. |
| `connection.table` | Да | Нет | Имя таблицы Doris для записи. |
| `flushInterval` | Нет | `30000` мс | Интервал между пакетами записи данных. Слишком маленькое значение может привести к блокировке записи в Doris и возврату кода ошибки `-235`. При слишком маленьком значении импорт может запускаться до достижения порога по числу строк или объёму данных, даже если для `maxBatchRows` и `batchSize` заданы большие значения. |
| `column` | Да | Нет | Поля целевой таблицы, в которые записываются данные. Имена этих полей используются как имена полей в формируемых данных JSON. Разделяйте поля запятыми, например: `"column": ["id", "name", "age"]`. |
| `preSql` | Нет | Нет | Стандартный оператор SQL, выполняемый перед записью данных в целевую таблицу. |
| `postSql` | Нет | Нет | Стандартный оператор SQL, выполняемый после записи данных в целевую таблицу. |
| `maxBatchRows` | Нет | `500000` | Максимальное число строк в пакете импорта. Вместе с `batchSize` этот параметр определяет размер каждого пакета импорта; импорт начинается при достижении любого из порогов. |
| `batchSize` | Нет | `94371840` | Максимальный объём данных в пакете импорта. Вместе с `maxBatchRows` этот параметр определяет размер каждого пакета импорта; импорт начинается при достижении любого из порогов. |
| `maxRetries` | Нет | `3` | Число повторных попыток после сбоя импорта пакета. |
| `labelPrefix` | Нет | `datax_doris_writer_` | Префикс метки для каждого задания импорта. Итоговая метка имеет вид `labelPrefix + UUID`, что обеспечивает глобальную уникальность и предотвращает повторный импорт. |
| `loadProps` | Нет | Нет | Параметры запроса Stream Load. Позволяют настроить формат импортируемых данных, разделители и другие свойства. По умолчанию используется формат CSV; также поддерживается JSON. Дополнительные параметры описаны в [документации Stream Load](../../data-operate/import/import-way/stream-load-manual.md). |

## Примеры использования {#usage-examples}

### Сценарий 1: чтение данных из Stream и импорт в Doris {#scenario-1-read-data-from-a-stream-and-import-it-into-doris}

Инструкции по использованию плагина для чтения данных из Stream и импорта в Doris приведены в [официальном примере Doriswriter](https://github.com/apache/doris/blob/master/extension/DataX/doriswriter/doc/doriswriter.md).

### Сценарий 2: чтение данных из MySQL и импорт в Doris {#scenario-2-read-data-from-mysql-and-import-it-into-doris}

Следующий пример показывает, как с помощью DataX прочитать данные из MySQL и записать их в Doris через Doriswriter.

#### 1. Подготовьте исходную таблицу MySQL {#1-prepare-the-mysql-source-table}

```sql
CREATE TABLE `t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT '',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='';
```

#### 2. Подготовьте целевую таблицу Doris {#2-prepare-the-doris-target-table}

```sql
CREATE TABLE `ods_t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT ''
) ENGINE=OLAP
UNIQUE KEY(`id`, `order_code`)
DISTRIBUTED BY HASH(`order_code`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "in_memory" = "false",
    "storage_format" = "V2"
);
```

#### 3. Создайте сценарий задания DataX {#3-create-the-datax-job-script}

Создайте `my_import.json`. При использовании в своей среде замените исходную базу данных и таблицу в `reader`, а также целевую базу данных и таблицу Doris, имя пользователя и пароль в `writer` значениями, соответствующими вашей среде.

```json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader",
                    "parameter": {
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "connection": [
                            {
                                "jdbcUrl": ["jdbc:mysql://localhost:3306/demo"],
                                "table": ["employees_1"]
                            }
                        ],
                        "username": "root",
                        "password": "xxxxx",
                        "where": ""
                    }
                },
                "writer": {
                    "name": "doriswriter",
                    "parameter": {
                        "loadUrl": ["127.0.0.1:8030"],
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "username": "root",
                        "password": "xxxxxx",
                        "postSql": ["select count(1) from all_employees_info"],
                        "preSql": [],
                        "flushInterval": 30000,
                        "connection": [
                            {
                                "jdbcUrl": "jdbc:mysql://127.0.0.1:9030/demo",
                                "selectedDatabase": "demo",
                                "table": ["all_employees_info"]
                            }
                        ],
                        "loadProps": {
                            "format": "json",
                            "strip_outer_array": "true",
                            "line_delimiter": "\\x02"
                        }
                    }
                }
            }
        ],
        "setting": {
            "speed": {
                "channel": "1"
            }
        }
    }
}
```

#### 4. Настройте формат импортируемых данных {#4-configure-the-import-data-format}

В приведённом выше примере данные импортируются в формате JSON:

```json
"loadProps": {
    "format": "json",
    "strip_outer_array": "true",
    "line_delimiter": "\\x02"
}
```

Примечания для формата JSON:

1. По умолчанию `line_delimiter` — символ новой строки, который может конфликтовать со значениями в данных. Используйте специальный или невидимый символ, чтобы избежать ошибок импорта.
2. `strip_outer_array` указывает, что один пакет импортируемых данных содержит несколько строк. При разборе Doris разворачивает внешний массив и обрабатывает каждый Object внутри него как отдельную строку.
3. Дополнительные параметры Stream Load описаны в [документации Stream Load](../../data-operate/import/import-way/stream-load-manual.md).

Для использования формата CSV задайте следующую конфигурацию:

```json
"loadProps": {
    "format": "csv",
    "column_separator": "\\x01",
    "line_delimiter": "\\x02"
}
```

При использовании формата CSV уделяйте особое внимание разделителям строк и столбцов, чтобы избежать конфликтов со специальными символами в данных. Рекомендуется использовать невидимые символы. По умолчанию разделитель столбцов — `\t`, а разделитель строк — `\n`.

#### 5. Запустите задание DataX {#5-run-the-datax-job}

Запустите задание следующей командой. Другие способы запуска заданий описаны в [руководстве пользователя DataX](https://github.com/alibaba/DataX/blob/master/userGuid.md).

```shell
python bin/datax.py my_import.json
```

После успешного выполнения вы увидите журнал примерно следующего содержания:

```text
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - jobContainer starts to do prepare ...
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do prepare work .
2022-11-16 14:28:54.013 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do prepare work .
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - jobContainer starts to do split ...
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - Job set Channel-Number to 1 channels.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] splits to [1] tasks.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] splits to [1] tasks.
2022-11-16 14:28:54.033 [job-0] INFO  JobContainer - jobContainer starts to do schedule ...
2022-11-16 14:28:54.036 [job-0] INFO  JobContainer - Scheduler starts [1] taskGroups.
2022-11-16 14:28:54.037 [job-0] INFO  JobContainer - Running by standalone Mode.
2022-11-16 14:28:54.041 [taskGroup-0] INFO  TaskGroupContainer - taskGroupId=[0] start [1] channels for [1] tasks.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set byte_speed_limit to -1, No bps activated.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set record_speed_limit to -1, No tps activated.
2022-11-16 14:28:54.049 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] attemptCount[1] is started
2022-11-16 14:28:54.052 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Begin to read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
Wed Nov 16 14:28:54 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:28:54.071 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Finished read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Start to join batch data: rows[2] bytes[438] label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Executing stream load to: 'http://127.0.0.1:8030/api/demo/dwd_universal_tb_task/_stream_load', size: '441'
2022-11-16 14:28:54.224 [Thread-1] INFO  DorisStreamLoadObserver - StreamLoad response :{"Status":"Success","BeginTxnTimeMs":0,"Message":"OK","NumberUnselectedRows":0,"CommitAndPublishTimeMs":17,"Label":"datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f","LoadBytes":441,"StreamLoadPutTimeMs":1,"NumberTotalRows":2,"WriteDataTimeMs":11,"TxnId":217056,"LoadTimeMs":31,"TwoPhaseCommit":"false","ReadDataTimeMs":0,"NumberLoadedRows":2,"NumberFilteredRows":0}
2022-11-16 14:28:54.225 [Thread-1] INFO  DorisWriterManager - Async stream load finished: label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.249 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] is successed, used[201]ms
2022-11-16 14:28:54.250 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] completed it's tasks.
2022-11-16 14:29:04.048 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.049 [job-0] INFO  AbstractScheduler - Scheduler accomplished all tasks.
2022-11-16 14:29:04.049 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do post work.
Wed Nov 16 14:29:04 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:29:04.187 [job-0] INFO  DorisWriter$Job - Start to execute preSqls:[select count(1) from dwd_universal_tb_task]. context info:jdbc:mysql://172.16.0.13:9030/demo.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do post work.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX jobId [0] completed successfully.
2022-11-16 14:29:04.204 [job-0] INFO  HookInvoker - No hook invoked, because base dir not exists or is a file: /data/datax/hook
2022-11-16 14:29:04.205 [job-0] INFO  JobContainer -
         [total cpu info] =>
                averageCpu                     | maxDeltaCpu                    | minDeltaCpu
                -1.00%                         | -1.00%                         | -1.00%


         [total gc info] =>
                 NAME                 | totalGCCount       | maxDeltaGCCount    | minDeltaGCCount    | totalGCTime        | maxDeltaGCTime     | minDeltaGCTime
                 PS MarkSweep         | 1                  | 1                  | 1                  | 0.017s             | 0.017s             | 0.017s
                 PS Scavenge          | 1                  | 1                  | 1                  | 0.007s             | 0.007s

2022-11-16 14:29:04.205 [job-0] INFO  JobContainer - PerfTrace not enable!
2022-11-16 14:29:04.206 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.206 [job-0] INFO  JobContainer -
Job start time                  : 2022-11-16 14:28:53
Job end time                    : 2022-11-16 14:29:04
Total job duration              :                 10s
Average job throughput          :               21B/s
Record write speed              :              0rec/s
Total records read              :                   2
Total read/write failures       :                   0
```

## Особенности импорта и рекомендации {#import-considerations-and-best-practices}

- Не задавайте слишком маленькое значение `flushInterval`. Это может привести к блокировке записи в Doris и возврату кода ошибки `-235`, а также к запуску импорта до достижения порога `maxBatchRows` или `batchSize`.
- При использовании формата CSV тщательно проверяйте, не конфликтуют ли `column_separator` и `line_delimiter` со значениями в данных. Используйте невидимые символы, чтобы снизить вероятность конфликтов.
- При использовании формата JSON, если пакет представляет собой массив, задайте `strip_outer_array = true`, чтобы Doris обрабатывал каждый Object в массиве как строку.
- `labelPrefix` в сочетании с UUID образует глобально уникальную метку, которая предотвращает повторный импорт.
- `loadUrl` может содержать несколько адресов FE, разделённых запятыми; doriswriter обращается к ним по алгоритму round-robin.

## Часто задаваемые вопросы {#faq}

### DataX Doriswriter поддерживает синхронизацию только данных MySQL? {#can-datax-doriswriter-only-synchronize-mysql-data}

Нет. DataX поддерживает множество источников данных. В полном примере из этого документа используется MySQL, но данные из других источников, поддерживаемых DataX, также можно записывать в Doris через Doriswriter.

### Какой порт следует использовать в `loadUrl`? {#which-port-should-loadurl-use}

В `loadUrl` используется `http_port` узла FE в формате `ip:port`. Если указано несколько адресов, doriswriter обращается к ним по алгоритму round-robin.

### Почему при импорте в формате JSON или CSV нужно обращать внимание на разделители? {#why-pay-attention-to-delimiters-when-importing-in-json-or-csv-format}

`line_delimiter` или `column_separator` могут конфликтовать с символами в данных и вызывать ошибки импорта. Используйте специальные или невидимые символы в качестве разделителей, чтобы снизить вероятность конфликтов.
