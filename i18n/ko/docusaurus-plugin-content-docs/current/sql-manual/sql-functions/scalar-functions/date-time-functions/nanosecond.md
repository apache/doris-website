---
{
    "title": "NANOSECOND",
    "language": "ko",
    "description": "DATE, DATETIME 또는 TIMESTAMP_NS 값에서 나노초 부분을 추출하며, DATETIME의 소수 초 부분 뒤에 영을 채워 아홉 자리로 맞춥니다."
}
---

## 설명 {#description}

`DATE`, `DATETIME` 또는 `TIMESTAMP_NS` 값에서 나노초 부분을 추출합니다. `DATE`의 경우 결과는 항상 0입니다. `DATETIME(p)`의 경우 소수 초 값 뒤에 영을 채워 아홉 자리로 맞춥니다. `TIMESTAMP_NS`의 경우 소수 초 부분의 아홉 자리를 모두 반환합니다.

## 구문 {#syntax}

```sql
NANOSECOND(<date>)
NANOSECOND(<datetime>)
NANOSECOND(<timestamp_ns>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<date>` | `DATE` 타입의 값입니다. |
| `<datetime>` | `DATETIME(p)` 타입의 값이며, `p`의 범위는 0부터 6까지입니다. |
| `<timestamp_ns>` | `TIMESTAMP_NS` 타입의 값입니다. |

## 반환 값 {#return-value}

`INT` 값을 반환하며, 범위는 `[0, 999999999]`입니다. `DATE` 입력은 0을 반환합니다. `DATETIME(p)` 입력은 소수 초 부분을 나노초로 표현한 값을 반환하며, 뒤에 영을 채워 아홉 자리로 맞춥니다. `TIMESTAMP_NS` 입력은 소수 초 부분의 아홉 자리를 모두 반환합니다. `NULL`은 입력이 `NULL`일 때 반환됩니다.

## 예제 {#example}

```sql
SELECT NANOSECOND(CAST('2024-02-29' AS DATE)) AS ns;
```

```text
+----+
| ns |
+----+
|  0 |
+----+
```

```sql
SELECT NANOSECOND(CAST('2024-02-29 12:34:56.123456' AS DATETIME(6))) AS ns;
```

```text
+-----------+
| ns        |
+-----------+
| 123456000 |
+-----------+
```

```sql
SELECT NANOSECOND(CAST('2024-02-29 12:34:56.123456789' AS TIMESTAMP_NS)) AS ns;
```

```text
+-----------+
| ns        |
+-----------+
| 123456789 |
+-----------+
```

```sql
SELECT NANOSECOND(CAST(NULL AS TIMESTAMP_NS)) AS ns;
```

```text
+------+
| ns   |
+------+
| NULL |
+------+
```
