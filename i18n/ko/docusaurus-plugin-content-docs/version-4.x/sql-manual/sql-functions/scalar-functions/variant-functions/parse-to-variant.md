---
{
    "title": "PARSE_TO_VARIANT",
    "language": "ko",
    "description": "텍스트 또는 JSON/JSONB 표현식에 포함된 하나의 완전한 JSON 값을 파싱하여 타입이 지정된 VARIANT 값으로 변환합니다."
}
---

## 설명 {#description}

`PARSE_TO_VARIANT`는 하나의 완전한 JSON 값을 `VARIANT`로 파싱합니다. JSON 객체, 배열, 문자열, 숫자, 불리언, JSON 리터럴 `null`을 입력으로 받습니다. 이 함수는 Doris 4.1.4 이상에서 사용할 수 있습니다.

## 구문 {#syntax}

```sql
PARSE_TO_VARIANT(<json_value>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<json_value>` | 하나의 완전한 JSON 값을 포함하는 `CHAR`, `VARCHAR` 또는 `STRING` 표현식이나 `JSON`/`JSONB` 표현식입니다. JSON/JSONB 입력은 JSON 텍스트로 변환된 후 VARIANT로 파싱됩니다. |

## 반환 값 {#return-value}

`VARIANT` 값을 반환합니다.

- SQL `NULL`을 입력하면 SQL `NULL`을 반환합니다.
- JSON 리터럴 `null`은 Variant/JSON `null`을 반환하며, 이는 SQL `NULL`과 다릅니다.
- 잘못된 JSON, 현재 유효성 검사 설정에 따라 거부되는 중복 객체 키, 지원되지 않는 깊이 또는 기타 유효성 검사 오류가 있으면 쿼리가 실패합니다.

## 예제 {#example}

JSON 텍스트 파싱:

```sql
SELECT CAST(
           PARSE_TO_VARIANT('{"id": 42, "tags": ["doris", "sql"]}')
           AS STRING
       ) AS value;
```

```text
+----------------------------------------+
| value                                  |
+----------------------------------------+
| {"id":42,"tags":["doris","sql"]}     |
+----------------------------------------+
```

JSON/JSONB 표현식 파싱:

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

값을 추출하고 구체적인 SQL 타입으로 CAST:

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

잘못된 JSON은 오류를 반환합니다:

```sql
SELECT PARSE_TO_VARIANT('{"id":');
```

```text
ERROR: Parse json document failed
```

## 사용 시 유의 사항 {#usage-notes}

- [TRY_PARSE_TO_VARIANT](./try-parse-to-variant)를 사용하면 잘못된 입력으로 쿼리가 실패하는 대신 SQL `NULL`이 반환됩니다.
- `PARSE_TO_VARIANT`는 JSON을 명시적으로 파싱합니다. 반면 `CAST(string AS VARIANT)`는 입력을 VARIANT 문자열로 유지하며 JSON을 파싱하지 않습니다. [VARIANT CAST 규칙](../../../basic-element/sql-data-types/semi-structured/VARIANT#supported-operations-and-cast-rules)을 참조하세요.
