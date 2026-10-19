---
{
    "title": "MAP_SIZE",
    "language": "ko",
    "description": "Map에 포함된 요소 수를 계산합니다"
}
---

## 설명 {#description}

Map에 포함된 요소 수를 계산합니다.

## 구문 {#syntax}

```sql
MAP_SIZE(<map>)
```

## 매개변수 {#parameters}
- `<map>`: [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 타입의 입력 Map입니다.
## 반환값 {#return-value}
Map에 포함된 요소 수를 반환합니다.

## 사용 시 참고 사항 {#usage-notes}
1. NULL인 키와 값도 모두 개수에 포함됩니다.
2. 매개변수가 NULL이면 NULL을 반환합니다.

## 예제 {#examples}
1. 일반 매개변수
    ```sql
    select map_size(map()), map_size(map(1, "100", 0.1, 2, null, null));
    ```

    ```text
    +-----------------+---------------------------------------------+
    | map_size(map()) | map_size(map(1, "100", 0.1, 2, null, null)) |
    +-----------------+---------------------------------------------+
    |               0 |                                           3 |
    +-----------------+---------------------------------------------+
    ```
2. NULL 매개변수
    ```sql
    select map_size(NULL);
    ```
    ```text
    +----------------+
    | map_size(NULL) |
    +----------------+
    |           NULL |
    +----------------+
    ```
