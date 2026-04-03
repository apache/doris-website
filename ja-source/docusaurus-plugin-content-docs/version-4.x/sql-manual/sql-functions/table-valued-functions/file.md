---
{
  "title": "FILE",
  "description": "FileTable値関数（tvf）は、S3、HDFS、LOCALなどのtable関数のラッパーです。",
  "language": "ja"
}
---
## 説明

FileTableバリューファンクション（tvf）は、[S3](./s3.md)、[HDFS](./hdfs.md)、[LOCAL](local.md)などのtable関数のラッパーであり、異なるストレージシステム上のファイル内容にアクセスするための統一されたインターフェースを提供します。

この関数はバージョン3.1.0以降でサポートされています。

## 構文

```sql
FILE(
    {StorageProperties},
    {FileFormatProperties}
)
```
- `{StorageProperties}`

    StoragePropertiesセクションは、ストレージシステムに関連する接続と認証情報を入力するために使用されます。詳細については、[Supported Storage システム]セクションを参照してください。

- `{FileFormatProperties}`

    FileFormatPropertiesセクションは、CSV区切り文字などのファイル形式に関連するプロパティを入力するために使用されます。詳細については、[Supported File Formats]セクションを参照してください。

## Supported Storage システム

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
### HDFS Storage へのアクセス

```sql
select * from file(
    "fs.hdfs.support" = "true",
    "uri" = "hdfs://path/to/file.csv",
    "fs.defaultFS" = "hdfs://localhost:9000",
    "hadoop.username" = "doris",
    "format" = "csv"
);
```
### Local Storageへのアクセス

```sql
select * from file(
    "fs.local.support" = "true",
    "file_path" = "student.csv",
    "backend_id" = "10003",
    "format" = "csv"
);
```
### desc関数を使用したTable構造の表示

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
