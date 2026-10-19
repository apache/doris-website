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
* 테이블 값 함수를 사용한 데이터 읽기.
* Broker Load를 사용한 데이터 읽기.
* Export 중 데이터 쓰기.
* Outfile을 사용한 데이터 쓰기.

## INT96 타임스탬프 디코딩 {#int96-timestamp-decoding}

Parquet `INT96`은 시간대 어노테이션 없이 날짜 및 시간 필드를 저장합니다. 따라서 FileScannerV2는 기본적으로 SQL 세션 시간대에 따라 값을 변환하지 않고 원시 로컬 시각을 유지합니다. 예를 들어, 원시 값 `2021-01-01 10:11:00`은 `10:11:00`을 그대로 유지한 채 `DATETIMEV2`로 매핑됩니다. 이는 Catalog 스캔, 테이블 값 함수, Broker Load에도 적용됩니다.

이 동작은 `INT96`에만 적용됩니다. 타임스탬프 논리 타입을 갖는 Parquet `INT64` 값은 계속해서 해당 논리 타입의 의미 체계를 따릅니다. 레거시 Hive writer가 알려진 시간대를 기준으로 `INT96` 값을 정규화했다면 `hive.parquet.time-zone`을 [Hive Catalog](../catalogs/hive-catalog.mdx#timestamp-compatibility)에서 설정하세요. 외부 파일 테이블 값 함수에서도 이 속성을 사용할 수 있습니다. 다른 FileScannerV2 진입점은 원시 `INT96` 로컬 시각을 유지합니다. 단, Hudi는 예외로, 네이티브 스캔과 JNI 스캔 모두에서 기존의 SQL 세션 시간대 동작을 의도적으로 유지하며 `hive.parquet.time-zone`을 무시합니다.

`INT96` 컬럼이 `TIMESTAMPTZ`로 매핑될 때 Doris는 호환성 시간대를 적용하지 않고 UTC 절대 시점을 유지합니다.

## UUID 타입 매핑 {#uuid-type-mapping}

읽기 시 표준 big-endian 바이트 순서로 저장되고 plain 또는 dictionary 인코딩을 사용하는 UUID 어노테이션이 있는 `FIXED_LEN_BYTE_ARRAY(16)`을 지원합니다. dev 버전에서는 일반 Parquet TVF와 Iceberg Catalog가 레거시 바이너리 매핑 옵션과 관계없이 UUID 어노테이션이 있는 컬럼을 네이티브 `UUID`로 직접 매핑합니다. Doris 4.1.5의 Parquet TVF는 여전히 `enable_mapping_varbinary`에 따라 표준 UUID 문자열 또는 VARBINARY를 반환하며, 해당 릴리스에서 Iceberg UUID는 `VARBINARY(16)`으로 매핑됩니다.

Doris `UUID` 컬럼을 쓰면 ARRAY, MAP 또는 STRUCT 내부에 중첩된 UUID 요소를 포함하여 UUID 논리 어노테이션이 있는 `FIXED_LEN_BYTE_ARRAY(16)`이 생성됩니다. 따라서 이 어노테이션을 이해하는 다른 엔진은 해당 값을 UUID로 복원할 수 있습니다. dev 버전은 이러한 파일을 읽을 때 중첩된 UUID 요소를 포함하여 네이티브 UUID를 복원합니다.

OUTFILE 및 EXPORT의 전체 UUID 출력 매핑은 [내보낸 파일의 컬럼 타입 매핑](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files)을 참조하세요.

## 지원되는 압축 형식 {#supported-compression-formats}

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## 매개변수 {#parameters}

### 타임스탬프 및 날짜 호환성 (4.1.5부터) {#timestamp-and-date-compatibility}

4.1.5부터 Parquet는 데이터를 읽고 쓸 때 로컬 시각과 절대 시점을 구분합니다. 시간대가 없는 논리 타임스탬프는 `DATETIME`으로 매핑되며, `isAdjustedToUTC=true`인 논리 타임스탬프는 `TIMESTAMPTZ`로 매핑됩니다. Catalog 호환성 속성이나 파일 TVF의 `enable_mapping_timestamp_tz=false` 설정으로도 후자를 `DATETIME`으로 매핑하도록 되돌릴 수 없습니다.

Parquet INT96에는 시간대 어노테이션이 없으며 `DATETIME(6)`으로 추론됩니다. Hive Catalog와 파일 TVF에서는 선택적 속성인 `hive.parquet.time-zone`을 사용하여 INT96 writer의 시간대를 지정할 수 있습니다. 기본값은 빈 문자열이며, 이 경우 로컬 시각을 유지합니다. IANA 시간대 또는 `-12:00`부터 `+14:00`까지의 UTC 오프셋을 사용하세요. `UTC`와 `GMT`는 허용되지만, `CST`와 `PRC` 같은 짧은 별칭은 허용되지 않습니다. writer의 시간대를 알고 있을 때만 설정하세요. 예를 들면 `"hive.parquet.time-zone" = "Asia/Shanghai"`와 같습니다.

4.1.5부터 Outfile과 Export에서 `enable_int96_timestamps`의 기본값은 `false`이며, 논리 INT64 타임스탬프를 기록합니다. INT96이 필요한 소비자에 대해서만 이 값을 `true`로 설정하세요. Hive 테이블 쓰기에는 다른 호환성 방식이 사용됩니다. [Hive Catalog](../catalogs/hive-catalog.mdx)를 참조하세요.

이전 Doris 인코딩으로 작성되었으며 `0000-01-01`부터 `0000-02-28`까지의 날짜를 포함하는 DATE 파일은 파일을 작성한 writer에 따라 마이그레이션해야 합니다. reader만 업그레이드해서는 이러한 파일을 복구할 수 없습니다. [연도가 영인 DATE 파일 마이그레이션](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)을 참조하세요.

### 세션 변수 {#session-variables}

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Parquet Reader의 지연 구체화 활성화 여부를 제어합니다. 기본값은 true입니다.

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Hive 테이블에서 Parquet 데이터 타입을 읽을 때 Doris는 기본적으로 Hive 테이블의 컬럼과 이름이 같은 Parquet 파일의 컬럼에서 데이터를 읽습니다. 이 변수를 `false`로 설정하면 Doris는 컬럼 이름과 관계없이 Hive 테이블의 컬럼 순서에 따라 Parquet 파일에서 데이터를 읽습니다. 이는 Hive의 `parquet.column.index.access` 변수와 유사합니다. 이 매개변수는 최상위 컬럼 이름에만 적용되며 Struct 내부의 컬럼에는 적용되지 않습니다.

### BE 설정 {#be-configuration}

* `parquet_metadata_size_limit` (4.1.5부터)

    네이티브 Parquet V2 Reader에서 직렬화된 footer 메타데이터의 최대 크기입니다. 기본값은 `268435456`바이트(256 MiB)이며, `0`보다 커야 하고 동적 업데이트를 지원합니다. 이 제한은 Page Header 제한과 별개입니다. 제한을 초과하면 `Parquet v2 footer size ... exceeds metadata limit ...`가 반환됩니다. [BE 설정](../../admin-manual/config/be-config.md#parquet_metadata_size_limit)을 참조하세요.

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader가 Page Index를 사용하여 데이터를 필터링할지 결정합니다. Page Index가 간혹 데이터를 잘못 필터링하는 경우에 대비한 디버깅 용도로만 사용됩니다. 기본값은 false입니다.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page header를 읽을 때 할당되는 최대 버퍼 크기입니다. 기본값은 1M입니다.

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group을 읽을 때 할당되는 최대 버퍼 크기입니다. 기본값은 128M입니다.

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 내의 컬럼을 읽을 때 할당되는 최대 버퍼 크기입니다. 기본값은 8M입니다.
