---
{
    "title": "NANOSECONDS_DIFF",
    "language": "ko",
    "description": "두 날짜 및 시간 값 간의 차이를 나노초 단위로 반환합니다."
}
---

## 설명 {#description}

두 날짜 및 시간 값 간의 차이를 나노초 단위로 반환합니다. 결과는 `<end_time> - <start_time>`입니다.

## 구문 {#syntax}

```sql
NANOSECONDS_DIFF(<end_time>, <start_time>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<end_time>` | 종료 시간입니다. 인수 중 하나 이상은 `TIMESTAMP_NS`여야 하며, 다른 인수는 `TIMESTAMP_NS` 또는 `DATETIME`일 수 있습니다. |
| `<start_time>` | 시작 시간입니다. 인수 중 하나 이상은 `TIMESTAMP_NS`여야 하며, 다른 인수는 `TIMESTAMP_NS` 또는 `DATETIME`일 수 있습니다. |

## 반환 값 {#return-value}

`BIGINT` 값을 반환하며, 이 값은 `<end_time> - <start_time>`을 나노초 단위로 나타냅니다. 인수 중 하나라도 `NULL`이면 `NULL`을 반환합니다.

결과가 양수이면 종료 시간이 시작 시간보다 늦다는 뜻이고, 음수이면 더 이르다는 뜻입니다. 결과는 `BIGINT` 범위 내에 있어야 하며, 그렇지 않으면 함수가 오버플로 오류를 보고합니다.

## 예제 {#example}

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1969-12-31 23:59:59.999999999' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
|    2 |
+------+
```

인수로 `TIMESTAMP_NS`와 `DATETIME`을 함께 사용할 수 있습니다:

```sql
SELECT NANOSECONDS_DIFF(
    CAST('1970-01-01 00:00:00.000000001' AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000' AS DATETIME(6))
) AS diff;
```

```text
+------+
| diff |
+------+
|    1 |
+------+
```

```sql
SELECT NANOSECONDS_DIFF(
    CAST(NULL AS TIMESTAMP_NS),
    CAST('1970-01-01 00:00:00.000000000' AS TIMESTAMP_NS)
) AS diff;
```

```text
+------+
| diff |
+------+
| NULL |
+------+
```
