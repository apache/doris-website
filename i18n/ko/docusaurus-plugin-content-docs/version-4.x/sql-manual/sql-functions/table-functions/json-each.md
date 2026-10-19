---
{
    "title": "JSON_EACH",
    "language": "ko",
    "description": "최상위 JSON 객체를 키/값 쌍의 집합으로 펼칩니다. 값 열은 JSON 타입을 유지합니다. LATERAL VIEW와 함께 사용해야 합니다."
}
---

## 설명 {#description}

`json_each` 테이블 함수는 최상위 JSON 객체를 키/값 쌍의 집합으로 펼칩니다. 각 행에는 키(`key`) 하나와 해당 값(`value`)이 포함됩니다. `value` 열은 JSON 타입을 유지하므로 문자열 값은 JSON 따옴표가 보존된 상태로 반환됩니다.

반드시 [`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}

```sql
JSON_EACH(<json_str>)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                          |
| ------------ | ---------------------------------------------------- |
| `<json_str>` | 펼칠 JSON 문자열입니다. 내용은 JSON 객체여야 합니다. |

## 반환 값 {#return-value}

여러 열과 여러 행으로 구성된 데이터를 반환합니다. 각 행은 JSON 객체의 키-값 쌍 하나에 해당합니다.

| 열  | 타입   | 설명                                                                 |
|---------|--------|-----------------------------------------------------------------------------|
| `key`   | String | JSON 객체의 키 이름                                           |
| `value` | JSON   | JSON 타입으로 유지되는 해당 값(문자열 값에는 따옴표가 포함됨, 예: `"foo"`) |

특수한 경우:
- `<json_str>`이 NULL이면 0행을 반환합니다.
- `<json_str>`이 빈 객체(`{}`)이면 0행을 반환합니다.

## 예제 {#examples}

기본 사용법: 문자열 값을 포함한 JSON 객체 펼치기

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-------+
| k | v     |
+---+-------+
| a | "foo" |
| b | "bar" |
+---+-------+
```

> `value` 열은 JSON 타입이므로 문자열 값의 JSON 따옴표가 유지됩니다.

여러 타입의 값을 포함한 JSON 객체

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{"str":"hello","num":42,"bool":true,"null_val":null,"arr":[1,2]}') t AS k, v;
```

```text
+----------+---------+
| k        | v       |
+----------+---------+
| str      | "hello" |
| num      | 42      |
| bool     | true    |
| null_val | NULL    |
| arr      | [1,2]   |
+----------+---------+
```

NULL 매개변수: 0행 반환

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each(NULL) t AS k, v;
-- Empty set
```

빈 객체: 0행 반환

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each('{}') t AS k, v;
-- Empty set
```
