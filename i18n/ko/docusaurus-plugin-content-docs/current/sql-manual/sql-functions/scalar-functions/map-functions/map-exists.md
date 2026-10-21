---
{
    "title": "MAP_EXISTS",
    "language": "ko",
    "description": "맵에 조건을 만족하는 항목이 있는지 검사합니다"
}
---

<version since="dev">

</version>

## 설명 {#description}

람다 표현식으로 맵의 모든 항목을 검사하고, 지정된 조건을 만족하는 항목이 하나라도 있는지 반환합니다. 람다는 각 항목의 키와 값을 인자로 받습니다.

## 구문 {#syntax}

```sql
MAP_EXISTS((<key>, <value>) -> <predicate>, <map>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<key>` | 맵 항목의 키를 나타내는 람다 매개변수입니다. |
| `<value>` | 맵 항목의 값을 나타내는 람다 매개변수입니다. |
| `<predicate>` | 각 맵 항목에 대해 평가하는 Boolean 표현식입니다. |
| `<map>` | `MAP<K, V>` 표현식입니다. |

## 반환값 {#return-value}

`BOOLEAN` 값을 반환합니다.

- `TRUE` 반환: 하나 이상의 항목에서 조건식이 `TRUE`를 반환하는 경우.
- `FALSE` 반환: 맵이 비어 있는 경우를 포함하여 모든 항목에서 조건식이 `FALSE`를 반환하는 경우.
- `NULL` 반환: `TRUE`를 반환하는 항목이 없고 하나 이상의 항목이 `NULL`을 반환하는 경우.
- `<map>`이 `NULL`이면 `NULL`을 반환합니다.

## 예제 {#examples}

```sql
SELECT map_exists((k, v) -> v = 20, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
|      1 |
+--------+
```

```sql
SELECT map_exists((k, v) -> v > 20, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
|      0 |
+--------+
```

```sql
SELECT map_exists((k, v) -> CAST(NULL AS BOOLEAN), map(1, 10)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```

```sql
SELECT map_exists((k, v) -> v > 0, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
