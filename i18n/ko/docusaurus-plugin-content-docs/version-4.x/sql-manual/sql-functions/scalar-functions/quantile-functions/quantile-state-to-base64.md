---
{
    "title": "QUANTILE_STATE_TO_BASE64",
    "language": "ko"
}
---

## 설명 {#description}

QUANTILE_STATE 타입의 데이터를 base64로 인코딩된 문자열로 변환합니다.

## 구문 {#syntax}

```sql
QUANTILE_STATE_TO_BASE64(<quantile_state_input>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<quantile_state_input>` | QUANTILE_STATE 타입의 데이터입니다. |

## 반환값 {#return-value}

QUANTILE_STATE를 Base64로 인코딩한 문자열을 반환합니다.
QUANTILE_STATE가 `NULL`이면 `NULL`을 반환합니다.

::: note

QUANTILE_STATE 내 요소의 순서는 보장되지 않으므로, 동일한 QUANTILE_STATE 내용으로 생성한 base64 결과가 항상 같다고 보장할 수는 없습니다. 하지만 quantile_state_from_base64로 디코딩한 QUANTILE_STATE는 동일함이 보장됩니다.

:::

## 예제 {#examples}

```sql
select quantile_state_to_base64(quantile_state_empty());
```

```text
+--------------------------------------------------+
| quantile_state_to_base64(quantile_state_empty()) |
+--------------------------------------------------+
| AAAARQA=                                         |
+--------------------------------------------------+
```

```sql
select quantile_state_to_base64(to_quantile_state(1, 2048));
```

```text
+------------------------------------------------------+
| quantile_state_to_base64(to_quantile_state(1, 2048)) |
+------------------------------------------------------+
| AAAARQEAAAAAAADwPw==                                 |
+------------------------------------------------------+
```

```sql
select
  quantile_percent(
    quantile_union(
      quantile_state_from_base64(
        quantile_state_to_base64(to_quantile_state(1, 2048))
      )
    ),
    0.5
  ) as nested_test;
```

```text
+-------------+
| nested_test |
+-------------+
|           1 |
+-------------+
```

```sql
select quantile_state_to_base64(NULL);
```

```text
+--------------------------------+
| quantile_state_to_base64(NULL) |
+--------------------------------+
| NULL                           |
+--------------------------------+
```
