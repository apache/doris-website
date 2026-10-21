---
{
    "title": "트랜잭션",
    "language": "ko",
    "description": "트랜잭션은 하나 이상의 SQL 문을 포함하는 작업입니다. 이 문들은 모두 성공하거나 모두 실패하며, 나눌 수 없는 하나의 작업 단위를 이룹니다."
}
---

트랜잭션은 하나 이상의 SQL 문을 포함하는 작업입니다. 이 문들은 모두 성공하거나 모두 실패하며, 나눌 수 없는 하나의 작업 단위를 이룹니다.

## 개요 {#overview}

단일 쿼리나 DDL 문은 암시적 트랜잭션입니다. 쿼리나 DDL을 포함하는 다중 문 트랜잭션은 지원하지 않습니다. 기본적으로 각 쓰기 작업은 암시적 트랜잭션이며, 여러 쓰기 작업을 하나의 명시적 트랜잭션으로 묶을 수 있습니다. Doris는 현재 중첩 트랜잭션을 지원하지 않습니다.

### 명시적 트랜잭션 {#explicit-transaction}

명시적 트랜잭션에서는 사용자가 직접 트랜잭션을 시작하고, 커밋하거나 롤백해야 합니다. 현재 명시적 트랜잭션 내에서는 DDL과 쿼리 문을 지원하지 않습니다.

```sql
BEGIN; 
[INSERT, UPDATE, DELETE statement]
COMMIT; / ROLLBACK;
```

### 암시적 트랜잭션 {#implicit-transaction}

암시적 트랜잭션은 사용자가 실행할 SQL 문이나 문들의 앞뒤에 트랜잭션 시작 및 커밋 문을 명시적으로 추가하지 않는 트랜잭션입니다.

Doris에서는 [Group Commit](./import/load-best-practices/group-commit-manual.md)을 제외한 모든 데이터 적재 문이 실행을 시작할 때 트랜잭션을 엽니다. 문이 성공적으로 완료되면 트랜잭션이 자동으로 커밋되고, 실패하면 자동으로 롤백됩니다. 각 쿼리나 DDL도 암시적 트랜잭션입니다.

### 격리 수준 {#isolation-level}
Doris가 현재 지원하는 격리 수준은 READ COMMITTED뿐입니다. READ COMMITTED 격리 수준에서는 문 실행이 시작되기 전에 커밋된 데이터만 볼 수 있으며, 커밋되지 않은 데이터는 볼 수 없습니다.

단일 문은 실행을 시작할 때 접근하는 테이블의 스냅샷을 생성합니다. 즉, 해당 문이 시작되기 전에 완료된 다른 트랜잭션의 커밋만 볼 수 있으며, 문이 실행되는 동안 다른 트랜잭션이 커밋한 내용은 볼 수 없습니다.

다중 문 트랜잭션 내에서 실행되는 문에는 다음 규칙이 적용됩니다.

* 문 실행이 시작되기 전에 커밋된 데이터만 볼 수 있습니다. 첫 번째 문과 두 번째 문 사이에 다른 트랜잭션이 커밋되면, 같은 트랜잭션에서 연속으로 실행되는 두 문이 서로 다른 데이터를 볼 수 있습니다.
* 현재는 같은 트랜잭션 내에서 앞선 문이 변경한 내용을 볼 수 없습니다.

### 손실과 중복 없는 쓰기 {#no-loss-no-duplication}

Doris는 손실과 중복 없는 쓰기를 지원하기 위해 두 가지 메커니즘을 제공합니다. Label 메커니즘은 단일 트랜잭션에서 중복이 발생하지 않도록 보장하며, 두 단계 커밋은 여러 트랜잭션에 걸쳐 중복이 발생하지 않도록 조정하는 기능을 제공합니다.

#### Label 메커니즘 {#label-mechanism}

Doris 트랜잭션이나 데이터 적재 작업에는 Label을 설정할 수 있습니다. Label은 일반적으로 업무 로직상 의미를 갖는 사용자 정의 문자열이며, 설정하지 않으면 내부적으로 UUID 문자열이 생성됩니다. Label의 주된 목적은 트랜잭션이나 데이터 적재 작업을 고유하게 식별하고, 동일한 Label을 가진 트랜잭션이나 데이터 적재 작업이 단 한 번만 성공적으로 실행되도록 보장하는 것입니다. Label 메커니즘은 적재된 데이터의 손실과 중복을 방지합니다. 업스트림 데이터 소스가 At-Least-Once 의미 체계를 보장할 수 있다면, Doris의 Label 메커니즘과 함께 Exactly-Once 의미 체계를 구현할 수 있습니다. Label은 데이터베이스 내에서 고유합니다.

Doris는 시간과 개수를 기준으로 Label을 정리합니다. 기본적으로 Label 개수가 2000개를 초과하면 제거가 시작되며, 생성된 지 3일이 지난 Label도 기본적으로 제거됩니다. Label이 제거된 후에는 같은 이름의 Label로 다시 성공적으로 실행할 수 있습니다. 즉, 중복 제거 의미 체계가 더 이상 적용되지 않습니다.

Label은 일반적으로 `business logic + time` 형식으로 설정하며, 예를 들면 `my_business1_20220330_125000`과 같습니다. 이 Label은 보통 업무 `my_business1`에서 `2022-03-30 12:50:00`에 생성한 데이터 배치를 나타냅니다. 이러한 Label 체계를 사용하면 업무 측에서 Label로 데이터 적재 작업의 상태를 조회하여 해당 배치와 시점의 데이터가 이미 성공적으로 적재되었는지 명확하게 확인할 수 있습니다. 아직 적재되지 않았다면 동일한 Label로 데이터 적재를 재시도할 수 있습니다.

#### StreamLoad 2PC {#streamload-2pc}

[StreamLoad 2PC](#stream-load-2pc)는 주로 Flink가 Doris에 데이터를 쓸 때 EOS 의미 체계를 지원하는 데 사용됩니다.

## 명시적 트랜잭션 작업 {#explicit-transaction-operations}

### 트랜잭션 시작 {#begin-a-transaction}

```sql
BEGIN;

BEGIN WITH LABEL {user_label}; 
```

현재 Session에서 이미 트랜잭션이 진행 중일 때 이 문을 실행하면 Doris는 해당 문을 무시합니다. 즉, 트랜잭션은 중첩할 수 없습니다.

### 트랜잭션 커밋 {#commit-a-transaction}

```sql 
COMMIT;
```

현재 트랜잭션에서 수행한 모든 변경 사항을 커밋하는 데 사용합니다.

### 트랜잭션 롤백 {#roll-back-a-transaction}

```sql
ROLLBACK;
```

현재 트랜잭션의 모든 변경 사항을 취소하는 데 사용합니다.

트랜잭션은 Session 단위로 관리됩니다. Session이 중단되거나 닫히면 트랜잭션도 자동으로 롤백됩니다.

## 여러 SQL 문을 통한 쓰기 {#writing-multiple-sql-statements}

Doris는 현재 트랜잭션 내에서 두 가지 쓰기 방식을 지원합니다.

### 단일 테이블에 여러 `INSERT INTO VALUES` 쓰기 수행 {#multiple-insert-into-values-writes-to-a-single-table}

테이블 구조가 다음과 같다고 가정합니다.

```sql
CREATE TABLE `dt` (
    `id` INT(11) NOT NULL,
    `name` VARCHAR(50) NULL,
    `score` INT(11) NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_num" = "1"
);
```

데이터를 씁니다.

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.01 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':''}

mysql> INSERT INTO dt (id, name, score) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.08 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':'10013'}

mysql> INSERT INTO dt VALUES (6, "William", 69), (7, "Sophia", 32), (8, "James", 64), (9, "Emma", 37), (10, "Liam", 64);
Query OK, 5 rows affected (0.00 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'PREPARE', 'txnId':'10013'}

mysql> COMMIT;
Query OK, 0 rows affected (1.02 sec)
{'label':'txn_insert_b55db21aad7451b-b5b6c339704920c5', 'status':'VISIBLE', 'txnId':'10013'}
```

이 쓰기 방식은 쓰기의 원자성을 보장할 뿐 아니라 Doris에서 `INSERT INTO VALUES`의 쓰기 성능도 향상시킵니다.

사용자가 `Group Commit`과 트랜잭션 쓰기를 모두 활성화하면 트랜잭션 쓰기가 적용됩니다.

### 여러 테이블에 여러 `INSERT INTO SELECT`, `UPDATE`, `DELETE` 쓰기 수행 {#multiple-insert-into-select-update-and-delete-writes-across-tables}

위와 동일한 스키마를 가진 세 테이블 `dt1`, `dt2`, `dt3`이 있다고 가정합니다. 각 테이블의 데이터는 다음과 같습니다.

```sql
mysql> SELECT * FROM dt1;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    60 |
|    5 | Ava       |    17 |
+------+-----------+-------+
5 rows in set (0.04 sec)

mysql> SELECT * FROM dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
|    9 | Emma    |    37 |
|   10 | Liam    |    64 |
+------+---------+-------+
5 rows in set (0.03 sec)

mysql> SELECT * FROM dt3;
Empty set (0.03 sec)
```

`dt1`과 `dt2`의 데이터를 `dt3`에 적재하면서, 테이블 `dt1`의 점수를 업데이트하고 테이블 `dt2`의 데이터를 삭제하는 트랜잭션 쓰기를 수행합니다.

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':''}

# The status of the load task is PREPARE
mysql> INSERT INTO dt3 SELECT * FROM dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11024'}

mysql> INSERT INTO dt3 SELECT * FROM dt2;
Query OK, 5 rows affected (0.08 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11025'}

mysql> UPDATE dt1 SET score = score + 10 WHERE id >= 4;
Query OK, 2 rows affected (0.07 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11026'}

mysql> DELETE FROM dt2 WHERE id >= 9;
Query OK, 0 rows affected (0.01 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'PREPARE', 'txnId':'11027'}

mysql> COMMIT;
Query OK, 0 rows affected (0.03 sec)
{'label':'txn_insert_442a6311f6c541ae-b57d7f00fa5db028', 'status':'VISIBLE', 'txnId':'11024'}
```

데이터를 쿼리합니다.

```sql
# Scores for rows with id >= 4 are increased by 10
mysql> SELECT * FROM dt1;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    70 |
|    5 | Ava       |    27 |
+------+-----------+-------+
5 rows in set (0.01 sec)

# Rows with id >= 9 are deleted
mysql> SELECT * FROM dt2;
+------+---------+-------+
| id   | name    | score |
+------+---------+-------+
|    6 | William |    69 |
|    7 | Sophia  |    32 |
|    8 | James   |    64 |
+------+---------+-------+
3 rows in set (0.02 sec)

# The committed data from dt1 and dt2 is written into dt3
mysql> SELECT * FROM dt3;
+------+-----------+-------+
| id   | name      | score |
+------+-----------+-------+
|    1 | Emily     |    25 |
|    2 | Benjamin  |    35 |
|    3 | Olivia    |    28 |
|    4 | Alexander |    60 |
|    5 | Ava       |    17 |
|    6 | William   |    69 |
|    7 | Sophia    |    32 |
|    8 | James     |    64 |
|    9 | Emma      |    37 |
|   10 | Liam      |    64 |
+------+-----------+-------+
10 rows in set (0.01 sec)
```

#### 격리 수준 {#isolation-level-1}

Doris의 트랜잭션 쓰기가 제공하는 격리 수준은 `READ COMMITTED`입니다. 다음 두 가지 사항에 유의하세요.

* 트랜잭션에 여러 문이 포함된 경우, 각 문은 자신의 실행이 시작되는 시점에 커밋되어 있던 데이터를 읽습니다. 예를 들면 다음과 같습니다.

    ```sql
     timestamp | ------------ Session 1 ------------  |  ------------ Session 2 ------------
       t1      | BEGIN;                               | 
       t2      | # read n rows from dt1 table         |
               | INSERT INTO dt3 SELECT * FROM dt1;   |
       t3      |                                      | # write 2 rows to dt1 table
               |                                      | INSERT INTO dt1 VALUES(...), (...);
       t4      | # read n + 2 rows from dt1 table     |
               | INSERT INTO dt3 SELECT * FROM dt1;   |
       t5      | COMMIT;                              |
    ```

* 트랜잭션에 여러 문이 포함된 경우, 각 문은 같은 트랜잭션 내의 다른 문이 변경한 내용을 읽을 수 없습니다. 예를 들면 다음과 같습니다.

    트랜잭션을 시작하기 전에 테이블 `dt1`에는 5개 행, 테이블 `dt2`에는 5개 행이 있고 테이블 `dt3`은 비어 있다고 가정합니다. 다음 코드는 트랜잭션의 구성을 보여 줍니다. 테이블을 생성하고 초기 데이터를 적재하는 과정까지 포함한 실행 가능한 스크립트는 아래의 구체적인 예제에서 확인할 수 있습니다.

    ```sql
    BEGIN;
    # 5 rows are written into dt2; after the transaction commits, dt2 has 10 rows in total
    INSERT INTO dt2 SELECT * FROM dt1;
    # 5 rows are written into dt3; the rows newly written to dt2 in the previous step cannot be read here
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;
    ```

    처음부터 끝까지 실행할 수 있는 구체적인 예제는 다음과 같습니다.

    ```sql
    # Create tables and write data
    CREATE TABLE `dt1` (
        `id` INT(11) NOT NULL,
        `name` VARCHAR(50) NULL,
        `score` INT(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1"
    );
    CREATE TABLE dt2 LIKE dt1;
    CREATE TABLE dt3 LIKE dt1;
    INSERT INTO dt1 VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
    INSERT INTO dt2 VALUES (6, "William", 69), (7, "Sophia", 32), (8, "James", 64), (9, "Emma", 37), (10, "Liam", 64);

    # Transactional writes
    BEGIN;
    INSERT INTO dt2 SELECT * FROM dt1;
    INSERT INTO dt3 SELECT * FROM dt2;
    COMMIT;

    # Query
    mysql> SELECT * FROM dt2;
    +------+-----------+-------+
    | id   | name      | score |
    +------+-----------+-------+
    |    6 | William   |    69 |
    |    7 | Sophia    |    32 |
    |    8 | James     |    64 |
    |    9 | Emma      |    37 |
    |   10 | Liam      |    64 |
    |    1 | Emily     |    25 |
    |    2 | Benjamin  |    35 |
    |    3 | Olivia    |    28 |
    |    4 | Alexander |    60 |
    |    5 | Ava       |    17 |
    +------+-----------+-------+
    10 rows in set (0.01 sec)

    mysql> SELECT * FROM dt3;
    +------+---------+-------+
    | id   | name    | score |
    +------+---------+-------+
    |    6 | William |    69 |
    |    7 | Sophia  |    32 |
    |    8 | James   |    64 |
    |    9 | Emma    |    37 |
    |   10 | Liam    |    64 |
    +------+---------+-------+
    5 rows in set (0.01 sec)
    ```

#### 트랜잭션 내에서 실패한 문 {#failed-statements-in-a-transaction}

트랜잭션 내에서 문이 실패하면 해당 작업은 이미 자동으로 롤백된 상태입니다. 하지만 같은 트랜잭션에서 성공적으로 실행된 다른 문은 여전히 커밋하거나 롤백할 수 있습니다. 트랜잭션이 성공적으로 커밋되면 성공적으로 실행된 문들의 변경 사항이 적용됩니다.

예를 들면 다음과 같습니다.

```sql
mysql> BEGIN;
Query OK, 0 rows affected (0.00 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':''}

mysql> INSERT INTO dt3 SELECT * FROM dt1;
Query OK, 5 rows affected (0.07 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'PREPARE', 'txnId':'11058'}

# A failed write is automatically rolled back
mysql> INSERT INTO dt3 SELECT * FROM dt2;
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=http://172.21.16.12:9082/api/_load_error_log?file=__shard_3/error_log_insert_stmt_3d1fed266ce443f2-b54d2609c2ea6b11_3d1fed266ce443f2_b54d2609c2ea6b11

mysql> INSERT INTO dt3 SELECT * FROM dt2 WHERE id = 7;
Query OK, 1 row affected (0.07 sec)

mysql> COMMIT;
Query OK, 0 rows affected (0.02 sec)
{'label':'txn_insert_c5940d31bf364f57-a48b628886415442', 'status':'VISIBLE', 'txnId':'11058'}
```

쿼리합니다.

```sql
# The data from dt1 is written into dt3, the row with id = 7 from dt2 is written successfully, and the other writes failed
mysql> SELECT * FROM dt3;
+------+----------+-------+
| id   | name     | score |
+------+----------+-------+
|    1 | Emily    |    25 |
|    2 | Benjamin |    35 |
|    3 | Olivia   |    28 |
|    4 | Alexander |    60 |
|    5 | Ava      |    17 |
|    7 | Sophia   |    32 |
+------+----------+-------+
6 rows in set (0.01 sec)
```

#### 자주 발생하는 문제 {#common-issues}

* 쓰기 대상인 여러 테이블은 같은 데이터베이스에 속해야 합니다. 그렇지 않으면 `Transaction insert must be in the same database` 오류가 발생합니다.

* 두 트랜잭션 쓰기 방식인 `INSERT INTO SELECT` / `UPDATE` / `DELETE`와 `INSERT INTO VALUES`는 혼용할 수 없습니다. 혼용하면 `Transaction insert can not insert into values and insert into select at the same time` 오류가 발생합니다.

* [삭제 작업](delete/delete-manual.md)은 조건식을 이용하는 방식과 Using 절을 이용하는 방식의 두 가지 삭제 방법을 제공합니다. 격리 수준을 유지하려면 트랜잭션 내에서 같은 테이블에 대한 삭제를 쓰기보다 먼저 수행해야 합니다. 그렇지 않으면 `Can not delete because there is a insert operation for the same table` 오류가 발생합니다.

* `BEGIN`으로 시작한 데이터 적재가 Doris에 설정된 제한 시간을 초과하면 트랜잭션이 롤백되고 데이터 적재가 실패합니다. 현재 제한 시간은 Session 변수 `insert_timeout`과 `query_timeout` 중 더 큰 값을 사용합니다.

* JDBC로 Doris에 연결하여 트랜잭션 작업을 수행할 때는 JDBC URL에 `useLocalSessionState=true`를 추가하세요. 그렇지 않으면 `This is in a transaction, only insert, update, delete, commit, rollback is acceptable.` 오류가 발생할 수 있습니다.

## Stream Load 2PC {#stream-load-2pc}

**1. HTTP 헤더에 `two_phase_commit:true`를 설정하여 두 단계 커밋을 활성화합니다.**

```shell
curl  --location-trusted -u user:passwd -H "two_phase_commit:true" -T test.txt http://fe_host:http_port/api/{db}/{table}/_stream_load
{
    "TxnId": 18036,
    "Label": "55c8ffc9-1c40-4d51-b75e-f2265b3602ef",
    "TwoPhaseCommit": "true",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 100,
    "NumberLoadedRows": 100,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 1031,
    "LoadTimeMs": 77,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 58,
    "CommitAndPublishTimeMs": 0
}
```

**2. 트랜잭션의 커밋 작업을 실행합니다(요청은 FE 또는 BE에 보낼 수 있습니다).**

- 트랜잭션 ID로 트랜잭션을 지정할 수 있습니다.

  ```shell
  curl -X PUT --location-trusted -u user:passwd -H "txn_id:18036" -H "txn_operation:commit" http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18036] commit successfully."
  }
  ```

- Label로도 트랜잭션을 지정할 수 있습니다.

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:commit"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] commit successfully."
  }
  ```

**3. 트랜잭션의 중단 작업을 실행합니다(요청은 FE 또는 BE에 보낼 수 있습니다).**

- 트랜잭션 ID로 트랜잭션을 지정할 수 있습니다.

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "txn_id:18037" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "transaction [18037] abort successfully."
  }
  ```

- Label로도 트랜잭션을 지정할 수 있습니다.

  ```shell
  curl -X PUT --location-trusted -u user:passwd  -H "label:55c8ffc9-1c40-4d51-b75e-f2265b3602ef" -H "txn_operation:abort"  http://fe_host:http_port/api/{db}/{table}/_stream_load_2pc
  {
      "status": "Success",
      "msg": "label [55c8ffc9-1c40-4d51-b75e-f2265b3602ef] abort successfully."
  }
  ```

## Broker Load 다중 테이블 트랜잭션 {#broker-load-multi-table-transactions}

모든 Broker Load 데이터 적재 작업은 원자적으로 적용됩니다. 동일한 데이터 적재 작업 내에서 여러 테이블에 데이터를 적재하는 경우에도 원자성이 보장됩니다. Label 메커니즘을 사용하면 손실과 중복 없는 데이터 적재도 보장할 수 있습니다.

다음 예제는 HDFS에서 데이터를 적재하며, 와일드카드로 두 배치의 파일을 찾아 두 테이블에 적재합니다.

```sql
LOAD LABEL example_db.label2
(
    DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-10*")
    INTO TABLE `my_table1`
    PARTITION (p1)
    COLUMNS TERMINATED BY ","
    (k1, tmp_k2, tmp_k3)
    SET (
        k2 = tmp_k2 + 1,
        k3 = tmp_k3 + 1
    )
    DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-20*")
    INTO TABLE `my_table2`
    COLUMNS TERMINATED BY ","
    (k1, k2, k3)
)
WITH BROKER hdfs
(
    "username"="hdfs_user",
    "password"="hdfs_password"
);
```

와일드카드로 두 배치의 파일인 `file-10*`과 `file-20*`을 찾아 각각 두 테이블 `my_table1`과 `my_table2`에 적재합니다. 이 중 `my_table1`의 데이터는 파티션 `p1`에 적재되며, 원본 파일의 두 번째와 세 번째 열 값에 1을 더한 후 적재합니다.
