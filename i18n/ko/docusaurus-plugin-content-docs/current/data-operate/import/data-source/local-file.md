---
{
    "title": "로컬 파일",
    "language": "ko",
    "description": "Apache Doris 로컬 파일 데이터 적재 가이드: Stream Load, Streamloader 또는 MySQL Load를 사용하여 로컬 CSV, JSON, Parquet, ORC 파일을 Doris에 적재하는 방법을 안내합니다.",
    "keywords": [
        "Doris 로컬 파일 데이터 적재",
        "Stream Load",
        "Streamloader",
        "MySQL Load",
        "LOAD DATA LOCAL INFILE",
        "CSV 데이터 적재",
        "로컬 데이터 적재"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Import local files or client-side local data into Apache Doris -->

이 문서에서는 로컬 파일의 데이터를 Apache Doris에 적재하는 방법을 설명합니다. Doris는 세 가지 로컬 파일 데이터 적재 방식을 제공하며, 데이터 크기, 파일 수, 클라이언트 환경에 따라 적절한 방식을 선택할 수 있습니다.

## 데이터 적재 방식 선택 {#choosing-a-method}

다음 표는 세 가지 로컬 데이터 적재 방식의 특징과 적합한 사용 사례를 비교하여 빠르게 선택할 수 있도록 안내합니다.

| 데이터 적재 방식 | 프로토콜/기반 기술 | 동기/비동기 | 지원 형식 | 대표적인 사용 사례 | 참고 문서 |
|---------|----------|----------|---------|---------|---------|
| **Stream Load** | HTTP | 동기 | CSV, JSON, Parquet, ORC | 단일 파일, 스크립트를 통한 데이터 적재 | [Stream Load](../import-way/stream-load-manual.md) |
| **Streamloader** | Stream Load 기반 | 동기 | CSV, JSON, Parquet, ORC | 여러 파일, 대용량 데이터의 동시 적재 | [Streamloader](../../../connection-integration/data-integration/doris-streamloader) |
| **MySQL Load** | MySQL 프로토콜 | 동기 | CSV | MySQL 클라이언트를 통한 로컬 CSV 파일 데이터 적재 | [MySQL Load](../import-way/mysql-load-manual.md) |

각 방식에 대한 간략한 설명은 다음과 같습니다.

- **Stream Load**: HTTP를 통해 로컬 파일이나 데이터 스트림을 Doris에 적재합니다. 실행 직후 데이터 적재 결과가 반환되므로 반환값으로 성공 여부를 확인할 수 있습니다.
- **Streamloader**: Stream Load를 기반으로 구축된 Doris 공식 클라이언트 도구입니다. 여러 파일과 여러 동시 작업을 통한 데이터 적재를 지원하여 대용량 데이터 적재에 필요한 시간을 크게 줄일 수 있습니다.
- **MySQL Load**: 표준 MySQL [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 구문과 호환되며, 주로 MySQL 클라이언트를 통해 로컬 CSV 파일을 적재하는 데 사용됩니다.

## Stream Load를 사용한 데이터 적재 {#import-using-stream-load}

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

다음 내용으로 CSV 파일 `streamload_example.csv`를 생성합니다.

```SQL
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-a-table-in-the-database}

다음 구문을 사용하여 Doris에 대상 테이블을 생성합니다.

```SQL
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: Stream Load를 사용한 데이터 적재 {#step-3-import-data-using-stream-load}

`curl`을 사용하여 Stream Load 데이터 적재 작업을 제출합니다.

```Bash
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```

Stream Load는 동기식 데이터 적재 방식이며, 데이터 적재 결과가 사용자에게 직접 반환됩니다.

```SQL
{
    "TxnId": 3,
    "Label": "123",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 118,
    "LoadTimeMs": 173,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 70,
    "ReadDataTimeMs": 2,
    "WriteDataTimeMs": 48,
    "CommitAndPublishTimeMs": 52
}
```

### 4단계: 적재된 데이터 확인 {#step-4-check-the-imported-data}

```SQL
select count(*) from testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## Streamloader 도구를 사용한 데이터 적재 {#import-using-the-streamloader-tool}

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

다음 내용으로 CSV 파일 `streamloader_example.csv`를 생성합니다.

```SQL
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-a-table-in-the-database-1}

다음 구문을 사용하여 Doris에 대상 테이블을 생성합니다.

```SQL
CREATE TABLE testdb.test_streamloader(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

### 3단계: Streamloader 도구를 사용한 데이터 적재 {#step-3-import-data-using-the-streamloader-tool}

```Bash
doris-streamloader --source_file="streamloader_example.csv" --url="http://localhost:8330" --header="column_separator:," --db="testdb" --table="test_streamloader"
```

이 방식은 동기식 데이터 적재 방식이며, 데이터 적재 결과가 사용자에게 직접 반환됩니다.

```SQL
Load Result: {
        "Status": "Success",
        "TotalRows": 10,
        "FailLoadRows": 0,
        "LoadedRows": 10,
        "FilteredRows": 0,
        "UnselectedRows": 0,
        "LoadBytes": 118,
        "LoadTimeMs": 623,
        "LoadFiles": [
                "streamloader_example.csv"
        ]
}
```

### 4단계: 적재된 데이터 확인 {#step-4-check-the-imported-data-1}

```SQL
select count(*) from testdb.test_streamloader;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```

## MySQL Load를 사용한 로컬 데이터 적재 {#import-local-data-using-mysql-load}

### 1단계: 데이터 준비 {#step-1-prepare-the-data-2}

다음 예제 데이터로 `client_local.csv`라는 파일을 생성합니다.

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-a-table-in-the-database-2}

`LOAD DATA` 명령을 실행하기 전에 먼저 MySQL 클라이언트로 접속합니다.

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```

MySQL Load를 올바르게 실행하려면 접속 시 다음 옵션을 사용해야 합니다.

1. MySQL 클라이언트로 접속할 때는 `--local-infile` 옵션을 추가해야 합니다. 그렇지 않으면 오류가 발생할 수 있습니다.
2. JDBC로 접속할 때는 URL에 `allowLoadLocalInfile=true`를 지정합니다.

그런 다음 Doris에 대상 테이블을 생성합니다.

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```

### 3단계: MySQL Load를 사용한 데이터 적재 {#step-3-import-data-using-mysql-load}

MySQL 클라이언트로 접속한 후 다음 명령으로 데이터 적재 작업을 생성합니다.

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```

### 4단계: 적재된 데이터 확인 {#step-4-check-the-imported-data-2}

MySQL Load는 동기식 데이터 적재 방식입니다. 데이터 적재가 끝나면 명령줄에서 사용자에게 결과가 반환됩니다. 데이터 적재에 실패하면 구체적인 오류 메시지가 표시됩니다.

다음은 데이터 적재에 성공했을 때의 결과로, 적재된 행 수를 반환합니다.

```SQL
Query OK, 6 rows affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```

## 자주 묻는 질문(FAQ) {#frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting failures of local file imports -->

**Q1: 세 가지 데이터 적재 방식 중 어떤 것을 선택해야 하나요?**

- 단일 파일을 적재하거나 스크립트를 사용하는 경우: Stream Load를 선택합니다.
- 여러 파일로 구성된 대용량 데이터를 동시에 적재하여 속도를 높이려는 경우: Streamloader를 선택합니다.
- 기존 MySQL 클라이언트 환경에서 로컬 CSV 파일을 적재해야 하는 경우: MySQL Load를 선택합니다.

**Q2: MySQL Load 실행 시 `The used command is not allowed with this MySQL version` 오류가 발생합니다.**

다음 두 가지 사항을 확인합니다.

1. MySQL 명령줄로 접속할 때 `--local-infile` 옵션을 추가했는지 확인합니다.
2. JDBC로 접속할 때 URL에 `allowLoadLocalInfile=true`를 추가했는지 확인합니다.

**Q3: Stream Load는 어떤 데이터 형식을 지원하나요?**

CSV, JSON, Parquet, ORC의 네 가지 형식을 지원합니다. HTTP 헤더를 통해 `format` 매개변수를 지정할 수 있습니다.

**Q4: Stream Load 데이터 적재의 성공 여부는 어떻게 확인하나요?**

반환된 결과의 `Status` 필드를 확인합니다. 값이 `Success`이면 성공한 것입니다. `NumberLoadedRows`와 `NumberFilteredRows` 필드를 확인하여 적재된 행 수와 필터링된 행 수도 확인할 수 있습니다.
