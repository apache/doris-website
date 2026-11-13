---
{
    "title": "Unique Key 모델의 동시 업데이트 제어",
    "language": "ko",
    "description": "Apache Doris의 Unique Key 모델 동시 업데이트 제어 가이드: MVCC 기반 버전 관리, Sequence 열을 통한 순서가 뒤바뀐 데이터의 교체 순서 제어, 설정 가능한 UPDATE 동시 실행."
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenarios: High-concurrency data ingestion / Out-of-order updates on the Unique Key model / UPDATE transaction control -->

Unique Key 모델에서 Doris는 동시 업데이트를 제어하는 기능을 제공합니다. 주로 다음 세 가지 상황을 다룹니다.

| 사용자 상황 | 문제점 | Doris의 해결 방법 |
| --- | --- | --- |
| 동일한 기본 키의 데이터를 여러 번 적재 | 동시 적재 시 최종적으로 적용되는 레코드를 결정해야 함 | MVCC(다중 버전 동시성 제어)를 사용하며, 버전 번호로 덮어쓰기 순서를 결정 |
| 여러 스레드에서 동기화한 데이터가 순서와 다르게 도착 | 이전 데이터가 나중에 도착해 새 데이터를 잘못 덮어씀 | Sequence 열: 사용자가 교체 순서를 지정하며, Sequence 값이 더 큰 행이 적용됨 |
| 동일한 테이블에서 여러 UPDATE를 동시 실행 | 행 단위 업데이트로 잘못된 데이터가 생성될 수 있어 기본적으로 순차 실행 | 테이블 수준 잠금으로 Serializable 격리 수준을 보장하며, 동시 실행 제한을 해제할 수 있음 |

다음 절에서는 이러한 방식의 동작 원리와 사용 방법을 설명합니다.

## MVCC 다중 버전 동시성 제어 {#mvcc-multi-version-concurrency-control}

<!-- Knowledge type: Concept description -->

Doris는 MVCC(Multi-Version Concurrency Control, 다중 버전 동시성 제어)를 사용하여 동시 업데이트를 관리합니다.

- 각 데이터 쓰기 작업에는 쓰기 트랜잭션이 할당됩니다. 이 트랜잭션은 쓰기 작업의 원자성을 보장하므로 작업 전체가 성공하거나 실패합니다.
- 쓰기 트랜잭션이 커밋되면 시스템은 해당 트랜잭션에 버전 번호를 할당합니다.
- Unique Key 테이블에 데이터를 여러 번 적재하여 기본 키가 중복되면 Doris는 버전 번호로 덮어쓰기 순서를 결정합니다. **버전 번호가 높은 데이터가 버전 번호가 낮은 데이터를 덮어씁니다.**

## UPDATE 동시 실행 제어 {#update-concurrency-control}

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Concurrent execution of multiple UPDATE statements -->

### 기본 동작 {#default-behavior}

기본적으로 Doris는 동일한 테이블에서 여러 `UPDATE` 작업을 동시에 실행하는 것을 **허용하지 않습니다**.

Doris는 현재 행 단위 업데이트를 지원하기 때문입니다. `SET v2 = 1`만 지정하더라도 값이 바뀌지 않는 다른 모든 Value 열도 덮어씁니다. 두 `UPDATE` 작업이 같은 행을 동시에 업데이트하면 동작이 정의되지 않으며, 잘못된 데이터가 생성될 위험이 있습니다.

따라서 `UPDATE` 문은 기본적으로 테이블 수준 잠금을 통해 Serializable 격리 수준을 제공하며, 여러 `UPDATE` 작업은 순차적으로만 실행할 수 있습니다.

### 동시 실행 제한 해제 {#lifting-the-concurrency-limit}

실제 사용 환경에서 동시 업데이트가 같은 행을 동시에 처리하지 않는다고 보장할 수 있다면 FE 설정을 변경하여 동시 실행 제한을 해제할 수 있습니다.

| 설정 항목 | 기본값 | 설명 |
| --- | --- | --- |
| `enable_concurrent_update` | `false` | `true`로 설정하면 `UPDATE`를 동시에 실행할 수 있지만 트랜잭션 보장은 더 이상 제공되지 않음 |

## Sequence 열 {#sequence-column}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Multi-threaded concurrent synchronization / Out-of-order data ingestion -->

### Sequence 열이 필요한 이유 {#why-you-need-a-sequence-column}

Unique 모델은 주로 기본 키가 고유해야 하는 상황을 위해 설계되었으며 기본 키의 고유성을 보장합니다. 하지만 다음 상황에서는 적재 버전 번호에만 의존하는 것으로 충분하지 않습니다.

- 여러 스레드에서 데이터를 Doris로 동시에 동기화하면 스레드별 데이터가 순서와 다르게 도착할 수 있습니다.
- 이전 데이터가 나중에 도착하여 새 데이터를 잘못 덮어쓸 수 있습니다.
- 동일한 기본 키의 데이터를 같은 배치 또는 서로 다른 배치에서 적재할 때 교체 순서가 보장되지 않아 최종 결과가 일정하지 않습니다.

이를 해결하기 위해 Doris는 데이터 적재 시 **Sequence 열**을 지정할 수 있습니다. Key 열의 값이 같은 행은 Sequence 열의 값을 기준으로 교체합니다. **값이 큰 행이 값이 작은 행을 교체하며**, 반대의 경우에는 교체하지 않습니다. 따라서 사용자가 적용 순서를 결정할 수 있습니다.

Doris는 이를 위해 숨겨진 열 `__DORIS_SEQUENCE_COL__`을 추가합니다. 이 열의 유형은 테이블을 만들 때 사용자가 지정하고, 값은 데이터 적재 시 결정합니다. Doris는 이 값을 사용하여 Key 열의 값이 같은 행 중 어느 행을 적용할지 결정합니다.

:::caution 참고
Sequence 열은 현재 Unique 모델에서만 지원됩니다.
:::

### Sequence 열 활성화 {#enabling-the-sequence-column}

다음 방법으로 Sequence 열을 활성화할 수 있습니다.

| 상황 | 작업 |
| --- | --- |
| 새 테이블에서 활성화 | `CREATE TABLE` 문의 `PROPERTIES`에서 `function_column.sequence_col` 또는 `function_column.sequence_type` 설정 |
| 기존 테이블에서 활성화 | `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` 실행 |
| 활성화 여부 확인 | `SET show_hidden_columns=true`를 실행한 다음 `desc tablename` 실행. 출력에 `__DORIS_SEQUENCE_COL__`이 있으면 활성화된 상태임 |

두 속성의 차이는 다음과 같습니다.

| 속성 | 의미 | 스키마에 해당 열이 있어야 하는지 여부 |
| --- | --- | --- |
| `function_column.sequence_col` | Sequence 열을 테이블의 기존 열에 매핑 | 예 |
| `function_column.sequence_type` | 숨겨진 열에 저장할 Sequence 열의 유형만 지정 | 아니요 |

지원되는 열 유형은 정수형, `DATE`, `DATETIME`, `TIMESTAMP_NS`입니다. **테이블을 만든 후에는 열 유형을 변경할 수 없습니다.**

### 사용 예시 {#usage-example}

다음 예시에서는 Stream Load를 사용하여 전체 과정을 보여줍니다.

#### 1. Sequence 열을 지원하는 테이블 만들기 {#1-create-a-table-that-supports-the-sequence-column}

Unique 모델 테이블 `test_table`을 만들고 Sequence 열을 테이블의 `modify_date` 열에 매핑합니다.

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

이 열이 테이블 스키마에 나타나지 않게 하려면 `function_column.sequence_type`을 사용하여 유형을 지정합니다.

```sql
PROPERTIES (
    "function_column.sequence_type" = 'Date'
);
```

#### 2. 데이터 적재 및 Sequence 동작 확인 {#2-import-data-and-verify-the-sequence-behavior}

열 매핑 방식(`function_column.sequence_col`)을 사용할 때는 적재 명령에 추가 매개변수가 필요하지 않습니다. Stream Load를 사용하여 다음 데이터를 적재합니다.

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

`2020-03-05`가 Sequence 열(`modify_date`)에서 가장 큰 값이므로 `keyword` 열에는 최종적으로 `c`가 남습니다.

#### 3. 적재 방식별 Sequence 열 지정 {#3-specifying-the-sequence-column-in-different-import-methods}

테이블에서 `function_column.sequence_type`을 사용하면 Sequence 열은 숨겨진 열이므로 적재할 때 입력 필드를 이 열에 매핑해야 합니다. 다음 예시에서는 위에서 Sequence 열을 `modify_date`에 매핑한 `test_table`과는 **별도의 테이블**을 사용합니다.

```sql
CREATE DATABASE IF NOT EXISTS test;
CREATE TABLE test.test_sequence_hidden
(
    k1 BIGINT NOT NULL,
    k2 DATE NOT NULL,
    v1 BIGINT,
    v2 VARCHAR(128)
)
UNIQUE KEY(k1, k2)
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES (
    "function_column.sequence_type" = "DATE",
    "replication_num" = "1"
);
```

다음과 같이 탭으로 구분된 행을 담은 `sequence_data.tsv`를 준비합니다. 네 번째 입력 필드인 `source_sequence`가 숨겨진 Sequence 열에 값을 제공하며, 이 필드는 테이블에 표시되는 열이 아닙니다.

```text
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

**Stream Load**

파일의 필드 순서에 따라 입력 필드를 매핑하고 요청 헤더에서 Sequence 필드를 지정합니다.

```shell
curl --location-trusted -u root: \
    -H "columns: k1,k2,v1,source_sequence,v2" \
    -H "function_column.sequence_col: source_sequence" \
    -T sequence_data.tsv http://host:port/api/test/test_sequence_hidden/_stream_load
```

**Broker Load**

같은 파일을 HDFS에 업로드하고 아래 경로와 Broker 자격 증명을 실제 값으로 바꿉니다. 탭 구분자와 동일한 필드 순서를 사용한 다음 `ORDER BY source_sequence`로 네 번째 입력 필드를 선택합니다.

```sql
LOAD LABEL test.sequence_hidden_broker
(
    DATA INFILE("hdfs://host:port/user/data/sequence_data.tsv")
    INTO TABLE `test_sequence_hidden`
    COLUMNS TERMINATED BY "\t"
    (k1,k2,v1,source_sequence,v2)
    ORDER BY source_sequence
)
WITH BROKER 'broker'
(
    "username" = "user",
    "password" = "pass"
)
PROPERTIES ("timeout" = "3600");
```

**Routine Load**

실제 Kafka 브로커와 토픽을 사용하여 작업을 만든 다음, 위의 각 행을 탭으로 구분된 별도의 Kafka 메시지로 전송합니다.

```sql
CREATE ROUTINE LOAD test.sequence_hidden_routine ON test_sequence_hidden
    COLUMNS TERMINATED BY "\t",
    COLUMNS(k1,k2,v1,source_sequence,v2),
    ORDER BY source_sequence
    PROPERTIES
    (
        "desired_concurrent_number" = "1",
        "format" = "csv"
    )
    FROM KAFKA
    (
        "kafka_broker_list" = "broker1:9092",
        "kafka_topic" = "my_topic"
    );
```

데이터 적재가 성공하고 데이터가 표시되면 더 큰 Sequence 값(`2020-03-23`)을 가진, `v2`가 `w`인 행이 남습니다. 아래의 `modify_date` 예시에서는 원래의 `test_table`과 해당 열 매핑을 계속 사용합니다.

#### 4. 교체 순서 보장 확인 {#4-verify-the-replacement-order-guarantee}

앞의 예시에 이어서 다음 데이터를 적재합니다. 모든 Sequence 값이 기존 최댓값 `2020-03-05`보다 작습니다.

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

이번에 적재한 데이터의 모든 Sequence 값이 기존 최댓값 `2020-03-05`보다 작으므로 결과는 바뀌지 않습니다.

이제 Sequence 값이 더 큰 데이터를 적재합니다.

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

새로 적재한 데이터의 Sequence 값 `2020-03-23`이 기존 최댓값 `2020-03-05`보다 크므로 기존 데이터가 교체됩니다.

**결론**: 데이터 적재 시 Doris는 모든 배치의 Sequence 열 값을 비교하여 **값이 가장 큰 레코드를 테이블에 기록합니다**.

### 사용 시 유의 사항 {#usage-notes}

<!-- Knowledge type: Caveats -->

1. **Sequence 입력 요구 사항은 테이블 정의에 따라 다릅니다**: `function_column.sequence_col`을 사용하면 일반 열 규칙에 따라 매핑된 열을 적재하면 됩니다. 적재 시 Sequence 매핑 매개변수를 추가할 필요는 없습니다. `function_column.sequence_type`을 사용하면 위에 나온 대로 Stream Load 또는 Broker Load의 소스 열 매핑을 설정합니다. 대상 열 목록을 명시한 전체 행 `INSERT`에는 매핑된 일반 열을 포함해야 합니다. 단, 해당 열의 기본값이 `CURRENT_TIMESTAMP`이면 예외입니다. 매핑된 열이 없다면 숨겨진 `__DORIS_SEQUENCE_COL__`을 포함해야 합니다. 대상 열 목록이 없는 `INSERT`에는 매핑된 일반 열이 이미 포함됩니다. 부분 열 업데이트에 대해서는 아래 3번 항목을 참고하세요. 필요한 Sequence 입력이 누락되면 다음 오류가 발생합니다.

    ```Plain
    Table test_tbl has sequence column, need to specify the sequence column
    ```

2. **Sequence 열 제약 검사 비활성화**: 테이블 복제나 내부 데이터 마이그레이션과 같은 상황에서는 세션 변수를 사용하여 `INSERT` 문에 대한 필수 Sequence 열 검사를 비활성화할 수 있습니다.

    ```sql
    set require_sequence_in_insert = false;
    ```

3. **부분 열 업데이트와의 호환성**: 버전 2.0부터 Doris Unique Key 테이블의 Merge-on-Write 구현은 부분 열 업데이트를 지원합니다. 부분 열 업데이트를 위한 데이터 적재에서는 매번 일부 열만 업데이트할 수 있으므로 **Sequence 열이 필수는 아닙니다**.

    - 적재 작업에 Sequence 열이 포함되어 있으면 동작은 바뀌지 않습니다.
    - 적재 작업에 Sequence 열이 없으면 Doris는 일치하는 기존 데이터의 Sequence 열 값을 업데이트된 행의 Sequence 열 값으로 사용합니다.
    - 기존 데이터에 동일한 Key의 레코드가 없으면 Doris가 `null` 또는 기본값을 자동으로 채웁니다.

4. **동시 데이터 적재 시 정확성 보장**: 데이터를 동시에 적재할 때 Doris는 MVCC를 사용하여 데이터의 정확성을 보장합니다. 두 적재 배치가 동일한 Key의 서로 다른 열을 업데이트하는 경우, 버전 번호가 낮은 적재 작업이 성공한 후 버전 번호가 높은 적재 작업은 동일한 Key에 대해 낮은 버전의 작업이 기록한 행을 사용하여 누락된 값을 채웁니다.
