---
{
    "title": "Leading Hint로 Join 순서 제어하기: Join 순서를 직접 지정하여 쿼리 최적화",
    "sidebar_label": "Leading Hint로 Join 순서 제어하기",
    "language": "ko",
    "description": "Doris에서 Leading Hint로 Join 순서를 직접 지정하려면 어떻게 해야 할까요? 이 문서에서는 왼쪽과 오른쪽 테이블 교환, left-deep tree, right-deep tree, Bushy tree 구성, Distribute Hint와의 조합을 실습 예제로 설명합니다.",
    "keywords": ["Doris Leading Hint", "Join 순서", "left-deep tree", "right-deep tree", "Bushy tree", "Distribute Hint", "Nereids Planner", "쿼리 튜닝"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: complex multi-table Join tuning, manual intervention when CBO selection is suboptimal -->

**Leading Hint**는 SQL에서 여러 테이블의 Join 순서를 직접 지정하는 힌트 구문으로, 특정 상황에서 복잡한 쿼리의 실행 계획을 최적화하는 데 사용됩니다. 자세한 구문은 [leading hint](../../../query-acceleration/hints/leading-hint.md) 문서를 참조하세요.

### 읽기 전에 {#reading-notes}

- Doris Nereids 옵티마이저와 `EXPLAIN SHAPE PLAN` 출력에 익숙한 경우
- 현재 쿼리가 여러 테이블을 Join하며, 옵티마이저가 자동으로 선택한 순서가 기대에 미치지 못하는 경우
- Join 형태를 left-deep tree, right-deep tree 또는 Bushy tree로 제어해야 하는 경우
- Join 순서와 분산 방식(Shuffle / Broadcast)을 동시에 제어해야 하는 경우

:::caution 참고
Doris는 기본 설정만으로도 강력한 성능을 제공합니다. 대부분의 시나리오에서는 옵티마이저가 각 상황에 맞게 성능을 최적화하므로 **사용자가 Hint로 직접 튜닝할 필요가 없습니다**. 이 장은 주로 전문 튜닝 담당자를 위한 내용이며, 일반 업무 사용자는 개념만 알아두면 됩니다.
:::

## 적용 시나리오 빠른 참조 {#quick-reference-for-applicable-scenarios}

<!-- Knowledge type: reference -->
<!-- Applicable scenarios: quickly determine which Hint form to use -->

| 시나리오 | 권장 Hint 구문 | 결과 Join 형태 |
| --- | --- | --- |
| 두 테이블의 왼쪽과 오른쪽 Join 순서 교환 | `leading(t2 t1)` | 왼쪽과 오른쪽 교환 |
| 여러 테이블에 left-deep tree 강제 적용 | `leading(t1 t2 t3)` | Left-deep tree |
| 여러 테이블에 right-deep tree 강제 적용 | `leading(t1 {t2 t3})` | Right-deep tree |
| 여러 테이블에 Bushy tree 강제 적용 | `leading({t1 t2} {t3 t4})` | Bushy tree |
| 서브쿼리 / 뷰가 하나의 단위로 Join에 참여 | `leading(alias t1)` | 별칭이 단일 Join 노드로 동작 |
| 순서와 분산 방식을 모두 제어 | `leading(a shuffle b broadcast c)` | 순서와 지정된 Shuffle / Broadcast |

> 한 문장 정의: Leading Hint = 옵티마이저에 "어떤 테이블을 먼저 Join하고, 다음에는 어떤 테이블을 Join하며, 어떤 형태로 구성할지" 직접 알려주는 것.

## 사례 1: 왼쪽과 오른쪽 테이블의 순서 조정 {#case-1-adjusting-the-order-of-left-and-right-tables}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: swap the left and right tables in a two-table Join -->

**목표**: 기본 순서인 `t1 join t2`를 `t2 join t1`로 변경합니다.

**원래 계획**:

```sql
mysql> explain shape plan select * from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                            |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t1]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t2]                                               |
+------------------------------------------------------------------------------+
```

**Leading Hint 적용**:

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on t1.c1 = t2.c2;
+------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                            |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t2]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t1]                                               |
|                                                                              |
| Hint log:                                                                    |
| Used: leading(t2 t1)                                                         |
| UnUsed:                                                                      |
| SyntaxError:                                                                 |
+------------------------------------------------------------------------------+
```

**설명**: Hint 로그의 `Used: leading(t2 t1)`은 Hint가 적용되어 왼쪽과 오른쪽 테이블의 순서가 바뀌었음을 나타냅니다.

## 사례 2: left-deep tree 강제 적용 {#case-2-forcing-a-left-deep-tree}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: join multiple tables in a linear, sequential manner -->

**목표**: `t1`, `t2`, `t3`가 `((t1 ⨝ t2) ⨝ t3)` 형태의 left-deep tree로 실행되도록 합니다.

```sql
mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+--------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                              |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalOlapScan[t1]                                                 |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalOlapScan[t2]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalOlapScan[t3]                                                 |
|                                                                                |
| Hint log:                                                                      |
| Used: leading(t1 t2 t3)                                                        |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

**설명**: Hint 로그의 `Used: leading(t1 t2 t3)`은 Hint가 적용되어 실행 계획이 left-deep tree로 구성되었음을 나타냅니다.

## 사례 3: right-deep tree 강제 적용 {#case-3-forcing-a-right-deep-tree}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: have the right subtree carry the main Join chain -->

**목표**: 중괄호 `{}`로 오른쪽 하위 Join을 묶어 `(t1 ⨝ (t2 ⨝ t3))` 형태의 right-deep tree를 구성합니다.

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3;
+----------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                |
+----------------------------------------------------------------------------------+
| PhysicalResultSink                                                               |
| --PhysicalDistribute[DistributionSpecGather]                                     |
| ----PhysicalProject                                                              |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
| --------PhysicalOlapScan[t1]                                                     |
| --------PhysicalDistribute[DistributionSpecHash]                                 |
| ----------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ------------PhysicalOlapScan[t2]                                                 |
| ------------PhysicalDistribute[DistributionSpecHash]                             |
| --------------PhysicalOlapScan[t3]                                               |
|                                                                                  |
| Hint log:                                                                        |
| Used: leading(t1 { t2 t3 })                                                      |
| UnUsed:                                                                          |
| SyntaxError:                                                                     |
+----------------------------------------------------------------------------------+
```

**설명**: Hint 로그의 `Used: leading(t1 { t2 t3 })`은 Hint가 적용되어 실행 계획이 right-deep tree로 구성되었음을 나타냅니다.

## 사례 4: Bushy tree 강제 적용 {#case-4-forcing-a-bushy-tree}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: four or more tables, where the left and right subtrees should each Join first before being combined -->

**목표**: 중괄호 `{}` 두 쌍으로 왼쪽과 오른쪽 서브트리를 각각 묶어 `((t1 ⨝ t2) ⨝ (t3 ⨝ t4))` 형태의 Bushy tree를 구성합니다.

```sql
mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = t2.c2 join t3 on t2.c2 = t3.c3 join t4 on t3.c3 = t4.c4;
+-----------------------------------------------+
| _Explain_ String                              |
+-----------------------------------------------+
| PhysicalResultSink                            |
| --PhysicalDistribute                          |
| ----PhysicalProject                           |
| ------hashJoin[INNER_JOIN](t2.c2 = t3.c3)     |
| --------hashJoin[INNER_JOIN](t1.c1 = t2.c2)   |
| ----------PhysicalOlapScan[t1]                |
| ----------PhysicalDistribute                  |
| ------------PhysicalOlapScan[t2]              |
| --------PhysicalDistribute                    |
| ----------hashJoin[INNER_JOIN](t3.c3 = t4.c4) |
| ------------PhysicalOlapScan[t3]              |
| ------------PhysicalDistribute                |
| --------------PhysicalOlapScan[t4]            |
|                                               |
| Used: leading({ t1 t2 } { t3 t4 })            |
| UnUsed:                                       |
| SyntaxError:                                  |
+-----------------------------------------------+
```

**설명**: Hint 로그의 `Used: leading({ t1 t2 } { t3 t4 })`은 Hint가 적용되어 실행 계획이 Bushy tree로 구성되었음을 나타냅니다.

## 사례 5: 뷰 / 서브쿼리를 하나의 단위로 Join에 참여시키기 {#case-5-view--subquery-participating-in-the-join-as-a-whole}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: a subquery or view has an alias and needs to participate in ordering as a single Join node -->

**목표**: 서브쿼리 별칭 `alias`가 외부 테이블 `t1`과 지정된 순서로 Join하도록 합니다.

```sql
mysql>  explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
+--------------------------------------------------------------------------------------+
| _Explain_ String(Nereids Planner)                                                    |
+--------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                   |
| --hashAgg[GLOBAL]                                                                    |
| ----PhysicalDistribute[DistributionSpecGather]                                       |
| ------hashAgg[LOCAL]                                                                 |
| --------PhysicalProject                                                              |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = alias.c2)) otherCondition=()  |
| ------------PhysicalProject                                                          |
| --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ----------------PhysicalProject                                                      |
| ------------------PhysicalOlapScan[t2]                                               |
| ----------------PhysicalDistribute[DistributionSpecHash]                             |
| ------------------PhysicalProject                                                    |
| --------------------PhysicalOlapScan[t3]                                             |
| ------------PhysicalDistribute[DistributionSpecHash]                                 |
| --------------PhysicalProject                                                        |
| ----------------PhysicalOlapScan[t1]                                                 |
|                                                                                      |
| Hint log:                                                                            |
| Used: leading(alias t1)                                                              |
| UnUsed:                                                                              |
| SyntaxError:                                                                         |
+--------------------------------------------------------------------------------------+
```

**설명**: Hint 로그의 `Used: leading(alias t1)`은 Hint가 적용되어 서브쿼리 `alias`가 하나의 노드로 처리됨을 나타냅니다.

## 사례 6: Distribute Hint와 Leading Hint 함께 사용하기 {#case-6-mixing-distribute-hint-with-leading-hint}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: complex multi-table queries that need to control both Join order and distribution method -->

**목표**: Join 순서를 지정하면서 각 Join 쌍에 `shuffle` 또는 `broadcast` 분산 방식을 지정합니다.

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

**키워드의 의미**:

| 키워드 | 용도 |
| --- | --- |
| `leading(...)` | 테이블 간 전반적인 상대 Join 순서와 형태를 제어합니다 |
| `shuffle` | 해당 Join에 Shuffle 분산을 사용하도록 지정합니다 |
| `broadcast` | 해당 Join에 Broadcast 분산을 사용하도록 지정합니다 |
| `{ ... }` | 여러 테이블을 하나의 서브트리로 묶어 Join 형태를 결정합니다 |

**설명**: 두 종류의 Hint를 조합하면 Join 순서와 Join 방식을 동시에 유연하게 제어할 수 있어 원하는 실행 계획을 직접 지정하기가 더 쉬워집니다.

:::caution 사용 권장 사항
- `EXPLAIN`으로 실행 계획을 면밀히 분석하여 Leading Hint가 기대한 효과를 내는지 확인하세요.
- Doris 버전을 업그레이드하거나 업무 데이터가 변경된 후에는 Leading Hint의 효과를 다시 평가하고, 적시에 기록하고 조정하세요.
:::

## 자주 묻는 질문 {#frequently-asked-questions}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenarios: the Hint does not take effect or behavior does not meet expectations -->

### Q1: Hint가 적용되지 않고 Hint 로그의 `UnUsed` 또는 `SyntaxError` 아래에 내용이 표시되나요? {#q1-the-hint-did-not-take-effect-and-the-hint-log-shows-content-under-unused-or-syntaxerror}

- **일반적인 원인**: Hint에 지정한 테이블 이름 / 별칭의 오타, Hint와 SQL 간 테이블 수 불일치 또는 괄호 짝 불일치입니다.
- **문제 해결**: `Hint log` 섹션은 `EXPLAIN SHAPE PLAN` 출력의 끝에 있습니다. 이 섹션의 `UnUsed` 또는 `SyntaxError` 줄에서 구체적인 메시지를 확인하세요.

### Q2: Leading Hint와 Distribute Hint는 어떤 관계인가요? {#q2-what-is-the-relationship-between-leading-hint-and-distribute-hint}

- `leading`은 **어떤 테이블을 먼저 Join하고 어떤 형태로 구성할지** 결정하고, `shuffle` / `broadcast`는 **각 Join 쌍의 데이터 분산 방식**을 결정합니다.
- 각각 독립적으로 사용하거나 [사례 6](#case-6-mixing-distribute-hint-with-leading-hint)처럼 함께 사용할 수 있습니다.

### Q3: 서브쿼리를 분할하여 Leading Hint에 지정할 수 없는 이유는 무엇인가요? {#q3-why-can-a-subquery-not-be-split-into-a-leading-hint}

- 서브쿼리 / 뷰는 별칭을 통해 **하나의 노드**로 `leading` 순서 지정에 참여합니다. [사례 5](#case-5-view--subquery-participating-in-the-join-as-a-whole)를 참조하세요.
- 서브쿼리 내부의 테이블 순서도 지정해야 한다면 서브쿼리 내부에 별도의 `leading` Hint를 작성하세요.

### Q4: Leading Hint를 사용하지 않는 것이 좋은 경우는 언제인가요? {#q4-when-should-leading-hint-not-be-used}

- 옵티마이저가 자동으로 선택한 실행 계획이 이미 최적인 경우입니다.
- 업무 데이터가 자주 변경되고 통계가 불안정한 경우에는 Hint를 고정하면 오히려 성능이 저하될 수 있습니다.

## 요약 {#summary}

<!-- Knowledge type: concept -->
<!-- Applicable scenarios: deciding whether to adopt Leading Hint -->

- **Leading Hint**는 Join 순서와 형태(left-deep tree / right-deep tree / Bushy tree)를 직접 제어하는 데 사용됩니다.
- **Shuffle / Broadcast Hint와 조합**하여 순서와 분산 방식을 동시에 제어할 수 있습니다.
- **신중하게 사용하세요**: 쿼리 특성과 데이터 분산을 충분히 이해한 후에만 적용하고, 버전과 데이터가 변경됨에 따라 주기적으로 검토하세요.
