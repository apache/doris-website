---
{
    "title": "MAP_CONTAINS_VALUE",
    "language": "ko",
    "description": "주어진 map에 특정 값 value가 포함되어 있는지 확인합니다"
}
---

## 설명 {#description}

주어진 `map`에 특정 값 `value`가 포함되어 있는지 확인합니다.

## 구문 {#syntax}

```sql
MAP_CONTAINS_VALUE(<map>, <value>)
```

## 매개변수 {#parameters}
- `<map>`: [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 타입으로, 입력 map의 내용입니다.
- `<value>`: 여러 타입을 지원하며, 검색할 값입니다.

## 반환 값 {#return-value}
주어진 `map`에 특정 값 `value`가 포함되어 있는지 확인합니다. 존재하면 1을, 존재하지 않으면 0을 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. 매개변수 `<map>`이 NULL이면 NULL을 반환합니다.
2. `<value>`는 NULL일 수 있습니다. NULL 비교에는 `null-safe-equal`을 사용하므로 NULL은 NULL과 같은 것으로 간주됩니다.

## 예제 {#examples}
1. 일반 매개변수
    ```sql
    select map_contains_value(map(1, "100", 0.1, 2), 100), map_contains_value(map(1, "100", 0.1, 2), 101);
    ```
    ```text
    +------------------------------------------------+------------------------------------------------+
    | map_contains_value(map(1, "100", 0.1, 2), 100) | map_contains_value(map(1, "100", 0.1, 2), 101) |
    +------------------------------------------------+------------------------------------------------+
    |                                              1 |                                              0 |
    +------------------------------------------------+------------------------------------------------+
    ```
2. NULL 매개변수
    ```sql
    select map_contains_value(NULL, 100);
    ```
    ```text
    +-------------------------------+
    | map_contains_value(NULL, 100) |
    +-------------------------------+
    |                          NULL |
    +-------------------------------+
    ```
    ```sql
    select map_contains_value(map(null, null), null), map_contains_value(map(null, 100), null);
    ```
    ```text
    +-------------------------------------------+------------------------------------------+
    | map_contains_value(map(null, null), null) | map_contains_value(map(null, 100), null) |
    +-------------------------------------------+------------------------------------------+
    |                                         1 |                                        0 |
    +-------------------------------------------+------------------------------------------+
    ```
