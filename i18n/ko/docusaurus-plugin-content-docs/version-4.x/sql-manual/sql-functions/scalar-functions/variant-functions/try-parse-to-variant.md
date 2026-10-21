---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "ko",
    "description": "완전한 JSON 값 하나를 VARIANT로 파싱하려고 시도하며, 파싱이나 유효성 검사에 실패하면 SQL NULL을 반환합니다."
}
---

## 설명 {#description}

`TRY_PARSE_TO_VARIANT`는 완전한 JSON 값 하나를 `VARIANT`로 파싱하려고 시도합니다. 접두사 `TRY_`는 파싱 또는 유효성 검사 오류가 발생하면 쿼리를 실패시키는 대신 SQL `NULL`을 반환한다는 뜻입니다. 이 함수는 Doris 4.1.4 이상에서 사용할 수 있습니다.

## 구문 {#syntax}

```sql
TRY_PARSE_TO_VARIANT(<json_value>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<json_value>` | 완전한 JSON 값 하나를 포함하는 `CHAR`, `VARCHAR` 또는 `STRING` 표현식이나 `JSON`/`JSONB` 표현식입니다. JSON/JSONB 입력은 JSON 텍스트로 변환한 후 VARIANT로 파싱합니다. |

## 반환 값 {#return-value}

NULL을 허용하는 `VARIANT` 값을 반환합니다.

- 입력이 유효하면 파싱된 VARIANT 값을 반환합니다.
- JSON이 유효하지 않거나 그 밖의 파싱 또는 유효성 검사 오류가 발생하면 SQL `NULL`을 반환합니다.
- SQL `NULL`을 입력하면 SQL `NULL`을 반환합니다.
- 유효한 JSON 리터럴 `null`을 입력하면 Variant/JSON `null`을 반환하며, SQL `NULL`은 반환하지 않습니다.

## 예제 {#example}

유효한 값은 유지하고 유효하지 않은 JSON은 SQL `NULL`로 변환합니다:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT('{"id": 1}')
           AS STRING
       ) AS valid_value,
       TRY_PARSE_TO_VARIANT('{"id":') IS NULL AS invalid_is_null,
       TRY_PARSE_TO_VARIANT(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-----------------+---------------+
| valid_value | invalid_is_null | input_is_null |
+-------------+-----------------+---------------+
| {"id":1}    |               1 |             1 |
+-------------+-----------------+---------------+
```

JSON/JSONB 입력을 파싱합니다:

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT(CAST('[10, 20, 30]' AS JSON))
           AS STRING
       ) AS value;
```

```text
+------------+
| value      |
+------------+
| [10,20,30] |
+------------+
```

JSON `null`과 SQL `NULL`은 서로 구분됩니다:

```sql
SELECT TRY_PARSE_TO_VARIANT('null') IS NULL AS json_null_is_sql_null,
       TRY_PARSE_TO_VARIANT('{') IS NULL AS error_is_sql_null;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | error_is_sql_null |
+-----------------------+-------------------+
|                     0 |                 1 |
+-----------------------+-------------------+
```

## 사용 시 참고 사항 {#usage-notes}

- 유효하지 않은 입력에 대해 쿼리를 실패시키고 데이터 품질 오류를 드러내려면 [PARSE_TO_VARIANT](./parse-to-variant)를 사용하세요.
- 이 함수는 파싱 및 유효성 검사 실패만 SQL `NULL`로 변환하며, 유효한 JSON `null` 값의 의미는 변경하지 않습니다.
