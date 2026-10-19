---
{
    "title": "삭제 작업",
    "language": "ko",
    "description": "Apache Doris DELETE 문 가이드: 조건에 따라 테이블 또는 파티션의 데이터를 삭제하고, USING을 통한 다중 테이블 조인 삭제를 지원합니다. 구문, 매개변수, 제한 사항, 성능 튜닝을 다룹니다.",
    "keywords": [
        "Doris DELETE",
        "데이터 삭제",
        "조건부 삭제",
        "USING 다중 테이블 삭제",
        "Unique Key 삭제",
        "파티션 삭제",
        "delete_without_partition",
        "SHOW DELETE"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data cleanup / Conditional delete / Multi-table joined delete -->

Apache Doris는 MySQL 프로토콜을 통해 `DELETE` 문을 실행하여 지정된 테이블이나 파티션에서 조건에 맞는 데이터를 삭제합니다. 다음 두 가지 방식을 지원합니다.

- **조건자 기반 삭제**: 간단한 `WHERE` 조건자 조합에 일치하는 데이터를 삭제합니다.
- **다중 테이블 조인 삭제(USING)**: 기본 키 테이블(Unique Key)에서 `USING` 절로 다른 테이블을 조인하여 데이터를 삭제합니다.

## 바로 가기 {#quick-navigation}

| 시나리오 | 권장 방식 | 적용 가능한 테이블 모델 |
|----------|----------------------|------------------------|
| 컬럼 값 조건에 따른 삭제 | [조건자 기반 삭제](#delete-by-specifying-filter-predicates) | Duplicate / Aggregate / Unique |
| 파티션 단위 대량 삭제 | [조건자 기반 삭제 + PARTITION](#delete-by-specifying-filter-predicates) | 모든 모델 |
| 다중 테이블 조인을 통한 정밀 삭제 | [USING 절을 사용한 삭제](#delete-with-the-using-clause) | Unique Key만 지원 |
| 삭제 이력 조회 | [SHOW DELETE](#viewing-delete-history) | 모든 모델 |

## 필터 조건자를 지정하여 삭제 {#delete-by-specifying-filter-predicates}

<!-- Knowledge type: Operation steps -->

### 구문 {#syntax}

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

### 매개변수 설명 {#parameter-description}

**필수 매개변수**

| 매개변수 | 설명 |
|-----------|-------------|
| `table_name` | 데이터를 삭제할 대상 테이블 |
| `column_name` | `table_name`에 속한 컬럼 |
| `op` | 논리 비교 연산자. 지원하는 연산자: `=`, `>`, `<`, `>=`, `<=`, `!=`, `in`, `not in` |
| `value \| value_list` | 논리 비교에 사용할 단일 값 또는 값 목록 |

**선택적 매개변수**

| 매개변수 | 설명 |
|-----------|-------------|
| `PARTITION` / `PARTITIONS` | 삭제를 수행할 파티션 이름을 지정합니다. 테이블에 지정된 파티션이 없으면 오류가 발생합니다 |
| `table_alias` | 테이블의 별칭 |

### 제한 사항 {#limitations}

- **Aggregate Key 테이블**: Key 컬럼에만 조건을 지정할 수 있습니다. 선택한 Key 컬럼이 Rollup에 없으면 삭제를 실행할 수 없습니다.
- **파티션 테이블**: 파티션을 지정하거나, Doris가 조건에서 파티션을 추론할 수 있어야 합니다. 다음 두 가지 경우에는 파티션을 추론할 수 없습니다.
    1. 조건에 파티션 컬럼이 포함되어 있지 않은 경우.
    2. 파티션 컬럼의 `op`가 `not in`인 경우.
- **Unique 모델이 아닌 파티션 테이블**: 파티션을 지정하지 않았고 파티션을 추론할 수도 없다면 세션 변수를 `delete_without_partition = true`로 설정해야 합니다. 이 경우 삭제 작업은 모든 파티션에 적용됩니다.

### 예제 {#examples}

**예제 1: 지정된 파티션에서 컬럼 값이 특정 값과 같은 데이터 삭제**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 = 3;
```

**예제 2: 지정된 파티션에서 복합 조건을 충족하는 데이터 삭제**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 >= 3 AND status = "outdated";
```

**예제 3: 여러 파티션에서 시간 범위로 필터링한 데이터 삭제**

```sql
DELETE FROM my_table PARTITIONS (p1, p2)
WHERE k1 >= 3 AND dt >= "2024-10-01" AND dt <= "2024-10-31";
```

## USING 절을 사용한 삭제 {#delete-with-the-using-clause}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Multi-table joined delete -->

삭제할 데이터를 정확히 식별하기 위해 여러 테이블을 조인해야 할 때는 `USING` 절을 사용합니다.

### 구문 {#syntax-1}

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition;
```

### 매개변수 설명 {#parameter-description-1}

**필수 매개변수**

| 매개변수 | 설명 |
|-----------|-------------|
| `table_name` | 데이터를 삭제할 대상 테이블 |
| `WHERE condition` | 삭제할 행을 선택하는 데 사용할 조건 |

**선택적 매개변수**

| 매개변수 | 설명 |
|-----------|-------------|
| `PARTITION` / `PARTITIONS` | 삭제를 수행할 파티션 이름을 지정합니다. 테이블에 지정된 파티션이 없으면 오류가 발생합니다 |
| `table_alias` | 테이블의 별칭 |
| `USING additional_tables` | 조인에 사용할 다른 테이블 |

### 제한 사항 {#limitations-1}

- **Unique Key** 모델 테이블에서만 지원합니다.

### 예제 {#example}

다음 예제는 `t1`에서 `t2`와 `t3`의 조인 결과를 기준으로 데이터를 삭제하는 방법을 보여 줍니다.

**단계 1: 테이블 생성**

```sql
CREATE TABLE t1
    (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
UNIQUE KEY (id)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1', "function_column.sequence_col" = "c4");

CREATE TABLE t2
    (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

CREATE TABLE t3
    (id INT)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');
```

**단계 2: 테스트 데이터 삽입**

```sql
INSERT INTO t1 VALUES
    (1, 1, '1', 1.0, '2000-01-01'),
    (2, 2, '2', 2.0, '2000-01-02'),
    (3, 3, '3', 3.0, '2000-01-03');

INSERT INTO t2 VALUES
    (1, 10, '10', 10.0, '2000-01-10'),
    (2, 20, '20', 20.0, '2000-01-20'),
    (3, 30, '30', 30.0, '2000-01-30'),
    (4, 4, '4', 4.0, '2000-01-04'),
    (5, 5, '5', 5.0, '2000-01-05');

INSERT INTO t3 VALUES
    (1),
    (4),
    (5);
```

**단계 3: 조인 삭제 실행**

```sql
DELETE FROM t1
    USING t2 INNER JOIN t3 ON t2.id = t3.id
    WHERE t1.id = t2.id;
```

**예상 결과**: `id = 1`인 행이 `t1`에서 삭제됩니다.

```Plain
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

## 관련 설정 {#related-configuration}

<!-- Knowledge type: Configuration parameters -->

| 설정 | 범위 | 설명 | 기본값 |
|---------------|-------|-------------|---------|
| `insert_timeout` | 세션 | 삭제는 특수한 데이터 적재로 처리되며, 이 값에 따라 실행 시간이 제한됩니다. `SET insert_timeout = xxx`로 조정하며, 단위는 초입니다 | - |
| `max_allowed_in_element_num_of_delete` | 전역 | `IN` 조건자에 허용되는 최대 요소 수 | 1024 |

## 삭제 이력 조회 {#viewing-delete-history}

<!-- Knowledge type: Operation steps -->

`SHOW DELETE` 문을 사용하여 완료된 삭제 작업의 기록을 조회합니다.

**구문**

```sql
SHOW DELETE [FROM db_name];
```

**예제**

```sql
mysql> SHOW DELETE FROM test_db;
+-----------+---------------+---------------------+-----------------+----------+
| TableName | PartitionName | CreateTime          | DeleteCondition | State    |
+-----------+---------------+---------------------+-----------------+----------+
| empty_tbl | p3            | 2020-04-15 23:09:35 | k1 EQ "1"       | FINISHED |
| test_tbl  | p4            | 2020-04-15 23:09:53 | k1 GT "80"      | FINISHED |
+-----------+---------------+---------------------+-----------------+----------+
2 rows in set (0.00 sec)
```

## 성능 권장 사항 {#performance-recommendations}

<!-- Knowledge type: Architecture decision -->

테이블 모델별 `DELETE`의 성능 특성은 다음과 같습니다.

| 테이블 모델 | 실행 속도 | 쿼리에 미치는 영향 | 권장 시나리오 |
|-------------|-----------------|-------------------|------------------------|
| 상세 테이블(Duplicate Key) | 빠름 | 짧은 시간에 많은 삭제 작업을 수행하면 쿼리 성능에 영향을 줌 | 삭제 빈도 조절 |
| 집계 테이블(Aggregate Key) | 빠름 | 짧은 시간에 많은 삭제 작업을 수행하면 쿼리 성능에 영향을 줌 | 삭제 빈도 조절 |
| 기본 키 테이블(Unique Key) | 넓은 범위의 삭제 시 느림(`INSERT INTO`로 변환됨) | 짧은 시간에 많은 삭제 작업을 수행해도 쿼리 성능에 미치는 영향이 제한적임 | 삭제가 빈번한 시나리오에 적합 |

## 자주 묻는 질문 {#faq}

**Q1: DELETE를 실행하면 파티션을 지정해야 한다는 오류가 발생합니다. 어떻게 해야 하나요?**

Unique 모델이 아닌 파티션 테이블에서 조건에 파티션 컬럼이 포함되어 있지 않거나 `not in`을 사용하면 Doris는 파티션을 추론할 수 없습니다. 다음 방법을 사용할 수 있습니다.

- `PARTITION`을 `DELETE` 문에 명시적으로 지정합니다.
- 또는 세션 변수를 `SET delete_without_partition = true`로 설정하여 삭제가 모든 파티션에 적용되도록 합니다.

**Q2: 집계 테이블의 Key가 아닌 컬럼을 기준으로 삭제할 수 있나요?**

아니요. 집계 테이블에서는 Key 컬럼에만 삭제 조건을 지정할 수 있습니다.

**Q3: USING 절은 어떤 테이블 모델을 지원하나요?**

삭제 대상은 **Unique Key** 모델 테이블만 지원합니다.

**Q4: IN 조건자에 요소가 너무 많아 오류가 발생하면 어떻게 해야 하나요?**

`max_allowed_in_element_num_of_delete` 설정을 조정하여 허용되는 최대 요소 수를 늘립니다(기본값 1024).

**Q5: 삭제 작업의 제한 시간을 초과하면 어떻게 해야 하나요?**

`SET insert_timeout = xxx`를 사용하여 제한 시간을 늘립니다(단위: 초).

## 관련 문서 {#related-documents}

- [DELETE 구문 매뉴얼](../../sql-manual/sql-statements/data-modification/DML/DELETE)
