---
{
    "title": "MAP_FROM_ARRAYS",
    "language": "ko",
    "description": "키 배열과 값 배열로 MAP을 생성합니다"
}
---

## 설명 {#description}

키 배열과 값 배열로 `MAP<K, V>`를 생성합니다. 같은 위치의 요소가 키-값 쌍을 이룹니다.

## 구문 {#syntax}

```sql
MAP_FROM_ARRAYS(<keys>, <values>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<keys>` | `ARRAY<K>` 형식의 배열입니다. `K`는 MAP 키에서 지원하는 타입이어야 합니다. 배열과 배열의 요소는 `NULL`일 수 있습니다. |
| `<values>` | `ARRAY<V>` 형식의 배열입니다. 배열과 배열의 요소는 `NULL`일 수 있습니다. 두 배열이 모두 `NULL`이 아닌 경우, 요소 수는 `<keys>`와 같아야 합니다. |

## 반환 값 {#return-value}

`MAP<K, V>`를 반환합니다.

- 입력 배열 중 하나라도 `NULL`이면 `NULL`을 반환합니다.
- `NULL` 요소는 결과에서 `NULL` 키 또는 값으로 유지됩니다.
- 두 배열이 모두 `NULL`이 아니지만 길이가 다르면 오류가 발생합니다. 어느 한 배열이 `NULL`이면 다른 배열의 길이는 검사하지 않습니다.
- 키가 여러 번 나타나면 마지막으로 나타난 값을 유지합니다.
- 인수가 배열이 아니거나 `K`가 MAP 키에서 지원하는 타입이 아니면 분석 오류가 발생합니다.

## 예제 {#examples}

```sql
SELECT map_from_arrays([1, 2], [10, 20]) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_arrays([1, 1], [10, 20]) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_arrays(CAST(NULL AS ARRAY<INT>), [10]);
```

```text
+-------------------------------------------------+
| map_from_arrays(CAST(NULL AS ARRAY<INT>), [10]) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```

```sql
SELECT map_from_arrays(
    array(CAST(NULL AS INT), 2),
    array(10, CAST(NULL AS INT))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

```sql
SELECT map_from_arrays([1, 2], [10]);
```

```text
ERROR 1105 (HY000): The key and value array offsets of function map_from_arrays must be identical
```
