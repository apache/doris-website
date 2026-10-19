---
{
    "title": "Unique 모델의 다중 스트림 업데이트",
    "language": "ko",
    "description": "Doris Unique 모델의 Sequence Mapping 기능을 사용하여 여러 데이터 스트림이 동일한 와이드 테이블의 서로 다른 컬럼을 동시에 업데이트할 때 발생하는 버전 관리 문제를 해결합니다."
}
---

<!-- Knowledge type: Feature + Procedure -->
<!-- Applicable scenarios: Concurrent writes from multiple data streams to a wide table / Real-time updates for some columns combined with on-demand updates for others -->

## 비즈니스 시나리오와 주요 문제 {#business-scenarios-and-pain-points}

데이터 웨어하우스의 와이드 테이블에서는 동일한 테이블의 서로 다른 컬럼이 **서로 다른 데이터 소스**나 **서로 다른 처리 파이프라인**에서 오는 경우가 많습니다. 대표적인 예는 다음과 같습니다.

- **실시간 스트림**: 테이블의 일부 필드(예: 사용자 행동 관련 컬럼)를 지속적으로 업데이트합니다.
- **오프라인 스트림(또는 온디맨드 스트림)**: 특정 시점에 테이블의 다른 필드(예: 사용자 프로필이나 태그 관련 컬럼)를 업데이트합니다.

이러한 시나리오에서 여러 데이터 스트림이 동일한 기본 키 테이블에 동시에 데이터를 쓰면 두 가지 핵심 문제가 발생합니다.

| 주요 문제 | 설명 |
| --- | --- |
| **동시 쓰기로 인한 덮어쓰기 문제** | 데이터 스트림마다 도착 시점이 다릅니다. 단순한 REPLACE 집계만으로는 각 스트림의 데이터가 버전 순서대로 업데이트되도록 보장할 수 없습니다. |
| **높은 데이터 결합 비용** | 모든 컬럼의 데이터가 모일 때까지 기다렸다가 쓰는 것은 사실상 불가능합니다. 대기 시간이 매우 길어질 수 있어 비즈니스 요구 사항을 충족하기 어렵습니다. |

Doris Unique 모델은 기본적으로 Sequence 컬럼을 기반으로 한 버전 관리를 지원하지만, **전역 Sequence 컬럼을 하나만 정의할 수 있으므로** 서로 다른 데이터 스트림에서 오는 컬럼의 업데이트 버전을 독립적으로 제어할 수 없습니다. 이를 해결하기 위해 Doris는 **Sequence Mapping** 기능을 제공합니다.

## 해결 방법: Sequence Mapping {#solution-sequence-mapping}

<!-- Knowledge type: One-line definition -->

**Sequence Mapping**은 Doris Unique 모델이 지원하는 다중 스트림 동시 업데이트 메커니즘입니다. 데이터 컬럼마다 서로 다른 Sequence 컬럼을 지정하여 각 데이터 스트림의 버전을 서로 간섭 없이 독립적으로 관리할 수 있습니다.

### 동작 방식 {#how-it-works}

Unique 테이블에 다음과 같은 컬럼이 있다고 가정해 보겠습니다.

| 컬럼 | A | B | C | D | E | s1 | s2 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 역할 | Key | Key | Value | Value | Value | Sequence | Sequence |

- 데이터 스트림 1은 `A, B, C, D` 컬럼에 데이터를 쓰고 `s1`을 버전 관리 컬럼으로 사용합니다.
- 데이터 스트림 2는 `A, B, E` 컬럼에 데이터를 쓰고 `s2`를 버전 관리 컬럼으로 사용합니다.

이 매핑에 따른 동작은 다음과 같습니다.

- `s1`은 `C, D` 컬럼의 버전을 제어합니다. 새 데이터의 `s1`이 기존 데이터의 `s1`보다 클 때만 `C, D, s1`이 업데이트됩니다.
- `s2`는 `E` 컬럼의 버전을 제어합니다. 새 데이터의 `s2`가 기존 데이터의 `s2`보다 클 때만 `E, s2`가 업데이트됩니다.
- 두 스트림은 **서로 간섭하지 않으며**, 쿼리를 통해 모든 컬럼의 최신 데이터를 읽을 수 있습니다.

## 사용 예시 {#usage-example}

### 1. Sequence Mapping을 지원하는 테이블 생성 {#1-create-a-table-that-supports-sequence-mapping}

`sequence_mapping.<sequence_col>` 속성을 `PROPERTIES`에 지정하여 Sequence 컬럼과 해당 컬럼이 제어하는 Value 컬럼 간의 매핑을 선언합니다.

다음 예시는 `c, d` 컬럼의 버전을 `s1`으로 관리하고, `e` 컬럼의 버전을 `s2`로 관리하는 Unique 테이블을 생성합니다.

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

> Sequence 컬럼에서 지원하는 타입은 정수 타입, `DATE`, `DATETIME`, `TIMESTAMP_NS`입니다. **컬럼을 생성한 후에는 타입을 변경할 수 없습니다.**

생성된 테이블의 스키마는 다음과 같습니다.

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

다음 다섯 번의 삽입 작업을 통해 Sequence 값이 각 컬럼의 업데이트에 어떤 영향을 미치는지 확인할 수 있습니다.

**삽입 1**: `c, d, s1`에만 데이터를 쓰고 `e, s2`에는 쓰지 않습니다.

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

**삽입 2**: `s1=1`이 기존 `s1=2`보다 작으므로 `c, d, s1`은 업데이트되지 않습니다.

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

**삽입 3**: `e, s2`에 데이터를 씁니다. 기존 `s2`가 `NULL`(최솟값으로 취급)이었으므로 `e, s2`가 업데이트됩니다.

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

**삽입 4**: `s1=3`이 기존 `s1=2`보다 크므로 `c, d, s1`이 업데이트되며, `e, s2`는 영향을 받지 않습니다.

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

**삽입 5**: 두 컬럼 그룹 모두에 데이터를 씁니다. `s1=4`와 `s2=4`가 모두 기존 값보다 크므로 모든 컬럼이 업데이트됩니다.

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

업데이트 결과를 정리하면 다음과 같습니다.

| 작업 | 업데이트 조건 | 업데이트된 컬럼 |
| --- | --- | --- |
| 삽입 1 | `c, d, s1`에 처음으로 데이터 쓰기 | `c, d, s1` |
| 삽입 2 | 새 `s1` < 기존 `s1` | 없음 |
| 삽입 3 | `e, s2`에 처음으로 데이터 쓰기 | `e, s2` |
| 삽입 4 | 새 `s1` > 기존 `s1` | `c, d, s1` |
| 삽입 5 | 새 `s1`과 `s2`가 모두 기존 값보다 큼 | `c, d, s1, e, s2` |

### 3. 컬럼 추가 및 삭제 {#3-add-or-drop-columns}

Sequence Mapping 테이블에서는 `ALTER TABLE`을 사용하여 컬럼과 매핑을 동적으로 추가하거나 삭제할 수 있습니다.

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

**컬럼 및 매핑 추가**: `ALTER TABLE`을 사용하여 `e, s2` 컬럼을 추가하면서 `s2 -> e` 매핑을 함께 선언합니다.

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

**컬럼 삭제**: Value 컬럼 `e`를 삭제하면 해당 매핑이 무효화됩니다. 그런 다음 Sequence 컬럼 `s2`를 삭제합니다.

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
| **컬럼 타입** | Sequence 컬럼은 정수 타입과 시간 타입(`DATE`, `DATETIME`, `TIMESTAMP_NS`)만 지원하며, 생성 후에는 타입을 변경할 수 없습니다. |
| **컬럼 역할** | Sequence 컬럼과 매핑된 컬럼 모두 Key 컬럼이 될 수 없습니다. Key가 아닌 모든 컬럼은 Sequence 컬럼에 매핑되어야 합니다. |
| **매핑 관계** | 서로 다른 Sequence 컬럼에 매핑된 컬럼은 **중복될 수 없습니다**(예: `d`를 `s1`과 `s2` 모두에 매핑할 수 없음). 매핑이 설정되면 **수정할 수 없습니다**(예: 이미 `s1`에 매핑된 컬럼을 `s2`에 다시 매핑할 수 없음). |
| **DDL 제약 사항** | 컬럼 이름 변경은 지원하지 않습니다. Rollup 생성은 지원하지 않습니다. |
| **스토리지 모드** | 현재 MOR(Merge-on-Read) 테이블만 지원합니다. 전역 Sequence 컬럼과 함께 활성화할 수 없습니다. 일괄 삭제 작업은 지원하지 않습니다. |
| **데이터 적재 동작** | 데이터 적재 시 포함되지 않은 필드는 기본값 또는 `NULL`로 자동 채워집니다. Sequence 컬럼을 비교할 때 `NULL`은 **최솟값**으로 취급됩니다. |
