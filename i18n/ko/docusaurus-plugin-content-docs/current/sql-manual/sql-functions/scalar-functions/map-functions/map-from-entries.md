---
{
    "title": "MAP_FROM_ENTRIES",
    "language": "ko",
    "description": "두 필드로 구성된 STRUCT 항목의 배열에서 MAP을 생성합니다"
}
---

## 설명 {#description}

배열에서 `MAP<K, V>`를 생성합니다. 배열의 각 요소는 두 필드로 구성된 `STRUCT`입니다. 첫 번째 필드는 키로, 두 번째 필드는 값으로 사용됩니다.

## 구문 {#syntax}

```sql
MAP_FROM_ENTRIES(<entries>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<entries>` | `ARRAY<STRUCT<K, V>>`입니다. 각 STRUCT는 정확히 두 개의 필드를 포함해야 합니다. 배열은 `NULL`일 수 있고, STRUCT 내부의 두 필드도 `NULL`일 수 있지만, 배열의 STRUCT 요소 자체는 `NULL`일 수 없습니다. `K`는 MAP 키에서 지원하는 타입이어야 합니다. |

## 반환값 {#return-value}

`MAP<K, V>`를 반환합니다.

- `<entries>`가 `NULL`이면 `NULL`을 반환합니다.
- `NULL` 필드는 이를 포함한 STRUCT가 `NULL`이 아니면 `NULL` 키 또는 값으로 유지됩니다.
- 배열의 STRUCT 요소 자체가 `NULL`이면 런타임 오류가 발생합니다.
- 입력이 STRUCT 배열이 아니거나 STRUCT의 필드 수가 두 개보다 적거나 많으면 분석 오류가 발생합니다.
- `K`가 MAP 키에서 지원하는 타입이 아니면 분석 오류가 발생합니다.
- 동일한 키가 여러 번 나타나면 마지막에 나타난 값이 유지됩니다.

## 예시 {#examples}

```sql
SELECT map_from_entries(array(struct(1, 10), struct(2, 20))) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_entries(array(struct(1, 10), struct(1, 20))) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>));
```

```text
+------------------------------------------------------------+
| map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>)) |
+------------------------------------------------------------+
| NULL                                                       |
+------------------------------------------------------------+
```

```sql
SELECT map_from_entries(array(
    struct(CAST(NULL AS INT), 10),
    struct(2, CAST(NULL AS INT)))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

다음 예시는 배열에 `NULL`인 STRUCT 요소가 포함되어 있어 실패합니다:

```sql
SELECT map_from_entries(array(CAST(NULL AS STRUCT<k:INT,v:INT>)));
```

```text
ERROR 1105 (HY000): Map entry of function map_from_entries cannot be null
```

다음 예시는 STRUCT에 필드가 세 개 있어 분석 단계에서 실패합니다:

```sql
SELECT map_from_entries(array(struct(1, 2, 3)));
```

```text
ERROR 1105 (HY000): map_from_entries requires an array of structs with exactly two fields
```
