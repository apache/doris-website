---
{
    "title": "Insert Into Values",
    "language": "ko",
    "description": "INSERT INTO VALUES 문을 사용하여 SQL에 직접 지정한 데이터를 Doris 테이블에 동기 방식으로 원자적으로 적재합니다. 기능 검증, 데모, 소규모 배치 데이터 수집에 적합합니다.",
    "keywords": [
        "INSERT INTO VALUES",
        "Doris synchronous load",
        "SQL write to Doris",
        "atomic load",
        "group commit",
        "insert_max_filter_ratio",
        "enable_insert_strict",
        "insert_load_default_timeout_second"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Feature validation / Demo / Small-batch data ingestion -->

INSERT INTO VALUES 문은 SQL에 직접 지정한 값을 Doris 테이블에 적재합니다. 실행 후 데이터 적재 결과를 바로 반환하는 **동기식 데이터 적재 방식**이므로, 응답을 통해 데이터 적재 성공 여부를 확인할 수 있습니다. 이 방식은 데이터 적재 작업의 **원자성**을 보장합니다. 즉, 모든 데이터가 성공적으로 적재되거나 아무 데이터도 적재되지 않습니다.

## 활용 사례 {#use-cases}

INSERT INTO VALUES는 다음 두 가지 시나리오에 적합합니다.

| 시나리오 | 설명 |
| --- | --- |
| 기능 검증 / 데모 | 소량의 모의 데이터를 적재하여 Doris 기능을 검증합니다. 구문은 MySQL과 동일합니다. |
| 소규모 배치 데이터 수집 | 동시성이 낮고 데이터양이 적은 시나리오에서 사용합니다. |

:::tip 성능 팁
INSERT INTO VALUES를 동시에 실행할 때는 커밋 단계의 병목으로 인해 성능이 제한됩니다. 데이터양이 많다면 [Group Commit](../load-best-practices/group-commit-manual.md)을 활성화하여 처리량을 높일 수 있습니다.
:::

## 동작 방식 {#how-it-works}

INSERT INTO VALUES는 MySQL 프로토콜을 통해 FE 노드에 작업을 전송하여 실행합니다. 전체 흐름은 다음과 같습니다.

1. 클라이언트가 MySQL 프로토콜을 통해 FE에 INSERT INTO VALUES 문을 제출합니다.
2. FE가 실행 계획을 생성합니다. 앞부분에는 쿼리 관련 연산자가 포함되며, 마지막 연산자인 `OlapTableSink`가 쿼리 결과를 대상 테이블에 기록합니다.
3. FE가 실행 계획을 BE 노드에 배포하여 실행하고, BE 하나를 **Coordinator** 노드로 선택합니다.
4. Coordinator 노드가 데이터를 수신하고 다른 BE 노드에 분배하여 쓰기를 완료합니다.

## 빠른 시작 {#quick-start}

INSERT INTO VALUES는 MySQL 프로토콜을 통해 제출되고 전송됩니다. 아래 예제에서는 MySQL 명령줄을 사용하여 전체 제출 흐름을 보여 줍니다. 자세한 구문은 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT)를 참조하세요.

### 사전 요구 사항 {#prerequisites}

INSERT INTO VALUES를 실행하려면 대상 테이블에 대한 **INSERT 권한**이 필요합니다. 현재 사용자에게 이 권한이 없다면 [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) 명령을 사용하여 권한을 부여하세요.

### 데이터 적재 작업 생성 {#create-a-load-job}

#### 1단계: 대상 테이블 생성 {#step-1-create-the-target-table}

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### 2단계: INSERT INTO VALUES를 실행하여 데이터 쓰기 {#step-2-run-insert-into-values-to-write-data}

:::caution 프로덕션 환경에서는 권장하지 않음
INSERT INTO VALUES는 일반적으로 데모나 테스트에만 사용하며, 프로덕션 환경의 데이터 수집에는 권장하지 않습니다.
:::

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

동기식 데이터 적재 방식이므로 결과가 클라이언트에 바로 반환됩니다.

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

#### 3단계: 적재된 데이터 확인 {#step-3-verify-the-loaded-data}

```sql
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```

### 데이터 적재 작업 조회 {#view-the-load-job}

`SHOW LOAD` 명령을 사용하여 완료된 INSERT INTO VALUES 작업을 조회합니다.

```sql
mysql> SHOW LOAD FROM testdb\G
*************************** 1. row ***************************
         JobId: 77172
         Label: label_26eebc33411f441c_b2b286730d495e2c
         State: FINISHED
      Progress: Unknown id: 77172
          Type: INSERT
       EtlInfo: NULL
      TaskInfo: cluster:N/A; timeout(s):14400; max_filter_ratio:0.0
      ErrorMsg: NULL
    CreateTime: 2024-11-20 16:44:08
  EtlStartTime: 2024-11-20 16:44:08
 EtlFinishTime: 2024-11-20 16:44:08
 LoadStartTime: 2024-11-20 16:44:08
LoadFinishTime: 2024-11-20 16:44:08
           URL: 
    JobDetails: {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0}
 TransactionId: 61071
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```

### 데이터 적재 작업 취소 {#cancel-the-load-job}

MySQL 클라이언트에서 `Ctrl-C`를 사용하여 현재 실행 중인 INSERT INTO VALUES 작업을 취소합니다.

## 참조 {#reference}

### 데이터 적재 명령 구문 {#load-command-syntax}

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

:::note
INSERT INTO VALUES는 일반적으로 데모에만 사용하며, 프로덕션 환경에서는 권장하지 않습니다.
:::

### 데이터 적재 구성 매개변수 {#load-configuration-parameters}

#### FE 구성 {#fe-configuration}

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400 (4시간) | 데이터 적재 작업의 제한 시간으로, 단위는 초입니다. 이 시간 내에 데이터 적재 작업이 완료되지 않으면 시스템이 작업을 취소하고 상태가 `CANCELLED`로 변경됩니다. |

#### 세션 변수 {#session-variables}

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `insert_timeout` | 14400 (4시간) | INSERT INTO를 SQL 문으로 실행할 때의 제한 시간으로, 단위는 초입니다. |
| `enable_insert_strict` | true | `true`로 설정하면 유효하지 않은 데이터가 발견될 경우 데이터 적재가 실패합니다. `false`로 설정하면 유효하지 않은 행은 무시하며, 한 행 이상이 올바르게 적재되면 데이터 적재가 성공한 것으로 간주합니다. 2.1.4 이하 버전에서는 INSERT INTO의 오류 비율을 제어할 수 없습니다. 이 매개변수로는 데이터 품질을 엄격하게 검사하거나 오류가 있는 데이터를 완전히 무시하는 것만 가능합니다. |
| `insert_max_filter_ratio` | 1.0 | 버전 2.1.5부터 지원합니다. **`enable_insert_strict=false`일 때만 적용됩니다.** `INSERT INTO FROM S3/HDFS/LOCAL()`의 오류 허용 비율을 제어합니다. 값의 범위는 0부터 1까지입니다. 기본값인 1.0은 모든 오류를 허용한다는 의미입니다. 오류 행의 비율이 이 값을 초과하면 INSERT 작업이 실패합니다. |

:::info 유효하지 않은 데이터의 일반적인 원인
원본 열의 길이가 대상 열의 길이를 초과하거나, 열 타입이 일치하지 않거나, 파티션이 일치하지 않거나, 열 순서가 일치하지 않는 경우 등이 있습니다.
:::

### 데이터 적재 반환 값 {#load-return-values}

INSERT INTO VALUES는 SQL 문입니다. 반환 결과에는 다음 필드를 포함하는 JSON 문자열이 들어 있습니다.

| 매개변수 | 설명 |
| -------- | ------------------------------------------------------------ |
| `Label`  | 데이터 적재 작업의 레이블입니다. `INSERT INTO tbl WITH LABEL label ...`로 지정할 수 있습니다. |
| `Status` | 적재된 데이터의 가시성 상태입니다.<br />- `visible`: 데이터 적재에 성공했으며 데이터를 조회할 수 있습니다.<br />- `committed`: 데이터 적재가 완료되었습니다. 지연 후 데이터를 조회할 수 있게 될 수 있으며, 재시도할 필요는 없습니다.<br />- `Label Already Exists`: 레이블이 중복되어 교체해야 합니다.<br />- `Fail`: 데이터 적재에 실패했습니다. |
| `Err`    | 데이터 적재 오류 메시지입니다. |
| `TxnId`  | 데이터 적재 트랜잭션의 ID입니다. |

아래에서 대표적인 네 가지 반환 사례를 살펴봅니다.

#### 사례 1: INSERT 실행 성공 {#scenario-1-insert-executed-successfully}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

- `Query OK`: 문이 성공적으로 실행되었음을 나타냅니다.
- `5 rows affected`: 총 5개 행의 데이터 적재가 완료되었음을 나타냅니다.

#### 사례 2: 경고와 함께 INSERT 실행 성공 {#scenario-2-insert-executed-successfully-with-warnings}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

- `Query OK`: 문이 성공적으로 실행되었음을 나타냅니다.
- `4 rows affected`: 총 4개 행의 데이터 적재가 완료되었음을 나타냅니다.
- `1 warnings`: 1개 행이 필터링되어 제외되었음을 나타냅니다.

[SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md) 문을 사용하여 필터링된 행을 확인합니다. 결과의 `URL`을 사용하여 오류 데이터를 조회할 수 있습니다. 아래의 [오류 행 확인](#view-error-rows)을 참조하세요.

```sql
mysql> SHOW LOAD WHERE label="label_a8d99ae931194d2b_93357aac59981a18"\G
*************************** 1. row ***************************
         JobId: 77158
         Label: label_a8d99ae931194d2b_93357aac59981a18
         State: FINISHED
      Progress: Unknown id: 77158
          Type: INSERT
       EtlInfo: NULL
      TaskInfo: cluster:N/A; timeout(s):14400; max_filter_ratio:0.0
      ErrorMsg: NULL
    CreateTime: 2024-11-20 16:35:40
  EtlStartTime: 2024-11-20 16:35:40
 EtlFinishTime: 2024-11-20 16:35:40
 LoadStartTime: 2024-11-20 16:35:40
LoadFinishTime: 2024-11-20 16:35:40
           URL: http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19
    JobDetails: {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0}
 TransactionId: 61068
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```

#### 사례 3: INSERT 실행에 성공했지만 상태가 committed인 경우 {#scenario-3-insert-executed-successfully-but-status-is-committed}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

데이터를 조회할 수 없는 것은 일시적인 상태이며, 이 배치의 데이터는 결국 조회할 수 있게 됩니다. [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md) 문을 사용하여 가시성 상태를 확인합니다. `TransactionStatus` 열이 `VISIBLE`로 바뀌면 데이터를 조회할 수 있습니다.

```sql
mysql> SHOW TRANSACTION WHERE id=61074\G
*************************** 1. row ***************************
     TransactionId: 61074
             Label: label_78bf5396d9594d4d_a8d9a914af40f73d
       Coordinator: FE: 10.16.10.7
 TransactionStatus: VISIBLE
 LoadJobSourceType: INSERT_STREAMING
       PrepareTime: 2024-11-20 16:51:54
     PreCommitTime: NULL
        CommitTime: 2024-11-20 16:51:54
       PublishTime: 2024-11-20 16:51:54
        FinishTime: 2024-11-20 16:51:54
            Reason: 
ErrorReplicasCount: 0
        ListenerId: -1
         TimeoutMs: 14400000
            ErrMsg: 
1 row in set (0.00 sec)
```

#### 사례 4: INSERT 실행 실패 {#scenario-4-insert-execution-failed}

실행 실패는 성공적으로 적재된 데이터가 없다는 의미입니다.

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.`는 실패 원인을 보여 줍니다.
- 끝에 있는 url을 사용하여 오류 데이터를 조회할 수 있습니다. 아래의 [오류 행 확인](#view-error-rows)을 참조하세요.

## 모범 사례 {#best-practices}

### 데이터양 {#data-volume}

INSERT INTO VALUES는 주로 테스트와 데모에 사용합니다. 대량의 데이터 적재에는 **권장하지 않습니다**. 대규모 배치 쓰기가 필요한 경우 [Group Commit](../load-best-practices/group-commit-manual.md)이나 다른 배치 데이터 적재 방식을 사용하세요.

### 오류 행 확인 {#view-error-rows}

INSERT INTO 반환 결과에 `url` 필드가 있으면 다음 명령을 사용하여 오류 행을 확인합니다.

```sql
SHOW LOAD WARNINGS ON "url";
```

예제:

```sql
mysql> SHOW LOAD WARNINGS ON "http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19"\G
*************************** 1. row ***************************
         JobId: -1
         Label: NULL
ErrorMsgDetail: Reason: column_name[user_id], null value for not null column, type=BIGINT. src line []; 
1 row in set (0.00 sec)
```

일반적인 오류 원인은 다음과 같습니다.

- 원본 열의 길이가 대상 열의 길이를 초과합니다.
- 열 타입이 일치하지 않습니다.
- 파티션이 일치하지 않습니다.
- 열 순서가 일치하지 않습니다.

세션 변수 `enable_insert_strict`를 사용하여 INSERT INTO가 오류 행을 무시할지 제어합니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: INSERT INTO VALUES는 동기식인가요, 비동기식인가요?**

답변: 동기식입니다. 문 실행 후 데이터 적재 결과가 바로 반환되므로 추가로 폴링할 필요가 없습니다.

**Q2: INSERT INTO VALUES는 원자성을 보장하나요?**

답변: 예. 단일 INSERT INTO VALUES의 모든 데이터는 전체가 성공적으로 적재되거나 전체가 실패합니다. 일부만 기록되는 일은 없습니다.

**Q3: 반환된 상태가 `COMMITTED`이면 데이터 적재가 실패한 것인가요?**

답변: 아니요. `COMMITTED`는 데이터 적재가 완료되었으며 곧 데이터를 조회할 수 있게 된다는 의미입니다. 재시도할 필요는 없습니다. `SHOW TRANSACTION`을 사용하여 `TransactionStatus`가 `VISIBLE`로 바뀔 때까지 확인하세요.

**Q4: 데이터 적재 시 `Insert has too many filtered data`가 보고되는 이유는 무엇인가요?**

답변: `enable_insert_strict=false`일 때 필터링된 데이터의 비율이 `insert_max_filter_ratio`로 설정한 임계값을 초과했기 때문입니다. `insert_max_filter_ratio`를 높여 제한을 완화하거나, 원본 데이터가 테이블 스키마(열 타입, NULL 허용 여부 등)에 맞는지 확인하세요.

**Q5: 대규모 배치 데이터 적재에는 어떤 방식을 사용해야 하나요?**

답변: INSERT INTO VALUES는 동시성이 높거나 데이터양이 많을 때 커밋 병목으로 인해 성능이 제한됩니다. [Group Commit](../load-best-practices/group-commit-manual.md)을 활성화하거나, Stream Load 또는 Broker Load와 같은 전용 데이터 적재 방식을 선택하세요.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| `null value for not null column` 오류 | NOT NULL 열에 NULL 값이 삽입되었습니다. | 원본 데이터를 수정하거나, 대상 열이 NULL을 허용하도록 변경합니다. |
| `Insert has too many filtered data` 오류 | 필터링된 행의 비율이 `insert_max_filter_ratio`를 초과합니다. | `insert_max_filter_ratio` 임계값을 높이거나 원본 데이터를 수정합니다. |
| `Label Already Exists` 오류 | 지정한 레이블이 이미 사용 중입니다. | 다른 레이블을 사용하거나, 레이블을 지정하지 않고 시스템이 자동으로 생성하도록 합니다. |
| 작업이 오랫동안 실행되어도 완료되지 않고 취소됩니다. | `insert_load_default_timeout_second` 또는 `insert_timeout`을 초과합니다. | 해당 제한 시간 매개변수의 값을 늘리거나, 데이터 적재를 여러 배치로 나눕니다. |
| 동시성이 높을 때 처리량이 낮습니다. | 커밋 단계의 병목으로 인해 처리량이 제한됩니다. | [Group Commit](../load-best-practices/group-commit-manual.md)을 활성화합니다. |

## 추가 도움말 {#more-help}

INSERT INTO의 자세한 구문은 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md) 명령 설명서를 참조하세요. MySQL 클라이언트 명령줄에서 `HELP INSERT`를 입력해도 추가 도움말을 확인할 수 있습니다.
