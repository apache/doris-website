---
{
    "title": "TRANSFORM_VALUES",
    "language": "ko",
    "description": "맵의 모든 값을 변환합니다"
}
---

<version since="dev">

</version>

## 설명 {#description}

맵의 각 항목에 람다 표현식을 적용하여 원래 키와 변환된 값으로 새 맵을 생성합니다. 람다는 각 항목의 키와 값을 인수로 받습니다.

## 구문 {#syntax}

```sql
TRANSFORM_VALUES((<key>, <value>) -> <new_value>, <map>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<key>` | 맵 항목의 키를 나타내는 람다 매개변수입니다. |
| `<value>` | 맵 항목의 값을 나타내는 람다 매개변수입니다. |
| `<new_value>` | 반환되는 맵의 값을 생성하는 표현식입니다. |
| `<map>` | `MAP<K, V>` 표현식입니다. |

## 반환 값 {#return-value}

`MAP<K, V2>`를 반환하며, `V2`는 람다가 반환하는 값의 타입입니다.

- 입력 맵의 키는 변경 없이 유지됩니다.
- `<map>`이 비어 있으면 빈 맵을 반환합니다.
- `<map>`이 `NULL`이면 `NULL`을 반환합니다.
- 람다가 반환한 `NULL` 값은 그대로 유지됩니다.

## 예제 {#examples}

```sql
SELECT transform_values((k, v) -> v + k, map(1, 10, 2, 20)) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:11, 2:22} |
+--------------+
```

```sql
SELECT transform_values(
    (k, v) -> if(k = 1, CAST(NULL AS INT), v),
    map(1, 10, 2, 20)) AS result;
```

```text
+----------------+
| result         |
+----------------+
| {1:null, 2:20} |
+----------------+
```

```sql
SELECT transform_values((k, v) -> v, CAST(NULL AS MAP<INT, INT>)) AS result;
```

```text
+--------+
| result |
+--------+
| NULL   |
+--------+
```
