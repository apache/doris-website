---
{
    "title": "Unique Key 모델의 동시 업데이트 제어",
    "language": "ko",
    "description": "Apache Doris Unique Key 모델의 동시 업데이트 제어 가이드: MVCC 기반 버전 관리, Sequence 컬럼을 통한 순서가 뒤바뀐 데이터의 교체 순서 제어, 설정 가능한 UPDATE 동시성을 설명합니다."
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenarios: High-concurrency data ingestion / Out-of-order updates on the Unique Key model / UPDATE transaction control -->

Unique Key 모델에서 Doris는 포괄적인 동시 업데이트 제어 기능을 제공합니다. 주로 다음 세 가지 대표적인 상황을 해결합니다.

| 사용자 시나리오 | 문제점 | Doris의 해결 방법 |
| --- | --- | --- |
| 동일한 기본 키에 대한 여러 차례의 데이터 적재 | 동시 데이터 적재 시 최종적으로 적용되는 레코드를 결정해야 함 | MVCC(다중 버전 동시성 제어)를 사용하여 버전 번호로 덮어쓰기 순서를 결정 |
| 다중 스레드 동기화로 인한 데이터 도착 순서의 뒤바뀜 | 이전 데이터가 늦게 도착하여 최신 데이터를 잘못 덮어씀 | Sequence 컬럼: 사용자가 교체 순서를 지정하며, Sequence 값이 더 큰 행이 적용됨 |
| 동일한 테이블에 대한 동시 UPDATE | 행 단위 업데이트로 인해 더티 데이터가 발생할 수 있으므로 기본적으로 순차 실행됨 | 테이블 수준 잠금으로 Serializable 격리 수준을 보장하며, 동시성 제한을 해제하는 옵션 제공 |

다음 절에서는 이러한 메커니즘의 동작 원리와 사용 방법을 설명합니다.

## MVCC 다중 버전 동시성 제어 {#mvcc-multi-version-concurrency-control}

<!-- Knowledge type: Concept description -->

Doris는 다중 버전 동시성 제어(MVCC)를 사용하여 동시 업데이트를 관리합니다.

- 각 데이터 쓰기 작업에는 쓰기 트랜잭션이 할당되며, 이 트랜잭션은 쓰기의 원자성을 보장합니다. 즉, 전체 작업이 성공하거나 전체 작업이 실패합니다.
- 쓰기 트랜잭션이 커밋되면 시스템이 버전 번호를 할당합니다.
- Unique Key 테이블에 데이터를 여러 번 적재할 때 중복된 기본 키가 있으면, Doris는 버전 번호로 덮어쓰기 순서를 결정합니다. **버전 번호가 높은 데이터가 버전 번호가 낮은 데이터를 덮어씁니다**.

## UPDATE 동시성 제어 {#update-concurrency-control}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Concurrent execution of multiple UPDATE statements -->

### 기본 동작 {#default-behavior}

기본적으로 Doris는 동일한 테이블에서 여러 `UPDATE` 작업을 동시에 실행하는 것을 **허용하지 않습니다**.

이는 현재 Doris가 행 단위 업데이트를 지원하기 때문입니다. `SET v2 = 1`만 선언하더라도 다른 모든 Value 컬럼도 덮어씁니다. 단, 해당 컬럼의 값은 변경되지 않습니다. 두 `UPDATE` 작업이 동일한 행을 동시에 업데이트하면 동작이 정의되어 있지 않으며, 더티 데이터가 발생할 위험이 있습니다.

따라서 `UPDATE` 문은 기본적으로 테이블 수준 잠금을 통해 Serializable 격리를 제공하므로, 여러 `UPDATE` 작업은 순차적으로만 실행할 수 있습니다.

### 동시성 제한 해제 {#lifting-the-concurrency-limit}

실제 사용 환경에서 동시 업데이트가 동일한 행을 동시에 처리하지 않도록 보장할 수 있다면, FE 설정을 변경하여 동시성 제한을 해제할 수 있습니다.

| 설정 항목 | 기본값 | 설명 |
| --- | --- | --- |
| `enable_concurrent_update` | `false` | `true`로 설정하면 `UPDATE`를 동시에 실행할 수 있지만, 트랜잭션 보장은 더 이상 제공하지 않음 |

## Sequence 컬럼 {#sequence-column}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Multi-threaded concurrent synchronization / Out-of-order data ingestion -->

### Sequence 컬럼이 필요한 이유 {#why-you-need-a-sequence-column}

Unique 모델은 주로 기본 키의 고유성이 필요한 상황을 위해 설계되었으며, 기본 키의 고유성을 보장할 수 있습니다. 하지만 다음과 같은 상황에서는 데이터 적재 버전 번호에만 의존하는 것으로는 충분하지 않습니다.

- 여러 스레드로 데이터를 Doris에 동시에 동기화하면, 각 스레드의 데이터가 순서대로 도착하지 않을 수 있습니다.
- 이전 데이터가 늦게 도착하여 최신 데이터를 잘못 덮어쓸 수 있습니다.
- 동일한 기본 키를 가진 데이터를 같은 배치 또는 서로 다른 배치로 적재할 때 교체 순서가 보장되지 않으므로, 최종 결과가 비결정적입니다.

이를 해결하기 위해 Doris는 데이터 적재 시 **Sequence 컬럼**을 지정하는 기능을 지원합니다. Key 컬럼이 동일한 행은 Sequence 컬럼 값을 기준으로 교체됩니다. **큰 값이 작은 값을 대체**하며, 반대의 경우에는 교체가 발생하지 않습니다. 이를 통해 사용자가 순서를 직접 결정할 수 있습니다.

내부적으로 Doris는 숨겨진 컬럼인 `__DORIS_SEQUENCE_COL__`을 추가합니다. 컬럼 타입은 사용자가 테이블을 생성할 때 지정하며, 값은 데이터 적재 시 결정됩니다. 이후 Doris는 이 값을 사용하여 Key 컬럼이 동일한 행 중 어느 행을 적용할지 결정합니다.

:::caution 참고
Sequence 컬럼은 현재 Unique 모델에서만 지원됩니다.
:::

### Sequence 컬럼 활성화 {#enabling-the-sequence-column}

다음 방법으로 활성화할 수 있습니다.

| 시나리오 | 작업 |
| --- | --- |
| 새 테이블에서 활성화 | `function_column.sequence_col` 또는 `function_column.sequence_type`을 `PROPERTIES`에 설정한 `CREATE TABLE` 문을 실행 |
| 기존 테이블에서 활성화 | `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` 실행 |
| 활성화 여부 확인 | `SET show_hidden_columns=true`를 실행한 다음 `desc tablename`을 실행. 출력에 `__DORIS_SEQUENCE_COL__`이 포함되어 있으면 활성화된 상태 |

두 속성의 차이는 다음과 같습니다.

| 속성 | 의미 | 스키마에 대응하는 컬럼이 있어야 하는지 여부 |
| --- | --- | --- |
| `function_column.sequence_col` | Sequence 컬럼을 테이블의 기존 컬럼에 매핑 | 예 |
| `function_column.sequence_type` | 숨겨진 컬럼에 저장되는 Sequence 컬럼의 타입만 지정 | 아니요 |

지원되는 컬럼 타입은 정수 타입, `DATE`, `DATETIME`입니다. **테이블이 생성된 후에는 컬럼 타입을 변경할 수 없습니다.**

### 사용 예 {#usage-example}

다음 예에서는 Stream Load를 사용하여 전체 과정을 설명합니다.

#### 1. Sequence 컬럼을 지원하는 테이블 생성 {#1-create-a-table-that-supports-the-sequence-column}

Unique 모델 테이블인 `test_table`을 생성하고 Sequence 컬럼을 테이블의 `modify_date` 컬럼에 매핑합니다.

```sql
CREATE TABLE test.test_table
(
    user_id bigint,
    date date,
    group_id bigint,
    modify_date date,
    keyword VARCHAR(128)
)
UNIQUE KEY(user_id, date, group_id)
DISTRIBUTED BY HASH (user_id) BUCKETS 32
PROPERTIES(
    "function_column.sequence_col" = 'modify_date',
    "replication_num" = "1",
    "in_memory" = "false"
);
```

생성된 테이블 스키마는 다음과 같습니다.

```sql
MySQL>  desc test_table;
+-------------+--------------+------+-------+---------+---------+
| Field       | Type         | Null | Key   | Default | Extra   |
+-------------+--------------+------+-------+---------+---------+
| user_id     | BIGINT       | No   | true  | NULL    |         |
| date        | DATE         | No   | true  | NULL    |         |
| group_id    | BIGINT       | No   | true  | NULL    |         |
| modify_date | DATE         | No   | false | NULL    | REPLACE |
| keyword     | VARCHAR(128) | No   | false | NULL    | REPLACE |
+-------------+--------------+------+-------+---------+---------+
```

이 컬럼이 테이블 스키마에 표시되지 않게 하려면, 대신 `function_column.sequence_type`을 사용하여 타입을 지정합니다.

```sql
PROPERTIES (
    "function_column.sequence_type" = 'Date'
);
```

#### 2. 데이터 적재 및 Sequence 동작 확인 {#2-import-data-and-verify-the-sequence-behavior}

컬럼 매핑 방식(`function_column.sequence_col`)을 사용할 때는 데이터 적재 명령에 추가 매개변수가 필요하지 않습니다. Stream Load를 사용하여 다음 데이터를 적재합니다.

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

Stream Load 명령:

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

쿼리 결과:

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

`2020-03-05`가 Sequence 컬럼(`modify_date`)의 최댓값이므로, `keyword` 컬럼에는 최종적으로 `c`가 유지됩니다.

#### 3. 데이터 적재 방식별 Sequence 컬럼 지정 {#3-specifying-the-sequence-column-in-different-import-methods}

테이블 생성 시 `function_column.sequence_type`을 사용하는 경우, 즉 Sequence 컬럼을 테이블의 컬럼에 직접 매핑하지 않는 경우에는 데이터 적재 시 Sequence 컬럼과 데이터 컬럼 간의 매핑을 명시적으로 지정해야 합니다.

**Stream Load**

헤더에서 `function_column.sequence_col`을 사용하여 숨겨진 컬럼의 `source_sequence` 매핑을 지정합니다.

```shell
curl --location-trusted -u root \
    -H "columns: k1,k2,source_sequence,v1,v2" \
    -H "function_column.sequence_col: source_sequence" \
    -T testData http://host:port/api/testDb/testTbl/_stream_load
```

**Broker Load**

숨겨진 컬럼 매핑에 사용할 `source_sequence` 필드를 `ORDER BY` 절에 지정합니다.

```sql
LOAD LABEL db1.label1
(
    DATA INFILE("hdfs://host:port/user/data/*/test.txt")
    INTO TABLE `tbl1`
    COLUMNS TERMINATED BY ","
    (k1,k2,source_sequence,v1,v2)
    ORDER BY source_sequence
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

**Routine Load**

매핑 방식은 위와 동일합니다. 예:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
    [WITH MERGE|APPEND|DELETE]
    COLUMNS(k1, k2, source_sequence, v1, v2),
    WHERE k1  100 and k2 like "%doris%"
    [ORDER BY source_sequence]
    PROPERTIES
    (
        "desired_concurrent_number"="3",
        "max_batch_interval" = "20",
        "max_batch_rows" = "300000",
        "max_batch_size" = "209715200",
        "strict_mode" = "false"
    )
    FROM KAFKA
    (
        "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
        "kafka_topic" = "my_topic",
        "kafka_partitions" = "0,1,2,3",
        "kafka_offsets" = "101,0,0,200"
    );
```

#### 4. 교체 순서 보장 확인 {#4-verify-the-replacement-order-guarantee}

앞의 예에 이어서 다음 데이터를 적재합니다. 모든 Sequence 값은 기존 최댓값인 `2020-03-05`보다 작습니다.

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

쿼리 결과:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

이번에 적재한 모든 Sequence 값이 기존 최댓값인 `2020-03-05`보다 작으므로, 결과는 변경되지 않습니다.

이제 더 큰 Sequence 값을 가진 데이터를 적재합니다.

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

쿼리 결과:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

새로 적재한 데이터의 Sequence 값인 `2020-03-23`이 기존 최댓값인 `2020-03-05`보다 크므로, 기존 데이터가 교체됩니다.

**결론**: 데이터 적재 시 Doris는 모든 배치의 Sequence 컬럼 값을 비교하여 **가장 큰 값을 가진 레코드를 테이블에 기록합니다**.

### 사용 시 유의 사항 {#usage-notes}

<!-- Knowledge type: Caveats -->

1. **Sequence 컬럼을 명시적으로 지정해야 함**: Stream Load 및 Broker Load와 같은 데이터 적재 작업과 행 업데이트용 `INSERT` 문에서는 Sequence 컬럼을 명시적으로 지정해야 합니다. 단, 기본값이 `CURRENT_TIMESTAMP`인 경우는 제외됩니다. 그렇지 않으면 다음 오류가 발생합니다.

    ```Plain
    Table test_tbl has sequence column, need to specify the sequence column
    ```

2. **Sequence 컬럼 제약 조건 검사 비활성화**: 테이블 복제나 내부 데이터 마이그레이션과 같은 상황에서는 세션 변수를 통해 `INSERT` 문에 대한 필수 Sequence 컬럼 검사를 비활성화할 수 있습니다.

    ```sql
    set require_sequence_in_insert = false;
    ```

3. **부분 컬럼 업데이트와의 호환성**: 2.0 버전부터 Doris Unique Key 테이블의 Merge-on-Write 구현은 부분 컬럼 업데이트를 지원합니다. 부분 컬럼 업데이트 방식으로 데이터를 적재할 때는 매번 일부 컬럼만 업데이트할 수 있으므로, **Sequence 컬럼이 필수는 아닙니다**.

    - 데이터 적재 작업에 Sequence 컬럼이 포함되어 있으면 동작은 변경되지 않습니다.
    - 데이터 적재 작업에 Sequence 컬럼이 포함되어 있지 않으면, Doris는 일치하는 기존 데이터의 Sequence 컬럼 값을 업데이트된 행의 Sequence 컬럼 값으로 사용합니다.
    - 기존 데이터에 동일한 Key를 가진 레코드가 없으면, Doris가 자동으로 `null` 또는 기본값을 채웁니다.

4. **동시 데이터 적재 시 정확성 보장**: 동시 데이터 적재가 발생하면 Doris는 MVCC를 사용하여 데이터의 정확성을 보장합니다. 두 데이터 적재 배치가 동일한 Key의 서로 다른 컬럼을 업데이트하는 경우, 버전 번호가 낮은 데이터 적재 작업이 성공한 후 버전 번호가 높은 데이터 적재 작업은 동일한 Key에 대해 버전 번호가 낮은 작업이 기록한 행을 사용하여 누락된 값을 채웁니다.
