---
{
    "title": "FILE",
    "language": "zh-CN",
    "description": "File 表函数（table-valued-function,tvf）是对 S3、HDFS 和 LOCAL 等表函数的封装，提供了一个统一的接口来访问不同存储系统上的文件内容。"
}
---

## 描述

File 表函数（table-valued-function,tvf）是对 [S3](./s3.md)、[HDFS](./hdfs.md) 和 [LOCAL](local.md) 等表函数的封装，提供了一个统一的接口来访问不同存储系统上的文件内容。

该函数自 3.1.0 版本支持。

## 语法

```sql
FILE(
    {StorageProperties},
    {FileFormatProperties}
)
```

- `{StorageProperties}`

    StorageProperties 部分用于填写存储系统相关的连接和认证信息。具体可参阅【支持的存储系统】部分。

- `{FileFormatProperties}`

    FileFormatProperties 部分用于填写文件格式相关的属性，如 CSV 的分割符等。具体可参阅【支持的文件格式】部分。

## 支持的存储系统

* [ hdfs](../../../lakehouse/storages/hdfs.md)

* [ aws s3](../../../lakehouse/storages/s3.md)

* [ google cloud storage](../../../lakehouse/storages/gcs.md)

* [ 阿里云 OSS](../../../lakehouse/storages/aliyun-oss.md)

* [ 腾讯云 COS](../../../lakehouse/storages/tencent-cos.md)

* [ 华为云 OBS](../../../lakehouse/storages/huawei-obs.md)

* [ MINIO](../../../lakehouse/storages/minio.md)

## 支持的文件格式

* [Parquet](../../../lakehouse/file-formats/parquet.md)

* [ORC](../../../lakehouse/file-formats/orc.md)

* [Text/CSV/JSON](../../../lakehouse/file-formats/text.md)

## 示例

### 访问 S3 存储

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

### 访问 HDFS 存储

```sql
select * from file(
    "fs.hdfs.support" = "true",
    "uri" = "hdfs://path/to/file.csv",
    "fs.defaultFS" = "hdfs://localhost:9000",
    "hadoop.username" = "doris",
    "format" = "csv"
);
```

### 访问本地存储

```sql
select * from file(
    "fs.local.support" = "true",
    "file_path" = "student.csv",
    "backend_id" = "10003",
    "format" = "csv"
);
```

### 使用 desc function 查看表结构

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
