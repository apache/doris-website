---
{
    "title": "FILE",
    "language": "ko",
    "description": "File 테이블 반환 함수(tvf)는 S3, HDFS, LOCAL 등의 테이블 함수를 감싼 래퍼입니다."
}
---

## 설명 {#description}

File 테이블 반환 함수(tvf)는 [S3](./s3.md), [HDFS](./hdfs.md), [LOCAL](local.md) 등의 테이블 함수를 감싼 래퍼로, 다양한 스토리지 시스템의 파일 내용에 접근할 수 있는 통합 인터페이스를 제공합니다.

이 함수는 3.1.0 버전부터 지원됩니다.

## 구문 {#syntax}

```sql
FILE(
    {StorageProperties},
    {FileFormatProperties}
)
```

- `{StorageProperties}`

    StorageProperties 부분에는 스토리지 시스템의 연결 및 인증 정보를 입력합니다. 자세한 내용은 [지원하는 스토리지 시스템] 절을 참조하세요.

- `{FileFormatProperties}`

    FileFormatProperties 부분에는 CSV 구분자와 같은 파일 형식 관련 속성을 입력합니다. 자세한 내용은 [지원하는 파일 형식] 절을 참조하세요.

## 지원하는 스토리지 시스템 {#supported-storage-systems}

* [ hdfs](../../../lakehouse/storages/hdfs.md)

* [ aws s3](../../../lakehouse/storages/s3.md)

* [ google cloud storage](../../../lakehouse/storages/gcs.md)

* [ Alibaba Cloud OSS](../../../lakehouse/storages/aliyun-oss.md)

* [ Tencent Cloud COS](../../../lakehouse/storages/tencent-cos.md)

* [ Huawei Cloud OBS](../../../lakehouse/storages/huawei-obs.md)

* [ MINIO](../../../lakehouse/storages/minio.md)

## 지원하는 파일 형식 {#supported-file-formats}

* [Parquet](../../../lakehouse/file-formats/parquet.md)

* [ORC](../../../lakehouse/file-formats/orc.md)

* [Text/CSV/JSON](../../../lakehouse/file-formats/text.md)

## 예제 {#examples}

### S3 스토리지에 접근 {#accessing-s3-storage}

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

### HDFS 스토리지에 접근 {#accessing-hdfs-storage}

```sql
select * from file(
    "fs.hdfs.support" = "true",
    "uri" = "hdfs://path/to/file.csv",
    "fs.defaultFS" = "hdfs://localhost:9000",
    "hadoop.username" = "doris",
    "format" = "csv"
);
```

### 로컬 스토리지에 접근 {#accessing-local-storage}

```sql
select * from file(
    "fs.local.support" = "true",
    "file_path" = "student.csv",
    "backend_id" = "10003",
    "format" = "csv"
);
```

### desc function을 사용하여 테이블 구조 확인 {#using-desc-function-to-view-table-structure}

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
