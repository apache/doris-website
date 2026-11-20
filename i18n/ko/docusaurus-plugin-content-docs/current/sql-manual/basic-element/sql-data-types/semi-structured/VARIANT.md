---
{
    "title": "VARIANT",
    "language": "ko",
    "description": "VARIANT는 반정형 JSON 데이터를 저장합니다. 쓰기 및 파싱 규칙, CAST, NULL 의미 체계, 정렬, Schema Template, ALTER, 속성, 인덱스, 제한 사항을 다룹니다."
}
---

## 개요 {#overview}

VARIANT 타입은 객체, 배열, 문자열, 숫자, 불리언, `null`을 포함하는 반정형 JSON 데이터를 저장합니다. 데이터를 쓸 때 Doris는 각 JSON 경로의 타입을 추론하고 자주 사용되는 경로에 Subcolumnization을 수행해 독립적인 열 기반 하위 열로 저장합니다. 해당 경로를 조회하는 쿼리는 필요한 하위 열만 읽습니다.

:::tip VARIANT를 사용하는 이유
문서 구조는 시간이 지나면서 바뀌지만 쿼리가 소수의 자주 사용되는 경로에 집중된다면 `VARIANT`가 적합합니다.

- 자주 사용되는 경로는 Subcolumnization의 대상이므로 열 기반 처리 성능, 파일 가지치기, 벡터화 실행의 이점을 얻습니다.
- 주요 경로에는 경로별 인덱스와 전문 검색을 사용할 수 있으며, Doris의 희소 인덱스 가지치기 이점도 누릴 수 있습니다.
- 넓은 열을 위한 최적화 덕분에 하위 열이 10k개 규모여도 자동 Subcolumnization을 실용적으로 사용할 수 있습니다. Subcolumnization 대상 경로가 10,000개에 가까워지면 하드웨어 요구 사항이 빠르게 높아지므로, 일반적으로 DOC mode를 먼저 선택하는 편이 안전합니다.

기본 동작, 희소 열, DOC mode, Schema Template 중 무엇을 선택할지 결정해야 한다면 [VARIANT 워크로드 가이드](./variant-workload-guide.md)부터 읽어 보세요. 이 페이지는 쓰기와 파싱, 타입 규칙, CAST, NULL 및 비교 의미 체계, ALTER, 인덱스, 제한 사항, 설정에 관한 참조 문서입니다.
:::

:::info 버전
이 페이지는 Doris 5.0.0 이상에서의 VARIANT를 설명합니다. 기존 SQL에 영향을 줄 가능성이 큰 Doris 4.x와의 차이점은 다음과 같습니다.

- `INSERT`는 문자열을 JSON으로 파싱하는 대신 VARIANT 문자열로 저장합니다. `s3()` 및 `hdfs()` 같은 테이블 함수에서 가져오는 `INSERT INTO ... SELECT`에도 적용됩니다. `INSERT`로 JSON 텍스트를 쓰려면 `PARSE_TO_VARIANT`를 사용하세요. Stream Load 같은 데이터 적재 작업은 계속 JSON을 파싱합니다.
- 전체 VARIANT 값에 `GROUP BY`, `DISTINCT`, 집합 연산을 사용할 수 있습니다. 두 VARIANT 값을 `=`, `!=`, `<=>`로 비교할 수 있고, 조인 키, `ORDER BY` 키, 윈도 키로 사용할 수 있습니다.
- `VARIANT_TYPE`은 경로와 타입의 매핑 대신 `object` 같은 단일 타입 이름을 반환합니다.
- VARIANT 배열은 1부터 시작하는 정수 인덱스로 접근할 수 있습니다.

Doris 4.x에 대해서는 이 페이지의 4.x 버전을 참조하세요.
:::

## 빠른 시작 {#quick-start}

```sql
CREATE TABLE events (
    id BIGINT,
    v  VARIANT
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

-- INSERT keeps a string literal as a VARIANT string, so parse JSON text explicitly.
INSERT INTO events VALUES
    (1, PARSE_TO_VARIANT('{"user": {"id": 42, "name": "alice"}, "tags": ["doris", "sql"], "score": 9.5}')),
    (2, PARSE_TO_VARIANT('{"user": {"id": 7, "name": "bob"}, "score": 3}'));

SELECT id,
       CAST(v['user']['name'] AS STRING) AS name,
       v['tags'][1] AS first_tag
FROM events
WHERE CAST(v['score'] AS DOUBLE) > 5;
```

```text
+------+-------+-----------+
| id   | name  | first_tag |
+------+-------+-----------+
|    1 | alice | doris     |
+------+-------+-----------+
```

- `v['user']['name']`과 `v['tags'][1]`은 `VARIANT` 값을 반환합니다. 배열 인덱스는 1부터 시작합니다.
- 경로의 값을 비교하거나 계산하기 전에 구체적인 타입으로 CAST하세요.
- Stream Load 같은 데이터 적재 작업은 JSON 텍스트를 자동으로 파싱합니다. [데이터 쓰기](#write-data)를 참조하세요.

## VARIANT 열 정의 {#define-a-variant-column}

```sql
column_name VARIANT
column_name VARIANT< field_definition [, field_definition ...] >
column_name VARIANT< properties('key' = 'value' [, ...]) >
column_name VARIANT< field_definition [, ...], properties('key' = 'value' [, ...]) >

field_definition:
    [MATCH_NAME | MATCH_NAME_GLOB] 'path_or_pattern' : data_type [COMMENT 'comment']
```

- `field_definition` 목록은 [Schema Template](#schema-template)입니다. 선택한 경로의 저장 타입을 고정합니다.
- `properties(...)`는 열 수준의 저장 속성을 설정합니다. [열 속성](#column-properties)을 참조하세요.
- VARIANT 열은 `NULL` 또는 `NOT NULL`일 수 있습니다. 허용되는 기본값은 `NULL`뿐입니다.
- 최상위 VARIANT 열 이름에는 점(`.`)을 넣을 수 없습니다. 백틱으로 감싸도 마찬가지입니다. 예를 들어 `` `v.x` VARIANT ``는 유효하지 않습니다. 이 제한은 `CREATE TABLE`과 `ALTER TABLE`에 적용되며 VARIANT 값 안의 JSON 필드 이름에는 적용되지 않습니다.

```sql
CREATE TABLE IF NOT EXISTS example_tbl (
    k BIGINT,
    v VARIANT<
        'id' : INT,             -- path id is stored as INT
        'message*' : STRING,    -- paths matching message* are stored as STRING
        'tags*' : ARRAY<TEXT>,  -- paths matching tags* are stored as ARRAY<TEXT>
        properties('variant_max_subcolumns_count' = '2048')
    > NULL
)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

테이블에서 VARIANT 열을 사용할 수 있는 위치는 다음과 같습니다.

| 용도 | 지원 여부 | 비고 |
| --- | --- | --- |
| Duplicate Key, Unique Key, Aggregate Key 테이블의 값 열 | 지원 | Aggregate Key 테이블에서는 집계 타입이 `REPLACE` 또는 `REPLACE_IF_NOT_NULL`이어야 합니다. |
| 키 열, 파티션 열, 버킷 열 | 미지원 | |
| 테이블 스키마에서 다른 타입 안에 중첩 (`ARRAY<VARIANT>`, `MAP`, `STRUCT`) | 미지원 | `COLLECT_LIST(v)`의 결과처럼 쿼리 결과는 여전히 `ARRAY<VARIANT>`일 수 있습니다. |
| 기본값 | `NULL`만 허용 | `DEFAULT '{}'` 및 기타 NULL이 아닌 기본값은 거부됩니다. |

## 데이터 쓰기 {#write-data}

`INSERT`와 `CAST`는 문자열을 VARIANT 문자열로 유지합니다. `PARSE_TO_VARIANT`, `TRY_PARSE_TO_VARIANT`, Stream Load 같은 데이터 적재 작업은 JSON 텍스트를 파싱합니다. 데이터 적재 예시는 [VARIANT 데이터 적재](../../../../data-operate/import/complex-types/variant.md)를 참조하세요.

### 파싱 오류 {#parse-errors}

[PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/parse-to-variant.md), [TRY_PARSE_TO_VARIANT](../../../sql-functions/scalar-functions/variant-functions/try-parse-to-variant.md), 데이터 적재 작업은 같은 JSON 파서를 사용합니다. 데이터 적재 작업은 `TRY_PARSE_TO_VARIANT`와 같은 방식으로 오류를 처리합니다.

| 입력 | `PARSE_TO_VARIANT` | `TRY_PARSE_TO_VARIANT` 및 데이터 적재 작업 |
| --- | --- | --- |
| 유효한 JSON | 파싱된 값 | 파싱된 값 |
| `hello` 또는 `{"id":`처럼 유효한 JSON이 아닌 텍스트 | VARIANT 문자열로 유지 | VARIANT 문자열로 유지 |
| `{"a": 1, "n": 100000000000000000000}`처럼 [-2^63, 2^64 - 1] 범위를 벗어나는 정수나 `DOUBLE` 범위를 벗어나는 숫자가 포함된 JSON | 전체 텍스트가 VARIANT 문자열로 유지되므로 `v['a']`는 `NULL`을 반환 | 전체 텍스트가 VARIANT 문자열로 유지 |
| 빈 문자열 | 빈 객체 `{}` | 빈 객체 `{}` |
| 128단계보다 깊은 중첩 | 오류 | SQL `NULL` |
| `variant_max_json_key_length`바이트보다 긴 객체 키 (BE 설정, 기본값 255) | 오류 | SQL `NULL` |
| 한 객체 안의 중복 키 | 오류 | SQL `NULL` |
| 유효한 UTF-8이 아닌 문자열 | 오류 | SQL `NULL` |

JSON 파서 자체가 거부할 정도로 깊게 중첩된 문서(약 1,000단계)는 유효하지 않은 JSON이므로 문자열로 유지됩니다.

다음 두 BE 설정은 이 규칙을 변경합니다.

- `variant_throw_exeception_on_invalid_json`(기본값 `false`): `true`이면 범위를 벗어나는 숫자가 포함된 JSON을 비롯해 파서가 거부하는 텍스트는 VARIANT 문자열이 되지 않습니다. `PARSE_TO_VARIANT`에서는 오류가 발생하고 `TRY_PARSE_TO_VARIANT`와 데이터 적재 작업에서는 SQL `NULL`이 됩니다.
- `variant_enable_duplicate_json_path_check`(기본값 `false`): `true`이면 객체에서 중복된 키가 오류를 일으키는 대신 첫 번째 값을 유지합니다. 점이 포함된 키가 중첩 경로와 중복될 때도 쓰기 작업이 실패하지 않으며, 두 값 중 하나만 저장됩니다.

범위를 벗어나는 정수가 포함된 문서를 구조화된 상태로 유지하려면 JSON을 거쳐 변환하세요: `CAST(CAST(text AS JSON) AS VARIANT)`. 최대 38자리 정수는 정확한 숫자로 유지되고, 그보다 크지만 `LARGEINT` 범위 안에 있는 정수는 문자열이 되며, 더 큰 정수는 `DOUBLE`이 됩니다. `PARSE_TO_VARIANT(CAST(text AS JSON))`는 JSON 텍스트를 다시 파싱하므로 도움이 되지 않습니다.

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"id": 1}')) AS valid_json,    -- object
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS invalid_json,  -- string
       VARIANT_TYPE(CAST('{"id": 1}' AS VARIANT))  AS string_cast;   -- string
```

### 저장 시 유지되는 값 {#what-storage-keeps}

값을 테이블에 쓰면 정규화됩니다. 따라서 다시 읽은 값은 쓰기 전에 계산된 값과 다를 수 있습니다.

| 쓰기 전 | 테이블에서 다시 읽은 값 |
| --- | --- |
| `{"a": null, "b": 1}`처럼 값이 JSON `null`인 객체 멤버 | 멤버가 제거되어 `{"b":1}`이 됩니다. `v['a']`는 SQL `NULL`을 반환합니다. |
| `{"a": {}, "b": [], "c": {"d": null}}`처럼 값이 빈 객체나 배열이거나, 이 규칙에 따라 빈 객체가 되는 객체 멤버 | 제거되어 `{}`이 됩니다. |
| `{"p": [null, null], "q": 1}`처럼 배열에 `null`만 들어 있는 객체 멤버 | 제거되어 `{"q":1}`이 될 수 있습니다. |
| `{"arr": [{"a": null}, {}, [], null]}`처럼 배열 안에 있는 값 | 그대로 유지됩니다. `v['arr'][1]['a']`는 VARIANT `null`입니다. |
| `PARSE_TO_VARIANT('null')` 같은 루트 JSON `null` | 빈 객체 `{}` |
| 루트의 빈 배열 `[]` 또는 빈 객체 `{}` | 유지됩니다. |
| `CAST(date_col AS VARIANT)`처럼 루트 값에 있는 `DATE` 및 `DATETIME` 값이나, 다른 타입의 값도 들어 있는 경로의 날짜 값 | 텍스트로 저장되어 다시 읽으면 문자열이 됩니다. 날짜만 들어 있는 객체 경로에서는 타입이 유지됩니다. |
| 같은 경로에 섞여 있는 불리언과 숫자 | 같은 쓰기 작업 안에서 값이 나오는 순서와 컴팩션에 따라 불리언이 `1` 또는 `0`으로 다시 읽힐 수 있습니다. |
| `{"a.b": 1}`처럼 점이 포함된 키 | 중첩 경로 `{"a":{"b":1}}`로 저장됩니다. `v['a.b']`와 `v['a']['b']`가 모두 `1`을 반환합니다. 문서에 `a.b`라는 키와 `a` 안의 `b`라는 키가 둘 다 있으면 `variant_enable_duplicate_json_path_check`가 `true`가 아닌 한 전체 INSERT 또는 데이터 적재 작업이 실패합니다. |
| 객체 키 | 바이트 순서로 반환됩니다. |

이 규칙은 함께 쓰인 다른 행과 DOC mode의 영향을 받으므로, 저장 후에도 `null` 값이나 빈 컨테이너가 유지된다고 가정하지 마세요. Schema Template에 선언한 경로는 대신 선언된 타입으로 변환됩니다. [Schema Template](#schema-template)을 참조하세요.

## 타입 추론과 타입 충돌 {#type-inference-and-type-conflicts}

Schema Template이 없으면 Doris는 JSON을 파싱할 때 각 값의 타입을 추론합니다. `VARIANT_TYPE`은 이 타입을 반환합니다.

| JSON 값 | 타입 |
| --- | --- |
| `BIGINT` 범위 안의 정수 | 값을 담을 수 있는 가장 작은 타입인 `tinyint`, `smallint`, `int`, `bigint` 중 하나 |
| `BIGINT` 범위를 초과하고 18446744073709551615 이하인 정수 | `decimal` |
| 소수 부분이나 지수가 있는 숫자 | `double` |
| [-2^63, 2^64 - 1] 범위를 벗어나는 정수 또는 `DOUBLE` 범위를 벗어나는 숫자 | 숫자로 처리되지 않습니다. 전체 텍스트가 유효하지 않은 JSON입니다([파싱 오류](#parse-errors) 참조). |
| 문자열 | `string` |
| `true`, `false` | `bool` |
| `null` | `null` |
| 배열, 객체 | `array`, `object` |

데이터가 저장될 때 각 경로에는 하나의 저장 타입이 지정됩니다.

- 정수는 `BIGINT`로 저장하고 필요한 값은 `LARGEINT`로 저장합니다. 부동 소수점 숫자는 `DOUBLE`, 십진수는 `DECIMAL`, 문자열은 `STRING`, 불리언은 `BOOLEAN`, 스칼라 배열은 `ARRAY<T>`로 저장합니다.
- 객체 배열, 중첩 배열, 값의 타입이 다른 경로(예: 정수와 부동 소수점 숫자, 숫자와 문자열, 스칼라와 배열)는 `JSONB`로 저장합니다(`DESC`에는 `json`으로 표시). 요소 타입이 충돌하는 배열은 `ARRAY<JSONB>`가 됩니다.

```sql
{"a" : 12345678}
{"a" : "HelloWorld"}
-- a is stored as JSONB
```

`JSONB` 경로는 모든 값을 유지하지만 타입이 지정된 저장 방식의 이점을 잃습니다. 인덱스와 타입 기반 가지치기는 해당 경로에 더 이상 적용되지 않습니다. 불리언은 예외입니다. 경로의 첫 값이 불리언이고 뒤의 값이 숫자이면 경로가 숫자로 저장되고 불리언이 `1` 또는 `0`으로 다시 읽힐 수 있습니다. 경로의 타입이 안정적이어야 한다면 Schema Template에 선언하세요.

`VARIANT_TYPE`은 각 값의 타입을 보고하므로 `BIGINT` 경로에서 읽은 정수가 여전히 `tinyint`일 수 있습니다. 각 경로의 저장 타입을 확인하려면 `SET describe_extend_variant_column = true;`를 실행한 다음 `DESC table_name;`을 실행하세요. [하위 열과 타입 확인](#inspect-subcolumns-and-types)을 참조하세요.

## 경로 접근과 출력 {#access-paths-and-output}

- `v['key']`와 `v['a']['b']`는 객체 멤버를 읽습니다. `v['arr'][1]`은 배열 요소를 읽습니다. 인덱스는 1부터 시작하며 `-1`은 마지막 요소입니다. [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md)도 같은 동작을 합니다.
- 결과는 `VARIANT` 값입니다. 없는 키, 인덱스 `0`, 범위를 벗어난 인덱스, 배열에 사용한 문자열 키, 객체에 사용한 정수 인덱스, 스칼라 값에 사용한 키는 모두 SQL `NULL`을 반환합니다.
- 계산된 값에서 점이 포함된 키는 하나의 키입니다. `v['a.b']`는 `a.b` 키를 읽고, `v['a']['b']`는 `a` 안의 `b`를 읽습니다. 저장할 때는 이 구분이 유지되지 않습니다. [저장 시 유지되는 값](#what-storage-keeps)을 참조하세요.
- 경로는 배열의 각 요소에 자동으로 적용되지 않습니다. `{"a": [{"b": 1}]}`에서 `v['a']['b']`는 `NULL`을 반환합니다. `v['a'][1]['b']`를 사용하세요.

```sql
SELECT v['user']['id']      AS id,       -- 42
       v['tags'][-1]        AS last_tag, -- sql
       v['user']['missing'] AS missing   -- NULL
FROM events
WHERE id = 1;
```

일반적으로 경로를 쿼리에 필요한 타입으로 CAST합니다.

```sql
SELECT * FROM tbl WHERE ARRAY_CONTAINS(CAST(v['tags'] AS ARRAY<TEXT>), 'Doris');
SELECT * FROM tbl WHERE CAST(v['date'] AS DATE) = '2021-01-02';
SELECT * FROM tbl WHERE v['bool'];                -- implicit CAST to BOOLEAN
SELECT * FROM tbl WHERE v['str'] MATCH 'Doris';   -- uses an inverted index on the path
```

전체 VARIANT 값을 읽으면 JSON 텍스트가 반환됩니다. 객체 키는 바이트 순서로 반환되고 공백이 제거되므로 입력과 바이트 단위로 동일하지 않습니다. 루트가 문자열이면 따옴표 없이 반환됩니다.

```sql
CREATE TABLE variant_tbl (k INT, v VARIANT)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO variant_tbl VALUES (1, PARSE_TO_VARIANT('{ "b": 2, "a": 1, "c": { "y": 20, "x": 10 } }'));

SELECT v FROM variant_tbl WHERE k = 1;
-- {"a":1,"b":2,"c":{"x":10,"y":20}}
```

## CAST {#cast}

### VARIANT로 CAST {#cast-to-variant}

| 원본 타입 | 결과 |
| --- | --- |
| `CHAR`, `VARCHAR`, `STRING` | VARIANT 문자열. JSON 텍스트는 파싱하지 않습니다. 문자열이 유효한 UTF-8이 아니면 CAST가 실패합니다. |
| `BOOLEAN` | 불리언. |
| `TINYINT`, `SMALLINT`, `INT`, `BIGINT` | 정수. |
| `LARGEINT` | 십진수. 절댓값이 10^38 - 1을 초과하면 문자열이 됩니다. |
| `FLOAT`, `DOUBLE` | 부동 소수점 숫자. |
| `DECIMALV2`, `DECIMAL(p, s)` (`p <= 38`) | 십진수. |
| `DATE`, `DATETIME(p)`, `TIMESTAMP_NS` | 날짜 또는 시간대가 없는 타임스탬프. |
| `IPV4`, `IPV6` | 값의 텍스트 형식을 담은 문자열. |
| `JSON` / `JSONB` | 동일한 구조. `DECIMAL256` 숫자처럼 VARIANT가 담을 수 없는 값이나 객체의 중복 키가 있으면 CAST가 실패합니다. |
| `ARRAY<T>` | 각 요소를 변환한 배열. `T`는 `VARIANT` 또는 이 표에 있는 타입이어야 합니다. |
| `MAP`, `STRUCT`, `TIME`, `TIMESTAMPTZ`, `VARBINARY` 및 기타 타입 | 지원하지 않으며 문이 실패합니다. |

원본 값은 자체 타입에도 유효해야 합니다. 유효하지 않은 값은 수정되지 않고 거부됩니다. CAST는 문자열을 파싱하지 않습니다. `CAST('{"id": 1}' AS VARIANT)`는 문자열 `{"id": 1}`입니다. JSON 텍스트를 파싱하려면 `PARSE_TO_VARIANT`를 사용하세요.

### VARIANT에서 CAST {#cast-from-variant}

| 대상 타입 | 결과 |
| --- | --- |
| `BOOLEAN` | 불리언은 그대로 유지됩니다. 숫자는 0이 아니면 `true`입니다. 문자열은 `CAST(string AS BOOLEAN)` 규칙에 따라 변환됩니다. |
| `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT` | 정수. 십진수나 부동 소수점 값의 소수 부분은 버립니다(`1.5`는 `1`). 불리언은 `1` 또는 `0`이 됩니다. `"123"` 같은 숫자 문자열도 변환됩니다. |
| `FLOAT`, `DOUBLE`, `DECIMAL(p, s)` | 숫자와 숫자 문자열. `DECIMAL`은 소수 자릿수 `s`에 맞춰 반올림합니다. `FLOAT`에 비해 너무 큰 값은 `Infinity`가 됩니다. |
| `DATE`, `DATETIME(p)`, `TIMESTAMP_NS` | 날짜 및 시간 값, 날짜 또는 시간 형식의 문자열, `20240102` 같은 숫자. |
| `TIMESTAMPTZ(p)` | 날짜 및 시간 값과 날짜 또는 시간 형식의 문자열. |
| `IPV4`, `IPV6` | IP 주소 형식의 문자열. |
| `CHAR`, `VARCHAR`, `STRING` | 루트 문자열은 따옴표 없이 그대로 반환됩니다. 객체와 배열은 JSON 텍스트로 반환됩니다. 다른 스칼라는 동일한 SQL 타입처럼 형식화됩니다. 루트 불리언은 `1` 또는 `0`, `DATETIME` 값은 소수점 이하 6자리, `TIMESTAMP_NS` 값은 소수점 이하 9자리로 표시됩니다. VARIANT `null`은 문자열 `null`이 됩니다. |
| `JSON` / `JSONB` | 동일한 구조. 날짜와 타임스탬프처럼 대응하는 JSON 타입이 없는 값은 JSON 문자열이 됩니다. 시간대가 있는 타임스탬프는 세션 시간대에 따라 형식화됩니다. |
| `ARRAY<T>` | 요소마다 변환한 배열. 변환할 수 없는 요소는 `NULL`이 됩니다. `"[1, 2]"`처럼 JSON 배열을 담은 문자열도 변환됩니다. 다른 값은 `NULL`을 반환합니다. |
| `MAP`, `STRUCT`, `TIME` 및 기타 타입 | 지원하지 않으며 문이 실패합니다. |

대상 타입으로 변환할 수 없는 값은 `enable_strict_cast`가 켜져 있어도 SQL `NULL`을 반환합니다. 단, 숫자에서 `TIMESTAMPTZ`, `IPV4`, `IPV6`로 변환하거나 날짜 또는 타임스탬프에서 `BOOLEAN`으로 변환하는 경우처럼 값의 타입과 대상 타입 사이에 변환 자체가 없으면 문이 실패합니다.

```sql
SELECT CAST(PARSE_TO_VARIANT('"123"') AS INT)      AS from_string,   -- 123
       CAST(PARSE_TO_VARIANT('"abc"') AS INT)      AS not_a_number,  -- NULL
       CAST(PARSE_TO_VARIANT('1.5') AS INT)        AS truncated,     -- 1
       CAST(PARSE_TO_VARIANT('300') AS TINYINT)    AS overflow,      -- NULL
       CAST(PARSE_TO_VARIANT('{"a": 1}') AS INT)   AS from_object,   -- NULL
       CAST(PARSE_TO_VARIANT('[1, "2", null, "x"]') AS ARRAY<INT>) AS arr;  -- [1, 2, null, null]

SELECT CAST(PARSE_TO_VARIANT('true') AS STRING)        AS bool_root,     -- 1
       CAST(PARSE_TO_VARIANT('{"b": true}') AS STRING) AS object_text,   -- {"b":true}
       CAST(PARSE_TO_VARIANT('"abc"') AS STRING)       AS string_root,   -- abc
       CAST(PARSE_TO_VARIANT('null') AS STRING)        AS variant_null;  -- null
```

### Decimal 및 날짜/시간 값 {#decimal-and-datetime-values}

다음 타입을 VARIANT로 변환할 때의 동작은 다음과 같습니다.

| Doris 타입 | 동작 |
| --- | --- |
| 기존 `DECIMALV2` | 정밀도 최대 27, 소수 자릿수 최대 9까지 정확하게 유지됩니다. |
| `DECIMAL(p, s)` | `1 <= p <= 38` 및 `0 <= s <= p`인 값을 정확하게 유지합니다. 정밀도가 38보다 큰 십진수는 지원하지 않습니다. |
| `DATE` | 시간이나 시간대가 없는 달력 날짜. |
| `DATETIME(p)` | `0 <= p <= 6`이며 시간대를 조정하지 않습니다. |
| `TIMESTAMP_NS` | 시간대 조정 없이 나노초 정밀도를 유지합니다. 값은 TIMESTAMP_NS 범위 안에 있어야 합니다. |
| `TIMESTAMPTZ(p)` | CAST와 Schema Template 경로 모두 지원하지 않습니다. |
| `TIME` | 지원하지 않습니다. |

## NULL 의미 체계 {#null-semantics}

VARIANT에는 두 종류의 null이 있습니다.

- **SQL `NULL`**은 값이 없음을 뜻합니다. 열 값이 `NULL`이거나 `v['no_such_key']`처럼 경로가 없거나 CAST가 실패했을 때 발생합니다.
- **VARIANT `null`**은 JSON 리터럴 `null`이라는 값입니다. 예를 들어 `PARSE_TO_VARIANT('null')` 또는 배열의 `null` 요소가 이에 해당합니다. `VARIANT_TYPE`은 이 값에 대해 `null`을 반환합니다.

| 연산 | SQL `NULL` | VARIANT `null` |
| --- | --- | --- |
| `v IS NULL` | `true` | `false` |
| VARIANT인 `x`를 사용하는 `COALESCE(v, x)`, `IFNULL(v, x)` | `x`를 반환 | VARIANT `null`을 반환 |
| `COUNT(v)` | 세지 않음 | 셈 |
| `GROUP BY v`, `DISTINCT` | 모든 SQL `NULL` 값이 한 그룹을 이룸 | 모든 VARIANT `null` 값이 별도의 한 그룹을 이룸 |
| `v = x`, 동등 조인 | 일치하지 않음 | 다른 VARIANT `null`과 일치 |
| `ORDER BY v` | `NULLS FIRST` 또는 `NULLS LAST`에 따라 배치 | 오름차순에서 다른 모든 NULL이 아닌 값보다 앞에 배치 |
| `CAST(v AS STRING)` | SQL `NULL` | 문자열 `null` |

값을 저장한 후에는 배열 밖의 객체에서 `null` 멤버가 제거되므로 이를 읽으면 SQL `NULL`이 반환되고, 루트 `null`은 `{}`로 다시 읽힙니다([저장 시 유지되는 값](#what-storage-keeps) 참조). 따라서 저장된 데이터에 대해 `v['a'] IS NULL`로는 멤버가 없는지, 멤버가 `null`인지 구별할 수 없습니다.

## 비교, 그룹화, 정렬 {#comparison-grouping-and-ordering}

VARIANT 값은 텍스트나 물리적 인코딩이 아닌 논리적 값으로 비교합니다. 동등성, 해싱(`GROUP BY`, `DISTINCT`, 조인), 정렬(`ORDER BY`, 윈도 키)에 같은 규칙을 사용하므로 같은 값은 항상 같은 그룹에 속하고 정렬할 때도 같은 순위를 가집니다.

### 지원되는 연산 {#supported-operations}

| VARIANT 값에 대한 연산 | 지원 여부 | 비고 |
| --- | --- | --- |
| 두 VARIANT 값 사이 또는 `NULL` 리터럴과의 `=`, `!=`, `<=>` | 지원 | `v['a'] = w['a']` 같은 하위 경로도 포함됩니다. |
| 동등 조인, 세미 및 안티 조인, `IN` 및 `NOT IN` 하위 쿼리 | 지원 | VARIANT 조인 키에는 런타임 필터가 생성되지 않습니다. |
| `GROUP BY`, `DISTINCT`, `COUNT(DISTINCT ...)`, `UNION`, `INTERSECT`, `EXCEPT` | 지원 | |
| `ORDER BY`, `ORDER BY ... LIMIT` | 지원 | |
| 윈도의 `PARTITION BY` 및 `ORDER BY` | 지원 | |
| `COUNT(v)`, `COLLECT_LIST(v)`, `ARRAY_AGG(v)` | 지원 | |
| `IF`, `CASE`, `IFNULL`, `COALESCE` | 지원 | VARIANT와 다른 타입을 함께 쓰면 VARIANT 값이 다른 타입으로 변환됩니다(다른 타입이 정수이면 `DECIMAL(38, 9)`). 변환할 수 없는 값은 `NULL`이 됩니다. |
| `CAST(v AS ARRAY<VARIANT>)`, `EXPLODE_VARIANT_ARRAY`, `ARRAY<VARIANT>`에 대한 `EXPLODE` 및 `EXPLODE_OUTER` | 지원 | |
| VARIANT 값 사이의 `<`, `<=`, `>`, `>=`, `BETWEEN` | 미지원 | 먼저 구체적인 타입으로 CAST하세요. |
| `v = 1`처럼 전체 VARIANT 값을 VARIANT가 아닌 값과 비교 | 미지원 | 하위 경로는 암시적으로 변환되므로 `v['a'] = 1`은 작동합니다. |
| `v IN (PARSE_TO_VARIANT('1'))`처럼 VARIANT 값이 포함된 `IN` 목록 | 미지원 | VARIANT가 아닌 값을 사용하는 `v IN ('a', 'b')`는 암시적 변환을 통해 작동합니다. |
| `MIN`, `MAX` | 미지원 | 먼저 하위 경로를 CAST하세요. |
| VARIANT 인수를 사용하는 `ARRAY(...)`, `MAP(...)`, `NAMED_STRUCT(...)` | 미지원 | |

### 동등성 {#equality}

- **숫자.** 정수, 소수 부분이 0인 십진수, 정수 값을 나타내는 부동 소수점 숫자는 같습니다. `1`, `1.0`, `1.00`은 하나의 값입니다. 십진수 끝의 0은 영향을 주지 않으며 `-0.0`은 `0`과 같습니다. 소수 부분이 있는 십진수와 부동 소수점 숫자는 절대 같지 않습니다. `DECIMAL 1.5`는 `DOUBLE 1.5`와 다릅니다. 소수 부분이 있는 JSON 숫자는 `DOUBLE`로 파싱됩니다. 십진수는 CAST, Schema Template 경로, `BIGINT`에 비해 너무 큰 정수에서 나옵니다.
- **종류가 다른 값은 절대 같지 않습니다.** 숫자 `1`, 문자열 `"1"`, `true`는 서로 다른 세 값입니다. `DATE`는 문자열 `"2024-01-01"`과 다르고, 시간대가 없는 타임스탬프는 시간대가 있는 타임스탬프와 다릅니다.
- **문자열**은 바이트가 같을 때만 같습니다. 비교 시 대소문자를 구분합니다.
- **객체**는 키가 같고 각 키에 대응하는 값이 같으면 같습니다. 키 순서는 관계없습니다.
- **배열**은 길이가 같고 같은 위치의 요소가 같으면 같습니다.
- VARIANT `null`은 다른 VARIANT `null`과 같습니다. SQL `NULL`에는 SQL 규칙이 적용됩니다.

```sql
SELECT PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('1.0')                             AS int_double,  -- 1
       PARSE_TO_VARIANT('1.5') = CAST(CAST(1.5 AS DECIMAL(10, 2)) AS VARIANT)       AS dbl_dec,     -- 0
       PARSE_TO_VARIANT('1') = PARSE_TO_VARIANT('"1"')                             AS num_str,     -- 0
       PARSE_TO_VARIANT('{"a": 1, "b": 2}') = PARSE_TO_VARIANT('{"b": 2, "a": 1}') AS obj,         -- 1
       PARSE_TO_VARIANT('[1, 2]') = PARSE_TO_VARIANT('[2, 1]')                     AS arr;         -- 0
```

### 정렬 {#ordering}

VARIANT 값에 대한 `ORDER BY`는 하나의 전순서를 사용합니다. 종류가 다른 값은 먼저 종류에 따라 정렬됩니다.

```text
null < boolean < number < string < binary < date < timestamp with time zone
     < timestamp without time zone < time < UUID < object < array
```

binary, time, UUID 값은 Doris에서 JSON 파싱이나 CAST로 만들 수 없습니다. VARIANT 열이 있는 Parquet 파일처럼 다른 시스템에서 쓴 VARIANT 데이터에서만 가져올 수 있습니다.

같은 종류 안에서는 다음과 같이 정렬됩니다.

- **불리언:** `false`가 `true`보다 앞섭니다.
- **숫자:** 정수(`INT`, `BIGINT` 등), 십진수(`DECIMAL`), 부동 소수점 숫자(`FLOAT`, `DOUBLE`)는 숫자 값으로 정렬합니다. `INT 1`, `FLOAT/DOUBLE 1.0`, `DECIMAL 1.00`은 같고 정렬 위치도 같습니다. 십진수 끝의 0은 영향을 주지 않습니다. 소수 부분이 있는 값의 숫자 크기가 같다면 십진수가 앞섭니다. `DECIMAL 1.5`는 `FLOAT/DOUBLE 1.5`보다 앞서며 VARIANT 값으로는 서로 다릅니다. 부동 소수점 정밀도도 순서에 영향을 줄 수 있습니다. `DOUBLE 0.1`은 `DECIMAL 0.1`보다 약간 큽니다. 음의 무한대가 맨 앞에 오고, 양의 무한대와 NaN이 차례로 맨 뒤에 옵니다.
- **문자열:** UTF-8 바이트 순서로 정렬합니다. 대문자가 소문자보다 앞서고 `"10"`이 `"9"`보다 앞섭니다.
- **날짜와 타임스탬프:** 시간 순서로 정렬합니다. 모든 날짜는 모든 타임스탬프보다 앞섭니다.
- **객체:** 키 순서에 따라 항목별로 비교합니다. 가장 작은 키를 먼저 비교하고, 그 값과 다음 키를 차례로 비교합니다. 한 객체의 항목이 다른 객체 항목의 접두 부분이면 먼저 정렬되므로 `{"a":1}` < `{"a":1,"b":2}` < `{"b":0}`입니다.
- **배열:** 요소별로 비교하며 접두 부분이 먼저 정렬되므로 `[]` < `[null]` < `[1]` < `[1,2]`입니다.

SQL `NULL`은 `NULLS FIRST` 또는 `NULLS LAST`에 따라 배치됩니다.

```sql
SELECT v, VARIANT_TYPE(v) AS type
FROM (
    SELECT PARSE_TO_VARIANT('[1, 2]') AS v UNION ALL
    SELECT PARSE_TO_VARIANT('{"a": 1}')    UNION ALL
    SELECT PARSE_TO_VARIANT('"9"')         UNION ALL
    SELECT PARSE_TO_VARIANT('"10"')        UNION ALL
    SELECT PARSE_TO_VARIANT('10')          UNION ALL
    SELECT PARSE_TO_VARIANT('9.5')         UNION ALL
    SELECT PARSE_TO_VARIANT('true')        UNION ALL
    SELECT PARSE_TO_VARIANT('null')        UNION ALL
    SELECT NULL
) t
ORDER BY v;
```

```text
+---------+---------+
| v       | type    |
+---------+---------+
| NULL    | NULL    |
| null    | null    |
| true    | bool    |
| 9.5     | double  |
| 10      | tinyint |
| 10      | string  |
| 9       | string  |
| {"a":1} | object  |
| [1,2]   | array   |
+---------+---------+
```

### 구체적인 타입으로 비교하기와 VARIANT로 비교하기 {#typed-comparison-and-variant-comparison}

피연산자에 따라 VARIANT 규칙을 사용할지 구체적인 타입의 규칙을 사용할지 결정됩니다. 경로 `a`의 값이 `1`, `1.0`, `"1"`이라고 가정해 보겠습니다.

| 표현식 | 비교에 사용되는 타입 | 결과 |
| --- | --- | --- |
| `v['a'] = 1` | `v['a']`를 암시적으로 CAST한 `DECIMAL(38, 9)` | 세 값 모두 일치 |
| `v['a'] = CAST(1 AS VARIANT)`, `v['a'] = w['a']` | VARIANT | `1`과 `1.0`은 일치하고 `"1"`은 일치하지 않음 |
| `GROUP BY v['a']` | VARIANT | `1`과 `1.0`은 한 그룹, `"1"`은 다른 그룹 |
| `GROUP BY CAST(v['a'] AS STRING)` | `STRING` | `1`이라는 한 그룹 |
| `ORDER BY v['a']` | VARIANT | 숫자가 먼저, 문자열이 나중에 정렬 |
| `ORDER BY CAST(v['a'] AS INT)` | `INT` | 숫자 순서로 정렬하며 변환할 수 없는 값은 `NULL`이 됨 |

### 참고 사항 {#notes}

- **비용.** VARIANT 키는 논리적 값으로 해싱하고 비교합니다. 44백만 행을 대상으로 한 벤치마크에서 VARIANT 키에 대한 `GROUP BY`, 정렬, 조인은 `CAST(v['path'] AS <type>)`에 대한 동일한 연산보다 1.2배에서 3.7배 오래 걸렸습니다. 경로의 타입을 알고 있다면 CAST하세요.
- **결과는 저장된 값을 따릅니다.** [저장 시 유지되는 값](#what-storage-keeps)의 정규화는 비교 전에 일어납니다. `null`이었던 멤버는 없어지고, 루트 값의 `DATE`는 문자열로 비교되며, 같은 경로에서 숫자와 섞인 불리언은 `1` 또는 `0`으로 다시 읽힐 수 있습니다. 타입이 중요한 경로는 Schema Template에 선언하세요.
- **서로 다른 타입은 값이 아닌 종류로 정렬합니다.** 경로에 숫자와 숫자 문자열이 모두 있으면 `ORDER BY v['a']`는 모든 숫자를 모든 문자열보다 앞에 놓고 문자열은 바이트 순서로 정렬합니다. 숫자 순서나 사전식 순서가 필요하면 한 타입으로 CAST하세요.
- **같아 보이는 값도 다를 수 있습니다.** `GROUP BY` 결과에서 숫자 `1`과 문자열 `"1"`은 같은 모습으로 표시되지만 두 그룹을 이룹니다. `VARIANT_TYPE`으로 차이를 확인하세요.
- 종류 간 순서는 결과가 결정적이도록 Doris가 정의합니다. JSON 표준의 일부가 아니며 다른 시스템과 다를 수 있습니다.
- VARIANT 값의 내부 해시는 구현 세부 사항이며, 사용자에게 제공되는 안정적인 체크섬이 아닙니다.

## Schema Template {#schema-template}

Schema Template은 선택한 경로의 저장 타입을 선언합니다. 안정적인 타입이나 경로별 인덱스가 필요한 주요 경로만 선언하면 문서의 나머지 부분은 동적으로 유지됩니다.

```sql
CREATE TABLE test_var_schema (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'large_int_val': LARGEINT,
        'string_val': STRING,
        'decimal_val': DECIMAL(38, 9),
        'datetime_val': DATETIME,
        'ip_val': IPV4
    > NULL
)
PROPERTIES ("replication_num" = "1");
```

템플릿 필드에는 다음 타입을 사용할 수 있습니다.

- 숫자: `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `FLOAT`, `DOUBLE`, `p <= 38`인 `DECIMAL(p, s)`
- `STRING` 또는 `TEXT`
- `BOOLEAN`
- `DATE`, `DATETIME(p)`, `TIMESTAMP_NS`
- `IPV4`, `IPV6`
- `ARRAY<T>`: `T`는 위 타입 중 하나이며 배열은 한 차원만 허용

### 템플릿 경로에 쓰기 {#writing-to-template-paths}

선언된 경로의 각 값은 비엄격 CAST 규칙에 따라 선언된 타입으로 변환됩니다. 변환할 수 없는 값은 `NULL`로 저장되어 다시 읽으면 경로가 없지만, 행의 나머지 부분은 계속 기록됩니다. 변환 과정에서 값이 바뀔 수 있습니다.

```sql
CREATE TABLE tpl_demo (
    k INT,
    v VARIANT<'id': INT, 'price': DECIMAL(10, 2), 'ts': DATETIME(3)>
)
DUPLICATE KEY(k)
DISTRIBUTED BY HASH(k) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO tpl_demo VALUES
    (1, PARSE_TO_VARIANT('{"id": "123", "price": 9.999, "ts": "2024-01-01 10:00:00.123456"}')),
    (2, PARSE_TO_VARIANT('{"id": "abc", "price": "x", "ts": "not a time"}')),
    (3, PARSE_TO_VARIANT('{"id": 1.7}'));

SELECT k, v FROM tpl_demo ORDER BY k;
```

```text
+------+------------------------------------------------------------+
| k    | v                                                          |
+------+------------------------------------------------------------+
|    1 | {"id":123,"price":10.00,"ts":"2024-01-01 10:00:00.123000"} |
|    2 | {}                                                         |
|    3 | {"id":1}                                                   |
+------+------------------------------------------------------------+
```

- `"123"`은 `123`이 되고, `1.7`은 소수 부분을 버려 `1`이 되며, `9.999`는 `10.00`으로 반올림됩니다. 타임스탬프는 선언된 정밀도(밀리초)를 유지하며 텍스트 형식에는 항상 소수점 이하 6자리가 표시됩니다.
- `"abc"`, `"x"`, `"not a time"`은 변환할 수 없으므로 제거됩니다.
- 소수 부분이 있는 JSON 숫자는 변환 전에 `DOUBLE`로 파싱되므로 `DECIMAL` 경로에서 정밀도가 손실될 수 있습니다. 모든 자릿수를 유지하려면 값을 JSON 문자열로 쓰세요([FAQ](#faq) 참조).
- 날짜와 IP 값은 JSON 문자열이어야 합니다. `{"date": 2020-01-01}`과 `{"ip": 127.0.0.1}`은 유효한 JSON이 아닙니다. `{"date": "2020-01-01"}`과 `{"ip": "127.0.0.1"}`로 쓰세요.

:::caution
값의 JSON 타입에서 선언된 타입으로 변환할 수 있을 때만 변환이 이루어집니다. `IPV4` 또는 `IPV6` 경로에 JSON 숫자를 쓰면 전체 쓰기 작업이 실패합니다. 한 번의 쓰기 작업에서 `DATE`, `DATETIME`, `IPV4`, `IPV6` 경로에 JSON 문자열과 숫자가 섞이면 해당 경로의 유효한 값도 제거될 수 있습니다. 이런 경로의 값은 JSON 문자열로 쓰세요.
:::

### 템플릿 경로 읽기 {#reading-template-paths}

선언된 경로에서도 `v['path']`는 `VARIANT` 타입을 유지합니다. Doris는 선언된 타입으로 자동 CAST하지 않습니다. 선언된 타입이 필요하면 명시적으로 CAST하세요. 필터에서도 선언된 타입으로 CAST해야 쿼리가 해당 경로의 존 맵과 인덱스를 사용할 수 있습니다.

```sql
SELECT CAST(v['ts'] AS DATETIME(3)) AS ts,       -- 2024-01-01 10:00:00.123
       CAST(v['ts'] AS STRING)      AS ts_text,  -- 2024-01-01 10:00:00.123000
       VARIANT_TYPE(v['price'])     AS type      -- decimal
FROM tpl_demo
WHERE CAST(v['id'] AS INT) = 123;
```

Schema Template은 값을 저장하는 방식만 결정합니다. 쿼리에서 계산한 동일한 JSON은 파싱된 타입을 유지합니다.

```sql
SELECT VARIANT_TYPE(PARSE_TO_VARIANT('{"price": 9.999}')['price']);  -- double
```

### 패턴 일치 {#pattern-matching}

필드 이름은 기본적으로 glob 패턴(`MATCH_NAME_GLOB`)입니다. `*`는 중첩 키 사이의 `.`을 포함해 임의 길이의 문자열과 일치하고, `?`는 문자 하나와 일치합니다. 예를 들어 `'m*'`는 `m1`과 `m2.x`에 모두 일치합니다. 경로가 여러 필드에 일치하면 정의 순서에서 첫 번째 필드를 사용합니다.

```sql
CREATE TABLE test_var_pattern (
    id BIGINT NOT NULL,
    v1 VARIANT<
        'enumString*' : STRING,
        'enum*' : ARRAY<TEXT>,
        'ip*' : IPV6
    > NULL
)
PROPERTIES ("replication_num" = "1");

-- enumString1 matches both enumString* and enum*; the first one (STRING) is used.
```

`*`가 포함된 이름을 글자 그대로 일치시키려면 `MATCH_NAME`을 사용하세요.

```sql
v1 VARIANT<
    MATCH_NAME 'enumString*' : STRING
> NULL
```

일치한 경로는 기본적으로 Subcolumnization 대상입니다. 일치하는 경로가 너무 많아 하위 열이 과도하게 생성된다면 `variant_enable_typed_paths_to_sparse`를 고려하세요([열 속성](#column-properties) 참조).

열을 만든 뒤에는 Schema Template을 변경할 수 없습니다. [ALTER TABLE](#alter-table)을 참조하세요.

## ALTER TABLE {#alter-table}

`ADD COLUMN`(일괄 추가 포함), `MODIFY COLUMN`, `RENAME COLUMN`에도 점이 없는 최상위 VARIANT 열 이름을 사용해야 합니다. 예를 들어 다음 문은 거부됩니다.

```sql
ALTER TABLE example_tbl ADD COLUMN `v.x` VARIANT;
-- ERROR: Cannot use `VARIANT` type column named with a `.` character: v.x
```

`ALTER TABLE`이 지원하는 작업은 다음과 같습니다.

- Schema Template과 속성의 유무에 관계없이 NULL을 허용하는 VARIANT 열에 대한 `ADD COLUMN`.
- `DROP COLUMN`, `RENAME COLUMN`, `MODIFY COLUMN ... COMMENT '...'`.
- `ADD INDEX`와 `DROP INDEX`. `field_pattern`이 있는 인덱스는 `CREATE TABLE`에서만 정의할 수 있습니다.
- Schema Template이 없는 열에서 `NOT NULL`을 `NULL`로 바꾸거나 `variant_doc_materialization_min_rows`를 변경하는 작업. `MODIFY COLUMN`에는 열 정의 전체를 지정해야 합니다. 생략한 속성은 기본값으로 설정되므로([열 속성](#column-properties) 참조) 기본값과 다른 속성은 모두 다시 지정하세요.

지원하지 않는 작업은 다음과 같습니다.

- `ADD COLUMN ... VARIANT NOT NULL`: `ALTER`로 추가하는 `NOT NULL` 열에는 기본값이 필요하지만 VARIANT는 `DEFAULT NULL`만 허용합니다. `NOT NULL` VARIANT 열은 `CREATE TABLE`에서 정의하세요.
- 기존 열에 Schema Template 추가. Schema Template이 있는 열에서는 `MODIFY COLUMN`으로 주석만 변경할 수 있습니다. 같은 템플릿을 다시 지정하는 경우를 포함해 다른 변경은 모두 실패합니다.
- `variant_doc_materialization_min_rows` 이외의 속성 변경, `NULL`에서 `NOT NULL`로 변경, VARIANT와 다른 타입 사이의 변환.
- VARIANT 열에 대한 `BUILD INDEX`.

이러한 변경이 필요하면 새 정의로 테이블을 만들고 `INSERT INTO ... SELECT`로 데이터를 복사하세요. 원본 열이 `STRING`이면 `PARSE_TO_VARIANT`로 감싸세요.

```sql
ALTER TABLE t ADD COLUMN v2 VARIANT NOT NULL;
-- ERROR: Field 'v2' doesn't have a default value

-- v is a VARIANT column without a Schema Template.
ALTER TABLE t MODIFY COLUMN v VARIANT<'id': INT>;
-- ERROR: Can not change variant schema templates
```

## 열 속성 {#column-properties}

열 속성은 VARIANT 타입 안의 `properties(...)`에서 설정합니다.

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_max_subcolumns_count' = '2048',
          'variant_enable_typed_paths_to_sparse' = 'true',
          'variant_sparse_hash_shard_count' = '64'
      )
  >
);
```

| 속성 | 기본값 | ALTER | 설명 |
| --- | --- | --- | --- |
| `variant_max_subcolumns_count` | `2048` | 아니요 | 한 데이터 파일에서 Subcolumnization을 거치는 동적 경로의 최대 개수입니다. NULL이 아닌 값이 많은 경로를 먼저 선택하고 나머지는 희소 열에 저장합니다. `0`은 제한이 없다는 뜻입니다. 범위는 0부터 100000까지이며 10000 이하로 유지하세요. 기본값은 대부분의 워크로드에 충분합니다. 훨씬 많은 하위 열이 정말 필요하다면 [DOC mode](./variant-workload-guide.md#doc-mode-template)를 우선 고려하세요. |
| `variant_enable_typed_paths_to_sparse` | `false` | 아니요 | 기본적으로 Schema Template 경로는 항상 Subcolumnization을 거치고 `variant_max_subcolumns_count`에 포함되지 않습니다. `true`이면 제한에 포함되며 희소 열에 저장될 수 있습니다. |
| `variant_sparse_hash_shard_count` | `1` | 아니요 | 희소 경로가 해시로 분산되어 저장되는 물리적 희소 열의 수입니다. 범위는 0부터 1024까지이며 `0`은 `1`로 처리됩니다. |
| `variant_max_sparse_column_statistics_size` | `10000` | 아니요 | 한 데이터 파일에서 통계가 기록되는 희소 경로의 최대 개수입니다. 이 수를 넘으면 통계가 없는 경로를 조회할 때 희소 열을 건너뛸 수 없습니다. 범위는 1부터 50000까지입니다. |
| `variant_enable_doc_mode` | `false` | 아니요 | DOC mode를 활성화합니다. `variant_max_subcolumns_count`, `variant_enable_typed_paths_to_sparse`, `variant_max_sparse_column_statistics_size`, `variant_sparse_hash_shard_count`와 함께 설정할 수 없습니다. |
| `variant_doc_materialization_min_rows` | `0` | Schema Template이 없는 경우에만 가능 | DOC mode에서만 사용합니다. 이 값보다 행 수가 적은 쓰기 작업은 문서만 저장하며, 컴팩션이 파일을 임계값까지 병합한 뒤 Subcolumnization을 수행합니다. `0`이면 쓸 때 Subcolumnization을 수행합니다. 범위는 0부터 1000000000까지입니다. |
| `variant_doc_hash_shard_count` | `64` | 아니요 | DOC mode에서만 사용합니다. 저장된 문서를 나누어 담는 열의 수입니다. 범위는 0부터 1024까지이며 `0`은 `1`로 처리됩니다. |

**ALTER** 열은 `ALTER TABLE ... MODIFY COLUMN`으로 해당 속성을 변경할 수 있는지 나타냅니다. [ALTER TABLE](#alter-table)을 참조하세요. 희소 열과 DOC mode 속성의 사용법은 [넓은 열](#wide-columns)을 참조하세요.

### BE 설정 {#be-configuration}

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `variant_max_json_key_length` | `255` | JSON 객체 키의 최대 바이트 길이입니다. 더 긴 키는 파싱 오류를 일으킵니다. 범위는 1부터 65535까지입니다. |
| `variant_throw_exeception_on_invalid_json` | `false` | `false`이면 JSON 파서가 거부한 텍스트를 VARIANT 문자열로 유지합니다. `true`이면 파싱 오류로 처리합니다. |
| `variant_enable_duplicate_json_path_check` | `false` | `false`이면 객체의 중복 키가 파싱 오류를 일으킵니다. `true`이면 첫 번째 값을 유지하고 중복 키는 무시합니다. |

세 설정 모두 실행 중에 변경할 수 있습니다. 파싱 오류가 보고되는 방식은 [파싱 오류](#parse-errors)를 참조하세요.

## VARIANT 인덱스 {#variant-indexes}

### 인덱스 선택 {#choosing-indexes}

VARIANT는 하위 경로에 BloomFilter와 Inverted Index를 지원합니다.
- 카디널리티가 높은 동등 조건/IN 필터에는 BloomFilter가 좋습니다(인덱스가 더 희소하고 쓰기 성능이 좋습니다).
- 토큰화, 구문, 범위 검색에는 Inverted Index를 사용하고 적절한 `parser`/`analyzer` 속성을 설정하세요.

필터가 경로의 저장 타입으로 비교할 때만 인덱스나 BloomFilter를 사용할 수 있습니다. 숫자 경로는 명시적으로 CAST하세요. 문자열 경로를 문자열 리터럴과 비교할 때는 CAST가 필요하지 않습니다.

```sql
...
PROPERTIES("replication_num" = "1", "bloom_filter_columns" = "v");

-- Use BloomFilter for equality/IN filters
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 12345678;
SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) IN (1, 2, 3);
```

VARIANT 열에 역색인을 만들면 모든 하위 경로가 파서 같은 인덱스 속성을 상속합니다.

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser" = "english")
);

-- All subpaths inherit the english parser
SELECT * FROM tbl WHERE v['id_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['id_2'] MATCH 'Apache';
```

### 하위 경로별 인덱스 {#index-by-subpath}

특정 VARIANT 하위 경로에 인덱스 속성을 지정할 수 있으며, 같은 경로에 토큰화 역색인과 토큰화하지 않는 역색인을 모두 설정할 수도 있습니다. 경로별 인덱스를 사용하려면 Schema Template에서 경로 타입을 선언해야 합니다.

```sql
-- Common properties: field_pattern (target path), analyzer, parser, support_phrase, norms, etc.
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'content' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "content"),
    INDEX idx_v(v) USING INVERTED PROPERTIES("field_pattern" = "content")
);

-- v.content has both tokenized and non-tokenized inverted indexes
SELECT * FROM tbl WHERE v['content'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['content'] = 'Doris';
```

와일드카드 경로 인덱싱:

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'pattern_*' : STRING>,
    INDEX idx_tokenized(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "pattern_*"),
    INDEX idx_v(v) USING INVERTED -- global non-tokenized inverted index
);

SELECT * FROM tbl WHERE v['pattern_1'] MATCH 'Doris';
SELECT * FROM tbl WHERE v['pattern_1'] = 'Doris';
```

Doris 4.1.5부터 아래 인덱스 속성이나 BE 설정으로 norms를 비활성화할 수 있습니다.

VARIANT 경로의 토큰화 인덱스는 기본적으로 BM25 norms를 기록합니다. 해당 경로에 값이 없는 행을 포함해 행당 경로마다 1바이트가 듭니다. 필터링에만 사용하는 경로라면 `"norms" = "false"`로 비활성화하세요. `field_pattern`이 없으면 이 속성은 인덱스가 적용되는 모든 하위 경로에 적용됩니다.

```sql
CREATE TABLE IF NOT EXISTS tbl (
    k BIGINT,
    v VARIANT<'body_*' : STRING>,
    INDEX idx_body(v) USING INVERTED PROPERTIES("parser" = "english", "field_pattern" = "body_*", "norms" = "false")
);
```

norms를 비활성화해도 `MATCH` 필터링에는 영향이 없지만 `score()`가 norms가 없는 세그먼트를 읽으면 오류가 발생합니다. BE 설정 `inverted_index_skip_norms_for_variant`는 모든 VARIANT 경로에서 norms를 비활성화합니다. 자세한 내용은 [레코드 길이와 norms 속성](../../../../table-design/index/inverted-index/scoring.md#record-length-and-the-norms-property)을 참조하세요.

### 인덱스가 작동하지 않는 경우 {#when-indexes-dont-work}

1. 타입 변경으로 인덱스 손실: 하위 경로가 호환되지 않는 타입(예: INT → JSONB)으로 변경되면 인덱스가 손실됩니다. Schema Template으로 타입과 인덱스를 고정하세요.
2. 필터가 경로를 저장 타입으로 비교하지 않음:
   ```sql
   -- An implicit numeric comparison is evaluated row by row and uses no index
   SELECT * FROM tbl WHERE v['id'] = 123456;

   -- CAST to the stored type instead
   SELECT * FROM tbl WHERE CAST(v['id'] AS BIGINT) = 123456;
   ```
   `v['id']`가 문자열로 저장되었다면 `v['id'] = '123456'`처럼 문자열과 비교하세요.
3. 인덱스 설정 오류: 인덱스는 전체 VARIANT 열이 아닌 하위 경로에 적용됩니다.
   ```sql
   -- VARIANT itself cannot be indexed as a whole
   SELECT * FROM tbl WHERE v MATCH 'Doris';

   -- If whole-JSON search is needed, store a duplicate STRING column and index it
   CREATE TABLE IF NOT EXISTS tbl (
       k BIGINT,
       v VARIANT,
       v_str STRING,
       INDEX idx_v_str(v_str) USING INVERTED PROPERTIES("parser" = "english")
   );
   SELECT * FROM tbl WHERE v_str MATCH 'Doris';
   ```

## 넓은 열 {#wide-columns}

수집한 데이터에 서로 다른 JSON 키가 많으면 Subcolumnization으로 생성되는 하위 열의 수도 빠르게 늘어납니다. 규모가 커지면 메타데이터가 비대해지고 쓰기 및 병합 비용이 늘어나며 쿼리가 느려질 수 있습니다. VARIANT는 하위 열이 지나치게 많은 ‘넓은 열’을 처리하기 위해 **희소 열**과 **DOC 인코딩**이라는 두 방식을 제공합니다.

워크로드에 맞는 방식을 선택하는 방법은 [VARIANT 워크로드 가이드](./variant-workload-guide.md)를 참조하세요. 이 절에서는 방식과 관련 속성만 설명합니다.

참고: 두 방식은 상호 배타적입니다. DOC 인코딩을 활성화하면 희소 열을 사용할 수 없으며 그 반대도 마찬가지입니다.

### 희소 열 {#sparse-columns}

**동작 방식**

- 시스템은 NULL이 아닌 값의 비율, 즉 희소도에 따라 경로의 우선순위를 정합니다. 사용 빈도가 높은 경로(희소도가 낮은 경로)는 Subcolumnization을 거쳐 독립적인 하위 열에 저장되고, 나머지 사용 빈도가 낮은 경로는 합쳐져 희소 열에 저장됩니다. 추출되는 하위 열의 최대 개수는 `variant_max_subcolumns_count`로 제어합니다.
- Schema Template에 선언된 경로는 기본적으로 희소 열로 옮기지 않습니다. 선언된 타입의 경로도 희소 열로 옮길 수 있게 하려면 `variant_enable_typed_paths_to_sparse`를 설정하세요.
- 희소 열은 샤딩을 지원합니다. 희소 하위 경로를 여러 희소 열에 분산하면 열별 읽기 부담을 줄이고 읽기 효율을 높일 수 있습니다. 물리적으로 저장할 희소 열의 개수는 `variant_sparse_hash_shard_count`로 지정합니다.

**참고 사항**

- 대부분의 키에서 NULL이 아닌 값의 비율이 비슷하면(희소도 차이가 작으면) 실제로 희소한 경로를 식별하기 어려워 희소 열의 이점이 줄어듭니다.
- `variant_max_subcolumns_count`의 기본값인 `2048`은 이미 대부분의 워크로드에 충분합니다. 더 많은 추출 하위 열을 미리 확보하려고 값을 과도하게 높이지 마세요. 대규모 Subcolumnization이 정말 필요하다면 [DOC mode](./variant-workload-guide.md#doc-mode-template)를 우선 고려하세요. 실용적인 상한은 여전히 `10000` 이하가 권장됩니다.
- `variant_sparse_hash_shard_count`는 ‘희소 경로 수 / 128’로 대략 추정할 수 있습니다. 예를 들어 전체 JSON 키가 약 10,000개이고 `variant_max_subcolumns_count = 2000`이면 희소 경로는 약 8000개이므로 `variant_sparse_hash_shard_count`를 `8000/128` 정도에서 시작할 수 있습니다.

### DOC 인코딩(DOC mode) {#doc-encoding-doc-mode}

**동작 방식**

- 경로 기반 쿼리를 위해 경로에 계속 Subcolumnization을 적용할 수 있으며, 전체 JSON 문서를 효율적으로 반환할 수 있도록 원본 JSON도 저장 필드에 추가로 보관합니다.
- DOC 인코딩은 샤딩을 지원합니다. 원본 JSON을 여러 열로 나누어 저장하고 전체 JSON을 조회할 때 다시 조립합니다. DOC 샤드 수는 `variant_doc_hash_shard_count`로 지정합니다.
- 작은 배치로 쓸 때는 Subcolumnization을 건너뛰고 나중에 병합할 때 수행할 수 있습니다. 이 동작은 `variant_doc_materialization_min_rows`로 제어합니다. 예를 들어 `variant_doc_materialization_min_rows = 10000`이면 10,000행 미만의 쓰기 작업은 원본 JSON만 저장하며 해당 배치에서 Subcolumnization을 수행하지 않습니다.
- 열이 극도로 넓은 워크로드에서 Subcolumnization 규모가 하위 열 10,000개에 가까워질 때도 DOC mode가 더 안정적인 선택입니다. 기본적인 즉시 Subcolumnization과 비교하면 컴팩션 메모리 사용량이 약 2/3 줄고, 희소한 넓은 열의 데이터 수집 처리량이 약 5-10배 높아질 수 있습니다.
- `VARIANT` 열이 매우 넓고 쿼리가 전체 문서를 자주 읽는다면, DOC mode는 여러 하위 열에서 문서를 재구성하는 방식에 비해 `SELECT variant_col` 성능을 몇 자릿수 배만큼 높일 수 있습니다.

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT<
      'path_1' : INT,
      'path_2' : STRING,
      properties(
          'variant_enable_doc_mode' = 'true',
          'variant_doc_materialization_min_rows' = '10000',
          'variant_doc_hash_shard_count' = '64'
      )
  >
);
```

**참고 사항**

- DOC mode에는 `variant_enable_doc_mode = true`가 필요합니다.
- DOC mode에서 Schema Template 필드는 문자열, 정수, `FLOAT`, `DOUBLE`, `BOOLEAN`, 그리고 이러한 타입의 배열로 제한됩니다.
- `variant_doc_hash_shard_count`는 ‘전체 JSON 키 수 / 128’로 대략 추정할 수 있습니다.

### 한계에 도달했을 때의 동작과 튜닝 제안 {#behavior-at-limits-and-tuning-suggestions}

1. 임계값을 넘으면 새 경로는 희소 열에 기록됩니다. Rowset 병합 과정에서도 일부 경로가 희소 열로 이동할 수 있습니다.
2. 시스템은 NULL이 아닌 값의 비율과 접근 빈도가 높은 경로를 Subcolumnization 대상으로 유지하는 것을 우선합니다.
3. Subcolumnization 대상 경로가 10,000개에 가까우면 강력한 하드웨어가 필요합니다(노드당 RAM ≥128G, CPU 코어 ≥32C 권장). 워크로드가 이미 이 범위에 가깝다면 DOC mode부터 평가하세요.
4. 데이터 수집 튜닝: 클라이언트의 `batch_size`를 적절히 늘리거나 Group Commit을 사용하세요(필요에 따라 `group_commit_interval_ms`/`group_commit_data_bytes` 증가).
5. 버킷 가지치기가 필요하지 않다면 RANDOM 버킷과 단일 태블릿 데이터 적재를 고려해 컴팩션의 쓰기 증폭을 줄이세요.
6. BE 튜닝 설정: `max_cumu_compaction_threads`(≥8), `vertical_compaction_num_columns_per_group=500`(수직 컴팩션을 개선하지만 메모리 사용량 증가), `segment_cache_memory_percentage=20`(메타데이터 캐시 효율 개선).
7. Compaction Score를 관찰하세요. 계속 상승하면 컴팩션이 따라가지 못하는 것이므로 데이터 수집 압력을 낮추세요.
8. VARIANT에 대해 대규모 `SELECT *`를 피하고 `SELECT v['path']`처럼 필요한 경로만 조회하세요.

## 하위 열과 타입 확인 {#inspect-subcolumns-and-types}

방법 1: [VARIANT_TYPE](../../../sql-functions/scalar-functions/variant-functions/variant-type.md)으로 값이나 특정 경로의 타입을 행별로 확인합니다. 검사하는 모든 행을 읽습니다.

```sql
SELECT VARIANT_TYPE(v), VARIANT_TYPE(v['a']) FROM variant_tbl LIMIT 10;
```

방법 2: 확장된 `DESC`로 Subcolumnization을 통해 추출된 하위 경로와 그 저장 타입을 표시합니다.

```sql
SET describe_extend_variant_column = true;
DESC variant_tbl;
```

```sql
DESCRIBE ${table_name} PARTITION ($partition_name);
```

방법 1은 각 값의 타입을 보여 주고 방법 2는 각 경로가 저장되는 방식을 보여 줍니다.

## 제한 사항 {#limitations}

- **넓은 테이블 최적화**: `VARIANT` 타입으로 생성되는 동적 하위 열이 많은 넓은 테이블(예: 열 2000개 초과)에서는 테이블 `PROPERTIES`에 `"storage_format" = "V3"`를 지정해 **Storage Format V3**를 활성화하는 것을 강력히 권장합니다. 이렇게 하면 열 메타데이터가 Segment Footer에서 분리되어 파일을 더 빨리 열고 메모리 사용량을 줄일 수 있습니다.
- JSON 키의 기본 최대 길이는 255바이트입니다(`variant_max_json_key_length`).
- VARIANT 열은 키, 파티션 또는 버킷 열이 될 수 없고 테이블 스키마에서 다른 타입 안에 중첩될 수도 없습니다([VARIANT 열 정의](#define-a-variant-column) 참조).
- DOC mode 밖에서 전체 VARIANT 열을 읽으면 모든 하위 경로를 스캔합니다. 매우 넓은 열에서는 DOC mode가 활성화되지 않은 한 직접 `SELECT variant_col`을 실행하는 것을 일반적으로 권장하지 않습니다. 하위 경로가 많다면 `LIKE` 같은 전체 객체 검색을 위해 원본 JSON 문자열을 별도의 STRING/JSONB 열에 저장하는 방안을 고려하세요.

```sql
CREATE TABLE example_table (
  id INT,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_variant LIKE '%doris%';

-- Better: keep the original JSON string for whole-object matching
CREATE TABLE example_table (
  id INT,
  data_string STRING,
  data_variant VARIANT
);
SELECT * FROM example_table WHERE data_string LIKE '%doris%';
```

## JSON 타입과 비교 {#compared-with-json-type}

- 저장: JSON은 행 기반 JSONB로 저장됩니다. VARIANT는 쓸 때 Subcolumnization을 사용하므로 압축률이 높고 크기가 작습니다.
- 쿼리: JSON은 파싱이 필요합니다. VARIANT는 열을 직접 스캔하므로 일반적으로 훨씬 빠릅니다.

수정된 ClickBench(43개 쿼리):
- 저장: VARIANT는 JSON 대비 약 65%의 공간을 절약합니다.
- 쿼리: VARIANT는 JSON보다 8배 이상 빠르며 미리 정의된 정적 열에 가까운 성능을 냅니다.

**저장 공간**

| 타입 | 크기 |
| ------------------- | ---------- |
| 미리 정의된 열 | 12.618 GB |
| VARIANT | 12.718 GB |
| JSON | 35.711 GB |

**약 65%의 공간 절약**

| 실행 | 미리 정의된 열 | VARIANT | JSON |
| ----------------| ---------- | ------- | --------------- |
| 첫 번째(콜드) | 233.79s | 248.66s | 대부분 시간 초과 |
| 두 번째(핫) | 86.02s | 94.82s | 789.24s |
| 세 번째(핫) | 83.03s | 92.29s | 743.69s |

## FAQ {#faq}

1. VARIANT의 `null`과 SQL `NULL`은 같은가요?
   - 아닙니다. 쿼리에서 계산된 JSON `null`은 VARIANT `null` 값인 반면, 없는 경로는 SQL `NULL`입니다. 값을 저장한 후에는 배열 밖의 객체에서 `null` 멤버가 제거되고 다시 읽을 때 SQL `NULL`이 반환됩니다. [NULL 의미 체계](#null-semantics)를 참조하세요.
2. `INSERT INTO t VALUES (1, '{"a": 1}')` 이후에 `v['a']`가 `NULL`을 반환하는 이유는 무엇인가요?
   - `INSERT`는 문자열을 파싱하지 않고 VARIANT 문자열로 저장합니다. `s3()`, `hdfs()` 또는 다른 문자열 열에서 가져오는 `INSERT INTO ... SELECT`도 마찬가지입니다. `PARSE_TO_VARIANT('{"a": 1}')`를 사용하거나 Stream Load 같은 데이터 적재 작업으로 적재하세요. [데이터 쓰기](#write-data)를 참조하세요.
3. 유효한 JSON인데도 전체 문서가 문자열로 저장되는 이유는 무엇인가요?
   - 문서에 [-2^63, 2^64 - 1] 범위를 벗어나는 정수나 `DOUBLE` 범위를 벗어나는 숫자가 있을 수 있습니다. 파서는 이러한 문서를 거부하고 기본적으로 문자열로 유지합니다. [파싱 오류](#parse-errors)를 참조하세요.
4. 쿼리나 인덱스가 작동하지 않는 이유는 무엇인가요?
   - 경로를 저장 타입으로 CAST했는지(암시적 숫자 비교는 인덱스를 사용할 수 없음), 타입 충돌로 인해 JSONB로 승격되었는지, 전체 VARIANT 열에 대한 인덱스가 하위 경로에도 적용된다고 잘못 가정했는지 확인하세요.
5. `ORDER BY v['a']`에서 `"10"`이 `9`보다 뒤에 오거나 `GROUP BY v['a']`에서 `1`과 `"1"`이 서로 다른 그룹이 되는 이유는 무엇인가요?
   - VARIANT의 정렬과 동등성은 먼저 값의 종류를 봅니다. 숫자는 문자열보다 앞에 오고 숫자와 문자열은 같지 않습니다. 숫자 또는 사전식 의미 체계가 필요하면 경로를 하나의 타입으로 CAST하세요. [비교, 그룹화, 정렬](#comparison-grouping-and-ordering)을 참조하세요.
6. `v['a']`가 문자열일 때 `COALESCE(v['a'], 0)`은 `0.000000000`을 반환하고 `IF(..., v['a'], 1)`은 `NULL`을 반환하는 이유는 무엇인가요?
   - VARIANT를 다른 타입과 함께 사용하면 VARIANT 값이 다른 타입으로 변환되며, 그 타입이 정수라면 `DECIMAL(38, 9)`로 변환됩니다. `"abc"` 같은 문자열은 변환할 수 없어 `NULL`이 되므로 `COALESCE`가 반환하는 `0`은 `0.000000000`으로 표시됩니다. VARIANT 결과를 유지하려면 `COALESCE(v['a'], CAST(0 AS VARIANT))`를 사용하거나 `v['a']`를 원하는 타입으로 CAST하세요.
7. DECIMAL을 VARIANT 열에 쓸 때 정밀도가 손실되는 이유는 무엇인가요?
   - 소수 부분이 있는 JSON 숫자는 `DECIMAL`이 아니라 `DOUBLE`로 추론되므로 끝 자릿수가 손실될 수 있습니다. Schema Template에서 경로를 `DECIMAL`로 선언해도(예: `v VARIANT<'num': DECIMAL(9, 3)>`) 값을 먼저 `DOUBLE`로 파싱하므로 정밀도 손실을 완전히 막지는 못합니다. `PARSE_TO_VARIANT('{"num": "12.345"}')`처럼 문서 안에서 값을 JSON 문자열로 쓰면 손실 없이 `DECIMAL(9, 3)`으로 직접 변환됩니다.
