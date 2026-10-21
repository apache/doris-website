---
{
    "title": "MERGE",
    "language": "ko",
    "description": "집계된 중간 결과를 집계하고 계산하여 실제 결과를 얻습니다."
}
---

## 설명 {#description}

집계된 중간 결과를 집계하고 계산하여 실제 결과를 얻습니다.
결과의 타입은 `AGGREGATE_FUNCTION`과 일치합니다.

## 구문 {#syntax}

`AGGREGATE_FUNCTION_MERGE(agg_state)`

## 예제 {#example}
```
mysql [test]>select avg_merge(avg_state(1)) from d_table;
+-------------------------+
| avg_merge(avg_state(1)) |
+-------------------------+
|                       1 |
+-------------------------+
```
### 키워드 {#keywords}
AGG_STATE, MERGE
