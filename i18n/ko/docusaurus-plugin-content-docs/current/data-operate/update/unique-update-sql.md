---
{
    "title": "UPDATE 명령으로 데이터 업데이트",
    "language": "ko",
    "description": "Doris Unique Key Model 테이블에서 UPDATE 명령으로 데이터를 수정할 수 있으며, 소규모 행 단위 업데이트와 필드 단위 ETL 일괄 업데이트를 지원합니다."
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Row-level data correction / Field batch update / ETL processing -->

이 문서는 Apache Doris에서 `UPDATE` 명령을 사용하여 Unique Key Model 테이블의 데이터를 수정하는 방법을 설명합니다. 적용 시나리오, 동작 원리, 성능에 영향을 주는 요인, 전체 사용 예제를 다룹니다.

`UPDATE` 명령은 Unique Key Model을 사용하는 테이블에만 적용됩니다.

## 적용 시나리오 {#applicable-scenarios}

다음 두 가지 대표적인 시나리오에서 `UPDATE` 명령을 사용하는 것이 좋습니다.

| 시나리오 | 설명 | 예시 |
| --- | --- | --- |
| 소규모 데이터 업데이트 | 소수 레코드의 잘못된 필드를 수정하거나 특정 필드의 상태를 업데이트 | 주문 상태 정정, 개별 필드의 잘못된 데이터 수정 |
| 필드 단위 ETL 일괄 처리 | 특정 필드에 대규모 업데이트를 적용하며, ETL 시나리오에서 주로 사용 | 위험 수준 일괄 재계산, 태그 필드 일괄 갱신 |

:::caution 주의
대규모 데이터 업데이트는 드물게 수행해야 합니다. 빈번하게 실행하지 마세요.
:::

## 동작 원리 {#how-it-works}

<!-- Knowledge type: Concept -->

`UPDATE`의 핵심 실행 흐름은 다음과 같습니다.

1. 쿼리 엔진이 `WHERE` 조건에 따라 업데이트할 행을 필터링합니다.
2. Unique Key Model의 Value 컬럼 덮어쓰기 로직에 따라 새 데이터가 기존 데이터를 대체합니다.
3. 수정된 행을 테이블에 다시 기록하여 행 단위 업데이트를 완료합니다.

### 동기 실행 {#synchronicity}

Doris의 `UPDATE` 문은 동기적으로 실행됩니다. `UPDATE` 문이 성공적으로 반환되면 업데이트 작업이 완료된 상태이며, 데이터를 즉시 조회할 수 있습니다.

### 성능 {#performance}

`UPDATE` 문의 성능은 주로 다음 두 가지 요인에 따라 결정됩니다.

| 요인 | 설명 | 최적화 권장 사항 |
| --- | --- | --- |
| 업데이트할 행 수 | 행이 많을수록 실행 속도가 느려짐 | 소규모 업데이트는 `INSERT INTO`와 같은 빈도로 사용할 수 있지만, 대규모 업데이트는 호출 빈도가 낮은 경우에만 적합함 |
| 쿼리 조건의 효율성 | `UPDATE`는 먼저 조건에 일치하는 행을 읽음 | 전체 테이블 스캔을 피하도록 조건 컬럼에서 인덱스 또는 파티션/버킷 프루닝을 활용할 수 있어야 함 |

:::tip 팁
`WHERE` 조건에 Value 컬럼을 포함하지 않는 것을 강력히 권장합니다. 이렇게 하면 쿼리 조건에서 기본 키나 인덱스를 효율적으로 활용할 수 있습니다.
:::

## 사용 예제 {#usage-example}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Financial risk control / Batch update of risk levels -->

다음 예제는 금융 위험 관리 시나리오를 통해 `UPDATE`를 사용하여 거래 레코드의 위험 수준을 일괄 업데이트하는 방법을 보여줍니다.

### 1단계: 테이블 생성 {#step-1-create-the-table}

Merge-on-Write가 활성화된 Unique Key Model을 사용하는 거래 상세 테이블 `transaction_details`를 생성합니다.

```sql
CREATE TABLE transaction_details (
    transaction_id BIGINT NOT NULL,        -- Unique transaction ID
    user_id BIGINT NOT NULL,               -- User ID
    transaction_date DATE NOT NULL,        -- Transaction date
    transaction_time DATETIME NOT NULL,    -- Transaction time
    transaction_amount DECIMAL(18, 2),     -- Transaction amount
    transaction_device STRING,             -- Transaction device
    transaction_region STRING,             -- Transaction region
    average_daily_amount DECIMAL(18, 2),   -- Average daily transaction amount over the last 3 months
    recent_transaction_count INT,          -- Number of transactions in the last 7 days
    has_dispute_history BOOLEAN,           -- Whether there is a dispute history
    risk_level STRING                      -- Risk level
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
    "replication_num" = "3",                       -- Number of replicas, default is 3
    "enable_unique_key_merge_on_write" = "true"    -- Enable MOW mode to support merge updates
);
```

### 2단계: 초기 데이터 확인 {#step-2-view-the-initial-data}

테이블에 다음과 같은 거래 데이터가 이미 있으며, `risk_level` 필드에는 아직 값이 지정되지 않았다고 가정합니다.

```sql
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
| transaction_id | user_id | transaction_date | transaction_time    | transaction_amount | transaction_device | transaction_region | average_daily_amount | recent_transaction_count | has_dispute_history | risk_level |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
|           1001 |    5001 | 2024-11-24       | 2024-11-24 14:30:00 |             100.00 | iPhone 12          | New York           |               100.00 |                       10 |                   0 | NULL       |
|           1002 |    5002 | 2024-11-24       | 2024-11-24 03:30:00 |             120.00 | iPhone 12          | New York           |               100.00 |                       15 |                   0 | NULL       |
|           1003 |    5003 | 2024-11-24       | 2024-11-24 10:00:00 |             150.00 | Samsung S21        | Los Angeles        |               100.00 |                       30 |                   0 | NULL       |
|           1004 |    5004 | 2024-11-24       | 2024-11-24 16:00:00 |             300.00 | MacBook Pro        | high_risk_region1  |               200.00 |                        5 |                   0 | NULL       |
|           1005 |    5005 | 2024-11-24       | 2024-11-24 11:00:00 |            1100.00 | iPad Pro           | Chicago            |               200.00 |                       10 |                   0 | NULL       |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
```

### 3단계: 위험 관리 규칙 정의 {#step-3-define-the-risk-control-rules}

다음 우선순위 규칙을 적용하여 당일의 모든 거래 레코드에 위험 수준을 일괄 지정합니다.

| 우선순위 | 규칙 | 위험 수준 |
| --- | --- | --- |
| 1 | 분쟁 이력이 있는 거래 | 높음 |
| 2 | 고위험 지역의 거래(예: `high_risk_region1`, `high_risk_region2`) | 높음 |
| 3 | 금액이 비정상적인 거래(일평균 금액의 5배 초과) | 높음 |
| 4 | 최근 7일간 거래 횟수가 50회 초과 | 높음 |
| 5 | 최근 7일간 거래 횟수가 20회 이상 50회 이하 | 중간 |
| 6 | 비활동 시간대(오전 2시부터 4시까지)의 거래 | 중간 |
| 7 | 그 밖의 기본 사례 | 낮음 |

### 4단계: UPDATE 실행 {#step-4-execute-update}

위 규칙을 하나의 `UPDATE` 문으로 작성하고, `CASE WHEN`으로 여러 조건을 표현합니다.

```sql
UPDATE transaction_details
SET risk_level = CASE
    -- Transactions with a dispute history or from high-risk regions
    WHEN has_dispute_history = TRUE THEN 'high'
    WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

    -- Abnormal transaction amount
    WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

    -- High-frequency transactions in the last 7 days
    WHEN recent_transaction_count > 50 THEN 'high'
    WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

    -- Transactions during off-hours
    WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

    -- Default risk level
    ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

### 5단계: 업데이트 결과 검증 {#step-5-verify-the-update-results}

실행 후 데이터를 다시 쿼리합니다. `risk_level` 필드가 규칙에 따라 업데이트되었습니다.

```sql
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
| transaction_id | user_id | transaction_date | transaction_time    | transaction_amount | transaction_device | transaction_region | average_daily_amount | recent_transaction_count | has_dispute_history | risk_level |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
|           1001 |    5001 | 2024-11-24       | 2024-11-24 14:30:00 |             100.00 | iPhone 12          | New York           |               100.00 |                       10 |                   0 | low        |
|           1002 |    5002 | 2024-11-24       | 2024-11-24 03:30:00 |             120.00 | iPhone 12          | New York           |               100.00 |                       15 |                   0 | medium     |
|           1003 |    5003 | 2024-11-24       | 2024-11-24 10:00:00 |             150.00 | Samsung S21        | Los Angeles        |               100.00 |                       30 |                   0 | medium     |
|           1004 |    5004 | 2024-11-24       | 2024-11-24 16:00:00 |             300.00 | MacBook Pro        | high_risk_region1  |               200.00 |                        5 |                   0 | high       |
|           1005 |    5005 | 2024-11-24       | 2024-11-24 11:00:00 |            1100.00 | iPad Pro           | Chicago            |               200.00 |                       10 |                   0 | high       |
+----------------+---------+------------------+---------------------+--------------------+--------------------+--------------------+----------------------+--------------------------+---------------------+------------+
```

## 추가 도움말 {#more-help}

- 전체 구문 참조: [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) 명령 매뉴얼을 참조하세요.
- 명령줄 도움말: MySQL 클라이언트에서 `HELP UPDATE`를 실행하여 내장 문서를 확인하세요.
