---
{
    "title": "JSON | 반정형",
    "language": "ko",
    "description": "JSON (JavaScript Object Notation)은 사람이 읽을 수 있는 텍스트를 저장과 전송에 사용하는 개방형 표준 파일 형식이자 데이터 교환 형식입니다. ",
    "sidebar_label": "JSON"
}
---

# JSON {#json}

## JSON 소개 {#json-introduction}

JSON (JavaScript Object Notation)은 사람이 읽을 수 있는 텍스트를 사용하여 데이터를 저장하고 전송하는 개방형 표준 파일 형식이자 데이터 교환 형식입니다. 공식 명세 [RFC7159](https://datatracker.ietf.org/doc/html/rfc7159)에 따르면 JSON은 다음 기본 타입을 지원합니다.
- Bool
- Null
- Number
- String
- Array
- Object

JSON 데이터 타입은 [JSON](https://www.rfc-editor.org/rfc/rfc8785) 데이터를 바이너리 형식으로 효율적으로 저장하며, JSON 함수를 통해 내부 필드에 접근할 수 있습니다.

기본적으로 최대 1048576바이트(1MB)를 지원하며, 최대 2147483643바이트(2GB)까지 늘릴 수 있습니다. 이 값은 `string_type_length_soft_limit_bytes` 설정으로 조정할 수 있습니다.

일반 STRING 타입에 JSON 문자열을 저장하는 방식과 비교하면 JSON 타입에는 두 가지 주요 장점이 있습니다.
1. 데이터 삽입 시 JSON 형식을 검증합니다.
2. 더 효율적인 바이너리 저장 형식을 사용하므로, `json_extract`와 같은 함수를 사용하면 `get_json_xx` 함수보다 JSON 내부 필드에 더 빠르게 접근할 수 있습니다.

:::caution 참고
1.2.x 버전에서는 JSON 타입의 이름이 JSONB였습니다. MySQL과의 호환성을 유지하기 위해 2.0.0 버전부터 JSON으로 이름이 변경되었습니다. 기존 테이블에서는 이전 이름을 계속 사용할 수 있습니다.
:::

## JSON 숫자 정밀도 문제 {#json-number-precision-issues}

JSON을 사용할 때는 숫자 정밀도에 특히 주의해야 합니다.
- 대부분의 시스템에서 Number 타입은 IEEE 754-2008의 64비트 배정밀도 부동소수점 수를 기반으로 구현됩니다(예: C++의 double 타입).
- JSON 명세는 Number의 내부 타입을 엄격하게 정의하지 않으며, JSON 데이터는 서로 다른 시스템 간에 텍스트로 교환되므로 정밀도 손실이 발생할 수 있습니다.

`{"abc": 18446744073709551616}`과 같은 JSON 문자열의 경우:

```sql
-- Conversion result in MySQL
cast('{"abc": 18446744073709551616}' as json)
-- Result: {"abc": 1.8446744073709552e19}
```

```javascript
// Conversion result in JavaScript
console.log(JSON.parse('{"abc": 18446744073709551616}'));
// Result: {abc: 18446744073709552000}
```

시스템 간 데이터 교환 시 숫자 정밀도를 유지하려면 큰 숫자는 문자열로 저장해야 합니다. 예: `{"abc": "18446744073709551616"}`.

## Doris의 JSON 타입 {#json-type-in-doris}

Doris는 JSON 표준 명세를 준수하는 데이터 타입을 지원하며, 효율적인 JSONB (JSON Binary) 형식을 사용하여 데이터를 바이너리로 인코딩해 저장합니다.

### 지원하는 타입 {#supported-types}

Doris JSONB는 모든 표준 JSON 타입을 지원합니다. 주요 차이점은 Doris 내부 타입에 더 정확하게 매핑할 수 있도록 Number 타입을 더 세분화하여 확장했다는 점입니다.

| JSON 타입 | 하위 타입 | 대응하는 Doris 타입 |
|----------|-------|-----------------|
| Bool | - | BOOLEAN |
| Null | - | (직접 대응하는 타입 없음, JSON null 값을 나타냄) |
| Number | Int8 | TINYINT |
| | Int16 | SMALLINT |
| | Int32 | INT |
| | Int64 | BIGINT |
| | Int128 | LARGEINT |
| | Double | DOUBLE |
| | Float | FLOAT |
| | Decimal | DECIMAL |
| String | - | STRING |
| Array | - | ARRAY |
| Object | - | STRUCT |

### 주요 참고 사항: {#important-notes}
- Null의 의미:
  - JSON의 Null은 "빈 값"을 나타내는 유효한 값입니다. "알 수 없음" 또는 "누락됨"을 나타내는 SQL의 NULL과는 다릅니다.
  - CAST('null' AS JSON)의 결과는 JSON null 값을 포함하는 JSONB 컬럼이며, 이 값 자체는 SQL 수준에서 NULL이 아닙니다.
  - CAST('null' AS JSON) IS NULL은 false(0)를 반환합니다. 컬럼에 알려진 값인 JSON null이 들어 있으며, 이는 SQL NULL이 아니기 때문입니다.

## 연산 및 제한 사항 {#operations-and-limitations}
- 비교 및 산술 연산:
  - JSONB 컬럼은 다른 데이터 타입(다른 JSONB 컬럼 포함)과 직접 비교하거나 산술 연산에 사용할 수 없습니다.
  - 해결 방법: JSON_EXTRACT 함수로 JSONB에서 스칼라 값(INT, DOUBLE, STRING, BOOLEAN 등)을 추출한 다음, 비교나 계산을 위해 해당 Doris 기본 타입으로 변환합니다.
- 정렬:
  - JSONB 컬럼은 ORDER BY 연산을 지원하지 않습니다.
- 암시적 변환:
  - 입력 시에만 지원: JSONB 컬럼에 데이터를 입력할 때 STRING 타입은 JSONB로 암시적으로 변환될 수 있습니다(문자열 내용이 유효한 JSON 텍스트인 경우). 다른 Doris 타입은 JSONB로 암시적으로 변환될 수 없습니다.


## JSON의 GROUP BY 및 DISTINCT 지원 {#group-by-and-distinct-support-for-json}

### 예제 1: JSON 컬럼에 GROUP BY 적용 {#example-1-group-by-on-json-columns}
```sql
mysql> SELECT * FROM test_jsonb_groupby;
+------+---------------+
| id   | j             |
+------+---------------+
|    1 | {"a":1,"b":2} |
|    2 | {"a":1,"b":3} |
|    3 | {"a":2,"b":2} |
|    4 | {"a":2,"b":2} |
|    5 | {"a":1,"b":2} |
|    6 | {"a":2,"b":2} |
+------+---------------+
6 rows in set (0.07 sec)

mysql> SELECT j, COUNT(*) FROM test_jsonb_groupby GROUP BY j;
+---------------+----------+
| j             | COUNT(*) |
+---------------+----------+
| {"a":1,"b":3} |        1 |
| {"a":2,"b":2} |        3 |
| {"a":1,"b":2} |        2 |
+---------------+----------+
```

### 예제 2: JSON 컬럼에 대한 DISTINCT 쿼리 {#example-2-distinct-query-on-json-columns}
```sql
mysql> SELECT DISTINCT j FROM test_jsonb_groupby;
+---------------+
| j             |
+---------------+
| {"a":1,"b":3} |
| {"a":2,"b":2} |
| {"a":1,"b":2} |
+---------------+
```

### 참고 사항 {#notes}
1. **바이너리 비교**: JSON 비교는 바이너리를 기준으로 이루어집니다. 두 JSON 데이터가 의미상 동일하더라도 바이너리 표현이 다르면 같은 그룹으로 묶을 수 없습니다. 예를 들어:
   ```sql
   mysql> SELECT * FROM test_jsonb;
   +------+------+
   | id   | j    |
   +------+------+
   |    1 | 123  |
   |    2 | 123  |
   +------+------+

   mysql> SELECT j, COUNT(*) FROM test_jsonb GROUP BY j;
   +------+----------+
   | j    | COUNT(*) |
   +------+----------+
   | 123  |        1 |
   | 123  |        1 |
   +------+----------+
   ```

   이는 첫 번째 `123`이 내부적으로 64비트 정수로 저장되고(`json_type`이 `bigint`를 반환), 두 번째 `123`은 더 작은 정수 타입으로 저장되어(`json_type`이 `int`를 반환하며, 이는 `bigint`보다 작은 모든 정수 타입에 적용됨) 바이너리 표현이 달라지기 때문입니다. 다음 쿼리로 타입을 확인할 수 있습니다.
   ```sql
   mysql> SELECT j, json_type(j, '$') FROM test_jsonb;
   +------+------------------+
   | j    | json_type(j, '$') |
   +------+------------------+
   | 123  | bigint           |
   | 123  | int              |
   +------+------------------+
   ```

   마찬가지로 키 순서가 다른 JSON 객체도 같은 그룹으로 묶을 수 없습니다. 예를 들어:
   ```sql
   mysql> SELECT * FROM test_jsonb;
   +------+---------------+
   | id   | j             |
   +------+---------------+
   |    2 | {"b":2,"a":1} |
   |    1 | {"a":1,"b":2} |
   +------+---------------+

   mysql> SELECT j, COUNT(*) FROM test_jsonb GROUP BY j;
   +---------------+----------+
   | j             | COUNT(*) |
   +---------------+----------+
   | {"b":2,"a":1} |        1 |
   | {"a":1,"b":2} |        1 |
   +---------------+----------+
   ```

2. **숫자 타입의 일관성**: 숫자 타입의 차이를 무시하려면 `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 함수를 사용하여 JSON의 모든 숫자를 `DOUBLE` 타입으로 변환합니다.
   ```sql
   mysql> SELECT NORMALIZE_JSON_NUMBERS_TO_DOUBLE(j), COUNT(*) 
          FROM test_jsonb 
          GROUP BY NORMALIZE_JSON_NUMBERS_TO_DOUBLE(j);
   +-------------------------------------+----------+
   | NORMALIZE_JSON_NUMBERS_TO_DOUBLE(j) | COUNT(*) |
   +-------------------------------------+----------+
   | 123                                 |        2 |
   +-------------------------------------+----------+
   ```
   텍스트 파싱을 통해 JSON 객체를 생성하는 경우(예: CAST를 사용하여 문자열을 JSON으로 변환), Doris가 저장에 적합한 숫자 타입을 자동으로 선택하므로 일반적으로 숫자 타입의 불일치는 문제가 되지 않습니다.

3. **키 순서의 일관성**:
   `SORT_JSON_OBJECT_KEYS` 함수를 사용하여 키를 정렬합니다.
   ```sql
   mysql> SELECT SORT_JSON_OBJECT_KEYS(j), COUNT(*) 
          FROM test_jsonb 
          GROUP BY SORT_JSON_OBJECT_KEYS(j);
   +--------------------------+----------+
   | SORT_JSON_OBJECT_KEYS(j) | COUNT(*) |
   +--------------------------+----------+
   | {"a":1,"b":2}            |        2 |
   +--------------------------+----------+
   ```

   텍스트 파싱을 통해 JSON 객체를 생성하는 경우(예: CAST를 사용하여 문자열을 JSON으로 변환), Doris는 텍스트의 키 순서를 유지합니다. 따라서 JSONB 데이터가 텍스트 파싱을 통해 생성되었다면 위와 같은 그룹화 문제가 발생하지 않습니다.

### 권장 사항 {#recommendations}
JSON 데이터에서 숫자 타입이나 키 순서의 일관성을 보장할 수 없다면, `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 함수와 `SORT_JSON_OBJECT_KEYS` 함수로 데이터를 전처리한 다음 `GROUP BY` 연산을 수행하여 예상한 결과를 얻는 것이 좋습니다.

### 구문 {#syntax}

**정의:**
```sql
json_column_name JSON
```

**삽입:**
- `INSERT INTO VALUES`를 사용할 때는 해당 형식을 따옴표로 감싼 문자열로 지정합니다. 예를 들어:
```sql
INSERT INTO table_name(id, json_column_name) VALUES (1, '{"k1": "100"}')
```

- STREAM LOAD에서는 해당 컬럼의 형식을 추가 따옴표가 없는 문자열로 지정합니다. 예를 들어:
```
12	{"k1":"v31", "k2": 300}
13	[]
14	[123, 456]
```

- JSON에 `'\'`가 포함된 특수 문자(예: `'\r'`, `'\t'`)가 나타나면 replace 함수를 사용하여 `"\"`를 `"\\"`로 바꿔야 합니다. 예를 들어 `"\n"`을 `"\\n"`으로 바꿔야 합니다. 


**쿼리:**
- JSON 컬럼 전체를 직접 선택합니다.
```sql
SELECT json_column_name FROM table_name;
```

- JSON 함수를 사용하여 JSON에서 특정 필드나 기타 정보를 추출합니다. 예를 들어:
```sql
SELECT json_extract(json_column_name, '$.k1') FROM table_name;
```

- JSON 타입은 정수, 문자열, BOOLEAN, ARRAY, MAP 타입으로 변환하거나 이들 타입에서 JSON으로 변환할 수 있습니다. 예를 들어:
```sql
SELECT CAST('{"k1": "100"}' AS JSON);
SELECT CAST(json_column_name AS STRING) FROM table_name;
SELECT CAST(json_extract(json_column_name, '$.k1') AS INT) FROM table_name;
```

:::tip
현재 JSON 타입은 `ORDER BY` 또는 비교 연산에 사용할 수 없습니다.
:::

## JSON 입력 {#json-input}

CAST를 사용하여 JSON 구문을 준수하는 문자열을 JSONB로 변환합니다.

```sql
-- Simple scalar/basic values (numeric types, bool, null, string)
mysql> SELECT cast('5' as json);
+-------------------+
| cast('5' as json) |
+-------------------+
| 5                 |
+-------------------+

-- Arrays with zero or more elements (elements don't need to be the same type)
mysql> SELECT cast('[1, 2, "foo", null]' as json);
+-------------------------------------+
| cast('[1, 2, "foo", null]' as json) |
+-------------------------------------+
| [1,2,"foo",null]                    |
+-------------------------------------+

-- Objects containing key-value pairs
-- Note that object keys must always be quoted strings
mysql> SELECT cast('{"bar": "baz", "balance": 7.77, "active": false}' as json);
+------------------------------------------------------------------+
| cast('{"bar": "baz", "balance": 7.77, "active": false}' as json) |
+------------------------------------------------------------------+
| {"bar":"baz","balance":7.77,"active":false}                      |
+------------------------------------------------------------------+

-- Arrays and objects can be nested arbitrarily
mysql> SELECT cast('{"foo": [true, "bar"], "tags": {"a": 1, "b": null}}' as json);
+---------------------------------------------------------------------+
| cast('{"foo": [true, "bar"], "tags": {"a": 1, "b": null}}' as json) |
+---------------------------------------------------------------------+
| {"foo":[true,"bar"],"tags":{"a":1,"b":null}}                        |
+---------------------------------------------------------------------+
```

Doris의 JSONB는 공백처럼 의미에 영향을 주지 않는 세부 사항을 보존하지 않습니다.

```sql
mysql> -- The input text and JSON output may not look the same
mysql> SELECT cast('[1,                 2]' as json);
+----------------------------------------+
| cast('[1,                 2]' as json) |
+----------------------------------------+
| [1,2]                                  |
+----------------------------------------+
```

### 주요 차이점 및 참고 사항: {#key-differences-and-notes}
- CAST(string AS JSON): JSON 구문을 준수하는 문자열을 파싱하는 데 사용합니다. Number 타입의 경우 Int8, Int16, Int32, Int64, Int128, Double 타입만 파싱하며 Decimal 타입은 파싱하지 않습니다.
- 대부분의 다른 JSON 구현과 달리 Doris의 JSONB 타입은 최대 Int128 정밀도를 지원합니다. Int128 정밀도를 초과하는 숫자는 오버플로가 발생할 수 있습니다.
- 입력 숫자 문자열이 12.34이면 Double로 파싱하고, 소수점이 없으면 정수로 파싱합니다(Int128 범위를 초과하면 Double로 변환되지만 정밀도 손실이 발생합니다).

## to_json을 사용하여 Doris 내부 타입을 JSONB 타입으로 변환 {#using-to_json-to-convert-doris-internal-types-to-jsonb-type}

```sql
mysql> SELECT to_json(1) , to_json(3.14) , to_json("12345");
+------------+---------------+------------------+
| to_json(1) | to_json(3.14) | to_json("12345") |
+------------+---------------+------------------+
| 1          | 3.14          | "12345"          |
+------------+---------------+------------------+

mysql> SELECT to_json(array(array(1,2,3),array(4,5,6)));
+-------------------------------------------+
| to_json(array(array(1,2,3),array(4,5,6))) |
+-------------------------------------------+
| [[1,2,3],[4,5,6]]                         |
+-------------------------------------------+

mysql> SELECT json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]');
+----------------------------------------------------------------------+
| json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]') |
+----------------------------------------------------------------------+
| 6                                                                    |
+----------------------------------------------------------------------+

mysql> SELECT to_json(struct(123,array(4,5,6),"789"));
+------------------------------------------+
| to_json(struct(123,array(4,5,6),"789"))  |
+------------------------------------------+
| {"col1":123,"col2":[4,5,6],"col3":"789"} |
+------------------------------------------+

mysql> SELECT json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2");
+----------------------------------------------------------------+
| json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2") |
+----------------------------------------------------------------+
| [4,5,6]                                                        |
+----------------------------------------------------------------+
```

to_json은 JSONB 타입에 매핑되는 Doris 타입의 변환만 지원합니다.
예를 들어 DECIMAL은 to_json과 함께 사용할 수 있습니다.
하지만 DATE는 사용할 수 없으므로 먼저 STRING으로 변환한 다음 to_json을 사용해야 합니다.

## JSONB 출력 {#jsonb-output}

다른 시스템과 데이터를 교환하기 위해 일반 텍스트로 변환할 때 Doris의 JSONB 타입은 유효한 JSON 텍스트를 생성합니다.

1. Null 값:
   - null로 출력(따옴표 없음)
2. 불리언 값:
   - true → true 출력
   - false → false 출력
3. 숫자 타입:
   - 모든 숫자 값을 그대로 출력
   - 예: 5 → 5 출력, 3.14 → 3.14 출력
4. 문자열:
   - 큰따옴표로 감싸서 출력: "<content>"
   - 특수 문자는 이스케이프 처리:
     - " → \"
     - \ → \\
     - / → \/
     - 백스페이스 → \b
     - 폼 피드 → \f
     - 줄 바꿈 → \n
     - 캐리지 리턴 → \r
     - 탭 → \t
   - 기타 제어 문자(ASCII < 32)는 Unicode 이스케이프 시퀀스로 변환: \uXXXX
5. 객체:
   - 형식: {<key-value pairs list>}
   - 키-값 쌍 형식: "<key>": <value>
   - 여러 키-값 쌍은 쉼표로 구분
6. 배열:
   - 형식: [<element list>]
   - 여러 요소는 쉼표로 구분
7. 중첩 구조 처리:
   - 객체와 배열은 중첩 깊이에 제한이 없음
   - 각 중첩 수준은 동일한 규칙에 따라 재귀적으로 처리

## 숫자 정밀도 문제 {#number-precision-issues}

to_json을 사용하여 Doris 내부 타입을 JSONB로 변환할 때는 정밀도 손실이 발생하지 않습니다.
Doris 내부 JSON 함수를 사용할 때도 반환값이 JSONB 타입이면 정밀도 손실이 발생하지 않습니다.
하지만 Doris JSONB를 일반 텍스트로 변환한 다음 다시 JSONB로 변환하면 정밀도 손실이 발생할 수 있습니다.

예: Doris JSON 타입 객체
```
Object{
    "a": (Decimal 18446744073709551616.123)
}
```

일반 텍스트로 변환한 결과:
```
{"a": 18446744073709551616.123}
```

일반 텍스트를 다시 Doris JSON 타입으로 변환한 결과:
```
Object{
    "a": (Double 18446744073709552000)  // precision loss
}
```

## 설정 및 제한 사항 {#configuration-and-limitations}
- JSON은 기본적으로 1,048,576바이트(1 MB)를 지원합니다.
- 크기 제한은 BE 설정 매개변수 string_type_length_soft_limit_bytes로 조정할 수 있습니다.
- 최대 2,147,483,643바이트(약 2 GB)까지 조정할 수 있습니다.
- Doris JSON 타입 객체에서 키 길이는 255바이트를 초과할 수 없습니다.

## 사용 예제 {#usage-example}
테이블 생성, 데이터 적재, 쿼리를 포함한 JSON 데이터 타입 튜토리얼입니다.

#### 데이터베이스 및 테이블 생성 {#create-database-and-table}

```
CREATE DATABASE testdb;

USE testdb;

CREATE TABLE test_json (
  id INT,
  j JSON
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES("replication_num" = "1");
```

#### 데이터 적재 {#load-data}

##### Stream Load용 test_json.csv 테스트 데이터 {#stream-load-test_jsoncsv-test-data}

- 컬럼은 2개이며, 1번째 컬럼은 id이고 2번째 컬럼은 JSON 문자열입니다.
- 총 25개 행 중 처음 18개 행은 유효한 JSON이고 마지막 7개 행은 유효하지 않습니다.


```
1	\N
2	null
3	true
4	false
5	100
6	10000
7	1000000000
8	1152921504606846976
9	6.18
10	"abcd"
11	{}
12	{"k1":"v31", "k2": 300}
13	[]
14	[123, 456]
15	["abc", "def"]
16	[null, true, false, 100, 6.18, "abc"]
17	[{"k1":"v41", "k2": 400}, 1, "a", 3.14]
18	{"k1":"v31", "k2": 300, "a1": [{"k1":"v41", "k2": 400}, 1, "a", 3.14]}
19	''
20	'abc'
21	abc
22	100x
23	6.a8
24	{x
25	[123, abc]
```

- 행의 28%가 유효하지 않으므로 기본 설정으로 Stream Load를 수행하면 "too many filtered rows" 오류 메시지와 함께 실패합니다.

```
curl --location-trusted -u root: -T test_json.csv http://127.0.0.1:8840/api/testdb/test_json/_stream_load
{
    "TxnId": 12019,
    "Label": "744d9821-9c9f-43dc-bf3b-7ab048f14e32",
    "TwoPhaseCommit": "false",
    "Status": "Fail",
    "Message": "too many filtered rows",
    "NumberTotalRows": 25,
    "NumberLoadedRows": 18,
    "NumberFilteredRows": 7,
    "NumberUnselectedRows": 0,
    "LoadBytes": 380,
    "LoadTimeMs": 48,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 45,
    "CommitAndPublishTimeMs": 0,
    "ErrorURL": "http://172.21.0.5:8840/api/_load_error_log?file=__shard_2/error_log_insert_stmt_95435c4bf5f156df-426735082a9296af_95435c4bf5f156df_426735082a9296af"
}
```

- 헤더 설정을 'max_filter_ratio: 0.3'으로 지정하면 Stream Load가 성공합니다.
```
curl --location-trusted -u root: -H 'max_filter_ratio: 0.3' -T test_json.csv http://127.0.0.1:8840/api/testdb/test_json/_stream_load
{
    "TxnId": 12017,
    "Label": "f37a50c1-43e9-4f4e-a159-a3db6abe2579",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 25,
    "NumberLoadedRows": 18,
    "NumberFilteredRows": 7,
    "NumberUnselectedRows": 0,
    "LoadBytes": 380,
    "LoadTimeMs": 68,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 2,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 45,
    "CommitAndPublishTimeMs": 19,
    "ErrorURL": "http://172.21.0.5:8840/api/_load_error_log?file=__shard_0/error_log_insert_stmt_a1463f98a7b15caf-c79399b920f5bfa3_a1463f98a7b15caf_c79399b920f5bfa3"
}
```

- SELECT를 사용하여 Stream Load로 적재한 데이터를 확인합니다. JSON 타입 컬럼은 일반 JSON 문자열로 표시됩니다.

```
mysql> SELECT * FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+
| id   | j                                                             |
+------+---------------------------------------------------------------+
|    1 |                                                          NULL |
|    2 |                                                          null |
|    3 |                                                          true |
|    4 |                                                         false |
|    5 |                                                           100 |
|    6 |                                                         10000 |
|    7 |                                                    1000000000 |
|    8 |                                           1152921504606846976 |
|    9 |                                                          6.18 |
|   10 |                                                        "abcd" |
|   11 |                                                            {} |
|   12 |                                         {"k1":"v31","k2":300} |
|   13 |                                                            [] |
|   14 |                                                     [123,456] |
|   15 |                                                 ["abc","def"] |
|   16 |                              [null,true,false,100,6.18,"abc"] |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
+------+---------------------------------------------------------------+
18 rows in set (0.03 sec)

```

##### insert into를 사용한 데이터 쓰기 {#write-data-using-insert-into}

- 전체 행 수는 18개에서 19개로 늘어나며, 이는 1개 행을 삽입한 결과입니다.
```
mysql> INSERT INTO test_json VALUES(26, '{"k1":"v1", "k2": 200}');
Query OK, 1 row affected (0.09 sec)
{'label':'insert_4ece6769d1b42fd_ac9f25b3b8f3dc02', 'status':'VISIBLE', 'txnId':'12016'}

mysql> SELECT * FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+
| id   | j                                                             |
+------+---------------------------------------------------------------+
|    1 |                                                          NULL |
|    2 |                                                          null |
|    3 |                                                          true |
|    4 |                                                         false |
|    5 |                                                           100 |
|    6 |                                                         10000 |
|    7 |                                                    1000000000 |
|    8 |                                           1152921504606846976 |
|    9 |                                                          6.18 |
|   10 |                                                        "abcd" |
|   11 |                                                            {} |
|   12 |                                         {"k1":"v31","k2":300} |
|   13 |                                                            [] |
|   14 |                                                     [123,456] |
|   15 |                                                 ["abc","def"] |
|   16 |                              [null,true,false,100,6.18,"abc"] |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
|   26 |                                          {"k1":"v1","k2":200} |
+------+---------------------------------------------------------------+
19 rows in set (0.03 sec)

```

#### 쿼리 {#query}

##### json_extract 함수로 JSON에서 필드 추출 {#extract-some-filed-from-json-by-json_extract-functions}

1. JSON 전체를 추출합니다. '$'는 JSON 경로에서 루트를 나타냅니다.
```
+------+---------------------------------------------------------------+---------------------------------------------------------------+
| id   | j                                                             | json_extract(`j`, '$')                                       |
+------+---------------------------------------------------------------+---------------------------------------------------------------+
|    1 |                                                          NULL |                                                          NULL |
|    2 |                                                          null |                                                          null |
|    3 |                                                          true |                                                          true |
|    4 |                                                         false |                                                         false |
|    5 |                                                           100 |                                                           100 |
|    6 |                                                         10000 |                                                         10000 |
|    7 |                                                    1000000000 |                                                    1000000000 |
|    8 |                                           1152921504606846976 |                                           1152921504606846976 |
|    9 |                                                          6.18 |                                                          6.18 |
|   10 |                                                        "abcd" |                                                        "abcd" |
|   11 |                                                            {} |                                                            {} |
|   12 |                                         {"k1":"v31","k2":300} |                                         {"k1":"v31","k2":300} |
|   13 |                                                            [] |                                                            [] |
|   14 |                                                     [123,456] |                                                     [123,456] |
|   15 |                                                 ["abc","def"] |                                                 ["abc","def"] |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              [null,true,false,100,6.18,"abc"] |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                            [{"k1":"v41","k2":400},1,"a",3.14] |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
|   26 |                                          {"k1":"v1","k2":200} |                                          {"k1":"v1","k2":200} |
+------+---------------------------------------------------------------+---------------------------------------------------------------+
19 rows in set (0.03 sec)
```

1. k1 필드를 추출하며, 필드가 없으면 NULL을 반환합니다.
```
mysql> SELECT id, j, json_extract(j, '$.k1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+----------------------------+
| id   | j                                                             | json_extract(`j`, '$.k1') |
+------+---------------------------------------------------------------+----------------------------+
|    1 |                                                          NULL |                       NULL |
|    2 |                                                          null |                       NULL |
|    3 |                                                          true |                       NULL |
|    4 |                                                         false |                       NULL |
|    5 |                                                           100 |                       NULL |
|    6 |                                                         10000 |                       NULL |
|    7 |                                                    1000000000 |                       NULL |
|    8 |                                           1152921504606846976 |                       NULL |
|    9 |                                                          6.18 |                       NULL |
|   10 |                                                        "abcd" |                       NULL |
|   11 |                                                            {} |                       NULL |
|   12 |                                         {"k1":"v31","k2":300} |                      "v31" |
|   13 |                                                            [] |                       NULL |
|   14 |                                                     [123,456] |                       NULL |
|   15 |                                                 ["abc","def"] |                       NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                       NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                       NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                      "v31" |
|   26 |                                          {"k1":"v1","k2":200} |                       "v1" |
+------+---------------------------------------------------------------+----------------------------+
19 rows in set (0.03 sec)
```

1. 최상위 배열에서 인덱스 0의 요소를 추출합니다.
```
mysql> SELECT id, j, json_extract(j, '$[0]') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+----------------------------+
| id   | j                                                             | json_extract(`j`, '$[0]') |
+------+---------------------------------------------------------------+----------------------------+
|    1 |                                                          NULL |                       NULL |
|    2 |                                                          null |                       NULL |
|    3 |                                                          true |                       NULL |
|    4 |                                                         false |                       NULL |
|    5 |                                                           100 |                       NULL |
|    6 |                                                         10000 |                       NULL |
|    7 |                                                    1000000000 |                       NULL |
|    8 |                                           1152921504606846976 |                       NULL |
|    9 |                                                          6.18 |                       NULL |
|   10 |                                                        "abcd" |                       NULL |
|   11 |                                                            {} |                       NULL |
|   12 |                                         {"k1":"v31","k2":300} |                       NULL |
|   13 |                                                            [] |                       NULL |
|   14 |                                                     [123,456] |                        123 |
|   15 |                                                 ["abc","def"] |                      "abc" |
|   16 |                              [null,true,false,100,6.18,"abc"] |                       null |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |      {"k1":"v41","k2":400} |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                       NULL |
|   26 |                                          {"k1":"v1","k2":200} |                       NULL |
+------+---------------------------------------------------------------+----------------------------+
19 rows in set (0.03 sec)
```

1. 이름이 a1인 JSON 배열 전체를 추출합니다.
```
mysql> SELECT id, j, json_extract(j, '$.a1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+------------------------------------+
| id   | j                                                             | json_extract(`j`, '$.a1')         |
+------+---------------------------------------------------------------+------------------------------------+
|    1 |                                                          NULL |                               NULL |
|    2 |                                                          null |                               NULL |
|    3 |                                                          true |                               NULL |
|    4 |                                                         false |                               NULL |
|    5 |                                                           100 |                               NULL |
|    6 |                                                         10000 |                               NULL |
|    7 |                                                    1000000000 |                               NULL |
|    8 |                                           1152921504606846976 |                               NULL |
|    9 |                                                          6.18 |                               NULL |
|   10 |                                                        "abcd" |                               NULL |
|   11 |                                                            {} |                               NULL |
|   12 |                                         {"k1":"v31","k2":300} |                               NULL |
|   13 |                                                            [] |                               NULL |
|   14 |                                                     [123,456] |                               NULL |
|   15 |                                                 ["abc","def"] |                               NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                               NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                               NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | [{"k1":"v41","k2":400},1,"a",3.14] |
|   26 |                                          {"k1":"v1","k2":200} |                               NULL |
+------+---------------------------------------------------------------+------------------------------------+
19 rows in set (0.02 sec)
```

1. 배열에 포함된 객체에서 중첩 필드를 추출합니다.
```
mysql> SELECT id, j, json_extract(j, '$.a1[0]'), json_extract(j, '$.a1[0].k1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-------------------------------+----------------------------------+
| id   | j                                                             | json_extract(`j`, '$.a1[0]') | json_extract(`j`, '$.a1[0].k1') |
+------+---------------------------------------------------------------+-------------------------------+----------------------------------+
|    1 |                                                          NULL |                          NULL |                             NULL |
|    2 |                                                          null |                          NULL |                             NULL |
|    3 |                                                          true |                          NULL |                             NULL |
|    4 |                                                         false |                          NULL |                             NULL |
|    5 |                                                           100 |                          NULL |                             NULL |
|    6 |                                                         10000 |                          NULL |                             NULL |
|    7 |                                                    1000000000 |                          NULL |                             NULL |
|    8 |                                           1152921504606846976 |                          NULL |                             NULL |
|    9 |                                                          6.18 |                          NULL |                             NULL |
|   10 |                                                        "abcd" |                          NULL |                             NULL |
|   11 |                                                            {} |                          NULL |                             NULL |
|   12 |                                         {"k1":"v31","k2":300} |                          NULL |                             NULL |
|   13 |                                                            [] |                          NULL |                             NULL |
|   14 |                                                     [123,456] |                          NULL |                             NULL |
|   15 |                                                 ["abc","def"] |                          NULL |                             NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                          NULL |                             NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                          NULL |                             NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |         {"k1":"v41","k2":400} |                            "v41" |
|   26 |                                          {"k1":"v1","k2":200} |                          NULL |                             NULL |
+------+---------------------------------------------------------------+-------------------------------+----------------------------------+
19 rows in set (0.02 sec)

```

1. 특정 데이터 타입으로 필드를 추출합니다.
- json_extract_string은 필드를 string 타입으로 추출하며, 필드가 string 타입이 아니면 문자열로 변환합니다.
```
mysql> SELECT id, j, json_extract_string(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+---------------------------------------------------------------+
| id   | j                                                             | json_extract_string(`j`, '$')                                |
+------+---------------------------------------------------------------+---------------------------------------------------------------+
|    1 | NULL                                                          | NULL                                                          |
|    2 | null                                                          | null                                                          |
|    3 | true                                                          | true                                                          |
|    4 | false                                                         | false                                                         |
|    5 | 100                                                           | 100                                                           |
|    6 | 10000                                                         | 10000                                                         |
|    7 | 1000000000                                                    | 1000000000                                                    |
|    8 | 1152921504606846976                                           | 1152921504606846976                                           |
|    9 | 6.18                                                          | 6.18                                                          |
|   10 | "abcd"                                                        | abcd                                                          |
|   11 | {}                                                            | {}                                                            |
|   12 | {"k1":"v31","k2":300}                                         | {"k1":"v31","k2":300}                                         |
|   13 | []                                                            | []                                                            |
|   14 | [123,456]                                                     | [123,456]                                                     |
|   15 | ["abc","def"]                                                 | ["abc","def"]                                                 |
|   16 | [null,true,false,100,6.18,"abc"]                              | [null,true,false,100,6.18,"abc"]                              |
|   17 | [{"k1":"v41","k2":400},1,"a",3.14]                            | [{"k1":"v41","k2":400},1,"a",3.14]                            |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |
|   26 | {"k1":"v1","k2":200}                                          | {"k1":"v1","k2":200}                                          |
+------+---------------------------------------------------------------+---------------------------------------------------------------+
19 rows in set (0.02 sec)

mysql> SELECT id, j, json_extract_string(j, '$.k1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------------+
| id   | j                                                             | json_extract_string(`j`, '$.k1') |
+------+---------------------------------------------------------------+-----------------------------------+
|    1 |                                                          NULL | NULL                              |
|    2 |                                                          null | NULL                              |
|    3 |                                                          true | NULL                              |
|    4 |                                                         false | NULL                              |
|    5 |                                                           100 | NULL                              |
|    6 |                                                         10000 | NULL                              |
|    7 |                                                    1000000000 | NULL                              |
|    8 |                                           1152921504606846976 | NULL                              |
|    9 |                                                          6.18 | NULL                              |
|   10 |                                                        "abcd" | NULL                              |
|   11 |                                                            {} | NULL                              |
|   12 |                                         {"k1":"v31","k2":300} | v31                               |
|   13 |                                                            [] | NULL                              |
|   14 |                                                     [123,456] | NULL                              |
|   15 |                                                 ["abc","def"] | NULL                              |
|   16 |                              [null,true,false,100,6.18,"abc"] | NULL                              |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] | NULL                              |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | v31                               |
|   26 |                                          {"k1":"v1","k2":200} | v1                                |
+------+---------------------------------------------------------------+-----------------------------------+
19 rows in set (0.03 sec)

```

- json_extract_int는 필드를 int 타입으로 추출하며, 필드가 int 타입이 아니면 NULL을 반환합니다.
```
mysql> SELECT id, j, json_extract_int(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------+
| id   | j                                                             | json_extract_int(`j`, '$') |
+------+---------------------------------------------------------------+-----------------------------+
|    1 |                                                          NULL |                        NULL |
|    2 |                                                          null |                        NULL |
|    3 |                                                          true |                        NULL |
|    4 |                                                         false |                        NULL |
|    5 |                                                           100 |                         100 |
|    6 |                                                         10000 |                       10000 |
|    7 |                                                    1000000000 |                  1000000000 |
|    8 |                                           1152921504606846976 |                        NULL |
|    9 |                                                          6.18 |                        NULL |
|   10 |                                                        "abcd" |                        NULL |
|   11 |                                                            {} |                        NULL |
|   12 |                                         {"k1":"v31","k2":300} |                        NULL |
|   13 |                                                            [] |                        NULL |
|   14 |                                                     [123,456] |                        NULL |
|   15 |                                                 ["abc","def"] |                        NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                        NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                        NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                        NULL |
|   26 |                                          {"k1":"v1","k2":200} |                        NULL |
+------+---------------------------------------------------------------+-----------------------------+
19 rows in set (0.02 sec)

mysql> SELECT id, j, json_extract_int(j, '$.k2') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_extract_int(`j`, '$.k2') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                           NULL |
|    3 |                                                          true |                           NULL |
|    4 |                                                         false |                           NULL |
|    5 |                                                           100 |                           NULL |
|    6 |                                                         10000 |                           NULL |
|    7 |                                                    1000000000 |                           NULL |
|    8 |                                           1152921504606846976 |                           NULL |
|    9 |                                                          6.18 |                           NULL |
|   10 |                                                        "abcd" |                           NULL |
|   11 |                                                            {} |                           NULL |
|   12 |                                         {"k1":"v31","k2":300} |                            300 |
|   13 |                                                            [] |                           NULL |
|   14 |                                                     [123,456] |                           NULL |
|   15 |                                                 ["abc","def"] |                           NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                           NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                           NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                            300 |
|   26 |                                          {"k1":"v1","k2":200} |                            200 |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.03 sec)
```

- json_extract_bigint는 필드를 bigint 타입으로 추출하며, 필드가 bigint 타입이 아니면 NULL을 반환합니다.
```
mysql> SELECT id, j, json_extract_bigint(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_extract_bigint(`j`, '$') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                           NULL |
|    3 |                                                          true |                           NULL |
|    4 |                                                         false |                           NULL |
|    5 |                                                           100 |                            100 |
|    6 |                                                         10000 |                          10000 |
|    7 |                                                    1000000000 |                     1000000000 |
|    8 |                                           1152921504606846976 |            1152921504606846976 |
|    9 |                                                          6.18 |                           NULL |
|   10 |                                                        "abcd" |                           NULL |
|   11 |                                                            {} |                           NULL |
|   12 |                                         {"k1":"v31","k2":300} |                           NULL |
|   13 |                                                            [] |                           NULL |
|   14 |                                                     [123,456] |                           NULL |
|   15 |                                                 ["abc","def"] |                           NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                           NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                           NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                           NULL |
|   26 |                                          {"k1":"v1","k2":200} |                           NULL |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.03 sec)

mysql> SELECT id, j, json_extract_bigint(j, '$.k2') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------------+
| id   | j                                                             | json_extract_bigint(`j`, '$.k2') |
+------+---------------------------------------------------------------+-----------------------------------+
|    1 |                                                          NULL |                              NULL |
|    2 |                                                          null |                              NULL |
|    3 |                                                          true |                              NULL |
|    4 |                                                         false |                              NULL |
|    5 |                                                           100 |                              NULL |
|    6 |                                                         10000 |                              NULL |
|    7 |                                                    1000000000 |                              NULL |
|    8 |                                           1152921504606846976 |                              NULL |
|    9 |                                                          6.18 |                              NULL |
|   10 |                                                        "abcd" |                              NULL |
|   11 |                                                            {} |                              NULL |
|   12 |                                         {"k1":"v31","k2":300} |                               300 |
|   13 |                                                            [] |                              NULL |
|   14 |                                                     [123,456] |                              NULL |
|   15 |                                                 ["abc","def"] |                              NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                               300 |
|   26 |                                          {"k1":"v1","k2":200} |                               200 |
+------+---------------------------------------------------------------+-----------------------------------+
19 rows in set (0.02 sec)

```

- json_extract_double은 필드를 double 타입으로 추출하며, 필드가 double 타입이 아니면 NULL을 반환합니다.
```
mysql> SELECT id, j, json_extract_double(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_extract_double(`j`, '$') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                           NULL |
|    3 |                                                          true |                           NULL |
|    4 |                                                         false |                           NULL |
|    5 |                                                           100 |                            100 |
|    6 |                                                         10000 |                          10000 |
|    7 |                                                    1000000000 |                     1000000000 |
|    8 |                                           1152921504606846976 |          1.152921504606847e+18 |
|    9 |                                                          6.18 |                           6.18 |
|   10 |                                                        "abcd" |                           NULL |
|   11 |                                                            {} |                           NULL |
|   12 |                                         {"k1":"v31","k2":300} |                           NULL |
|   13 |                                                            [] |                           NULL |
|   14 |                                                     [123,456] |                           NULL |
|   15 |                                                 ["abc","def"] |                           NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                           NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                           NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                           NULL |
|   26 |                                          {"k1":"v1","k2":200} |                           NULL |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.02 sec)

mysql> SELECT id, j, json_extract_double(j, '$.k2') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------------+
| id   | j                                                             | json_extract_double(`j`, '$.k2') |
+------+---------------------------------------------------------------+-----------------------------------+
|    1 |                                                          NULL |                              NULL |
|    2 |                                                          null |                              NULL |
|    3 |                                                          true |                              NULL |
|    4 |                                                         false |                              NULL |
|    5 |                                                           100 |                              NULL |
|    6 |                                                         10000 |                              NULL |
|    7 |                                                    1000000000 |                              NULL |
|    8 |                                           1152921504606846976 |                              NULL |
|    9 |                                                          6.18 |                              NULL |
|   10 |                                                        "abcd" |                              NULL |
|   11 |                                                            {} |                              NULL |
|   12 |                                         {"k1":"v31","k2":300} |                               300 |
|   13 |                                                            [] |                              NULL |
|   14 |                                                     [123,456] |                              NULL |
|   15 |                                                 ["abc","def"] |                              NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                               300 |
|   26 |                                          {"k1":"v1","k2":200} |                               200 |
+------+---------------------------------------------------------------+-----------------------------------+
19 rows in set (0.03 sec)
```

- json_extract_bool은 필드를 boolean 타입으로 추출하며, 필드가 boolean 타입이 아니면 NULL을 반환합니다.
```
mysql> SELECT id, j, json_extract_bool(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+------------------------------+
| id   | j                                                             | json_extract_bool(`j`, '$') |
+------+---------------------------------------------------------------+------------------------------+
|    1 |                                                          NULL |                         NULL |
|    2 |                                                          null |                         NULL |
|    3 |                                                          true |                            1 |
|    4 |                                                         false |                            0 |
|    5 |                                                           100 |                         NULL |
|    6 |                                                         10000 |                         NULL |
|    7 |                                                    1000000000 |                         NULL |
|    8 |                                           1152921504606846976 |                         NULL |
|    9 |                                                          6.18 |                         NULL |
|   10 |                                                        "abcd" |                         NULL |
|   11 |                                                            {} |                         NULL |
|   12 |                                         {"k1":"v31","k2":300} |                         NULL |
|   13 |                                                            [] |                         NULL |
|   14 |                                                     [123,456] |                         NULL |
|   15 |                                                 ["abc","def"] |                         NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                         NULL |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                         NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                         NULL |
|   26 |                                          {"k1":"v1","k2":200} |                         NULL |
+------+---------------------------------------------------------------+------------------------------+
19 rows in set (0.01 sec)

mysql> SELECT id, j, json_extract_bool(j, '$[1]') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+---------------------------------+
| id   | j                                                             | json_extract_bool(`j`, '$[1]') |
+------+---------------------------------------------------------------+---------------------------------+
|    1 |                                                          NULL |                            NULL |
|    2 |                                                          null |                            NULL |
|    3 |                                                          true |                            NULL |
|    4 |                                                         false |                            NULL |
|    5 |                                                           100 |                            NULL |
|    6 |                                                         10000 |                            NULL |
|    7 |                                                    1000000000 |                            NULL |
|    8 |                                           1152921504606846976 |                            NULL |
|    9 |                                                          6.18 |                            NULL |
|   10 |                                                        "abcd" |                            NULL |
|   11 |                                                            {} |                            NULL |
|   12 |                                         {"k1":"v31","k2":300} |                            NULL |
|   13 |                                                            [] |                            NULL |
|   14 |                                                     [123,456] |                            NULL |
|   15 |                                                 ["abc","def"] |                            NULL |
|   16 |                              [null,true,false,100,6.18,"abc"] |                               1 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                            NULL |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                            NULL |
|   26 |                                          {"k1":"v1","k2":200} |                            NULL |
+------+---------------------------------------------------------------+---------------------------------+
19 rows in set (0.01 sec)
```

- json_extract_isnull은 필드가 JSON null 타입인지 확인하며, 필드가 JSON null이면 1을, 그렇지 않으면 0을 반환합니다.
- JSON null은 SQL NULL과 다릅니다. SQL NULL은 필드에 값이 없음을 나타내지만, JSON null은 필드에 특수 값인 null이 있음을 나타냅니다.
```
mysql> SELECT id, j, json_extract_isnull(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_extract_isnull(`j`, '$') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                              1 |
|    3 |                                                          true |                              0 |
|    4 |                                                         false |                              0 |
|    5 |                                                           100 |                              0 |
|    6 |                                                         10000 |                              0 |
|    7 |                                                    1000000000 |                              0 |
|    8 |                                           1152921504606846976 |                              0 |
|    9 |                                                          6.18 |                              0 |
|   10 |                                                        "abcd" |                              0 |
|   11 |                                                            {} |                              0 |
|   12 |                                         {"k1":"v31","k2":300} |                              0 |
|   13 |                                                            [] |                              0 |
|   14 |                                                     [123,456] |                              0 |
|   15 |                                                 ["abc","def"] |                              0 |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              0 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              0 |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                              0 |
|   26 |                                          {"k1":"v1","k2":200} |                              0 |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.03 sec)

```

##### json_exists_path로 JSON에 필드가 있는지 확인 {#check-if-a-field-is-existed-in-json-by-json_exists_path}

```
mysql> SELECT id, j, json_exists_path(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+-----------------------------+
| id   | j                                                             | json_exists_path(`j`, '$') |
+------+---------------------------------------------------------------+-----------------------------+
|    1 |                                                          NULL |                        NULL |
|    2 |                                                          null |                           1 |
|    3 |                                                          true |                           1 |
|    4 |                                                         false |                           1 |
|    5 |                                                           100 |                           1 |
|    6 |                                                         10000 |                           1 |
|    7 |                                                    1000000000 |                           1 |
|    8 |                                           1152921504606846976 |                           1 |
|    9 |                                                          6.18 |                           1 |
|   10 |                                                        "abcd" |                           1 |
|   11 |                                                            {} |                           1 |
|   12 |                                         {"k1":"v31","k2":300} |                           1 |
|   13 |                                                            [] |                           1 |
|   14 |                                                     [123,456] |                           1 |
|   15 |                                                 ["abc","def"] |                           1 |
|   16 |                              [null,true,false,100,6.18,"abc"] |                           1 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                           1 |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                           1 |
|   26 |                                          {"k1":"v1","k2":200} |                           1 |
+------+---------------------------------------------------------------+-----------------------------+
19 rows in set (0.02 sec)

mysql> SELECT id, j, json_exists_path(j, '$.k1') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_exists_path(`j`, '$.k1') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                              0 |
|    3 |                                                          true |                              0 |
|    4 |                                                         false |                              0 |
|    5 |                                                           100 |                              0 |
|    6 |                                                         10000 |                              0 |
|    7 |                                                    1000000000 |                              0 |
|    8 |                                           1152921504606846976 |                              0 |
|    9 |                                                          6.18 |                              0 |
|   10 |                                                        "abcd" |                              0 |
|   11 |                                                            {} |                              0 |
|   12 |                                         {"k1":"v31","k2":300} |                              1 |
|   13 |                                                            [] |                              0 |
|   14 |                                                     [123,456] |                              0 |
|   15 |                                                 ["abc","def"] |                              0 |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              0 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              0 |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                              1 |
|   26 |                                          {"k1":"v1","k2":200} |                              1 |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.03 sec)

mysql> SELECT id, j, json_exists_path(j, '$[2]') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+--------------------------------+
| id   | j                                                             | json_exists_path(`j`, '$[2]') |
+------+---------------------------------------------------------------+--------------------------------+
|    1 |                                                          NULL |                           NULL |
|    2 |                                                          null |                              0 |
|    3 |                                                          true |                              0 |
|    4 |                                                         false |                              0 |
|    5 |                                                           100 |                              0 |
|    6 |                                                         10000 |                              0 |
|    7 |                                                    1000000000 |                              0 |
|    8 |                                           1152921504606846976 |                              0 |
|    9 |                                                          6.18 |                              0 |
|   10 |                                                        "abcd" |                              0 |
|   11 |                                                            {} |                              0 |
|   12 |                                         {"k1":"v31","k2":300} |                              0 |
|   13 |                                                            [] |                              0 |
|   14 |                                                     [123,456] |                              0 |
|   15 |                                                 ["abc","def"] |                              0 |
|   16 |                              [null,true,false,100,6.18,"abc"] |                              1 |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] |                              1 |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} |                              0 |
|   26 |                                          {"k1":"v1","k2":200} |                              0 |
+------+---------------------------------------------------------------+--------------------------------+
19 rows in set (0.02 sec)


```

##### json_type으로 JSON 필드의 데이터 타입 확인 {#get-the-datatype-of-a-field-in-json-by-json_type}

- JSON 경로로 지정한 필드의 데이터 타입을 반환하며, 필드가 없으면 NULL을 반환합니다.
```
mysql> SELECT id, j, json_type(j, '$') FROM test_json ORDER BY id;
+------+---------------------------------------------------------------+----------------------+
| id   | j                                                             | json_type(`j`, '$') |
+------+---------------------------------------------------------------+----------------------+
|    1 |                                                          NULL | NULL                 |
|    2 |                                                          null | null                 |
|    3 |                                                          true | bool                 |
|    4 |                                                         false | bool                 |
|    5 |                                                           100 | int                  |
|    6 |                                                         10000 | int                  |
|    7 |                                                    1000000000 | int                  |
|    8 |                                           1152921504606846976 | bigint               |
|    9 |                                                          6.18 | double               |
|   10 |                                                        "abcd" | string               |
|   11 |                                                            {} | object               |
|   12 |                                         {"k1":"v31","k2":300} | object               |
|   13 |                                                            [] | array                |
|   14 |                                                     [123,456] | array                |
|   15 |                                                 ["abc","def"] | array                |
|   16 |                              [null,true,false,100,6.18,"abc"] | array                |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] | array                |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | object               |
|   26 |                                          {"k1":"v1","k2":200} | object               |
+------+---------------------------------------------------------------+----------------------+
19 rows in set (0.02 sec)

mysql> select id, j, json_type(j, '$.k1') from test_json order by id;
+------+---------------------------------------------------------------+-------------------------+
| id   | j                                                             | json_type(`j`, '$.k1') |
+------+---------------------------------------------------------------+-------------------------+
|    1 |                                                          NULL | NULL                    |
|    2 |                                                          null | NULL                    |
|    3 |                                                          true | NULL                    |
|    4 |                                                         false | NULL                    |
|    5 |                                                           100 | NULL                    |
|    6 |                                                         10000 | NULL                    |
|    7 |                                                    1000000000 | NULL                    |
|    8 |                                           1152921504606846976 | NULL                    |
|    9 |                                                          6.18 | NULL                    |
|   10 |                                                        "abcd" | NULL                    |
|   11 |                                                            {} | NULL                    |
|   12 |                                         {"k1":"v31","k2":300} | string                  |
|   13 |                                                            [] | NULL                    |
|   14 |                                                     [123,456] | NULL                    |
|   15 |                                                 ["abc","def"] | NULL                    |
|   16 |                              [null,true,false,100,6.18,"abc"] | NULL                    |
|   17 |                            [{"k1":"v41","k2":400},1,"a",3.14] | NULL                    |
|   18 | {"k1":"v31","k2":300,"a1":[{"k1":"v41","k2":400},1,"a",3.14]} | string                  |
|   26 |                                          {"k1":"v1","k2":200} | string                  |
+------+---------------------------------------------------------------+-------------------------+
19 rows in set (0.03 sec)

```

### FAQ {#faq}

1. JSON의 null과 SQL의 NULL(즉, IS NULL)에는 차이가 있나요?

네, 차이가 있습니다. JSON에서 null(예: {"key1": null})은 key1이라는 키가 존재하며 그 값이 명시적으로 null임을 의미합니다. 이는 JSON 바이너리로 인코딩되는 특수 타입입니다.

반면 SQL NULL(IS NULL을 사용하는 경우)은 JSON 객체에 해당 키가 아예 없음을 나타낼 수 있습니다.

예를 들어:

``` sql
mysql> SELECT JSON_EXTRACT_STRING('{"key1" : null}', "$.key1") IS NULL;
+----------------------------------------------------------+
| JSON_EXTRACT_STRING('{"key1" : null}', "$.key1") IS NULL |
+----------------------------------------------------------+
|                                                        0 |
+----------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SELECT JSON_EXTRACT_STRING('{"key1" : null}', "$.key_not_exist") IS NULL;
+-------------------------------------------------------------------+
| JSON_EXTRACT_STRING('{"key1" : null}', "$.key_not_exist") IS NULL |
+-------------------------------------------------------------------+
|                                                                 1 |
+-------------------------------------------------------------------+
1 row in set (0.01 sec)
```

2. `GET_JSON_XXX` 함수와 `JSON_EXTRACT_XXX` 함수는 어떻게 다르며, 어떤 것을 선택해야 하나요?

`GET_JSON_XXX` 함수는 문자열 타입에 사용하도록 설계되어 원시 JSON 문자열에서 값을 직접 추출합니다. `JSON_EXTRACT_XXX` 함수는 JSON 데이터 타입 전용으로 구현되어 해당 타입에 최적화되어 있습니다.


### 키워드 {#keywords}
JSONB, JSON, json_parse, json_parse_error_to_null, json_parse_error_to_value, json_extract, json_extract_isnull, json_extract_bool, json_extract_int, json_extract_bigint, json_extract_double, json_extract_string, json_exists_path, json_type
