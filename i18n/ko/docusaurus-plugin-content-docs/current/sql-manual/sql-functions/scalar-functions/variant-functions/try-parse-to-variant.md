---
{
    "title": "TRY_PARSE_TO_VARIANT",
    "language": "ko",
    "description": "하나의 JSON 값을 VARIANT로 파싱하려고 시도합니다. 키가 너무 길거나 중복되면 오류 대신 SQL NULL을 반환하며, 유효한 JSON이 아닌 텍스트는 문자열로 유지합니다."
}
---

## 설명 {#description}

`TRY_PARSE_TO_VARIANT`는 하나의 완전한 JSON 값을 `VARIANT`로 파싱하려고 시도합니다. `TRY_` 접두사는 파싱 오류가 발생하면 쿼리를 실패시키는 대신 SQL `NULL`을 반환한다는 의미입니다. 기본적으로 유효한 JSON이 아닌 텍스트는 파싱 오류로 처리되지 않습니다. 반환 값을 참조하세요. 이 함수는 Doris 4.1.4 이상에서 사용할 수 있으며, 이 페이지는 Doris 5.0.0 이상에서의 동작을 설명합니다.

## 구문 {#syntax}

```sql
TRY_PARSE_TO_VARIANT(<json_value>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<json_value>` | `CHAR`, `VARCHAR` 또는 `STRING` 타입으로 하나의 완전한 JSON 값을 포함하는 표현식이거나, `JSON`/`JSONB` 표현식입니다. JSON/JSONB 입력은 JSON 텍스트로 변환된 후 VARIANT로 파싱됩니다. |

## 반환 값 {#return-value}

NULL을 허용하는 `VARIANT` 값을 반환합니다.

- 유효한 입력은 파싱된 VARIANT 값으로 반환됩니다.
- 다음 파싱 오류는 SQL `NULL`을 반환합니다. 객체 키의 길이가 `variant_max_json_key_length`바이트(BE 설정, 기본값 255)를 초과하는 경우, 한 객체에 중복 키가 있는 경우(BE 설정 `variant_enable_duplicate_json_path_check`가 `true`이면 첫 번째 값을 유지하므로 예외), 중첩 깊이가 128단계를 초과하는 경우, 문자열이 유효한 UTF-8이 아닌 경우입니다.
- 유효한 JSON이 아닌 텍스트와 [-2^63, 2^64 - 1] 범위를 벗어나는 정수 또는 `DOUBLE` 범위를 벗어나는 숫자를 포함하는 JSON은 [PARSE_TO_VARIANT](./parse-to-variant.md)와 마찬가지로 VARIANT 문자열로 반환됩니다. 이러한 입력은 SQL `NULL`을 반환하는 조건인 BE 설정 `variant_throw_exeception_on_invalid_json`이 `true`(기본값 `false`)인 경우에만 SQL NULL로 반환됩니다.
- 빈 문자열은 빈 객체 `{}`를 반환합니다.
- SQL `NULL` 입력은 SQL `NULL`을 반환합니다.
- JSON 리터럴 `null`은 VARIANT `null`을 반환하며, SQL `NULL`을 반환하지 않습니다.

## 예제 {#example}

유효한 값은 유지하고 파싱 오류는 SQL `NULL`로 변환합니다.

```sql
SELECT CAST(
           TRY_PARSE_TO_VARIANT('{"id": 1}')
           AS STRING
       ) AS valid_value,
       TRY_PARSE_TO_VARIANT('{"id": 1, "id": 2}') IS NULL AS duplicate_is_null,
       TRY_PARSE_TO_VARIANT(NULL) IS NULL AS input_is_null;
```

```text
+-------------+-------------------+---------------+
| valid_value | duplicate_is_null | input_is_null |
+-------------+-------------------+---------------+
| {"id":1}    |                 1 |             1 |
+-------------+-------------------+---------------+
```

JSON/JSONB 입력을 파싱합니다.

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

JSON `null`은 SQL `NULL`이 아니며, 유효한 JSON이 아닌 텍스트는 문자열로 유지됩니다.

```sql
SELECT TRY_PARSE_TO_VARIANT('null') IS NULL AS json_null_is_sql_null,
       VARIANT_TYPE(TRY_PARSE_TO_VARIANT('{"id":')) AS invalid_json_type;
```

```text
+-----------------------+-------------------+
| json_null_is_sql_null | invalid_json_type |
+-----------------------+-------------------+
|                     0 | string            |
+-----------------------+-------------------+
```

## 사용 시 참고 사항 {#usage-notes}

- 파싱 오류가 발생했을 때 쿼리를 실패시켜 데이터 품질 문제를 드러내려면 [PARSE_TO_VARIANT](./parse-to-variant.md)를 사용하세요.
- 이 함수는 파싱 오류만 SQL `NULL`로 변환하며, 유효한 JSON `null` 값의 의미는 변경하지 않습니다.
- Stream Load와 같은 데이터 적재 작업은 이 함수와 동일한 규칙으로 JSON 텍스트를 파싱합니다. [파싱 오류](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#parse-errors)를 참조하세요.
