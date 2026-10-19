---
{
    "title": "HLL (HyperLogLog)",
    "language": "ko",
    "description": "HLL"
}
---

## HLL (HyperLogLog) {#hll-hyperloglog}
### 설명 {#description}
HLL

HLL은 키 컬럼으로 사용할 수 없습니다. QUANTILE_STATE 타입의 컬럼은 Aggregate 테이블, Duplicate 테이블 및 Unique 테이블에서 사용할 수 있습니다. Aggregate 테이블에서 사용하는 경우 테이블 생성 시 집계 유형은 QUANTILE_UNION입니다.
사용자는 길이와 기본값을 지정할 필요가 없습니다.
길이는 데이터 집계 정도에 따라 시스템 내부에서 조절됩니다.
또한 HLL 컬럼은 대응하는 hll_union_agg, hll_raw_agg, hll_cardinality, hll_hash를 통해서만 쿼리하거나 사용할 수 있습니다.

HLL은 고유한 요소의 개수를 근사적으로 계산하며, 데이터 양이 많을 때 Count Distinct보다 성능이 뛰어납니다.
HLL의 오차는 일반적으로 1% 정도이며, 경우에 따라 2%에 이를 수 있습니다.

### 예제 {#example}

    select hour, HLL_UNION_AGG(pv) over(order by hour) uv from(
       select hour, HLL_RAW_AGG(device_id) as pv
       from metric_table -- Query the accumulated UV per hour
       where datekey=20200922
    group by hour order by 1
    ) final;
    
### 키워드 {#keywords}
HLL,HYPERLOGLOG
