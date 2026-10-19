---
{
    "title": "힌트로 Join Shuffle 모드 조정",
    "language": "ko",
    "description": "Doris에서 Distribute Hint를 사용해 Join의 shuffle 모드를 어떻게 조정할 수 있을까요? 이 문서에서는 [shuffle] 및 [broadcast] 힌트의 구문, 실행 계획 비교, 튜닝 방법을 설명합니다.",
    "keywords": ["Doris Join Shuffle", "Distribute Hint", "broadcast 힌트", "shuffle 힌트", "Join 튜닝", "Nereids 실행 계획"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenario: manually adjust the Join data distribution mode to optimize query performance -->

Distribute Hint는 Join의 오른쪽 테이블에 적용할 데이터 분산 방식을 수동으로 지정하기 위해 Doris가 제공하는 힌트 구문입니다. 특정 상황에서 옵티마이저의 기본 선택을 재정의하여 Join 성능을 최적화할 수 있습니다.

**튜닝 전 확인 사항**:

- `EXPLAIN SHAPE PLAN`을 사용해 현재 Join의 분산 방식을 확인했습니다.
- 기본 실행 계획에 성능 병목이 있음을 확인했습니다. 예를 들어 작은 테이블에 Shuffle이 적용되거나 큰 테이블에 Broadcast가 적용되는 경우입니다.
- 두 테이블의 데이터 크기를 파악하고 있으며, Broadcast와 Shuffle 중 어떤 방식이 적합한지 판단할 수 있습니다.
- 힌트는 전문적인 튜닝 작업에서만 사용하며, 업무 사용자가 수동으로 개입할 필요는 없습니다.

:::caution 참고
Doris는 기본 설정만으로도 뛰어난 성능을 제공하므로, 대부분의 상황에서 사용자가 업무 쿼리 튜닝을 위해 힌트를 수동으로 제어하지 않아도 성능을 자동으로 최적화합니다. 이 장의 내용은 주로 튜닝 전문가를 대상으로 하며, 업무 사용자는 기본 개념만 이해하면 됩니다.
:::

## Distribute Hint 구문 {#distribute-hint-syntax}

<!-- Knowledge type: reference -->
<!-- Applicable scenario: specify the distribution mode of the Join right table when writing SQL -->

Doris는 서로 독립적인 두 가지 [Distribute Hint](../../../query-acceleration/hints/distribute-hint.md)를 지원합니다. 힌트는 Join의 오른쪽 테이블 앞에 배치하고 대괄호 `[]`로 감싸야 합니다.

### 힌트 유형 비교 {#hint-type-comparison}

| 힌트 유형      | 분산 방식(DistributionSpec) | 일반적인 적용 상황                                  | 데이터 전송 비용                  |
| :------------- | :----------------------------------- | :----------------------------------------------------------- | :---------------------------------- |
| `[shuffle]`    | `DistributionSpecHash`               | 두 테이블이 모두 큰 경우. Join Key의 해시를 기준으로 재분배        | 두 테이블을 모두 키 기준으로 재분배 |
| `[broadcast]`  | `DistributionSpecReplicated`         | 오른쪽 테이블이 작으며 모든 BE 노드에 복제하는 경우  | 오른쪽 테이블 전체를 모든 BE 노드에 복제 |

> 팁: Leading Hint와 Distribute Hint를 함께 사용해 shuffle 모드도 지정할 수 있습니다. 자세한 내용은 [Leading Hint로 Join 순서 제어](reordering-join-with-leading-hint.md)를 참조하세요.

### 기본 예제 {#minimal-example}

```sql
-- Force the right table to use Broadcast distribution
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;

-- Force the right table to use Shuffle distribution
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```

## 사례: EXPLAIN으로 힌트 적용 결과 확인 {#case-verify-the-hint-effect-with-explain}

<!-- Knowledge type: operational example -->
<!-- Applicable scenario: verify whether a hint takes effect during tuning -->

다음 예제에서는 동일한 쿼리를 사용해 힌트 적용 전후의 실행 계획 차이를 살펴봅니다.

### 1단계: 기본 실행 계획 확인 {#step-1-view-the-default-execution-plan}

**목표**: 옵티마이저가 기본으로 선택한 분산 방식을 확인합니다.

**명령**:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

**설명**: 기본 실행 계획에서 `t2`는 `DistributionSpecHash`를 사용합니다. 즉, 해시를 기준으로 하는 Shuffle 분산 방식입니다.

```sql
+----------------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                                 |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg [GLOBAL]                                                               |
| ----PhysicalDistribute [DistributionSpecGather]                                  |
| ------hashAgg [LOCAL]                                                            |
| --------PhysicalProject                                                          |
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan [t1]                                              |
| ------------PhysicalDistribute [DistributionSpecHash]                            |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan [t2]                                            |
+----------------------------------------------------------------------------------+
```

### 2단계: [broadcast] 힌트 추가 {#step-2-add-the-broadcast-hint}

**목표**: 오른쪽 테이블 `t2`의 분산 방식을 Broadcast로 변경합니다.

**명령**:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```

**설명**: 실행 계획에서 `t2`의 분산 방식이 `DistributionSpecHash`에서 `DistributionSpecReplicated`로 변경됩니다. 이는 힌트가 적용되었음을 나타냅니다.

```sql
+----------------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                                 |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg [GLOBAL]                                                               |
| ----PhysicalDistribute [DistributionSpecGather]                                  |
| ------hashAgg [LOCAL]                                                            |
| --------PhysicalProject                                                          |
| ----------hashJoin [INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()|
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan [t1]                                              |
| ------------PhysicalDistribute [DistributionSpecReplicated]                      |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan [t2]                                            |
+----------------------------------------------------------------------------------+
```

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenario: the hint does not take effect as expected, or it is hard to choose between hints -->

### Q1: 힌트를 추가했는데 적용되지 않는 이유는 무엇인가요? {#q1-why-does-the-hint-not-take-effect-after-i-add-it}

-   힌트가 **Join의 오른쪽 테이블** 앞에 있는지 확인하세요. 예를 들어 `JOIN [broadcast] t1`과 같이 배치해야 하며, 왼쪽 테이블 앞에 배치하면 안 됩니다.
-   `EXPLAIN SHAPE PLAN`을 사용해 `DistributionSpec`이 기대한 값인지 `PhysicalDistribute` 노드에서 확인하세요.
-   대괄호 누락이나 오타 같은 구문 오류는 별도의 알림 없이 무시됩니다. SQL 구문을 확인하세요.

### Q2: [broadcast]와 [shuffle]은 각각 언제 사용해야 하나요? {#q2-when-should-i-use-broadcast-versus-shuffle}

| 상황                              | 권장 힌트 | 이유                                       |
| :------------------------------------ | :--------------- | :------------------------------------------- |
| 오른쪽 테이블이 작은 경우(예: 차원 테이블) | `[broadcast]`    | 큰 테이블에 Shuffle을 적용할 때 발생하는 네트워크 오버헤드 방지 |
| 두 테이블이 모두 크고 데이터가 고르게 분포한 경우 | `[shuffle]`      | Broadcast를 사용하면 오른쪽 테이블의 전송 비용이 증가 |
| Join Key의 데이터 편향이 심한 경우     | `[broadcast]`    | Shuffle 이후 특정 노드에 부하가 집중되는 현상 방지           |

### Q3: 힌트를 수동으로 지정해야 하나요? {#q3-do-i-need-to-manually-specify-a-hint}

대부분의 상황에서는 필요하지 않습니다. Doris 옵티마이저가 적절한 분산 방식을 자동으로 선택합니다. 성능이 기대에 미치지 못하고 옵티마이저의 선택이 최적이 아니라는 점을 명확히 확인한 경우에만 힌트를 사용하세요.

## 요약 {#summary}

Distribute Hint를 적절히 사용하면 Join 연산의 shuffle 모드를 최적화하고 쿼리 성능을 개선할 수 있습니다. 실제 튜닝에서는 먼저 `EXPLAIN SHAPE PLAN`으로 실행 계획을 분석한 다음, 데이터 크기와 분포 특성에 따라 `[shuffle]` 또는 `[broadcast]`를 선택하는 것이 좋습니다.
