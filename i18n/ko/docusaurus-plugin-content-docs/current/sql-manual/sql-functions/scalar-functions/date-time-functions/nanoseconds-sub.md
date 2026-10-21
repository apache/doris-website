---
{
    "title": "NANOSECONDS_SUB",
    "language": "ko",
    "description": "TIMESTAMP_NS 값에서 지정된 나노초 수를 뺍니다."
}
---

## 설명 {#description}

나노초 정밀도를 유지하면서 `TIMESTAMP_NS` 값에서 지정된 나노초 수를 뺍니다.

## 구문 {#syntax}

```sql
NANOSECONDS_SUB(<timestamp_ns>, <delta>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<timestamp_ns>` | 기준값으로, 타입은 `TIMESTAMP_NS`입니다. |
| `<delta>` | 뺄 나노초 수로, 타입은 `BIGINT`입니다. 음수이면 나노초를 더합니다. |

## 반환값 {#return-value}

`TIMESTAMP_NS`를 반환합니다. 인수 중 하나라도 `NULL`이면 `NULL`을 반환합니다. 결과가 `TIMESTAMP_NS` 범위를 벗어나면 오류를 보고합니다.

## 예제 {#example}

```sql
SELECT NANOSECONDS_SUB(
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS), 1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1969-12-31 23:59:59.999999999 |
+-------------------------------+
```

음수 delta는 나노초를 더합니다:

```sql
SELECT NANOSECONDS_SUB(
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS), -1
) AS result;
```

```text
+-------------------------------+
| result                        |
+-------------------------------+
| 1970-01-01 00:00:00.000000000 |
+-------------------------------+
```

```sql
SELECT NANOSECONDS_SUB(CAST(NULL AS TIMESTAMP_NS), 1) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
