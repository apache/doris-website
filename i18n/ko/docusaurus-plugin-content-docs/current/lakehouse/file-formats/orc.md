---
{
    "title": "ORC | 파일 형식",
    "language": "ko",
    "description": "이 문서는 Doris에서 ORC 파일 형식의 읽기 및 쓰기 지원을 설명합니다. 다음 기능에 적용됩니다:",
    "sidebar_label": "ORC"
}
---

# ORC {#orc}

이 문서는 Doris에서 ORC 파일 형식의 읽기 및 쓰기 지원을 설명합니다. 다음 기능에 적용됩니다:

* Catalog에서 데이터 읽기 및 쓰기.
* Table Valued Functions를 사용한 데이터 읽기.
* Broker Load를 사용한 데이터 읽기.
* Export 시 데이터 쓰기.
* Outfile을 사용한 데이터 쓰기.

## 타임스탬프의 소수 초 정밀도 {#timestamp-fractional-second-precision}

ORC 타임스탬프는 나노초를 저장할 수 있지만, Doris의 `DATETIMEV2`와 `TIMESTAMPTZ`는 최대 마이크로초 정밀도를 지원합니다. FileScannerV2는 Catalog 스캔, 테이블 값 함수, Broker Load에서 사사오입 방식으로 ORC의 소수 초를 가장 가까운 마이크로초로 반올림합니다:

| ORC 값 | Doris 값 |
|---|---|
| `2024-01-01 00:00:00.123456499` | `2024-01-01 00:00:00.123456` |
| `2024-01-01 00:00:00.123456500` | `2024-01-01 00:00:00.123457` |
| `2024-01-01 00:00:00.999999500` | `2024-01-01 00:00:01.000000` |

`DATETIMEV2`와 `TIMESTAMPTZ` 매핑 모두 이 규칙을 사용하며, 반올림 결과 다음 초로 넘어가는 경우도 포함됩니다. 행 디코딩, 통계 변환, 조건자 푸시다운에는 서로 일치하는 경계가 사용됩니다. ORC 통계의 정밀도가 부족해 반올림된 경계를 정확하게 표현할 수 없으면, Doris는 프루닝 경계를 보수적으로 넓힙니다. `!=`와 같은 타임스탬프 조건자를 안전하게 표현할 수 없으면, Doris는 해당 검색 인자를 건너뛰고 디코딩된 행에서 조건자를 평가합니다. 이 경우 해당 조건자의 프루닝 효과가 줄어들 수 있지만, 유효한 행이 잘못 제외되는 것을 방지합니다.

## UUID 타입 매핑 {#uuid-type-mapping}

Doris는 `UUID` 컬럼을 ARRAY, MAP 또는 STRUCT에 중첩된 UUID 요소까지 포함하여 `BINARY`로 기록하며, 여기에 정규 16바이트 big-endian 값을 저장합니다. 또한 `doris.logical_type=uuid` 속성을 추가하여 네이티브 UUID임을 표시합니다. ORC에는 표준 UUID 타입이 없으므로 Doris 이외의 도구에서는 UUID 의미 정보가 없는 일반 바이너리 컬럼으로 인식합니다. OUTFILE에 ORC `schema` 속성을 명시적으로 지정할 때는 UUID 컬럼을 `binary`로 선언해야 합니다. `string`과 같은 다른 타입은 허용되지 않습니다.

`BINARY` 컬럼에 `doris.logical_type=uuid` 속성이 있으면, 두 파일 리더 모두에서 중첩 요소를 포함해 네이티브 UUID 타입으로 복원됩니다. 따라서 테이블 값 함수는 이러한 컬럼의 타입을 `uuid`, `array<uuid>` 또는 `struct<k:uuid>`로 표시합니다. dev 버전에서는 표시가 없는 `BINARY`가 `VARBINARY`에 매핑되며, `STRING`은 `STRING`으로 유지됩니다.

OUTFILE과 EXPORT의 전체 UUID 출력 매핑은 [내보내기 파일의 컬럼 타입 매핑](../../data-operate/export/export-overview.md#column-type-mapping-for-exported-files)을 참고하세요.

## 지원되는 압축 형식 {#supported-compression-formats}

* uncompressed
* snappy
* lz4
* zstd
* lzo
* zlib

## 매개변수 {#parameters}

### 타임스탬프 및 날짜 호환성 (4.1.5부터) {#timestamp-and-date-compatibility-since-415}

4.1.5부터 ORC `TIMESTAMP`는 시간대가 없는 로컬 시각을 나타내며, `TIMESTAMP_INSTANT`는 특정 시점을 나타내고 `TIMESTAMPTZ`에 매핑됩니다. 읽을 때는 나노초를 마이크로초로 반올림합니다. 범위를 벗어난 값과 유효하지 않은 나노초 값은 오류를 발생시킵니다.

ORC를 쓸 때 Unix epoch 직전의 일부 음수 소수 타임스탬프는 데이터 손실 없이 표현할 수 없습니다. Doris는 `ORC cannot represent pre-epoch timestamp fractions in [-0.999, 0) seconds without data loss; use Parquet for these values` 오류를 반환합니다. 이러한 값이 포함된 데이터에는 Parquet을 사용하세요.

이전 Doris 인코딩으로 작성되었으며 `0000-01-01`부터 `0000-02-28`까지의 날짜가 포함된 DATE 파일은 명시적인 마이그레이션이 필요합니다. [연도가 영인 DATE 파일 마이그레이션](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)을 참고하세요.

### 세션 변수 {#session-variables}

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    ORC Reader의 지연 구체화 활성화 여부를 제어합니다. 기본값은 true입니다.

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    Hive 테이블에서 ORC 데이터 타입을 읽을 때 Doris는 기본적으로 Hive 테이블의 컬럼과 이름이 같은 ORC 파일의 컬럼에서 데이터를 읽습니다. 이 변수를 `false`로 설정하면 Doris는 컬럼 이름과 관계없이 Hive 테이블의 컬럼 순서에 따라 ORC 파일에서 데이터를 읽습니다. 이는 Hive의 `orc.force.positional.evolution` 변수와 유사합니다. 이 매개변수는 최상위 컬럼 이름에만 적용되며 Struct 내부의 컬럼에는 적용되지 않습니다.

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORC 파일에서 Stripe의 바이트 크기가 `orc_tiny_stripe_threshold`보다 작으면 Tiny Stripe로 간주합니다. 연속된 여러 Tiny Stripe에 대해서는 읽기 최적화를 수행합니다. 즉, 여러 Tiny Stripe를 한 번에 읽어 IO 작업 횟수를 줄입니다. 이 최적화를 사용하지 않으려면 이 값을 0으로 설정하면 됩니다. 기본값은 8M입니다.

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe 읽기 최적화를 사용하면 여러 Tiny Stripe를 단일 IO 작업으로 병합합니다. 이 매개변수는 각 IO 요청의 최대 바이트 수를 제어합니다. 이 값은 `orc_tiny_stripe_threshold`보다 작게 설정해서는 안 됩니다. 기본값은 8M입니다.

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe 읽기 최적화를 사용할 때 읽을 두 Tiny Stripe가 연속되어 있지 않을 수 있습니다. 두 Tiny Stripe 사이의 거리가 이 매개변수보다 크면 단일 IO 작업으로 병합하지 않습니다. 기본값은 1M입니다.

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    Tiny Stripe 최적화에서 ORC 파일에 컬럼이 많지만 쿼리에서 사용하는 컬럼이 적으면, Tiny Stripe 최적화로 인해 심각한 읽기 증폭이 발생할 수 있습니다. 전체 Stripe 크기에 대한 실제로 읽은 바이트 수의 비율이 이 매개변수를 초과하면 Tiny Stripe 읽기 최적화를 사용합니다. 기본값은 0.4이고, 최솟값은 0입니다.

* `check_orc_init_sargs_success` (3.1.0+)

    ORC 조건자 푸시다운의 성공 여부를 확인하며, 디버깅에 사용됩니다. 기본값은 false입니다.

### BE 설정 {#be-configuration}

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Reader가 한 번에 읽는 최대 바이트 수입니다. 기본값은 8 MB입니다.
