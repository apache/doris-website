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
| Ускорение запросов | Используйте распределённый вычислительный движок Doris для прямого доступа к данным Hudi и ускорения запросов. |
| Интеграция данных | Читайте данные Hudi и записывайте их во внутренние таблицы Doris или выполняйте операции ZeroETL с помощью вычислительного движка Doris. |
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

  В разделе MetaStoreProperties указываются сведения о подключении и аутентификации для службы метаданных Metastore. Подробнее см. в разделе [Поддерживаемые службы метаданных].

* `[StorageProperties]`

  В разделе StorageProperties указываются сведения о подключении и аутентификации для системы хранения. Подробнее см. в разделе [Поддерживаемые системы хранения].

* `[CommonProperties]`

  В разделе CommonProperties указываются общие свойства. См. раздел [Общие свойства] в документе [Обзор каталогов данных](../catalog-overview.md).

* `{HudiProperties}`

  | Имя параметра                   | Прежнее имя                | Описание                                                                                                                                                  | Значение по умолчанию |
  | ------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
  | `hudi.use_hive_sync_partition`  | `use_hive_sync_partition`  | Использовать ли сведения о разделах, уже синхронизированные с Hive Metastore. Если установлено true, сведения о разделах будут получены непосредственно из Hive Metastore. В противном случае они будут получены из файла метаданных в файловой системе. Получение сведений из Hive Metastore эффективнее, но пользователи должны обеспечить синхронизацию последних метаданных с Hive Metastore. | false |

## Кеш метаданных {#meta-cache}

Для повышения производительности доступа к внешним источникам данных Apache Doris кеширует метаданные Hudi. Метаданные включают структуру таблиц (Schema), сведения о разделах, FS View и объекты Meta Client.

:::tip
В версиях до Doris 4.1.x кеширование метаданных управляется преимущественно глобальными параметрами конфигурации FE. Подробнее см. в разделе [Кеш метаданных](../meta-cache.md).
Начиная с Doris 4.1.x, кеш внешних метаданных Hudi настраивается с помощью унифицированных ключей `meta.cache.*`.
:::

### Настройка свойств кеша (4.1.x+) {#meta-cache-unified-model}

Для записей кеша Hudi используется формат ключей конфигурации `meta.cache.hudi.<entry>.{enable,ttl-second,capacity}`. Сейчас размер кешей Hudi ограничивается количеством записей; параметр `max-weight` на уровне отдельного типа записей не поддерживается. См. раздел [Управление памятью кеша внешних метаданных](../external-meta-cache-memory-management).

| Свойство | Пример | Значение |
|---|---|---|
| `enable` | `true/false` | Включать ли этот модуль кеша. |
| `ttl-second` | `600`, `0`, `-1` | `0` отключает кеш (вступает в силу немедленно и позволяет увидеть последние данные); `-1` означает, что срок действия не ограничен; другие положительные целые числа задают TTL в секундах, отсчитываемый от времени доступа. |
| `capacity` | `10000` | Максимальное количество записей в кеше. `0` отключает кеш. |

**Условия работы:** Кеш модуля действует только при выполнении условий `enable=true`, `ttl-second != 0` и `capacity > 0`.

### Модули кеша {#meta-cache-unified-modules}

Hudi Catalog включает следующие модули кеша:

| Модуль (`<entry>`) | Префикс ключа свойства | Кешируемое содержимое и влияние |
|---|---|---|
| `schema` | `meta.cache.hudi.schema.` | Кеширует структуру таблиц. Влияет на актуальность отображаемых сведений о столбцах таблицы. Если отключён, последняя Schema загружается при каждом запросе. |
| `partition` | `meta.cache.hudi.partition.` | Кеширует метаданные разделов Hudi. Используется для обнаружения и отсечения разделов. |
| `fs_view` | `meta.cache.hudi.fs_view.` | Кеширует метаданные представления файловой системы Hudi. |
| `meta_client` | `meta.cache.hudi.meta_client.` | Кеширует объекты Hudi Meta Client. Сокращает повторную загрузку метаданных Hudi. |

### Сопоставление и преобразование устаревших параметров {#meta-cache-mapping}

В версии 4.1.x и более поздних рекомендуется использовать унифицированные ключи. Ниже приведено соответствие между устаревшими свойствами Catalog и унифицированными ключами 4.1.x+:

| Устаревший ключ свойства | Унифицированный ключ 4.1.x+ | Описание |
|---|---|---|
| `schema.cache.ttl-second` | `meta.cache.hudi.schema.ttl-second` | Срок действия кеша структуры таблиц |

### Рекомендации {#meta-cache-best-practices}

* **Доступ к последним данным в реальном времени**: Если каждый запрос должен видеть последние изменения данных или схемы таблиц Hudi, можно задать для `ttl-second` в модуле `schema` или `partition` значение `0`.
  ```sql
  -- Disable partition metadata cache to detect the latest partition changes in Hudi tables
  ALTER CATALOG hudi_ctl SET PROPERTIES ("meta.cache.hudi.partition.ttl-second" = "0");
  ```
* **Оптимизация производительности**: Начиная с Doris 4.1.4, успешное изменение свойств Catalog сбрасывает контекст выполнения Catalog и очищает инициализированные записи во всех движках кеша метаданных, к которым обращается этот Catalog. При следующем обращении Doris создаёт их заново с новым контекстом и конфигурацией; выполняющиеся запросы не затрагиваются.

### Мониторинг {#meta-cache-unified-observability}

Метрики кеша доступны в системной таблице `information_schema.catalog_meta_cache_statistics`:

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'hudi_ctl' AND engine_name = 'hudi'
ORDER BY entry_name;
```

См. документацию этой системной таблицы: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

### Поддерживаемые версии Hudi {#supported-hudi-versions}

Текущая версия зависимости Hudi — 0.15. Рекомендуется обращаться к данным Hudi версии 0.14 и выше.

### Поддерживаемые типы запросов {#supported-query-types}

| Тип таблицы   | Поддерживаемые типы запросов                                              |
| ------------- | ------------------------------------------------------------------------ |
| Copy On Write | Запрос к снимку (Snapshot Query), Time Travel, инкрементальное чтение (Incremental Read) |
| Merge On Read | Запросы к снимкам (Snapshot Queries), запросы с оптимизацией чтения (Read Optimized Queries), Time Travel, инкрементальное чтение (Incremental Read) |

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

| Тип Hudi      | Тип Doris     | Комментарий                                               |
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
| other         | UNSUPPORTED   |                                                           |

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

### Простой запрос {#basic-query}

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

### Чтение исторических данных (Time Travel) {#time-travel}

Каждая операция записи в таблицу Hudi создаёт новый снимок. Doris поддерживает чтение указанного снимка таблицы Hudi. По умолчанию запросы читают только последний снимок.

Хронологию изменений указанной таблицы Hudi можно запросить с помощью табличной функции `hudi_meta()`:

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

### Инкрементальные запросы {#incremental-query}

Инкрементальное чтение (Incremental Read) позволяет запрашивать изменения данных за указанный период времени и возвращает итоговое состояние данных на конец этого периода.

Для поддержки Incremental Read Doris предоставляет синтаксис `@incr`:

```sql
SELECT * from hudi_table@incr('beginTime'='xxx', ['endTime'='xxx'], ['hoodie.read.timeline.holes.resolution.policy'='FAIL'], ...);
```

* `beginTime`

  Обязательный параметр. Формат времени должен соответствовать официальной документации Hudi для [hudi\_table\_changes](https://hudi.apache.org/docs/0.14.0/quick-start-guide/#incremental-query); поддерживается значение "earliest".

* `endTime`

  Необязательный параметр. По умолчанию используется последнее значение commitTime.

В функцию `@incr` можно добавить дополнительные параметры, совместимые с [параметрами чтения Spark](https://hudi.apache.org/docs/0.14.0/configurations#Read-Options).

Просмотрев план выполнения с помощью `desc`, можно увидеть, что Doris преобразует `@incr` в предикаты, передаваемые в `VHUDI_SCAN_NODE`:

```text
|   0:VHUDI_SCAN_NODE(113)                                                                                            |
|      table: lineitem_mor                                                                                            |
|      predicates: (_hoodie_commit_time[#0] > '20240311151019723'), (_hoodie_commit_time[#0] <= '20240311151606605') |
|      inputSplitNum=1, totalFileSize=13099711, scanRanges=1              
```

## Часто задаваемые вопросы {#faq}

1. Запрос блокируется при использовании Java SDK для чтения инкрементальных данных через JNI

    Добавьте `-Djol.skipHotspotSAAttach=true` в `JAVA_OPTS_FOR_JDK_17` или `JAVA_OPTS` в файле `be.conf`.

## Приложение {#appendix}

### Журнал изменений {#change-log}

| Версия Doris | Поддержка функций                              |
| ------------- | ---------------------------------------------- |
| 2.1.8/3.0.4   | Зависимость Hudi обновлена до 0.15. Добавлен Hadoop Hudi JNI Scanner. |
