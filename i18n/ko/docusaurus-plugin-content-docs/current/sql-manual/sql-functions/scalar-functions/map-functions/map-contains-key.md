---
{
    "title": "MAP_CONTAINS_KEY",
    "language": "ko",
    "description": "주어진 map에 특정 키 key가 포함되어 있는지 확인합니다"
}
---

## 설명 {#description}

주어진 `map`에 특정 키 `key`가 포함되어 있는지 확인합니다.

## 구문 {#syntax}

```sql
MAP_CONTAINS_KEY(<map>, <key>)
```

## 매개변수 {#parameters}
- `<map>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md) 타입이며, 입력 map의 내용입니다.
- `<key>` [`MAP`](../../../basic-element/sql-data-types/semi-structured/MAP.md)에서 지원하는 키 타입이며, 검색할 키입니다.

## 반환 값 {#return-value}
주어진 `map`에 특정 키 `key`가 포함되어 있는지 확인합니다. 존재하면 1을, 존재하지 않으면 0을 반환합니다.

## 예제 {#examples}

```sql
select map_contains_key(map(null, 1, 2, null), null),map_contains_key(map(1, "100", 0.1, 2), 0.11);
```

```text
+-----------------------------------------------+-----------------------------------------------+
| map_contains_key(map(null, 1, 2, null), null) | map_contains_key(map(1, "100", 0.1, 2), 0.11) |
+-----------------------------------------------+-----------------------------------------------+
|                                             1 |                                             0 |
+-----------------------------------------------+-----------------------------------------------+
```
> Map에서 키를 비교할 때는 "null-safe equal"(null과 null을 같다고 간주)을 사용하며, 이는 다음과 다릅니다. 

```sql
select map_contains_key(map(null,1), null);
```
```text
+-------------------------------------+
| map_contains_key(map(null,1), null) |
+-------------------------------------+
|                                   1 |
+-------------------------------------+