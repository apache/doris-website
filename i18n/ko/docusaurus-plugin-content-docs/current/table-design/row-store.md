---
{
    "title": "행 저장소(Row Store)",
    "language": "ko",
    "description": "Doris Row Store는 열 기반 스토리지에 행 기반 형식을 추가하여 와이드 테이블의 포인트 쿼리에서 발생하는 여러 IO를 하나로 통합하고, IOPS와 쿼리 지연 시간을 크게 줄입니다."
}
---

<!-- Knowledge type: Feature introduction / Configuration parameters -->
<!-- Applicable scenarios: Wide-table point query / TOPN query performance tuning -->

**Row Store**는 열 기반 스토리지에 더해 각 행의 복사본을 압축된 바이너리 행 형식으로 저장하는 Doris 기능입니다. 포인트 쿼리에서 "열마다 한 번의 IO"가 필요했던 작업을 "한 번의 IO로 전체 행 읽기"로 바꿉니다. 이 기능은 Doris 2.0.0부터 지원됩니다.

기본적으로 Doris는 각 열을 연속적으로 저장하는 열 기반 스토리지를 사용합니다. 열 기반 스토리지는 필요한 열만 읽으면 되므로 분석 시나리오(집계, 필터링, 정렬 등)에서 우수한 성능을 발휘합니다. 하지만 포인트 쿼리 시나리오(예: `SELECT *`)에서는 모든 열을 읽어야 하며, 열마다 한 번의 IO가 필요합니다. 열이 많은 와이드 테이블(예: 수백 개의 열)에서는 IOPS가 병목이 됩니다.

행 저장소를 활성화하면 시스템은 쓰기 시점에 한 행의 모든 열을 압축된 바이너리 형식으로 연결하여 추가 열에 저장합니다. 그러면 포인트 쿼리는 한 번의 IO만으로 전체 행 데이터를 읽을 수 있어 IOPS를 크게 줄이고 쿼리 지연 시간을 개선합니다.

## 적용 시나리오 {#applicable-scenarios}

행 저장소는 주로 다음 두 가지 쿼리 유형을 대상으로 합니다. 아래 표를 통해 활성화 여부를 빠르게 판단할 수 있습니다.

| 시나리오 | 일반적인 쿼리 패턴 | 테이블 모델 요구 사항 | 권장 여부 |
|------|-------------|-----------|---------|
| 동시성이 높은 기본 키 포인트 쿼리 | `SELECT ... FROM t WHERE pk1 = ? AND pk2 = ?` | Unique Key MOW 테이블 | 권장 |
| 와이드 테이블 TOPN 쿼리 | `SELECT * FROM t [WHERE ...] ORDER BY ... LIMIT N` | Duplicate 테이블 / Unique Key MOW 테이블 | 권장 |
| 분석 쿼리 | 집계, 소수의 열에 대한 복잡한 필터링 등 | — | 권장하지 않음(열 기반 스토리지로 충분) |

다음 절에서는 각 시나리오의 적용 조건, 테이블 생성 방법, 쿼리 예제를 설명합니다.

## 시나리오 1: 동시성이 높은 기본 키 포인트 쿼리 {#scenario-1-high-concurrency-primary-key-point-query}

Unique Key MOW 테이블에서 전체 기본 키로 특정 행을 조회하는, 동시성이 높은 시나리오에 적용됩니다. 조건이 충족되면 쿼리는 Short-Circuit 경로를 사용하여 일반 실행 파이프라인을 우회합니다.

### 적용 조건 {#trigger-conditions}

다음 조건을 **모두 동시에** 충족해야 합니다.

1. 테이블이 Unique Key MOW 테이블이어야 합니다(`"enable_unique_key_merge_on_write" = "true"`).
2. `"store_row_column" = "true"` 또는 `"row_store_columns" = "..."`로 행 저장소를 활성화해야 합니다.
3. `WHERE` 절에 **모든 기본 키 열에 대한 동등 조건**이 포함되어야 하며, 이 조건들을 `AND`로 연결해야 합니다.

### 테이블 생성 예제 {#table-creation-example}

다음 예제는 열이 8개인 테이블을 생성하고, 그중 5개에만 행 저장소를 활성화하며, 최상의 포인트 쿼리 성능을 위해 `page_size`를 4 KB로 설정합니다.

```sql
CREATE TABLE `tbl_point_query` (
    `k` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "row_store_columns" = "k,v1,v3,v5,v7",
    "row_store_page_size" = "4096"
);
```

### 쿼리 예제 {#query-example}

```sql
-- Query all columns
SELECT * FROM tbl_point_query WHERE k = 100;

-- Query a subset of columns
SELECT k, v1, v3, v5, v7 FROM tbl_point_query WHERE k = 100;
```

**일부 열만 행 저장소에 저장하는 경우의 처리:** 행 저장소에 일부 열(예: `v1`)만 포함되어 있는데 쿼리에서 행 저장소에 없는 열(예: `v2`)을 요청하면, Doris는 누락된 열을 열 기반 스토리지에서 읽습니다. 행 저장소에 있는 열은 계속 효율적으로 읽고, 나머지 열은 일반적인 열 기반 IO로 읽습니다.

### 확인 방법 {#verification-method}

쿼리에 대해 `EXPLAIN`을 실행합니다. 출력에 `SHORT-CIRCUIT` 표시가 있어야 합니다. 자세한 내용은 [동시성이 높은 포인트 쿼리](../query-acceleration/high-concurrent-point-query)를 참조하세요.

## 시나리오 2: TOPN 지연 구체화 쿼리 {#scenario-2-topn-lazy-materialization-query}

Duplicate 테이블이나 Unique Key MOW 테이블에서 "정렬한 다음 소수의 행을 가져오는" 와이드 테이블 `SELECT *` 쿼리에 적용됩니다. 조건이 충족되면 쿼리는 Fetch Row Store 경로를 사용하며, TOPN의 두 단계 최적화와 결합하여 실제로 선택된 행만 가져옵니다.

### 적용 조건 {#trigger-conditions-1}

다음 조건을 **모두 동시에** 충족해야 합니다.

1. 테이블이 Duplicate 테이블 또는 Unique Key MOW 테이블이어야 합니다(`"enable_unique_key_merge_on_write" = "true"`).
2. **모든 열**에 행 저장소를 활성화해야 합니다(`"store_row_column" = "true"`).
3. 쿼리가 `SELECT * FROM tbl [WHERE ...] ORDER BY ... LIMIT N` 패턴과 일치해야 합니다.
4. 반드시 `SELECT *`여야 하며, 특정 열을 선택하는 방식은 지원하지 않습니다.
5. TOPN 지연 구체화 최적화가 적용되어야 합니다. 자세한 내용은 [TOPN 쿼리 최적화](../query-acceleration/optimization-technology-principle/topn-optimization)를 참조하세요.

### 테이블 생성 예제 {#table-creation-example-1}

```sql
CREATE TABLE `tbl_duplicate` (
    `k` int(11) NULL,
    `v1` string NULL
) ENGINE=OLAP
DUPLICATE KEY(`k`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "light_schema_change" = "true",
    "store_row_column" = "true",
    "row_store_page_size" = "4096"
);
```

:::note
Duplicate 테이블은 반드시 `"store_row_column" = "true"`를 설정해야 하며, `row_store_columns`를 통해 일부 열만 지정하는 방식은 지원하지 않습니다. 모든 열이 행 저장소에 저장됩니다.
:::

### 쿼리 예제 {#query-example-1}

```sql
SELECT * FROM tbl_duplicate WHERE k < 10 ORDER BY k LIMIT 10;
```

### 확인 방법 {#verification-method-1}

쿼리에 대해 `EXPLAIN`을 실행합니다. 출력에 `FETCH ROW STORE` 표시와 `OPT TWO PHASE` 표시가 모두 있어야 합니다.

## 구성 매개변수 {#configuration-parameters}

다음 매개변수를 `PROPERTIES`에 설정하여 `CREATE TABLE`을 실행합니다.

| 매개변수 | 기본값 | 지원 버전 | 설명 |
|------|--------|---------|------|
| `store_row_column` | `false` | 2.0+ | `true`로 설정하면 **모든 열**에 행 저장소를 활성화합니다. |
| `row_store_columns` | 모든 열 | 3.0+ | **지정한 열**에만 행 저장소를 활성화하며, 형식은 `"col1,col2,..."`입니다. 이 매개변수를 설정하면 `store_row_column`이 암묵적으로 활성화됩니다. 모든 열을 저장하는 방식에 비해 스토리지 오버헤드를 크게 줄일 수 있습니다. |
| `row_store_page_size` | `16384` (16 KB) | 2.0+ | 행 저장소의 페이지 크기이며, 단위는 바이트입니다. 페이지는 최소 IO 단위이므로 행 하나만 읽어도 페이지 하나만큼의 IO가 발생합니다. |

### `row_store_page_size` 튜닝 권장 사항 {#row_store_page_size-tuning-recommendations}

`row_store_page_size`는 포인트 쿼리 성능과 스토리지 오버헤드 간의 균형에 직접적인 영향을 미칩니다.

| 최적화 목표 | 권장값 | 상충 관계 |
|---------|--------|------|
| 최상의 포인트 쿼리 성능 | 4096 (4 KB) 이하 | 스토리지 오버헤드 증가 |
| 균형 유지(기본값) | 16384 (16 KB) | — |
| 최소 스토리지 오버헤드 | 65536 (64 KB) 이상 | 포인트 쿼리 지연 시간 증가 |

## 참고 사항 {#notes}

1. **스토리지 오버헤드:** 행 저장소를 활성화하면 디스크 사용량이 증가합니다. 데이터 특성에 따라 추가 스토리지는 일반적으로 원래 테이블 크기의 2~10배입니다. 실제 데이터로 테스트하여 영향을 평가하세요.
2. **`page_size`가 스토리지에 미치는 영향:** `row_store_page_size`를 줄이면 포인트 쿼리 성능이 개선되지만 스토리지 오버헤드가 증가합니다. 튜닝 권장 사항은 [구성 매개변수](#configuration-parameters) 절을 참조하세요.
3. **ALTER 미지원:** `store_row_column` 및 `row_store_columns` 속성을 `ALTER TABLE`로 수정하는 것은 지원하지 않습니다.
