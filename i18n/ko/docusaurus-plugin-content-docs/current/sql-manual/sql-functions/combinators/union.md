---
{
    "title": "UNION",
    "language": "ko",
    "description": "여러 집계 중간 결과를 하나로 집계합니다. 결과 타입은 aggstate입니다."
}
---

## 설명 {#description}

여러 집계 중간 결과를 하나로 집계합니다.
결과 타입은 agg_state이며, 함수 시그니처는 입력 매개변수와 일치합니다.

## 구문 {#syntax}

`AGGREGATE_FUNCTION_UNION(agg_state)`

## 예제 {#example}
```
mysql [test]>select avg_merge(t) from (select avg_union(avg_state(1)) as t from d_table group by k1)p;
+----------------+
| avg_merge(`t`) |
+----------------+
|              1 |
+----------------+
```
### 키워드 {#keywords}
AGG_STATE, UNION
