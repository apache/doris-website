---
{
    "title": "비용 기반 재작성을 위한 CBO 규칙을 힌트로 제어하기",
    "sidebar_label": "CBO 규칙 제어",
    "language": "ko",
    "description": "Doris에서 USE_CBO_RULE 힌트로 CBO 비용 기반 재작성 규칙을 명시적으로 활성화하려면 어떻게 해야 할까요? 이 문서에서는 구문, 사용 가능한 규칙, 집계 푸시다운과 같은 일반적인 시나리오를 다룹니다.",
    "keywords": ["Doris CBO 힌트", "USE_CBO_RULE", "비용 기반 재작성", "집계 푸시다운", "쿼리 옵티마이저", "RBO와 CBO"]
}
---

<!-- Knowledge type: Concept + How-to guide -->
<!-- Applicable scenarios: Explicitly controlling CBO rules with hints for query tuning -->

## 읽기 전 확인 사항 {#pre-reading-checklist}

- Doris 옵티마이저의 기본 동작 흐름을 이해하고 있습니다
- 특정 쿼리에 대해 특정 CBO 규칙(예: 집계 푸시다운)을 활성화해야 합니다
- 일반 비즈니스 애플리케이션 개발자가 아닌 DBA 또는 전문 튜닝 엔지니어를 대상으로 합니다

:::caution 참고
Doris는 기본 설정만으로도 강력한 기능을 제공하며 대부분의 시나리오에서 성능을 자동으로 최적화하므로, 힌트를 사용한 수동 튜닝은 거의 필요하지 않습니다. 이 문서는 주로 **전문 튜닝 엔지니어**를 대상으로 합니다. 비즈니스 사용자는 개념만 이해하면 됩니다.
:::

## 개요 {#overview}

<!-- Knowledge type: Concept -->

`USE_CBO_RULE`은 단일 SQL 문 내에서 지정한 CBO 비용 기반 재작성 규칙을 명시적으로 활성화하는 쿼리 힌트입니다.

Doris 옵티마이저는 실행 계획을 생성할 때 두 가지 유형의 규칙을 적용합니다.

| 최적화 유형 | 전체 이름 | 판단 기준 | 대표적인 전략 |
|----------|------|----------|----------|
| RBO | Rule-Based Optimizer | 통계와 무관한 사전 정의된 휴리스틱 규칙 | 조건자 푸시다운, 프로젝션 푸시다운 |
| CBO | Cost-Based Optimizer | 데이터 통계를 바탕으로 비용을 추정하고 비용이 가장 낮은 계획을 선택 | 접근 경로 선택, 조인 알고리즘 선택 |

세밀한 튜닝이 필요한 일부 시나리오에서는 DBA나 개발자가 CBO 규칙의 활성화 여부를 수동으로 제어해야 합니다. 이때 쿼리 힌트를 사용할 수 있습니다.

## 구문 {#syntax}

<!-- Knowledge type: Reference -->
<!-- Applicable scenarios: Writing SQL with hints -->

**목적**: 단일 SELECT 문 내에서 하나 이상의 CBO 규칙을 명시적으로 활성화합니다.

**명령**:

```sql
SELECT /*+ USE_CBO_RULE(rule1, rule2, ...) */ ...
```

**참고 사항**:

- 힌트는 `SELECT` 키워드 바로 뒤에 위치해야 합니다.
- 괄호 안에 활성화할 규칙 이름을 나열하고, 여러 개인 경우 쉼표로 구분합니다.
- 규칙 이름은 **대소문자를 구분하지 않습니다**.

## 지원되는 CBO 규칙 {#supported-cbo-rules}

<!-- Knowledge type: Reference -->

현재 Doris 옵티마이저는 다음과 같은 비용 기반 재작성 규칙을 지원하며, `USE_CBO_RULE`로 명시적으로 활성화할 수 있습니다.

| 규칙 이름 | 효과 |
|----------|------|
| `PUSH_DOWN_AGG_THROUGH_JOIN` | 집계 연산을 조인 양쪽으로 푸시다운합니다 |
| `PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE` | 집계 연산을 조인 한쪽으로 푸시다운합니다 |
| `PUSH_DOWN_DISTINCT_THROUGH_JOIN` | Distinct 연산을 조인 아래로 푸시다운합니다 |

## 사례: 집계 푸시다운으로 조인 쿼리 성능 높이기 {#case-study-aggregate-pushdown-to-speed-up-join-queries}

<!-- Knowledge type: Example -->
<!-- Applicable scenarios: Queries that join and then aggregate, where you want to aggregate earlier to reduce the data volume processed by the join -->

**시나리오**: 테이블 `a`를 테이블 `b`와 `device_id`를 기준으로 조인하고, 그 결과를 `event_id`와 `group_id`별로 집계합니다. 조인 전에 테이블 `a`를 집계하여 조인에서 처리해야 하는 데이터량을 줄이려고 합니다.

**SQL 예제**:

```sql
explain shape plan
    select /*+ USE_CBO_RULE(push_down_agg_through_join_one_side) */
            a.event_id,
            b.group_id,
            COUNT(a.event_id)
    from a
    join b on
            a.device_id = b.device_id
    group by
            a.event_id,
            b.group_id
    ;
```

**재작성된 실행 계획**:

```sql
PhysicalResultSink
--hashAgg[GLOBAL]
----hashAgg[LOCAL]
------hashJoin[INNER_JOIN] hashCondition=((a.device_id = b.device_id)) otherCondition=()
--------hashAgg[LOCAL]
----------PhysicalOlapScan[a]
--------filter((cast(experiment_id as DOUBLE) = 73.0))
----------PhysicalOlapScan[b]
```

추가된 `hashAgg[LOCAL]`이 테이블 `a`의 스캔 위에 배치되어 조인 전에 집계를 수행하는 것을 확인할 수 있습니다. 이를 통해 조인에 입력되는 데이터량이 줄어들어 쿼리 속도가 빨라집니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ / Troubleshooting -->

**Q1: `USE_CBO_RULE`은 언제 사용해야 하나요?**

Doris가 특정 CBO 규칙을 기본적으로 적용하지 않지만, 현재 데이터 분포를 고려했을 때 해당 규칙이 도움이 된다고 판단한 경우에만 수동으로 활성화하면 됩니다. 대부분의 경우 옵티마이저의 자동 판단을 신뢰하는 것이 좋습니다.

**Q2: 힌트의 규칙 이름은 대소문자를 구분하나요?**

아니요, 대소문자를 구분하지 않습니다. `PUSH_DOWN_AGG_THROUGH_JOIN_ONE_SIDE`와 `push_down_agg_through_join_one_side`는 동일합니다.

**Q3: 여러 규칙을 동시에 활성화할 수 있나요?**

네. 규칙을 쉼표로 구분하면 됩니다. 예: `/*+ USE_CBO_RULE(rule1, rule2) */`.

**Q4: 힌트를 잘못된 위치에 넣거나 규칙 이름의 철자를 잘못 입력하면 어떻게 되나요?**

힌트는 `SELECT` 키워드 바로 뒤에 위치해야 합니다. 규칙 이름의 철자가 잘못되면 힌트는 적용되지 않지만, SQL은 기본 실행 계획을 사용하여 정상적으로 실행됩니다.

## RBO와 CBO 비교 {#rbo-vs-cbo-comparison}

<!-- Knowledge type: Comparison -->

| 비교 항목 | RBO | CBO |
|------|-----|-----|
| 판단 기준 | 휴리스틱 규칙 | 데이터 통계(비용 추정) |
| 통계 의존 여부 | 아니요 | 예 |
| 적용 시나리오 | 일반적이며 결과가 정해진 최적화 | 데이터 분포와 밀접하게 연관된 최적화 |
| `USE_CBO_RULE`로 제어 가능 여부 | 아니요 | 예 |

## 요약 {#summary}

`USE_CBO_RULE` 힌트를 적절히 사용하면 특정 시나리오에서 고급 CBO 최적화 규칙을 수동으로 활성화하여 쿼리 성능을 개선할 수 있습니다. 효과적으로 사용하려면 쿼리 최적화와 데이터 특성을 깊이 이해해야 합니다. **대부분의 경우에는 여전히 Doris 옵티마이저의 자동 판단에 맡기는 것이 가장 좋은 선택입니다**.
