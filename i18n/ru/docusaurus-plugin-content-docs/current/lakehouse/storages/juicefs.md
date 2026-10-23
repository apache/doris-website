---
{
    "title": "JuiceFS | Хранилища",
    "language": "ru",
    "description": "В этом документе описаны параметры, необходимые для доступа к JuiceFS. Эти параметры применяются к:",
    "sidebar_label": "JuiceFS"
}
---

# JuiceFS {#juicefs}

:::tip Поддерживается начиная с
Doris 4.0.2
:::

[JuiceFS](https://juicefs.com) — высокопроизводительная распределённая файловая система с открытым исходным кодом, разработанная для облачной среды. Она полностью совместима с HDFS API. Doris обрабатывает схему `jfs://` как совместимую с HDFS, поэтому для доступа к данным в JuiceFS можно использовать тот же подход, что и для HDFS.

В этом документе описаны параметры, необходимые для доступа к JuiceFS. Эти параметры применяются к:

* Свойствам Catalog
* Свойствам табличной функции (Table Valued Function)
* Свойствам Broker Load
* Свойствам Export
* Свойствам Outfile

## Предварительные требования {#prerequisites}

Для доступа к JuiceFS необходим jar-файл клиента `juicefs-hadoop`. Начиная с Doris 4.0.2 система сборки автоматически загружает и включает этот jar-файл в пакет. Он размещается в следующих каталогах:

- FE: `fe/lib/juicefs/`
- BE: `be/lib/java_extensions/juicefs/`

При ручном развёртывании скачайте `juicefs-hadoop-<version>.jar` из [Maven Central](https://repo1.maven.org/maven2/io/juicefs/juicefs-hadoop/) и поместите его в перечисленные выше каталоги.

## Обзор параметров {#parameter-overview}

Поскольку JuiceFS совместима с HDFS, она использует те же параметры аутентификации, что и HDFS. Кроме того, доступны следующие параметры, специфичные для JuiceFS:

| Имя свойства | Описание | Обязательное |
| --- | --- | --- |
| fs.defaultFS | URI файловой системы по умолчанию, например `jfs://cluster`. | Да |
| fs.jfs.impl | Класс реализации Hadoop FileSystem. Необходимо задать значение `io.juicefs.JuiceFileSystem`. | Да |
| juicefs.\<cluster\>.meta | Адрес движка метаданных JuiceFS, например `redis://127.0.0.1:6379/1` или `mysql://user:pwd@(host:port)/db`. Замените `<cluster>` на имя кластера из URI, указанного в `fs.defaultFS`. | Да |

Описание параметров аутентификации HDFS (Simple или Kerberos) см. в документации [HDFS](./hdfs.md).

Все свойства с префиксом `juicefs.` передаются базовому клиенту JuiceFS для Hadoop.

## Примеры конфигурации {#example-configurations}

### Catalog с Hive Metastore {#catalog-with-hive-metastore}

```sql
CREATE CATALOG jfs_hive PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://<hms_host>:9083',
    'fs.defaultFS' = 'jfs://cluster',
    'fs.jfs.impl' = 'io.juicefs.JuiceFileSystem',
    'juicefs.cluster.meta' = 'redis://127.0.0.1:6379/1',
    'hadoop.username' = 'doris'
);
```

### Broker Load {#broker-load}

```sql
LOAD LABEL example_db.label1
(
    DATA INFILE("jfs://cluster/path/to/data/*")
    INTO TABLE `my_table`
)
WITH BROKER
(
    "fs.defaultFS" = "jfs://cluster",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1",
    "hadoop.username" = "doris"
);
```

### Табличная функция (Table Valued Function) {#table-valued-function}

```sql
SELECT * FROM TABLE(
    "uri" = "jfs://cluster/path/to/file.parquet",
    "format" = "parquet",
    "fs.jfs.impl" = "io.juicefs.JuiceFileSystem",
    "juicefs.cluster.meta" = "redis://127.0.0.1:6379/1"
);
```

## Рекомендации по использованию {#best-practices}

* Убедитесь, что jar-файл `juicefs-hadoop` размещён на **всех** узлах FE и BE.
* Свойство `juicefs.<cluster>.meta` должно соответствовать имени кластера в URI `jfs://`. Например, если `fs.defaultFS = jfs://mycluster`, свойство метаданных должно называться `juicefs.mycluster.meta`.
* JuiceFS поддерживает несколько движков метаданных (Redis, MySQL, TiKV, SQLite и другие). Выбирайте движок с учётом масштаба системы и требований к доступности.
* Настройки HDFS, такие как аутентификация Kerberos, параметры HA nameservice и файлы конфигурации Hadoop, совместимы с JuiceFS.
