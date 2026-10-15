---
{
    "title": "FILE",
    "language": "ja",
    "description": "FILE テーブル値関数（TVF）は、S3、HDFS、LOCAL などのテーブル関数をラップします。"
}
---

## 説明

FILE テーブル値関数（TVF）は、[S3](./s3.md)、[HDFS](./hdfs.md)、[LOCAL](local.md) などのテーブル関数をラップし、異なるストレージシステム上のファイルの内容にアクセスするための統一されたインターフェースを提供します。

この関数はバージョン 3.1.0 以降でサポートされています。

## 構文

```sql
FILE(
    {StorageProperties},
    {FileFormatProperties}
)
```

- `{StorageProperties}`

    StorageProperties セクションには、ストレージシステムへの接続と認証に関する情報を指定します。詳細は、[サポートされるストレージシステム]セクションを参照してください。

- `{FileFormatProperties}`

    FileFormatProperties セクションには、CSV の区切り文字など、ファイル形式に関するプロパティを指定します。詳細は、[サポートされるファイル形式]セクションを参照してください。

## サポートされるストレージシステム

* [ hdfs](../../../lakehouse/storages/hdfs.md)

* [ aws s3](../../../lakehouse/storages/s3.md)

* [ google cloud storage](../../../lakehouse/storages/gcs.md)

* [ Alibaba Cloud OSS](../../../lakehouse/storages/aliyun-oss.md)

* [ Tencent Cloud COS](../../../lakehouse/storages/tencent-cos.md)

* [ Huawei Cloud OBS](../../../lakehouse/storages/huawei-obs.md)

* [ MINIO](../../../lakehouse/storages/minio.md)

## サポートされるファイル形式

* [Parquet](../../../lakehouse/file-formats/parquet.md)

* [ORC](../../../lakehouse/file-formats/orc.md)

* [Text/CSV/JSON](../../../lakehouse/file-formats/text.md)

## 例

### S3 ストレージへのアクセス

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

### HDFS ストレージへのアクセス

```sql
select * from file(
    "fs.hdfs.support" = "true",
    "uri" = "hdfs://path/to/file.csv",
    "fs.defaultFS" = "hdfs://localhost:9000",
    "hadoop.username" = "doris",
    "format" = "csv"
);
```

### ローカルストレージへのアクセス

```sql
select * from file(
    "fs.local.support" = "true",
    "file_path" = "student.csv",
    "backend_id" = "10003",
    "format" = "csv"
);
```

### desc function を使用したテーブル構造の確認

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
