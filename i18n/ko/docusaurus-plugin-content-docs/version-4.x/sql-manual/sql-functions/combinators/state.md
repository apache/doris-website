---
{
    "title": "STATE",
    "language": "ko",
    "description": "집계 함수의 중간 결과를 반환합니다."
}
---

## 설명 {#description}

집계 함수의 중간 결과를 반환합니다. 이 결과는 후속 집계에 사용하거나 merge combiner를 통해 실제 계산 결과를 얻는 데 사용할 수 있으며, agg_state 타입의 테이블에 직접 기록하여 저장할 수도 있습니다.
결과 타입은 agg_state이며, agg_state의 함수 시그니처는 `AGGREGATE_FUNCTION(arg...)`입니다.

## 구문 {#syntax}

`AGGREGATE_FUNCTION_STATE(arg...)`

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
AGG_STATE,STATE
