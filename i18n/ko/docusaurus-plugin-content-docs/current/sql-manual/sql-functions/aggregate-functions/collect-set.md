---
{
    "title": "COLLECT_SET",
    "language": "ko",
    "description": "지정된 컬럼의 모든 고유 값을 집계하고 중복 요소를 제거하여 집합 타입의 결과를 반환하는 집계 함수입니다."
}
---

## 설명 {#description}

지정된 컬럼의 모든 고유 값을 집계하고 중복 요소를 제거하여 집합 타입의 결과를 반환하는 집계 함수입니다.

## 별칭 {#alias}

- GROUP_UNIQ_ARRAY

## 구문 {#syntax}

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 배열에 넣을 값을 결정하는 표현식입니다. 지원되는 타입: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, TimestampNs, Timestamptz, IPV4, IPV6, UUID, String, Array, Map, Struct. |
| `<max_size>` | 결과 배열의 요소 수를 최대 max_size개로 제한하는 선택적 매개변수입니다. 지원되는 타입: Integer. |

## 반환 값 {#return-value}

중복을 제거한 후 NULL이 아닌 모든 값을 포함하는 ARRAY 타입을 반환합니다. 그룹에 유효한 데이터가 없으면 빈 배열을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE collect_set_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_set_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 10, 'a'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```

```sql
select collect_set(k1),collect_set(k1,2) from collect_set_test;
```

```text
+-----------------+-------------------+
| collect_set(k1) | collect_set(k1,2) |
+-----------------+-------------------+
| [2, 1, 3]       | [2, 1]            |
+-----------------+-------------------+
```

```sql
select k1,collect_set(k2),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```

```text
+------+-----------------+-------------------+
| k1   | collect_set(k2) | collect_set(k3,1) |
+------+-----------------+-------------------+
|    1 | [20, 10]        | ["a"]             |
|    2 | [200, 100]      | ["x"]             |
|    3 | []              | []                |
+------+-----------------+-------------------+
```
