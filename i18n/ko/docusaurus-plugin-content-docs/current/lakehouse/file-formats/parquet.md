---
{
    "title": "Parquet | 파일 형식",
    "language": "ko",
    "description": "이 문서에서는 Doris의 Parquet 파일 형식 읽기 및 쓰기 지원을 소개합니다. 다음 기능에 적용됩니다:",
    "sidebar_label": "Parquet"
}
---

# Parquet {#parquet}

이 문서에서는 Doris의 Parquet 파일 형식 읽기 및 쓰기 지원을 소개합니다. 다음 기능에 적용됩니다:

* Catalog에서 데이터 읽기 및 쓰기.
* Table Valued Functions를 사용한 데이터 읽기.
* Broker Load를 사용한 데이터 읽기.
* Export 중 데이터 쓰기.
* Outfile을 사용한 데이터 쓰기.

## INT96 타임스탬프 디코딩 {#int96-timestamp-decoding}

Parquet `INT96`은 시간대 주석 없이 날짜 및 시간 필드를 저장합니다. 따라서 FileScannerV2는 기본적으로 SQL 세션 시간대를 적용해 값을 이동시키지 않고 원시 wall-clock 값을 보존합니다. 예를 들어 원시 `2021-01-01 10:11:00`은 `10:11:00`으로 유지된 채 `DATETIMEV2`에 매핑되며, Catalog 스캔, table-valued function 및 Broker Load에서도 이 동작이 적용됩니다.

이 동작은 `INT96`에만 적용됩니다. 타임스탬프 논리 유형이 있는 Parquet `INT64` 값은 계속 논리 유형 의미를 따릅니다. 레거시 Hive writer가 알려진 시간대로 `INT96` 값을 정규화했다면 [Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility)에서 `hive.parquet.time-zone`을 구성하십시오. 외부 파일 table-valued function도 해당 속성을 허용합니다. 다른 FileScannerV2 진입점은 원시 `INT96` wall-clock 값을 보존하지만 Hudi는 예외입니다. Hudi는 native 및 JNI 스캔 모두에서 기존 SQL 세션 시간대 동작을 의도적으로 유지하고 `hive.parquet.time-zone`을 무시합니다.

`INT96` 열이 `TIMESTAMPTZ`에 매핑되면 Doris는 호환 시간대를 적용하는 대신 UTC instant를 보존합니다.

## UUID 유형 매핑 {#uuid-type-mapping}

UUID 주석이 있는 `FIXED_LEN_BYTE_ARRAY(16)` 읽기를 지원하며, canonical big-endian 바이트 순서의 일반 인코딩과 사전 인코딩을 모두 지원합니다. dev 버전에서는 일반 Parquet TVF와 Iceberg Catalog가 UUID 주석이 있는 열을 레거시 바이너리 매핑 옵션과 무관하게 native `UUID`로 직접 매핑합니다. Doris 4.1.5 Parquet TVF는 `enable_mapping_varbinary`에 따라 canonical UUID 문자열 또는 VARBINARY를 여전히 반환하며, Iceberg UUID는 해당 릴리스에서 `VARBINARY(16)`으로 매핑됩니다.

Doris `UUID` 열을 쓸 때(ARRAY, MAP 또는 STRUCT에 중첩된 UUID 요소 포함) UUID 논리 주석이 있는 `FIXED_LEN_BYTE_ARRAY(16)`이 생성되므로, 해당 주석을 이해하는 다른 엔진은 값을 UUID로 복원할 수 있습니다. dev 버전은 이러한 파일을 읽을 때 중첩된 UUID 요소를 포함해 native UUID를 복원합니다.

OUTFILE 및 EXPORT의 전체 UUID 출력 매핑은 [내보낸 파일의 열 유형 매핑](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files)을 참조하십시오.

## 지원되는 압축 형식 {#supported-compression-formats}

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## 페이지 인덱스 쓰기(Dev 버전) {#writing-page-indexes-dev-version}

Doris는 OUTFILE 또는 EXPORT로 내보내거나 Parquet로 저장된 Hive 및 Iceberg 테이블에 삽입할 때 선택적으로 Parquet `ColumnIndex` 및 `OffsetIndex` 메타데이터를 쓸 수 있습니다. 이러한 인덱스를 지원하는 reader는 값으로 후보 페이지를 찾고 열 전체에서 행 정렬을 유지할 수 있습니다. 기존 파일은 변경되지 않습니다.

쓰기 문을 실행하기 전에 다음 세션 변수를 설정하십시오. 이 변수들은 Parquet 출력에만 적용되며 읽기 측의 페이지 인덱스 필터링을 활성화하지 않습니다.

| 변수 | 유형 | 기본값 | 동작 |
| --- | --- | --- | --- |
| `enable_parquet_write_page_index` | Boolean | `true` | 새 Parquet 파일에 페이지 인덱스를 씁니다. `ColumnIndex`는 해당 열에 통계를 사용할 수 있을 때 작성되며, `OffsetIndex`는 데이터 페이지 위치와 행 위치를 기록합니다. |
| `parquet_write_data_page_size` | Integer, 바이트 | `1048576`(1 MiB) | 압축되지 않은 데이터 페이지의 목표 크기이며 범위는 `1`에서 `2147483647`까지입니다. 인덱스 쓰기를 활성화하거나 비활성화해도 적용됩니다. Row Group 크기나 dictionary-page 크기는 설정하지 않습니다. |

페이지 크기는 목표값이므로 단일 값이나 쓰기 배치가 이를 초과할 수 있습니다. Hive/Iceberg `lz4` 출력에 사용되는 Hadoop 프레임 형식 LZ4의 경우, Doris는 Hadoop reader와의 호환성을 유지하기 위해 이 목표값을 `131072`바이트(128 KiB)로 제한합니다. Raw LZ4 출력에는 이 코덱별 제한이 적용되지 않습니다.

예를 들어 [OUTFILE](../../data-operate/export/outfile.md)에 설명된 대로 쓰기 가능한 S3 버킷과 자격 증명을 준비한 후, 인덱스와 256 KiB 페이지 목표 크기를 사용해 쿼리 결과를 내보낼 수 있습니다. 저장소 자리 표시자를 실제 구성으로 바꾸십시오.

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

생성된 파일에는 해당 열에 대한 페이지 인덱스 메타데이터가 포함됩니다. Hive 또는 Iceberg의 경우 `INSERT INTO` 또는 `INSERT OVERWRITE` 전에 세션에서 동일한 변수를 설정하십시오. 대상 테이블은 이미 Parquet 쓰기를 사용하도록 구성되어 있어야 합니다. EXPORT의 경우 작업을 제출하기 전에 설정하십시오.

인덱스 쓰기의 기본값은 `true`이며 기존 dev writer 동작을 유지합니다. 이후 출력에서 페이지 인덱스를 생략하려면 쓰기 전에 다음 옵션을 설정하십시오.

```sql
SET enable_parquet_write_page_index = false;
```

현재 세션에서 기본값을 복원하려면 다음을 실행하십시오.

```sql
SET enable_parquet_write_page_index = true;
SET parquet_write_data_page_size = 1048576;
```

인덱스는 메타데이터와 쓰기 측 작업을 추가합니다. 페이지가 작으면 선택적 읽기 성능이 향상될 수 있으며, 특히 값이 클러스터링된 경우 효과가 있지만 인덱스 항목과 페이지 헤더도 더 많이 생성됩니다. 이점은 사용하는 엔진과 데이터 분포에 따라 달라지므로 인덱스를 활성화해도 쿼리 속도가 빨라진다고 보장할 수 없습니다. reader는 선택적 인덱스를 사용하지 않고도 파일을 읽을 수 있습니다. 이 설정은 Parquet 형식 버전이나 데이터 페이지 버전을 변경하지 않습니다.

## 매개변수 {#parameters}

### 타임스탬프 및 날짜 호환성(4.1.5부터) {#timestamp-and-date-compatibility}

4.1.5부터 Parquet 읽기 및 쓰기는 wall-clock 시간과 instant의 구분을 보존합니다. 시간대가 없는 논리 타임스탬프는 `DATETIME`에 매핑되고, `isAdjustedToUTC=true`인 논리 타임스탬프는 `TIMESTAMPTZ`에 매핑됩니다. Catalog 호환성 속성이나 파일 TVF의 `enable_mapping_timestamp_tz=false`로는 후자의 `DATETIME` 매핑을 복원할 수 없습니다.

Parquet INT96에는 시간대 주석이 없으며 `DATETIME(6)`으로 추론됩니다. Hive Catalog와 파일 TVF는 INT96 writer 시간대를 지정하는 선택적 `hive.parquet.time-zone` 속성을 허용합니다. 기본값은 빈 문자열이며 wall-clock 시간을 보존합니다. IANA 시간대 또는 `-12:00`에서 `+14:00` 사이의 UTC 오프셋을 사용하십시오. `UTC`와 `GMT`는 허용되지만 `CST`, `PRC`와 같은 짧은 별칭은 거부됩니다. writer 시간대를 알고 있을 때만 설정하십시오. 예를 들면 `"hive.parquet.time-zone" = "Asia/Shanghai"`와 같습니다.

4.1.5부터 Outfile 및 Export의 `enable_int96_timestamps` 기본값은 `false`이며 논리 INT64 타임스탬프를 씁니다. INT96이 필요한 소비자에 대해서만 `true`로 설정하십시오. Hive 테이블 쓰기는 다른 호환성 선택을 사용합니다. [Hive Catalog](../catalogs/hive-catalog.mdx)를 참조하십시오.

이전 Doris 인코딩으로 작성되고 `0000-01-01`부터 `0000-02-28`까지의 날짜를 포함하는 DATE 파일은 writer에 따라 마이그레이션해야 합니다. reader만 업그레이드해서는 복구할 수 없습니다. [Year-Zero DATE File Migration](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)을 참조하십시오.

### 세션 변수 {#session-variables}

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Parquet Reader가 지연 구체화를 활성화할지 제어합니다. 기본값은 true입니다.

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Hive 테이블에서 Parquet 데이터 유형을 읽을 때 Doris는 기본적으로 Hive 테이블 열과 이름이 같은 Parquet 파일의 열에서 데이터를 읽습니다. 이 변수를 `false`로 설정하면 Doris는 열 이름과 관계없이 Hive 테이블의 열 순서에 따라 Parquet 파일에서 데이터를 읽습니다. 이는 Hive의 `parquet.column.index.access` 변수와 유사합니다. 이 매개변수는 최상위 열 이름에만 적용되며 Struct 내부의 열에는 적용되지 않습니다.

### BE 구성 {#be-configuration}

* `parquet_metadata_size_limit` (4.1.5부터)

    native Parquet V2 Reader의 직렬화된 footer 메타데이터 최대 크기입니다. 기본값은 `268435456`바이트(256 MiB)이며 `0`보다 커야 하고 동적 업데이트를 지원합니다. Page Header 제한과는 별개입니다. 이 값을 초과하면 `Parquet v2 footer size ... exceeds metadata limit ...` 오류가 반환됩니다. [BE 구성](../../admin-manual/config/be-config.md#parquet_metadata_size_limit)을 참조하십시오.

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader가 Page Index를 사용해 데이터를 필터링할지 결정합니다. 페이지 인덱스가 때때로 잘못된 데이터를 필터링하는 경우를 확인하기 위한 디버깅 용도입니다. 기본값은 false입니다.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page header를 읽을 때 할당되는 최대 버퍼 크기입니다. 기본값은 1M입니다.

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group을 읽을 때 할당되는 최대 버퍼 크기입니다. 기본값은 128M입니다.

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 내 Column을 읽을 때 할당되는 최대 버퍼 크기입니다. 기본값은 8M입니다.
