---
{
    "title": "JSON과 다른 타입 간 형 변환",
    "language": "ko",
    "description": "Doris의 JSON 타입은 텍스트 대신 바이너리 인코딩으로 데이터를 저장하여 처리 및 저장 효율을 높입니다."
}
---

Doris의 JSON 타입은 텍스트 대신 바이너리 인코딩으로 데이터를 저장하여 처리 및 저장 효율을 높입니다. JSON 타입과 Doris 내부 타입은 일대일로 대응합니다.

## JSON으로 형 변환 {#cast-to-json}

### String에서 변환 {#from-string}

문자열을 JSON으로 형 변환할 때 문자열의 내용은 [RFC7159](https://datatracker.ietf.org/doc/html/rfc7159)에 정의된 유효한 JSON 구문을 따라야 합니다. 파서는 문자열의 유효성을 검사하고 해당 JSON 바이너리 형식으로 변환합니다.

#### 문자열 파싱 규칙 {#string-parsing-rules}

- 문자열에 유효한 JSON 구조(객체, 배열, 숫자, 불리언 또는 null)가 포함되어 있으면 해당 JSON 타입으로 파싱됩니다:
  ```sql
  mysql> SELECT CAST('[1,2,3,4]' AS JSON); -- Output: [1,2,3,4] (parsed as JSON array)
  +---------------------------+
  | CAST('[1,2,3,4]' AS JSON) |
  +---------------------------+
  | [1,2,3,4]                 |
  +---------------------------+
  ```

- 문자열을 파싱하지 않고 문자열 자체를 JSON 문자열 값으로 취급하려면 `TO_JSON` 함수를 사용합니다:
  ```sql
  mysql> SELECT TO_JSON('[1,2,3,4]'); -- Output: "[1,2,3,4]" (a JSON string with quotes)
  +----------------------+
  | TO_JSON('[1,2,3,4]') |
  +----------------------+
  | "[1,2,3,4]"          |
  +----------------------+
  ```

#### 숫자 파싱 규칙 {#numeric-parsing-rules}

JSON 문자열에서 숫자 값을 파싱할 때는 다음 규칙이 적용됩니다:

- 숫자에 소수점이 포함되어 있으면 JSON Double 타입으로 변환됩니다:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key');
  +------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123.45}' AS JSON), '$.key')   |
  +------------------------------------------------------+
  | double                                               |
  +------------------------------------------------------+
  ```

- 숫자가 정수이면 해당 값을 표현할 수 있는 가장 작은 정수 타입으로 저장됩니다:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key');
  +---------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":123456789}' AS JSON), '$.key')   |
  +---------------------------------------------------------+
  | int                                                     |
  +---------------------------------------------------------+
  ```

  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key');
  +-------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":1234567891234}' AS JSON), '$.key')   |
  +-------------------------------------------------------------+
  | bigint                                                      |
  +-------------------------------------------------------------+
  ```

- 정수가 Int128 범위를 초과하면 double로 저장되며 정밀도가 손실될 수 있습니다:
  ```sql
  mysql> SELECT JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key');
  +--------------------------------------------------------------------------------------------------+
  | JSON_TYPE(CAST('{"key":12345678901234567890123456789012345678901234567890}' AS JSON), '$.key')   |
  +--------------------------------------------------------------------------------------------------+
  | double                                                                                           |
  +--------------------------------------------------------------------------------------------------+
  ```

#### 오류 처리 {#error-handling}

문자열을 JSON으로 파싱할 때:
- 엄격 모드(기본값)에서는 JSON 구문이 유효하지 않으면 오류가 발생합니다
- 비엄격 모드에서는 JSON 구문이 유효하지 않으면 NULL을 반환합니다

```sql
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
+-----------------------------+
| CAST('{"invalid JSON' AS JSON) |
+-----------------------------+
| NULL                        |
+-----------------------------+

mysql> SET enable_strict_cast = true;
mysql> SELECT CAST('{"invalid JSON' AS JSON);
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]Failed to parse json string: {"invalid JSON, ...
```

### 다른 Doris 타입에서 변환 {#from-other-doris-types}

다음 Doris 타입은 정밀도 손실 없이 JSON으로 직접 형 변환할 수 있습니다:

| Doris 타입 | JSON 타입 |
|------------|-----------|
| BOOLEAN | Bool |
| TINYINT | Int8 |
| SMALLINT | Int16 |
| INT | Int32 |
| BIGINT | Int64 |
| LARGEINT | Int128 |
| FLOAT | Float |
| DOUBLE | Double |
| DECIMAL | Decimal |
| STRING | String |
| ARRAY | Array |
| STRUCT | Object |

#### 예시 {#examples}

```sql
-- Integer array to JSON
mysql> SELECT CAST(ARRAY(123,456,789) AS JSON);
+----------------------------------+
| CAST(ARRAY(123,456,789) AS JSON) |
+----------------------------------+
| [123,456,789]                    |
+----------------------------------+

-- Decimal array to JSON (preserves precision)
mysql> SELECT CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON);
+--------------------------------------------------------------------------+
| CAST(ARRAY(12345678.12345678,0.00000001,12.000000000000000001) AS JSON)  |
+--------------------------------------------------------------------------+
| [12345678.123456780000000000,0.000000010000000000,12.000000000000000001] |
+--------------------------------------------------------------------------+
```

#### 직접 지원되지 않는 타입 {#types-not-directly-supported}

위 테이블에 없는 타입은 JSON으로 직접 형 변환할 수 없습니다:

```sql
mysql> SELECT CAST(MAKEDATE(2021, 1) AS JSON);
ERROR 1105 (HY000): CAST AS JSONB can only be performed between JSONB, String, Number, Boolean, Array, Struct types. Got Date to JSONB
```

해결 방법: 먼저 호환되는 타입으로 형 변환한 다음 JSON으로 변환합니다:

```sql
mysql> SELECT CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON);
+---------------------------------------------------+
| CAST(CAST(MAKEDATE(2021, 1) AS BIGINT) AS JSON)   |
+---------------------------------------------------+
| 20210101                                          |
+---------------------------------------------------+
```

## JSON에서 형 변환 {#cast-from-json}

:::caution 동작 변경
4.0 버전 이전에는 Doris의 JSON CAST 동작에 대한 제약이 느슨했으며 오버플로 상황을 적절히 처리하지 못했습니다.

4.0 버전부터는 JSON CAST 중 오버플로가 발생하면 엄격 모드에서는 오류가 발생하고 비엄격 모드에서는 null을 반환합니다.
:::

### Boolean으로 변환 {#to-boolean}

JSON의 Bool, Number, String 타입은 BOOLEAN으로 형 변환할 수 있습니다:

```sql
-- From JSON Bool
mysql> SELECT CAST(CAST('true' AS JSON) AS BOOLEAN);
+---------------------------------------+
| CAST(CAST('true' AS JSON) AS BOOLEAN) |
+---------------------------------------+
|                                     1 |
+---------------------------------------+

-- From JSON Number
mysql> SELECT CAST(CAST('123' AS JSON) AS BOOLEAN);
+--------------------------------------+
| CAST(CAST('123' AS JSON) AS BOOLEAN) |
+--------------------------------------+
|                                    1 |
+--------------------------------------+

-- From JSON String (must contain valid boolean representation)
mysql> SELECT CAST(TO_JSON('true') AS BOOLEAN);
+----------------------------------+
| CAST(TO_JSON('true') AS BOOLEAN) |
+----------------------------------+
|                                1 |
+----------------------------------+
```

### 숫자 타입으로 변환 {#to-numeric-types}

JSON의 Bool, Number, String 타입은 숫자 타입(TINYINT, SMALLINT, INT, BIGINT, LARGEINT, FLOAT, DOUBLE, DECIMAL)으로 형 변환할 수 있습니다:

```sql
-- From JSON Number to INT
mysql> SELECT CAST(CAST('123' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('123' AS JSON) AS INT) |
+----------------------------------+
|                              123 |
+----------------------------------+

-- From JSON Bool to numeric types
mysql> SELECT CAST(CAST('true' AS JSON) AS INT), CAST(CAST('false' AS JSON) AS DOUBLE);
+-----------------------------------+--------------------------------------+
| CAST(CAST('true' AS JSON) AS INT) | CAST(CAST('false' AS JSON) AS DOUBLE) |
+-----------------------------------+--------------------------------------+
|                                 1 |                                    0 |
+-----------------------------------+--------------------------------------+
```

표현 범위가 더 작은 타입으로 형 변환할 때는 숫자 오버플로 규칙이 적용됩니다:

```sql
-- In strict mode, overflow causes error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
ERROR 1105 (HY000): Cannot cast from jsonb value type 12312312312312311 to doris type INT

-- In non-strict mode, overflow returns NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(12312312312312311) AS INT);
+-----------------------------------------+
| CAST(TO_JSON(12312312312312311) AS INT) |
+-----------------------------------------+
|                                    NULL |
+-----------------------------------------+
```

### String으로 변환 {#to-string}

모든 JSON 타입은 STRING으로 형 변환할 수 있으며, 결과는 JSON의 텍스트 표현입니다:

```sql
mysql> SELECT CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING);
+----------------------------------------------------------+
| CAST(CAST('{"key1":"value1","key2":123}' AS JSON) AS STRING) |
+----------------------------------------------------------+
| {"key1":"value1","key2":123}                             |
+----------------------------------------------------------+

mysql> SELECT CAST(CAST('true' AS JSON) AS STRING);
+--------------------------------------+
| CAST(CAST('true' AS JSON) AS STRING) |
+--------------------------------------+
| true                                 |
+--------------------------------------+
```

### Array로 변환 {#to-array}

JSON의 Array 및 String 타입은 Doris의 ARRAY 타입으로 형 변환할 수 있습니다:

```sql
mysql> SELECT CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>);
+-------------------------------------------+
| CAST(TO_JSON(ARRAY(1,2,3)) AS ARRAY<INT>) |
+-------------------------------------------+
| [1, 2, 3]                                 |
+-------------------------------------------+

-- Type conversion within array elements
mysql> SELECT CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>);
+-------------------------------------------------+
| CAST(TO_JSON(ARRAY(1.2,2.3,3.4)) AS ARRAY<INT>) |
+-------------------------------------------------+
| [1, 2, 3]                                       |
+-------------------------------------------------+

-- Convert string to array
mysql> SELECT CAST(TO_JSON("['123','456']") AS ARRAY<INT>);
+----------------------------------------------+
| CAST(TO_JSON("['123','456']") AS ARRAY<INT>) |
+----------------------------------------------+
| [123, 456]                                   |
+----------------------------------------------+
```

배열의 각 요소는 표준 형 변환 규칙에 따라 개별적으로 변환됩니다:

```sql
-- In non-strict mode, invalid elements become NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
+---------------------------------------------------+
| CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>) |
+---------------------------------------------------+
| [10, 20, null]                                    |
+---------------------------------------------------+

-- In strict mode, invalid elements cause error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(TO_JSON(ARRAY(10,20,200)) AS ARRAY<TINYINT>);
ERROR 1105 (HY000): Cannot cast from jsonb value type 200 to doris type TINYINT
```

### Struct로 변환 {#to-struct}

JSON의 Object 및 String 타입은 Doris의 STRUCT 타입으로 형 변환할 수 있습니다:

```sql
mysql> SELECT CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>);
+------------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":"456"}' AS JSON) AS STRUCT<key1:INT,key2:STRING>) |
+------------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                   |
+------------------------------------------------------------------------------+

mysql> SELECT CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>);
+----------------------------------------------------------------------------+
| CAST(TO_JSON('{"key1":123,"key2":"456"}') AS STRUCT<key1:INT,key2:STRING>) |
+----------------------------------------------------------------------------+
| {"key1":123, "key2":"456"}                                                 |
+----------------------------------------------------------------------------+
```

struct의 각 필드는 지정된 타입에 따라 개별적으로 변환됩니다:

```sql
mysql> SELECT CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>);
+--------------------------------------------------------------------------------------------------------------------------+
| CAST(CAST('{"key1":[123.45,678.90],"key2":[12312313]}' AS JSON) AS STRUCT<key1:ARRAY<DOUBLE>,key2:ARRAY<BIGINT>>) |
+--------------------------------------------------------------------------------------------------------------------------+
| {"key1":[123.45, 678.9], "key2":[12312313]}                                                                              |
+--------------------------------------------------------------------------------------------------------------------------+
```

JSON과 struct 정의의 필드 개수 및 이름이 일치해야 합니다:

```sql
-- In non-strict mode, mismatched fields return NULL
mysql> SET enable_strict_cast = false;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
+-------------------------------------------------------------------------+
| CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>) |
+-------------------------------------------------------------------------+
| NULL                                                                    |
+-------------------------------------------------------------------------+

-- In strict mode, mismatched fields cause error
mysql> SET enable_strict_cast = true;
mysql> SELECT CAST(CAST('{"key1":123,"key2":456}' AS JSON) AS STRUCT<key1:INT>);
ERROR 1105 (HY000): jsonb_value field size 2 is not equal to struct size 1
```

### JSON Null 처리 {#json-null-handling}

JSON null은 SQL NULL과 구별됩니다:

- JSON 필드에 null 값이 포함되어 있으면 어떤 Doris 타입으로 형 변환하더라도 SQL NULL이 반환됩니다:

```sql
mysql> SELECT CAST(CAST('null' AS JSON) AS INT);
+----------------------------------+
| CAST(CAST('null' AS JSON) AS INT) |
+----------------------------------+
|                             NULL |
+----------------------------------+
```

## 타입 변환 요약 {#type-conversion-summary}

| JSON 타입 | 형 변환 가능한 대상 |
|-----------|---------------|
| Bool | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| Null | (항상 SQL NULL로 변환됨) |
| Number | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING |
| String | BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DOUBLE, FLOAT, DECIMAL, STRING, ARRAY, STRUCT |
| Array | STRING, ARRAY |
| Object | STRING, STRUCT |

### 키워드 {#keywords}
JSON, JSONB, CAST, 형 변환, to_json
