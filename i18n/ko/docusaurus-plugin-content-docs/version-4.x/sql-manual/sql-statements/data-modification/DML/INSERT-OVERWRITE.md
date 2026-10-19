---
{
    "title": "INSERT OVERWRITE",
    "language": "ko",
    "description": "이 문은 테이블 전체 또는 테이블의 일부 파티션을 덮어씁니다"
}
---

## 설명 {#description}

이 문은 테이블 전체 또는 테이블의 일부 파티션을 덮어씁니다.

```sql
INSERT OVERWRITE table table_name
    [ PARTITION (p1, ... | *) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 매개변수

> table_name: 덮어쓸 대상 테이블입니다. 이 테이블은 미리 존재해야 합니다. `db_name.table_name` 형식을 사용할 수 있습니다.
>
> partitions: 덮어쓸 테이블 파티션입니다. 다음 두 가지 형식을 지원합니다.
>
> > 1. 파티션 이름. `table_name`에 이미 존재하는 파티션의 이름을 쉼표로 구분하여 지정합니다.
> > 2. 별표(*). [파티션 자동 감지](#overwrite-auto-detect-partition)를 활성화합니다. 쓰기 작업에서 데이터가 속한 파티션을 자동으로 감지하여 해당 파티션을 덮어씁니다. 이 형식은 Apache Doris 2.1.3 버전부터 지원됩니다.
>
> label: Insert 작업의 레이블을 지정합니다.
>
> column_name: 지정하는 대상 열은 `table_name`에 이미 존재하는 열이어야 합니다.
>
> expression: 열에 할당할 값을 나타내는 표현식입니다.
>
> DEFAULT: 열에 기본값을 사용합니다.
>
> query: 일반적인 쿼리로, 쿼리 결과로 대상을 덮어씁니다.
>
> hint: `INSERT`의 실행 동작을 지정하는 힌트입니다. `/*+ STREAMING */`, `/*+ SHUFFLE */` 또는 `/*+ NOSHUFFLE */` 중 하나를 선택할 수 있습니다.
>
> 1. STREAMING: 현재는 실제 효과가 없으며 이전 버전과의 호환성을 위해서만 유지됩니다. (이전 버전에서는 이 힌트를 추가하면 레이블을 반환했지만, 지금은 기본적으로 레이블을 반환합니다.)
> 2. SHUFFLE: 대상 테이블이 파티션 테이블일 때 이 힌트를 활성화하면 재파티셔닝을 수행합니다.
> 3. NOSHUFFLE: 대상 테이블이 파티션 테이블이어도 재파티셔닝을 수행하지 않으며, 데이터가 각 파티션에 올바르게 저장되도록 다른 작업을 수행합니다.

주의 사항:

1. 현재 버전에서는 세션 변수 `enable_insert_strict`가 기본적으로 `true`로 설정됩니다. `INSERT OVERWRITE` 문을 실행하는 동안 대상 테이블의 형식에 맞지 않는 데이터가 필터링되면 대상 테이블 덮어쓰기가 실패합니다. 예를 들어 파티션을 덮어쓸 때 데이터가 파티션 조건을 모두 충족하지 못하는 경우가 이에 해당합니다.
2. `INSERT OVERWRITE` 문은 먼저 새 테이블을 생성하고 덮어쓸 데이터를 새 테이블에 삽입한 다음, 기존 테이블을 새 테이블로 원자적으로 교체하고 이름을 변경합니다. 따라서 테이블을 덮어쓰는 동안에도 작업이 완료될 때까지 기존 테이블의 데이터에 정상적으로 접근할 수 있습니다.

### 자동 파티션 테이블의 경우 {#for-auto-partition-table}

INSERT OVERWRITE의 대상 테이블이 자동 파티션 테이블인 경우, [세션 변수](../../session/variable/SET-VARIABLE.md)  `enable_auto_create_when_overwrite`가 다음과 같이 동작을 제어합니다.

1. PARTITION을 지정하지 않으면(전체 테이블 덮어쓰기), `enable_auto_create_when_overwrite`가 `true`일 때 테이블을 덮어쓰고, 대응하는 파티션이 없는 데이터에 대해서는 테이블의 자동 파티셔닝 규칙에 따라 파티션을 생성하여 해당 데이터를 수용합니다. `enable_auto_create_when_overwrite`가 `false`이면 해당하는 파티션을 찾을 수 없는 데이터가 오류 행으로 누적되다가 작업이 실패합니다.
2. 덮어쓸 PARTITION을 지정하면 이 과정에서 AUTO PARTITION 테이블은 일반 파티션 테이블처럼 동작하며, 기존 파티션의 조건을 충족하지 않는 데이터는 새 파티션을 생성하는 대신 필터링됩니다.
3. PARTITION을 `partition(*)`로 지정하면(파티션을 자동으로 감지하여 덮어쓰기), `enable_auto_create_when_overwrite`가 `true`일 때 테이블에 대응하는 파티션이 있는 데이터는 해당 파티션을 덮어쓰고, 나머지 기존 파티션은 그대로 유지합니다. 동시에 대응하는 파티션이 없는 데이터에 대해서는 테이블의 자동 파티셔닝 규칙에 따라 파티션을 생성하여 해당 데이터를 수용합니다. `enable_auto_create_when_overwrite`가 `false`이면 해당하는 파티션을 찾을 수 없는 데이터가 오류 행으로 누적되다가 작업이 실패합니다.

`enable_auto_create_when_overwrite`가 없는 버전에서는 이 변수의 값이 `false`인 것처럼 동작합니다.

다음 표에서 동작을 빠르게 확인할 수 있습니다.

1. `enable_auto_create_when_overwrite`가 활성화된 자동 파티션 테이블:

|    | 덮어쓸 파티션 | 다른 파티션 비우기 | 대응 파티션이 없는 데이터의 파티션 자동 생성 |
|-|-|-|-|
| 미지정(전체 테이블) | 전체 | √ | √ |
| 파티션 지정 | 명시된 파티션 | × | × |
| `partition(*)` | 데이터가 속한 파티션 | × | √ |

2. 일반 테이블 및 `enable_auto_create_when_overwrite`가 비활성화된 자동 파티션 테이블:

|    | 덮어쓸 파티션 | 다른 파티션 비우기 | 대응 파티션이 없는 데이터의 파티션 자동 생성 |
|-|-|-|-|
| 미지정(전체 테이블) | 전체 | √ | × |
| 파티션 지정 | 명시된 파티션 | × | × |
| `partition(*)` | 데이터가 속한 파티션 | × | × |

예제는 다음과 같습니다.

```sql
mysql> create table auto_list(
    ->              k0 varchar null
    ->          )
    ->          auto partition by list (k0)
    ->          (
    ->              PARTITION p1 values in (("Beijing"), ("BEIJING")),
    ->              PARTITION p2 values in (("Shanghai"), ("SHANGHAI")),
    ->              PARTITION p3 values in (("xxx"), ("XXX")),
    ->              PARTITION p4 values in (("list"), ("LIST")),
    ->              PARTITION p5 values in (("1234567"), ("7654321"))
    ->          )
    ->          DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    ->          properties("replication_num" = "1");
Query OK, 0 rows affected (0.14 sec)

mysql> insert into auto_list values ("Beijing"),("Shanghai"),("xxx"),("list"),("1234567");
Query OK, 5 rows affected (0.22 sec)

mysql> insert overwrite table auto_list partition(*) values ("BEIJING"), ("new1");
Query OK, 2 rows affected (0.28 sec)

mysql> select * from auto_list;
+----------+ --- p1 is overwritten, new1 gets the new partition, and the other partitions remain unchanged.
| k0       |
+----------+
| 1234567  |
| BEIJING  |
| list     |
| xxx      |
| new1     |
| Shanghai |
+----------+
6 rows in set (0.48 sec)

mysql> insert overwrite table auto_list values ("SHANGHAI"), ("new2");
Query OK, 2 rows affected (0.17 sec)

mysql> select * from auto_list;
+----------+ --- The whole table is overwritten, and new2 gets the new partition.
| k0       |
+----------+
| new2     |
| SHANGHAI |
+----------+
2 rows in set (0.15 sec)
```

## 예제 {#example}

이름이 `test`인 테이블이 있다고 가정합니다. 이 테이블에는 `c1`과 `c2`라는 두 열과 `p1`과 `p2`라는 두 파티션이 있습니다.

```sql
CREATE TABLE IF NOT EXISTS test (
  `c1` int NOT NULL DEFAULT "1",
  `c2` int NOT NULL DEFAULT "4"
) ENGINE=OLAP
UNIQUE KEY(`c1`)
PARTITION BY LIST (`c1`)
(
PARTITION p1 VALUES IN ("1","2","3"),
PARTITION p2 VALUES IN ("4","5","6")
)
DISTRIBUTED BY HASH(`c1`) BUCKETS 3
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1",
  "in_memory" = "false",
  "storage_format" = "V2"
);
```

두 번째 테이블인 `test2`는 아래의 쿼리 기반 덮어쓰기 예제에서 참조됩니다. 이 테이블도 `(c1, c2)` 구조를 가지므로 `INSERT OVERWRITE test SELECT * FROM test2`가 성공합니다.

```sql
CREATE TABLE IF NOT EXISTS test2 (
  `c1` int NOT NULL,
  `c2` int NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c1`) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test2 VALUES (1, 10), (2, 20);
```

### 테이블 덮어쓰기 {#overwrite-table}

1. `test` 테이블을 `VALUES` 형식으로 덮어씁니다.

   ```sql
   // Single-row overwrite.
   INSERT OVERWRITE table test VALUES (1, 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, DEFAULT);
   INSERT OVERWRITE table test (c1) VALUES (1);
   // Multi-row overwrite.
   INSERT OVERWRITE table test VALUES (1, 2), (3, 2 + 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, 2), (3, 2 * 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
   INSERT OVERWRITE table test (c1) VALUES (1), (3);
   ```

- 첫 번째 문과 두 번째 문은 같은 효과를 냅니다. 덮어쓸 때 대상 열을 지정하지 않으면 테이블의 열 순서를 기본 대상 열 순서로 사용합니다. 덮어쓰기가 성공하면 `test` 테이블에는 데이터가 한 행만 남습니다.
- 세 번째 문과 네 번째 문은 같은 효과를 냅니다. 지정하지 않은 열 `c2`는 기본값 4로 덮어씁니다. 덮어쓰기가 성공하면 `test` 테이블에는 데이터가 한 행만 남습니다.
- 다섯 번째 문과 여섯 번째 문은 같은 효과를 냅니다. 문에서 표현식(예: `2+2`, `2*2`)을 사용할 수 있습니다. 문을 실행할 때 표현식의 결과를 계산한 뒤 해당 결과로 `test` 테이블을 덮어씁니다. 덮어쓰기가 성공하면 `test` 테이블에는 데이터가 두 행 남습니다.
- 일곱 번째 문과 여덟 번째 문은 같은 효과를 냅니다. 지정하지 않은 열 `c2`는 기본값 4로 덮어씁니다. 덮어쓰기가 성공하면 `test` 테이블에는 데이터가 두 행 남습니다.

2. `test` 테이블을 쿼리문 형식으로 덮어씁니다. `test2` 테이블과 `test` 테이블의 데이터 형식이 일치해야 합니다. 일치하지 않으면 암시적 데이터 타입 변환이 수행됩니다.

   ```sql
   INSERT OVERWRITE table test SELECT * FROM test2;
   INSERT OVERWRITE table test (c1, c2) SELECT * from test2;
   ```

- 첫 번째 문과 두 번째 문은 같은 효과를 냅니다. 이 문들은 `test2` 테이블에서 데이터를 가져와 해당 데이터로 `test` 테이블을 덮어씁니다. 덮어쓰기가 성공하면 `test` 테이블의 데이터는 `test2` 테이블의 데이터와 일치합니다.

3. `test` 테이블을 덮어쓰고 레이블을 지정합니다.

   ```sql
   INSERT OVERWRITE table test WITH LABEL `label1` SELECT * FROM test2;
   INSERT OVERWRITE table test WITH LABEL `label2` (c1, c2) SELECT * from test2;
   ```

- 사용자는 `SHOW LOAD;` 명령으로 이 `label`로 수행한 데이터 적재 작업의 상태를 확인할 수 있습니다. 레이블은 고유해야 합니다.

### 테이블 파티션 덮어쓰기 {#overwrite-table-partition}

INSERT OVERWRITE로 파티션을 덮어쓸 때는 다음 세 단계를 하나의 트랜잭션으로 묶어 실행합니다. 도중에 실패하면 이미 수행한 작업을 롤백합니다.

1. 덮어쓸 파티션으로 `p1`을 지정했다고 가정합니다. 먼저 덮어쓸 대상 파티션과 구조가 같은 빈 임시 파티션 `pTMP`를 생성합니다.
2. `pTMP`에 데이터를 씁니다.
3. `p1`을 `pTMP`로 원자적으로 교체합니다.

다음은 예제입니다.

1. `P1`과 `P2` 파티션이 있는 `test` 테이블에서 `VALUES` 형식으로 해당 파티션을 덮어씁니다.

   ```sql
   // Single-row overwrite.
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (1, 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, DEFAULT);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1) VALUES (1);
   // Multi-row overwrite.
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (1, 2), (4, 2 + 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, 2), (4, 2 * 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, DEFAULT), (4, DEFAULT);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1) VALUES (1), (4);
   ```

   전체 테이블을 덮어쓰는 경우와 달리, 위 문들은 테이블의 파티션을 덮어씁니다. 파티션을 한 번에 하나씩 덮어쓰거나 여러 파티션을 동시에 덮어쓸 수 있습니다. 해당 파티션의 필터링 조건을 충족하는 데이터만 성공적으로 덮어쓸 수 있다는 점에 유의해야 합니다. 덮어쓸 데이터 중 어느 파티션의 조건도 충족하지 않는 데이터가 있으면 덮어쓰기가 실패합니다. 다음은 실패하는 예제입니다.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (7, 2);
   ```

   위 문에서 덮어쓸 데이터(`c1=7`)는 `P1`과 `P2` 파티션의 조건을 충족하지 않으므로 덮어쓰기가 실패합니다.

2. `P1`과 `P2` 파티션이 있는 `test` 테이블에서 쿼리문 형식으로 해당 파티션을 덮어씁니다. `test2` 테이블과 `test` 테이블의 데이터 형식이 일치해야 합니다. 일치하지 않으면 암시적 데이터 타입 변환이 수행됩니다.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) SELECT * from test2;
   ```

3. `P1`과 `P2` 파티션이 있는 `test` 테이블에서 해당 파티션을 덮어쓰고 레이블을 지정합니다.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label3` SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label4` (c1, c2) SELECT * from test2;
   ```

### 자동 감지한 파티션 덮어쓰기 {#overwrite-auto-detect-partition}

> 이 기능은 버전 2.1.3부터 사용할 수 있습니다.

INSERT OVERWRITE 명령의 PARTITION 절을 `PARTITION(*)`로 지정하면 덮어쓸 데이터가 속한 파티션을 자동으로 감지합니다. 예제는 다음과 같습니다.

```sql
mysql> create table test(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p10 values less than (10),
    -> PARTITION p100 values less than (100),
    -> PARTITION pMAX values less than (maxvalue)
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.11 sec)

mysql> insert into test values (1), (2), (15), (100), (200);
Query OK, 5 rows affected (0.29 sec)

mysql> select * from test order by k0;
+------+
| k0   |
+------+
|    1 |
|    2 |
|   15 |
|  100 |
|  200 |
+------+
5 rows in set (0.23 sec)

mysql> insert overwrite table test partition(*) values (3), (1234);
Query OK, 2 rows affected (0.24 sec)

mysql> select * from test order by k0;
+------+
| k0   |
+------+
|    3 |
|   15 |
| 1234 |
+------+
3 rows in set (0.20 sec)
```

예제에서 볼 수 있듯이, `p10`과 `pMAX`는 데이터 3과 1234가 속한 파티션이며 이 파티션의 모든 데이터를 덮어씁니다. 반면 `p100` 파티션은 그대로 유지됩니다. 이 작업은 INSERT OVERWRITE 작업에서 PARTITION 절로 덮어쓸 특정 파티션을 지정하는 구문을 간소화한 편의 구문(syntactic sugar)으로 볼 수 있으며, [덮어쓸 파티션 지정](#overwrite-table-partition)과 같은 방식으로 구현됩니다. `PARTITION(*)` 구문을 사용하면 많은 파티션을 덮어쓸 때 모든 파티션 이름을 수동으로 입력할 필요가 없습니다.

## 키워드 {#keywords}

INSERT OVERWRITE, OVERWRITE, AUTO DETECT
