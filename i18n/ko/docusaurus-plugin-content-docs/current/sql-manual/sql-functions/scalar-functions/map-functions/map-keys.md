---
{
    "title": "MAP_KEYS",
    "language": "ko",
    "description": "주어진 map에서 키를 추출하여 해당 타입의 ARRAY로 반환합니다."
}
---

## 설명 {#description}

주어진 `map`에서 키를 추출하여 해당 타입의 [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)로 반환합니다.

## 구문 {#syntax}

```sql
MAP_KEYS(<map>)
```

## 매개변수 {#parameters}
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 타입이며, 입력할 맵의 내용입니다.

## 반환값 {#return-value}
주어진 `map`에서 키를 추출하여 해당 타입의 [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)로 반환합니다.

## 예제 {#examples}
1. 일반 매개변수
    ```sql
    select map_keys(map()),map_keys(map(1, "100", 0.1, 2, null, null));
    ```
    ```text
    +-----------------+---------------------------------------------+
    | map_keys(map()) | map_keys(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    | []              | [1.0, 0.1, null]                            |
    +-----------------+---------------------------------------------+
    ```
2. NULL 매개변수
    ```sql
    select map_keys(NULL);
    ```
    ```text
    +----------------+
    | map_keys(NULL) |
    +----------------+
    | NULL           |
    +----------------+
    ```
