---
{
    "title": "QUANTILE_STATE",
    "language": "ko",
    "description": "QUANTILESTATE"
}
---

## QUANTILE_STATE {#quantile_state}
### 설명 {#description}

QUANTILE_STATE

**2.0에서는 [agg_state](AGG-STATE.md) 함수를 지원하며, 이 타입 대신 agg_state quantile_union(quantile_state not null)을 사용하는 것을 권장합니다.**

QUANTILE_STATE는 키 컬럼으로 사용할 수 없습니다. QUANTILE_STATE 타입의 컬럼은 Aggregate 테이블, Duplicate 테이블 및 Unique 테이블에서 사용할 수 있습니다. Aggregate 테이블에서 사용할 때는 테이블 생성 시 집계 타입을 QUANTILE_UNION으로 지정합니다.

사용자는 길이와 기본값을 지정할 필요가 없습니다. 길이는 데이터 집계 정도에 따라 시스템 내부에서 제어됩니다.
QUANTILE_STATE 컬럼은 함께 제공되는 QUANTILE_PERCENT, QUANTILE_UNION 및 TO_QUANTILE_STATE 함수를 통해서만 쿼리하거나 사용할 수 있습니다.
QUANTILE_STATE는 분위수의 근삿값을 계산하는 타입입니다. 동일한 키를 가진 서로 다른 값은 데이터 적재 과정에서 사전 집계됩니다. 집계된 값의 개수가 2048을 넘지 않으면 모든 데이터를 상세히 기록합니다. 집계된 값의 개수가 2048보다 크면 [TDigest] (https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf) 알고리즘을 사용하여 데이터를 집계(클러스터링)하고 클러스터링 후의 중심점을 저장합니다.

관련 함수:

    QUANTILE_UNION(QUANTILE_STATE):
      
      This function is an aggregation function, which is used to aggregate the intermediate results of different quantile calculations. The result returned by this function is still QUANTILE_STATE

    
    TO_QUANTILE_STATE(DOUBLE raw_data [,FLOAT compression]):
       
       This function converts a numeric type to a QUANTILE_STATE type
       The compression parameter is optional and can be set in the range [2048, 10000]. 
       The larger the value, the higher the precision of quantile approximation calculations, the greater the memory consumption, and the longer the calculation time.
       An unspecified or set value for the compression parameter is outside the range [2048, 10000], run with the default value of 2048

    QUANTILE_PERCENT(QUANTILE_STATE, percent):
       This function converts the intermediate result variable (QUANTILE_STATE) of the quantile calculation into a specific quantile value

    
### 주의 사항 {#notice}

현재 QUANTILE_STATE는 Aggregate Model 테이블에서만 사용할 수 있습니다. 사용하기 전에 다음 명령으로 QUANTILE_STATE 타입 기능을 활성화해야 합니다:

```
$ mysql-client > admin set frontend config("enable_quantile_state_type"="true");
```

이 방식으로 설정한 구성은 FE 프로세스가 다시 시작되면 초기화됩니다. 영구적으로 설정하려면 fe.conf에 `enable_quantile_state_type=true` 구성을 추가하면 됩니다.


### 예제 {#example}
    select QUANTILE_PERCENT(QUANTILE_UNION(v1), 0.5) from test_table group by k1, k2, k3;
    

### 키워드 {#keywords}

    QUANTILE_STATE, QUANTILE_UNION, TO_QUANTILE_STATE, QUANTILE_PERCENT
