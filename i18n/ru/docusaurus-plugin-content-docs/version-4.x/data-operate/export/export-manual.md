---
{
    "title": "Export: асинхронный экспорт",
    "language": "ru",
    "description": "Используйте команду EXPORT для асинхронного экспорта данных таблиц или разделов Doris в HDFS, S3 или объектное хранилище с поддержкой форматов Parquet/ORC/CSV.",
    "keywords": [
        "Doris EXPORT",
        "асинхронный экспорт",
        "экспорт в S3",
        "экспорт в HDFS",
        "экспорт в Parquet",
        "экспорт в ORC",
        "экспорт в CSV",
        "SHOW EXPORT",
        "CANCEL EXPORT",
        "SELECT INTO OUTFILE"
    ]
}
---

<!-- Knowledge type: Operating procedure / Configuration parameters / Architectural selection decision -->
<!-- Applicable scenarios: Data export / Data archiving / Cross-system data movement -->

В этом документе описано, как использовать команду `EXPORT` для асинхронного экспорта данных, хранящихся в Doris, во внешнюю систему хранения.

`EXPORT` предоставляет в Doris возможность **асинхронного экспорта данных**. Команда экспортирует данные из указанной таблицы или раздела в объектное хранилище, HDFS или локальную файловую систему в заданном формате файлов.

Команда возвращает управление сразу после отправки задания. Проверить состояние задания можно с помощью `SHOW EXPORT`.

## Сценарии использования {#applicable-scenarios}

| Тип сценария                       | Рекомендация по использованию EXPORT | Описание                                                |
| ----------------------------------- | ---------------------- | ---------------------------------------------------------- |
| Экспорт одной большой таблицы      | Рекомендуется            | Требуются только простые условия фильтрации                 |
| Асинхронная отправка заданий         | Рекомендуется            | Команда сразу возвращает управление и не блокирует клиент |
| Экспорт набора результатов SELECT       | Не поддерживается          | Используйте [экспорт через OUTFILE](../../data-operate/export/outfile.md) |
| Экспорт в сжатые текстовые файлы         | Не поддерживается          | Текущая версия не поддерживает сжатые текстовые форматы |

Рекомендации по выбору между `SELECT INTO OUTFILE` и `EXPORT` приведены в разделе [Обзор экспорта](../../data-operate/export/export-overview.md).

Полный синтаксис команды `EXPORT` приведён в разделе [EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT).

## Обзор возможностей {#capability-overview}

### Поддерживаемые источники данных {#supported-data-sources}

`EXPORT` поддерживает экспорт следующих типов таблиц и представлений:

- Внутренние таблицы Doris
- Логические представления Doris
- Таблицы во внешних Catalog (например, внешние таблицы Hive)

### Поддерживаемые хранилища {#supported-storage-locations}

| Тип хранилища             | Поддерживаемые варианты                              |
| ------------------------ | --------------------------------------------------- |
| Объектное хранилище           | Amazon S3, Tencent Cloud COS, Alibaba Cloud OSS, Huawei Cloud OBS, Google GCS |
| Распределённая файловая система  | HDFS                                                |
| Локальная файловая система        | Только для локальной отладки и разработки; требуется включить вручную |

### Поддерживаемые форматы файлов {#supported-file-formats}

- Parquet
- ORC
- CSV
- csv\_with\_names
- csv\_with\_names\_and\_types

## Быстрый старт {#quick-start}

<!-- Knowledge type: Operating procedure -->

### Шаг 1: создание таблицы и загрузка данных {#step-1-create-a-table-and-load-data}

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

INSERT INTO tbl VALUES
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, NULL, NULL);
```

### Шаг 2: создание задания экспорта {#step-2-create-an-export-job}

#### Экспорт в HDFS {#export-to-hdfs}

Экспорт всех данных из таблицы `tbl` в HDFS в формате CSV по умолчанию с использованием `,` в качестве разделителя столбцов:

```sql
EXPORT TABLE tbl
TO "hdfs://host/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hdfs_host:port",
    "hadoop.username" = "hadoop"
);
```

#### Экспорт в объектное хранилище (S3) {#export-to-object-storage-s3}

Экспорт всех данных из таблицы `tbl` в объектное хранилище S3 в формате CSV по умолчанию с использованием `,` в качестве разделителя столбцов:

```sql
EXPORT TABLE tbl TO "s3://bucket/export/export_" 
PROPERTIES (
    "line_delimiter" = ","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### Шаг 3: проверка состояния задания экспорта {#step-3-check-the-export-job-status}

Используйте команду [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT), чтобы узнать ход выполнения и результат задания экспорта:

```sql
mysql> SHOW EXPORT\G
*************************** 1. row ***************************
      JobId: 143265
      Label: export_0aa6c944-5a09-4d0b-80e1-cb09ea223f65
      State: FINISHED
   Progress: 100%
   TaskInfo: {"partitions":[],"parallelism":5,"data_consistency":"partition","format":"csv","broker":"S3","column_separator":"\t","line_delimiter":"\n","max_file_size":"2048MB","delete_existing_files":"","with_bom":"false","db":"tpch1","tbl":"lineitem"}
       Path: s3://bucket/export/export_
 CreateTime: 2024-06-11 18:01:18
  StartTime: 2024-06-11 18:01:18
 FinishTime: 2024-06-11 18:01:31
    Timeout: 7200
   ErrorMsg: NULL
OutfileInfo: [
  [
    {
      "fileNumber": "1",
      "totalRows": "6001215",
      "fileSize": "747503989",
      "url": "s3://bucket/export/export_6555cd33e7447c1-baa9568b5c4eb0ac_*"
    }
  ]
]
1 row in set (0.00 sec)
```

Описание каждого столбца результата приведено в разделе [SHOW EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-EXPORT).

### Шаг 4: отмена задания экспорта (необязательно) {#step-4-cancel-an-export-job-optional}

Пока задание Export не завершилось успешно или с ошибкой, его можно отменить с помощью команды [CANCEL EXPORT](../../sql-manual/sql-statements/data-modification/load-and-export/CANCEL-EXPORT):

```sql
CANCEL EXPORT FROM dbName WHERE LABEL like "%export_%";
```

## Примеры расширенного использования {#advanced-usage-examples}

<!-- Knowledge type: Operating procedure -->

### Экспорт в отказоустойчивый кластер HDFS {#export-to-a-high-availability-hdfs-cluster}

Если в HDFS включена высокая доступность (HA), необходимо указать дополнительные параметры HA:

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### Экспорт в кластер HDFS с HA и аутентификацией Kerberos {#export-to-an-hdfs-cluster-with-ha-and-kerberos-authentication}

Если в кластере Hadoop включены и высокая доступность, и аутентификация Kerberos, используйте следующий пример SQL:

```sql
EXPORT TABLE tbl 
TO "hdfs://HDFS8000871/path/to/export_" 
PROPERTIES
(
    "line_delimiter" = ","
)
WITH HDFS (
    "fs.defaultFS"="hdfs://hacluster/",
    "hadoop.username" = "hadoop",
    "dfs.nameservices"="hacluster",
    "dfs.ha.namenodes.hacluster"="n1,n2",
    "dfs.namenode.rpc-address.hacluster.n1"="192.168.0.1:8020",
    "dfs.namenode.rpc-address.hacluster.n2"="192.168.0.2:8020",
    "dfs.client.failover.proxy.provider.hacluster"="org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider",
    "dfs.namenode.kerberos.principal"="hadoop/_HOST@REALM.COM",
    "hadoop.security.authentication"="kerberos",
    "hadoop.kerberos.principal"="doris_test@REALM.COM",
    "hadoop.kerberos.keytab"="/path/to/doris_test.keytab"
);
```

### Экспорт только указанных разделов {#export-only-specified-partitions}

Чтобы экспортировать только некоторые разделы внутренней таблицы Doris, например только разделы `p1` и `p2` таблицы `test`:

```sql
EXPORT TABLE test
PARTITION (p1,p2)
TO "s3://bucket/export/export_" 
PROPERTIES (
    "columns" = "k1,k2"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### Экспорт с фильтрацией по предикату {#export-with-predicate-filtering}

Используйте предложение `WHERE` для фильтрации данных и экспорта только строк, соответствующих условию. Например, экспортируйте только строки, для которых выполняется `k1 < 50`:

```sql
EXPORT TABLE test
WHERE k1 < 50
TO "s3://bucket/export/export_"
PROPERTIES (
    "columns" = "k1,k2",
    "column_separator"=","
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### Экспорт данных из внешних таблиц External Catalog {#export-data-from-external-catalog-external-tables}

`EXPORT` поддерживает экспорт данных из внешних таблиц External Catalog (например, внешних таблиц Hive):

```sql
-- Create a Hive Catalog
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083'
);

-- Export the Hive table
EXPORT TABLE hive_catalog.sf1.lineitem TO "s3://bucket/export/export_"
PROPERTIES(
    "format" = "csv",
    "max_file_size" = "1024MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

### Очистка целевого каталога перед экспортом {#clear-the-target-directory-before-export}

Используйте параметр `delete_existing_files`, чтобы очистить целевой каталог перед экспортом:

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB",
    "delete_existing_files" = "true"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

Условия включения и поведение:

- Если задано `"delete_existing_files" = "true"`, задание экспорта **сначала удаляет** все файлы и подкаталоги в каталоге `s3://bucket/export/`, а затем экспортирует данные.
- Чтобы этот параметр действовал, необходимо добавить `enable_delete_existing_files = true` в `fe.conf` и перезапустить FE.

:::caution
Эта операция удаляет данные во внешней системе и является **операцией высокого риска**. Самостоятельно обеспечьте контроль доступа и безопасность данных во внешней системе.
:::

### Управление размером отдельного файла экспорта {#control-the-size-of-a-single-export-file}

Используйте `max_file_size` для управления размером отдельного файла экспорта. Файлы, превышающие заданное значение, автоматически разбиваются:

```sql
EXPORT TABLE test TO "s3://bucket/export/export_"
PROPERTIES (
    "format" = "parquet",
    "max_file_size" = "512MB"
) WITH s3 (
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

Допустимый диапазон значений `max_file_size`:

| Диапазон версий                          | Минимум | Максимум   |
| -------------------------------------- | ------- | --------- |
| До 2.1.11 / до 3.0.7           | 5MB     | 2GB       |
| 2.1.11 и новее / 3.0.7 и новее     | 5MB     | Без ограничений |

## Примечания и рекомендации {#notes-and-best-practices}

<!-- Knowledge type: Best practices / Troubleshooting -->
<!-- Applicable scenarios: Production usage / Fault diagnosis -->

| Аспект                  | Рекомендации и примечания                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Объём данных на одно задание      | Рекомендуется ограничивать объём одного задания Export несколькими десятками GB. Большие таблицы экспортируйте партиями по разделам, чтобы избежать накопления ненужных файлов и повышенных затрат на повторные попытки |
| Влияние на системные ресурсы   | Задания Export сканируют данные и потребляют ресурсы ввода-вывода, что может увеличить задержку запросов                                         |
| Управление файлами после сбоя   | При сбое задания уже созданные файлы не удаляются автоматически; их необходимо удалить вручную            |
| Тайм-аут экспорта           | Очень большие объёмы данных могут привести к превышению времени ожидания. Можно увеличить время ожидания с помощью параметра `timeout` в команде Export и повторить попытку |
| Перезапуск FE или смена ведущего узла | Если во время выполнения FE перезапускается или происходит смена ведущего узла, задание завершается с ошибкой. Проверьте состояние с помощью `SHOW EXPORT` и отправьте задание повторно |
| Ограничение числа разделов    | Одно задание Export может экспортировать не более 2000 разделов. Можно изменить `maximum_number_of_export_partitions` в `fe.conf` и перезапустить FE |
| Проверка целостности данных     | После завершения экспорта проверьте число строк и корректность данных, чтобы убедиться в их качестве                     |

## Приложение {#appendix}

### Основные принципы {#basic-principles}

<!-- Knowledge type: Architectural principles -->

В основе выполнения заданий `EXPORT` лежит SQL-оператор `SELECT INTO OUTFILE`. Общая последовательность действий:

1. Пользователь отправляет задание `EXPORT`.
2. На основе экспортируемой таблицы Doris формирует один или несколько планов выполнения `SELECT INTO OUTFILE`.
3. Эти планы выполнения передаются в планировщик задач Doris Job Schedule.
4. Job Schedule автоматически планирует и выполняет задания, в результате чего создаются файлы экспорта.

### Экспорт в локальную файловую систему {#export-to-the-local-file-system}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Local debugging / Development environment -->

:::caution
Экспорт в локальную файловую систему предназначен **только для локальной отладки и разработки. Не используйте его в рабочей среде**. Самостоятельно обеспечьте контроль доступа и безопасность данных в каталоге экспорта.
:::

#### Как включить {#how-to-enable}

По умолчанию эта возможность отключена. Чтобы включить её:

1. Добавьте `enable_outfile_to_local=true` в `fe.conf`.
2. Перезапустите FE, чтобы настройка вступила в силу.

#### Пример использования {#usage-example}

Экспорт всех данных из таблицы `tbl` в локальную файловую систему в формате CSV по умолчанию с использованием `,` в качестве разделителя столбцов:

```sql
EXPORT TABLE db.tbl TO "file:///path/to/result_"
PROPERTIES (
  "format" = "csv",
  "line_delimiter" = ","
);
```

#### Распределение данных {#data-distribution}

- Данные записываются на локальные диски узлов BE.
- В среде с несколькими узлами BE данные распределяются между ними в соответствии с параллелизмом задания экспорта; каждый узел хранит часть данных.
- В примере выше файлы вида `result_7052bac522d840f5-972079771289e392_0.csv` создаются в каталоге `/path/to/` на узлах BE.

#### Определение конкретных узлов BE {#find-the-specific-be-nodes}

IP-адреса конкретных узлов BE можно найти в столбце `OutfileInfo` результата `SHOW EXPORT`:

```text
[
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.136/path/to/result_7052bac522d840f5-972079771289e392_*"
        }
    ], 
    [
        {
            "fileNumber": "1", 
            "totalRows": "0", 
            "fileSize": "8388608", 
            "url": "file:///172.20.32.137/path/to/result_22aba7ec933b4922-ba81e5eca12bf0c2_*"
        }
    ]
]
```
