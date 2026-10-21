---
{
    "title": "HLL_EMPTY",
    "language": "ko",
    "description": "HLLEMPTY는 요소가 없는 데이터 집합을 나타내는 빈 HLL (HyperLogLog) 값을 반환합니다."
}
---

## 설명 {#description}

`HLL_EMPTY`는 요소가 없는 데이터 집합을 나타내는 빈 HLL (HyperLogLog) 값을 반환합니다.

## 구문 {#syntax}

```sql
HLL_EMPTY()
```

## 반환 값 {#return-value}

요소가 없는 데이터 집합을 나타내는 빈 HLL 타입 값을 반환합니다.

## 예제 {#example}

```sql
select hll_cardinality(hll_empty());
```

```text
+------------------------------+
| hll_cardinality(hll_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```
