---
{
    "title": "JSON_EACH_TEXT",
    "language": "ko",
    "description": "최상위 JSON 객체를 키/값 쌍의 집합으로 확장하며, 값 열은 일반 텍스트로 반환됩니다. LATERAL VIEW와 함께 사용해야 합니다."
}
---

## 설명 {#description}

`json_each_text` 테이블 함수는 최상위 JSON 객체를 키/값 쌍의 집합으로 확장합니다. 각 행에는 키 하나(`key`)와 그에 해당하는 값(`value`)이 포함됩니다. [`json_each`](json-each.md)와 달리 `value` 열은 TEXT 타입이므로 문자열 값이 JSON 따옴표 **없이** 반환됩니다.

[`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}

```sql
JSON_EACH_TEXT(<json_str>)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                          |
| ------------ | ---------------------------------------------------- |
| `<json_str>` | 확장할 JSON 문자열입니다. 내용은 JSON 객체여야 합니다. |

## 반환 값 {#return-value}

여러 열과 여러 행으로 구성된 데이터를 반환합니다. 각 행은 JSON 객체의 키/값 쌍 하나에 해당합니다.

| 열  | 타입 | 설명                                                                          |
|---------|------|--------------------------------------------------------------------------------------|
| `key`   | TEXT | JSON 객체의 키 이름                                                     |
| `value` | TEXT | 일반 텍스트로 표현된 해당 값(문자열 값에는 따옴표가 없음, 예: `foo`) |

특수한 경우:
- `<json_str>`이 NULL이면 0개의 행을 반환합니다.
- `<json_str>`이 빈 객체(`{}`)이면 0개의 행을 반환합니다.
- JSON `null` 값은 SQL `NULL`로 반환됩니다.

## 예제 {#examples}

기본 사용법: 문자열 값을 가진 JSON 객체 확장

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-----+
| k | v   |
+---+-----+
| a | foo |
| b | bar |
+---+-----+
```

> `value` 열은 TEXT 타입이므로 문자열 값에 JSON 따옴표가 **없습니다**(`json_each`와 다름).

여러 타입의 값을 가진 JSON 객체

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{"str":"hello","num":42,"bool":true,"null_val":null}') t AS k, v;
```

```text
+----------+-------+
| k        | v     |
+----------+-------+
| str      | hello |
| num      | 42    |
| bool     | true  |
| null_val | NULL  |
+----------+-------+
```

> JSON `null` 값은 SQL `NULL`에 매핑됩니다.

NULL 매개변수: 0개의 행 반환

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text(NULL) t AS k, v;
-- Empty set
```

빈 객체: 0개의 행 반환

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_text('{}') t AS k, v;
-- Empty set
```
