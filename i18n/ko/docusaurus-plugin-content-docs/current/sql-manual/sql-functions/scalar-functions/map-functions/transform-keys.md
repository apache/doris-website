---
{
    "title": "TRANSFORM_KEYS",
    "language": "ko",
    "description": "맵의 모든 키를 변환합니다"
}
---

<version since="dev">

</version>

## 설명 {#description}

맵의 모든 항목에 람다 표현식을 적용하고, 변환된 키와 원래 값으로 새 맵을 생성합니다. 람다는 각 항목의 키와 값을 전달받습니다.

## 구문 {#syntax}

```sql
TRANSFORM_KEYS((<key>, <value>) -> <new_key>, <map>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<key>` | 맵 항목의 키를 나타내는 람다 매개변수입니다. |
| `<value>` | 맵 항목의 값을 나타내는 람다 매개변수입니다. |
| `<new_key>` | 반환되는 맵의 키를 생성하는 표현식입니다. MAP 키가 지원하는 타입이어야 합니다. |
| `<map>` | `MAP<K, V>` 표현식입니다. |

## 반환 값 {#return-value}

`MAP<K2, V>`를 반환합니다. 여기서 `K2`는 람다가 반환하는 타입입니다.

- 입력 맵의 값은 변경 없이 유지됩니다.
- `<map>`이 비어 있으면 빈 맵을 반환합니다.
- `<map>`이 `NULL`이면 `NULL`을 반환합니다.
- 람다가 반환한 `NULL` 키는 유지됩니다.
- 여러 항목이 동일한 키로 변환되면 마지막 항목의 값이 유지됩니다.

## 예제 {#examples}

```sql
SELECT transform_keys((k, v) -> k + 10, map(1, 10, 2, 20)) AS result;
```

```text
+----------------+
| result         |
+----------------+
| {11:10, 12:20} |
+----------------+
```

```sql
SELECT transform_keys((k, v) -> 1, map(1, 10, 2, 20)) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT transform_keys((k, v) -> k, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
