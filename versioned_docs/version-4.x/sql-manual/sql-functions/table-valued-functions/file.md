---
{
    "title": "FILE",
    "language": "en"
}
---

## Description

The File table-valued-function (tvf) is a wrapper around table functions like [S3](./s3.md), [HDFS](./hdfs.md), and [LOCAL](local.md), providing a unified interface to access file contents on different storage systems.

This function is supported since version 3.1.0.

## Syntax

```sql
FILE(
    {StorageProperties},
    {FileFormatProperties}
)
```

- `{StorageProperties}`

    The StorageProperties section is used to fill in connection and authentication information related to the storage system. For details, please refer to the [Supported Storage Systems] section.

- `{FileFormatProperties}`

    The FileFormatProperties section is used to fill in properties related to file formats, such as CSV delimiters. For details, please refer to the [Supported File Formats] section.

## Supported Storage Systems

* [ hdfs](../../../lakehouse/storages/hdfs.md)

* [ aws s3](../../../lakehouse/storages/s3.md)

* [ google cloud storage](../../../lakehouse/storages/gcs.md)

* [ Alibaba Cloud OSS](../../../lakehouse/storages/aliyun-oss.md)

* [ Tencent Cloud COS](../../../lakehouse/storages/tencent-cos.md)

* [ Huawei Cloud OBS](../../../lakehouse/storages/huawei-obs.md)

* [ MINIO](../../../lakehouse/storages/minio.md)

## Supported File Formats

* [Parquet](../../../lakehouse/file-formats/parquet.md)

* [ORC](../../../lakehouse/file-formats/orc.md)

* [Text/CSV/JSON](../../../lakehouse/file-formats/text.md)

## Examples

### Accessing S3 Storage

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

### Accessing HDFS Storage

```sql
select * from file(
    "fs.hdfs.support" = "true",
    "uri" = "hdfs://path/to/file.csv",
    "fs.defaultFS" = "hdfs://localhost:9000",
    "hadoop.username" = "doris",
    "format" = "csv"
);
```

### Accessing Local Storage

```sql
select * from file(
    "fs.local.support" = "true",
    "file_path" = "student.csv",
    "backend_id" = "10003",
    "format" = "csv"
);
```

### Using desc function to View Table Structure

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

