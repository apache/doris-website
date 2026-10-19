---
{
    "title": "VARIANT",
    "language": "ko",
    "description": "Doris VARIANT 컬럼에 CSV 및 JSON 데이터를 적재하는 방법을 설명합니다. 테이블 생성, Stream Load 명령어 실행, 타입 추론 검증까지 전체 단계를 안내합니다.",
    "keywords": [
        "Doris VARIANT 데이터 적재",
        "CSV를 VARIANT에 데이터 적재",
        "JSON을 VARIANT에 데이터 적재",
        "반정형 데이터",
        "Stream Load JSON",
        "Storage Format V3",
        "describe_extend_variant_column",
        "VARIANT 타입 추론"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Semi-structured data load / VARIANT table initialization -->

이 문서는 Doris `VARIANT` 컬럼에 CSV 또는 JSON 데이터를 적재하는 방법을 설명하며, 테이블 생성부터 데이터 적재와 결과 확인까지 전체 과정을 다룹니다.

## 대상 독자 및 사전 참고 문서 {#target-audience-and-prerequisite-reading}

이 문서를 읽기 전에 필요에 가장 잘 맞는 참고 문서를 선택하세요.

| 필요한 작업 | 권장 문서 |
| --- | --- |
| CSV / JSON 데이터 적재를 빠르게 완료하기 | 이 문서를 계속 읽으세요 |
| 기본 모드, Sparse, DOC 모드, Schema Template 중 선택하기 | [VARIANT 사용 및 구성 가이드](../../../sql-manual/basic-element/sql-data-types/semi-structured/variant-workload-guide.md) |
| VARIANT 쿼리 구문, 인덱스, 제한 사항 또는 구성 참조 확인하기 | [VARIANT](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md) |

## 제한 사항 {#limitations}

- 아래 예제에서는 **CSV** 및 **JSON** 파일을 적재합니다. 데이터 적재 작업에서는 `VARIANT` 컬럼에 적재되는 모든 문자열 필드를 JSON으로 파싱하므로, Parquet의 `STRING` 컬럼처럼 원본 컬럼이 문자열이면 다른 형식에서도 동일하게 동작합니다. Arrow 형식은 `VARIANT` 컬럼 적재를 지원하지 않습니다.

## 적재된 값의 처리 방식 {#how-loaded-values-are-handled}

- **`NOT NULL` 컬럼:** VARIANT 값이 SQL `NULL`인 행은 필터링됩니다. 여기에는 파싱 실패로 SQL `NULL`이 된 값도 포함됩니다. 필터링된 행은 `max_filter_ratio`(기본값 `0`)에 포함되므로, 기본적으로 데이터 적재 작업이 실패합니다.
- **INSERT의 차이점:** `INSERT`는 문자열을 파싱하지 않습니다. `INSERT INTO t VALUES (1, '{"a": 1}')`는 VARIANT 문자열 `{"a": 1}`을 저장하며, `INSERT INTO ... SELECT`로 `s3()`, `hdfs()` 또는 `local()`에서 데이터를 가져올 때도 동일하게 동작합니다. 객체를 저장하려면 `PARSE_TO_VARIANT`를 사용하세요.

저장되는 값은 정규화됩니다. 배열 외부에서는 값이 `null`, `{}` 또는 `[]`인 객체 멤버가 제거됩니다. 쿼리에서 동일한 값을 계산하면 모든 멤버가 유지됩니다.

```sql
CREATE TABLE variant_norm (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_norm VALUES (1, PARSE_TO_VARIANT('{"a": null, "b": {}, "c": [], "d": 1}'));

SELECT PARSE_TO_VARIANT('{"a": null, "b": {}, "c": [], "d": 1}') AS computed;
SELECT v AS stored, v['a'] IS NULL AS a_is_null FROM variant_norm;
```

```text
+--------------------------------+
| computed                       |
+--------------------------------+
| {"a":null,"b":{},"c":[],"d":1} |
+--------------------------------+

+---------+-----------+
| stored  | a_is_null |
+---------+-----------+
| {"d":1} |         1 |
+---------+-----------+
```

파싱 오류와 그 밖의 정규화 규칙은 [파싱 오류](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#parse-errors) 및 [스토리지에 유지되는 내용](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#what-storage-keeps)을 참조하세요.

## 스토리지 형식 권장 사항(V3) {#storage-format-recommendation-v3}

<!-- Knowledge type: Architecture selection decision -->

새로 생성하는 `VARIANT` 테이블에는 다른 형식을 사용해야 할 명확한 이유가 없다면 **Storage Format V3**를 바로 사용하세요. 특히 필드가 많은 JSON을 다루는 경우에 권장합니다. 설계 배경은 [Storage Format V3](../../../table-design/storage-format.md)를 참조하세요.

테이블을 생성할 때 `PROPERTIES`로 명시적으로 활성화하세요.

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

다음 내용으로 `test_variant.csv`라는 CSV 파일을 생성하세요.

```SQL
14186154924|PushEvent|{"avatar_url":"https://avatars.githubusercontent.com/u/282080?","display_login":"brianchandotcom","gravatar_id":"","id":282080,"login":"brianchandotcom","url":"https://api.github.com/users/brianchandotcom"}|{"id":1920851,"name":"brianchandotcom/liferay-portal","url":"https://api.github.com/repos/brianchandotcom/liferay-portal"}|{"before":"abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits":[""],"distinct_size":4,"head":"91edd3c8c98c214155191feb852831ec535580ba","push_id":6027092734,"ref":"refs/heads/master","size":4}|1|2020-11-14 02:00:00
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database}

다음 SQL 문을 실행하여 테이블을 생성하세요.

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

Stream Load를 예로 들면, 다음 명령어로 데이터를 적재합니다.

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

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-loaded-data}

다음 SQL 쿼리로 데이터가 저장되었는지 확인하세요.

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

다음 내용으로 `test_variant.json`이라는 JSON 파일을 생성하세요.

```SQL
{"id": "14186154924","type": "PushEvent","actor": {"id": 282080,"login":"brianchandotcom","display_login": "brianchandotcom","gravatar_id": "","url": "https://api.github.com/users/brianchandotcom","avatar_url": "https://avatars.githubusercontent.com/u/282080?"},"repo": {"id": 1920851,"name": "brianchandotcom/liferay-portal","url": "https://api.github.com/repos/brianchandotcom/liferay-portal"},"payload": {"push_id": 6027092734,"size": 4,"distinct_size": 4,"ref": "refs/heads/master","head": "91edd3c8c98c214155191feb852831ec535580ba","before": "abb58cc0db673a0bd5190000d2ff9c53bb51d04d","commits": [""]},"public": true,"created_at": "2020-11-13T18:00:00Z"}
```

### 2단계: 데이터베이스에 테이블 생성 {#step-2-create-the-table-in-the-database-1}

다음 SQL 문을 실행하여 테이블을 생성하세요.

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

Stream Load를 예로 들면, 다음 명령어로 데이터를 적재합니다.

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

### 4단계: 적재된 데이터 확인 {#step-4-verify-the-loaded-data-1}

다음 SQL 쿼리로 데이터가 저장되었는지 확인하세요.

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

### 5단계: 타입 추론 확인 {#step-5-verify-type-inference}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: VARIANT subcolumn type confirmation / schema exploration -->

기본적으로 `DESC`는 최상위 VARIANT 컬럼만 표시하고 내부 하위 컬럼은 펼쳐서 표시하지 않습니다.

```sql
mysql> desc test_variant;
+------------+---------------------------+------+-------+---------+-------+
| Field      | Type                      | Null | Key   | Default | Extra |
+------------+---------------------------+------+-------+---------+-------+
| id         | bigint                    | No   | true  | NULL    |       |
| type       | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor      | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo       | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload    | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public     | boolean                   | Yes  | false | NULL    | NONE  |
| created_at | datetime                  | Yes  | false | NULL    | NONE  |
+------------+---------------------------+------+-------+---------+-------+
7 rows in set
```

컬럼 속성을 나열하는 VARIANT 타입 문자열은 여기에서 `variant<PROPERTIES (...)>`로 줄여 표시했습니다.

`describe_extend_variant_column`을 활성화하면 VARIANT 컬럼에서 추론된 하위 컬럼의 타입을 확인할 수 있습니다.

```sql
mysql> set describe_extend_variant_column = true;
Query OK, 0 rows affected (0.00 sec)

mysql> desc test_variant;
+-----------------------+---------------------------+------+-------+---------+-------+
| Field                 | Type                      | Null | Key   | Default | Extra |
+-----------------------+---------------------------+------+-------+---------+-------+
| id                    | bigint                    | No   | true  | NULL    |       |
| type                  | varchar(30)               | Yes  | false | NULL    | NONE  |
| actor                 | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| repo                  | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| payload               | variant<PROPERTIES (...)> | Yes  | false | NULL    | NONE  |
| public                | boolean                   | Yes  | false | NULL    | NONE  |
| created_at            | datetime                  | Yes  | false | NULL    | NONE  |
| actor.avatar_url      | text                      | Yes  | false | NULL    | NONE  |
| actor.display_login   | text                      | Yes  | false | NULL    | NONE  |
| actor.gravatar_id     | text                      | Yes  | false | NULL    | NONE  |
| actor.id              | bigint                    | Yes  | false | NULL    | NONE  |
| actor.login           | text                      | Yes  | false | NULL    | NONE  |
| actor.url             | text                      | Yes  | false | NULL    | NONE  |
| payload.before        | text                      | Yes  | false | NULL    | NONE  |
| payload.commits       | array<text>               | Yes  | false | NULL    | NONE  |
| payload.distinct_size | bigint                    | Yes  | false | NULL    | NONE  |
| payload.head          | text                      | Yes  | false | NULL    | NONE  |
| payload.push_id       | bigint                    | Yes  | false | NULL    | NONE  |
| payload.ref           | text                      | Yes  | false | NULL    | NONE  |
| payload.size          | bigint                    | Yes  | false | NULL    | NONE  |
| repo.id               | bigint                    | Yes  | false | NULL    | NONE  |
| repo.name             | text                      | Yes  | false | NULL    | NONE  |
| repo.url              | text                      | Yes  | false | NULL    | NONE  |
+-----------------------+---------------------------+------+-------+---------+-------+
23 rows in set
```

파티션별로 추론 결과를 표시할 수도 있습니다.

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

## 자주 묻는 질문 {#faq}

### Q1: VARIANT는 어떤 데이터 형식의 적재를 지원하나요? {#q1-which-data-formats-does-variant-support-for-loading}

데이터 적재 작업에서는 파일 형식에 관계없이 `VARIANT` 컬럼에 적재되는 모든 문자열 필드를 JSON으로 파싱합니다. 이 문서의 예제에서는 **CSV** 및 **JSON**을 사용합니다. `INSERT`를 사용할 때는 테이블 함수에서 데이터를 가져오는 `INSERT INTO ... SELECT`를 포함하여 문자열 값을 `PARSE_TO_VARIANT`로 감싸세요.

### Q2: Storage Format V3는 언제 필요한가요? {#q2-when-is-storage-format-v3-required}

새로 생성하는 `VARIANT` 테이블에는 V3 스토리지 형식을 바로 사용하세요. 특히 필드가 많은 JSON을 다루는 경우에 권장합니다. 이전 스토리지 형식을 사용해야 할 명확한 이유가 없다면 해당 형식은 권장하지 않습니다.

### Q3: `DESC`에 VARIANT에서 추론된 하위 컬럼이 표시되지 않는 이유는 무엇인가요? {#q3-why-does-desc-not-show-the-subcolumns-inferred-from-variant}

기본적으로 `DESC`는 최상위 VARIANT 컬럼만 표시합니다. 먼저 다음 명령을 실행하세요.

```sql
SET describe_extend_variant_column = true;
```

그런 다음 `DESC`를 다시 실행하면 추론된 모든 하위 컬럼과 해당 타입이 표시됩니다. `DESCRIBE ${table_name} PARTITION ($partition_name)`으로 파티션별로 확인할 수도 있습니다.

### Q4: CSV와 JSON 데이터 적재 방식의 테이블 생성 문은 어떻게 다른가요? {#q4-how-do-the-table-creation-statements-differ-between-the-csv-and-json-loading-methods}

테이블 생성 문은 기본적으로 동일합니다. 유일한 차이점은 CSV 예제에서 `"replication_num" = "1"`을 명시적으로 선언한다는 점입니다. 데이터 적재 방식의 차이는 Stream Load 명령어에 있습니다.

| 형식 | 주요 헤더 |
| --- | --- |
| CSV | `-H "column_separator:\|"` |
| JSON | `-H "format:json"` |

### Q5: Stream Load의 성공 여부는 어떻게 확인하나요? {#q5-how-do-you-confirm-whether-a-stream-load-succeeded}

반환된 JSON의 `Status` 필드를 확인하세요.

- `Status`가 `Success`이면 데이터 적재에 성공한 것입니다.
- `NumberLoadedRows`는 `NumberTotalRows`와 같아야 하며, `NumberFilteredRows`는 `0`이어야 합니다.

### Q6: `INSERT`가 JSON 텍스트를 문자열로 저장하는 이유는 무엇인가요? {#q6-why-does-insert-store-my-json-text-as-a-string}

`INSERT`는 `CAST(string AS VARIANT)`로 문자열을 VARIANT로 변환하며, 이때 문자열을 파싱하지 않고 그대로 유지합니다. Stream Load와 같은 데이터 적재 작업은 JSON 텍스트를 파싱합니다. `INSERT`를 사용할 때는 텍스트를 `PARSE_TO_VARIANT`로 감싸세요.

```sql
INSERT INTO testdb.test_variant (id, actor)
VALUES (1, PARSE_TO_VARIANT('{"id": 282080, "login": "brianchandotcom"}'));
```
