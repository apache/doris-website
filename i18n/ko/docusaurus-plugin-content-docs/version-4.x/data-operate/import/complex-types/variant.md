---
{
    "title": "VARIANT",
    "language": "ko",
    "description": "Doris VARIANT 컬럼에 CSV 및 JSON 데이터를 적재하려면 어떻게 해야 할까요? 테이블 생성, Stream Load 명령 실행, 타입 추론 검증까지 전체 절차를 제공합니다.",
    "keywords": [
        "Doris VARIANT 데이터 적재",
        "VARIANT에 CSV 데이터 적재",
        "VARIANT에 JSON 데이터 적재",
        "반정형 데이터",
        "Stream Load를 통한 JSON 데이터 적재",
        "Storage Format V3",
        "describe_extend_variant_column",
        "VARIANT 타입 추론"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Semi-structured data load / VARIANT table initialization -->

이 문서는 CSV 또는 JSON 데이터를 Doris의 `VARIANT` 컬럼에 적재하는 방법을 설명하며, 테이블 생성부터 데이터 적재와 결과 검증까지 전체 과정을 다룹니다.

## 대상 독자 및 사전 참고 문서 {#target-audience-and-prerequisite-reading}

이 문서를 읽기 전에 목적에 맞는 참고 문서를 선택하세요:

| 목적 | 권장 문서 |
| --- | --- |
| CSV / JSON 데이터 적재를 빠르게 완료하기 | 이 문서를 계속 읽으세요 |
| 기본 모드, Sparse, DOC mode 또는 Schema Template 중에서 선택하기 | [VARIANT 사용 및 구성 가이드](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide) |
| VARIANT 쿼리 구문, 인덱스, 제한 사항 또는 구성 참조 정보 확인하기 | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT) |

## 제한 사항 {#limitations}

- 현재 `VARIANT` 컬럼에 적재할 수 있는 데이터 형식은 **CSV**와 **JSON**뿐입니다.

## 스토리지 형식 권장 사항(V3) {#storage-format-recommendation-v3}

<!-- Knowledge type: Architecture selection decision -->

새로 생성하는 `VARIANT` 테이블에는 다른 형식을 사용해야 할 명확한 이유가 없다면 **Storage Format V3**를 바로 사용하세요. 특히 필드가 많은 JSON을 다루는 경우에 권장합니다. 설계 배경은 [Storage Format V3](../../../table-design/storage-format)를 참조하세요.

테이블을 생성할 때 `PROPERTIES`를 통해 명시적으로 활성화하세요:

```sql
CREATE TABLE table_v3 (
    id BIGINT,
    data VARIANT
)
DISTRIBUTED BY HASH(id) BUCKETS 32
PROPERTIES (
    "storage_format" = "V3"
);
```

## CSV 형식 데이터 적재 {#loading-csv-format}

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

다음 내용으로 `test_variant.csv`라는 CSV 파일을 생성하세요:

```SQL
14186154924|PushEvent|{"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}|{"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}|{"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}|1|2020-11-14 02:00:00
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database}

다음 SQL 문을 실행하여 테이블을 생성하세요:

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10
properties("replication_num" = "1");
```

### 3단계: 데이터 적재 {#step-3-load-the-data}

Stream Load를 예로 들면, 다음 명령으로 데이터를 적재할 수 있습니다:

```SQL
curl --location-trusted -u root:  -T test_variant.csv -H "column_separator:|" http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

데이터 적재에 성공했을 때의 응답 예시:

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### 4단계: 적재된 데이터 검증 {#step-4-verify-the-loaded-data}

다음 SQL 쿼리를 사용하여 데이터가 기록되었는지 확인하세요:

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

## JSON 형식 데이터 적재 {#loading-json-format}

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

다음 내용으로 `test_variant.json`이라는 JSON 파일을 생성하세요:

```SQL
{"id": "14186154924","type": "PushEvent","actor": {"id": 282080,"login":"brianchandotcom","display_login": "brianchandotcom","gravatar_id": "","url": "https://api.github.com/users/brianchandotcom","avatar_url": "https://avatars.githubusercontent.com/u/282080?"},"repo": {"id": 1920851,"name": "brianchandotcom/liferay-portal","url": "https://api.github.com/repos/brianchandotcom/liferay-portal"},"payload": {"push_id": 6027092734,"size": 4,"distinct_size": 4,"ref": "refs/heads/master","head": "91edd3c8c98c214155191feb852831ec535580ba","before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits": [""]},"public": true,"created_at": "2020-11-13T18:00:00Z"}
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database-1}

다음 SQL 문을 실행하여 테이블을 생성하세요:

```SQL
CREATE TABLE IF NOT EXISTS testdb.test_variant (
    id BIGINT NOT NULL,
    type VARCHAR(30) NULL,
    actor VARIANT NULL,
    repo VARIANT NULL,
    payload VARIANT NULL,
    public BOOLEAN NULL,
    created_at DATETIME NULL,
    INDEX idx_payload (`payload`) USING INVERTED PROPERTIES("parser" = "english") COMMENT 'inverted index for payload'
)
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

### 3단계: 데이터 적재 {#step-3-load-the-data-1}

Stream Load를 예로 들면, 다음 명령으로 데이터를 적재할 수 있습니다:

```SQL
curl --location-trusted -u root:  -T test_variant.json -H "format:json"  http://127.0.0.1:8030/api/testdb/test_variant/_stream_load
```

데이터 적재에 성공했을 때의 응답 예시:

```SQL
{
    "TxnId": 12,
    "Label": "96cd6250-9c78-4a9f-b8b3-2b7cef0dd606",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 660,
    "LoadTimeMs": 213,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 6,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 183,
    "ReceiveDataTimeMs": 14,
    "CommitAndPublishTimeMs": 20
}
```

### 4단계: 적재된 데이터 검증 {#step-4-verify-the-loaded-data-1}

다음 SQL 쿼리를 사용하여 데이터가 기록되었는지 확인하세요:

```SQL
mysql> select * from testdb.test_variant\G
*************************** 1. row ***************************
        id: 14186154924
      type: PushEvent
     actor: {"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}
      repo: {"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}
   payload: {"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}
    public: 1
created_at: 2020-11-14 02:00:00
```

### 5단계: 타입 추론 검증 {#step-5-verify-type-inference}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: VARIANT subcolumn type confirmation / schema exploration -->

기본적으로 `DESC`는 최상위 VARIANT 컬럼만 표시하며, 내부 하위 컬럼은 펼쳐서 표시하지 않습니다:

``` sql
mysql> desc test_variant;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| public                                                     | BOOLEAN    | Yes  | false | NULL    | NONE  |
+------------------------------------------------------------+------------+------+-------+---------+-------+
6 rows in set (0.07 sec)
```

`describe_extend_variant_column`을 활성화하면 VARIANT 컬럼에서 추론된 하위 컬럼의 타입을 확인할 수 있습니다:

``` sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.01 sec)

mysql> desc test_variant;
+------------------------------------------------------------+------------+------+-------+---------+-------+
| Field                                                      | Type       | Null | Key   | Default | Extra |
+------------------------------------------------------------+------------+------+-------+---------+-------+
| id                                                         | BIGINT     | No   | true  | NULL    |       |
| type                                                       | VARCHAR(*) | Yes  | false | NULL    | NONE  |
| actor                                                      | VARIANT    | Yes  | false | NULL    | NONE  |
| actor.avatar_url                                           | TEXT       | Yes  | false | NULL    | NONE  |
| actor.display_login                                        | TEXT       | Yes  | false | NULL    | NONE  |
| actor.id                                                   | INT        | Yes  | false | NULL    | NONE  |
| actor.login                                                | TEXT       | Yes  | false | NULL    | NONE  |
| actor.url                                                  | TEXT       | Yes  | false | NULL    | NONE  |
| created_at                                                 | DATETIME   | Yes  | false | NULL    | NONE  |
| payload                                                    | VARIANT    | Yes  | false | NULL    | NONE  |
| payload.action                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.before                                             | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.author_association                         | TEXT       | Yes  | false | NULL    | NONE  |
| payload.comment.body                                       | TEXT       | Yes  | false | NULL    | NONE  |
....
+------------------------------------------------------------+------------+------+-------+---------+-------+
406 rows in set (0.07 sec)
```

파티션별로 추론 결과를 표시할 수도 있습니다:

``` sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## 자주 묻는 질문 {#faq}

### Q1: VARIANT는 어떤 데이터 형식의 적재를 지원하나요? {#q1-which-data-formats-does-variant-support-for-loading}

현재 `VARIANT` 컬럼에는 **CSV**와 **JSON** 형식의 데이터만 적재할 수 있습니다. 다른 형식은 적재하기 전에 변환해야 합니다.

### Q2: Storage Format V3는 언제 필요한가요? {#q2-when-is-storage-format-v3-required}

새로 생성하는 `VARIANT` 테이블에는 V3 스토리지 형식을 바로 사용하세요. 특히 필드가 많은 JSON을 다루는 경우에 권장합니다. 이전 스토리지 형식은 사용해야 할 명확한 이유가 없다면 권장하지 않습니다.

### Q3: `DESC`에 VARIANT에서 추론된 하위 컬럼이 표시되지 않는 이유는 무엇인가요? {#q3-why-does-desc-not-show-the-subcolumns-inferred-from-variant}

기본적으로 `DESC`는 최상위 VARIANT 컬럼만 표시합니다. 먼저 다음 명령을 실행하세요:

```sql
SET describe_extend_variant_column = true;
```

그런 다음 `DESC`를 다시 실행하면 추론된 모든 하위 컬럼과 해당 타입이 표시됩니다. 또한 `DESCRIBE ${table_name} PARTITION ($partition_name)`을 사용하여 파티션별로 확인할 수 있습니다.

### Q4: CSV와 JSON 데이터 적재 방식의 테이블 생성 문은 어떻게 다른가요? {#q4-how-do-the-table-creation-statements-differ-between-the-csv-and-json-loading-methods}

테이블 생성 문은 기본적으로 동일합니다. 유일한 차이점은 CSV 예시에서 `"replication_num" = "1"`을 명시적으로 선언한다는 점입니다. 데이터 적재 시에는 Stream Load 명령이 다릅니다:

| 형식 | 주요 헤더 |
| --- | --- |
| CSV | `-H "column_separator:|"` |
| JSON | `-H "format:json"` |

### Q5: Stream Load의 성공 여부는 어떻게 확인하나요? {#q5-how-do-you-confirm-whether-a-stream-load-succeeded}

반환된 JSON의 `Status` 필드를 확인하세요:

- `Status` 값이 `Success`이면 데이터 적재에 성공한 것입니다.
- `NumberLoadedRows`는 `NumberTotalRows`와 같아야 하며, `NumberFilteredRows`는 `0`이어야 합니다.
