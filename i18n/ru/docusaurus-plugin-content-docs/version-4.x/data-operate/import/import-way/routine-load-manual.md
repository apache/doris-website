---
{
    "title": "Routine Load",
    "language": "ru",
    "description": "Apache Doris Routine Load непрерывно получает данные из Kafka: форматы CSV/JSON, семантика Exactly-Once, аутентификация SSL/Kerberos, управление жизненным циклом заданий и устранение неполадок.",
    "keywords": [
        "Routine Load",
        "импорт из Kafka в реальном времени",
        "потоковый импорт в Doris",
        "непрерывный импорт",
        "Exactly-Once",
        "Kafka SSL",
        "Kafka Kerberos",
        "Kafka SASL",
        "SASL_PLAINTEXT",
        "SASL_SSL",
        "импорт JSON",
        "импорт CSV",
        "импорт с динамическим выбором таблицы",
        "один поток в несколько таблиц",
        "гибкое частичное обновление столбцов",
        "UPDATE_FLEXIBLE_COLUMNS",
        "PAUSED",
        "Routine Load PAUSED",
        "out of range",
        "kafka_broker_version_fallback",
        "property.broker.version.fallback",
        "desired_concurrent_number",
        "max_filter_ratio",
        "ErrorLogUrls",
        "ALTER ROUTINE LOAD",
        "PAUSE ROUTINE LOAD",
        "RESUME ROUTINE LOAD",
        "STOP ROUTINE LOAD"
    ]
}
---

<!-- Knowledge type: Procedures + Configuration parameters + Examples + FAQ -->
<!-- Applicable scenarios: Continuously consume data from Kafka into Doris / Real-time data ingestion / CDC streaming sync -->

Routine Load — это задание **потокового импорта** в Apache Doris, которое непрерывно получает данные из топика Kafka и записывает их в таблицу Doris. После отправки задания Routine Load Doris поддерживает его непрерывную работу, в реальном времени создаёт задачи импорта для получения сообщений из указанного топика кластера Kafka и обеспечивает семантику **Exactly-Once**, исключающую потерю и дублирование данных.

## Быстрая навигация {#quick-navigation}

Перейдите к разделу, соответствующему вашей задаче:

| Моя задача | Раздел |
| ------- | ------- |
| Сразу запустить минимальный пример | [Быстрый старт](#quick-start) |
| Разобраться в принципах работы, автомате состояний и механизме автоматического восстановления | [Основные принципы](#basic-principles) |
| Найти все настраиваемые параметры (FE/BE/задание/Kafka) | [Справочник](#reference-manual) |
| Найти примеры для конкретного сценария (допустимые ошибки, фильтрация, JSON, Kerberos и т. д.) | [Примеры импорта](#import-examples) |
| Задание переходит в `PAUSED`, сообщает об ошибке `out of range` или возникают ошибки SSL | [Часто задаваемые вопросы (FAQ)](#frequently-asked-questions-faq) |

## Сценарии использования {#use-cases}

<!-- Knowledge type: Scenario description -->

Routine Load подходит для следующих сценариев:

- Непрерывная синхронизация данных из топика Kafka в Doris в реальном времени.
- Обеспечение семантики **Exactly-Once**, чтобы избежать потери или дублирования данных.
- Сопоставление столбцов, фильтрация, вычисление производных столбцов и другие преобразования импортируемых данных.
- Динамическое распределение данных из одного топика Kafka по нескольким таблицам Doris (один поток в несколько таблиц).

### Поддерживаемые источники и форматы данных {#supported-data-sources-and-formats}

Routine Load поддерживает получение данных только из **кластера Kafka** и работает со следующими двумя форматами сообщений:

| Формат | Описание |
| ---- | ---- |
| CSV  | Каждое сообщение представляет собой одну строку, в конце которой **нет** символа перевода строки. |
| JSON | Один объект JSON или массив JSON, содержащий несколько объектов. |

При импорте в формате CSV необходимо различать значения NULL и пустые строки:

- Значение NULL обозначается как `\n`. Например, `a,\n,b` означает, что средний столбец содержит значение NULL.
- Пустая строка задаётся отсутствием данных в поле. Например, `a,,b` означает, что средний столбец содержит пустую строку (`''`).

### Ограничения {#limitations}

При использовании Routine Load для получения данных из Kafka действуют следующие ограничения:

| Ограничение | Описание |
| ------ | ---- |
| Формат сообщений | Поддерживаются только текстовые форматы CSV и JSON. Каждое сообщение CSV представляет собой одну строку, в конце которой **нет** символа перевода строки. |
| Версия Kafka | По умолчанию поддерживается Kafka 0.10.0.0 и выше. Для использования версии Kafka ниже 0.10.0.0 (0.9.0, 0.8.2, 0.8.1, 0.8.0) укажите нужную старую версию в параметре конфигурации BE `kafka_broker_version_fallback` или задайте `property.broker.version.fallback` непосредственно при создании задания. При использовании старой версии некоторые новые возможности Routine Load могут быть недоступны, например задание смещений разделов Kafka по времени. |

## Основные принципы {#basic-principles}

Routine Load непрерывно получает данные из топика Kafka и записывает их в Doris. После создания задания Routine Load в Doris формируется длительно работающее задание импорта, содержащее несколько задач импорта:

- **Задание загрузки (Load Job)**: Routine Load Job — это длительно работающее задание импорта, которое непрерывно получает данные из источника.
- **Задача загрузки (Load Task)**: задание загрузки делится на несколько задач, которые непосредственно получают данные. Каждая задача представляет собой независимую транзакцию.

Подробная схема работы Routine Load показана на следующем рисунке:

![Routine Load](/images/routine-load.png)

Общий процесс выглядит так:

1. Клиент отправляет в FE запрос на создание задания Routine Load. FE создаёт длительно работающее задание импорта (Routine Load Job) с помощью Routine Load Manager.
2. FE делит Routine Load Job на несколько Routine Load Task с помощью Job Scheduler. Затем Task Scheduler распределяет их по узлам BE.
3. После завершения импорта задача Routine Load Task на BE фиксирует транзакцию в FE и обновляет метаданные задания.
4. После фиксации Routine Load Task создаются новые задачи или повторно запускаются задачи, время ожидания которых истекло.
5. Task Scheduler планирует выполнение вновь созданных Routine Load Task в непрерывном цикле.

### Механизм автоматического восстановления {#auto-recovery-mechanism}

<!-- Knowledge type: State machine / Operations rules -->

Для обеспечения высокой доступности заданий в Routine Load предусмотрен механизм автоматического восстановления. Когда задание неожиданно приостанавливается, поток Routine Load Scheduler пытается автоматически восстановить его работу. При неожиданных сбоях на стороне Kafka или других ситуациях, препятствующих работе, этот механизм позволяет заданию импорта продолжить нормальную работу после восстановления Kafka без ручного вмешательства.

В следующей таблице указано, в каких случаях работа восстанавливается автоматически, а в каких требуется ручное вмешательство:

| Причина приостановки | Автоматическое восстановление | Рекомендуемое действие |
| -------------- | ------------ | -------- |
| Временная недоступность брокера Kafka, нестабильность сети | Да | Scheduler автоматически повторяет попытки с интервалом `period_of_auto_resume_min`. |
| Пользователь вручную выполняет `PAUSE ROUTINE LOAD` | Нет | Вручную выполните `RESUME ROUTINE LOAD`. |
| Проблема качества данных (превышен `max_filter_ratio` или `max_error_number`) | Нет | Изучите `ErrorLogUrls`, скорректируйте данные или параметры, затем выполните `RESUME`. |
| Неустранимые ошибки метаданных, например удаление базы данных или таблицы | Нет | Заново создайте таблицу или задание. |

## Быстрый старт {#quick-start}

<!-- Knowledge type: Procedures -->

В этом разделе приведён минимальный рабочий пример создания задания Routine Load для Kafka, а также основные операции просмотра, приостановки, возобновления, изменения и остановки задания.

### Создание задания импорта {#create-an-import-job}

С помощью команды [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD) можно создать длительно работающее задание импорта Routine Load. Routine Load поддерживает получение данных в форматах CSV и JSON.

#### Импорт данных CSV {#import-csv-data}

1. Подготовьте пример данных в Kafka:

    ```bash
    kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
    1,Emily,25
    2,Benjamin,35
    3,Olivia,28
    4,Alexander,60
    5,Ava,17
    6,William,69
    7,Sophia,32
    8,James,64
    9,Emma,37
    10,Liam,64
    ```

2. Создайте целевую таблицу для импорта:

    ```sql
    CREATE TABLE testdb.test_routineload_tbl(
        user_id            BIGINT       NOT NULL COMMENT "user id",
        name               VARCHAR(20)           COMMENT "name",
        age                INT                   COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 10;
    ```

3. Создайте задание импорта Routine Load:

    ```sql
    CREATE ROUTINE LOAD testdb.example_routine_load_csv ON test_routineload_tbl
    COLUMNS TERMINATED BY ",",
    COLUMNS(user_id, name, age)
    FROM KAFKA(
        "kafka_broker_list" = "192.168.88.62:9092",
        "kafka_topic" = "test-routine-load-csv",
        "property.kafka_default_offsets" = "OFFSET_BEGINNING"
    );
    ```

#### Импорт данных JSON {#import-json-data}

1. Подготовьте пример данных в Kafka:

    ```bash
    kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-json --from-beginning
    {"user_id":1,"name":"Emily","age":25}
    {"user_id":2,"name":"Benjamin","age":35}
    {"user_id":3,"name":"Olivia","age":28}
    {"user_id":4,"name":"Alexander","age":60}
    {"user_id":5,"name":"Ava","age":17}
    {"user_id":6,"name":"William","age":69}
    {"user_id":7,"name":"Sophia","age":32}
    {"user_id":8,"name":"James","age":64}
    {"user_id":9,"name":"Emma","age":37}
    {"user_id":10,"name":"Liam","age":64}
    ```

2. Создайте целевую таблицу для импорта:

    ```sql
    CREATE TABLE testdb.test_routineload_tbl(
        user_id            BIGINT       NOT NULL COMMENT "user id",
        name               VARCHAR(20)           COMMENT "name",
        age                INT                   COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 10;
    ```

3. Создайте задание импорта Routine Load:

    ```sql
    CREATE ROUTINE LOAD testdb.example_routine_load_json ON test_routineload_tbl
    COLUMNS(user_id,name,age)
    PROPERTIES(
        "format"="json",
        "jsonpaths"="[\"$.user_id\",\"$.name\",\"$.age\"]"
    )
    FROM KAFKA(
        "kafka_broker_list" = "192.168.88.62:9092",
        "kafka_topic" = "test-routine-load-json",
        "property.kafka_default_offsets" = "OFFSET_BEGINNING"
    );
    ```

:::info Примечание
Чтобы импортировать объект JSON из корня файла JSON, задайте для `jsonpaths` значение `$.`, например: `PROPERTIES("jsonpaths"="$.")`.
:::

### Просмотр состояния импорта {#view-import-status}

Состояние Routine Load можно рассматривать на двух уровнях:

- **Задание загрузки**: сведения о целевой таблице задания, количестве подзадач, задержке импорта, конфигурации и результатах импорта.
- **Задача загрузки**: состояние подзадач импорта, прогресс получения данных и узел BE, на который направлена задача.

#### Просмотр задания загрузки {#view-the-load-job}

Используйте команду [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) для просмотра задания загрузки. Она показывает основные сведения о текущем состоянии задания: целевую таблицу, задержку импорта, конфигурацию импорта и информацию об ошибках.

Следующая команда показывает состояние задания `testdb.example_routine_load_csv`:

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```

#### Просмотр подзадач загрузки {#view-the-load-subtasks}

Используйте команду [SHOW ROUTINE LOAD TASK](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD-TASK) для просмотра подзадач импорта. Она показывает сведения о подзадачах текущего задания, например их состояние и идентификатор BE, на который направлена задача.

Следующая команда показывает сведения о подзадачах задания `testdb.example_routine_load_csv`:

```sql
mysql> SHOW ROUTINE LOAD TASK WHERE jobname = 'example_routine_load_csv';
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
| TaskId                            | TxnId | TxnStatus | JobId | CreateTime          | ExecuteStartTime    | Timeout | BeId  | DataSourceProperties |
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
| 8cf47e6a68ed4da3-8f45b431db50e466 | 195   | PREPARE   | 12177 | 2024-01-15 12:20:41 | 2024-01-15 12:21:01 | 20      | 10429 | {"4":1231,"9":2603}  |
| f2d4525c54074aa2-b6478cf8daaeb393 | 196   | PREPARE   | 12177 | 2024-01-15 12:20:41 | 2024-01-15 12:21:01 | 20      | 12109 | {"1":1225,"6":1216}  |
| cb870f1553864250-975279875a25fab6 | -1    | NULL      | 12177 | 2024-01-15 12:20:52 | NULL                | 20      | -1    | {"2":7234,"7":4865}  |
| 68771fd8a1824637-90a9dac2a7a0075e | -1    | NULL      | 12177 | 2024-01-15 12:20:52 | NULL                | 20      | -1    | {"3":1769,"8":2982}  |
| 77112dfea5e54b0a-a10eab3d5b19e565 | 197   | PREPARE   | 12177 | 2024-01-15 12:21:02 | 2024-01-15 12:21:02 | 20      | 12098 | {"0":3000,"5":2622}  |
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
```

### Приостановка задания импорта {#pause-an-import-job}

Задание импорта можно приостановить командой [PAUSE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/PAUSE-ROUTINE-LOAD). После приостановки задание переходит в состояние `PAUSED`, но не завершается. Его можно снова запустить командой `RESUME ROUTINE LOAD`.

```sql
PAUSE ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### Возобновление задания импорта {#resume-an-import-job}

Задание импорта в состоянии `PAUSED` можно возобновить командой [RESUME ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/RESUME-ROUTINE-LOAD).

```sql
RESUME ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### Изменение задания импорта {#modify-an-import-job}

Созданное задание импорта можно изменить командой [ALTER ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/ALTER-ROUTINE-LOAD). Перед изменением приостановите задание командой `PAUSE ROUTINE LOAD`. После внесения изменений возобновите его командой `RESUME ROUTINE LOAD`.

Например, чтобы изменить желаемый параллелизм `desired_concurrent_number` и сведения о топике Kafka:

```sql
ALTER ROUTINE LOAD FOR testdb.example_routine_load_csv
PROPERTIES(
    "desired_concurrent_number" = "3"
)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.60:9092",
    "kafka_topic" = "test-topic"
);
```

### Отмена задания импорта {#cancel-an-import-job}

Задание импорта Routine Load можно остановить и удалить командой [STOP ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/STOP-ROUTINE-LOAD). **Удалённое задание импорта нельзя восстановить** или просмотреть командой `SHOW ROUTINE LOAD`.

```sql
STOP ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### Привязка Compute Group {#bind-a-compute-group}

В **режиме разделения хранения и вычислений** Routine Load выбирает Compute Group в следующем порядке приоритета:

1. Начиная с 4.1.5 предпочтение отдаётся Compute Group, явно привязанной свойством задания `"compute_group" = "<compute_group_name>"`.
2. Если свойство не задано, выбирается Compute Group, указанная командой `use db@cluster`.
3. Выбирается Compute Group, указанная в свойстве пользователя `default_compute_group`.
4. Выбирается одна из Compute Group, к которым текущий пользователь имеет доступ.

`compute_group` — необязательное строковое свойство; по умолчанию привязка отсутствует. Оно поддерживается только в режиме разделения вычислений и хранения. Группа должна существовать, а создатель задания должен иметь на неё привилегию `USAGE`. Значение `DEFAULT` зарезервировано без учёта регистра и не может использоваться для привязки. Явная привязка имеет приоритет перед выбором в сеансе. Перед запуском каждая задача повторно проверяет существование группы и привилегии владельца задания. Отсутствие группы может привести к приостановке задания до её восстановления. Если привилегии отозваны, восстановите их, прежде чем вручную возобновлять задание.

Добавьте это свойство в `PROPERTIES` в приведённых ниже примерах `CREATE ROUTINE LOAD`:

```sql
PROPERTIES (
    "compute_group" = "cg_ingest",
    "desired_concurrent_number" = "3"
)
```

В **режиме совместного хранения и вычислений** выбирается Compute Group, указанная в свойстве пользователя `resource_tags.location`. Если в свойствах пользователя Compute Group не указана, используется Compute Group с именем `default`.

:::caution Примечание
Compute Group для задания Routine Load **можно указать только при создании**. После создания задания изменить привязанную Compute Group нельзя.
:::

## Справочник {#reference-manual}

<!-- Knowledge type: Configuration parameters + Syntax reference -->

### Синтаксис команды импорта {#import-command-syntax}

Синтаксис создания длительно работающего задания импорта Routine Load:

```sql
CREATE ROUTINE LOAD [<db_name>.]<job_name> [ON <tbl_name>]
[merge_type]
[load_properties]
[job_properties]
FROM KAFKA [data_source_properties]
[COMMENT "<comment>"]
```

Описание частей команды:

| Часть                  | Описание                                                  |
| ---------------------- | ------------------------------------------------------------ |
| db_name                | Указывает базу данных, в которой создаётся задача импорта.   |
| job_name               | Указывает имя создаваемой задачи импорта. В одной базе данных не может быть задач с одинаковыми именами. |
| tbl_name               | Указывает имя таблицы, в которую импортируются данные. Необязательная часть. Если не указана, используется динамический выбор таблицы: данные в Kafka должны содержать имя таблицы. |
| merge_type             | Тип слияния данных. Значение по умолчанию — APPEND.<p>Доступны три варианта:</p><p>- APPEND: импорт с добавлением.</p><p>- MERGE: импорт со слиянием.</p><p>- DELETE: все импортируемые данные подлежат удалению.</p> |
| load_properties        | Описание импорта, включающее следующие компоненты:<p>- предложение column_separator</p><p>- предложение columns_mapping</p><p>- предложение preceding_filter</p><p>- предложение where_predicates</p><p>- предложение partitions</p><p>- предложение delete_on</p><p>- предложение order_by</p> |
| job_properties         | Задаёт общие параметры импорта Routine Load.      |
| data_source_properties | Описывает свойства источника данных Kafka.           |
| comment                | Задаёт комментарий к заданию импорта.                    |

### Описание параметров импорта {#import-parameter-description}

#### Параметры конфигурации FE {#fe-configuration-parameters}

| Параметр | Значение по умолчанию | Динамический | Только FE Master | Описание |
| -------- | ------ | -------- | ------------------ | -------- |
| max_routine_load_task_concurrent_num | 256 | Да | Да | Ограничивает максимальное количество параллельных подзадач задания импорта Routine Load. Рекомендуется сохранить значение по умолчанию. Слишком большое значение может привести к избыточному количеству параллельных задач и расходу ресурсов кластера. |
| max_routine_load_task_num_per_be | 1024 | Да | Да | Максимальное количество параллельных задач Routine Load на одном BE. Значение `max_routine_load_task_num_per_be` должно быть меньше `routine_load_thread_pool_size`. |
| max_routine_load_job_num | 100 | Да | Да | Ограничивает максимальное количество заданий Routine Load, включая задания в состояниях NEED_SCHEDULED, RUNNING и PAUSE. |
| max_tolerable_backend_down_num | 0 | Да | Да | Если хотя бы один BE недоступен, Routine Load не может восстановиться автоматически. При выполнении определённых условий Doris может повторно запланировать задачу в состоянии PAUSED и перевести её в RUNNING. Значение 0 означает, что повторное планирование разрешено только при доступности всех узлов BE. |
| period_of_auto_resume_min | 5 (минут) | Да | Да | Интервал автоматического восстановления Routine Load. |

#### Параметры конфигурации BE {#be-configuration-parameters}

| Параметр | Значение по умолчанию | Динамический | Описание |
| -------- | ------ | -------- | ---- |
| max_consumer_num_per_group | 3 | Да | Максимальное количество потребителей, которые одна подзадача может создать для получения данных. |

#### Параметры конфигурации импорта {#import-configuration-parameters}

При создании задания Routine Load командой `CREATE ROUTINE LOAD` можно задать параметры конфигурации импорта для разных частей команды.

##### Предложение tbl_name {#tbl_name-clause}

Указывает имя таблицы для импорта. Необязательное предложение.

Если оно не указано, используется **динамический выбор таблицы**: данные в Kafka должны содержать имя таблицы. В настоящее время динамическое имя таблицы можно извлечь только из Value сообщения Kafka, и данные должны соответствовать следующему формату. Для JSON: `table_name|{"col1": "val1", "col2": "val2"}`, где `tbl_name` — имя таблицы, а `|` — разделитель между именем таблицы и её данными. Для данных CSV формат аналогичен, например: `table_name|val1,val2,val3`.

:::caution Примечание
Указанное здесь `table_name` должно точно совпадать с именем таблицы в Doris, иначе импорт завершится ошибкой. Динамический выбор таблицы не поддерживает `column_mapping`.
:::

##### Предложение merge_type {#merge_type-clause}

Тип слияния данных можно задать в части `merge_type`. Доступны три варианта:

- **APPEND**: импорт с добавлением.
- **MERGE**: импорт со слиянием. Применяется только к модели Unique Key. Необходимо использовать вместе с частью `[DELETE ON]` для установки значений столбца Delete Flag.
- **DELETE**: все импортируемые данные подлежат удалению.

##### Предложение load_properties {#load_properties-clause}

Свойства импортируемых данных можно описать в части `load_properties`. Синтаксис:

```sql
[COLUMNS TERMINATED BY <column_separator>,]
[COLUMNS (<column1_name>[, <column2_name>, <column_mapping>, ...]),]
[WHERE <where_expr>,]
[PARTITION(<partition1_name>, [<partition2_name>, <partition3_name>, ...]),]
[DELETE ON <delete_expr>,]
[ORDER BY <order_by_column1>[, <order_by_column2>, <order_by_column3>, ...]]
```

Параметры каждой части:

| Часть            | Параметр          | Описание                                                  |
| --------------------- | ------------------ | ------------------------------------------------------------ |
| COLUMNS TERMINATED BY | `<column_separator>` | Задаёт разделитель столбцов. Значение по умолчанию — `\t`. Например, чтобы задать запятую в качестве разделителя: `COLUMN TERMINATED BY ","`. Особенности обработки NULL:<p>- Значение NULL обозначается как `\n`. `a,\n,b` означает, что средний столбец содержит значение NULL.</p><p>- Пустая строка задаётся отсутствием данных в поле. `a,,b` означает, что средний столбец содержит пустую строку (`''`).</p> |
| COLUMNS               | `<column_name>`    | Задаёт имя соответствующего столбца. Например, чтобы указать импортируемые столбцы `(k1, k2, k3)`: `COLUMNS(k1, k2, k3)`. Предложение COLUMNS можно опустить в следующих случаях:<p>- Столбцы CSV соответствуют столбцам таблицы один к одному.</p><p>- Имена ключей JSON совпадают с именами столбцов таблицы.</p> |
| &nbsp;                | `<column_mapping>` | Во время импорта можно фильтровать и преобразовывать столбцы с помощью сопоставления столбцов. Например, целевой столбец k4 вычисляется из столбца k3 по формуле k3+1: `COLUMNS(k1, k2, k3, k4 = k3 + 1)`. Подробнее см. [Преобразование данных](../../import/load-data-convert). |
| WHERE                 | `<where_expr>`     | Фильтрует импортируемые данные источника по условию. Например, чтобы импортировать только данные с age > 30: `WHERE age > 30`. |
| PARTITION             | `<partition_name>` | Указывает разделы целевой таблицы, в которые нужно импортировать данные. Если не задано, данные автоматически импортируются в соответствующие разделы. Например, для импорта в разделы p1 и p2: `PARTITION(p1, p2)`. |
| DELETE ON             | `<delete_expr>`    | В режиме импорта MERGE используйте `delete_expr`, чтобы отметить столбцы, подлежащие удалению. Например, для удаления столбцов, где age > 30, при MERGE: `DELETE ON age > 30`. |
| ORDER BY              | `<order_by_column>` | Действует только для модели Unique Key. Задаёт Sequence Column в импортируемых данных для обеспечения порядка данных. Например, чтобы указать `create_time` в качестве Sequence Column: `ORDER BY create_time`. Подробнее см. [Обновление данных / Sequence Column](../../../data-operate/update/update-of-unique-model). |

##### Предложение job_properties {#job_properties-clause}

При создании задания импорта Routine Load можно задать его свойства в предложении `job_properties`. Синтаксис:

```sql
PROPERTIES ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

Доступные параметры предложения `job_properties`:

| Параметр | Описание |
| ---- | ---- |
| desired_concurrent_number | <p>Значение по умолчанию: 256</p><p>Желаемый параллелизм для одной задачи загрузки. Во время импорта желаемое количество параллельных подзадач может отличаться от фактического. Фактический параллелизм вычисляется так:</p><p>`min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`, где:</p><p>- `topic_partition_num`: количество разделов топика Kafka.</p><p>- `desired_concurrent_number`: значение этого параметра.</p><p>- `max_routine_load_task_concurrent_num`: максимальный параллелизм задач Routine Load, заданный в FE.</p> |
| max_batch_interval | Максимальное время работы каждой подзадачи в секундах. Должно быть больше 0. Значение по умолчанию — 60. Параметры `max_batch_interval`, `max_batch_rows` и `max_batch_size` вместе задают пороги выполнения подзадачи. При достижении любого из них подзадача импорта завершается и создаётся новая. |
| max_batch_rows | Максимальное количество строк, которые может прочитать каждая подзадача. Должно быть больше или равно 200000. Значение по умолчанию — 20000000. Параметры `max_batch_interval`, `max_batch_rows` и `max_batch_size` вместе задают пороги выполнения подзадачи. При достижении любого из них подзадача импорта завершается и создаётся новая. |
| max_batch_size | Максимальное количество байтов, которые может прочитать каждая подзадача. Значение задаётся в байтах, диапазон — от 100 MB до 1 GB, значение по умолчанию — 1 GB. Параметры `max_batch_interval`, `max_batch_rows` и `max_batch_size` вместе задают пороги выполнения подзадачи. При достижении любого из них подзадача импорта завершается и создаётся новая. |
| max_error_number | Максимальное допустимое количество ошибочных строк в пределах окна выборки. Должно быть больше или равно 0. Значение по умолчанию — 0 (ошибочные строки не допускаются). Размер окна выборки — `max_batch_rows * 10`. Если количество ошибочных строк в окне выборки превышает `max_error_number`, задание Routine Load приостанавливается. Для проверки проблем качества данных требуется ручное вмешательство. Проверить такие проблемы можно через поле `ErrorLogUrls` в выводе команды [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD). Строки, отфильтрованные условием where, не считаются ошибочными. |
| strict_mode | Включает строгий режим. По умолчанию отключён. В строгом режиме при импорте применяется строгая фильтрация преобразований типов столбцов. Если режим включён и исходное значение, отличное от NULL, после преобразования типа столбца становится NULL, оно отфильтровывается.<p>Правила фильтрации:</p><p>- Строгий режим не влияет на производные столбцы, создаваемые преобразованием с помощью функций.</p><p>- Если тип столбца требует преобразования, данные неподходящего типа отфильтровываются. Их можно просмотреть через `ErrorLogUrls` в выводе [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD).</p><p>- Если тип импортируемого столбца имеет ограничения диапазона, а исходные данные проходят преобразование типа, но не соответствуют диапазону, строгий режим на это не влияет. Например, если тип — `decimal(1,0)`, а исходное значение — 10, данные проходят преобразование типа, но выходят за объявленный диапазон столбца. Подробнее см. [Строгий режим](../../../data-operate/import/handling-messy-data#strict-mode-strict_mode).</p> |
| timezone | Задаёт часовой пояс для задания импорта. По умолчанию используется значение параметра часового пояса сеанса. Этот параметр влияет на результаты всех связанных с часовыми поясами функций, используемых при импорте. |
| format | Задаёт формат импортируемых данных. По умолчанию — CSV. Поддерживается формат JSON. |
| compute_group | Поддерживается начиная с 4.1.5. Необязательная строка, по умолчанию не задана. Поддерживается только в режиме разделения вычислений и хранения; явно привязывает Compute Group для выполнения. Требует привилегии `USAGE` на эту группу и не допускает зарезервированное значение `DEFAULT`. |
| jsonpaths | Для импортируемых данных в формате JSON можно использовать `jsonpaths`, чтобы указать поля, извлекаемые из данных JSON. Например: `"jsonpaths" = "[\"$.userid\",\"$.username\",\"$.age\",\"$.city\"]"` |
| json_root | Для импортируемых данных в формате JSON можно использовать `json_root`, чтобы указать корневой узел данных JSON. Doris извлекает и разбирает элементы из корневого узла, заданного в `json_root`. По умолчанию значение пустое. Например: `"json_root" = "$.RECORDS"` |
| strip_outer_array | Для импортируемых данных в формате JSON значение true у `strip_outer_array` означает, что данные JSON представлены массивом и каждый его элемент обрабатывается как отдельная строка. По умолчанию — false. Данные JSON в Kafka часто представлены массивом, то есть внешний уровень заключён в квадратные скобки `[]`. В этом случае можно указать `"strip_outer_array" = "true"`. Например, следующие данные разбираются в две строки: `[{"user_id":1,"name":"Emily","age":25},{"user_id":2,"name":"Benjamin","age":35}]` |
| send_batch_parallelism | Задаёт параллелизм отправки пакетов данных. Если значение превышает параметр конфигурации BE `max_send_batch_parallelism_per_job`, BE, выступающий координатором, использует значение `max_send_batch_parallelism_per_job`. |
| load_to_single_tablet | Позволяет импортировать данные задачи только в один tablet соответствующего раздела. По умолчанию — false. Этот параметр можно задать только при импорте данных в таблицу OLAP со случайным распределением по бакетам. |
| partial_columns | Указывает, следует ли включать частичное обновление столбцов. По умолчанию — false. Этот параметр можно задать только для таблицы модели Unique с Merge on Write. Импорт из одного потока в несколько таблиц не поддерживает этот параметр. Подробнее см. [Частичное обновление столбцов](../../../data-operate/update/partial-column-update.md). |
| unique_key_update_mode | Задаёт режим обновления таблицы Unique Key. Варианты:<ul><li>`UPSERT` (по умолчанию): стандартная вставка или обновление целой строки.</li><li>`UPDATE_FIXED_COLUMNS`: частичное обновление столбцов, при котором все строки обновляют один и тот же набор столбцов. Эквивалентно `partial_columns=true`.</li><li>`UPDATE_FLEXIBLE_COLUMNS`: гибкое частичное обновление столбцов, при котором каждая строка может обновлять разные столбцы. Требуется формат JSON и свойство таблицы `enable_unique_key_skip_bitmap_column=true`. Нельзя использовать вместе с `jsonpaths`, `fuzzy_parse`, предложением `COLUMNS` или предложением `WHERE`.</li></ul>Подробнее см. [Частичное обновление столбцов](../../../data-operate/update/partial-column-update#flexible-column-update). |
| partial_update_new_key_behavior | Обработка вновь вставляемых строк при частичном обновлении столбцов таблицы Unique с Merge on Write. Два варианта: `APPEND` и `ERROR`.<br/>- `APPEND`: разрешить вставку новых строк.<br/>- `ERROR`: при вставке новой строки импорт завершается с сообщением об ошибке. |
| max_filter_ratio | Максимальная допустимая доля отфильтрованных строк в пределах окна выборки. Должна быть больше или равна 0 и меньше или равна 1. Значение по умолчанию — 1.0, что допускает любую долю ошибочных строк. Размер окна выборки — `max_batch_rows * 10`. Если отношение количества ошибочных строк к общему количеству строк в окне выборки превышает `max_filter_ratio`, задание Routine Load приостанавливается. Для проверки проблем качества данных требуется ручное вмешательство. Строки, отфильтрованные условием where, не считаются ошибочными. |
| enclose | Задаёт символ обрамления. Если поля данных CSV содержат разделители строк или столбцов, можно указать однобайтовый символ обрамления, чтобы предотвратить непреднамеренное разбиение. Например, если разделитель столбцов — `,`, а символ обрамления — `'`, то в данных `a,'b,c'` значение `b,c` разбирается как одно поле. |
| escape | Задаёт символ экранирования. Используется для экранирования символов внутри поля, совпадающих с символом обрамления. Например, для данных `a,'b,'c'` с символом обрамления `'`, чтобы разобрать `b,'c` как одно поле, необходимо указать однобайтовый символ экранирования (например, `\`) и изменить данные на `a,'b,\'c'`. |

#### Предложение data_source_properties {#data_source_properties-clause}

При создании задания импорта Routine Load можно задать свойства источника данных Kafka в предложении `data_source_properties`. Синтаксис:

```sql
FROM KAFKA ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

Доступные параметры предложения `data_source_properties`:

| Параметр | Описание |
| ---- | ---- |
| kafka_broker_list | Задаёт сведения для подключения к брокерам Kafka. Формат — `<kafka_broker_ip>:<kafka port>`. Несколько брокеров разделяются запятыми. Например: `"kafka_broker_list" = "<broker1_ip>:9092,<broker2_ip>:9092"` |
| kafka_topic | Задаёт топик Kafka для подписки. Одно задание импорта может получать данные только из одного топика Kafka. |
| kafka_partitions | Задаёт разделы Kafka для подписки. Если не задано, по умолчанию данные получаются из всех разделов. |
| kafka_offsets | Начальное смещение для получения данных из раздела Kafka. Если указано время, получение начинается с последнего смещения, время которого больше или равно указанному. Смещение можно задать конкретным значением, большим или равным 0, либо в одном из следующих форматов:<p>- `OFFSET_BEGINNING`: подписка с позиции, на которой доступны данные.</p><p>- `OFFSET_END`: подписка с конца.</p><p>- Временной формат, например: `"2021-05-22 11:00:00"`.</p><p>Если не задано, по умолчанию подписка на все разделы топика выполняется с `OFFSET_END`. Можно указать несколько начальных смещений через запятую, например: `"kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"` или `"kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00"`.</p><p>Примечание: временной формат нельзя смешивать с форматом OFFSET.</p> |
| property | Задаёт пользовательские параметры Kafka, эквивалентные параметру `--property` командной оболочки kafka. Если значением параметра является файл, добавьте перед значением ключевое слово `FILE:`. О создании файла см. команду [CREATE FILE](../../../sql-manual/sql-statements/security/CREATE-FILE). Другие поддерживаемые пользовательские параметры приведены в описании клиентской конфигурации в официальном документе librdkafka [CONFIGURATION](https://github.com/confluentinc/librdkafka/blob/master/CONFIGURATION.md). Например: `"property.client.id" = "12345"`, `"property.group.id" = "group_id_0"`, `"property.ssl.ca.location" = "FILE:ca.pem"`. |

Параметры property Kafka в `data_source_properties` позволяют настроить защищённый доступ. В настоящее время Doris поддерживает несколько протоколов безопасности Kafka, включая plaintext (по умолчанию), SSL, PLAIN и Kerberos.

### Состояние импорта {#import-status}

Состояние задания импорта можно просмотреть командой `SHOW ROUTINE LOAD`:

```sql
SHOW [ALL] ROUTINE LOAD [FOR jobName];
```

Пример результата:

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```

Описание столбцов результата:

| Столбец результата        | Описание                                                  |
| -------------------- | ------------------------------------------------------------ |
| Id                   | Идентификатор задания, автоматически создаваемый Doris.                |
| Name                 | Имя задания.                                                |
| CreateTime           | Время создания задания.                                       |
| PauseTime            | Время последней приостановки задания.                              |
| EndTime              | Время завершения задания.                                            |
| DbName               | Имя соответствующей базы данных.                             |
| TableName            | Имя соответствующей таблицы. Для заданий с несколькими таблицами (динамический выбор таблицы) конкретное имя таблицы не отображается; вместо него выводится `multi-table`. |
| IsMultiTable         | Использует ли задание несколько таблиц (один поток в несколько таблиц). |
| State                | Состояние выполнения задания. Всего 5 состояний. См. [Автомат состояний задания](#job-state-machine) ниже. |
| DataSourceType       | Тип источника данных: KAFKA.                                 |
| CurrentTaskNum       | Текущее количество подзадач.                              |
| JobProperties        | Подробная конфигурация задания.                                   |
| DataSourceProperties | Подробная конфигурация источника данных.                           |
| CustomProperties     | Пользовательская конфигурация.                                        |
| Statistic            | Статистика выполнения задания.                         |
| Progress             | Прогресс выполнения задания. Для источников данных Kafka показывает текущее обработанное смещение каждого раздела. Например, `{"0":"2"}` означает, что прогресс получения данных из раздела Kafka 0 достиг смещения 2. |
| Lag                  | Задержка задания. Для источников данных Kafka показывает отставание получения данных по каждому разделу. Например, `{"0":10}` означает, что отставание получения данных из раздела Kafka 0 составляет 10. |
| ReasonOfStateChanged | Причина изменения состояния задания.                         |
| ErrorLogUrls         | URL для просмотра отфильтрованных данных низкого качества.    |
| OtherMsg             | Другая информация об ошибках.                                     |

### Автомат состояний задания {#job-state-machine}

<!-- Knowledge type: State machine -->

У задания Routine Load есть 5 состояний. Переходы между ними описаны ниже:

| Состояние | Значение | Условие перехода | Возможное следующее состояние |
| ---- | ---- | -------- | -------------- |
| `NEED_SCHEDULE` | Задание ожидает планирования. | Начальное состояние после `CREATE ROUTINE LOAD` или `RESUME ROUTINE LOAD`. | `RUNNING` |
| `RUNNING` | Задание выполняется и непрерывно получает данные из Kafka. | Переход после успешного планирования. | `PAUSED` / `STOPPED` |
| `PAUSED` | Задание приостановлено, но не завершено. | Ручное выполнение `PAUSE ROUTINE LOAD` или автоматическая приостановка при ошибке. | `NEED_SCHEDULE` (ручное выполнение `RESUME` или автоматическое восстановление) / `CANCELLED` |
| `STOPPED` | Задание остановлено и **не может быть запущено повторно**. | `STOP ROUTINE LOAD`. | Конечное состояние. |
| `CANCELLED` | Задание отменено. | Удаление базы данных или таблицы либо другие ошибки. | Конечное состояние. |

## Примеры импорта {#import-examples}

<!-- Knowledge type: Procedures + Examples -->

В следующей таблице перечислены все типовые примеры этого раздела по сценариям использования для быстрого перехода:

| Категория | Сценарий | Решаемая задача |
| ---- | ---- | -------- |
| Качество данных и фильтрация | [Настройка максимальной допустимости ошибок импорта](#set-maximum-import-fault-tolerance) | Нестабильное качество данных: нужно допускать некорректные данные. |
| Качество данных и фильтрация | [Настройка условий фильтрации при импорте](#set-import-filter-conditions) | Импорт только данных, соответствующих условиям. |
| Качество данных и фильтрация | [Импорт в строгом режиме](#strict-mode-import) | Строгая фильтрация ошибок преобразования типов. |
| Управление получением данных | [Получение данных с указанного смещения](#consume-data-from-a-specified-offset) | Точный контроль смещения Kafka. |
| Управление получением данных | [Указание group.id и client.id группы потребителей](#specify-the-groupid-and-clientid-of-the-consumer-group) | Настройка идентификации потребителя Kafka. |
| Управление записью данных | [Импорт данных в указанный раздел](#import-data-into-a-specified-partition) | Запись только в указанные разделы целевой таблицы. |
| Управление записью данных | [Настройка часового пояса импорта](#set-the-import-timezone) | Обработка временных полей в разных часовых поясах. |
| Управление записью данных | [Настройка merge_type](#set-merge_type) | Удаление или запись со слиянием в таблицу Unique Key. |
| Преобразование данных | [Сопоставление столбцов и вычисление производных столбцов при импорте](#column-mapping-and-derived-column-computation-in-import) | Вычисление полей во время импорта. |
| Преобразование данных | [Импорт данных с символами обрамления](#import-data-with-enclosing-characters) | Обработка полей CSV, содержащих разделители. |
| Сложный формат | [Импорт в формате JSON](#json-format-import) | Данные Kafka представлены в формате JSON. |
| Сложный формат | [Импорт сложных типов](#import-complex-types) | Обработка типов Array, Map, Bitmap и HLL. |
| Безопасность и несколько таблиц | [Аутентификация Kafka](#kafka-security-authentication) | Сценарии аутентификации SSL/Kerberos/PLAIN и другие. |
| Безопасность и несколько таблиц | [Импорт из одного потока в несколько таблиц](#single-stream-multi-table-import) | Запись данных из одного топика в несколько таблиц Doris. |

### Настройка максимальной допустимости ошибок импорта {#set-maximum-import-fault-tolerance}

1. Пример импортируемых данных:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,dirty_data
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test01 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job01 ON routine_test01
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "max_filter_ratio"="0.5",
                "max_error_number" = "100",
                "strict_mode" = "true"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test01;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    +------+------------+------+
    2 rows in set (0.01 sec)
    ```

### Получение данных с указанного смещения {#consume-data-from-a-specified-offset}

1. Пример импортируемых данных:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test02 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job02 ON routine_test02
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad02",
                "kafka_partitions" = "0",
                "kafka_offsets" = "3"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test02;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### Указание group.id и client.id группы потребителей {#specify-the-groupid-and-clientid-of-the-consumer-group}

1. Пример импортируемых данных:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test03 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job03 ON routine_test03
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.group.id" = "kafka_job03",
                "property.client.id" = "kafka_client_03",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test03;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    |    3 | Alexander  |   22 |
    +------+------------+------+
    3 rows in set (0.01 sec)
    ```

### Настройка условий фильтрации при импорте {#set-import-filter-conditions}

1. Пример импортируемых данных:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test04 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job04 ON routine_test04
            COLUMNS TERMINATED BY ",",
            WHERE id >= 3
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad04",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test04;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### Импорт данных в указанный раздел {#import-data-into-a-specified-partition}

1. Пример импортируемых данных:

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test05 (
        id      INT            NOT NULL  COMMENT "ID",
        name    VARCHAR(30)    NOT NULL  COMMENT "Name",
        age     INT                      COMMENT "Age",
        date    DATETIME                 COMMENT "Date"
    )
    DUPLICATE KEY(`id`)
    PARTITION BY RANGE(`id`)
    (PARTITION partition_a VALUES [("0"), ("1")),
    PARTITION partition_b VALUES [("1"), ("2")),
    PARTITION partition_c VALUES [("2"), ("3")))
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job05 ON routine_test05
            COLUMNS TERMINATED BY ",",
            PARTITION(partition_b)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad05",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test05;
    +------+----------+------+---------------------+
    | id   | name     | age  | date                |
    +------+----------+------+---------------------+
    |    1 | Benjamin |   18 | 2024-02-04 10:00:00 |
    +------+----------+------+---------------------+
    1 rows in set (0.01 sec)
    ```

### Настройка часового пояса импорта {#set-the-import-timezone}

1. Пример импортируемых данных:

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test06 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        date    DATETIME                 COMMENT "date"
    )
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job06 ON routine_test06
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "timezone" = "Asia/Shanghai"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad06",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test06;
    +------+-------------+------+---------------------+
    | id   | name        | age  | date                |
    +------+-------------+------+---------------------+
    |    1 | Benjamin    |   18 | 2024-02-04 10:00:00 |
    |    2 | Emily       |   20 | 2024-02-05 11:00:00 |
    |    3 | Alexander   |   22 | 2024-02-06 12:00:00 |
    +------+-------------+------+---------------------+
    3 rows in set (0.00 sec)
    ```

### Настройка merge_type {#set-merge_type}

#### Указание merge_type для удаления {#specify-merge_type-to-perform-delete}

1. Пример импортируемых данных:

    ```sql
    3,Alexander,22
    5,William,26
    ```

    Данные в таблице до импорта:

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test07 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job07 ON routine_test07
            WITH DELETE
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad07",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    4 | Sophia         |   24 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```

#### Указание merge_type для слияния {#specify-merge_type-to-perform-merge}

1. Пример импортируемых данных:

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```

    Данные в таблице до импорта:

    ```sql
    mysql> SELECT * FROM routine_test08;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job08 ON routine_test08
            WITH MERGE
            COLUMNS TERMINATED BY ",",
            DELETE ON id = 2
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad08",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> SELECT * FROM routine_test08;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```

#### Указание Sequence Column для импорта со слиянием {#specify-the-sequence-column-for-merge-imports}

1. Пример импортируемых данных:

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```

    Данные в таблице до импорта:

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
        "function_column.sequence_col" = "age"
    );
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job09 ON routine_test09
            WITH MERGE
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age),
            DELETE ON id = 2,
            ORDER BY age
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "strict_mode" = "false"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad09",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```

### Сопоставление столбцов и вычисление производных столбцов при импорте {#column-mapping-and-derived-column-computation-in-import}

1. Пример импортируемых данных:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test10 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job10 ON routine_test10
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age, num=age*10)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad10",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> SELECT * FROM routine_test10;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

### Импорт данных с символами обрамления {#import-data-with-enclosing-characters}

1. Пример импортируемых данных:

    ```sql
    1,"Benjamin",18
    2,"Emily",20
    3,"Alexander",22
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test11 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job11 ON routine_test11
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "enclose" = "\""
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> SELECT * FROM routine_test11;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.02 sec)
    ```

### Импорт в формате JSON {#json-format-import}

#### Импорт данных JSON в простом режиме {#import-json-data-in-simple-mode}

1. Пример импортируемых данных:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test12 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job12 ON routine_test12
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test12;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```

#### Импорт сложных данных JSON в режиме сопоставления {#import-complex-json-data-in-match-mode}

1. Пример импортируемых данных:

    ```sql
    { "name" : "Benjamin", "id" : 1, "num":180 , "age":18 }
    { "name" : "Emily", "id" : 2, "num":200 , "age":20 }
    { "name" : "Alexander", "id" : 3, "num":220 , "age":22 }
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test13 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job13 ON routine_test13
            COLUMNS(name, id, num, age)
            PROPERTIES
            (
                "format" = "json",
                "jsonpaths" = "[\"$.name\",\"$.id\",\"$.num\",\"$.age\"]"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad13",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test13;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

#### Импорт данных с указанным корневым узлом JSON {#import-data-with-a-specified-json-root-node}

1. Пример импортируемых данных:

    ```sql
    {"id": 1231, "source" :{ "id" : 1, "name" : "Benjamin", "age":18 }}
    {"id": 1232, "source" :{ "id" : 2, "name" : "Emily", "age":20 }}
    {"id": 1233, "source" :{ "id" : 3, "name" : "Alexander", "age":22 }}
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test14 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job14 ON routine_test14
            PROPERTIES
            (
                "format" = "json",
                "json_root" = "$.source"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad14",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test14;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

#### Сопоставление столбцов и вычисление производных столбцов при импорте (JSON) {#column-mapping-and-derived-column-computation-in-import-json}

1. Пример импортируемых данных:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test15 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job15 ON routine_test15
            COLUMNS(id, name, age, num=age*10)
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad15",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test15;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

#### Гибкое частичное обновление столбцов {#flexible-partial-column-update}

Этот пример показывает, как использовать гибкое частичное обновление столбцов, при котором каждая строка может обновлять разные столбцы. Это особенно полезно в **сценариях CDC**, поскольку записи изменений могут содержать разные поля.

1. Пример импортируемых данных (каждая запись JSON обновляет свой набор столбцов):

    ```json
    {"id": 1, "balance": 150.00, "last_active": "2024-01-15 10:30:00"}
    {"id": 2, "city": "Shanghai", "age": 28}
    {"id": 3, "name": "Alice", "balance": 500.00, "city": "Beijing"}
    {"id": 1, "age": 30}
    {"id": 4, "__DORIS_DELETE_SIGN__": 1}
    ```

2. Создайте таблицу (должны быть включены Merge-on-Write и столбец skip bitmap):

    ```sql
    CREATE TABLE demo.routine_test_flexible (
        id           INT            NOT NULL  COMMENT "id",
        name         VARCHAR(30)              COMMENT "name",
        age          INT                      COMMENT "age",
        city         VARCHAR(50)              COMMENT "city",
        balance      DECIMAL(10,2)            COMMENT "balance",
        last_active  DATETIME                 COMMENT "last active time"
    )
    UNIQUE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1",
        "enable_unique_key_merge_on_write" = "true",
        "enable_unique_key_skip_bitmap_column" = "true"
    );
    ```

3. Вставьте исходные данные:

    ```sql
    INSERT INTO demo.routine_test_flexible VALUES
    (1, 'John', 25, 'Shenzhen', 100.00, '2024-01-01 08:00:00'),
    (2, 'Jane', 30, 'Guangzhou', 200.00, '2024-01-02 09:00:00'),
    (3, 'Bob', 35, 'Hangzhou', 300.00, '2024-01-03 10:00:00'),
    (4, 'Tom', 40, 'Nanjing', 400.00, '2024-01-04 11:00:00');
    ```

4. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job_flexible ON routine_test_flexible
            PROPERTIES
            (
                "format" = "json",
                "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoadFlexible",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

5. Результат импорта:

    ```sql
    mysql> SELECT * FROM demo.routine_test_flexible ORDER BY id;
    +------+-------+------+-----------+---------+---------------------+
    | id   | name  | age  | city      | balance | last_active         |
    +------+-------+------+-----------+---------+---------------------+
    |    1 | John  |   30 | Shenzhen  |  150.00 | 2024-01-15 10:30:00 |
    |    2 | Jane  |   28 | Shanghai  |  200.00 | 2024-01-02 09:00:00 |
    |    3 | Alice |   35 | Beijing   |  500.00 | 2024-01-03 10:00:00 |
    +------+-------+------+-----------+---------+---------------------+
    3 rows in set (0.01 sec)
    ```

    :::info Примечание
    Строка с `id=4` удаляется из-за `__DORIS_DELETE_SIGN__`. Каждая строка обновляет только столбцы, включённые в соответствующую запись JSON.
    :::

### Импорт сложных типов {#import-complex-types}

#### Импорт типа данных Array {#import-array-data-type}

1. Пример импортируемых данных:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "array":[1,2,3,4,5]}
    { "id" : 2, "name" : "Emily", "age":20, "array":[6,7,8,9,10]}
    { "id" : 3, "name" : "Alexander", "age":22, "array":[11,12,13,14,15]}
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test16
    (
        id      INT             NOT NULL  COMMENT "id",
        name    VARCHAR(30)     NOT NULL  COMMENT "name",
        age     INT                       COMMENT "age",
        array   ARRAY<int(11)>  NULL      COMMENT "test array column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job16 ON routine_test16
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad16",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test16;
    +------+----------------+------+----------------------+
    | id   | name           | age  | array                |
    +------+----------------+------+----------------------+
    |    1 | Benjamin       |   18 | [1, 2, 3, 4, 5]      |
    |    2 | Emily          |   20 | [6, 7, 8, 9, 10]     |
    |    3 | Alexander      |   22 | [11, 12, 13, 14, 15] |
    +------+----------------+------+----------------------+
    3 rows in set (0.00 sec)
    ```

#### Импорт типа данных Map {#import-map-data-type}

1. Пример импортируемых данных:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "map":{"a": 100, "b": 200}}
    { "id" : 2, "name" : "Emily", "age":20, "map":{"c": 300, "d": 400}}
    { "id" : 3, "name" : "Alexander", "age":22, "map":{"e": 500, "f": 600}}
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test17 (
        id      INT                 NOT NULL  COMMENT "id",
        name    VARCHAR(30)         NOT NULL  COMMENT "name",
        age     INT                           COMMENT "age",
        map     Map<STRING, INT>    NULL      COMMENT "test column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job17 ON routine_test17
        PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad17",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test17;
    +------+----------------+------+--------------------+
    | id   | name           | age  | map                |
    +------+----------------+------+--------------------+
    |    1 | Benjamin       |   18 | {"a":100, "b":200} |
    |    2 | Emily          |   20 | {"c":300, "d":400} |
    |    3 | Alexander      |   22 | {"e":500, "f":600} |
    +------+----------------+------+--------------------+
    3 rows in set (0.01 sec)
    ```

#### Импорт типа данных Bitmap {#import-bitmap-data-type}

1. Пример импортируемых данных:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "bitmap_id":243}
    { "id" : 2, "name" : "Emily", "age":20, "bitmap_id":28574}
    { "id" : 3, "name" : "Alexander", "age":22, "bitmap_id":8573}
    ```

2. Схема таблицы:

    ```sql
    CREATE TABLE demo.routine_test18 (
        id        INT            NOT NULL      COMMENT "id",
        name      VARCHAR(30)    NOT NULL      COMMENT "name",
        age       INT                          COMMENT "age",
        bitmap_id INT                          COMMENT "test",
        device_id BITMAP         BITMAP_UNION  COMMENT "test column"
    )
    AGGREGATE KEY (`id`,`name`,`age`,`bitmap_id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job18 ON routine_test18
            COLUMNS(id, name, age, bitmap_id, device_id=to_bitmap(bitmap_id))
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad18",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select id, BITMAP_UNION_COUNT(pv) over(order by id) uv from(
        ->    select id, BITMAP_UNION(device_id) as pv
        ->    from routine_test18
        -> group by id
        -> ) final;
    +------+------+
    | id   | uv   |
    +------+------+
    |    1 |    1 |
    |    2 |    2 |
    |    3 |    3 |
    +------+------+
    3 rows in set (0.00 sec)
    ```

#### Импорт типа данных HLL {#import-hll-data-type}

1. Пример импортируемых данных:

    ```sql
    2022-05-05,10001,Test01,Beijing,windows
    2022-05-05,10002,Test01,Beijing,linux
    2022-05-05,10003,Test01,Beijing,macos
    2022-05-05,10004,Test01,Hebei,windows
    2022-05-06,10001,Test01,Shanghai,windows
    2022-05-06,10002,Test01,Shanghai,linux
    2022-05-06,10003,Test01,Jiangsu,macos
    2022-05-06,10004,Test01,Shaanxi,windows
    ```

2. Схема таблицы:

    ```sql
    create table demo.routine_test19 (
        dt        DATE,
        id        INT,
        name      VARCHAR(10),
        province  VARCHAR(10),
        os        VARCHAR(10),
        pv        hll hll_union
    )
    Aggregate KEY (dt,id,name,province,os)
    distributed by hash(id) buckets 10;
    ```

3. Команда импорта:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job19 ON routine_test19
            COLUMNS TERMINATED BY ",",
            COLUMNS(dt, id, name, province, os, pv=hll_hash(id))
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad19",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. Результат импорта:

    ```sql
    mysql> select * from routine_test19;
    +------------+-------+----------+----------+---------+------+
    | dt         | id    | name     | province | os      | pv   |
    +------------+-------+----------+----------+---------+------+
    | 2022-05-05 | 10001 | Test01   | Beijing     | windows | NULL |
    | 2022-05-06 | 10001 | Test01   | Shanghai    | windows | NULL |
    | 2022-05-05 | 10002 | Test01   | Beijing     | linux   | NULL |
    | 2022-05-06 | 10002 | Test01   | Shanghai    | linux   | NULL |
    | 2022-05-05 | 10004 | Test01   | Heibei      | windows | NULL |
    | 2022-05-06 | 10004 | Test01   | Shanxi      | windows | NULL |
    | 2022-05-05 | 10003 | Test01   | Beijing     | macos   | NULL |
    | 2022-05-06 | 10003 | Test01   | Jiangsu     | macos   | NULL |
    +------------+-------+----------+----------+---------+------+
    8 rows in set (0.01 sec)

    mysql> SELECT HLL_UNION_AGG(pv) FROM routine_test19;
    +-------------------+
    | hll_union_agg(pv) |
    +-------------------+
    |                 4 |
    +-------------------+
    1 row in set (0.01 sec)
    ```

### Аутентификация Kafka {#kafka-security-authentication}

Doris поддерживает следующие способы доступа с использованием протоколов безопасности Kafka. Ниже приведены примеры импорта и описания параметров.

#### Импорт данных Kafka с аутентификацией SSL {#import-kafka-data-with-ssl-authentication}

Пример команды импорта:

```sql
CREATE ROUTINE LOAD demo.kafka_job20 ON routine_test20
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad21",
            "property.security.protocol" = "ssl",
            "property.ssl.ca.location" = "FILE:ca.pem",
            "property.ssl.certificate.location" = "FILE:client.pem",
            "property.ssl.key.location" = "FILE:client.key",
            "property.ssl.key.password" = "ssl_passwd"
        );
```

Описание параметров:

| Параметр                         | Описание                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| property.security.protocol        | Используемый протокол безопасности. В примере выше используется SSL. |
| property.ssl.ca.location          | Путь к сертификату CA (центра сертификации).  |
| property.ssl.certificate.location | (Требуется только при включённой аутентификации клиентов на сервере Kafka) Путь к открытому ключу клиента. |
| property.ssl.key.location         | (Требуется только при включённой аутентификации клиентов на сервере Kafka) Путь к закрытому ключу клиента. |
| property.ssl.key.password         | (Требуется только при включённой аутентификации клиентов на сервере Kafka) Пароль закрытого ключа клиента. |

#### Импорт данных Kafka с аутентификацией Kerberos {#import-kafka-data-with-kerberos-authentication}

Пример команды импорта:

```sql
CREATE ROUTINE LOAD demo.kafka_job21 ON routine_test21
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad21",
            "property.security.protocol" = "SASL_PLAINTEXT",
            "property.sasl.kerberos.service.name" = "kafka",
            "property.sasl.kerberos.keytab"="/opt/third/kafka/kerberos/kafka_client.keytab",
            "property.sasl.kerberos.principal" = "clients/stream.dt.local@EXAMPLE.COM"
        );
```

Описание параметров:

| Параметр                           | Описание                                         |
| ----------------------------------- | --------------------------------------------------- |
| property.security.protocol          | Используемый протокол безопасности. В примере выше используется SASL_PLAINTEXT. |
| property.sasl.kerberos.service.name | Задаёт имя службы брокера. По умолчанию — Kafka. |
| property.sasl.kerberos.keytab       | Путь к файлу keytab.                    |
| property.sasl.kerberos.principal    | Задаёт principal Kerberos.                   |

:::tip Совет
Рекомендуется задать `rdnbs=true` в `krb5.conf`. Иначе может возникнуть следующая ошибка: `Server kafka/15.5.4.68@EXAMPLE.COM not found in Kerberos database`
:::

#### Импорт из кластера Kafka с аутентификацией PLAIN {#import-a-kafka-cluster-with-plain-authentication}

Пример команды импорта:

```sql
CREATE ROUTINE LOAD demo.kafka_job22 ON routine_test22
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad22",
            "property.security.protocol"="SASL_PLAINTEXT",
            "property.sasl.mechanism"="PLAIN",
            "property.sasl.username"="admin",
            "property.sasl.password"="admin"
        );
```

Описание параметров:

| Параметр                  | Описание                                         |
| -------------------------- | --------------------------------------------------- |
| property.security.protocol | Используемый протокол безопасности. В примере выше используется SASL_PLAINTEXT. |
| property.sasl.mechanism    | Задаёт PLAIN в качестве механизма аутентификации SASL. |
| property.sasl.username     | Имя пользователя SASL.                                  |
| property.sasl.password     | Пароль SASL.                                  |

#### Подключение к службе Kafka с шифрованием и аутентификацией (пример StreamNative) {#connect-to-a-kafka-service-with-encrypted-authentication-streamnative-example}

Пример доступа к службе обмена сообщениями StreamNative:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(user_id, name, age)
FROM KAFKA (
    "kafka_broker_list" = "pc-xxxx.aws-mec1-test-xwiqv.aws.snio.cloud:9093",
    "kafka_topic" = "my_topic",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "PLAIN",
    "property.sasl.username" = "user",
    "property.sasl.password" = "token:eyJhbxxx",
    "property.group.id" = "my_group_id_1",
    "property.client.id" = "my_client_id_1",
    "property.enable.ssl.certificate.verification" = "false"
);
```

:::caution Примечание
- Если на стороне BE не настроен путь к сертификату доверенного CA, задайте `"property.enable.ssl.certificate.verification" = "false"`, чтобы пропустить проверку сертификата сервера.
- В противном случае настройте путь к сертификату доверенного CA: `"property.ssl.ca.location" = "/path/to/ca-cert.pem"`.
:::

### Импорт из одного потока в несколько таблиц {#single-stream-multi-table-import}

Создайте задачу Routine Load из Kafka с динамическим выбором нескольких таблиц под именем `test1` для базы данных `example_db`. Укажите `group.id` и `client.id`, получайте данные из всех разделов автоматически по умолчанию и начинайте подписку с позиции, на которой доступны данные (`OFFSET_BEGINNING`).

Предположим, нужно импортировать данные из Kafka в таблицы `tbl1` и `tbl2` базы данных `example_db`. Можно создать задачу Routine Load с именем `test1`, чтобы импортировать данные топика Kafka `my_topic` в обе таблицы `tbl1` и `tbl2`:

```sql
CREATE ROUTINE LOAD example_db.test1
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

В этом случае данные в Kafka должны содержать имя таблицы. В настоящее время динамическое имя таблицы можно извлечь только из Value сообщения Kafka, и данные должны соответствовать следующему формату. Для JSON: `table_name|{"col1": "val1", "col2": "val2"}`, где `tbl_name` — имя таблицы, а `|` — разделитель между именем таблицы и её данными. Для данных CSV формат аналогичен, например: `table_name|val1,val2,val3`.

:::caution Примечание
Указанное здесь `table_name` должно точно совпадать с именем таблицы в Doris, иначе импорт завершится ошибкой. Динамический выбор таблицы не поддерживает `column_mapping`.
:::

### Импорт в строгом режиме {#strict-mode-import}

Создайте задачу Routine Load из Kafka с именем `test1` для таблицы `example_tbl` в базе данных `example_db`, включив строгий режим:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
PRECEDING FILTER k1 = 1,
WHERE k1 < 100 and k2 like "%doris%"
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic"
);
```

## Часто задаваемые вопросы (FAQ) {#frequently-asked-questions-faq}

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Error diagnosis -->

### Что делать, если задание Routine Load автоматически переходит в состояние PAUSED? {#what-should-i-do-if-a-routine-load-job-automatically-enters-the-paused-state}

Обычно это вызвано проблемами качества данных или ошибками на стороне Kafka:

1. Выполните `SHOW ROUTINE LOAD FOR <job_name>`, чтобы просмотреть `ReasonOfStateChanged` и `ErrorLogUrls`.
2. При наличии некорректных данных при необходимости увеличьте `max_filter_ratio` и `max_error_number`.
3. При ошибках Kafka убедитесь, что брокер и топик доступны, затем выполните `RESUME ROUTINE LOAD` для восстановления работы.

### Как устранить ошибку `Offset out of range` или `out of range`? {#how-to-handle-the-offset-out-of-range-or-out-of-range-error}

Обычно это означает, что записанное смещение уже удалено из Kafka в соответствии с политикой хранения:

1. Приостановите задание: `PAUSE ROUTINE LOAD FOR <job_name>`.
2. С помощью `ALTER ROUTINE LOAD` задайте для `kafka_offsets` допустимую позицию (например, `OFFSET_BEGINNING` или конкретное смещение).
3. Выполните `RESUME ROUTINE LOAD`, чтобы восстановить работу задания.

### Что делать при ошибке `Server kafka/xxx@EXAMPLE.COM not found in Kerberos database`? {#server-kafkaxxxexamplecom-not-found-in-kerberos-database}

При аутентификации Kerberos задайте `rdnbs=true` в `krb5.conf`.

### Что делать при ошибке `Server certificate verification failed` или других ошибках SSL? {#server-certificate-verification-failed-or-other-ssl-errors}

Если на стороне BE не настроен сертификат доверенного CA, задайте `"property.enable.ssl.certificate.verification" = "false"` или явно укажите `"property.ssl.ca.location" = "/path/to/ca-cert.pem"`.

### Почему желаемый параллелизм (`desired_concurrent_number`) не применяется? {#the-desired-concurrency-desired_concurrent_number-does-not-take-effect}

Фактический параллелизм определяется минимальным из следующих трёх значений:

```text
min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)
```

Проверьте количество разделов топика Kafka и параметр конфигурации FE `max_routine_load_task_concurrent_num`.

### Как использовать старую версию Kafka (< 0.10.0.0)? {#how-to-use-an-older-kafka-version--01000}

Задайте `kafka_broker_version_fallback` в конфигурации BE или укажите совместимую версию через `property.broker.version.fallback` при создании задания.

### Как указать целевую таблицу при импорте из одного потока в несколько таблиц? {#how-to-specify-the-target-table-for-single-stream-multi-table-import}

Value сообщения Kafka должно содержать имя таблицы в формате `table_name|<data>`, причём имя должно точно совпадать с именем таблицы в Doris. Динамический выбор таблицы не поддерживает `column_mapping`.

### Как просмотреть некорректные данные, которые не удалось импортировать? {#how-to-view-the-dirty-data-that-failed-to-import}

Выполните `SHOW ROUTINE LOAD FOR <job_name>` и проверьте поле `ErrorLogUrls` в результате. Откройте этот URL в браузере или с помощью `wget`, чтобы получить образец отфильтрованных ошибочных данных и причину ошибки.

### Нужно ли приостанавливать задание Routine Load перед изменением? {#must-i-pause-a-routine-load-job-before-modifying-it}

Да. Команда `ALTER ROUTINE LOAD` требует, чтобы задание находилось в состоянии `PAUSED`. Последовательность изменения: `PAUSE ROUTINE LOAD` -> `ALTER ROUTINE LOAD` -> `RESUME ROUTINE LOAD`.

## Дополнительная помощь {#more-help}

- Справочник SQL: [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)
- В командной строке клиента выполните `HELP ROUTINE LOAD`, чтобы получить дополнительную справочную информацию.
