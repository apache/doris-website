---
{
    "title": "INSERT OVERWRITE",
    "language": "ko",
    "description": "이 문은 테이블 전체 또는 테이블의 일부 파티션을 덮어씁니다"
}
---

## 설명 {#description}

이 문은 테이블 전체 또는 테이블의 일부 파티션을 덮어씁니다

```sql
INSERT OVERWRITE table table_name
    [ PARTITION (p1, ... | *) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 매개변수

> table_name: 덮어쓸 대상 테이블입니다. 이 테이블은 이미 존재해야 합니다. `db_name.table_name` 형식으로 지정할 수 있습니다
>
> partitions: 덮어쓸 테이블 파티션입니다. 다음 두 가지 형식을 지원합니다
>
> > 1. 파티션 이름. `table_name`에 존재하는 파티션의 이름을 지정해야 하며, 여러 이름은 쉼표로 구분합니다
> > 2. 별표(*). [파티션 자동 감지](#overwrite-auto-detect-partition)를 활성화합니다. 쓰기 작업에서 데이터에 해당하는 파티션을 자동으로 감지하여 덮어씁니다. 이 형식은 Apache Doris 2.1.3 버전부터 지원됩니다.
>
> label: Insert 작업의 레이블을 지정합니다
>
> column_name: 지정하는 대상 컬럼은 `table_name`에 존재하는 컬럼이어야 합니다
>
> expression: 컬럼에 할당할 값을 계산하는 표현식입니다
>
> DEFAULT: 컬럼에 기본값을 사용합니다
>
> query: 일반적인 쿼리이며, 쿼리 결과로 대상을 덮어씁니다.
>
> hint: `INSERT`의 실행 동작을 지정하는 힌트입니다. `/*+ STREAMING */`, `/*+ SHUFFLE */` 또는 `/*+ NOSHUFFLE */` 중 하나를 선택할 수 있습니다.
>
> 1. STREAMING: 현재는 실제 효과가 없으며 이전 버전과의 호환성을 위해서만 유지됩니다. (이전 버전에서는 이 힌트를 추가해야 레이블이 반환되었지만, 현재는 기본적으로 레이블을 반환합니다)
> 2. SHUFFLE: 대상 테이블이 파티션 테이블인 경우 이 힌트를 활성화하면 데이터를 재분할합니다.
> 3. NOSHUFFLE: 대상 테이블이 파티션 테이블이더라도 데이터를 재분할하지 않습니다. 대신 데이터가 각 파티션에 올바르게 저장되도록 다른 작업을 수행합니다.

주의:

1. 현재 버전에서는 세션 변수 `enable_insert_strict`가 기본적으로 `true`로 설정됩니다. `INSERT OVERWRITE` 문을 실행하는 동안 대상 테이블의 형식에 맞지 않는 데이터가 필터링되면 대상 테이블 덮어쓰기가 실패합니다. 예를 들어 파티션을 덮어쓸 때 데이터가 모든 파티션 조건을 충족하지 못하는 경우가 이에 해당합니다.
2. `INSERT OVERWRITE` 문은 먼저 새 테이블을 생성하고 덮어쓸 데이터를 새 테이블에 삽입한 다음, 기존 테이블을 새 테이블로 원자적으로 교체하고 이름을 변경합니다. 따라서 테이블을 덮어쓰는 동안에도 덮어쓰기가 완료될 때까지 기존 테이블의 데이터에 정상적으로 접근할 수 있습니다.

### 자동 파티션 테이블의 경우 {#for-auto-partition-table}

INSERT OVERWRITE의 대상이 자동 파티션 테이블인 경우, [세션 변수](../../session/variable/SET-VARIABLE.md)  `enable_auto_create_when_overwrite`가 다음과 같이 동작을 제어합니다:

1. PARTITION을 지정하지 않은 경우(전체 테이블 덮어쓰기), `enable_auto_create_when_overwrite`가 `true`이면 테이블을 덮어쓰고, 해당하는 파티션이 없는 데이터에 대해서는 테이블의 자동 파티션 규칙에 따라 파티션을 생성하여 데이터를 수용합니다. `enable_auto_create_when_overwrite`가 `false`이면 해당하는 파티션을 찾을 수 없는 데이터가 오류 행으로 누적되어 작업이 실패합니다.
2. 덮어쓸 PARTITION을 지정한 경우, AUTO PARTITION 테이블은 이 과정에서 일반 파티션 테이블과 동일하게 동작합니다. 기존 파티션의 조건을 충족하지 않는 데이터는 새 파티션을 생성하는 대신 필터링됩니다.
3. PARTITION을 `partition(*)`로 지정한 경우(파티션 자동 감지 및 덮어쓰기), `enable_auto_create_when_overwrite`가 `true`이면 테이블에 해당하는 파티션이 있는 데이터에 대해 그 파티션을 덮어쓰고 다른 기존 파티션은 그대로 유지합니다. 동시에 해당하는 파티션이 없는 데이터에 대해서는 테이블의 자동 파티션 규칙에 따라 파티션을 생성하여 데이터를 수용합니다. `enable_auto_create_when_overwrite`가 `false`이면 해당하는 파티션을 찾을 수 없는 데이터가 오류 행으로 누적되어 작업이 실패합니다.

`enable_auto_create_when_overwrite`가 없는 버전에서는 이 변수의 값이 `false`인 것처럼 동작합니다.

동작을 간단히 정리하면 다음과 같습니다:

1. `enable_auto_create_when_overwrite`가 활성화된 자동 파티션 테이블:

|    | 덮어쓸 파티션 | 다른 파티션 비우기 | 해당 파티션이 없는 데이터의 파티션 자동 생성 |
|-|-|-|-|
| 파티션 미지정(전체 테이블) | 전체 | √ | √ |
| 파티션 지정 | 명시적으로 지정한 파티션 | × | × |
| `partition(*)` | 데이터가 속한 파티션 | × | √ |

2. 일반 테이블 및 `enable_auto_create_when_overwrite`가 비활성화된 자동 파티션 테이블:

|    | 덮어쓸 파티션 | 다른 파티션 비우기 | 해당 파티션이 없는 데이터의 파티션 자동 생성 |
|-|-|-|-|
| 파티션 미지정(전체 테이블) | 전체 | √ | × |
| 파티션 지정 | 명시적으로 지정한 파티션 | × | × |
| `partition(*)` | 데이터가 속한 파티션 | × | × |

예제는 다음과 같습니다:

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

`test`라는 테이블이 있다고 가정합니다. 이 테이블에는 두 컬럼 `c1`과 `c2`, 두 파티션 `p1`과 `p2`가 있습니다

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

- 첫 번째와 두 번째 문은 효과가 같습니다. 덮어쓸 때 대상 컬럼을 지정하지 않으면 테이블의 컬럼 순서를 기본 대상 컬럼 순서로 사용합니다. 덮어쓰기가 성공하면 `test` 테이블에는 데이터가 한 행만 남습니다.
- 세 번째와 네 번째 문은 효과가 같습니다. 지정하지 않은 컬럼 `c2`는 기본값 4로 덮어씁니다. 덮어쓰기가 성공하면 `test` 테이블에는 데이터가 한 행만 남습니다.
- 다섯 번째와 여섯 번째 문은 효과가 같습니다. 문에서 표현식(예: `2+2`, `2*2`)을 사용할 수 있습니다. 문을 실행하는 동안 표현식의 결과를 계산한 다음 그 결과로 `test` 테이블을 덮어씁니다. 덮어쓰기가 성공하면 `test` 테이블에는 데이터가 두 행 남습니다.
- 일곱 번째와 여덟 번째 문은 효과가 같습니다. 지정하지 않은 컬럼 `c2`는 기본값 4로 덮어씁니다. 덮어쓰기가 성공하면 `test` 테이블에는 데이터가 두 행 남습니다.

2. `test` 테이블을 쿼리 문 형식으로 덮어씁니다. `test2` 테이블과 `test` 테이블의 데이터 형식은 같아야 합니다. 같지 않으면 암시적 데이터 타입 변환이 발생합니다.

   ```sql
   INSERT OVERWRITE table test SELECT * FROM test2;
   INSERT OVERWRITE table test (c1, c2) SELECT * from test2;
   ```

- 첫 번째와 두 번째 문은 효과가 같습니다. 이 문들은 `test2` 테이블에서 데이터를 가져와 해당 데이터로 `test` 테이블을 덮어씁니다. 덮어쓰기가 성공하면 `test` 테이블의 데이터는 `test2` 테이블의 데이터와 일치합니다.

3. `test` 테이블을 덮어쓰면서 레이블을 지정합니다.

   ```sql
   INSERT OVERWRITE table test WITH LABEL `label1` SELECT * FROM test2;
   INSERT OVERWRITE table test WITH LABEL `label2` (c1, c2) SELECT * from test2;
   ```

- 사용자는 `SHOW LOAD;` 명령으로 해당 `label`로 수행한 데이터 적재 작업의 상태를 확인할 수 있습니다. 레이블은 고유해야 합니다.

### 테이블 파티션 덮어쓰기 {#overwrite-table-partition}

INSERT OVERWRITE로 파티션을 덮어쓸 때는 다음 세 단계를 하나의 트랜잭션으로 묶어 실행합니다. 도중에 실패하면 이미 수행한 작업을 롤백합니다:

1. 덮어쓸 파티션으로 `p1`을 지정했다고 가정하면, 먼저 대상 파티션과 구조가 같은 빈 임시 파티션 `pTMP`를 생성합니다.
2. 데이터를 `pTMP`에 씁니다.
3. `p1`을 `pTMP`로 원자적으로 교체합니다

예제는 다음과 같습니다:

1. `P1`과 `P2` 파티션을 `test` 테이블에서 `VALUES` 형식으로 덮어씁니다.

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

   위 문들은 전체 테이블을 덮어쓰는 경우와 달리 테이블의 파티션을 덮어씁니다. 파티션은 한 번에 하나씩 덮어쓸 수도 있고 여러 개를 동시에 덮어쓸 수도 있습니다. 해당 파티션의 필터링 조건을 충족하는 데이터만 성공적으로 덮어쓸 수 있습니다. 덮어쓸 데이터 중 어느 파티션의 조건도 충족하지 않는 데이터가 있으면 덮어쓰기가 실패합니다. 실패 예제는 다음과 같습니다.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (7, 2);
   ```

   위 문으로 덮어쓸 데이터(`c1=7`)는 파티션 `P1`과 `P2`의 조건을 충족하지 않으므로 덮어쓰기가 실패합니다.

2. `P1`과 `P2` 파티션을 `test` 테이블에서 쿼리 문 형식으로 덮어씁니다. `test2` 테이블과 `test` 테이블의 데이터 형식은 같아야 합니다. 같지 않으면 암시적 데이터 타입 변환이 발생합니다.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) SELECT * from test2;
   ```

3. `P1`과 `P2` 파티션을 `test` 테이블에서 덮어쓰면서 레이블을 지정합니다.

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label3` SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label4` (c1, c2) SELECT * from test2;
   ```

### 자동으로 감지한 파티션 덮어쓰기 {#overwrite-auto-detect-partition}

> 이 기능은 버전 2.1.3부터 사용할 수 있습니다.

INSERT OVERWRITE 명령에서 지정한 PARTITION 절이 `PARTITION(*)`이면 덮어쓰기 작업에서 데이터가 속한 파티션을 자동으로 감지합니다. 예제:

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

위 예에서 보듯이, 파티션 `p10`과 `pMAX`에는 각각 데이터 3과 1234가 속하며, 이 파티션의 모든 데이터가 덮어써집니다. 반면 파티션 `p100`은 그대로 유지됩니다. 이 작업은 INSERT OVERWRITE 작업에서 PARTITION 절로 덮어쓸 파티션을 지정하는 구문을 간단히 표현한 것으로 볼 수 있으며, [덮어쓸 파티션 지정](#overwrite-table-partition)과 같은 방식으로 구현됩니다. `PARTITION(*)` 구문을 사용하면 많은 파티션을 덮어쓸 때 모든 파티션 이름을 직접 입력할 필요가 없습니다.

## 키워드 {#keywords}

INSERT OVERWRITE, OVERWRITE, AUTO DETECT
