---
{
    "title": "GROUP_ARRAY_INTERSECT",
    "language": "ko",
    "description": "모든 행에 걸쳐 입력 배열의 교집합을 구하고 새 배열로 반환합니다."
}
---

## 설명 {#description}

모든 행에 걸쳐 입력 배열의 교집합을 구하고 새 배열로 반환합니다.

## 구문 {#syntax}

```sql
GROUP_ARRAY_INTERSECT(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<expr>` | 교집합을 구할 표현식입니다. 지원되는 타입: Array. |

## 반환 값 {#return-value}

교집합 결과를 포함하는 배열을 반환합니다. 그룹에 유효한 데이터가 없으면 빈 배열을 반환합니다.

## 예제 {#example}

```sql
-- setup
CREATE TABLE group_array_intersect_test (
    id INT,
    c_array_string ARRAY<STRING>
) DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO group_array_intersect_test VALUES
    (1, ['a', 'b', 'c', 'd', 'e']),
    (2, ['a', 'b']),
    (3, ['a', null]);
```

```sql
select group_array_intersect(c_array_string) from group_array_intersect_test;
```

```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| ["a"]                                 |
+---------------------------------------+
```

```sql
select group_array_intersect(c_array_string) from group_array_intersect_test where id is null;
```

```text
+---------------------------------------+
| group_array_intersect(c_array_string) |
+---------------------------------------+
| []                                    |
+---------------------------------------+
```
