---
{
    "title": "MAP_VALUES",
    "language": "ko",
    "description": "주어진 MAP에서 값을 추출하여 해당 타입의 ARRAY로 반환합니다."
}
---

## 설명 {#description}

주어진 [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md)에서 값을 추출하여 해당 타입의 [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)로 반환합니다.

## 구문 {#syntax}

```sql
MAP_VALUES(<map>)
```

## 매개변수 {#parameters}
- `<map>`: [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 타입이며, 입력 MAP의 내용을 나타냅니다.

## 반환값 {#return-value}
주어진 `map`에서 값을 추출하여 해당 타입의 [`ARRAY`](../../../basic-element/sql-data-types/semi-structured/ARRAY.md)로 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. 매개변수가 NULL이면 NULL을 반환합니다.
2. 빈 MAP 객체의 경우 빈 배열을 반환합니다.
3. MAP의 NULL 값도 반환되는 배열에 포함됩니다.

## 예제 {#examples}
1. 일반 매개변수
    ```sql
    select map_values(map()), map_values(map(1, "100", 0.1, 2, 0.3, null));
    ```

    ```text
    +-------------------+----------------------------------------------+
    | map_values(map()) | map_values(map(1, "100", 0.1, 2, 0.3, null)) |
    +-------------------+----------------------------------------------+
    | []                | ["100", "2", null]                           |
    +-------------------+----------------------------------------------+
    ```
2. NULL 매개변수
    ```sql
    select map_values(null);
    ```
    ```text
    +------------------+
    | map_values(null) |
    +------------------+
    | NULL             |
    +------------------+
    ```
