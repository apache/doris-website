---
{
    "title": "JSON_EACH_OUTER",
    "language": "ko",
    "description": "최상위 JSON 객체를 키/값 쌍의 집합으로 확장하며, value 열은 JSON 타입을 유지합니다. json_each와 달리 입력이 NULL이거나 빈 객체이면 0행 대신 NULL로 구성된 한 행을 반환합니다. LATERAL VIEW와 함께 사용해야 합니다."
}
---

## 설명 {#description}

`json_each_outer` 테이블 함수는 최상위 JSON 객체를 키/값 쌍의 집합으로 확장합니다. 각 행에는 하나의 키(`key`)와 그에 대응하는 값(`value`)이 포함됩니다. `value` 열은 JSON 타입을 유지하므로 문자열 값은 JSON 따옴표를 유지한 채 반환됩니다.

[`json_each`](json-each.md)와 달리, 입력이 NULL이거나 빈 객체이면 `json_each_outer`는 0행 대신 `NULL, NULL`로 구성된 한 행을 반환합니다.

[`LATERAL VIEW`](../../../query-data/lateral-view.md)와 함께 사용해야 합니다.

## 구문 {#syntax}

```sql
JSON_EACH_OUTER(<json_str>)
```

## 매개변수 {#parameters}

| 매개변수    | 설명                                                   |
| ------------ | ------------------------------------------------------------- |
| `<json_str>` | 확장할 JSON 문자열입니다. 내용은 JSON 객체여야 합니다. |

## 반환 값 {#return-value}

여러 열과 여러 행으로 구성된 데이터를 반환합니다. 각 행은 JSON 객체의 키/값 쌍 하나에 해당합니다:

| 열  | 타입   | 설명                                                                             |
| ------- | ------ | --------------------------------------------------------------------------------------- |
| `key`   | String | JSON 객체의 키 이름                                                       |
| `value` | JSON   | JSON 타입으로 유지되는 해당 값(문자열 값에는 따옴표가 포함됨, 예: `"foo"`) |

특수한 경우:

- `<json_str>`이 NULL이면 `NULL, NULL`로 구성된 1행을 반환합니다.
- `<json_str>`이 빈 객체(`{}`)이면 `NULL, NULL`로 구성된 1행을 반환합니다.

## 예제 {#examples}

기본 사용법: 문자열 값을 가진 JSON 객체 확장

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer('{"a":"foo","b":"bar"}') t AS k, v;
```

```text
+---+-------+
| k | v     |
+---+-------+
| a | "foo" |
| b | "bar" |
+---+-------+
```

NULL 매개변수: NULL로 구성된 1행 반환

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer(NULL) t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```

빈 객체: NULL로 구성된 1행 반환

```sql
SELECT k, v
FROM (SELECT 1) dummy
LATERAL VIEW json_each_outer('{}') t AS k, v;
```

```text
+------+------+
| k    | v    |
+------+------+
| NULL | NULL |
+------+------+
```
