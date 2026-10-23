---
{
    "title": "Hudi Catalog",
    "language": "ru",
    "description": "Hudi Catalog использует Hive Catalog. Подключаясь к Hive Metastore или службе метаданных, совместимой с Hive Metastore,"
}
---

Hudi Catalog использует Hive Catalog. Подключаясь к Hive Metastore или службе метаданных, совместимой с Hive Metastore, Doris может автоматически получать сведения о базах данных и таблицах Hudi и выполнять запросы к данным.

[Быстрый старт с Apache Doris и Apache Hudi](../best-practices/doris-hudi.md).

## Сценарии использования {#applicable-scenarios}

| Сценарий | Описание |
| -------- | ----------- |
| Ускорение запросов | Использование распределённого вычислительного движка Doris для прямого доступа к данным Hudi и ускорения запросов. |
| Интеграция данных | Чтение данных Hudi и запись во внутренние таблицы Doris или выполнение операций ZeroETL с помощью вычислительного движка Doris. |
| Обратная запись данных | Не поддерживается. |

## Настройка Catalog {#configuring-catalog}

### Синтаксис {#syntax}

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'hms', -- required
    'hive.metastore.uris' = '<metastore_thrift_url>', -- required
    {MetaStoreProperties},
    {StorageProperties},
    {HudiProperties},
    {CommonProperties}
);
```

* `[MetaStoreProperties]`

  В разделе MetaStoreProperties указываются параметры подключения и аутентификации для службы метаданных Metastore. Подробнее см. раздел [Поддерживаемые службы метаданных].

* `[StorageProperties]`

  В разделе StorageProperties указываются параметры подключения и аутентификации для системы хранения. Подробнее см. раздел [Поддерживаемые системы хранения].

* `[CommonProperties]`

  В разделе CommonProperties указываются общие свойства. См. раздел [Общие свойства] в документе [Обзор Data Catalog](../catalog-overview.md).

* `{HudiProperties}`

  | Имя параметра                  | Прежнее имя                | Описание                                                                                                                                               | Значение по умолчанию |
  | ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
  | `hudi.use_hive_sync_partition`  | `use_hive_sync_partition`  | Использовать ли сведения о разделах, уже синхронизированные с Hive Metastore. Если установлено true, сведения о разделах будут получены непосредственно из Hive Metastore. В противном случае они будут получены из файла метаданных в файловой системе. Получение сведений из Hive Metastore эффективнее, но пользователи должны убедиться, что актуальные метаданные синхронизированы с Hive Metastore. | false |

## Кэш метаданных {#meta-cache}

Чтобы повысить производительность доступа к внешним источникам данных, Apache Doris кэширует метаданные Hive Metastore, от которых зависят таблицы Hudi: объекты таблиц, имена разделов, объекты разделов и статистику столбцов.

:::tip
В версиях до Doris 4.1.x кэширование метаданных в основном управляется глобально с помощью параметров конфигурации FE. Подробнее см. [Кэш метаданных](../meta-cache.md).
Начиная с Doris 4.1.x внешний кэш метаданных Hudi Catalog настраивается с помощью унифицированных ключей `meta.cache.*`. Ниже описаны параметры текущей версии; в Doris 4.1.x и 4.2.x используется другой набор параметров, описанный в версии 4.x этой страницы.
:::

### Настройка свойств кэша {#meta-cache-unified-model}

Для каждого элемента кэша используется унифицированный формат ключей конфигурации: `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}`. В системной таблице кэши Hudi Catalog отображаются под именем движка `hudi`, однако это общие кэши Hive Metastore, для настройки которых используется идентификатор движка `hive`: `meta.cache.hive.<entry>.*`.

| Свойство | Пример | Значение |
|---|---|---|
| `enable` | `true/false` | Включать ли этот элемент кэша. |
| `ttl-second` | `600`, `0`, `-1` | `0` отключает элемент (вступает в силу немедленно и позволяет видеть актуальные данные); `-1` означает неограниченный срок хранения; другие положительные целые числа задают TTL в секундах с момента доступа. |
| `capacity` | `10000` | Максимальное количество записей в кэше. `0` отключает элемент. |
| `max-weight` | `1GB` | Поддерживается начиная с Doris 4.1.4. Необязательный лимит оценочного объёма памяти, удерживаемой элементом кэша. Должен быть положительным; `0` не допускается. Принимается только элементами, указанными ниже. |

**Условия включения:** Элемент кэша действует, когда `enable=true`, `ttl-second != 0` и `capacity > 0`. Лимит памяти на уровне всего FE, Catalog или отдельного элемента дополнительно ограничивает добавление записей с учётом оценочного потребления памяти; см. [Управление памятью внешнего кэша метаданных](../external-meta-cache-memory-management).

### Модули кэша {#meta-cache-unified-modules}

Hudi Catalog включает следующие элементы кэша. Все они поддерживают `max-weight`.

| Элемент (`<entry>`) | Префикс ключа свойства | `ENTRY_NAME` | Кэшируемые данные и влияние | Значения enable / TTL / capacity по умолчанию |
|---|---|---|---|---|
| `table` | `meta.cache.hive.table.` | `hive-table` | Объекты таблиц из Hive Metastore. | `true` / 86400 s / 10000 |
| `partition_names` | `meta.cache.hive.partition_names.` | `hive-partition-names` | Списки имён разделов. Влияние: обнаружение и отсечение разделов; если кэш отключён, новые разделы видны сразу. | `true` / 86400 s / 10000 |
| `partition` | `meta.cache.hive.partition.` | `hive-partition` | Объекты разделов, включая расположение и формат ввода. | `true` / 86400 s / 100000 |
| `column_stats` | `meta.cache.hive.column_stats.` | `hive-column-stats` | Статистика столбцов из Hive Metastore. | `true` / 86400 s / 10000 |

Схема столбцов таблиц Hudi кэшируется общим движком `default` (`meta.cache.default.schema.*`).

### Соответствие и преобразование устаревших параметров {#meta-cache-mapping}

| Устаревший ключ свойства | Унифицированный ключ | Описание |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.default.schema.ttl-second` и `meta.cache.hive.table.ttl-second` | Срок хранения кэшей схем и объектов таблиц |
| `partition.cache.ttl-second` | `meta.cache.hive.partition_names.ttl-second` | Срок хранения списков имён разделов |

### Рекомендации {#meta-cache-best-practices}

* **Доступ к актуальным данным в реальном времени**: Чтобы каждый запрос видел актуальные разделы таблиц Hudi, установите TTL кэша имён разделов в `0`.
  ```sql
  -- Disable the partition name cache to detect the latest partitions of Hudi tables
  ALTER CATALOG hudi_ctl SET PROPERTIES ("meta.cache.hive.partition_names.ttl-second" = "0");
  ```
* **Оптимизация производительности**: При успешном изменении свойства Catalog затронутые кэши метаданных сбрасываются и при следующем обращении создаются заново с новой конфигурацией. Изменение `meta.cache.max-weight` или `schema.cache.ttl-second` сбрасывает все кэши Catalog; изменение `meta.cache.<engine>.<entry>.*` сбрасывает кэши соответствующего движка. На уже выполняющиеся запросы это не влияет.

### Наблюдаемость {#meta-cache-unified-observability}

Метрики кэша можно просматривать в системной таблице `information_schema.catalog_meta_cache_statistics`. В поле `ENTRY_NAME` отображаются имена из таблицы выше, а строка движка `default` соответствует общему кэшу схем таблиц:

```sql
SELECT engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, max_weight, estimated_weight
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'hudi_ctl'
ORDER BY engine_name, entry_name;
```

См. документацию по этой системной таблице: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

### Поддерживаемые версии Hudi {#supported-hudi-versions}

Текущая версия зависимости Hudi — 0.15. Рекомендуется обращаться к данным Hudi версии 0.14 и выше.

### Поддерживаемые типы запросов {#supported-query-types}

| Тип таблицы    | Поддерживаемые типы запросов                                                    |
| ------------- | ------------------------------------------------------------------------ |
| Copy On Write | Запрос к снимку (Snapshot Query), Time Travel, инкрементальное чтение (Incremental Read)                            |
| Merge On Read | Запросы к снимкам (Snapshot Queries), запросы с оптимизацией чтения (Read Optimized Queries), Time Travel, инкрементальное чтение (Incremental Read)  |

### Поддерживаемые службы метаданных {#supported-metadata-services}

* [Hive Metastore](../metastores/hive-metastore.md)

### Поддерживаемые системы хранения {#supported-storage-systems}

* [HDFS](../storages/hdfs.md)
* [AWS S3](../storages/s3.md)
* [Google Cloud Storage](../storages/gcs.md)
* [Alibaba Cloud OSS](../storages/aliyun-oss.md)
* [Tencent Cloud COS](../storages/tencent-cos.md)
* [Huawei Cloud OBS](../storages/huawei-obs.md)
* [MINIO](../storages/minio.md)

### Поддерживаемые форматы данных {#supported-data-formats}

* [Parquet](../file-formats/parquet.md)
* [ORC](../file-formats/orc.md)

## Сопоставление типов столбцов {#column-type-mapping}

| Тип Hudi     | Тип Doris    | Примечание                                                   |
| ------------- | ------------- | --------------------------------------------------------- |
| boolean       | boolean       |                                                           |
| int           | int           |                                                           |
| long          | bigint        |                                                           |
| float         | float         |                                                           |
| double        | double        |                                                           |
| decimal(P, S) | decimal(P, S) |                                                           |
| bytes         | string        |                                                           |
| string        | string        |                                                           |
| date          | date          |                                                           |
| timestamp     | datetime(N)   | Автоматически сопоставляется с datetime(3) или datetime(6) в зависимости от точности |
| array         | array         |                                                           |
| map           | map           |                                                           |
| struct        | struct        |                                                           |
| прочие         | UNSUPPORTED   |                                                           |

## Примеры {#examples}

Создание Hudi Catalog аналогично созданию Hive Catalog. Дополнительные примеры см. в разделе [Hive Catalog](./hive-catalog.mdx).

```sql
CREATE CATALOG hudi_hms PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.0.1:7004',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:4007',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:4007',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

## Выполнение запросов {#query-operations}

### Базовый запрос {#basic-query}

После настройки Catalog можно выполнять запросы к его таблицам следующими способами:

```sql
-- 1. switch to catalog, use database and query
SWITCH hudi_ctl;
USE hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 2. use hudi database directly
USE hudi_ctl.hudi_db;
SELECT * FROM hudi_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM hudi_ctl.hudi_db.hudi_tbl LIMIT 10;
```

### Запросы Time Travel {#time-travel}

Каждая операция записи в таблицу Hudi создаёт новый снимок. Doris поддерживает чтение указанного снимка таблицы Hudi. По умолчанию запросы читают только последний снимок.

Временную шкалу указанной таблицы Hudi можно получить с помощью табличной функции `hudi_meta()`:

Эта табличная функция поддерживается начиная с версии 3.1.0.

```sql
SELECT * FROM hudi_meta(
    'table' = 'hudi_ctl.hudi_db.hudi_tbl',
    'query_type' = 'timeline'
);

+-------------------+--------+--------------------------+-----------+-----------------------+
| timestamp         | action | file_name                | state     | state_transition_time |
+-------------------+--------+--------------------------+-----------+-----------------------+
| 20241202171214902 | commit | 20241202171214902.commit | COMPLETED | 20241202171215756     |
| 20241202171217258 | commit | 20241202171217258.commit | COMPLETED | 20241202171218127     |
| 20241202171219557 | commit | 20241202171219557.commit | COMPLETED | 20241202171220308     |
| 20241202171221769 | commit | 20241202171221769.commit | COMPLETED | 20241202171222541     |
| 20241202171224269 | commit | 20241202171224269.commit | COMPLETED | 20241202171224995     |
| 20241202171226401 | commit | 20241202171226401.commit | COMPLETED | 20241202171227155     |
| 20241202171228827 | commit | 20241202171228827.commit | COMPLETED | 20241202171229570     |
| 20241202171230907 | commit | 20241202171230907.commit | COMPLETED | 20241202171231686     |
| 20241202171233356 | commit | 20241202171233356.commit | COMPLETED | 20241202171234288     |
| 20241202171235940 | commit | 20241202171235940.commit | COMPLETED | 20241202171236757     |
+-------------------+--------+--------------------------+-----------+-----------------------+
```

С помощью конструкции `FOR TIME AS OF` можно читать исторические версии данных по временной метке снимка. Формат времени соответствует документации Hudi. Примеры:

```sql
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07 17:20:37";
SELECT * FROM hudi_tbl FOR TIME AS OF "20221007172037";
SELECT * FROM hudi_tbl FOR TIME AS OF "2022-10-07";
```

Обратите внимание: таблицы Hudi не поддерживают конструкцию `FOR VERSION AS OF`. Попытка использовать этот синтаксис с таблицей Hudi приведёт к ошибке.

### Инкрементальный запрос {#incremental-query}

Инкрементальное чтение (Incremental Read) позволяет запрашивать изменения данных за указанный диапазон времени, возвращая итоговое состояние данных на конец этого периода.

Для поддержки инкрементального чтения Doris предоставляет синтаксис `@incr`:

```sql
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```

* `beginTime`

  Обязательный параметр. Формат времени должен соответствовать официальной документации Hudi по [hudi\_table\_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query); поддерживается значение "earliest".

* `endTime`

  Необязательный параметр, по умолчанию используется последнее значение commitTime.

В функцию `@incr` можно добавить дополнительные параметры, совместимые с [параметрами чтения Spark](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options).

Просмотрев план выполнения с помощью `desc`, можно увидеть, что Doris преобразует `@incr` в предикаты, передаваемые в `VHUDI_SCAN_NODE`:

```text
|   0:VHUDI_SCAN_NODE(113)                                                                                            |
|      table: lineitem_mor                                                                                            |
|      predicates: (_hoodie_commit_time[#0] > '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
|      inputSplitNum=1, totalFileSize=13099711, scanRanges=1              
```

## Часто задаваемые вопросы {#faq}

1. Запрос зависает при использовании Java SDK для чтения инкрементальных данных через JNI

    Добавьте `-Djol.skipHotspotSAAttach=true` в `JAVA_OPTS_FOR_JDK_17` или `JAVA_OPTS` в файле `be.conf`.

## Приложение {#appendix}

### История изменений {#change-log}

| Версия Doris | Поддерживаемые возможности                               |
| ------------- | ---------------------------------------------- |
| 2.1.8/3.0.4   | Версия зависимости Hudi обновлена до 0.15. Добавлен Hadoop Hudi JNI Scanner. |
