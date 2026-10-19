---
{
    "title": "PARSE_TO_VARIANT",
    "language": "ko",
    "description": "텍스트 또는 JSON/JSONB 표현식에서 하나의 완전한 JSON 값을 파싱하여 타입이 지정된 VARIANT 값으로 변환합니다."
}
---

## 설명 {#description}

`PARSE_TO_VARIANT`는 하나의 완전한 JSON 값을 `VARIANT`로 파싱합니다. JSON 객체, 배열, 문자열, 숫자, 불리언, JSON 리터럴 `null`을 입력으로 받습니다. 이 함수는 Doris 4.1.4 이상에서 사용할 수 있으며, 이 페이지에서는 Doris 5.0.0 이상의 동작을 설명합니다.

## 구문 {#syntax}

```sql
PARSE_TO_VARIANT(<json_value>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<json_value>` | 하나의 완전한 JSON 값을 포함하는 `CHAR`, `VARCHAR` 또는 `STRING` 표현식이나 `JSON`/`JSONB` 표현식입니다. JSON/JSONB 입력은 JSON 텍스트로 변환된 다음 VARIANT로 파싱됩니다. |

## 반환 값 {#return-value}

`VARIANT` 값을 반환합니다.

- SQL `NULL`을 입력하면 SQL `NULL`을 반환합니다.
- JSON 리터럴 `null`은 VARIANT `null`을 반환하며, 이는 SQL `NULL`과 다릅니다.
- 유효한 JSON이 아닌 텍스트는 VARIANT 문자열로 반환됩니다. [-2^63, 2^64 - 1] 범위를 벗어나는 정수나 `DOUBLE` 범위를 벗어나는 숫자가 포함된 JSON도 마찬가지로 전체 텍스트가 하나의 문자열이 됩니다. 이 동작은 BE 설정 `variant_throw_exeception_on_invalid_json`(기본값 `false`)로 제어되며, 값이 `true`이면 이러한 입력으로 인해 쿼리가 실패합니다.
- 빈 문자열은 빈 객체 `{}`를 반환합니다.
- JSON 파서 자체에서 거부할 정도로 깊게 중첩된 문서(약 1,000단계)는 유효하지 않은 JSON으로 간주되며, 이 역시 문자열로 반환됩니다.
- 객체 키가 `variant_max_json_key_length` 바이트(BE 설정, 기본값 255)보다 길거나, 객체에 중복 키가 있거나(BE 설정 `variant_enable_duplicate_json_path_check`가 `true`이면 첫 번째 값을 유지하므로 예외), 중첩 깊이가 128단계를 초과하거나, 문자열이 유효한 UTF-8이 아니면 쿼리가 실패합니다.

## 예제 {#example}

JSON 텍스트를 파싱합니다:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------+
| value                            |
+----------------------------------+
| {"id":42,"tags":["doris","sql"]} |
+----------------------------------+
```

JSON/JSONB 표현식을 파싱합니다:

```sql
SELECT CAST(
           PARSE_TO_VARIANT(CAST('{"id": 42}' AS JSON))
           AS STRING
       ) AS value;
```

```text
+-----------+
| value     |
+-----------+
| {"id":42} |
+-----------+
```

값을 추출하고 구체적인 SQL 타입으로 CAST합니다:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"user": {"id": 42}}')['user']['id']
           AS BIGINT
       ) AS user_id;
```

```text
+---------+
| user_id |
+---------+
|      42 |
+---------+
```

SQL `NULL`은 SQL `NULL`로 유지됩니다:

```sql
SELECT PARSE_TO_VARIANT(NULL) IS NULL AS is_sql_null;
```

```text
+-------------+
| is_sql_null |
+-------------+
|           1 |
+-------------+
```

유효한 JSON이 아닌 텍스트는 문자열로 유지됩니다:

```sql
SELECT CAST(PARSE_TO_VARIANT('{"id":') AS STRING) AS value,
       VARIANT_TYPE(PARSE_TO_VARIANT('{"id":'))    AS type;
```

```text
+--------+--------+
| value  | type   |
+--------+--------+
| {"id": | string |
+--------+--------+
```

중복 키가 있으면 오류를 반환합니다:

```sql
SELECT PARSE_TO_VARIANT('{"id": 1, "id": 2}');
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = [INVALID_ARGUMENT]Parse json document failed at row 0, error: [INVALID_ARGUMENT]Duplicate Variant object key
```

## 사용 시 참고 사항 {#usage-notes}

- [TRY_PARSE_TO_VARIANT](./try-parse-to-variant.md)를 사용하면 파싱 오류가 발생했을 때 쿼리가 실패하는 대신 SQL `NULL`을 반환합니다.
- `PARSE_TO_VARIANT`는 JSON을 명시적으로 파싱합니다. 반면 `CAST(string AS VARIANT)`와 VARIANT 열에 문자열을 넣는 `INSERT`는 입력을 VARIANT 문자열로 유지하며 JSON을 파싱하지 않습니다. JSON 텍스트를 `INSERT`로 기록하려면 `PARSE_TO_VARIANT`로 감싸세요. [데이터 쓰기](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#write-data)와 [VARIANT로 CAST](../../../basic-element/sql-data-types/semi-structured/VARIANT.md#cast-to-variant)를 참조하세요.
