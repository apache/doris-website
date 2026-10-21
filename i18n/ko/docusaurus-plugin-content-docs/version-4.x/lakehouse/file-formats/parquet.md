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
* Export 중 데이터 쓰기.
* Outfile을 사용한 데이터 쓰기.

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

4.1.5부터 Parquet 파일을 읽고 쓸 때 현지 시각(wall-clock time)과 특정 시점(instant)의 구분이 유지됩니다. 시간대가 없는 논리 타임스탬프는 `DATETIME`에 매핑되며, `isAdjustedToUTC=true`인 논리 타임스탬프는 `TIMESTAMPTZ`에 매핑됩니다. Catalog 호환성 속성을 사용하거나 파일 TVF에서 `enable_mapping_timestamp_tz=false`를 설정해도 후자의 매핑을 `DATETIME`으로 되돌릴 수 없습니다.

Parquet INT96에는 시간대 어노테이션이 없으며, `DATETIME(6)`으로 추론됩니다. Hive Catalog와 파일 TVF에서는 선택적 속성인 `hive.parquet.time-zone`을 사용하여 INT96 작성 시 사용된 시간대를 지정할 수 있습니다. 기본값은 빈 문자열이며, 이 경우 현지 시각이 그대로 유지됩니다. IANA 시간대 또는 `-12:00`부터 `+14:00`까지의 UTC 오프셋을 사용하세요. `UTC`와 `GMT`는 허용되지만, `CST`와 `PRC` 같은 짧은 별칭은 허용되지 않습니다. 작성 시 사용된 시간대를 알고 있는 경우에만 설정하세요. 예를 들어 `"hive.parquet.time-zone" = "Asia/Shanghai"`로 설정할 수 있습니다.

4.1.5부터 Outfile과 Export에서 `enable_int96_timestamps`의 기본값은 `false`이며, 논리 INT64 타임스탬프를 기록합니다. INT96이 필요한 데이터 소비자에 대해서만 이 값을 `true`로 설정하세요. Hive 테이블에 쓸 때는 다른 호환성 방식을 사용합니다. [Hive Catalog](../catalogs/hive-catalog.mdx)를 참조하세요.

이전 Doris 인코딩으로 작성되었으며 `0000-01-01`부터 `0000-02-28`까지의 값을 포함하는 DATE 파일은 작성 도구에 맞게 마이그레이션해야 합니다. Reader만 업그레이드해서는 이러한 파일을 복구할 수 없습니다. [연도가 영인 DATE 파일 마이그레이션](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)을 참조하세요.

### 세션 변수 {#session-variables}

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

    Parquet Reader에서 지연 구체화를 활성화할지 제어합니다. 기본값은 true입니다.

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

    Hive 테이블에서 Parquet 데이터 타입을 읽을 때 Doris는 기본적으로 Hive 테이블의 컬럼과 이름이 같은 Parquet 파일의 컬럼에서 데이터를 읽습니다. 이 변수를 `false`로 설정하면 Doris는 컬럼 이름과 관계없이 Hive 테이블의 컬럼 순서를 기준으로 Parquet 파일에서 데이터를 읽습니다. 이는 Hive의 `parquet.column.index.access` 변수와 유사합니다. 이 매개변수는 최상위 컬럼 이름에만 적용되며 Struct 내부의 컬럼에는 영향을 주지 않습니다.

### BE 구성 {#be-configuration}

* `parquet_metadata_size_limit` (4.1.5부터)

    네이티브 Parquet V2 Reader에서 허용하는 직렬화된 footer 메타데이터의 최대 크기입니다. 기본값은 `268435456`바이트(256 MiB)이며, `0`보다 커야 하고 동적 업데이트를 지원합니다. 이 제한은 Page Header 제한과 별개입니다. 제한을 초과하면 `Parquet v2 footer size ... exceeds metadata limit ...` 오류가 반환됩니다. [BE 구성](../../admin-manual/config/be-config.md#parquet_metadata_size_limit)을 참조하세요.

* `enable_parquet_page_index` (2.1.5+, 3.0+)

    Parquet Reader에서 Page Index를 사용하여 데이터를 필터링할지 결정합니다. Page Index가 간혹 데이터를 잘못 필터링하는 경우에 대비한 디버깅 전용 설정입니다. 기본값은 false입니다.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

    Parquet Page 헤더를 읽을 때 할당되는 버퍼의 최대 크기입니다. 기본값은 1M입니다.

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group을 읽을 때 할당되는 버퍼의 최대 크기입니다. 기본값은 128M입니다.

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

    Parquet Row Group 내의 컬럼을 읽을 때 할당되는 버퍼의 최대 크기입니다. 기본값은 8M입니다.
