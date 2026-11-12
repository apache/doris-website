---
{
    "title": "SELECT INTO OUTFILE",
    "language": "ru",
    "description": "Как использовать SELECT INTO OUTFILE для синхронного экспорта результатов запросов Doris в S3, HDFS и другие хранилища, включая примеры для Parquet/ORC/CSV.",
    "keywords": [
        "SELECT INTO OUTFILE",
        "Doris export",
        "query result export",
        "export to S3",
        "export to HDFS",
        "Parquet export",
        "ORC export",
        "CSV export",
        "parallel export",
        "enable_parallel_outfile",
        "max_file_size",
        "success_file_name"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters -->
<!-- Applicable scenarios: Data export / Query result persistence / Offline analysis data delivery -->

В этом документе описано, как использовать команду `SELECT INTO OUTFILE` для синхронного экспорта результатов запросов Doris в объектное хранилище или HDFS в указанном формате файлов.

`SELECT INTO OUTFILE` — это **команда синхронного экспорта**, предоставляемая Doris. Она записывает результат запроса `SELECT` в объектное хранилище (S3/COS/OSS/OBS/GCS) или HDFS в таких форматах, как Parquet, ORC или CSV. К моменту возврата результата команды экспорт уже завершён.

- При успешном выполнении возвращается информация о количестве экспортированных файлов, их размере и путях к ним.
- При сбое возвращается сообщение об ошибке.

> Рекомендации по выбору между `SELECT INTO OUTFILE` и `EXPORT` приведены в разделе [Обзор экспорта](./export-overview.md).
> Полное описание команды приведено в разделе [Синтаксис SELECT INTO OUTFILE](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE).

## Сценарии применения {#applicable-scenarios}

<!-- Knowledge type: Architecture selection decision -->

`SELECT INTO OUTFILE` подходит для следующих сценариев экспорта данных:

| Тип сценария     | Описание                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Экспорт со сложными вычислениями | Экспортируемые данные требуют сложной обработки, например фильтрации, агрегации или соединений (JOIN). |
| Синхронная задача  | Рабочий процесс должен дождаться завершения экспорта, прежде чем выполнять последующие операции. |

### Ограничения {#limitations}

- Экспорт в сжатые текстовые форматы не поддерживается.
- Движок pipeline в версии 2.1 не поддерживает параллельный экспорт.

## Обзор возможностей {#capability-overview}

<!-- Knowledge type: Configuration parameters -->

### Поддерживаемые хранилища {#supported-storage-locations}

| Тип хранилища           | Поддерживаемые системы                                          |
| ---------------------- | --------------------------------------------------------- |
| Объектное хранилище         | Amazon S3, Tencent Cloud COS, Alibaba Cloud OSS, Huawei Cloud OBS, Google GCS |
| Распределённая файловая система | HDFS                                                     |
| Локальная файловая система      | Только для отладки; требуется включить вручную (см. приложение) |

### Поддерживаемые форматы файлов {#supported-file-formats}

- Parquet
- ORC
- csv
- csv\_with\_names
- csv\_with\_names\_and\_types

## Быстрое начало работы {#quick-start}

<!-- Knowledge type: Operation steps -->

### Шаг 1: Создание таблицы и загрузка данных {#step-1-create-a-table-and-load-data}

```sql
CREATE TABLE IF NOT EXISTS tbl (
    `c1` int(11) NULL,
    `c2` string NULL,
    `c3` bigint NULL
)
DISTRIBUTED BY HASH(c1) BUCKETS 20
PROPERTIES("replication_num" = "1");

insert into tbl values
    (1, 'doris', 18),
    (2, 'nereids', 20),
    (3, 'pipelibe', 99999),
    (4, 'Apache', 122123455),
    (5, null, null);
```

### Шаг 2: Экспорт в HDFS {#step-2-export-to-hdfs}

Экспортируйте результат запроса в каталог `hdfs://path/to/` в формате Parquet:

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://ip:port/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://ip:port",
    "hadoop.username" = "hadoop"
);
```

### Шаг 3: Экспорт в объектное хранилище {#step-3-export-to-object-storage}

Экспортируйте результат запроса в каталог `s3://bucket/export/` в формате ORC. Необходимо указать учётные данные для доступа, такие как `ak` и `sk`:

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx"
);
```

## Расширенные возможности {#advanced-capabilities}

### Включение параллельного экспорта (повышение эффективности экспорта) {#enable-parallel-export-improve-export-efficiency}

<!-- Applicable scenarios: Large data volume export / Performance tuning -->

Включите параллельный экспорт с помощью переменной сеанса `enable_parallel_outfile`:

```sql
SET enable_parallel_outfile=true;
```

| Аспект          | Описание                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| Принцип работы  | Использует несколько узлов BE и несколько потоков для одновременного экспорта результирующих данных. |
| Преимущество          | Значительно повышает общую эффективность экспорта.                            |
| Побочный эффект        | Может создавать больше файлов.                                                      |
| Когда не применяется | Для запросов с глобальной сортировкой параллельный экспорт не применяется, даже если этот параметр включён. |
| Как проверить, что он применяется | Если команда экспорта возвращает более одной строки, параллельный экспорт применяется. |

## Примеры типовых сценариев {#typical-scenario-examples}

### Сценарий 1: Экспорт в кластер HDFS с включённой высокой доступностью {#scenario-1-export-to-an-hdfs-cluster-with-high-availability-enabled}

<!-- Applicable scenarios: HA HDFS environment -->

Если в HDFS включена высокая доступность (HA), необходимо дополнительно указать настройки, связанные с nameservices и NameNodes:

```sql
SELECT c1, c2, c3 FROM tbl
INTO OUTFILE "hdfs://HDFS8000871/path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
    "fs.defaultFS" = "hdfs://HDFS8000871",
    "hadoop.username" = "hadoop",
    "dfs.nameservices" = "your-nameservices",
    "dfs.ha.namenodes.your-nameservices" = "nn1,nn2",
    "dfs.namenode.rpc-address.HDFS8000871.nn1" = "ip:port",
    "dfs.namenode.rpc-address.HDFS8000871.nn2" = "ip:port",
    "dfs.client.failover.proxy.provider.HDFS8000871" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

### Сценарий 2: Экспорт в кластер HDFS с включёнными HA и аутентификацией Kerberos {#scenario-2-export-to-an-hdfs-cluster-with-ha-and-kerberos-authentication-enabled}

<!-- Applicable scenarios: Kerberos secure authentication environment -->

Если в кластере HDFS включены и высокая доступность, и аутентификация Kerberos, используйте следующий пример SQL:

```sql
SELECT * FROM tbl
INTO OUTFILE "hdfs://path/to/result_"
FORMAT AS PARQUET
PROPERTIES
(
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

### Сценарий 3: Создание файла-маркера успешного экспорта {#scenario-3-generate-an-export-success-marker-file}

<!-- Applicable scenarios: Synchronous task integrity verification / Avoiding unknown status caused by network disconnection -->

**Контекст**: `SELECT INTO OUTFILE` — синхронная команда. Если соединение прервётся во время выполнения SQL, вы не сможете определить, завершился ли экспорт.

**Решение**: Используйте параметр `success_file_name`. После успешного экспорта в каталоге создаётся файл-маркер, аналогичный `_SUCCESS` в Hive. Проверив наличие этого файла, можно убедиться, что экспорт выполнен полностью.

В следующем примере результат запроса экспортируется в S3 в формате CSV, а после завершения создаётся файл-маркер с именем `SUCCESS`:

```sql
SELECT k1,k2,v1 FROM tbl1 LIMIT 100000
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "success_file_name" = "SUCCESS"
);
```

### Сценарий 4: Очистка целевого каталога перед экспортом {#scenario-4-clear-the-target-directory-before-export}

<!-- Applicable scenarios: Overwrite-style export / Periodic full replacement -->

Используйте параметр `delete_existing_files`, чтобы удалить существующие файлы в целевом каталоге перед экспортом:

```sql
SELECT * FROM tbl1
INTO OUTFILE "s3://bucket/export/result_"
FORMAT AS CSV
PROPERTIES
(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "column_separator" = ",",
    "line_delimiter" = "\n",
    "delete_existing_files" = "true"
);
```

**Условия и риски**:

| Пункт               | Описание                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Поведение           | Сначала удаляет все файлы и подкаталоги в `s3://bucket/export/`, затем экспортирует данные.       |
| Условия включения  | Необходимо добавить настройку `enable_delete_existing_files = true` в `fe.conf` и перезапустить FE. |
| Предупреждение о риске       | Эта операция удаляет данные во внешней системе. Она сопряжена с высоким риском, поэтому вы должны самостоятельно обеспечить корректность прав доступа и безопасность данных во внешней системе. |

### Сценарий 5: Управление размером отдельного экспортируемого файла {#scenario-5-control-the-size-of-a-single-exported-file}

Используйте параметр `max_file_size`, чтобы задать максимальный размер каждого экспортируемого файла:

```sql
SELECT * FROM tbl
INTO OUTFILE "s3://path/to/result_"
FORMAT AS ORC
PROPERTIES(
    "s3.endpoint" = "xxxxx",
    "s3.region" = "xxxxx",
    "s3.secret_key"="xxxx",
    "s3.access_key" = "xxxxx",
    "max_file_size" = "2048MB"
);
```

**Примечания**:

- Если итоговый объём данных не превышает 2 ГБ, создаётся только один файл.
- Если он превышает 2 ГБ, данные разделяются на несколько файлов.
- При разделении гарантируется, что каждая строка данных целиком хранится в одном файле, поэтому фактический размер файла может отличаться от `max_file_size`.

## Примечания {#notes}

<!-- Knowledge type: Configuration parameters / Troubleshooting -->

### Производительность и время ожидания {#performance-and-timeout}

| Тема                | Описание                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Из чего складывается время экспорта | `SELECT INTO OUTFILE` по сути является SQL-запросом, поэтому общее время = время выполнения запроса + время записи результирующего набора.        |
| Ограничение одного потока | Если параллельный экспорт не включён, результат запроса записывается одним узлом BE в одном потоке.           |
| Оптимизация производительности | Включите `enable_parallel_outfile` для использования параллельного экспорта, который может значительно сократить затраченное время.             |
| Время ожидания экспорта       | Время ожидания команды экспорта совпадает со временем ожидания запроса. При большом объёме данных его можно увеличить, задав подходящее значение `query_timeout`. |

### Управление файлами {#file-management}

- **Doris не управляет экспортированными файлами**: Как при успешном экспорте, так и при наличии файлов, оставшихся после сбоя, вы должны самостоятельно удалять их.
- **Проверка пути и файла не выполняется**: `SELECT INTO OUTFILE` не проверяет, существует ли файл или путь. Автоматическое создание пути и перезапись существующих файлов полностью определяются семантикой удалённой системы хранения.

### Данные и формат {#data-and-format}

- **Пустой результирующий набор**: Даже если результирующий набор запроса пуст, всё равно создаётся пустой файл.
- **Правило разделения файлов**: Каждая строка данных гарантированно хранится целиком в одном файле, поэтому размер файла может отличаться от `max_file_size`.
- **Функции, формирующие непечатные символы**: Результаты функций, таких как `BITMAP` и `HLL`, которые выводят непечатные символы, при экспорте в CSV записываются как `\N`.

## Приложение {#appendix}

### Экспорт в локальную файловую систему (только для отладки) {#export-to-the-local-file-system-debugging-only}

<!-- Applicable scenarios: Local debugging / Development verification -->
<!-- Knowledge type: Configuration parameters -->

:::caution
Эта функция предназначена только для локальной отладки и разработки. **Не используйте её в производственных средах**. Вы должны самостоятельно обеспечить корректность прав доступа и безопасность данных в каталоге экспорта.
:::

**Как включить**: Добавьте `enable_outfile_to_local=true` в `fe.conf` и перезапустите FE.

**Пример**: Экспортируйте все данные из таблицы `tbl` в локальную файловую систему в формате CSV (формат по умолчанию), используя `,` в качестве разделителя столбцов:

```sql
SELECT c1, c2 FROM db.tbl
INTO OUTFILE "file:///path/to/result_"
FORMAT AS CSV
PROPERTIES(
    "column_separator" = ","
);
```

**Особенности поведения**:

- Данные записываются на локальный диск узла BE.
- В среде с несколькими узлами BE данные распределяются между разными узлами BE в зависимости от параллелизма задачи экспорта.
- Файлы вида `result_c6df5f01bd664dde-a2168b019b6c2b3f_0.csv` создаются в каталоге `/path/to/` на узлах BE.
- IP-адреса конкретных узлов BE указаны в возвращаемом результате.

**Пример возвращаемого результата**:

```text
+------------+-----------+----------+--------------------------------------------------------------------------+
| FileNumber | TotalRows | FileSize | URL                                                                      |
+------------+-----------+----------+--------------------------------------------------------------------------+
|          1 |   1195072 |  4780288 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b3f_* |
|          1 |   1202944 |  4811776 | file:///172.20.32.136/path/to/result_c6df5f01bd664dde-a2168b019b6c2b40_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b43_* |
|          1 |   1198880 |  4795520 | file:///172.20.32.137/path/to/result_c6df5f01bd664dde-a2168b019b6c2b45_* |
+------------+-----------+----------+--------------------------------------------------------------------------+
```
