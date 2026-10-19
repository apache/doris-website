---
{
    "title": "HLL 근사 중복 제거",
    "language": "ko",
    "description": "Doris에서 HLL (HyperLogLog)을 사용하여 근사 중복 제거를 수행하려면 어떻게 해야 할까요? 오차 범위는 1%-2%, 공간 복잡도는 O(mloglogn)이며, 대규모 UV / 카디널리티 통계에 적합합니다.",
    "keywords": [
        "HLL",
        "HyperLogLog",
        "근사 중복 제거",
        "카디널리티 통계",
        "UV 통계",
        "HLL_UNION_AGG",
        "HLL_HASH"
    ]
}
---

<!-- Knowledge type: Capability definition / Operational steps -->
<!-- Applicable scenarios: Large-scale data deduplication / UV statistics / Cardinality estimation -->

HLL (HyperLogLog)은 확률적 알고리즘에 기반한 근사 중복 제거 솔루션입니다. 1%-2%의 오차 범위 내에서 매우 적은 공간 및 시간 비용으로 대규모 데이터셋의 카디널리티(Distinct Count)를 계산합니다.

## 사용 사례 {#use-cases}

<!-- Knowledge type: Architecture selection decision -->

비즈니스 데이터의 양이 계속 증가하면서 정확한 중복 제거에 필요한 연산 및 저장 비용도 급격히 늘어납니다. 데이터가 일정 규모에 도달하면 정확한 중복 제거는 더 이상 경제적이지 않습니다.

HLL 알고리즘은 다음과 같은 특성을 갖습니다.

| 항목             | 특성                                                  |
| :--------------- | :---------------------------------------------------- |
| 공간 복잡도      | O(mloglogn)                                           |
| 시간 복잡도      | O(n)                                                  |
| 오차 범위        | 약 1%-2%(데이터셋 및 해시 함수에 따라 다름)             |

비즈니스에서 이러한 오차를 허용할 수 있다면, HLL을 이용한 근사 중복 제거는 연산 부담을 줄이고 쿼리 속도를 높이는 효과적인 방법입니다.

- 적합한 상황: 데이터 양이 방대하고, 1%-2%의 오차를 허용할 수 있으며, 쿼리 성능과 저장 비용 사이의 균형이 필요한 경우입니다.
- 사용 방법: 테이블을 생성할 때 컬럼 타입을 `HLL`로, 집계 함수를 `HLL_UNION`으로 설정합니다. 데이터 적재 시에는 `HLL_HASH()`로 HLL 값을 생성하고, 쿼리 시에는 `HLL_UNION_AGG()`로 집계합니다.
- 일반적인 용도: UV 통계, 사용자 중복 제거, 고유 기기 수 추정입니다.

## HyperLogLog란 {#what-is-hyperloglog}

<!-- Knowledge type: Principle explanation -->

HyperLogLog는 LogLog 알고리즘을 개선한 버전입니다. 카디널리티(distinct count)의 근삿값을 추정하며, 수학적 기반은 **베르누이 시행(Bernoulli trial)**입니다.

### 베르누이 시행의 직관적인 설명 {#an-intuitive-explanation-of-the-bernoulli-trial}

- 동전에 앞면과 뒷면이 있고, 한 번 던졌을 때 각 면이 나올 확률이 50%라고 가정합니다.
- 앞면이 나올 때까지 동전을 계속 던지고, 이 과정을 하나의 완전한 시행으로 기록합니다.
- 이를 n번 반복하면 앞면이 n번 나온 것입니다. 각 시행에서 동전을 던진 횟수를 k로 나타내고, i번째 시행을 k_i로 나타냅니다.
- n번의 시행에서 동전을 던진 횟수에는 반드시 최댓값이 존재하며, 이를 k_max로 나타냅니다(예를 들어, 어떤 시행에서는 앞면이 나올 때까지 12번을 던졌을 수 있습니다).

### 도출되는 결론 {#conclusions-derived}

- n번의 베르누이 시행에서 각 시행의 동전 던지기 횟수는 k_max 이하입니다.
- n번의 베르누이 시행 중 적어도 하나는 동전 던지기 횟수가 k_max와 같습니다.

최대 우도 추정을 적용하면 n과 k_max의 관계를 다음과 같이 추정할 수 있습니다. **n = 2 ^ k_max**.

즉, **k_max만 기록하면 전체 레코드 수, 다시 말해 카디널리티를 추정할 수 있습니다**. 이것이 HLL 알고리즘의 핵심 아이디어입니다.

## HLL을 이용한 근사 중복 제거 {#using-hll-for-approximate-deduplication}

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Create table -> Load data -> Query -->

### 1단계: 테이블 생성 {#step-1-create-the-table}

**목표**: HLL 중복 제거를 지원하는 집계 테이블을 생성합니다.

**제약 조건**:

1. 대상 컬럼 타입은 `HLL`로, 집계 함수는 `HLL_UNION`으로 설정해야 합니다.
2. HLL 타입 컬럼은 Key 컬럼으로 사용할 수 없습니다.
3. 길이나 기본값을 지정할 필요가 없습니다. HLL 컬럼의 길이는 데이터 집계 정도에 따라 시스템 내부에서 제어합니다.

**예시**:

```SQL
create table test_hll(
        dt date,
        id int,
        name char(10),
        province char(10),
        os char(10),
        uv hll hll_union
)
Aggregate KEY (dt,id,name,province,os)
distributed by hash(id) buckets 10
PROPERTIES(
        "replication_num" = "1",
        "in_memory"="false"
);
```

### 2단계: 데이터 적재 {#step-2-load-data}

**목표**: 원본 상세 데이터를 `HLL_HASH()`로 HLL 컬럼으로 변환하여 테이블에 기록합니다.

**샘플 데이터** (`test_hll.csv`):

```SQL
2022-05-05,10001,test01,Beijing,windows 
2022-05-05,10002,test01,Beijing,linux 
2022-05-05,10003,test01,Beijing,macos 
2022-05-05,10004,test01,Hebei,windows 
2022-05-06,10001,test01,Shanghai,windows 
2022-05-06,10002,test01,Shanghai,linux 
2022-05-06,10003,test01,Jiangsu,macos 
2022-05-06,10004,test01,Shaanxi,windows
```

#### Stream Load 명령어 {#stream-load-command}

```SQL
curl --location-trusted -u root: -H "label:label_test_hll_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os,uv=hll_hash(id)" -T test_hll.csv http://fe_IP:8030/api/demo/test_hll/_stream_load
```

#### 데이터 적재 결과 예시 {#sample-load-result}

```SQL
# curl --location-trusted -u root: -H "label:label_test_hll_load"     -H "column_separator:,"     -H "columns:dt,id,name,province,os, pv=hll_hash(id)" -T test_hll.csv http://127.0.0.1:8030/api/demo/test_hll/_stream_load

{
    "TxnId": 693,
    "Label": "label_test_hll_load",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 8,
    "NumberLoadedRows": 8,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 320,
    "LoadTimeMs": 23,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 1,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 9,
    "CommitAndPublishTimeMs": 11
}
```

### 3단계: 데이터 쿼리 {#step-3-query-data}

**목표**: HLL 집계 함수를 통해 근사 중복 제거 결과를 얻습니다.

> 참고: HLL 컬럼의 원시 값은 직접 쿼리할 수 없습니다. HLL 집계 함수를 통해서만 쿼리할 수 있습니다.

#### 전체 UV {#total-uv}

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
+---------------------+
1 row in set (0.00 sec)
```

동일한 결과를 얻는 형식:

```SQL
mysql> SELECT COUNT(DISTINCT uv) FROM test_hll;
+----------------------+
| count(DISTINCT `uv`) |
+----------------------+
|                    4 |
+----------------------+
1 row in set (0.01 sec)
```

#### 일별 UV {#uv-per-day}

```SQL
mysql> select HLL_UNION_AGG(uv) from test_hll group by dt;
+---------------------+
| hll_union_agg(`uv`) |
+---------------------+
|                   4 |
|                   4 |
+---------------------+
2 rows in set (0.01 sec)
```

## 관련 함수 {#related-functions}

<!-- Knowledge type: Configuration parameters / Function list -->

| 함수                       | 용도                                                                                     |
| :------------------------- | :--------------------------------------------------------------------------------------- |
| `HLL_UNION_AGG(hll)`       | 조건에 맞는 모든 데이터의 카디널리티 추정치를 계산하는 집계 함수                          |
| `HLL_CARDINALITY(hll)`     | 단일 HLL 컬럼 값의 카디널리티 추정치를 계산                                               |
| `HLL_HASH(column_name)`    | HLL 컬럼 타입을 생성하며, Insert 또는 데이터 적재 시 사용(데이터 적재 방법은 위 예시 참조) |
| `HLL_EMPTY()`              | 빈 HLL 컬럼을 생성하며, `insert` 또는 데이터 적재 시 기본값을 채우는 데 사용               |
