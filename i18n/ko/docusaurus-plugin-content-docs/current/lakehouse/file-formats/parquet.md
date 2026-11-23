---
{
    "title": "Parquet | 파일 형식",
    "language": "ko",
    "description": "이 문서는 Doris의 Parquet 파일 형식 읽기 및 쓰기 지원을 소개합니다. 다음 기능에 적용됩니다:",
    "sidebar_label": "Parquet"
}
---

# Parquet {#parquet}

이 문서는 Doris의 Parquet 파일 형식 읽기 및 쓰기 지원을 소개합니다. 다음 기능에 적용됩니다:

* Catalog에서 데이터 읽기 및 쓰기.
* Table Valued Functions를 사용한 데이터 읽기.
* Broker Load를 사용한 데이터 읽기.
* Export를 통한 데이터 쓰기.
* Outfile을 통한 데이터 쓰기.

## INT96 타임스탬프 디코딩 {#int96-timestamp-decoding}

Parquet `INT96`은 시간대 표시 없이 날짜와 시간 필드를 저장합니다. 따라서 FileScannerV2는 기본적으로 SQL 세션 시간대에 따라 값을 이동시키지 않고 원래의 시계상 시각을 유지합니다. 예를 들어 원시 값 `2021-01-01 10:11:00`은 `10:11:00`으로 유지되며, 이는 Catalog 스캔, 테이블 값 함수, Broker Load에서 `DATETIMEV2`에 매핑할 때도 마찬가지입니다.

이 동작은 `INT96`에만 적용됩니다. 타임스탬프 논리 유형이 지정된 Parquet `INT64` 값은 계속 논리 유형의 의미를 따릅니다. 이전 Hive 쓰기 프로그램이 알려진 시간대를 기준으로 `INT96` 값을 정규화했다면 `hive.parquet.time-zone`을 [Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility)에서 설정하세요. 외부 파일 테이블 값 함수도 이 속성을 허용합니다. 다른 FileScannerV2 진입점은 원래의 `INT96` 시계상 시각을 유지합니다. 단, Hudi는 예외입니다. Hudi는 네이티브 스캔과 JNI 스캔 모두에서 기존 SQL 세션 시간대 동작을 의도적으로 유지하며 `hive.parquet.time-zone`을 무시합니다.

`INT96` 열이 `TIMESTAMPTZ`에 매핑되면 Doris는 호환성 시간대를 적용하지 않고 UTC 시점을 유지합니다.

## UUID 유형 매핑 {#uuid-type-mapping}

읽기에서는 표준 빅 엔디언 바이트 순서로 저장되고 UUID가 지정된 `FIXED_LEN_BYTE_ARRAY(16)`을 일반 인코딩과 사전 인코딩 모두에서 지원합니다. dev 버전에서는 일반 Parquet TVF와 Iceberg Catalog가 UUID가 지정된 열을 기존 바이너리 매핑 옵션과 관계없이 네이티브 `UUID`에 직접 매핑합니다. Doris 4.1.5의 Parquet TVF는 여전히 `enable_mapping_varbinary`에 따라 표준 UUID 문자열 또는 VARBINARY를 반환하며, 해당 릴리스에서 Iceberg UUID는 `VARBINARY(16)`에 매핑됩니다.

ARRAY, MAP 또는 STRUCT에 중첩된 UUID 요소를 포함해 Doris `UUID` 열을 쓰면 UUID 논리 유형이 지정된 `FIXED_LEN_BYTE_ARRAY(16)`이 생성됩니다. 따라서 이 지정을 이해하는 다른 엔진은 값을 UUID로 복원할 수 있습니다. dev 버전은 중첩된 UUID 요소를 포함해 이러한 파일을 읽을 때 네이티브 UUID를 복원합니다.

OUTFILE 및 EXPORT의 전체 UUID 출력 매핑은 [내보낸 파일의 열 유형 매핑](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files)을 참조하세요.

## 지원되는 압축 형식 {#supported-compression-formats}

### 읽기 {#reading}

기존 파일을 읽을 때 다음 코덱을 지원합니다.

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

### 쓰기 {#writing}

| 쓰기 진입점 | 지원되는 코덱 |
| --- | --- |
| Hive / Iceberg Catalog | `plain`, `snappy`, `zstd`, `lz4`(4.1.3부터), `gzip`(4.2.0부터) |
| OUTFILE / EXPORT | `plain`, `snappy`, `gzip`, `brotli`, `zstd`, `lz4` |

`plain`은 압축하지 않음을 뜻합니다. Catalog 쓰기 설정과 기본값은 [Hive Catalog](../catalogs/hive-catalog.mdx) 및 [Iceberg Catalog](../catalogs/iceberg-catalog.mdx)를 참조하세요. OUTFILE / EXPORT는 `compress_type` 속성으로 코덱을 선택합니다.

## 페이지 인덱스 쓰기(dev 버전) {#writing-page-indexes-dev-version}

Doris는 OUTFILE 또는 EXPORT로 내보내거나 Parquet 형식으로 저장된 Hive 및 Iceberg 테이블에 데이터를 삽입할 때 Parquet `ColumnIndex`와 `OffsetIndex` 메타데이터를 선택적으로 쓸 수 있습니다. 이러한 인덱스를 지원하는 읽기 프로그램은 값을 기준으로 대상 페이지를 찾고 열 간에 행의 위치를 맞출 수 있습니다. 기존 파일은 변경되지 않습니다.

쓰기 문을 실행하기 전에 다음 세션 변수를 설정하세요. 이 변수는 Parquet 출력에만 적용되며 읽기 측의 페이지 인덱스 필터링을 활성화하지 않습니다.

| 변수 | 유형 | 기본값 | 동작 |
| --- | --- | --- | --- |
| `enable_parquet_write_page_index` | Boolean | `true` | 새 Parquet 파일에 페이지 인덱스를 씁니다. `ColumnIndex`는 해당 열의 통계 정보를 사용할 수 있어야 하며, `OffsetIndex`는 데이터 페이지 위치와 행 위치를 기록합니다. |
| `parquet_write_data_page_size` | Integer, 바이트 | `1048576`(1 MiB) | 압축 전 데이터 페이지의 목표 크기이며 범위는 `1`부터 `2147483647`까지입니다. 인덱스 쓰기 활성화 여부와 관계없이 적용됩니다. 행 그룹 크기나 사전 페이지 크기는 설정하지 않습니다. |

페이지 크기는 목표값이므로 단일 값이나 쓰기 배치로 인해 이 크기를 초과할 수 있습니다. Hive/Iceberg의 `lz4` 출력에 사용되는 Hadoop 프레임 형식 LZ4의 경우, Doris는 Hadoop 읽기 프로그램과의 호환성을 유지하기 위해 이 목표값을 `131072`바이트(128 KiB)로 제한합니다. Raw LZ4 출력에는 이 코덱별 제한이 적용되지 않습니다.

예를 들어 [OUTFILE](../../data-operate/export/outfile.md)에 설명된 대로 쓰기 가능한 S3 버킷과 자격 증명을 준비한 후, 인덱스를 포함하고 페이지 목표 크기가 256 KiB인 쿼리 결과를 내보낼 수 있습니다. 스토리지 설정의 자리표시자를 실제 설정으로 바꾸세요:

```sql
SET enable_parquet_write_page_index = true;
SET parquet_write_data_page_size = 262144;

SELECT 1 AS id, 'example' AS label
INTO OUTFILE 's3://example-bucket/export/result_'
FORMAT AS PARQUET
PROPERTIES (
    "s3.endpoint" = "https://s3.example.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "<access_key>",
    "s3.secret_key" = "<secret_key>"
);
```

생성된 파일에는 조건을 충족하는 열의 페이지 인덱스 메타데이터가 포함됩니다. Hive 또는 Iceberg에서는 `INSERT INTO` 또는 `INSERT OVERWRITE`를 실행하기 전에 같은 세션 변수를 설정하세요. 대상 테이블은 Parquet를 쓰도록 미리 설정되어 있어야 합니다. EXPORT에서는 작업을 제출하기 전에 설정하세요.

인덱스 쓰기의 기본값은 `true`이며, 이는 dev 버전 쓰기 프로그램의 기존 동작을 유지합니다. 이후 출력에서 페이지 인덱스를 생략하려면 쓰기 전에 옵션을 설정하세요:

```sql
SET enable_parquet_write_page_index = false;
```

현재 세션에서 기본값을 복원하려면 다음과 같이 설정하세요:

```sql
SET enable_parquet_write_page_index = true;
SET parquet_write_data_page_size = 1048576;
```

인덱스는 메타데이터와 쓰기 작업량을 늘립니다. 페이지가 작으면 특히 값이 모여 있을 때 선택적 읽기 성능이 향상될 수 있지만, 인덱스 항목과 페이지 헤더도 더 많아집니다. 효과는 데이터를 읽는 엔진과 데이터 분포에 따라 다르며, 인덱스를 활성화해도 쿼리가 반드시 빨라지는 것은 아닙니다. 읽기 프로그램은 선택적 인덱스를 사용하지 않고도 파일을 읽을 수 있습니다. 이러한 설정은 Parquet 형식 버전이나 데이터 페이지 버전을 변경하지 않습니다.

## 매개변수 {#parameters}

### 타임스탬프와 날짜 호환성(4.1.5부터) {#timestamp-and-date-compatibility}

4.1.5부터 Parquet 읽기와 쓰기는 시계상 시각과 시점의 차이를 유지합니다. 시간대가 없는 논리 타임스탬프는 `DATETIME`에 매핑되고, `isAdjustedToUTC=true`인 논리 타임스탬프는 `TIMESTAMPTZ`에 매핑됩니다. Catalog 호환성 속성이나 파일 TVF의 `enable_mapping_timestamp_tz=false`로는 후자를 다시 `DATETIME`에 매핑할 수 없습니다.

Parquet INT96에는 시간대 표시가 없으며 `DATETIME(6)`으로 추론됩니다. Hive Catalog와 파일 TVF는 INT96 쓰기 프로그램의 시간대를 지정하는 선택적 `hive.parquet.time-zone` 속성을 허용합니다. 기본값은 빈 문자열이며, 이때 시계상 시각이 유지됩니다. IANA 시간대 또는 `-12:00`부터 `+14:00`까지의 UTC 오프셋을 사용하세요. `UTC`와 `GMT`는 허용되지만 `CST`, `PRC` 같은 짧은 별칭은 거부됩니다. 쓰기 프로그램의 시간대를 아는 경우에만 설정하세요. 예: `"hive.parquet.time-zone" = "Asia/Shanghai"`.

4.1.5부터 Outfile과 Export의 `enable_int96_timestamps` 기본값은 `false`이며, 논리 INT64 타임스탬프를 씁니다. INT96이 필요한 소비자가 있을 때만 `true`로 설정하세요. Hive 테이블 쓰기에는 다른 호환성 설정이 적용됩니다. [Hive Catalog](../catalogs/hive-catalog.mdx)를 참조하세요.

이전 Doris 인코딩으로 작성되었으며 `0000-01-01`부터 `0000-02-28`까지의 값을 포함하는 DATE 파일은 작성 프로그램에 따라 마이그레이션해야 합니다. 읽기 프로그램만 업그레이드해서는 복구할 수 없습니다. [0년 DATE 파일 마이그레이션](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)을 참조하세요.

### 세션 변수 {#session-variables}

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Parquet Reader의 지연 구체화 활성화 여부를 제어합니다. 기본값은 true입니다.

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Doris는 Hive 테이블에서 Parquet 데이터 유형을 읽을 때 기본적으로 Hive 테이블의 열과 이름이 같은 Parquet 파일의 열에서 데이터를 읽습니다. 이 변수를 `false`로 설정하면 열 이름과 관계없이 Hive 테이블의 열 순서를 기준으로 Parquet 파일에서 데이터를 읽습니다. 이는 Hive의 `parquet.column.index.access` 변수와 비슷합니다. 이 매개변수는 최상위 열 이름에만 적용되며 Struct 내부의 열에는 적용되지 않습니다.

### BE 설정 {#be-configuration}

* `parquet_metadata_size_limit` (4.1.5부터)

    네이티브 Parquet V2 Reader의 직렬화된 푸터 메타데이터 크기 상한입니다. 기본값은 `268435456`바이트(256 MiB)이며, `0`보다 커야 하고 동적 업데이트를 지원합니다. Page Header 제한과는 별개입니다. 이 상한을 초과하면 `Parquet v2 footer size ... exceeds metadata limit ...`가 반환됩니다. [BE 설정](../../admin-manual/config/be-config.md#parquet_metadata_size_limit)을 참조하세요.

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader가 Page Index를 사용해 데이터를 필터링할지 결정합니다. 페이지 인덱스가 간혹 잘못된 데이터를 필터링하는 경우를 위한 디버깅 용도로만 사용합니다. 기본값은 false입니다.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page 헤더를 읽을 때 할당하는 최대 버퍼 크기입니다. 기본값은 1M입니다.

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group을 읽을 때 할당하는 최대 버퍼 크기입니다. 기본값은 128M입니다.

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 내 Column을 읽을 때 할당하는 최대 버퍼 크기입니다. 기본값은 8M입니다.
