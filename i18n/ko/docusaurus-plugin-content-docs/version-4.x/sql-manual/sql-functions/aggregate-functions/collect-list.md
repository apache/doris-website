---
{
    "title": "COLLECT_LIST",
    "language": "ko",
    "description": "열의 모든 값을 배열로 집계하는 집계 함수입니다."
}
---

## 설명 {#description}

열의 모든 값을 배열로 집계하는 집계 함수입니다.

## 별칭 {#alias}

- GROUP_ARRAY

## 구문 {#syntax}

```sql
COLLECT_LIST(<expr> [,<max_size>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 배열에 넣을 값을 결정하는 표현식입니다. 지원되는 타입: Bool, TinyInt, SmallInt, Integer, BigInt, LargeInt, Float, Double, Decimal, Date, Datetime, Timestamptz, IPV4, IPV6, String, Array, Map, Struct. |
| `<max_size>` | 결과 배열의 요소 수를 max_size개로 제한하는 선택적 매개변수입니다. 지원되는 타입: Integer. |

## 반환 값 {#return-value}

NULL이 아닌 모든 값을 포함하는 ARRAY 타입을 반환합니다. 그룹에 유효한 데이터가 없으면 빈 배열을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE collect_list_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_list_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 30, 'c'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```

```sql
select collect_list(k1),collect_list(k1,3) from collect_list_test;
```

```text
+--------------------+--------------------+
| collect_list(k1)   | collect_list(k1,3) |
+--------------------+--------------------+
| [1, 1, 1, 2, 2, 3] | [1, 1, 1]          |
+--------------------+--------------------+
```

```sql
select k1,collect_list(k2),collect_list(k3,1) from collect_list_test group by k1 order by k1;
```

```text
+------+------------------+--------------------+
| k1   | collect_list(k2) | collect_list(k3,1) |
+------+------------------+--------------------+
|    1 | [10, 20, 30]     | ["a"]              |
|    2 | [100, 200]       | ["x"]              |
|    3 | []               | []                 |
+------+------------------+--------------------+
```
