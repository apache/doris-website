---
{
    "title": "MAP_APPLY",
    "language": "ko",
    "description": "맵의 키와 값을 변환합니다"
}
---

<version since="dev">

</version>

## 설명 {#description}

맵의 모든 항목에 람다 표현식을 적용하고, 변환된 키와 값으로 새 맵을 생성합니다. 람다는 각 항목의 키와 값을 받아 표현식 쌍을 반환합니다. 첫 번째 표현식은 새 키로, 두 번째 표현식은 새 값으로 사용됩니다.

## 구문 {#syntax}

```sql
MAP_APPLY((<key>, <value>) -> (<new_key>, <new_value>), <map>)
MAP_APPLY((<key>, <value>) -> STRUCT(<new_key>, <new_value>), <map>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<key>` | 맵 항목의 키를 나타내는 람다 매개변수입니다. |
| `<value>` | 맵 항목의 값을 나타내는 람다 매개변수입니다. |
| `<new_key>` | 반환되는 맵의 키를 생성하는 표현식입니다. 타입은 MAP 키에서 지원하는 타입이어야 합니다. |
| `<new_value>` | 반환되는 맵의 값을 생성하는 표현식입니다. |
| `<map>` | `MAP<K, V>` 표현식입니다. |

## 반환 값 {#return-value}

`MAP<K2, V2>`를 반환하며, `K2`와 `V2`는 각각 람다가 반환하는 첫 번째 필드와 두 번째 필드의 타입입니다.

- `<map>`이 비어 있으면 빈 맵을 반환합니다.
- `<map>`이 `NULL`이면 `NULL`을 반환합니다.
- 람다가 반환하는 `NULL` 필드는 `NULL` 키 또는 값으로 유지됩니다.
- 여러 항목이 동일한 키로 변환되면 마지막에 나타난 항목의 값이 유지됩니다.
- 람다는 필드가 정확히 두 개이며 NULL을 허용하지 않는 `STRUCT`를 반환해야 합니다. 튜플 구문 `(<new_key>, <new_value>)`는 `STRUCT(<new_key>, <new_value>)`와 동일합니다. NULL을 허용하는 struct 또는 필드 수가 다른 결과를 반환하면 분석 오류가 발생합니다.

## 예제 {#examples}

```sql
SELECT map_apply((k, v) -> (k + 10, v * 2), map(1, 10, 2, 20)) AS result;
```

```text
+------------------+
| result           |
+------------------+
| {11:20, 12:40}   |
+------------------+
```

```sql
SELECT map_apply((k, v) -> (1, v), map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_apply((k, v) -> (k, v), CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
