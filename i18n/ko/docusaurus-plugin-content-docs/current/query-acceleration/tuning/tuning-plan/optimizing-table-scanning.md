---
{
    "title": "파티션 프루닝 최적화: Doris 쿼리 성능 튜닝",
    "sidebar_label": "파티션 프루닝 최적화",
    "language": "ko",
    "description": "Doris의 파티션 프루닝으로 스캔하는 데이터양을 줄이고 쿼리 속도를 높이려면 어떻게 해야 할까요? 이 문서에서는 예제를 통해 원리, SQL 패턴, EXPLAIN을 활용한 검증 방법을 설명합니다.",
    "keywords": ["Doris 파티션 프루닝", "Partition Pruning", "테이블 스캔 최적화", "쿼리 성능 튜닝", "EXPLAIN 파티션"]
}
---

<!-- Knowledge type: Tuning guide -->
<!-- Applicable scenario: Slow large-table queries, high I/O overhead, need to filter data by partition columns -->

**Partition Pruning**은 쿼리 조건을 바탕으로 관련 파티션을 지능적으로 식별하여 해당 파티션만 스캔하고 관련 없는 파티션은 건너뛰는 쿼리 최적화 기법입니다.

Doris는 파티션 프루닝을 통해 I/O와 연산량을 크게 줄여 대용량 테이블의 쿼리 속도를 높일 수 있습니다.

**적용 여부 확인 목록**:

- 테이블이 업무에 사용하는 컬럼(예: 날짜)을 기준으로 파티셔닝되어 있습니다.
- 쿼리 조건에 파티션 컬럼에 대한 필터(예: `WHERE date BETWEEN ...`)가 포함되어 있습니다.
- 스캔하는 파티션 수를 줄이고 I/O를 낮추고자 합니다.
- `EXPLAIN`으로 프루닝 적용 여부를 확인해야 합니다.

## 사례: 날짜별로 파티셔닝된 매출 테이블 {#case-a-sales-table-partitioned-by-date}

<!-- Knowledge type: Operational example -->
<!-- Applicable scenario: Date-range queries, time-series data analysis -->

다음 사례는 Doris의 파티션 프루닝 기능을 보여 줍니다.

### 1. 테이블 생성: 날짜 기준 범위 파티셔닝 {#1-create-a-table-range-partitioning-by-date}

**목표**: 매출 데이터 테이블 `sales`를 날짜 기준으로 파티셔닝하여 월별로 파티션을 하나씩 생성합니다.

**명령**:

```sql
CREATE TABLE sales (
    date DATE,
    product VARCHAR(50),
    amount DECIMAL(10, 2)
)
PARTITION BY RANGE(date) (
    PARTITION p1 VALUES LESS THAN ('2023-01-01'),
    PARTITION p2 VALUES LESS THAN ('2023-02-01'),
    PARTITION p3 VALUES LESS THAN ('2023-03-01'),
    PARTITION p4 VALUES LESS THAN ('2023-04-01')
)
DISTRIBUTED BY HASH(date) BUCKETS 16
PROPERTIES
(
    "replication_num" = "1"
);
```

**설명**: 파티션 컬럼은 `date`입니다. 파티션은 총 4개이며, 각 파티션은 한 달 분량의 데이터를 포함합니다.

### 2. 쿼리: 파티션 컬럼에 필터 적용 {#2-query-with-a-filter-on-the-partition-column}

**목표**: 2023년 일월 15일부터 2023년 이월 15일까지의 총매출액을 조회합니다.

**명령**:

```sql
SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

**설명**: `WHERE` 절에 파티션 컬럼 `date`에 대한 범위 필터가 포함되어 있습니다. 이는 파티션 프루닝을 활성화하는 핵심 조건입니다.

### 3. 파티션 프루닝 실행 과정 {#3-partition-pruning-execution-process}

| 단계 | Doris 동작 | 결과 |
| :--- | :--- | :--- |
| 1 | 쿼리 조건의 파티션 컬럼 `date` 분석 | `2023-01-15`부터 `2023-02-15`까지의 날짜 범위 식별 |
| 2 | 쿼리 조건과 파티션 정의 비교 | 조건에 맞는 파티션 `p2`와 `p3` 선택 |
| 3 | 관련 없는 파티션 자동으로 건너뛰기 | `p1`과 `p4` 건너뛰기 |
| 4 | 조건에 맞는 파티션에서만 스캔 및 집계 수행 | 결과를 빠르게 반환 |

### 4. EXPLAIN으로 프루닝 검증 {#4-verify-pruning-with-explain}

<!-- Knowledge type: Verification method -->
<!-- Applicable scenario: Confirm whether the optimization takes effect -->

**목표**: `EXPLAIN` 명령으로 실행 계획을 살펴보고 실제로 스캔하는 파티션 수를 확인합니다.

**명령**:

```sql
EXPLAIN SELECT SUM(amount) AS total_amount
FROM sales
WHERE date BETWEEN '2023-01-15' AND '2023-02-15';
```

**주요 출력**:

```text
|   0:VOlapScanNode(212)                                                     |
|      TABLE: cir.sales(sales), PREAGGREGATION: ON                           |
|      PREDICATES: (date[#0] >= '2023-01-15') AND (date[#0] <= '2023-02-15') |
|      partitions=2/4 (p2,p3)                                                |
```

**설명**: `partitions=2/4 (p2,p3)` 필드가 `OlapScanNode`에 표시되면 전체 4개 파티션 중 2개(`p2`와 `p3`)만 스캔된다는 뜻이며, 파티션 프루닝이 적용되었음을 의미합니다.

## 비교: 프루닝이 적용되는 경우와 적용되지 않는 경우 {#comparison-pruning-effective-vs-not-effective}

<!-- Knowledge type: Comparison table -->
<!-- Applicable scenario: Quickly determine whether a query can benefit from pruning optimization -->

| 구분 | 파티션 프루닝이 적용되는 경우 | 파티션 프루닝이 적용되지 않는 경우 |
| :--- | :--- | :--- |
| 쿼리 조건 | 파티션 컬럼에 대한 필터 포함 | 파티션 컬럼 조건이 없거나 파티션 컬럼에 함수 적용 |
| 스캔하는 파티션 수 | 조건에 맞는 파티션만 스캔 | 모든 파티션 스캔 |
| I/O 오버헤드 | 낮음 | 높음 |
| EXPLAIN 출력 | `partitions=N/M` (N < M) | `partitions=M/M` |

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshooting when pruning is not effective -->

### Q1: 쿼리가 느려서 파티션 프루닝이 적용되지 않는 것으로 의심됩니다. 어떻게 확인하나요? {#q1-the-query-is-slow-and-i-suspect-partition-pruning-is-not-effective-how-do-i-confirm-this}

`EXPLAIN <query>`를 실행하고 `partitions=N/M` 필드를 `OlapScanNode`에서 확인하세요. `N == M`이면 모든 파티션을 스캔하므로 프루닝이 적용되지 않은 것입니다.

### Q2: `WHERE`에 파티션 컬럼이 포함되어 있는데도 쿼리가 모든 파티션을 스캔하는 이유는 무엇인가요? {#q2-why-does-the-query-still-scan-all-partitions-even-though-where-includes-the-partition-column}

일반적인 원인은 다음과 같습니다.

- 파티션 컬럼에 함수(예: `DATE_FORMAT(date, ...)`)가 적용되어 있어 옵티마이저가 범위를 도출할 수 없습니다.
- 타입이 일치하지 않습니다. 예를 들어 파티션 컬럼은 `DATE` 타입인데 필터 값은 암시적으로 변환할 수 없는 문자열인 경우입니다.
- `OR`로 파티션 컬럼이 아닌 컬럼의 조건이 연결되어 있어 조건을 푸시다운할 수 없습니다.

### Q3: 파티션 프루닝과 버킷 프루닝은 어떻게 다른가요? {#q3-what-is-the-difference-between-partition-pruning-and-bucket-pruning}

- **Partition Pruning**: `PARTITION BY` 컬럼을 기준으로 파티션을 프루닝합니다.
- **Bucket Pruning / Tablet Pruning**: `DISTRIBUTED BY HASH` 컬럼에 대한 동등 조건을 기준으로 태블릿을 프루닝합니다.
두 방법을 함께 사용하면 스캔하는 데이터양을 더욱 줄일 수 있습니다.

## 요약 {#summary}

<!-- Knowledge type: Key takeaways -->
<!-- Applicable scenario: Implementation recommendations -->

- 파티션 프루닝은 쿼리 조건과 파티션 간의 대응 관계를 자동으로 식별하고 필요한 파티션만 스캔합니다.
- 핵심 전제 조건은 테이블이 업무에 사용하는 컬럼을 기준으로 파티셔닝되어 있고, 쿼리에 파티션 컬럼에 대한 푸시다운 가능한 필터 조건이 포함되어 있어야 한다는 것입니다.
- `partitions=N/M` 필드를 `EXPLAIN`에서 확인하면 프루닝 적용 여부를 빠르게 검증할 수 있습니다.
- 파티션 프루닝을 적절히 활용하면 I/O와 연산 오버헤드를 크게 줄여 대규모 데이터셋의 쿼리 속도를 높일 수 있습니다.
