---
{
    "title": "FILE",
    "language": "ru",
    "description": "Табличная функция File (tvf) представляет собой обёртку над такими табличными функциями, как S3, HDFS и LOCAL,"
}
---

## Описание {#description}

Табличная функция File (tvf) представляет собой обёртку над такими табличными функциями, как [S3](./s3.md), [HDFS](./hdfs.md) и [LOCAL](local.md), и предоставляет единый интерфейс для доступа к содержимому файлов в различных системах хранения.

Эта функция поддерживается начиная с версии 3.1.0.

## Синтаксис {#syntax}

```sql
FILE(
    {StorageProperties},
    {FileFormatProperties}
)
```

- `{StorageProperties}`

    В разделе StorageProperties указываются сведения о подключении к системе хранения и аутентификации. Подробности см. в разделе [Поддерживаемые системы хранения].

- `{FileFormatProperties}`

    В разделе FileFormatProperties указываются параметры форматов файлов, например разделители CSV. Подробности см. в разделе [Поддерживаемые форматы файлов].

## Поддерживаемые системы хранения {#supported-storage-systems}

* [ hdfs](../../../lakehouse/storages/hdfs.md)

* [ aws s3](../../../lakehouse/storages/s3.md)

* [ google cloud storage](../../../lakehouse/storages/gcs.md)

* [ Alibaba Cloud OSS](../../../lakehouse/storages/aliyun-oss.md)

* [ Tencent Cloud COS](../../../lakehouse/storages/tencent-cos.md)

* [ Huawei Cloud OBS](../../../lakehouse/storages/huawei-obs.md)

* [ MINIO](../../../lakehouse/storages/minio.md)

## Поддерживаемые форматы файлов {#supported-file-formats}

* [Parquet](../../../lakehouse/file-formats/parquet.md)

* [ORC](../../../lakehouse/file-formats/orc.md)

* [Text/CSV/JSON](../../../lakehouse/file-formats/text.md)

## Примеры {#examples}

### Доступ к хранилищу S3 {#accessing-s3-storage}

```sql
select * from file(
    "fs.s3.support" = "true",
    "uri" = "s3://bucket/file.csv",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "endpoint",
    "s3.region" = "region",
    "format" = "csv"
);
```

### Доступ к хранилищу HDFS {#accessing-hdfs-storage}

```sql
select * from file(
    "fs.hdfs.support" = "true",
    "uri" = "hdfs://path/to/file.csv",
    "fs.defaultFS" = "hdfs://localhost:9000",
    "hadoop.username" = "doris",
    "format" = "csv"
);
```

### Доступ к локальному хранилищу {#accessing-local-storage}

```sql
select * from file(
    "fs.local.support" = "true",
    "file_path" = "student.csv",
    "backend_id" = "10003",
    "format" = "csv"
);
```

### Использование desc function для просмотра структуры таблицы {#using-desc-function-to-view-table-structure}

```sql
desc function file(
    "fs.s3.support" = "true",
    "uri" = "s3://bucket/file.csv",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.endpoint" = "endpoint",
    "s3.region" = "region",
    "format" = "csv"
);
``` 
