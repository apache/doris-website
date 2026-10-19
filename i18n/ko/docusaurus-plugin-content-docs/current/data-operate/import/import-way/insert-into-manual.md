---
{
    "title": "Insert Into Select",
    "language": "ko",
    "description": "INSERT INTO SELECT는 Doris의 동기식 데이터 적재 방식입니다. 테이블 간 ETL, Multi-Catalog를 통한 외부 테이블 데이터 적재, TVF를 통한 파일 적재를 지원하며, 데이터 적재의 원자성을 보장합니다.",
    "keywords": [
        "INSERT INTO SELECT",
        "Doris 데이터 적재",
        "동기식 데이터 적재",
        "Multi-Catalog 데이터 적재",
        "TVF 데이터 적재",
        "ETL 변환",
        "트랜잭션 원자성",
        "insert_timeout",
        "enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data import / ETL transformation / External data source integration -->

INSERT INTO를 사용하면 Doris 쿼리 결과를 다른 테이블에 적재할 수 있습니다. **동기식 데이터 적재** 방식으로, 실행 직후 결과를 반환하므로 반환값으로 성공 여부를 확인할 수 있습니다. INSERT INTO는 데이터 적재 작업의 **원자성**을 보장합니다. 즉, 전체 작업이 성공하거나 전체 작업이 실패합니다.

## 사용 사례 {#use-cases}

INSERT INTO SELECT는 주로 다음 세 가지 상황에서 사용합니다.

| 상황 | 설명 |
| --- | --- |
| 테이블 간 ETL 변환 | Doris 테이블의 데이터에 ETL 변환을 적용한 후 다른 Doris 테이블에 기록합니다. |
| 외부 테이블 데이터 적재 | Multi-Catalog를 통해 MySQL이나 Hive 같은 외부 시스템의 테이블을 매핑한 다음, INSERT INTO SELECT로 외부 데이터를 Doris 테이블에 적재합니다. |
| 파일 직접 적재 | Table Value Function(TVF)을 사용해 객체 스토리지나 HDFS의 파일을 테이블처럼 쿼리하고, 그 결과를 Doris 테이블에 기록합니다. 이때 열 타입은 자동으로 추론됩니다. |

## 기본 원리 {#basic-principles}

INSERT INTO는 MySQL 프로토콜을 통해 FE 노드에 데이터 적재 작업을 제출합니다. 실행 흐름은 다음과 같습니다.

1. FE가 SQL을 수신하고 실행 계획을 생성합니다. 실행 계획의 앞부분은 쿼리 관련 연산자로 구성되며, 마지막 연산자인 `OlapTableSink`가 쿼리 결과를 대상 테이블에 기록합니다.
2. 실행 계획이 BE 노드로 전달되어 실행됩니다.
3. Doris는 BE 하나를 Coordinator 노드로 선택합니다. 이 노드는 데이터를 수신하고 다른 BE 노드에 분배하는 역할을 합니다.

## 빠른 시작 {#quick-start}

INSERT INTO는 MySQL 프로토콜을 통해 제출되고 전송됩니다. 다음 예제에서는 MySQL 명령줄을 사용해 전체 흐름을 보여 줍니다.

자세한 구문은 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT)를 참조하세요.

### 사전 요구 사항 {#prerequisites}

실행하려면 대상 테이블에 대한 `INSERT` 권한이 있어야 합니다. 권한이 없다면 [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) 명령으로 부여할 수 있습니다.

### 데이터 적재 작업 생성 {#create-an-import-job}

**1단계: 원본 테이블 생성**

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

**2단계: 원본 테이블에 데이터 적재(INSERT INTO VALUES 사용 예제)**

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

**3단계: 대상 테이블 생성(원본 테이블과 동일한 스키마 사용)**

```sql
CREATE TABLE testdb.test_table2 LIKE testdb.test_table;
```

**4단계: INSERT INTO SELECT로 대상 테이블에 데이터 적재**

```sql
INSERT INTO testdb.test_table2
SELECT * FROM testdb.test_table WHERE age < 30;
Query OK, 3 rows affected (0.544 sec)
{'label':'label_9c2bae970023407d_b2c5b78b368e78a7', 'status':'VISIBLE', 'txnId':'9084'}
```

**5단계: 데이터 적재 결과 확인**

```sql
MySQL> SELECT * FROM testdb.test_table2 ORDER BY age;
+---------+--------+------+
| user_id | name   | age  |
+---------+--------+------+
|       5 | Ava    |   17 |
|       1 | Emily  |   25 |
|       3 | Olivia |   28 |
+---------+--------+------+
3 rows in set (0.02 sec)
```

**고급 사용법:**

- [JOB](../../../admin-manual/workload-management/job-scheduler)을 사용하면 INSERT를 비동기식으로 실행할 수 있습니다.
- 데이터 원본으로 [TVF](../../../lakehouse/file-analysis.md)나 [Catalog](../../../lakehouse/catalog-overview)의 테이블을 사용할 수 있습니다.

### 데이터 적재 작업 조회 {#view-import-jobs}

`SHOW LOAD` 명령을 사용하면 완료된 INSERT INTO 작업을 조회할 수 있습니다.

```sql
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```

### 데이터 적재 작업 취소 {#cancel-an-import-job}

실행 중인 INSERT INTO 작업은 `Ctrl-C`로 취소할 수 있습니다.

## 참고 {#reference}

### 데이터 적재 명령 {#import-command}

INSERT INTO SELECT는 쿼리 결과를 대상 테이블에 저장합니다. 기본 구문은 다음과 같습니다.

```sql
INSERT INTO target_table SELECT ... FROM source_table;
```

SELECT 문은 일반 쿼리와 동일하며 `WHERE`, `JOIN` 등의 연산을 포함할 수 있습니다.

### 데이터 적재 구성 매개변수 {#import-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

**FE 구성 매개변수**

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400 (4시간) | 데이터 적재 작업의 제한 시간으로, 단위는 초입니다. 이 시간 내에 작업이 완료되지 않으면 시스템이 작업을 취소하고 상태를 `CANCELLED`로 변경합니다. |

**세션 변수**

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| insert_timeout | 14400 (4시간) | SQL 문으로 실행되는 INSERT INTO의 제한 시간으로, 단위는 초입니다. |
| enable_insert_strict | true | true로 설정하면 유효하지 않은 데이터가 발견될 경우 데이터 적재가 실패합니다. false로 설정하면 유효하지 않은 행을 무시하며, 행이 하나 이상 올바르게 적재되면 데이터 적재가 성공한 것으로 간주합니다. 2.1.4 이하 버전에서는 INSERT INTO의 오류 비율을 제어할 수 없습니다. 이 매개변수로 엄격한 검사를 설정하거나 오류 데이터를 모두 무시하도록 설정할 수만 있습니다. 유효하지 않은 데이터가 발생하는 일반적인 원인으로는 원본 열 길이가 대상 열 길이를 초과하는 경우, 열 타입 불일치, 파티션 불일치, 열 순서 불일치 등이 있습니다. |
| insert_max_filter_ratio | 1.0 | 2.1.5 버전부터 지원됩니다. `enable_insert_strict`가 false인 경우에만 적용됩니다. `INSERT INTO FROM S3/HDFS/LOCAL()`의 오류 허용 비율을 제어합니다. 기본값 1.0은 모든 오류를 허용한다는 의미입니다. 값의 범위는 0부터 1까지이며, 오류 행의 비율이 이 값을 초과하면 INSERT 작업이 실패합니다. |

### 데이터 적재 반환값 {#import-return-values}

INSERT INTO는 SQL 문이며, 쿼리 결과에 따라 다음 세 가지 중 하나의 결과를 반환합니다.

#### 결과 집합이 비어 있는 경우 {#empty-result-set}

SELECT 절의 결과 집합이 비어 있으면 다음과 같이 반환됩니다.

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

- `Query OK`는 실행이 성공했음을 나타냅니다.
- `0 rows affected`는 적재된 데이터가 없음을 나타냅니다.

#### 결과 집합이 비어 있지 않고 INSERT가 성공한 경우 {#non-empty-result-set-with-successful-insert}

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 4 rows affected (0.38 sec)
{'label':'INSERT_8510c568-9eda-4173-9e36-6adc7d35291c', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 WITH LABEL my_label1 SELECT * FROM tbl2;
Query OK, 4 rows affected (0.38 sec)
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 2 rows affected, 2 warnings (0.31 sec)
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'visible', 'txnId':'4005'}

mysql> INSERT INTO tbl1 SELECT * FROM tbl2;
Query OK, 2 rows affected, 2 warnings (0.31 sec)
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
```

필드 설명:

- `Query OK`: 실행이 성공했습니다.
- `4 rows affected`: 총 4개의 행이 적재되었습니다.
- `2 warnings`: 필터링으로 제외된 행의 수입니다.

JSON 문자열도 함께 반환됩니다.

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

반환값의 각 필드는 다음과 같습니다.

| 매개변수 | 설명 |
| -------- | ---- |
| TxnId    | 데이터 적재 트랜잭션의 ID입니다. |
| Label    | 데이터 적재 작업의 레이블입니다. `INSERT INTO tbl WITH LABEL label ...`로 지정할 수 있습니다. |
| Status   | 적재된 데이터의 가시성을 나타냅니다.<p>- `visible`: 데이터 적재가 성공했으며 데이터를 조회할 수 있습니다.</p><p>- `committed`: 데이터 적재가 완료되었습니다. 데이터를 조회할 수 있기까지 약간의 지연이 발생할 수 있으며, 재시도할 필요는 없습니다.</p><p>- `Label Already Exists`: 레이블이 중복되므로 다른 레이블을 사용해야 합니다.</p><p>- `Fail`: 데이터 적재가 실패했습니다.</p> |
| Err      | 데이터 적재 오류 메시지입니다. |

필터링으로 제외된 행을 확인하려면 [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD) 문을 사용하세요.

```sql
SHOW LOAD WHERE label="xxx";
```

반환값의 `URL` 필드를 사용하면 오류 데이터를 조회할 수 있습니다. 아래의 [오류 행 조회](#view-error-rows)를 참조하세요.

`committed` 상태는 일시적이며, 데이터는 최종적으로 조회 가능한 상태가 됨을 보장합니다. [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) 문으로 가시성 상태를 조회할 수 있습니다.

```sql
SHOW TRANSACTION WHERE id=4005;
```

반환값의 `TransactionStatus` 열이 `visible`이면 데이터를 조회할 수 있습니다.

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

#### 결과 집합이 비어 있지 않고 INSERT가 실패한 경우 {#non-empty-result-set-with-failed-insert}

실패는 데이터가 전혀 적재되지 않았음을 의미합니다. 반환 결과는 다음과 같습니다.

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

- `ERROR 1064 (HY000): all partitions have no load data`: 실패 원인입니다.
- 반환된 URL을 사용하면 오류 데이터를 조회할 수 있습니다. 아래의 [오류 행 조회](#view-error-rows)를 참조하세요.

## 권장 사용법 {#best-practices}

### 대용량 데이터 적재 {#importing-large-volumes-of-data}

INSERT INTO는 데이터 양에 제한이 없으며 대용량 데이터 적재를 지원합니다. 다만 데이터 양이 많을 때는 다음 조건을 충족하도록 제한 시간을 조정해야 합니다.

> 데이터 적재 제한 시간 >= 데이터 양 / 예상 데이터 적재 속도

다음 두 매개변수를 조정할 수 있습니다.

1. FE 구성 매개변수 `insert_load_default_timeout_second`.
2. 세션 변수 `insert_timeout`.

### 오류 행 조회 {#view-error-rows}

<!-- Knowledge type: Troubleshooting -->

INSERT INTO 반환값에 `url` 필드가 있으면 다음 명령으로 오류 행을 확인할 수 있습니다.

```sql
SHOW LOAD WARNINGS ON "url";
```

예제:

```sql
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

**일반적인 오류 원인:**

- 원본 열 길이가 대상 열 길이를 초과합니다.
- 열 타입이 일치하지 않습니다.
- 파티션이 일치하지 않습니다.
- 열 순서가 일치하지 않습니다.

세션 변수 `enable_insert_strict`로 INSERT INTO의 오류 행 무시 여부를 제어할 수 있습니다.

## Multi-Catalog를 통한 외부 테이블 데이터 적재 {#importing-external-table-data-via-multi-catalog}

<!-- Applicable scenarios: External data source integration -->

Doris는 Multi-Catalog 기능을 통해 Apache Hive, Apache Iceberg, Apache Hudi, Apache Paimon (Incubating), Elasticsearch, MySQL, Oracle, SQL Server 등 널리 사용되는 데이터 레이크 및 데이터베이스에 연결할 수 있습니다. 외부 테이블을 생성한 후 `INSERT INTO SELECT`로 외부 테이블 데이터를 적재하거나 `SELECT`로 직접 쿼리할 수 있습니다.

Multi-Catalog에 대한 자세한 내용은 레이크하우스 문서를 참조하세요. 다음 예제에서는 Hive 외부 테이블을 사용해 데이터 적재 흐름을 설명합니다.

### 1단계: Hive Catalog 생성 {#step-1-create-a-hive-catalog}

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.0.0.1:9083',
    'hadoop.username' = 'hive',
    'dfs.nameservices'='your-nameservice',
    'dfs.ha.namenodes.your-nameservice'='nn1,nn2',
    'dfs.namenode.rpc-address.your-nameservice.nn1'='172.21.0.2:8088',
    'dfs.namenode.rpc-address.your-nameservice.nn2'='172.21.0.3:8088',
    'dfs.client.failover.proxy.provider.your-nameservice'='org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider'
);
```

### 2단계: Doris 대상 테이블 생성 {#step-2-create-the-doris-target-table}

```sql
CREATE TABLE `target_tbl` (
  `k1` decimal(9, 3) NOT NULL COMMENT "",
  `k2` char(10) NOT NULL COMMENT "",
  `k3` datetime NOT NULL COMMENT "",
  `k5` varchar(20) NOT NULL COMMENT "",
  `k6` double NOT NULL COMMENT ""
)
COMMENT "Doris Table"
DISTRIBUTED BY HASH(k1) BUCKETS 2
PROPERTIES (
    "replication_num" = "1"
);
```

테이블 생성에 대한 자세한 내용은 [CREATE-TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) 구문 참조를 확인하세요.

### 3단계: 데이터 적재 실행 {#step-3-execute-the-import}

`hive.db1.source_tbl` 테이블에서 `target_tbl` 테이블로 데이터를 적재합니다.

```sql
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

INSERT는 동기식 명령입니다. 성공 결과가 반환되면 데이터 적재가 성공한 것입니다.

### 주의 사항 {#notes}

- 외부 데이터 원본과 Doris 클러스터 사이에 네트워크가 연결되어 있어야 합니다. 특히 BE 노드와 외부 데이터 원본 간의 연결을 확인해야 합니다.

## TVF를 통한 파일 데이터 적재 {#importing-file-data-via-tvf}

<!-- Applicable scenarios: Direct import of files from object storage / HDFS -->

Doris는 Table Value Function(TVF)을 통해 객체 스토리지나 HDFS의 파일을 테이블처럼 직접 쿼리하고 분석할 수 있습니다. 열 타입 자동 추론과 여러 파일의 적재를 지원합니다. 자세한 내용은 [레이크하우스 / TVF 문서](../../../lakehouse/file-analysis)를 참조하세요.

TVF는 파일 경로에서 와일드카드(`*`, `?`, `[...]`)와 범위 패턴(`{1..10}`)을 지원합니다. 전체 구문은 [파일 경로 패턴](../../../sql-manual/basic-element/file-path-pattern)을 참조하세요.

### 파일 열 타입 자동 추론 {#automatic-file-column-type-inference}

S3 TVF를 예로 들어, 먼저 `DESC FUNCTION`으로 파일 스키마를 확인합니다.

```Plain
DESC FUNCTION s3 (
    "URI" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style"="true"
);
+---------------+--------------+------+-------+---------+-------+
| Field         | Type         | Null | Key   | Default | Extra |
+---------------+--------------+------+-------+---------+-------+
| p_partkey     | INT          | Yes  | false | NULL    | NONE  |
| p_name        | TEXT         | Yes  | false | NULL    | NONE  |
| p_mfgr        | TEXT         | Yes  | false | NULL    | NONE  |
| p_brand       | TEXT         | Yes  | false | NULL    | NONE  |
| p_type        | TEXT         | Yes  | false | NULL    | NONE  |
| p_size        | INT          | Yes  | false | NULL    | NONE  |
| p_container   | TEXT         | Yes  | false | NULL    | NONE  |
| p_retailprice | DECIMAL(9,0) | Yes  | false | NULL    | NONE  |
| p_comment     | TEXT         | Yes  | false | NULL    | NONE  |
+---------------+--------------+------+-------+---------+-------+
```

참고 사항:

- 이 예제에서는 파일 경로, 연결 정보, 인증 정보를 지정합니다.
- `DESC FUNCTION`으로 파일 스키마를 확인할 수 있습니다.
- Parquet 파일의 경우 Doris가 파일 메타데이터에서 열 타입을 자동으로 추론합니다.
- 현재 Doris는 Parquet, ORC, CSV, JSON 형식의 분석과 열 타입 추론을 지원합니다.

### INSERT INTO SELECT로 데이터 적재 {#importing-with-insert-into-select}

```Plain
// 1. Create a Doris internal table
CREATE TABLE IF NOT EXISTS test_table
(
    id int,
    name varchar(50),
    age int
)
DISTRIBUTED BY HASH(id) BUCKETS 4
PROPERTIES("replication_num" = "1");

// 2. Insert data using the S3 Table Value Function
INSERT INTO test_table (id,name,age)
SELECT cast(id as INT) as id, name, cast (age as INT) as age
FROM s3(
    "uri" = "http://127.0.0.1:9312/test2/test.snappy.parquet",
    "s3.access_key"= "ak",
    "s3.secret_key" = "sk",
    "format" = "parquet",
    "use_path_style" = "true");
```

### 주의 사항 {#notes-1}

- `S3 / hdfs` TVF에 지정한 URI와 일치하는 파일이 없거나 일치하는 모든 파일이 비어 있으면 TVF는 빈 결과 집합을 반환합니다. 이 경우 `DESC FUNCTION`으로 스키마를 확인하면 `__dummy_col`이라는 가상 열 하나가 반환되며, 이 열은 무시해도 됩니다.
- TVF 형식을 CSV로 지정했을 때 `The first line is empty, can not parse column numbers` 오류가 발생하면 파일의 첫 번째 줄에서 스키마를 파싱할 수 없다는 의미입니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: INSERT INTO는 동기식인가요, 비동기식인가요?**

INSERT INTO는 기본적으로 **동기식**이며 실행 직후 결과를 반환합니다. 비동기식으로 실행하려면 [JOB](../../../admin-manual/workload-management/job-scheduler)과 함께 사용할 수 있습니다.

**Q2: INSERT INTO가 실패하면 일부 데이터가 기록되나요?**

아니요. INSERT INTO는 **원자성**을 보장합니다. 즉, 전체 작업이 성공하거나 전체 작업이 실패합니다.

**Q3: 데이터 적재 시간 초과는 어떻게 처리하나요?**

`Import timeout >= Data volume / Estimated import speed` 조건을 충족하도록 다음 두 매개변수를 조정하세요.

- FE 구성: `insert_load_default_timeout_second`
- 세션 변수: `insert_timeout`

**Q4: 오류 데이터의 허용 범위는 어떻게 제어하나요?**

- `enable_insert_strict = true`: 유효하지 않은 데이터가 발견되면 즉시 실패합니다.
- `enable_insert_strict = false`: 유효하지 않은 행을 무시합니다(2.1.4 이하 버전).
- 2.1.5 버전부터는 `insert_max_filter_ratio`로 오류 허용 범위를 비율로 제어할 수 있습니다. 이 매개변수는 `enable_insert_strict = false`인 경우에만 적용되며, `INSERT INTO FROM S3/HDFS/LOCAL()`에만 사용할 수 있습니다.

**Q5: 반환된 상태가 `committed`이고 `visible`이 아니면 어떻게 해야 하나요?**

`committed`는 데이터 적재가 완료되었음을 의미하며, 데이터는 최종적으로 조회 가능한 상태가 됨을 보장하므로 재시도할 필요가 없습니다. [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION)을 사용해 `TransactionStatus`가 `visible`로 변경되었는지 확인할 수 있습니다.

## 추가 도움말 {#more-help}

INSERT INTO의 자세한 구문은 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) 명령 참조를 확인하세요. MySQL 클라이언트 명령줄에서 `HELP INSERT`를 입력해 추가 도움말을 볼 수도 있습니다.
