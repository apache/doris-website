---
{
    "title": "ARRAY_AGG",
    "language": "ko",
    "description": "열의 값(null 값 포함)을 하나의 배열로 연결합니다. 행을 열로 피벗하는 데 사용할 수 있습니다."
}
---

## 설명 {#description}

열의 값(null 값 포함)을 하나의 배열로 연결합니다. 행을 열로 피벗하는 데 사용할 수 있습니다.

## 구문 {#syntax}

```sql
ARRAY_AGG(<col>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<col>` | 배열에 넣을 값을 결정하는 표현식입니다. 지원하는 타입: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, Timestamptz, IPV4, IPV6, String, Array, Map, Struct. |

## 반환 값 {#return-value}

ARRAY 타입의 값을 반환합니다. 특수한 경우는 다음과 같습니다:

- 배열 요소의 순서는 보장되지 않습니다.
- 변환으로 생성된 배열을 반환합니다. 배열 요소의 타입은 col의 타입과 일치합니다.


## 예제 {#example}

```sql
-- setup
CREATE TABLE test_doris_array_agg (
	c1 INT,
	c2 INT
) DISTRIBUTED BY HASH(c1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO test_doris_array_agg VALUES (1, 10), (1, 20), (1, 30), (2, 100), (2, 200), (3, NULL);
```

```sql
select c1, array_agg(c2) from test_doris_array_agg group by c1;
```

```text
+------+---------------+
| c1   | array_agg(c2) |
+------+---------------+
|    1 | [10, 20, 30]  |
|    2 | [100, 200]    |
|    3 | [null]        |
+------+---------------+
```

```sql
select array_agg(c2) from test_doris_array_agg where c1 is null;
```

```text
+---------------+
| array_agg(c2) |
+---------------+
| []            |
+---------------+
```
