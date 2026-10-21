---
{
  "title": "PARQUET_META",
  "language": "ko",
  "description": "parquet_meta 테이블 반환 함수(tvf)를 사용하면 데이터 페이지를 스캔하지 않고 Parquet 파일의 Footer 메타데이터를 읽을 수 있습니다. Row Group 통계, Schema, 파일 수준 메타데이터, KV 메타데이터, Bloom Filter 탐색 결과를 빠르게 확인할 수 있습니다."
}
---

`parquet_meta` 테이블 반환 함수(tvf)를 사용하면 데이터 페이지를 스캔하지 않고 Parquet 파일의 Footer 메타데이터를 읽을 수 있습니다. Row Group 통계, Schema, 파일 수준 메타데이터, KV 메타데이터, Bloom Filter 탐색 결과를 빠르게 확인할 수 있습니다.

> 이 기능은 실험적 기능이며, 4.1.0 버전부터 지원됩니다.

## 구문 {#syntax}

```sql
PARQUET_META(
    "uri" = "<uri>",
    "mode" = "<mode>",
    {OptionalParameters},
    {ConnectionParameters}
  );
```

- `uri`

  파일 경로입니다.

- `mode`

  메타데이터 쿼리 모드입니다. 선택 사항이며, 기본값은 `parquet_metadata`입니다. 사용 가능한 값은 "지원하는 모드" 절을 참조하세요.

- `{OptionalParameters}`

  - `column`: 모드가 `parquet_bloom_probe`일 때 필수이며, 탐색할 컬럼 이름을 지정합니다.
  - `value`: 모드가 `parquet_bloom_probe`일 때 필수이며, 탐색할 리터럴 값을 지정합니다.

- `{ConnectionParameters}`

  파일이 있는 스토리지 시스템에 접근하는 데 필요한 매개변수입니다. 자세한 내용은 다음 문서를 참조하세요.

  * [HDFS](../../../lakehouse/storages/hdfs.md)
  * [AWS S3](../../../lakehouse/storages/s3.md)
  * [Google Cloud Storage](../../../lakehouse/storages/gcs.md)
  * [Azure Blob](../../../lakehouse/storages/azure-blob.md)
  * [Alibaba Cloud OSS](../../../lakehouse/storages/aliyun-oss.md)
  * [Tencent Cloud COS](../../../lakehouse/storages/tencent-cos.md)
  * [Huawei Cloud OBS](../../../lakehouse/storages/huawei-obs.md)
  * [MinIO](../../../lakehouse/storages/minio.md)

## 지원하는 모드 {#supported-modes}

### `parquet_metadata` {#parquet_metadata}

기본 모드입니다.

이 모드를 사용하면 Parquet 파일에 포함된 메타데이터를 쿼리할 수 있습니다. 이 메타데이터는 컬럼별 통계 등 Parquet 파일의 다양한 내부 정보를 제공합니다. 이를 통해 Parquet 파일에서 어떤 유형의 건너뛰기 작업을 수행할 수 있는지 판단하고, 각 컬럼의 내용도 빠르게 파악할 수 있습니다.

| 필드 이름 | 타입 |
| --- | --- |
| file_name | STRING |
| row_group_id | BIGINT |
| row_group_num_rows | BIGINT |
| row_group_num_columns | BIGINT |
| row_group_bytes | BIGINT |
| column_id | BIGINT |
| file_offset | BIGINT |
| num_values | BIGINT |
| path_in_schema | STRING |
| type | STRING |
| stats_min | STRING |
| stats_max | STRING |
| stats_null_count | BIGINT |
| stats_distinct_count | BIGINT |
| stats_min_value | STRING |
| stats_max_value | STRING |
| compression | STRING |
| encodings | STRING |
| index_page_offset | BIGINT |
| dictionary_page_offset | BIGINT |
| data_page_offset | BIGINT |
| total_compressed_size | BIGINT |
| total_uncompressed_size | BIGINT |
| key_value_metadata | `MAP<VARBINARY, VARBINARY>` |
| bloom_filter_offset | BIGINT |
| bloom_filter_length | BIGINT |
| min_is_exact | BOOLEAN |
| max_is_exact | BOOLEAN |
| row_group_compressed_bytes | BIGINT |

### `parquet_schema` {#parquet_schema}

이 모드를 사용하면 Parquet 파일에 포함된 내부 Schema를 쿼리할 수 있습니다. 여기서 Schema는 Parquet 파일 메타데이터에 포함된 구조를 의미합니다.

| 필드 이름 | 타입 |
| --- | --- |
| file_name | VARCHAR |
| name | VARCHAR |
| type | VARCHAR |
| type_length | BIGINT |
| repetition_type | VARCHAR |
| num_children | BIGINT |
| converted_type | VARCHAR |
| scale | BIGINT |
| precision | BIGINT |
| field_id | BIGINT |
| logical_type | VARCHAR |

### `parquet_file_metadata` {#parquet_file_metadata}

이 모드를 사용하면 파일에서 사용하는 형식 버전과 암호화 알고리즘 등 파일 수준 메타데이터를 쿼리할 수 있습니다.

| 필드 이름 | 타입 |
| --- | --- |
| file_name | STRING |
| created_by | STRING |
| num_rows | BIGINT |
| num_row_groups | BIGINT |
| format_version | BIGINT |
| encryption_algorithm | STRING |
| footer_signing_key_metadata | STRING |

### `parquet_kv_metadata` {#parquet_kv_metadata}

이 모드를 사용하면 키-값 쌍으로 정의된 사용자 지정 메타데이터를 쿼리할 수 있습니다.

| 필드 이름 | 타입 |
| --- | --- |
| file_name | STRING |
| key | STRING |
| value | STRING |

### `parquet_bloom_probe` {#parquet_bloom_probe}

Doris는 Parquet 파일의 Bloom Filter를 사용한 데이터 필터링과 프루닝을 지원합니다. 이 모드는 지정한 컬럼과 컬럼 값을 Bloom Filter로 탐지할 수 있는지 확인하는 데 사용됩니다.

| 필드 이름 | 타입 |
| --- | --- |
| file_name | STRING |
| row_group_id | INT |
| bloom_filter_excludes | INT |

`bloom_filter_excludes`의 의미는 다음과 같습니다.

- `1`: Bloom Filter가 이 Row Group에 해당 값이 확실히 없다고 판단함
- `0`: Bloom Filter가 해당 값이 있을 수 있다고 판단함
- `-1`: 파일에 Bloom Filter가 없음

## 예제 {#examples}

- 로컬 파일(scheme 없음)

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "/path/to/test.parquet"
    );
    ```

- S3 파일(scheme + 스토리지 매개변수 포함)

    ```sql
    SELECT * FROM parquet_meta(
      "uri" = "s3://bucket/path/test.parquet",
      "mode" = "parquet_schema",
      "s3.access_key" = "...",
      "s3.secret_key" = "...",
      "s3.endpoint" = "s3.xxx.com",
      "s3.region" = "us-east-1"
    );
    ```

- 와일드카드(glob) 사용

    ```sql
    SELECT file_name FROM parquet_meta(
      "uri" = "s3://bucket/path/*meta.parquet",
      "mode" = "parquet_file_metadata"
    );
    ```

- `parquet_bloom_probe` 모드 사용

    ```sql
    select * from parquet_meta(
        "uri" = "${basePath}/bloommeta.parquet",
        "mode" = "parquet_bloom_probe",
        "column" = "col",
        "value" = 500,
        "s3.access_key" = "${ak}",
        "s3.secret_key" = "${sk}",
        "s3.endpoint" = "${endpoint}",
        "s3.region" = "${region}",
    );
    ```

## 참고 사항 및 제한 사항 {#notes-and-limitations}

- `parquet_meta`는 데이터 페이지를 읽지 않고 Parquet Footer 메타데이터만 읽으므로, 메타데이터를 빠르게 확인하는 데 적합합니다.
- 와일드카드(예: `*`, `{}`, `[]`)를 지원합니다. 일치하는 파일이 없으면 오류가 발생합니다.
