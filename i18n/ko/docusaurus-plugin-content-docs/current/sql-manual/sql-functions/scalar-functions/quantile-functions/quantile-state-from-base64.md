---
{
    "title": "QUANTILE_STATE_FROM_BASE64",
    "language": "ko"
}
---

## 설명 {#description}

base64로 인코딩된 문자열(일반적으로 `QUANTILE_STATE_TO_BASE64`로 생성됨)을 QUANTILE_STATE 타입으로 변환합니다. 입력 문자열이 유효하지 않거나 NULL이면 NULL을 반환합니다.

## 구문 {#syntax}

```sql
QUANTILE_STATE_FROM_BASE64(<input>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --------- | ----------- |
| `<input>` | base64로 인코딩된 문자열로, 일반적으로 `QUANTILE_STATE_TO_BASE64`로 생성됩니다. 문자열이 유효하지 않으면 NULL을 반환합니다. |

## 반환값 {#return-value}

base64 인코딩에서 파싱한 quantile_state를 반환합니다. 문자열이 유효하지 않으면 NULL을 반환합니다.

## 예제 {#examples}

```sql
select
  quantile_state_to_base64(
    quantile_state_from_base64(
      quantile_state_to_base64(to_quantile_state(1.0, 2048))
    )
  ) = quantile_state_to_base64(to_quantile_state(1.0, 2048)) AS equal_test;
```
```text
+------------+
| equal_test |
+------------+
|          1 |
+------------+
```

```sql
select quantile_state_from_base64('not_base64!');
```

```text
+-------------------------------------------+
| quantile_state_from_base64('not_base64!') |
+-------------------------------------------+
| NULL                                      |
+-------------------------------------------+
```

```sql
select quantile_state_from_base64(NULL);
```

```text
+----------------------------------+
| quantile_state_from_base64(NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```
