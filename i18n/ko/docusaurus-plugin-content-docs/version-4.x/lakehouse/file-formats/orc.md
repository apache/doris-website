---
{
    "title": "ORC | 파일 형식",
    "language": "ko",
    "description": "이 문서는 Doris의 ORC 파일 형식 읽기 및 쓰기 지원을 소개합니다. 다음 기능에 적용됩니다:",
    "sidebar_label": "ORC"
}
---

# ORC {#orc}

이 문서는 Doris의 ORC 파일 형식 읽기 및 쓰기 지원을 소개합니다. 다음 기능에 적용됩니다:

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
* lzo
* zlib

## 매개변수 {#parameters}

### 타임스탬프 및 날짜 호환성(4.1.5부터) {#timestamp-and-date-compatibility-since-415}

4.1.5부터 ORC `TIMESTAMP`는 시간대 정보가 없는 시각을 나타내며, `TIMESTAMP_INSTANT`는 특정 시점을 나타내고 `TIMESTAMPTZ`에 매핑됩니다. 데이터를 읽을 때 나노초를 마이크로초 단위로 반올림합니다. 값이 범위를 벗어나거나 나노초 값이 유효하지 않으면 오류가 발생합니다.

ORC를 쓸 때 Unix epoch 직전의 일부 소수부가 있는 음수 타임스탬프는 데이터 손실 없이 표현할 수 없습니다. Doris는 `ORC cannot represent pre-epoch timestamp fractions in [-0.999, 0) seconds without data loss; use Parquet for these values` 오류를 반환합니다. 이러한 값이 포함된 데이터에는 Parquet을 사용하세요.

기존 Doris 인코딩으로 작성되었으며 `0000-01-01`부터 `0000-02-28`까지의 값을 포함하는 DATE 파일은 명시적인 마이그레이션이 필요합니다. [영년 DATE 파일 마이그레이션](../../admin-manual/cluster-management/upgrade.md#year-zero-date-file-migration)을 참조하세요.

### 세션 변수 {#session-variables}

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    ORC Reader에서 지연 구체화를 활성화할지 제어합니다. 기본값은 true입니다.

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    Hive 테이블에서 ORC 데이터 타입을 읽을 때 Doris는 기본적으로 Hive 테이블의 열과 이름이 같은 ORC 파일의 열에서 데이터를 읽습니다. 이 변수를 `false`로 설정하면 Doris는 열 이름과 관계없이 Hive 테이블의 열 순서에 따라 ORC 파일에서 데이터를 읽습니다. 이는 Hive의 `orc.force.positional.evolution` 변수와 유사합니다. 이 매개변수는 최상위 열 이름에만 적용되며 Structs 내부의 열에는 적용되지 않습니다.

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    ORC 파일에서 Stripe의 바이트 크기가 `orc_tiny_stripe_threshold`보다 작으면 Tiny Stripe로 간주합니다. 여러 Tiny Stripe가 연속으로 있으면 읽기 최적화를 수행합니다. 즉, 여러 Tiny Stripe를 한 번에 읽어 IO 작업 횟수를 줄입니다. 이 최적화를 사용하지 않으려면 값을 0으로 설정하면 됩니다. 기본값은 8M입니다.

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe 읽기 최적화를 사용하면 여러 Tiny Stripe를 하나의 IO 작업으로 병합합니다. 이 매개변수는 각 IO 요청의 최대 바이트 수를 제어합니다. 이 값을 `orc_tiny_stripe_threshold`보다 작게 설정하면 안 됩니다. 기본값은 8M입니다.

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    Tiny Stripe 읽기 최적화를 사용할 때 읽으려는 두 Tiny Stripe가 연속으로 있지 않을 수 있습니다. 두 Tiny Stripe 사이의 거리가 이 매개변수보다 크면 하나의 IO 작업으로 병합하지 않습니다. 기본값은 1M입니다.

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    Tiny Stripe 최적화에서 ORC 파일에 열이 많지만 쿼리에서 사용하는 열이 적으면 읽기 증폭이 심하게 발생할 수 있습니다. 전체 Stripe 대비 실제로 읽는 바이트의 비율이 이 매개변수를 초과하면 Tiny Stripe 읽기 최적화를 사용합니다. 기본값은 0.4이고 최솟값은 0입니다.

* `check_orc_init_sargs_success` (3.1.0+)

    ORC predicate pushdown의 성공 여부를 확인하며, 디버깅에 사용됩니다. 기본값은 false입니다.

### BE 구성 {#be-configuration}

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Reader가 한 번에 읽는 최대 바이트 수입니다. 기본값은 8 MB입니다.
