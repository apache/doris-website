---
{
    "title": "ORC | 파일 형식",
    "language": "ko",
    "description": "이 문서에서는 Doris의 ORC 파일 형식 읽기 및 쓰기 지원을 소개합니다. 다음 기능에 적용됩니다:",
    "sidebar_label": "ORC"
}
---

# ORC {#orc}

이 문서에서는 Doris의 ORC 파일 형식 읽기 및 쓰기 지원을 소개합니다. 다음 기능에 적용됩니다:

* Catalog에서 데이터 읽기 및 쓰기.
* Table Valued Functions를 사용한 데이터 읽기.
* Broker Load를 사용한 데이터 읽기.
* Export 중 데이터 쓰기.
* Outfile을 사용한 데이터 쓰기.

## 타임스탬프의 소수 초 정밀도 {#timestamp-fractional-second-precision}

ORC 타임스탬프는 나노초까지 저장할 수 있지만, Doris의 `DATETIMEV2`와 `TIMESTAMPTZ`는 마이크로초까지만 지원합니다. FileScannerV2는 Catalog 스캔, 테이블 값 함수, Broker Load에서 사사오입 방식으로 ORC의 소수 초를 가장 가까운 마이크로초로 반올림합니다:

| ORC 값 | Doris 값 |
|---|---|
| `2024-01-01 00:00:00.123456499` | `2024-01-01 00:00:00.123456` |
| `2024-01-01 00:00:00.123456500` | `2024-01-01 00:00:00.123457` |
| `2024-01-01 00:00:00.999999500` | `2024-01-01 00:00:01.000000` |

`DATETIMEV2`와 `TIMESTAMPTZ` 매핑에는 다음 초로 올림되는 경우를 포함해 모두 이 규칙이 적용됩니다. 행 디코딩, 통계 변환, 조건자 푸시다운에도 일치하는 경계가 사용됩니다. ORC 통계의 정밀도가 반올림 경계를 정확히 표현하기에 부족하면 Doris는 가지치기 경계를 보수적으로 넓힙니다. `!=`와 같은 타임스탬프 조건자를 안전하게 표현할 수 없으면 Doris는 해당 검색 인자를 건너뛰고 디코딩된 행에서 조건자를 평가합니다. 이 경우 해당 조건자의 가지치기 효과가 줄어들 수 있지만, 유효한 행을 잘못 건너뛰는 일은 방지할 수 있습니다.

## UUID 타입 매핑 {#uuid-type-mapping}

Doris는 ARRAY, MAP 또는 STRUCT에 중첩된 UUID 요소를 포함한 `UUID` 컬럼을 표준 형식의 16바이트 빅 엔디언 값을 담은 `BINARY`로 쓰고, 네이티브 UUID임을 표시하는 `doris.logical_type=uuid` 속성을 추가합니다. ORC에는 표준 UUID 타입이 없으므로 Doris 이외의 도구에서는 UUID 의미 정보가 없는 일반 바이너리 컬럼으로 보입니다. OUTFILE에 ORC `schema` 속성을 명시적으로 지정할 때는 UUID 컬럼을 `binary`로 선언해야 하며, `string`과 같은 다른 타입을 선언하면 거부됩니다.

`BINARY` 컬럼을 읽을 때 `doris.logical_type=uuid` 속성이 있으면 네이티브 UUID 타입으로 복원합니다. 두 파일 리더 모두 중첩된 요소까지 지원하므로 테이블 값 함수는 이러한 컬럼을 `uuid`, `array<uuid>` 또는 `struct<k:uuid>`로 보고합니다. dev 버전에서는 이 속성이 없는 `BINARY`는 `VARBINARY`로 매핑되고, `STRING`은 계속 `STRING`으로 유지됩니다.

OUTFILE과 EXPORT의 전체 UUID 출력 매핑은 [내보낸 파일의 컬럼 타입 매핑](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files)을 참조하세요.

## 지원하는 압축 형식 {#supported-compression-formats}

### 읽기 {#reading}

기존 파일을 읽을 때 다음 코덱을 지원합니다.

* uncompressed
* snappy
* lz4
* zstd
* lzo
* zlib

### 쓰기 {#writing}

| 쓰기 진입점 | 지원하는 코덱 |
| --- | --- |
| Hive / Iceberg Catalog | `plain`, `snappy`, `zlib`, `zstd`, `lz4` (4.1.3부터) |
| OUTFILE / EXPORT | `plain`, `snappy`, `zlib`, `zstd` |

`plain`은 압축하지 않음을 뜻합니다. Catalog 쓰기 설정과 기본값은 [Hive Catalog](../catalogs/hive-catalog.mdx)와 [Iceberg Catalog](../catalogs/iceberg-catalog.mdx)를 참조하세요. OUTFILE / EXPORT에서는 `compress_type` 속성으로 코덱을 선택합니다.

## 매개변수 {#parameters}

### 타임스탬프 및 날짜 호환성 (4.1.5부터) {#timestamp-and-date-compatibility-since-415}

4.1.5부터 ORC `TIMESTAMP`는 시간대가 없는 현지 시각을 나타내고, `TIMESTAMP_INSTANT`는 특정 시점을 나타내며 `TIMESTAMPTZ`로 매핑됩니다. 읽을 때는 나노초를 마이크로초로 반올림합니다. 지원 범위를 벗어난 값이나 유효하지 않은 나노초 값은 오류가 발생합니다.

ORC에 쓸 때 Unix 에포크 직전의 일부 음수 소수 초 타임스탬프는 데이터 손실 없이 표현할 수 없습니다. 이 경우 Doris는 `ORC cannot represent pre-epoch timestamp fractions in [-0.999, 0) seconds without data loss; use Parquet for these values`를 반환합니다. 이러한 값이 포함된 데이터에는 Parquet을 사용하세요.

이전 Doris 인코딩으로 작성되었으며 `0000-01-01`부터 `0000-02-28`까지의 값을 포함하는 DATE 파일은 명시적으로 마이그레이션해야 합니다. [영년 DATE 파일 마이그레이션](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)을 참조하세요.

### 세션 변수 {#session-variables}

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    ORC Reader의 지연 구체화 사용 여부를 제어합니다. 기본값은 true입니다.

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    Doris는 Hive 테이블의 ORC 데이터 타입을 읽을 때 기본적으로 Hive 테이블 컬럼과 이름이 같은 ORC 파일의 컬럼에서 데이터를 읽습니다. 이 변수를 `false`로 설정하면 컬럼 이름과 관계없이 Hive 테이블의 컬럼 순서를 기준으로 ORC 파일에서 데이터를 읽습니다. 이는 Hive의 `orc.force.positional.evolution` 변수와 유사합니다. 이 매개변수는 최상위 컬럼 이름에만 적용되며 Struct 내부의 컬럼에는 적용되지 않습니다.

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORC 파일에서 Stripe의 바이트 크기가 `orc_tiny_stripe_threshold`보다 작으면 Tiny Stripe로 간주합니다. 여러 Tiny Stripe가 연속되어 있으면 한 번에 읽어 IO 작업 횟수를 줄이는 읽기 최적화를 수행합니다. 이 최적화를 사용하지 않으려면 값을 0으로 설정할 수 있습니다. 기본값은 8M입니다.

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe 읽기 최적화를 사용할 때 여러 Tiny Stripe를 하나의 IO 작업으로 합칩니다. 이 매개변수는 각 IO 요청의 최대 바이트 수를 제어합니다. 이 값을 `orc_tiny_stripe_threshold`보다 작게 설정해서는 안 됩니다. 기본값은 8M입니다.

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe 읽기 최적화에서 읽을 두 Tiny Stripe가 연속되어 있지 않을 수 있습니다. 두 Tiny Stripe 사이의 거리가 이 매개변수보다 크면 하나의 IO 작업으로 합치지 않습니다. 기본값은 1M입니다.

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    Tiny Stripe 최적화에서 ORC 파일에 컬럼이 많지만 쿼리에는 일부 컬럼만 사용되는 경우 읽기 증폭이 심해질 수 있습니다. 실제로 읽는 바이트 수가 전체 Stripe에서 차지하는 비율이 이 매개변수를 초과하면 Tiny Stripe 읽기 최적화를 사용합니다. 기본값은 0.4이고 최솟값은 0입니다.

* `check_orc_init_sargs_success` (3.1.0+)

    디버깅을 위해 ORC 조건자 푸시다운의 성공 여부를 확인합니다. 기본값은 false입니다.

### BE 설정 {#be-configuration}

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Reader가 한 번에 읽는 최대 바이트 수입니다. 기본값은 8 MB입니다.
