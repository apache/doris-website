---
{
    "title": "데이터 버킷팅",
    "language": "ko",
    "description": "Doris 데이터 버킷팅 가이드: Hash 버킷팅과 Random 버킷팅 중 적절한 방식을 선택하고, 버킷 키와 버킷 수를 결정하여 쿼리 성능을 높이고 데이터 편향을 방지하는 방법을 설명합니다.",
    "keywords": [
        "Doris 데이터 버킷팅",
        "Hash 버킷팅",
        "Random 버킷팅",
        "버킷 키 선택",
        "버킷 수",
        "tablet",
        "데이터 편향"
    ]
}
---

<!-- Knowledge type: Architecture decision / Configuration parameter -->
<!-- Applicable scenarios: Table design / Performance tuning / Data skew handling -->

업무 요구 사항에 따라 파티션을 여러 데이터 버킷으로 더 나눌 수 있습니다. 각 버킷은 물리적 데이터 샤드(Tablet)로 저장됩니다. 적절한 버킷팅 전략을 사용하면 쿼리 시 스캔하는 데이터양을 효과적으로 줄이고, 쿼리 성능과 동시 처리 능력을 높일 수 있습니다.

이 문서는 테이블 생성 시의 의사 결정 순서에 따라 구성되어 있습니다. 먼저 버킷팅 방식을 선택하고, 버킷 키를 선택한 다음, 버킷 수와 이후 유지 관리 방식을 결정합니다.

## 빠른 의사 결정 {#quick-decision}

테이블을 생성할 때 다음 순서로 버킷팅을 설계할 수 있습니다.

| 단계 | 결정 항목 | 주요 고려 사항 |
|------|------|----------|
| 1 | 버킷팅 방식 선택 | 자주 사용하는 필터 컬럼의 유무, 데이터 분포의 균등성, 테이블 모델 |
| 2 | 버킷 키 선택(Hash 버킷팅만 해당) | 쿼리 필터 조건, 컬럼 카디널리티, 쿼리 동시성 및 처리량 특성 |
| 3 | 버킷 수 결정 | Tablet당 데이터 크기, BE 수, 디스크 수 |
| 4 | 버킷 유지 관리 전략 수립 | 데이터 증가 추세, 동적 파티셔닝 사용 여부 |

## 1. 버킷팅 방식 선택 {#1-choose-the-bucketing-method}

Doris는 **Hash 버킷팅**과 **Random 버킷팅**의 두 가지 버킷팅 방식을 지원합니다. 주요 차이점은 다음과 같습니다.

| 비교 항목 | Hash 버킷팅 | Random 버킷팅 |
|--------|----------|------------|
| 데이터 분산 방식 | 버킷 키의 Hash 값에 따라 분할 | 무작위로 균등하게 분산 |
| 버킷 키 필요 여부 | 필요 | 불필요 |
| 버킷 프루닝 지원 여부 | 지원 | 미지원 |
| 적용 가능한 테이블 모델 | DUPLICATE / UNIQUE / AGGREGATE | DUPLICATE만 지원 |
| 데이터 편향 위험 | 버킷 키 선택에 따라 달라짐 | 낮음 |
| 적합한 시나리오 | 특정 컬럼으로 자주 필터링하는 포인트 쿼리 | 임의의 차원에 대한 분석, 편향이 발생하기 쉬운 데이터 |

### 1. Hash 버킷팅 {#1-hash-bucketing}

테이블을 생성하거나 새 파티션을 추가할 때 하나 이상의 컬럼을 버킷 키로 선택하고 버킷 수를 명시적으로 지정해야 합니다. 동일한 파티션 내에서 시스템은 버킷 키와 버킷 수를 기반으로 Hash를 계산하고, Hash 값이 같은 행을 같은 버킷에 할당합니다.

예를 들어 아래 그림에서는 `p250102` 파티션을 `region` 컬럼에 따라 3개의 버킷으로 나누고, Hash 값이 같은 행을 같은 버킷에 배치합니다.

![Hash 버킷팅](/images/table-desigin/hash-bucket.png)

**권장 시나리오:**

- 업무에서 특정 필드를 자주 필터링하는 경우, 해당 필드를 버킷 키로 사용하고 버킷 프루닝을 활용하여 쿼리 효율을 높일 수 있습니다.
- 테이블의 데이터가 비교적 고르게 분포되어 편향이 발생할 가능성이 낮은 경우입니다.

**예시:** Hash 버킷팅을 사용하는 테이블을 생성합니다. 자세한 구문은 [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)을 참조하세요.

아래 예시에서는 테이블 이름에 `demo` 데이터베이스를 명시합니다. 클러스터에 해당 데이터베이스가 없으면 먼저 생성하세요.

```sql
CREATE DATABASE IF NOT EXISTS demo;
```

```sql
CREATE TABLE demo.hash_bucket_tbl(
    oid         BIGINT,
    dt          DATE,
    region      VARCHAR(10),
    amount      INT
)
DUPLICATE KEY(oid)
PARTITION BY RANGE(dt) (
    PARTITION p250101 VALUES LESS THAN("2025-01-01"),
    PARTITION p250102 VALUES LESS THAN("2025-01-02")
)
DISTRIBUTED BY HASH(region) BUCKETS 8;
```

이 예시에서 `DISTRIBUTED BY HASH(region)`은 Hash 버킷팅을 사용하도록 지정하고 `region` 컬럼을 버킷 키로 선택합니다. `BUCKETS 8`은 8개의 버킷을 생성하도록 지정합니다.

### 2. Random 버킷팅 {#2-random-bucketing}

Random 버킷팅은 특정 필드의 Hash 값에 의존하지 않고 각 파티션 내의 버킷에 데이터를 무작위로 분산합니다. 이 방식은 데이터를 고르게 분산하고, 부적절한 버킷 키 선택으로 인한 데이터 편향을 방지합니다.

데이터를 적재할 때 하나의 데이터 적재 작업에 포함된 각 배치는 임의의 Tablet에 기록되므로 데이터가 고르게 분산됩니다. 예를 들어 아래 그림에서는 8개의 데이터 배치를 `p250102` 파티션의 3개 버킷에 무작위로 할당합니다.

![Random 버킷팅](/images/table-desigin/random-bucket.png)

Random 버킷팅을 사용할 때는 단일 Tablet 데이터 적재 모드를 활성화하여(`load_to_single_tablet`을 `true`로 설정) 단일 배치의 데이터를 하나의 데이터 샤드에만 기록할 수 있습니다. 이를 통해 다음과 같은 효과를 얻을 수 있습니다.

- 대규모 데이터 적재의 동시성과 처리량을 높입니다.
- 데이터 적재 및 Compaction 작업으로 발생하는 쓰기 증폭을 줄입니다.
- 클러스터 안정성을 높입니다.

**권장 시나리오:**

- 업무에 고정된 필터 또는 조인 컬럼이 없고, 임의의 차원에 대해 분석하는 경우입니다.
- 자주 쿼리하는 컬럼이나 컬럼 조합의 데이터 분포가 매우 불균등하여 데이터 편향을 방지해야 하는 경우입니다.

**적합하지 않은 시나리오:**

- 포인트 쿼리 시나리오: Random 버킷팅은 버킷 키를 기반으로 프루닝할 수 없으므로 조건에 맞는 파티션의 모든 데이터를 스캔합니다.
- UNIQUE 및 AGGREGATE 테이블: DUPLICATE 테이블만 Random 버킷팅을 지원합니다.

**예시:** Random 버킷팅을 사용하는 테이블을 생성합니다. 자세한 구문은 [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)을 참조하세요.

```sql
CREATE TABLE demo.random_bucket_tbl(
    oid         BIGINT,
    dt          DATE,
    region      VARCHAR(10),
    amount      INT
)
DUPLICATE KEY(oid)
PARTITION BY RANGE(dt) (
    PARTITION p250101 VALUES LESS THAN("2025-01-01"),
    PARTITION p250102 VALUES LESS THAN("2025-01-02")
)
DISTRIBUTED BY RANDOM BUCKETS 8;
```

이 예시에서 `DISTRIBUTED BY RANDOM`은 Random 버킷팅을 사용하도록 지정하며, 버킷 키를 선택할 필요가 없습니다. `BUCKETS 8`은 8개의 버킷을 생성하도록 지정합니다.

## 2. 버킷 키 선택 {#2-select-the-bucket-key}

:::tip 팁

Hash 버킷팅에서만 버킷 키를 선택해야 합니다. Random 버킷팅에서는 필요하지 않습니다.

:::

버킷 키는 하나 이상의 컬럼으로 구성할 수 있습니다. 테이블 모델별 버킷 키 제한 사항은 다음과 같습니다.

| 테이블 모델 | 버킷 키로 사용할 수 있는 컬럼 |
|--------|----------|
| DUPLICATE | 모든 Key 컬럼 또는 Value 컬럼 |
| AGGREGATE / UNIQUE | Key 컬럼이어야 함(올바른 데이터 집계를 보장하기 위함) |

### 선택 원칙 {#selection-principles}

업무 쿼리 특성에 따라 다음 원칙을 참고하여 버킷 키를 선택할 수 있습니다.

| 원칙 | 설명 | 이점 |
|------|------|------|
| 쿼리 필터 조건 활용 | 쿼리에서 필터로 자주 사용하는 컬럼을 버킷 키로 선택 | 버킷 프루닝을 지원하고 스캔하는 데이터양을 줄임 |
| 카디널리티가 높은 컬럼 활용 | 고유한 값이 많은 컬럼을 버킷 키로 선택 | 데이터를 고르게 분산하고 편향을 방지함 |
| 동시성이 높은 포인트 쿼리 시나리오 | 단일 컬럼 또는 적은 수의 컬럼을 버킷 키로 선택 | 쿼리 하나가 버킷 하나만 스캔하므로 쿼리 간 IO 간섭이 줄어듦 |
| 높은 처리량이 필요한 쿼리 시나리오 | 여러 컬럼을 버킷 키로 선택 | 데이터가 더 고르게 분산되며, 쿼리 조건이 동등 조건과 완전히 일치하지 않을 때 전체 처리량이 향상됨 |

## 3. 버킷 수 결정 {#3-determine-the-number-of-buckets}

Doris에서 각 버킷은 물리적 파일(Tablet)로 저장됩니다. 테이블의 전체 Tablet 수는 다음과 같습니다.

```text
Total Tablets = partition_num × bucket_num
```

:::caution 주의

파티션의 버킷 수는 한 번 지정하면 변경할 수 없습니다. 버킷 수를 결정할 때는 향후 머신 확장을 미리 고려하세요.

:::

Doris는 2.0 버전부터 머신 리소스와 클러스터 정보를 기반으로 파티션의 버킷 수를 자동으로 설정하는 기능을 지원합니다. 업무에서 요구하는 추정 정밀도에 따라 수동 또는 자동 방식을 선택할 수 있습니다.

### 1. 버킷 수 수동 설정 {#1-manually-set-the-number-of-buckets}

`DISTRIBUTED` 절을 통해 버킷 수를 지정합니다.

```sql
-- Set hash bucket num to 8
DISTRIBUTED BY HASH(region) BUCKETS 8

-- Set random bucket num to 8
DISTRIBUTED BY RANDOM BUCKETS 8
```

#### 결정 원칙 {#decision-principles}

버킷 수를 결정할 때는 다음 두 가지 원칙을 따르세요. 두 원칙이 상충하는 경우 **크기 원칙을 우선하세요**.

1. **크기 원칙**: 각 Tablet의 압축된 데이터 크기(인덱스 제외)는 **1 GB에서 20 GB** 사이로 유지하는 것이 좋으며, Unique Key 테이블의 경우 **10 GB**를 넘지 않는 것이 좋습니다.
    - Tablet이 너무 작으면 집계 효과가 떨어지고 메타데이터 관리 오버헤드가 증가합니다.
    - Tablet이 너무 크면 복제본 마이그레이션과 복구가 어려워지고, 실패한 Schema Change를 재시도하는 비용이 증가합니다.
    - `SHOW TABLETS FROM your_table`을 사용하여 실제 Tablet 크기를 확인할 수 있습니다.

2. **수량 원칙**: 확장을 고려하지 않는 경우, 테이블의 Tablet 수는 클러스터의 전체 디스크 수보다 약간 많게 설정하는 것이 좋습니다.

또한 다음 사항에 유의하세요.

- 데이터를 고르게 분산하려면 버킷 수를 BE 수의 정수 배수로 설정해야 합니다.
- 단일 파티션의 버킷 수는 일반적으로 **128**을 넘지 않아야 합니다. 더 많은 버킷이 필요하면 먼저 테이블을 파티셔닝하세요.

#### 권장 설정 예시 {#recommended-configuration-examples}

클러스터에 BE 머신이 10대 있고 각 머신에 디스크가 하나씩 있다고 가정합니다. 아래 표를 참고하여 버킷 수를 설정할 수 있습니다.

| 압축된 파티션 데이터 크기 | 권장 버킷 수 |
|-----------------|-----------------|
| < 1 GB | 1개 버킷 |
| 1 - 10 GB | 10개 버킷 |
| 10 - 200 GB | 10 - 20개 버킷 |
| > 200 GB | 먼저 테이블을 파티셔닝 |

:::tip 팁

`SHOW DATA` 명령으로 테이블의 데이터 크기를 확인할 수 있습니다. 테이블의 실제 데이터 크기를 구하려면 결과를 복제본 수로 나누어야 합니다.

:::

### 2. 버킷 수 자동 설정 {#2-automatically-set-the-number-of-buckets}

자동 버킷 수 추정 기능은 최근 일정 기간의 파티션 크기를 기반으로 향후 파티션 크기를 예측하고, 그에 따라 버킷 수를 결정합니다.

```sql
-- Set hash bucket auto
DISTRIBUTED BY HASH(region) BUCKETS AUTO
properties("estimate_partition_size" = "20G")

-- Set random bucket auto
DISTRIBUTED BY RANDOM BUCKETS AUTO
properties("estimate_partition_size" = "20G")
```

`estimate_partition_size` 속성은 파티션 크기의 초기 추정값을 조정하는 데 사용됩니다.

- 이 매개변수는 선택 사항입니다. 지정하지 않으면 기본값은 `10GB`입니다.
- 이 매개변수는 초기 추정값에만 영향을 미치며, 이후 시스템이 과거 파티션 데이터에서 추정하는 향후 파티션 크기와는 무관합니다.

계산된 버킷 수는 FE 설정인 `autobucket_min_buckets`와 `autobucket_max_buckets` 사이로 제한됩니다.

| FE 설정 | 기본값 | 설명 |
|---|---|---|
| `autobucket_min_buckets` | 3 | 자동 버킷팅 결과의 하한값. **기본값이 `1`에서 `3`으로 변경되었으며, 4.0.8(4.0 시리즈) 및 4.1.4(4.1 시리즈)부터 적용됩니다** |
| `autobucket_max_buckets` | 128 | 자동 버킷팅 결과의 상한값 |

:::caution 동작 변경 (4.0.8 / 4.1.4)

`autobucket_min_buckets`의 기본값이 `1`에서 `3`으로 변경되었으며, 4.0.8(4.0 시리즈) 및 4.1.4(4.1 시리즈)부터 적용됩니다. 이전에는 작은 파티션의 버킷 수가 하나로 계산되어 병렬성과 데이터 분산이 부족해질 수 있었습니다. 변경 후에는 자동 버킷팅으로 생성되는 버킷 수가 3개 미만이 되지 않습니다.

이 변경은 업그레이드 **이후에 생성되는** 파티션에만 영향을 미치며, 기존 파티션의 버킷 수는 변경되지 않습니다. 이전 동작을 유지하려면 `autobucket_min_buckets`를 명시적으로 `1`로 다시 설정하세요.

:::

## 4. 데이터 버킷팅 유지 관리 {#4-maintain-data-bucketing}

:::tip 팁

현재 Doris는 새로 추가되는 파티션의 버킷 수 변경만 지원합니다. 다음 작업은 지원하지 않습니다.

1. 버킷팅 유형 변경은 지원하지 않습니다.
2. 버킷 키 변경은 지원하지 않습니다.
3. 이미 생성된 버킷의 수 변경은 지원하지 않습니다.

:::

테이블을 생성할 때는 `DISTRIBUTED` 절을 통해 각 파티션의 버킷 수를 일괄적으로 지정합니다. 데이터 증가나 감소에 대응하려면 파티션을 동적으로 추가할 때 새 파티션의 버킷 수를 개별적으로 지정할 수 있습니다.

다음 예시는 `ALTER TABLE` 명령을 통해 새로 추가되는 파티션의 버킷 수를 변경하는 방법을 보여 줍니다.

```sql
-- Modify hash bucket table
ALTER TABLE demo.hash_bucket_tbl 
ADD PARTITION p250103 VALUES LESS THAN("2025-01-03")
DISTRIBUTED BY HASH(region) BUCKETS 16;

-- Modify random bucket table
ALTER TABLE demo.random_bucket_tbl 
ADD PARTITION p250103 VALUES LESS THAN("2025-01-03")
DISTRIBUTED BY RANDOM BUCKETS 16;

-- Modify dynamic partition table
ALTER TABLE demo.dynamic_partition_tbl
SET ("dynamic_partition.buckets"="16");
```

버킷 수를 변경한 후에는 `SHOW PARTITION` 명령으로 결과를 확인할 수 있습니다.
