---
{
    "title": "데이터 편향 처리: Doris MPP 쿼리의 단일 지점 병목 파악 및 최적화",
    "sidebar_label": "데이터 편향 처리",
    "language": "ko",
    "description": "Doris MPP 쿼리에서 데이터 편향을 감지하고 단일 스레드 실행 병목을 해결하려면 어떻게 해야 할까요? 이 문서에서는 Profile 지표, Broadcast, Leading Hint를 활용한 문제 파악 및 튜닝 방법을 설명합니다.",
    "keywords": ["Doris 데이터 편향", "MPP 쿼리 최적화", "Join Shuffle", "Broadcast Join", "Leading Hint", "데이터 편향 처리", "Profile 튜닝"]
}
---

<!-- Knowledge type: concept + operation + case -->
<!-- Applicable scenario: Doris MPP query exhibits single-point slowness, unbalanced Join, or abnormal plan ordering -->

데이터 편향은 Shuffle 후 데이터가 BE 인스턴스 간에 고르게 분산되지 않아 단일 스레드가 전체 쿼리의 병목이 되는 현상을 말합니다. Doris는 데이터 Shuffle을 통해 병렬 연산을 가속하는 MPP 데이터베이스입니다. Join Key나 필터 열에 편향이 있으면 단일 스레드 실행 병목이 발생하여 전체 쿼리가 느려집니다.

이 문서에서는 이러한 문제를 감지하는 방법과 일반적인 튜닝 방법을 설명합니다.

## 문제 진단 체크리스트 {#troubleshooting-checklist}

<!-- Knowledge type: operation checklist -->
<!-- Applicable scenario: quickly locating skew issues -->

최적화를 시작하기 전에 다음 단계에 따라 문제를 조사하세요.

- `EXPLAIN`으로 실행 계획을 확인하고 Join 순서와 Shuffle 방식을 파악합니다.
- `PROFILE`에서 연산자 지표의 `max / avg / min`을 살펴봅니다. 대표적인 지표로는 `ExecTime`과 `ProbeRows`가 있습니다.
- `max`가 `avg`보다 자릿수가 다를 정도로 큰지 확인합니다. 이는 전형적인 편향 징후입니다.
- 편향의 원인이 Join Key의 불균등한 분포인지, 필터링 후 행 수 추정 오류인지 파악합니다.
- 원인에 맞는 튜닝 방법인 Broadcast Hint 또는 Leading Hint를 선택합니다.

## 편향 시나리오 비교 {#skew-scenario-comparison}

<!-- Knowledge type: comparison table -->
<!-- Applicable scenario: quickly selecting an optimization method -->

| 시나리오 | 발생 원인 | 대표적인 증상 | 권장 방법 |
|---|---|---|---|
| 버킷 데이터 편향 | Join Key 데이터가 고르게 분포하지 않아 Shuffle 후 특정 파티션이 지나치게 커짐 | `ProbeRows.max`가 `avg`보다 훨씬 크고, `ExecTime.max`가 비정상적임 | Broadcast Join Hint |
| 열 데이터 편향으로 왼쪽/오른쪽 테이블이 뒤바뀜 | 옵티마이저가 균등 분포를 가정하여 필터링 후 행 수 추정에 큰 오차가 발생함 | 부적절한 Join 순서가 선택되고 왼쪽 테이블의 행 수가 추정치보다 훨씬 많음 | Leading Hint |

## 사례 1: 버킷 데이터 편향으로 비효율적인 Shuffle 방식이 선택됨 {#case-1-bucket-data-skew-causes-suboptimal-shuffle-method}

<!-- Knowledge type: case + operation -->
<!-- Applicable scenario: uneven Join Key distribution causes single-thread execution time to be significantly higher than the average -->

### 증상 {#symptoms}

테이블의 Join Key에 데이터 편향이 있으면 데이터가 BE 인스턴스 간에 고르게 분산되지 않습니다. 이로 인해 특정 지점에 실행 병목이 발생하여 전체 쿼리 실행 시간이 길어집니다.

### Profile로 문제 위치 파악 {#locating-with-profile}

Hash Join 연산자의 Profile을 살펴봅니다.

```SQL
HASH_JOIN_OPERATOR  (id=27): 
      -  PlanInfo 
            -  join  op: INNER  JOIN(PARTITIONED)[] 
            -  equal  join  conjunct:  (customer_number  =  customer_number) 
            -  runtime  filters:  RF001[bloom]  <-  customer_number(200/256/2048) 
            -  cardinality=200         
            -  vec  output  tuple  id:  28 
            -  output  tuple  id:  28  
            -  vIntermediate  tuple  ids:  27 
            -  hash  output  slot  ids:  192  193  194  195  196  197  198  199  200  201  174  175  240  176  177  178  179  180  181  182  183  184  185  186  187  188  189  190  191 
            -  project  output  tuple  id:  28 
      -  BlocksProduced:  sum  4.883K  (4883),  avg  33,  max  39,  min  29 
      -  CloseTime:  avg  37.28us,  max  132.653us,  min  13.945us  
      -  ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
      -  InitTime:  avg  0ns,  max  0ns,  min  0ns  
      -  MemoryUsage:  sum  ,  avg  ,  max  ,  min 
          -  PeakMemoryUsage:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
          -  ProbeKeyArena:  sum  11.81  MB,  avg  84.00  KB,  max  84.00  KB,  min  84.00  KB 
      -  OpenTime:  avg  194.970us,  max  497.685us,  min  93.738us  
      -  ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
      -  ProjectionTime:  avg  7.336ms,  max  33.540ms,  min  3.760ms 
      -  RowsProduced:  sum  28.8K  (28800),  avg  200,  max  200,  min  200 
```

Join Profile의 `max` 지표를 보면 실행 시간과 ProbeRows에서 뚜렷한 편향이 나타납니다.

```Bash
ExecTime:  avg  166.206ms,  max  10s947.344ms,  min  8.845ms 
ProbeRows:  sum  23.884018M  (23884018),  avg  165.861K  (165861),  max  219.346276M  (219346276),  min  1984  (1984) 
```

Join Key를 기준으로 Shuffle한 후 데이터가 고르게 분산되지 않아 한 스레드는 200백만 개의 행을 처리한 반면, 다른 스레드는 수천 개의 행만 처리했습니다.

### 편향 징후 빠른 참조 {#skew-signal-quick-reference}

| 지표 | 정상 상태 | 편향 상태 |
|---|---|---|
| `ExecTime` | `max`가 `avg`와 비슷함 | `max`가 `avg`보다 훨씬 큼(예: 10s와 166ms) |
| `ProbeRows` | 모든 스레드의 처리량이 비슷한 자릿수 범위에 있음 | `max`가 `avg`보다 여러 자릿수 클 정도로 차이가 남 |
| `RowsProduced` | 고르게 분산됨 | 소수의 스레드에 집중됨 |

### 최적화: Broadcast Join Hint 사용 {#optimization-use-broadcast-join-hint}

이상적으로는 각 스레드가 처리하는 데이터양이 비슷해야 합니다. "Hint를 사용하여 Join Shuffle 방식 제어" 절을 참고하여 Broadcast Join Hint를 지정하면 왼쪽 테이블의 데이터를 Shuffle하지 않으므로 Join 열의 데이터 편향으로 인한 성능 병목을 피할 수 있습니다.

- **목적**: 큰 테이블을 Join Key 기준으로 Shuffle하지 않도록 하여 특정 파티션이 지나치게 커지는 것을 방지합니다.
- **명령**:

  ```SQL
  SELECT COUNT(*) FROM orders o JOIN [broadcast] customer c ON o.customer_number = c.customer_number;
  ```

- **설명**: `[broadcast]`를 사용하면 오른쪽 테이블인 `customer`가 모든 노드에 브로드캐스트되고, 왼쪽 테이블인 `orders`는 더 이상 Shuffle되지 않습니다. 이를 통해 Join Key 편향으로 특정 지점에 부하가 집중되는 문제를 해소합니다.

## 사례 2: 열 데이터 편향으로 Join의 왼쪽 및 오른쪽 테이블이 뒤바뀜 {#case-2-column-data-skew-causes-left-and-right-tables-of-join-to-be-reversed}

<!-- Knowledge type: case + operation -->
<!-- Applicable scenario: inaccurate filter row-count estimation leads to an unreasonable Join order -->

### 증상 {#symptoms-1}

Doris 옵티마이저는 균등 분포를 가정하여 선택도를 추정합니다. 필터링 후 행 수 추정에 큰 오차가 있으면 연산자 실행 계획 선택에 영향을 줍니다. 다음 SQL을 예로 들어 보겠습니다.

```SQL
select count(*) 
from orders, customer 
where o_custkey = c_custkey
and o_orderdate < '1920-01-02';
```

### 원인 분석 {#cause-analysis}

균등 분포를 가정하면 옵티마이저는 필터 `o_orderdate < '1920-01-02'`를 적용한 후 출력되는 행 수가 `customer` 테이블의 행 수보다 적다고 판단할 수 있습니다. 따라서 `customer` join `orders` 순서를 선택할 수 있습니다.

하지만 실제 데이터에 편향이 있고 조건을 만족하는 `orders`의 행 수가 `customer`의 행 수보다 많다면, 더 적절한 Join 순서는 `orders` join `customer`입니다.

### 최적화: Leading Hint 사용 {#optimization-use-leading-hint}

- **목적**: 더 적절한 Join 순서를 강제하여 행 수 추정 오류를 우회합니다.
- **명령**:

  ```SQL
  select /*+leading(orders customer)*/ count(*) 
  from orders, customer 
  where o_custkey = c_custkey
  and o_orderdate < '1920-01-02'
  ```

- **설명**: "Leading Hint를 사용하여 Join 순서 제어" 절을 참고하세요. Leading Hint는 `customer` join `orders` 순서로 Join이 생성되도록 강제합니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: common questions and misconceptions -->

**Q1: 쿼리에 데이터 편향이 있는지 빠르게 판단하려면 어떻게 해야 하나요?**

Profile에서 주요 연산자의 `ExecTime`과 `ProbeRows`를 살펴보세요. `max`가 `avg`보다 자릿수가 다를 정도로 훨씬 크다면 편향이 있는 것입니다.

**Q2: Broadcast Join은 항상 편향을 해결하나요?**

항상 그렇지는 않습니다. Broadcast는 오른쪽 테이블, 즉 브로드캐스트할 테이블이 충분히 작을 때 적용할 수 있습니다. 오른쪽 테이블이 크면 브로드캐스트로 인해 메모리와 네트워크 오버헤드가 크게 발생하여 오히려 성능이 저하될 수 있습니다.

**Q3: Leading Hint와 Broadcast Hint를 함께 사용할 수 있나요?**

네. 두 Hint의 목적은 서로 다릅니다. Leading Hint는 Join 순서를 제어하고, Broadcast Hint는 Shuffle 방식을 제어합니다. 두 Hint를 조합하여 복잡한 시나리오에 대응할 수 있습니다.

**Q4: 옵티마이저가 자동으로 최적의 실행 계획을 선택하지 못하는 이유는 무엇인가요?**

옵티마이저는 통계와 균등 분포 가정을 바탕으로 추정합니다. 열 데이터의 편향이 심하면 추정이 부정확해집니다. 이 경우 Hint를 통해 실행 계획을 조정해야 합니다.

## 문제 해결 {#troubleshooting}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenario: issue persists after tuning -->

| 문제 | 가능한 원인 | 권장 조치 |
|---|---|---|
| Broadcast Hint를 추가한 후 OOM 발생 | 오른쪽 테이블이 너무 커서 브로드캐스트 시 메모리 한도를 초과함 | 다른 Shuffle 방식으로 전환하거나 오른쪽 테이블의 크기를 줄임 |
| Leading Hint를 추가해도 효과가 없음 | Hint 구문에 오류가 있거나 옵티마이저가 Hint를 무시함 | `EXPLAIN`으로 Hint가 적용되었는지 확인 |
| Profile의 `max`가 여전히 `avg`보다 훨씬 큼 | 편향의 원인이 Join이 아니라 집계 또는 스캔에 있음 | Aggregate / Scan 연산자의 지표를 확인 |
| 여러 번 실행했을 때 결과가 일정하지 않음 | 오래된 통계 | `ANALYZE TABLE`을 실행하여 통계를 갱신 |

## 요약 {#summary}

<!-- Knowledge type: summary -->
<!-- Applicable scenario: methodology recap -->

데이터 편향은 운영 환경에서 흔히 발생하는 성능 문제입니다. 처리 방법은 다음 세 단계로 요약할 수 있습니다.

1. **관찰**: `EXPLAIN`과 `PROFILE`의 출력으로 실행 계획과 실행 병목을 살펴봅니다.
2. **위치 파악**: `max / avg / min` 지표의 차이를 바탕으로 편향의 원인을 파악합니다.
3. **조정**: Broadcast Hint 또는 Leading Hint로 실행 계획을 조정하여 데이터 편향이 성능에 미치는 영향을 방지합니다.
