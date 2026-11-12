---
{
    "title": "Многоуровневое хранение на локальных и удалённых носителях",
    "language": "ru",
    "description": "Удалённое хранилище Apache Doris автоматически переносит холодные данные в S3-совместимое объектное хранилище или HDFS, снижая затраты на локальное хранение. Подходит для многоуровневого хранения горячих и холодных данных.",
    "keywords": [
        "удалённое хранилище Doris",
        "многоуровневое хранение горячих и холодных данных",
        "архивирование холодных данных",
        "объектное хранилище S3",
        "хранилище HDFS",
        "Storage Policy",
        "cooldown_ttl"
    ]
}
---

<!-- Knowledge type: Feature overview + Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Hot-cold data tiering / Reducing storage costs / Historical data archiving -->


Многоуровневое хранение на локальных и удалённых носителях в Apache Doris позволяет разделять горячие и холодные данные. Холодные данные автоматически переносятся во внешние системы хранения (например, в S3-совместимое объектное хранилище или HDFS), что сокращает использование локальных дисков и общие затраты на хранение.

**Сценарии использования**:

- Архивирование исторических данных: перенос редко используемых исторических данных в недорогое объектное хранилище.
- Разделение горячих и холодных данных: хранение горячих данных на локальных SSD/HDD и перенос холодных данных в удалённое хранилище.
- Оптимизация затрат на хранение: замена локального высокопроизводительного хранилища объектным хранилищем для снижения TCO.

:::warning Примечание
Данные в удалённом хранилище имеют **только одну реплику**. Надёжность данных зависит от гарантий надёжности самого удалённого хранилища. Убедитесь, что в удалённом хранилище включены EC (кодирование со стираниями) или механизмы хранения нескольких реплик.
:::

## Быстрая навигация {#quick-navigation}

| Раздел | Содержание |
| --- | --- |
| [Хранение холодных данных в S3-совместимом хранилище](#storing-cold-data-on-s3-compatible-storage) | Перенос холодных данных в S3-совместимое объектное хранилище |
| [Хранение холодных данных в HDFS](#storing-cold-data-on-hdfs) | Перенос холодных данных в HDFS |
| [Перенос холодных данных существующих таблиц в удалённое хранилище](#cooling-down-existing-tables-to-remote-storage) | Настройка удалённого хранилища для существующих таблиц или разделов |
| [Настройка Compaction](#configuring-compaction) | Настройка поведения Compaction для удалённого хранилища |
| [Ограничения](#limitations) | Функциональные ограничения удалённого хранилища |
| [Управление пространством для холодных данных](#cold-data-space-management) | Просмотр и освобождение пространства, занятого холодными данными |
| [Оптимизация запросов и производительности](#query-and-performance-optimization) | Механизм локального Cache |
| [Часто задаваемые вопросы](#faq) | Устранение ошибок и замечания по настройке |

## Использование {#usage}

<!-- Knowledge type: Operation steps -->

Настройка удалённого хранилища состоит из трёх шагов: **создать Resource, создать Storage Policy и привязать политику при создании или изменении таблицы**.

### Хранение холодных данных в S3-совместимом хранилище {#storing-cold-data-on-s3-compatible-storage}

<!-- Applicable scenarios: Use AWS S3, MinIO, Alibaba Cloud OSS, Tencent Cloud COS, or other object storage -->

#### Шаг 1: Создайте S3 Resource {#step-1-create-an-s3-resource}

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000"
);
```

:::tip
При создании S3 Resource проверяется подключение к удалённому хранилищу, чтобы убедиться в правильности конфигурации Resource.
:::

#### Шаг 2: Создайте Storage Policy {#step-2-create-a-storage-policy}

Привяжите Resource, созданный на предыдущем шаге:

```sql
CREATE STORAGE POLICY test_policy
PROPERTIES(
    "storage_resource" = "remote_s3",
    "cooldown_ttl" = "1d"
);
```

#### Шаг 3: Используйте Storage Policy при создании таблицы {#step-3-use-the-storage-policy-when-creating-a-table}

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy
(
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning Примечание
Таблица Unique с `"enable_unique_key_merge_on_write" = "true"` не может использовать удалённое хранилище.
:::

### Хранение холодных данных в HDFS {#storing-cold-data-on-hdfs}

<!-- Applicable scenarios: An existing Hadoop/HDFS cluster is used as the cold data storage pool -->

#### Шаг 1: Создайте HDFS Resource {#step-1-create-an-hdfs-resource}

```sql
CREATE RESOURCE "remote_hdfs" PROPERTIES (
    "type" = "hdfs",
    "fs.defaultFS" = "fs_host:default_fs_port",
    "hadoop.username" = "hive",
    "hadoop.password" = "hive",
    "root_path" = "/my/root/path",
    "dfs.nameservices" = "my_ha",
    "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
    "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
    "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
    "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

#### Шаг 2: Создайте Storage Policy {#step-2-create-a-storage-policy-1}

```sql
CREATE STORAGE POLICY test_policy PROPERTIES (
    "storage_resource" = "remote_hdfs",
    "cooldown_ttl" = "300"
);
```

#### Шаг 3: Создайте таблицу, использующую Storage Policy {#step-3-create-a-table-that-uses-the-storage-policy}

```sql
CREATE TABLE IF NOT EXISTS create_table_use_created_policy (
    k1 BIGINT,
    k2 LARGEINT,
    v1 VARCHAR(2048)
)
UNIQUE KEY(k1)
DISTRIBUTED BY HASH (k1) BUCKETS 3
PROPERTIES(
    "enable_unique_key_merge_on_write" = "false",
    "storage_policy" = "test_policy"
);
```

:::warning Примечание
Таблица Unique с `"enable_unique_key_merge_on_write" = "true"` не может использовать удалённое хранилище.
:::

### Перенос холодных данных существующих таблиц в удалённое хранилище {#cooling-down-existing-tables-to-remote-storage}

<!-- Applicable scenarios: Existing tables or partitions that need remote storage capability added -->

Помимо создания новых таблиц, Doris также поддерживает настройку удалённого хранилища для существующих таблиц или разделов (PARTITION).

**Настройка удалённого хранилища для всей таблицы**:

```sql
ALTER TABLE create_table_not_have_policy SET ("storage_policy" = "test_policy");
```

**Настройка удалённого хранилища для определённого раздела**:

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy" = "test_policy");
```

:::tip Приоритет политик на уровне таблицы и разделов
Если при создании таблицы всей таблице и отдельным разделам назначены **разные** Storage Policy, политики на уровне разделов игнорируются, и все разделы таблицы используют политику на уровне таблицы.

Чтобы назначить определённому разделу другую политику, используйте показанный выше оператор `ALTER TABLE ... MODIFY PARTITION`.

Подробные сведения о синтаксисе см. в следующих разделах:

- [CREATE RESOURCE](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-RESOURCE)
- [CREATE STORAGE POLICY](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-POLICY)
- [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)
- [ALTER TABLE](../../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN)
:::

### Настройка Compaction {#configuring-compaction}

<!-- Knowledge type: Configuration parameters -->

Поведение Compaction для удалённого хранилища управляется параметрами BE:

| Параметр | По умолчанию | Единица измерения | Описание |
| --- | --- | --- | --- |
| `cold_data_compaction_thread_num` | 2 | количество | Число параллельных потоков Compaction для удалённого хранилища |
| `cold_data_compaction_interval_sec` | 1800 | секунды | Интервал выполнения Compaction для удалённого хранилища (по умолчанию 30 минут) |

## Ограничения {#limitations}

<!-- Knowledge type: Functional limitations -->

Удалённое хранилище имеет следующие ограничения:

- Таблицы, использующие удалённое хранилище, **не поддерживают резервное копирование**.
- Сведения о расположении удалённого хранилища (например, endpoint, bucket и path) **нельзя изменить**.
- Таблица модели Unique с включённым Merge-on-Write **не поддерживает** удалённое хранилище.
- Storage Policy можно создавать, изменять и удалять. **Перед удалением убедитесь, что ни одна таблица не ссылается** на эту Storage Policy.
- После назначения Storage Policy таблице **отменить её назначение нельзя**.

## Управление пространством для холодных данных {#cold-data-space-management}

### Просмотр объёма холодных данных {#viewing-cold-data-usage}

Просмотреть объём пространства, занятого холодными данными, можно двумя способами:

| Способ | Команда | Поле | Примечания |
| --- | --- | --- | --- |
| Способ 1 | `SHOW PROC '/backends'` | `RemoteUsedCapacity` | Просмотр общего размера объектов, загруженных каждым BE. **С небольшой задержкой** |
| Способ 2 | `SHOW TABLETS FROM tableName` | `RemoteDataSize` | Просмотр размера объектов, занимаемых каждым Tablet |

### Сборка мусора {#garbage-collection}

Сценарии, в которых в удалённом хранилище могут появиться ненужные данные:

1. Загрузка Rowset завершается ошибкой, но некоторые Segment уже успешно загружены.
2. Загруженные Rowset не согласованы между несколькими репликами.
3. После завершения Compaction остаются старые Rowset, участвовавшие в Compaction.

**Политика освобождения пространства**: ненужные данные удаляются не сразу. Интервал очистки задаётся параметром BE `remove_unused_remote_files_interval_sec`, значение которого по умолчанию составляет `21600` секунд (6 часов).

## Оптимизация запросов и производительности {#query-and-performance-optimization}

<!-- Knowledge type: Performance optimization -->

Для повышения производительности запросов и снижения затрат на вызовы API объектного хранилища Doris использует механизм **локального Cache**. При первом запросе к данным в удалённом хранилище Doris загружает их на локальный диск BE в качестве кэша.

**Характеристики Cache**:

- Кэш хранится на локальном диске BE и **не занимает оперативную память**.
- Кэш управляется по политике LRU (вытеснение данных, к которым дольше всего не обращались) и **не поддерживает TTL**.

Подробные сведения о настройке см. в документации [Data Cache](../../lakehouse/data-cache).

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

### Вопрос 1: Что делать, если при создании S3 Resource возникает ошибка `host must not be null`? {#q1-what-should-i-do-if-creating-an-s3-resource-reports-host-must-not-be-null}

**Сообщение об ошибке**:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Failed to create repository:
connect to s3 failed: Unable to marshall request to JSON: host must not be null.
```

**Причина**: по умолчанию S3 SDK использует доступ в стиле virtual-hosted, но в некоторых сервисах объектного хранения (например, MinIO) этот стиль не включён или не поддерживается.

**Решение**: добавьте `"use_path_style" = "true"` в конфигурацию Resource, чтобы принудительно использовать доступ в стиле path-style:

```sql
CREATE RESOURCE "remote_s3"
PROPERTIES
(
    "type" = "s3",
    "s3.endpoint" = "bj.s3.com",
    "s3.region" = "bj",
    "s3.bucket" = "test-bucket",
    "s3.root.path" = "path/to/root",
    "s3.access_key" = "bbb",
    "s3.secret_key" = "aaaa",
    "s3.connection.maximum" = "50",
    "s3.connection.request.timeout" = "3000",
    "s3.connection.timeout" = "1000",
    "use_path_style" = "true"
);
```

### Вопрос 2: Как влияет изменение параметров переноса холодных данных, таких как `cooldown_ttl`? {#q2-how-does-modifying-cooldown-parameters-such-as-cooldown_ttl-behave}

После изменения параметров переноса холодных данных изменения **применяются только к данным, которые ещё не перенесены в удалённое хранилище**. На данные, уже находящиеся в удалённом хранилище, они не влияют.

**Пример**: если изменить `cooldown_ttl` с 21 дня на 7 дней, данные, уже находящиеся в удалённом хранилище, **не будут перенесены обратно в локальное хранилище**.

### Вопрос 3: Какие модели таблиц не поддерживают удалённое хранилище? {#q3-which-table-models-do-not-support-remote-storage}

Таблица модели Unique не поддерживает удалённое хранилище при включённом Merge-on-Write (то есть при `"enable_unique_key_merge_on_write" = "true"`). Все остальные модели (Duplicate, Aggregate и Unique с отключённым MoW) его поддерживают.

### Вопрос 4: Как обеспечивается надёжность данных в удалённом хранилище? {#q4-how-is-the-data-reliability-of-remote-storage-guaranteed}

Doris хранит **только одну реплику** в удалённом хранилище, поэтому надёжность данных полностью зависит от самого удалённого хранилища. Для защиты данных рекомендуется включить в удалённом хранилище такие механизмы, как **EC (кодирование со стираниями)** или **хранение нескольких реплик**.
