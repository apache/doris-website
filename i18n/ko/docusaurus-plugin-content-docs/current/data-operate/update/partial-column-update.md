---
{
    "title": "컬럼 업데이트",
    "language": "ko",
    "description": "Apache Doris 부분 컬럼 업데이트 가이드: Unique Key Model과 Aggregate Key Model에서 지정한 컬럼을 효율적으로 업데이트하는 방법을 설명하며, Stream Load, INSERT INTO, Flink Connector 및 유연한 컬럼 업데이트 시나리오를 다룹니다."
}
---

<!-- Knowledge type: Operations guide + Feature description -->
<!-- Use cases: Real-time field updates / Multi-source wide-table joining / Data correction -->

데이터 업데이트 과정에서는 비즈니스 요구 사항에 따라 행의 일부 필드만 수정해야 하는 경우가 많습니다. 예를 들면 다음과 같습니다.

- **실시간 고빈도 필드 업데이트**: 사용자 태그 테이블에서 최신 행동 필드를 실시간으로 갱신하여 광고 및 추천 시스템이 실시간으로 분석하고 의사 결정을 내릴 수 있도록 해야 합니다.
- **여러 소스의 와이드 테이블 조인**: 여러 소스 테이블의 데이터를 기본 키를 기준으로 하나의 와이드 테이블로 조인하며, 각 소스 테이블은 일부 컬럼의 데이터만 제공합니다.
- **데이터 보정**: 일괄 작업으로 일부 레코드의 특정 필드 값을 보정하고 나머지 필드는 그대로 유지합니다.

기존의 `UPDATE` 문은 일반적으로 전체 행을 먼저 읽은 다음 전체 행을 다시 기록해야 합니다. 이러한 "읽기-수정-쓰기" 트랜잭션은 대량 쓰기 환경에서 성능이 저하되므로 높은 처리량 요구 사항을 충족하기 어렵습니다.

**Doris가 제공하는 부분 컬럼 업데이트 기능**을 사용하면 전체 행을 먼저 읽지 않고 데이터 적재 시 변경이 필요한 컬럼만 기록할 수 있어 업데이트 효율이 크게 향상됩니다. 이 문서에서는 **Unique Key Model**과 **Aggregate Key Model**에서 부분 컬럼 업데이트를 수행하는 방법을 설명합니다.

## 기능 개요 {#capability-overview}

<!-- Knowledge type: Capability definition -->

| 데이터 모델 | 구현 방식 | 쓰기 성능 | 쿼리 성능 | 사용 사례 |
| --- | --- | --- | --- | --- |
| Unique Key (Merge-on-Write) | 쓰기 시 전체 행 보완 | 보통(IO의 영향을 받음) | 높음 | 실시간 업데이트, 쿼리 성능에 민감한 시나리오 |
| Aggregate Key (`REPLACE_IF_NOT_NULL`) | 쿼리 시 집계 | 높음(일반적인 데이터 적재와 비슷함) | 낮음(집계 쿼리가 MoW보다 5~10배 느림) | 쓰기 처리량에 민감하고 낮은 쿼리 성능을 허용할 수 있는 시나리오 |

## Unique Key Model의 컬럼 업데이트 {#column-update-on-the-unique-key-model}

<!-- Knowledge type: Operating procedure -->

Unique Key Model에서 데이터를 적재할 때 Doris는 전체 행을 먼저 읽지 않고 일부 컬럼의 데이터를 직접 삽입하거나 업데이트할 수 있어 업데이트 효율이 크게 향상됩니다.

:::caution 참고

1. 버전 2.0에서는 Unique Key의 Merge-on-Write 구현에서만 부분 컬럼 업데이트를 지원합니다.
2. 버전 2.0.2부터는 `INSERT INTO`를 사용하여 부분 컬럼 업데이트를 수행할 수 있습니다.
3. 동기식 구체화된 뷰가 있는 테이블에서는 부분 컬럼 업데이트를 지원하지 않습니다.
4. Schema Change가 진행 중인 테이블에서는 부분 컬럼 업데이트를 지원하지 않습니다.

:::

### 예제 {#example}

Doris에 주문 테이블 `order_tbl`이 있고, 주문 ID는 Key 컬럼이며 주문 상태와 주문 금액은 Value 컬럼이라고 가정합니다. 현재 데이터는 다음과 같습니다.

| 주문 ID | 주문 금액 | 주문 상태 |
| --- | --- | --- |
| 1 | 100 | 결제 대기 |

```sql
+----------+--------------+------------------+
| order_id | order_amount | order_status     |
+----------+--------------+------------------+
| 1        |          100 | Pending payment  |
+----------+--------------+------------------+
1 row in set (0.01 sec)
```

사용자가 결제 버튼을 클릭하면 주문 금액 필드에 영향을 주지 않고 주문 ID가 `1`인 주문의 상태를 `Pending shipment`으로 변경해야 합니다.

### 데이터 적재를 통한 부분 컬럼 업데이트 {#partial-column-updates-through-loading}

#### Stream Load / Broker Load / Routine Load {#stream-load--broker-load--routine-load}

다음 CSV 파일을 준비합니다.

```text
1,Pending shipment
```

데이터 적재 시 다음 헤더를 추가합니다.

```text
partial_columns:true
```

`columns` 매개변수에 데이터 적재 대상 컬럼을 지정합니다(**모든 Key 컬럼을 포함해야 하며**, 그렇지 않으면 업데이트를 수행할 수 없습니다). 다음은 Stream Load 예제입니다.

```shell
curl --location-trusted -u root: \
    -H "partial_columns:true" \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T /tmp/update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

#### INSERT INTO {#insert-into}

모든 데이터 모델에서 일부 컬럼만 지정한 `INSERT INTO`의 기본 동작은 전체 행 쓰기입니다. 잘못된 사용을 방지하기 위해 Merge-on-Write 구현에서도 `INSERT INTO`는 기본적으로 전체 행 UPSERT 의미 체계를 따릅니다. 부분 컬럼 업데이트 의미 체계를 활성화하려면 먼저 다음 세션 변수를 설정합니다.

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending shipment');
```

#### Flink Connector {#flink-connector}

Flink Connector를 사용할 때는 다음 설정을 추가합니다.

```text
'sink.properties.partial_columns' = 'true'
```

`sink.properties.column`에 데이터 적재 대상 컬럼을 지정합니다(**모든 Key 컬럼을 포함해야 하며**, 그렇지 않으면 업데이트를 수행할 수 없습니다).

### 업데이트 결과 {#update-result}

업데이트 후 결과는 다음과 같습니다.

```sql
+----------+--------------+-------------------+
| order_id | order_amount | order_status      |
+----------+--------------+-------------------+
| 1        |          100 | Pending shipment  |
+----------+--------------+-------------------+
1 row in set (0.01 sec)
```

### 참고 사항 {#notes}

<!-- Knowledge type: Performance tuning -->

Merge-on-Write 구현은 최적의 쿼리 성능을 보장하기 위해 쓰기 시 전체 행을 보완해야 합니다. 따라서 Merge-on-Write를 사용한 부분 컬럼 업데이트는 데이터 적재 성능을 어느 정도 저하시킵니다.

**쓰기 성능 최적화 권장 사항:**

- **고성능 SSD 사용**: NVMe SSD 또는 고속 클라우드 SSD를 권장합니다. 행을 보완하는 과정에서 많은 양의 기존 데이터를 읽으므로 높은 읽기 IOPS와 읽기 처리량이 발생합니다.
- **행 저장 활성화**: 행을 보완할 때 발생하는 IOPS를 크게 줄이고 데이터 적재 성능을 눈에 띄게 향상시킬 수 있습니다. 테이블 생성 시 다음 속성으로 활성화합니다.

    ```text
    "store_row_column" = "true"
    ```

**배치 제약 사항:** 동일한 배치 쓰기 작업(데이터 적재 작업 또는 `INSERT INTO`)에 포함된 모든 행은 동일한 컬럼 집합만 업데이트할 수 있습니다. 서로 다른 컬럼을 업데이트하려면 데이터를 여러 배치로 나누어야 합니다. 아래에서 설명하는 유연한 컬럼 업데이트 기능을 사용하면 이 제약을 해소할 수 있습니다.

### 유연한 컬럼 업데이트 {#flexible-column-update}

<!-- Knowledge type: Feature description -->
<!-- Use cases: Real-time CDC sync / Scenarios where the updated columns differ row by row -->

기존 Doris의 부분 컬럼 업데이트 기능에서는 한 번의 데이터 적재에 포함된 모든 행이 동일한 컬럼 집합을 업데이트해야 했습니다. **버전 3.1.0부터** Doris는 더 유연한 업데이트 방식을 지원합니다. **한 번의 데이터 적재에서 각 행이 서로 다른 컬럼 집합을 업데이트할 수 있습니다**.

:::caution 참고

1. 유연한 컬럼 업데이트는 Stream Load, Routine Load 및 Stream Load를 기반 데이터 적재 방식으로 사용하는 모든 도구(예: Doris Flink Connector)를 지원합니다.
2. 유연한 컬럼 업데이트를 사용할 때 데이터 적재 파일은 JSON 형식이어야 합니다.

:::

#### 사용 사례 {#use-cases}

CDC를 사용하여 다른 시스템의 데이터를 Doris로 실시간 동기화할 때, 소스 시스템에서 내보내는 레코드에는 전체 행 대신 기본 키와 업데이트된 컬럼만 포함될 수 있습니다. 이 경우 특정 시간 구간에 수집된 배치의 각 행이 서로 다른 컬럼을 업데이트할 수 있으며, 유연한 컬럼 업데이트를 사용하면 이러한 데이터를 Doris에 적재할 수 있습니다.

#### 사용 방법 {#usage}

##### 1. 유연한 컬럼 업데이트 활성화 {#1-enable-flexible-column-update}

**새 테이블:** 테이블 생성 시 다음 속성을 지정하여 Merge-on-Write를 활성화하고 유연한 컬럼 업데이트에 필요한 `bitmap` 숨김 컬럼을 추가합니다.

```text
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```

**기존 테이블:** 이전 Doris 버전에서 생성한 기존 Merge-on-Write 테이블은 Doris를 업그레이드한 후 다음 문으로 유연한 컬럼 업데이트를 활성화할 수 있습니다.

```sql
ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";
```

실행 후 `SHOW CREATE TABLE db1.tbl1`을 실행합니다. 결과에 `"enable_unique_key_skip_bitmap_column" = "true"`가 포함되어 있으면 기능이 정상적으로 활성화된 것입니다.

:::tip
기존 테이블에 이 방법을 적용하기 전에 대상 테이블에서 light-schema-change가 활성화되어 있는지 확인하세요.
:::

##### 2. 데이터 적재 작업에서 활성화 {#2-enable-in-load-tasks}

각 데이터 적재 방식의 설정은 다음과 같습니다.

| 데이터 적재 방식 | 설정 항목 | 값 |
| --- | --- | --- |
| Stream Load | 헤더 | `unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS` |
| Flink Doris Connector | sink 속성 | `'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'` |
| Routine Load | `PROPERTIES` | `"unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"` |

**전체 Routine Load 예제:**

```sql
CREATE ROUTINE LOAD db1.job1 ON tbl1
PROPERTIES (
    "format" = "json",
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
)
FROM KAFKA (
    "kafka_broker_list" = "localhost:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

`ALTER ROUTINE LOAD`를 사용하여 기존 Routine Load 작업의 업데이트 모드를 변경할 수도 있습니다.

```sql
-- 1. Pause the job
PAUSE ROUTINE LOAD FOR db1.job1;

-- 2. Change the update mode
ALTER ROUTINE LOAD FOR db1.job1
PROPERTIES (
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
);

-- 3. Resume the job
RESUME ROUTINE LOAD FOR db1.job1;
```

:::caution Routine Load 제약 사항

Routine Load에서 `UPDATE_FLEXIBLE_COLUMNS` 모드를 사용할 때는 다음 제약 사항이 적용됩니다.

- 데이터 형식은 JSON이어야 합니다(`"format" = "json"`).
- `jsonpaths` 속성을 지정할 수 없습니다.
- `fuzzy_parse` 옵션을 활성화할 수 없습니다.
- `COLUMNS` 절을 사용할 수 없습니다.
- `WHERE` 절을 사용할 수 없습니다.

:::

#### 전체 예제 {#full-example}

**1단계: 테스트 테이블 생성**

```sql
CREATE TABLE t1 (
    `k`  INT NULL,
    `v1` BIGINT NULL,
    `v2` BIGINT NULL DEFAULT "9876",
    `v3` BIGINT NOT NULL,
    `v4` BIGINT NOT NULL DEFAULT "1234",
    `v5` BIGINT NULL
) UNIQUE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "3",
    "enable_unique_key_merge_on_write" = "true",
    "enable_unique_key_skip_bitmap_column" = "true"
);
```

**2단계: 테이블의 기존 데이터**

```sql
MySQL root@127.1:d1> select * from t1;
+---+----+----+----+----+----+
| k | v1 | v2 | v3 | v4 | v5 |
+---+----+----+----+----+----+
| 0 | 0  | 0  | 0  | 0  | 0  |
| 1 | 1  | 1  | 1  | 1  | 1  |
| 2 | 2  | 2  | 2  | 2  | 2  |
| 3 | 3  | 3  | 3  | 3  | 3  |
| 4 | 4  | 4  | 4  | 4  | 4  |
| 5 | 5  | 5  | 5  | 5  | 5  |
+---+----+----+----+----+----+
```

**3단계: 유연한 컬럼 업데이트 데이터 준비**

각 행은 서로 다른 컬럼 집합을 업데이트할 수 있습니다.

```json
{"k": 0, "__DORIS_DELETE_SIGN__": 1}
{"k": 1, "v1": 10}
{"k": 2, "v2": 20, "v5": 25}
{"k": 3, "v3": 30}
{"k": 4, "v4": 20, "v1": 43, "v3": 99}
{"k": 5, "v5": null}
{"k": 6, "v1": 999, "v3": 777}
{"k": 2, "v4": 222}
{"k": 1, "v2": 111, "v3": 111}
```

**4단계: Stream Load를 통한 데이터 적재**

```shell
curl --location-trusted -u root: \
    -H "Expect:100-continue" \
    -H "strict_mode:false" \
    -H "format:json" \
    -H "read_json_by_line:true" \
    -H "unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS" \
    -T test1.json \
    -XPUT http://<host>:<http_port>/api/d1/t1/_stream_load
```

**5단계: 업데이트 결과 확인**

```sql
MySQL root@127.1:d1> select * from t1;
+---+-----+------+-----+------+--------+
| k | v1  | v2   | v3  | v4   | v5     |
+---+-----+------+-----+------+--------+
| 1 | 10  | 111  | 111 | 1    | 1      |
| 2 | 2   | 20   | 2   | 222  | 25     |
| 3 | 3   | 3    | 30  | 3    | 3      |
| 4 | 43  | 4    | 99  | 20   | 4      |
| 5 | 5   | 5    | 5   | 5    | <null> |
| 6 | 999 | 9876 | 777 | 1234 | <null> |
+---+-----+------+-----+------+--------+
```

#### 제약 사항 및 참고 사항 {#restrictions-and-notes}

1. 일반적인 부분 컬럼 업데이트와 마찬가지로 유연한 컬럼 업데이트에서도 모든 행에 **모든 Key 컬럼**이 포함되어야 합니다. 이 요구 사항을 충족하지 않는 행은 필터링되며 `filter rows`에 집계됩니다. `filtered rows`가 데이터 적재의 `max_filter_ratio`에서 허용하는 상한을 초과하면 전체 데이터 적재가 실패합니다. 필터링된 각 행은 오류 로그에 기록됩니다.
2. JSON 객체의 키-값 쌍 중 Key가 대상 테이블의 컬럼 이름과 일치하는 항목만 적용됩니다. 나머지는 무시됩니다. 또한 Key가 `__DORIS_VERSION_COL__`, `__DORIS_ROW_STORE_COL__` 또는 `__DORIS_SKIP_BITMAP_COL__`인 키-값 쌍도 무시됩니다.
3. Variant 컬럼이 포함된 테이블에서는 유연한 컬럼 업데이트를 지원하지 않습니다.
4. 동기식 구체화된 뷰가 있는 테이블에서는 유연한 컬럼 업데이트를 지원하지 않습니다.
5. 유연한 컬럼 업데이트를 사용할 때 다음 데이터 적재 매개변수는 지정하거나 활성화할 수 **없습니다**.
    - `merge_type`
    - `delete`
    - `fuzzy_parse`
    - `columns`
    - `jsonpaths`
    - `hidden_columns`
    - `function_column.sequence_col`
    - `sql`
    - `memtable_on_sink_node` 사전 실행
    - `group_commit`
    - `where`

### 새로 삽입되는 행의 동작 제어 {#behavior-control-for-newly-inserted-rows}

<!-- Knowledge type: Configuration parameter -->

세션 변수 또는 데이터 적재 속성인 `partial_update_new_key_behavior`는 부분 컬럼 업데이트와 유연한 컬럼 업데이트에서 **새로 삽입되는 행**의 동작을 제어합니다.

| 값 | 동작 |
| --- | --- |
| `ERROR` | 모든 행의 Key가 테이블에 이미 존재해야 하며, 그렇지 않으면 데이터 적재가 실패합니다. |
| `APPEND` | 기존 행 업데이트와 Key가 존재하지 않는 새 행 삽입을 모두 허용합니다. |

#### 예제 테이블 스키마 {#example-table-schema}

```sql
CREATE TABLE user_profile (
    id               INT,
    name             VARCHAR(10),
    age              INT,
    city             VARCHAR(10),
    balance          DECIMAL(9, 0),
    last_access_time DATETIME
) ENGINE=OLAP
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

테이블의 기존 데이터:

```sql
mysql> select * from user_profile;
+----+-------+-----+----------+---------+---------------------+
| id | name  | age | city     | balance | last_access_time    |
+----+-------+-----+----------+---------+---------------------+
|  1 | kevin |  18 | shenzhen |     400 | 2023-07-01 12:00:00 |
+----+-------+-----+----------+---------+---------------------+
```

#### 시나리오 1: `ERROR` 모드(새 행 거부) {#scenario-1-error-mode-reject-new-rows}

두 번째와 세 번째 행의 Key(`3`과 `18`)가 원래 테이블에 존재하지 않으므로 이 삽입은 실패합니다.

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');

-- Error:
-- (1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error:
-- [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR.
-- Row with key=[3] is not in table., host: 127.0.0.1")
```

#### 시나리오 2: `APPEND` 모드(새 행 허용) {#scenario-2-append-mode-allow-new-rows}

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');
```

실행 후 기존 행이 업데이트되고 새 행 두 개가 추가됩니다. 사용자가 지정하지 않은 컬럼은 다음과 같이 처리됩니다.

1. 컬럼에 **기본값이 있으면** 기본값을 사용합니다.
2. 그렇지 않고 컬럼이 **NULL을 허용하면** NULL을 사용합니다.
3. 그 외의 경우에는 삽입이 실패합니다.

쿼리 결과:

```sql
mysql> select * from user_profile;
+----+-------+------+----------+---------+---------------------+
| id | name  | age  | city     | balance | last_access_time    |
+----+-------+------+----------+---------+---------------------+
|  1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|  3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
| 18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+----+-------+------+----------+---------+---------------------+
```

## Aggregate Key Model의 컬럼 업데이트 {#column-update-on-the-aggregate-key-model}

<!-- Knowledge type: Operating procedure -->
<!-- Use cases: Sensitive to write throughput, lower query performance is acceptable -->

Aggregate 테이블은 주로 사전 집계 시나리오에 사용되지만, 집계 함수를 `REPLACE_IF_NOT_NULL`로 설정하면 부분 컬럼 업데이트 효과도 얻을 수 있습니다.

### 테이블 생성 {#create-the-table}

컬럼 업데이트가 필요한 각 필드의 집계 함수를 `REPLACE_IF_NOT_NULL`로 설정합니다.

```sql
CREATE TABLE order_tbl (
    order_id     INT(11) NULL,
    order_amount INT(11) REPLACE_IF_NOT_NULL NULL,
    order_status VARCHAR(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### 데이터 쓰기 {#write-data}

Stream Load, Broker Load, Routine Load 또는 `INSERT INTO` 중 어떤 방식을 사용하든 업데이트할 필드의 데이터만 기록하면 됩니다. **추가 매개변수는 필요하지 않습니다.**

### 예제 {#example-1}

예제는 앞서 설명한 것과 같습니다. 해당 Stream Load 명령은 다음과 같습니다(추가 헤더는 필요하지 않습니다).

```shell
$ cat update.csv
1,Pending shipment

curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T ./update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

해당 `INSERT INTO` 문은 다음과 같습니다(추가 세션 변수는 필요하지 않습니다).

```sql
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending shipment');
```

### 참고 사항 {#notes-1}

- **쓰기 성능**: Aggregate Key Model은 쓰기 중 추가 처리를 수행하지 않으므로 쓰기 성능은 일반적인 데이터 적재와 동일합니다.
- **쿼리 성능**: 쿼리 시 집계는 비용이 많이 듭니다. Unique Key Model의 Merge-on-Write 구현과 비교하면 일반적인 집계 쿼리는 **5~10배** 느립니다.
- **NULL 값 제약 사항**: `REPLACE_IF_NOT_NULL` 집계 함수는 NULL이 아닌 값에만 적용되므로 **필드 값을 NULL로 변경할 수 없습니다**.
