---
{
    "title": "Unique 모델의 다중 스트림 업데이트",
    "language": "ko",
    "description": "Doris Unique 모델의 Sequence Mapping 기능을 사용하여 여러 데이터 스트림이 동일한 와이드 테이블의 서로 다른 열을 동시에 업데이트할 때 발생하는 버전 제어 문제를 해결합니다."
}
---

<!-- Knowledge type: Feature + Procedure -->
<!-- Applicable scenarios: Concurrent writes from multiple data streams to a wide table / Real-time updates for some columns combined with on-demand updates for others -->

## 활용 시나리오와 문제점 {#business-scenarios-and-pain-points}

데이터 웨어하우스의 와이드 테이블에서는 동일한 테이블의 서로 다른 열이 **서로 다른 데이터 소스**나 **서로 다른 처리 파이프라인**에서 오는 경우가 많습니다. 대표적인 사례는 다음과 같습니다.

- **실시간 스트림**: 테이블의 일부 필드(예: 사용자 행동 관련 열)를 지속적으로 업데이트합니다.
- **오프라인 스트림(또는 온디맨드 스트림)**: 특정 시점에 테이블의 다른 필드(예: 사용자 프로필이나 태그 관련 열)를 업데이트합니다.

이러한 시나리오에서는 여러 데이터 스트림이 동일한 기본 키 테이블에 동시에 데이터를 쓰면서 두 가지 핵심 문제에 직면합니다.

| 문제점 | 설명 |
| --- | --- |
| **동시 쓰기에 따른 덮어쓰기 문제** | 데이터 스트림마다 도착 시점이 다릅니다. 단순한 REPLACE 집계만으로는 각 스트림의 데이터가 버전 순서대로 업데이트된다고 보장할 수 없습니다. |
| **높은 데이터 결합 비용** | 모든 열의 데이터가 모일 때까지 기다렸다가 쓰는 것은 사실상 불가능합니다. 대기 시간이 매우 길어질 수 있으며, 업무에서 이를 감당하기 어렵습니다. |

Doris Unique 모델은 Sequence 열을 기반으로 하는 버전 제어를 기본적으로 지원하지만, **전역 Sequence 열 하나만 정의할 수 있으므로** 서로 다른 데이터 스트림에서 오는 각 열의 업데이트 버전을 독립적으로 제어할 수 없습니다. 이를 해결하기 위해 Doris는 **Sequence Mapping** 기능을 제공합니다.

## 해결 방법: Sequence Mapping {#solution-sequence-mapping}

<!-- Knowledge type: One-line definition -->

**Sequence Mapping**은 Doris Unique 모델이 지원하는 다중 스트림 동시 업데이트 메커니즘입니다. 데이터 열마다 서로 다른 Sequence 열을 지정하여 각 데이터 스트림의 버전을 상호 간섭 없이 독립적으로 제어할 수 있습니다.

### 동작 원리 {#how-it-works}

Unique 테이블에 다음과 같은 열이 있다고 가정합니다.

| 열 | A | B | C | D | E | s1 | s2 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 역할 | Key | Key | Value | Value | Value | Sequence | Sequence |

- 데이터 스트림 1은 `A, B, C, D` 열에 데이터를 쓰고, `s1`을 버전 제어 열로 사용합니다.
- 데이터 스트림 2는 `A, B, E` 열에 데이터를 쓰고, `s2`를 버전 제어 열로 사용합니다.

이 매핑을 사용하면 다음과 같이 동작합니다.

- `s1`은 `C, D` 열의 버전을 제어합니다. 새 데이터의 `s1`이 기존 데이터의 `s1`보다 클 때만 `C, D, s1`이 업데이트됩니다.
- `s2`는 `E` 열의 버전을 제어합니다. 새 데이터의 `s2`가 기존 데이터의 `s2`보다 클 때만 `E, s2`가 업데이트됩니다.
- 두 스트림은 **서로 간섭하지 않으며**, 쿼리에서 모든 열의 최신 데이터를 읽을 수 있습니다.

## 사용 예제 {#usage-example}

### 1. Sequence Mapping을 지원하는 테이블 생성 {#1-create-a-table-that-supports-sequence-mapping}

`sequence_mapping.<sequence_col>` 속성을 `PROPERTIES`에 지정하여 Sequence 열과 해당 열이 제어하는 Value 열 사이의 매핑을 선언합니다.

다음 예제에서는 `c, d` 열의 버전을 `s1`으로 제어하고, `e` 열의 버전을 `s2`로 제어하는 Unique 테이블을 생성합니다.

```sql
CREATE TABLE `upsert_test` (
    `a`  bigint(20) NULL COMMENT "",
    `b`  int(11)    NULL COMMENT "",
    `c`  int(11)    NULL COMMENT "",
    `d`  int(11)    NULL COMMENT "",
    `e`  int(11)    NULL COMMENT "",
    `s1` int(11)    NULL COMMENT "",
    `s2` int(11)    NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false",
    "light_schema_change" = "true",
    "replication_num" = "1",
    "sequence_mapping.s1" = "c,d",
    "sequence_mapping.s2" = "e"
);
```

> Sequence 열에서 지원하는 타입은 정수 타입, `DATE`, `DATETIME`입니다. **열을 생성한 후에는 타입을 변경할 수 없습니다.**

생성 후 테이블 스키마는 다음과 같습니다.

```sql
MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| s2    | int    | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+
```

### 2. 데이터 쓰기 및 쿼리 {#2-write-and-query-data}

다음 다섯 번의 삽입 작업은 서로 다른 Sequence 값이 각 열의 업데이트에 어떤 영향을 미치는지 보여 줍니다.

**삽입 1**: `c, d, s1`에만 데이터를 쓰고, `e, s2`에는 쓰지 않습니다.

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,2,2,2);
Query OK, 1 row affected (0.080 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
```

**삽입 2**: `s1=1`이 기존 값인 `s1=2`보다 작으므로 `c, d, s1`은 업데이트되지 않습니다.

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1);
Query OK, 1 row affected (0.048 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
```

**삽입 3**: `e, s2`에 데이터를 씁니다. 기존 `s2`가 `NULL`(가장 작은 값으로 처리됨)이었으므로 `e, s2`가 업데이트됩니다.

```sql
MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.043 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 |    2 |    2 |    2 |
+------+------+------+------+------+------+------+
```

**삽입 4**: `s1=3`이 기존 값인 `s1=2`보다 크므로 `c, d, s1`이 업데이트되며, `e, s2`는 영향을 받지 않습니다.

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,3,3,3);
Query OK, 1 row affected (0.049 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    2 |    3 |    2 |
+------+------+------+------+------+------+------+
```

**삽입 5**: 두 열 그룹 모두에 데이터를 씁니다. `s1=4`와 `s2=4`가 모두 기존 값보다 크므로 모든 열이 업데이트됩니다.

```sql
MySQL > insert into upsert_test(a, b, c, d, s1, e, s2) values (1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+------+
```

업데이트 결과를 요약하면 다음과 같습니다.

| 작업 | 실행 조건 | 업데이트된 열 |
| --- | --- | --- |
| 삽입 1 | `c, d, s1`에 최초 쓰기 | `c, d, s1` |
| 삽입 2 | 새 `s1` < 기존 `s1` | 없음 |
| 삽입 3 | `e, s2`에 최초 쓰기 | `e, s2` |
| 삽입 4 | 새 `s1` > 기존 `s1` | `c, d, s1` |
| 삽입 5 | 새 `s1`과 `s2`가 모두 기존 값보다 큼 | `c, d, s1, e, s2` |

### 3. 열 추가 또는 삭제 {#3-add-or-drop-columns}

Sequence Mapping 테이블은 `ALTER TABLE`을 사용하여 열과 매핑을 동적으로 추가하거나 삭제할 수 있습니다.

**초기 테이블 생성**: `s1 -> c,d` 매핑 하나만 포함합니다.

```sql
CREATE TABLE `upsert_test` (
    `a`  bigint(20) NULL COMMENT "",
    `b`  int(11)    NULL COMMENT "",
    `c`  int(11)    NULL COMMENT "",
    `d`  int(11)    NULL COMMENT "",
    `s1` int(11)    NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false",
    "light_schema_change" = "true",
    "replication_num" = "1",
    "sequence_mapping.s1" = "c,d"
);
```

**초기 데이터 쓰기**:

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1),(1,1,3,3,3),(1,1,2,2,2);
Query OK, 3 rows affected (0.101 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |
+------+------+------+------+------+
```

**열과 매핑 추가**: `ALTER TABLE`을 사용하여 `e, s2` 열을 추가하면서 `s2 -> e` 매핑을 함께 선언합니다.

```sql
MySQL > alter table upsert_test add column (e int(11) NULL, s2 bigint) PROPERTIES('sequence_mapping.s2' = 'e');
Query OK, 0 rows affected (0.011 sec)

MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s2    | bigint | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 | NULL | NULL |
+------+------+------+------+------+------+------+
```

**새 매핑이 적용된 후 데이터 쓰기**:

```sql
MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.052 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |    2 |    2 |
+------+------+------+------+------+------+------+

MySQL > insert into upsert_test(a, b, c, d, s1, e, s2) values (1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    5 |    4 |
+------+------+------+------+------+------+------+
```

**열 삭제**: Value 열인 `e`를 삭제하면 해당 매핑이 무효화됩니다. 그런 다음 Sequence 열인 `s2`를 삭제합니다.

```sql
MySQL > alter table upsert_test drop column e;
Query OK, 0 rows affected (0.006 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | s2   |
+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+

MySQL > alter table upsert_test drop column s2;
Query OK, 0 rows affected (0.005 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |
+------+------+------+------+------+
```

## 사용 제약 사항 {#usage-constraints}

<!-- Knowledge type: Configuration parameters / Usage limitations -->

Sequence Mapping을 사용할 때는 다음 제약 사항에 유의해야 합니다.

| 범주 | 제약 사항 |
| --- | --- |
| **테이블 생성 설정** | `light_schema_change`를 활성화해야 합니다. 테이블 생성 시 `sequence_mapping` 속성을 선언하지 않으면 나중에 활성화할 수 없습니다. |
| **열 타입** | Sequence 열은 정수 타입과 시간 타입(`DATE`, `DATETIME`)만 지원하며, 생성 후에는 타입을 변경할 수 없습니다. |
| **열 역할** | Sequence 열과 매핑된 열은 모두 Key 열이 될 수 없습니다. 모든 비 Key 열은 Sequence 열에 매핑되어야 합니다. |
| **매핑 관계** | 서로 다른 Sequence 열에 매핑된 열은 **겹칠 수 없습니다**(예: `d`를 `s1`과 `s2` 모두에 매핑할 수 없음). 매핑을 설정한 후에는 **변경할 수 없습니다**(예: 이미 `s1`에 매핑된 열을 `s2`에 다시 매핑할 수 없음). |
| **DDL 제한 사항** | 열 이름 변경은 지원하지 않습니다. Rollup 생성은 지원하지 않습니다. |
| **저장 모드** | 현재 MOR (Merge-on-Read) 테이블만 지원합니다. 전역 Sequence 열과 함께 활성화하는 것은 지원하지 않습니다. 일괄 삭제 작업은 지원하지 않습니다. |
| **데이터 적재 시 동작** | 데이터 적재 시 포함되지 않은 필드는 기본값 또는 `NULL`로 자동으로 채워집니다. Sequence 열을 비교할 때 `NULL`은 **가장 작은 값**으로 처리됩니다. |
