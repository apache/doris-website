---
{
    "title": "MAP_FILTER",
    "language": "ko",
    "description": "람다 표현식 또는 Boolean 배열을 사용하여 맵 항목을 필터링합니다"
}
---

<version since="dev">

</version>

## 설명 {#description}

맵의 항목을 필터링하여 선택된 항목만 포함하는 맵을 반환합니다.

람다 형식은 모든 항목에 대해 Boolean 표현식을 평가합니다. 람다는 각 항목의 키와 값을 인자로 받습니다. Boolean 배열 형식은 배열의 각 위치에 대응하는 맵 항목을 선택합니다.

## 구문 {#syntax}

```sql
MAP_FILTER((<key>, <value>) -> <predicate>, <map>)
MAP_FILTER(<map>, <filter_array>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<key>` | 맵 항목의 키를 나타내는 람다 매개변수입니다. |
| `<value>` | 맵 항목의 값을 나타내는 람다 매개변수입니다. |
| `<predicate>` | 각 맵 항목에 대해 평가하는 Boolean 표현식입니다. 평가 결과가 `TRUE`인 항목은 유지됩니다. |
| `<map>` | `MAP<K, V>` 표현식입니다. |
| `<filter_array>` | `ARRAY<BOOLEAN>` 표현식입니다. 각 요소는 같은 위치에 있는 맵 항목의 선택 여부를 결정합니다. 배열의 길이는 맵의 항목 수와 같아야 합니다. |

## 반환값 {#return-value}

선택된 항목을 포함하는 `MAP<K, V>`를 반환합니다.

- 람다 형식에서는 조건식의 평가 결과가 `FALSE` 또는 `NULL`인 항목이 제거됩니다.
- Boolean 배열 형식에서는 `FALSE` 또는 `NULL` 요소에 대응하는 항목이 제거됩니다.
- `<map>`이 비어 있으면 빈 맵을 반환합니다.
- `<map>`이 `NULL`이면 `NULL`을 반환합니다.
- Boolean 배열 형식에서 `<filter_array>`가 `NULL`이면 `NULL`을 반환합니다.

## 예제 {#examples}

```sql
SELECT map_filter((k, v) -> v >= 20, map(1, 10, 2, 20, 3, 30)) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {2:20, 3:30} |
+--------------+
```

```sql
SELECT map_filter(
    (k, v) -> if(k = 1, CAST(NULL AS BOOLEAN), TRUE),
    map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {2:20} |
+--------+
```

```sql
SELECT map_filter(map(1, 10, 2, 20), [TRUE, FALSE]) AS result;
```

```text
+--------+
| result |
+--------+
| {1:10} |
+--------+
```

```sql
SELECT map_filter((k, v) -> TRUE, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
