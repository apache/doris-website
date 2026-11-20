---
{
    "title": "INSERT INTO SELECT로 데이터 적재",
    "language": "ko",
    "description": "INSERT INTO SELECT는 Doris의 동기식 데이터 적재 방식입니다. 테이블 간 ETL, Multi-Catalog를 통한 외부 테이블 데이터 적재, TVF를 통한 파일 데이터 적재를 지원하며 적재 작업의 원자성을 보장합니다.",
    "keywords": [
        "INSERT INTO SELECT",
        "Doris data import",
        "synchronous import",
        "Multi-Catalog import",
        "TVF import",
        "ETL transformation",
        "transaction atomicity",
        "insert_timeout",
        "enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data import / ETL transformation / External data source integration -->

INSERT INTO를 사용하면 Doris 쿼리 결과를 다른 테이블에 적재할 수 있습니다. 이는 **동기식 데이터 적재** 방식으로, 실행 직후 결과가 반환되며 반환값으로 성공 여부를 확인할 수 있습니다. INSERT INTO는 적재 작업의 **원자성**을 보장합니다. 전체 작업이 성공하거나 전체 작업이 실패합니다.

## 사용 사례 {#use-cases}

INSERT INTO SELECT는 주로 다음 세 가지 경우에 사용합니다.

| 사용 사례 | 설명 |
| --- | --- |
| 테이블 간 ETL 변환 | Doris 테이블의 데이터에 ETL 변환을 적용한 뒤 다른 Doris 테이블에 기록합니다. |
| 외부 테이블의 데이터 적재 | Multi-Catalog를 통해 MySQL, Hive 등 외부 시스템의 테이블을 매핑한 뒤 INSERT INTO SELECT로 외부 데이터를 Doris 테이블에 적재합니다. |
| 파일 직접 적재 | Table Value Function(TVF)으로 객체 스토리지 또는 HDFS의 파일을 테이블처럼 쿼리하고 열 유형을 자동으로 추론한 뒤, 결과를 Doris 테이블에 기록합니다. |

## 기본 원리 {#basic-principles}

INSERT INTO는 MySQL 프로토콜을 통해 FE 노드에 적재 작업을 제출합니다. 실행 흐름은 다음과 같습니다.

1. FE가 SQL을 받아 실행 계획을 생성합니다. 앞부분은 쿼리 관련 연산자로 구성되고, 마지막 연산자인 `OlapTableSink`가 쿼리 결과를 대상 테이블에 기록합니다.
2. 실행 계획이 BE 노드에 전달되어 실행됩니다.
3. Doris가 BE 하나를 Coordinator 노드로 선택합니다. 이 노드는 데이터를 받아 다른 BE 노드에 분배합니다.

## 빠른 시작 {#quick-start}

INSERT INTO는 MySQL 프로토콜을 통해 제출되고 전송됩니다. 다음 예제에서는 MySQL 명령줄을 사용해 전체 과정을 보여 줍니다.

자세한 구문은 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT)를 참조하세요.

### 사전 요구 사항 {#prerequisites}

실행하려면 대상 테이블에 대한 `INSERT` 권한이 있어야 합니다. 권한이 없다면 [GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) 명령으로 부여할 수 있습니다.

### 적재 작업 생성 {#create-an-import-job}

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

**2단계: 원본 테이블에 데이터 적재(INSERT INTO VALUES 사용 예)**

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

**3단계: 원본 테이블과 스키마가 같은 대상 테이블 생성**

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

**5단계: 적재 결과 확인**

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
- 데이터 소스로 [TVF](../../../lakehouse/file-analysis.md)나 [Catalog](../../../lakehouse/catalog-overview)의 테이블을 사용할 수 있습니다.

### 적재 작업 조회 {#view-import-jobs}

`SHOW LOAD` 명령으로 완료된 INSERT INTO 작업을 조회합니다.

```sql
MySQL> SHOW LOAD FROM testdb;
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| JobId  | Label                                   | State    | Progress           | Type   | EtlInfo | TaskInfo                                                             | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL  | JobDetails                                                                                                            | TransactionId | ErrorTablets | User | Comment |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
| 376416 | label_3e52da787aab4222_9126d2fce8f6d1e5 | FINISHED | Unknown id: 376416 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:17 | 2024-02-27 01:22:18 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9081          | {}           | root |         |
| 376664 | label_9c2bae970023407d_b2c5b78b368e78a7 | FINISHED | Unknown id: 376664 | INSERT | NULL    | cluster:N/A; timeout(s):26200; max_filter_ratio:0.0; priority:NORMAL | NULL     | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:37 | 2024-02-27 01:39:38 |      | {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0} | 9084          | {}           | root |         |
+--------+-----------------------------------------+----------+--------------------+--------+---------+----------------------------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+------+-----------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
```

### 적재 작업 취소 {#cancel-an-import-job}

실행 중인 INSERT INTO 작업은 `Ctrl-C`로 취소할 수 있습니다.

## 참고 {#reference}

### 적재 명령 {#import-command}

INSERT INTO SELECT는 쿼리 결과를 대상 테이블에 저장합니다. 기본 구문은 다음과 같습니다.

```sql
INSERT INTO target_table SELECT ... FROM source_table;
```

SELECT 문은 일반 쿼리와 같으며 `WHERE`, `JOIN` 등의 연산을 포함할 수 있습니다.

### 데이터 적재 설정 매개변수 {#import-configuration-parameters}

<!-- Knowledge type: Configuration parameters -->

**FE 설정 매개변수**

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400(4시간) | 적재 작업의 제한 시간입니다. 단위는 초입니다. 이 시간 안에 작업이 완료되지 않으면 시스템이 작업을 취소하고 상태가 `CANCELLED`로 바뀝니다. |

**세션 변수**

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| insert_timeout | 14400(4시간) | SQL 문으로 실행되는 INSERT INTO의 제한 시간입니다. 단위는 초입니다. |
| enable_insert_strict | true | true로 설정하면 형식에 맞지 않는 데이터가 하나라도 있을 때 적재가 실패합니다. false로 설정하면 형식에 맞지 않는 행을 무시하며, 적어도 한 행이 올바르게 적재되면 적재가 성공한 것으로 간주합니다. 버전 2.1.4 이하에서는 INSERT INTO의 오류 비율을 제어할 수 없으며, 이 매개변수로 엄격한 검사를 적용하거나 오류 데이터를 모두 무시하는 것만 가능합니다. 형식에 맞지 않는 데이터의 일반적인 원인으로는 원본 열의 길이가 대상 열의 길이를 초과하는 경우, 열 유형 불일치, 파티션 불일치, 열 순서 불일치가 있습니다. |
| insert_max_filter_ratio | 1.0 | 버전 2.1.5부터 지원하며 `enable_insert_strict = false`일 때만 적용됩니다. Doris 테이블, 외부 테이블, S3·HDFS·LOCAL 등의 파일 TVF에서 데이터를 읽는 쿼리를 포함해 `INSERT INTO ... VALUES`와 `INSERT INTO ... SELECT`에서 필터링할 수 있는 행의 최대 비율을 제어합니다. 값의 범위는 0부터 1까지이며 기본값은 1.0입니다. `filtered_rows / (loaded_rows + filtered_rows)`가 설정값을 초과하면 INSERT가 실패합니다. 값이 1.0이면 모든 행을 필터링할 수 있지만, 다른 실행 오류까지 무시하지는 않습니다. |

### 적재 결과 반환값 {#import-return-values}

INSERT INTO는 SQL 문이며, 반환값은 쿼리 결과에 따라 다음 세 가지 경우로 나뉩니다.

#### 빈 결과 집합 {#empty-result-set}

SELECT 절의 결과 집합이 비어 있으면 다음과 같이 반환됩니다.

```sql
mysql> INSERT INTO tbl1 SELECT * FROM empty_tbl;
Query OK, 0 rows affected (0.02 sec)
```

- `Query OK`는 실행이 성공했음을 뜻합니다.
- `0 rows affected`는 적재된 데이터가 없음을 뜻합니다.

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

필드의 의미는 다음과 같습니다.

- `Query OK`: 실행에 성공했습니다.
- `4 rows affected`: 총 4개 행이 적재되었습니다.
- `2 warnings`: 필터링된 행의 수입니다.

다음과 같은 JSON 문자열도 반환됩니다.

```Plain
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

반환값의 필드는 다음과 같습니다.

| 매개변수 | 설명 |
| -------- | ---- |
| TxnId    | 적재 트랜잭션의 ID입니다. |
| Label    | 적재 작업의 레이블입니다. `INSERT INTO tbl WITH LABEL label ...`로 지정할 수 있습니다. |
| Status   | 적재된 데이터가 표시되는지 나타냅니다.<p>- `visible`: 적재에 성공했으며 데이터를 볼 수 있습니다.</p><p>- `committed`: 적재가 완료되었습니다. 데이터를 볼 수 있게 되기까지 다소 시간이 걸릴 수 있으며 재시도할 필요는 없습니다.</p><p>- `Label Already Exists`: 레이블이 중복되었습니다. 다른 레이블을 사용해야 합니다.</p><p>- `Fail`: 적재에 실패했습니다.</p> |
| Err      | 적재 오류 메시지입니다. |

필터링된 행을 확인하려면 [SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD) 문을 사용하세요.

```sql
SHOW LOAD WHERE label="xxx";
```

반환값의 `URL` 필드를 사용해 오류 데이터를 조회할 수 있습니다. 아래의 [오류 행 확인](#view-error-rows)을 참조하세요.

`committed` 상태는 일시적이며, 데이터는 결국 표시됩니다. [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION) 문으로 데이터가 표시되는지 확인할 수 있습니다.

```sql
SHOW TRANSACTION WHERE id=4005;
```

반환값의 `TransactionStatus` 열이 `visible`이면 데이터를 볼 수 있습니다.

```sql
{'label':'my_label1', 'status':'visible', 'txnId':'4005'}
{'label':'INSERT_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
{'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
```

#### 결과 집합이 비어 있지 않고 INSERT가 실패한 경우 {#non-empty-result-set-with-failed-insert}

실패했다면 성공적으로 적재된 데이터는 없습니다. 다음과 같이 반환됩니다.

```sql
mysql> INSERT INTO tbl1 SELECT * FROM tbl2 WHERE k1 = "a";
ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=_shard_2/error_loginsert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0bf8a2
```

- `ERROR 1064 (HY000): all partitions have no load data`: 실패 원인입니다.
- 반환된 URL을 사용해 오류 데이터를 조회할 수 있습니다. 아래의 [오류 행 확인](#view-error-rows)을 참조하세요.

## 권장 사항 {#best-practices}

### 대용량 데이터 적재 {#importing-large-volumes-of-data}

INSERT INTO는 데이터 양에 제한이 없으며 대용량 데이터 적재를 지원합니다. 다만 데이터 양이 많다면 다음 조건을 충족하도록 제한 시간을 조정해야 합니다.

> 적재 제한 시간 >= 데이터 양 / 예상 적재 속도

다음 두 매개변수를 조정할 수 있습니다.

1. FE 설정 매개변수 `insert_load_default_timeout_second`.
2. 세션 변수 `insert_timeout`.

### 오류 행 확인 {#view-error-rows}

<!-- Knowledge type: Troubleshooting -->

INSERT INTO 반환값에 `url` 필드가 있으면 다음 명령으로 오류 행을 확인할 수 있습니다.

```sql
SHOW LOAD WARNINGS ON "url";
```

예:

```sql
SHOW LOAD WARNINGS ON "http://ip:port/api/_load_error_log?file=_shard_13/error_loginsert_stmt_d2cac0a0a16d482d-9041c949a4b71605_d2cac0a0a16d482d_9041c949a4b71605";
```

**일반적인 오류 원인:**

- 원본 열의 길이가 대상 열의 길이를 초과합니다.
- 열 유형이 일치하지 않습니다.
- 파티션이 일치하지 않습니다.
- 열 순서가 일치하지 않습니다.

세션 변수 `enable_insert_strict`로 INSERT INTO가 오류 행을 무시할지 제어할 수 있습니다.

## Multi-Catalog를 통한 외부 테이블 데이터 적재 {#importing-external-table-data-via-multi-catalog}

<!-- Applicable scenarios: External data source integration -->

Doris는 Multi-Catalog 기능을 통해 Apache Hive, Apache Iceberg, Apache Hudi, Apache Paimon (Incubating), Elasticsearch, MySQL, Oracle, SQL Server 등의 주요 데이터 레이크 및 데이터베이스에 연결할 수 있습니다. 외부 테이블을 만든 뒤 `INSERT INTO SELECT`로 해당 테이블의 데이터를 적재하거나 `SELECT`로 직접 쿼리할 수 있습니다.

Multi-Catalog에 대한 자세한 내용은 레이크하우스 문서를 참조하세요. 다음은 Hive 외부 테이블을 사용한 적재 과정의 예입니다.

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

테이블 생성에 관한 자세한 설명은 [CREATE-TABLE](../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) 구문 참고 문서를 참조하세요.

### 3단계: 데이터 적재 실행 {#step-3-execute-the-import}

`hive.db1.source_tbl` 테이블의 데이터를 `target_tbl` 테이블에 적재합니다.

```sql
INSERT INTO target_tbl SELECT k1,k2,k3 FROM  hive.db1.source_tbl limit 100;
```

INSERT는 동기식 명령입니다. 성공 응답이 반환되면 적재에 성공한 것입니다.

### 참고 사항 {#notes}

- 외부 데이터 소스와 Doris 클러스터 사이, 특히 BE 노드와 외부 데이터 소스 사이에 네트워크 연결이 가능해야 합니다.

## TVF를 통한 파일 데이터 적재 {#importing-file-data-via-tvf}

<!-- Applicable scenarios: Direct import of files from object storage / HDFS -->

Doris는 Table Value Function(TVF)을 통해 객체 스토리지 또는 HDFS의 파일을 테이블처럼 직접 쿼리하고 분석할 수 있으며, 열 유형 자동 추론과 여러 파일의 데이터 적재를 지원합니다. 자세한 내용은 [레이크하우스 / TVF 문서](../../../lakehouse/file-analysis)를 참조하세요.

TVF는 파일 경로에서 와일드카드(`*`, `?`, `[...]`)와 범위 패턴(`{1..10}`)을 지원합니다. 전체 구문은 [파일 경로 패턴](../../../sql-manual/basic-element/file-path-pattern)을 참조하세요.

### 파일 열 유형 자동 추론 {#automatic-file-column-type-inference}

S3 TVF를 예로 들면, 먼저 `DESC FUNCTION`으로 파일 스키마를 확인합니다.

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

- 이 예제에는 파일 경로, 연결 정보, 인증 정보가 지정되어 있습니다.
- `DESC FUNCTION`으로 파일 스키마를 확인할 수 있습니다.
- Parquet 파일의 경우 Doris가 파일 메타데이터에서 열 유형을 자동으로 추론합니다.
- Doris는 현재 Parquet, ORC, CSV, JSON 형식의 분석과 열 유형 추론을 지원합니다.

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

### 참고 사항 {#notes-1}

- `S3 / hdfs` TVF에 지정한 URI와 일치하는 파일이 없거나 일치하는 파일이 모두 비어 있으면 TVF는 빈 결과 집합을 반환합니다. 이때 `DESC FUNCTION`으로 스키마를 확인하면 `__dummy_col`이라는 가상 열 하나가 반환되며, 이 열은 무시해도 됩니다.
- TVF 형식을 CSV로 지정했을 때 `The first line is empty, can not parse column numbers` 오류가 발생한다면 파일의 첫 줄에서 스키마를 파악할 수 없기 때문입니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: INSERT INTO는 동기식인가요, 비동기식인가요?**

INSERT INTO는 기본적으로 **동기식**이며 실행 직후 결과를 반환합니다. 비동기식으로 실행하려면 [JOB](../../../admin-manual/workload-management/job-scheduler)과 함께 사용할 수 있습니다.

**Q2: INSERT INTO가 실패하면 데이터가 일부라도 기록되나요?**

아니요. INSERT INTO는 **원자성**을 보장하므로 전체 작업이 성공하거나 전체 작업이 실패합니다.

**Q3: 데이터 적재 시간이 초과되면 어떻게 하나요?**

다음 두 매개변수를 조정해 `Import timeout >= Data volume / Estimated import speed` 조건을 충족하세요.

- FE 설정: `insert_load_default_timeout_second`
- 세션 변수: `insert_timeout`

**Q4: 오류 데이터의 허용 범위를 어떻게 제어하나요?**

- `enable_insert_strict = true`: 형식에 맞지 않는 데이터가 하나라도 있으면 즉시 실패합니다.
- `enable_insert_strict = false`: 형식에 맞지 않는 행을 무시합니다(버전 2.1.4 이하).
- 버전 2.1.5부터는 `insert_max_filter_ratio`로 오류 허용 비율을 제어할 수 있습니다. 이 매개변수는 `enable_insert_strict = false`일 때만 적용됩니다. Doris 테이블, 외부 테이블, 파일 TVF를 포함해 `INSERT INTO ... VALUES`와 `INSERT INTO ... SELECT` 모두에 적용됩니다.

**Q5: 상태가 `visible`이 아니라 `committed`로 반환되면 어떻게 하나요?**

`committed`는 적재가 완료되었고 데이터가 결국 표시된다는 뜻이므로 재시도할 필요가 없습니다. [SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION)으로 `TransactionStatus`가 `visible`로 바뀌었는지 확인할 수 있습니다.

## 추가 도움말 {#more-help}

INSERT INTO의 자세한 구문은 [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) 명령 참고 문서를 참조하세요. MySQL 클라이언트 명령줄에서 `HELP INSERT`를 입력해 추가 도움말을 볼 수도 있습니다.
