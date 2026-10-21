---
{
    "title": "Unique Key 모델의 UPDATE",
    "language": "ko",
    "description": "Apache Doris Unique Key 모델에서 UPDATE 문을 사용하여 행 단위 데이터를 업데이트하는 방법과 적용 시나리오, 원리, 실전 예제를 설명합니다."
}
---

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenarios: Data correction / ETL field batch processing / Business state changes -->

Doris에 데이터를 기록한 후에는 기존 데이터를 수정해야 하는 업무 요구가 자주 발생합니다. 주문 상태가 변경되거나, ETL 작업에서 특정 필드의 값을 채워야 하거나, 일부 과거 레코드에서 오류가 발견되어 수정해야 하는 경우가 있습니다. 이러한 요구를 충족하기 위해 Doris는 Unique Key 모델에서 표준 `UPDATE` 문을 제공하여 조건에 따른 행 단위 데이터 업데이트를 지원합니다.

이 문서에서는 Doris의 `UPDATE` 명령이 적용되는 시나리오, 기본 원리, 대표적인 사용법을 설명합니다. 참고: **`UPDATE` 명령은 Unique 데이터 모델을 사용하는 테이블에만 적용됩니다**.

## 적용 시나리오 {#applicable-scenarios}

`UPDATE` 명령은 주로 다음 두 가지 대표적인 시나리오에 사용됩니다.

| 시나리오 유형     | 설명                                                                                            | 권장 사용 빈도       |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------ |
| 소규모 업데이트 | 소수 레코드의 잘못된 필드를 수정하거나 소수 레코드의 상태를 업데이트합니다. 주문 상태 변경이 그 예입니다. | INSERT와 비슷한 빈도로 사용할 수 있습니다.   |
| ETL 일괄 처리 | 특정 필드를 일괄 업데이트합니다. 일부 컬럼의 값을 채우거나 다시 계산해야 하는 ETL 처리 시나리오에서 흔히 사용됩니다. | 호출 빈도가 낮은 경우에만 적합합니다. |

## 기본 원리 {#basic-principles}

<!-- Knowledge type: Principle explanation -->

`UPDATE` 명령의 실행 흐름은 다음과 같습니다.

1. 쿼리 엔진 자체의 `WHERE` 필터링 로직을 사용하여 대상 테이블에서 업데이트할 행을 선택합니다.
2. 메모리에서 해당 행의 대상 컬럼을 수정합니다.
3. Unique 모델의 "Value 컬럼의 새 데이터가 기존 데이터를 대체하는" 메커니즘을 사용하여 변경된 행을 테이블에 다시 삽입함으로써 행 단위 업데이트를 수행합니다.

### 동기 실행 {#synchronous-execution}

Doris에서 `UPDATE`는 **동기식 문**입니다. `UPDATE` 문이 성공적으로 반환되면 업데이트가 완료된 것이며, 새 데이터를 즉시 조회할 수 있습니다.

### 성능 특성 {#performance-characteristics}

`UPDATE` 문의 성능은 주로 다음 두 가지 요인에 따라 달라집니다.

- **업데이트할 행 수**: 업데이트할 행이 많을수록 `UPDATE` 문의 실행 속도가 느려집니다.
    - 소규모 업데이트: Doris는 `INSERT INTO`와 비슷한 실행 빈도를 지원합니다.
    - 대규모 업데이트: 단일 `UPDATE` 실행에 오랜 시간이 걸리므로 호출 빈도가 낮은 경우에만 적합합니다.

- **쿼리 조건의 검색 효율**: `UPDATE`는 먼저 쿼리 조건에 맞는 행을 읽는 방식으로 구현되어 있으므로, 쿼리 조건에 따른 검색이 효율적일수록 `UPDATE`가 더 빠르게 실행됩니다.
    - 권장 사항: 전체 테이블 스캔을 피할 수 있도록 가능한 한 조건 컬럼에서 인덱스를 활용하거나 파티션 또는 버킷 프루닝을 수행할 수 있게 하세요.
    - **강력히 비권장**: 조건 컬럼에 Value 컬럼을 포함하는 것.

## 사용 예제 {#usage-example}

<!-- Knowledge type: Operating steps -->
<!-- Applicable scenarios: Financial risk control / Field batch processing -->

다음 예제에서는 금융 리스크 관리 시나리오를 통해 `UPDATE` 명령으로 거래 상세 테이블의 위험 등급을 일괄적으로 채우는 방법을 보여 줍니다.

### 1. 테이블 생성 {#1-create-the-table}

Unique Key 모델을 사용하고 MOW(Merge-on-Write) 모드를 활성화한 거래 상세 테이블을 생성합니다.

```sql
CREATE TABLE transaction_details (
    transaction_id BIGINT NOT NULL,        -- Unique transaction ID
    user_id BIGINT NOT NULL,               -- User ID
    transaction_date DATE NOT NULL,        -- Transaction date
    transaction_time DATETIME NOT NULL,    -- Transaction time
    transaction_amount DECIMAL(18, 2),     -- Transaction amount
    transaction_device STRING,             -- Transaction device
    transaction_region STRING,             -- Transaction region
    average_daily_amount DECIMAL(18, 2),   -- Average daily transaction amount in the last 3 months
    recent_transaction_count INT,          -- Number of transactions in the last 7 days
    has_dispute_history BOOLEAN,           -- Whether there is a chargeback record
    risk_level STRING                      -- Risk level
)
UNIQUE KEY(transaction_id)
DISTRIBUTED BY HASH(transaction_id) BUCKETS 16
PROPERTIES (
    "replication_num" = "3",                     -- Number of replicas, default 3
    "enable_unique_key_merge_on_write" = "true"  -- Enable MOW mode to support merge updates
);
```

### 2. 초기 데이터 {#2-initial-data}

테이블에는 다음 거래 데이터가 이미 있으며, `risk_level` 필드는 아직 채워지지 않은 상태입니다.

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

### 3. 리스크 관리 규칙 {#3-risk-control-rules}

다음 리스크 관리 규칙에 따라 당일의 모든 거래 레코드에 대한 위험 등급을 업데이트합니다.

| 번호 | 규칙                                          | 위험 등급 |
| --- | --------------------------------------------- | ---------- |
| 1   | 차지백 기록이 있음                       | high       |
| 2   | 고위험 지역에서 발생한 거래                         | high       |
| 3   | 비정상적인 거래 금액(일평균의 5배 초과) | high       |
| 4   | 최근 7일간 거래 횟수가 50회 초과  | high       |
| 5   | 최근 7일간 거래 횟수가 20~50회      | medium     |
| 6   | 심야 시간대 거래(오전 2시부터 오전 4시 사이) | medium     |
| 7   | 기타(기본값)                               | low        |

### 4. UPDATE 실행 {#4-run-update}

`CASE WHEN` 표현식을 사용하여 하나의 문으로 당일 레코드에 위의 모든 규칙을 적용합니다.

```sql
UPDATE transaction_details
SET risk_level = CASE
    -- Transactions with a chargeback record or in a high-risk region
    WHEN has_dispute_history = TRUE THEN 'high'
    WHEN transaction_region IN ('high_risk_region1', 'high_risk_region2') THEN 'high'

    -- Sudden abnormal transaction amount
    WHEN transaction_amount > 5 * average_daily_amount THEN 'high'

    -- Very high transaction frequency in the last 7 days
    WHEN recent_transaction_count > 50 THEN 'high'
    WHEN recent_transaction_count BETWEEN 20 AND 50 THEN 'medium'

    -- Off-hours transactions
    WHEN HOUR(transaction_time) BETWEEN 2 AND 4 THEN 'medium'

    -- Default risk
    ELSE 'low'
END
WHERE transaction_date = '2024-11-24';
```

### 5. 업데이트 결과 {#5-update-result}

`UPDATE`가 성공적으로 실행된 후 테이블을 쿼리하면 규칙에 따라 `risk_level` 필드가 채워진 것을 확인할 수 있습니다.

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

`UPDATE` 명령의 전체 구문은 [UPDATE](../../sql-manual/sql-statements/data-modification/DML/UPDATE) 명령 매뉴얼을 참조하세요. MySQL 클라이언트의 명령줄에서 `HELP UPDATE`를 실행해도 자세한 정보를 확인할 수 있습니다.
