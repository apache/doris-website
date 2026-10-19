---
{
    "title": "GROUP_ARRAY_UNION",
    "language": "ko",
    "description": "입력 배열의 각 행에 있는 모든 요소를 중복 없이 합친 새 배열을 반환합니다."
}
---

## 설명 {#description}

입력 배열의 각 행에 있는 모든 요소를 중복 없이 합친 새 배열을 반환합니다.

## 구문 {#syntax}

```sql
GROUP_ARRAY_UNION(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 합집합을 계산할 표현식입니다. 지원되는 타입은 Array<Type>입니다. Array 내에 복합 타입을 중첩하는 것은 지원하지 않습니다. |

## 반환 값 {#return-value}

합집합 결과를 담은 배열을 반환합니다. 그룹에 유효한 데이터가 없으면 빈 배열을 반환합니다.

## 예제 {#example}


```sql
-- setup
CREATE TABLE group_array_union_test (
	id INT,
	c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_union_test VALUES
	(1, ['a', 'b', 'c', 'd', 'e']),
	(2, ['a', 'b']),
	(3, ['a', null]),
	(4, NULL);
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test;
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "c", "e", "b", "d", "a"]   |
+-----------------------------------+
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (3,4);
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| [null, "a"]                       |
+-----------------------------------+
```

```sql
select GROUP_ARRAY_UNION(c_array_string) from group_array_union_test where id in (4);
```

```text
+-----------------------------------+
| GROUP_ARRAY_UNION(c_array_string) |
+-----------------------------------+
| []                                |
+-----------------------------------+
```
