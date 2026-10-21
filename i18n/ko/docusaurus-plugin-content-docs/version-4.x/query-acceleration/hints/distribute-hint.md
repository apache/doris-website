---
title: Join Shuffle 방식을 제어하는 Distribute Hint
language: ko
description: Distribute Hint를 사용하여 Join의 shuffle 또는 broadcast 분산 방식을 강제하고 쿼리 성능을 튜닝하는 방법입니다.
keywords:
    - Distribute Hint
    - Join Shuffle
    - Broadcast Join
    - Doris Hint
    - Join 튜닝
    - 분산 방식
---

<!-- Knowledge type: Feature description / Operation steps -->
<!-- Applicable scenarios: Join performance tuning / Forcing the distribution method -->

## 개요 {#overview}

Distribute Hint는 Join 연산에서 오른쪽 테이블 데이터의 분산(Shuffle) 방식을 제어하며, Join 실행 계획을 수동으로 튜닝할 때 흔히 사용됩니다. 분산 방식을 명시적으로 지정하면 옵티마이저의 자동 선택이 적절하지 않을 때 쿼리 실행 계획을 유연하게 조정할 수 있습니다.

**핵심 기능:**

- Join 오른쪽 테이블의 분산 방식을 `shuffle` 또는 `broadcast`로 강제합니다.
- Ordered Hint 및 Leading Hint와 함께 사용하여 Join을 더 세밀하게 튜닝합니다.
- Hint를 적용할 수 없는 경우 시스템은 가능한 범위에서 적용을 시도하며 오류를 발생시키지 않습니다.

## 빠른 탐색 {#quick-navigation}

- [구문 규칙](#syntax-rules)
- [분산 방식 설명](#distribution-method-description)
- [사용 사례](#use-cases)
    - [Ordered Hint와 함께 사용](#combined-with-ordered-hint)
    - [Leading Hint와 함께 사용](#combined-with-leading-hint)
- [자주 묻는 질문](#faq)

## 구문 규칙 {#syntax-rules}

| 규칙 | 설명 |
| --- | --- |
| 위치 | Distribute Hint는 Join 오른쪽 테이블 앞에 작성합니다 |
| 선택 가능한 유형 | `[shuffle]` 또는 `[broadcast]` |
| 개수 제한 | Distribute Hint의 개수에는 제한이 없습니다 |
| 적용 실패 시 처리 | 해당 실행 계획을 생성할 수 없어도 오류를 발생시키지 않습니다. Hint는 가능한 범위에서 적용되며, 최종 분산 방식은 EXPLAIN에 표시된 내용을 따릅니다 |

## 분산 방식 설명 {#distribution-method-description}

EXPLAIN Shape Plan은 Distribute 연산자의 분산 유형을 표시합니다. 각 유형의 의미는 다음과 같습니다.

| 분산 유형 | 의미 |
| --- | --- |
| `DistributionSpecReplicated` | 해당 데이터를 모든 BE 노드에 복제합니다(Broadcast 분산) |
| `DistributionSpecGather` | 데이터를 FE 노드로 모읍니다 |
| `DistributionSpecHash` | 특정 hashKey와 알고리즘에 따라 데이터를 서로 다른 BE 노드로 분산합니다(Shuffle 분산) |

## 사용 사례 {#use-cases}

### Ordered Hint와 함께 사용 {#combined-with-ordered-hint}

**시나리오**: 먼저 Ordered Hint로 Join 순서를 쿼리에 작성된 순서로 고정한 다음, Distribute Hint로 각 Join에 원하는 분산 방식을 지정합니다.

**적용 전**(기본 실행 계획):

```sql
mysql> explain shape plan select count(*) from t1 join t2 on t1.c1 = t2.c2;
  +----------------------------------------------------------------------------------+
  | Explain String(Nereids Planner)                                                  |
  +----------------------------------------------------------------------------------+
  | PhysicalResultSink                                                               |
  | --hashAgg[GLOBAL]                                                                |
  | ----PhysicalDistribute[DistributionSpecGather]                                   |
  | ------hashAgg[LOCAL]                                                             |
  | --------PhysicalProject                                                          |
  | ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
  | ------------PhysicalProject                                                      |
  | --------------PhysicalOlapScan[t1]                                               |
  | ------------PhysicalDistribute[DistributionSpecHash]                             |
  | --------------PhysicalProject                                                    |
  | ----------------PhysicalOlapScan[t2]                                             |
  +----------------------------------------------------------------------------------+
```

**적용 후**(Broadcast 분산 지정):

```sql
mysql> explain shape plan select /*+ ordered */ count(*) from t2 join[broadcast] t1 on t1.c1 = t2.c2;
+----------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                  |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --hashAgg[GLOBAL]                                                                |
| ----PhysicalDistribute[DistributionSpecGather]                                   |
| ------hashAgg[LOCAL]                                                             |
| --------PhysicalProject                                                          |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ------------PhysicalProject                                                      |
| --------------PhysicalOlapScan[t2]                                               |
| ------------PhysicalDistribute[DistributionSpecReplicated]                       |
| --------------PhysicalProject                                                    |
| ----------------PhysicalOlapScan[t1]                                             |
|                                                                                  |
| Hint log:                                                                        |
| Used: ORDERED                                                                    |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
```

`t1`의 분산 방식이 `DistributionSpecHash`에서 `DistributionSpecReplicated`로 변경된 것은 Broadcast 분산이 적용되었음을 의미합니다.

### Leading Hint와 함께 사용 {#combined-with-leading-hint}

**시나리오**: `LEADING` Hint로 Join 순서를 고정하면서 적절한 `DISTRIBUTE` 방식을 각 `JOIN` 연산에 지정하여 실행 계획을 완전히 제어합니다.

```sql
explain shape plan
    select 
        nation,
        o_year,
        sum(amount) as sum_profit
    from
        (
            select
                /*+ leading(orders shuffle {lineitem shuffle part} shuffle {supplier broadcast nation} shuffle partsupp) */
                n_name as nation,
                extract(year from o_orderdate) as o_year,
                l_extendedprice * (1 - l_discount) - ps_supplycost * l_quantity as amount
            from
                part,
                supplier,
                lineitem,
                partsupp,
                orders,
                nation
            where
                s_suppkey = l_suppkey
                and ps_suppkey = l_suppkey
                and ps_partkey = l_partkey
                and p_partkey = l_partkey
                and o_orderkey = l_orderkey
                and s_nationkey = n_nationkey
                and p_name like '%green%'
        ) as profit
    group by
        nation,
        o_year
    order by
        nation,
        o_year desc;
```

## 자주 묻는 질문 {#faq}

**Q1: Distribute Hint를 잘못 작성하거나 해당 실행 계획을 생성할 수 없으면 어떻게 되나요?**

시스템은 오류를 발생시키지 않고 가능한 범위에서 Hint 적용을 시도합니다. Hint가 최종적으로 적용되었는지는 `EXPLAIN` 출력에 표시된 Distribute 연산자의 유형으로 확인할 수 있습니다.

**Q2: `shuffle`과 `broadcast`는 각각 언제 사용해야 하나요?**

- `broadcast`: 오른쪽 테이블의 데이터양이 적고, 모든 BE 노드에 데이터를 복제하는 비용이 Shuffle 비용보다 낮을 때 사용합니다.
- `shuffle`: 두 테이블 모두 데이터양이 많고 hashKey에 따른 재분산이 더 효율적일 때 사용합니다.

**Q3: 여러 Join의 분산 방식을 한 번에 지정할 수 있나요?**

네. Distribute Hint의 개수에는 제한이 없으며, Ordered Hint 및 Leading Hint와 함께 사용하여 각 Join의 분산 방식을 개별적으로 지정할 수 있습니다.

## 요약 {#summary}

Distribute Hint는 Join Shuffle 방식을 제어할 때 흔히 사용하는 Hint로, `shuffle` 또는 `broadcast` 분산 방식을 수동으로 지정하는 데 사용됩니다. Distribute Hint를 적절히 활용하면 현장의 Join Shuffle 튜닝 요구 사항을 충족하고 시스템을 더 유연하게 제어할 수 있습니다.
