---
title: Leading Hint로 Join 순서 제어하기
language: ko
description: Doris에서 Leading Hint를 사용하여 여러 테이블의 Join 순서를 수동으로 지정하고 복잡한 쿼리 튜닝 문제를 해결하는 방법입니다.
keywords:
    - Doris Leading Hint
    - Join 순서 제어
    - Ordered Hint
    - Left-deep tree, right-deep tree, Bushy tree
    - Join Reorder 튜닝
    - SyntaxError UnUsed
---

<!-- Knowledge type: Feature description / Operation steps -->
<!-- Applicable scenario: Complex query performance tuning / Manual intervention in Join order -->

## 한 문장 정의 {#one-sentence-definition}

Leading Hint는 여러 테이블의 Join 순서를 수동으로 지정하는 데 사용하는 Doris의 쿼리 Hint입니다. `/*+ LEADING(...) */` 주석을 `SELECT` 키워드 뒤에 추가하면 옵티마이저가 지정된 순서로 Join 실행 계획을 생성하도록 유도하여 복잡한 쿼리의 성능을 개선할 수 있습니다.

## 활용 시나리오 한눈에 보기 {#quick-look-at-applicable-scenarios}

<!-- Knowledge type: Scenario guide -->
<!-- Applicable scenario: Choosing the appropriate Hint type -->

다음과 같은 경우 Leading Hint 또는 Ordered Hint 사용을 고려하세요.

- 옵티마이저가 자동으로 선택한 Join 순서가 적절하지 않아 수동으로 개입해야 하는 경우.
- 여러 테이블이 참여하는 복잡한 Join에서 left-deep tree, right-deep tree, Bushy tree 또는 zig-zag tree 형태를 명시적으로 지정하려는 경우.
- 뷰나 서브쿼리가 별칭으로 Join Reorder에 참여하며, 해당 서브트리 전체를 하나의 단위로 배치해야 하는 경우.
- SQL 텍스트에 테이블이 작성된 순서대로 Join 순서를 강제하려는 경우(Ordered Hint 사용).

## 사용 전 확인 사항 {#pre-use-checklist}

<!-- Knowledge type: Operation checklist -->

Hint를 작성하기 전에 다음 사항을 확인하세요.

- [ ] SQL에 Join에 참여하는 테이블이 두 개 이상 있는지 확인합니다.
- [ ] Hint에 사용한 테이블 이름/별칭이 `FROM` 절의 이름/별칭과 일치하는지 확인합니다.
- [ ] `EXPLAIN SHAPE PLAN`을 사용하여 원래 실행 계획과 목표 실행 계획을 비교했는지 확인합니다.
- [ ] 목표 Join 순서가 원래 SQL과 의미적으로 동등한지 검토했는지 확인합니다(특히 Outer Join / Semi / Anti Join 시나리오).

## 빠른 탐색 {#quick-navigation}

- [일반 Leading Hint](#regular-leading-hint): 기본 구문, 적용 상태, 대표적인 사용법.
- [대표적인 시나리오 예제](#typical-scenario-examples): 기본 사용법 + left-deep tree / right-deep tree / Bushy tree / zig-zag tree / Non-inner Join / 뷰.
- [Ordered Hint](#ordered-hint): Join 순서를 텍스트에 작성된 순서로 고정하는 특수한 경우.
- [자주 묻는 질문(FAQ)](#frequently-asked-questions-faq): Hint가 적용되지 않는 문제, 다른 Hint와의 우선순위 등.

## 일반 Leading Hint {#regular-leading-hint}

<!-- Knowledge type: Syntax description -->

### 구문 {#syntax}

Leading Hint는 옵티마이저가 따르도록 할 테이블 Join 순서를 지정하는 데 사용합니다. Doris의 기본 구문은 다음과 같습니다.

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```

구문 설명:

- Leading Hint는 `/*+`와 `*/`로 감싸며, SQL 문의 `SELECT` 키워드 뒤에 배치합니다.
- `tablespec`은 테이블 이름 또는 테이블 별칭이며, 테이블을 두 개 이상 지정해야 합니다.
- 여러 테이블은 공백 또는 `,`로 구분합니다.
- 중괄호 `{}`를 사용하여 Join 트리의 형태를 명시적으로 지정할 수 있습니다.

최소 예제:

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
+------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                              |
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

### Hint 적용 상태 {#hint-effective-states}

Leading Hint가 적용되지 않으면 일반적인 절차에 따라 실행 계획을 생성합니다. `EXPLAIN`에서 Hint 적용 여부를 확인할 수 있으며, 주요 상태는 세 가지입니다.

| 상태          | 설명                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `Used`        | Leading Hint가 정상적으로 적용됩니다.                                                                                                      |
| `UnUsed`      | 지원되지 않는 경우입니다. Leading Hint가 지정한 Join 순서가 원래 SQL과 동등하지 않거나, 현재 버전에서 해당 기능을 아직 지원하지 않는 경우 등이 해당합니다(자세한 내용은 제한 사항 참조). |
| `SyntaxError` | Leading Hint에 구문 오류가 있습니다. 예를 들어, 해당 테이블을 찾을 수 없는 경우입니다.                                                       |

### 핵심 규칙 {#core-rules}

1. **기본적으로 left-deep tree를 구성합니다**: 괄호를 사용하지 않으면 Leading Hint는 기본적으로 left-deep tree를 구성합니다.

    ```sql
    mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on c1 = c2 join t3 on c2=c3;
    +--------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                |
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

2. **중괄호로 Join 트리 형태를 지정합니다**: `{}`를 사용하면 Join 트리의 형태를 명시적으로 제어할 수 있습니다.

    ```sql
    mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on c1 = c2 join t3 on c2=c3;
    +----------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                  |
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

3. **뷰 / 별칭을 매개변수로 지원합니다**: 뷰가 별칭으로 Join Reorder에 참여하면 해당 뷰를 Leading Hint의 매개변수로 지정할 수 있습니다.

    ```sql
    mysql> explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
    +--------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                      |
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

## 대표적인 시나리오 예제 {#typical-scenario-examples}

<!-- Knowledge type: Operation example -->
<!-- Applicable scenario: Learning Leading Hint usage / Copying examples for verification -->

### 준비: 테이블 생성문 {#preparation-table-creation-statements}

다음 예제는 모두 아래 테스트 테이블을 기반으로 합니다.

```sql
CREATE DATABASE testleading;
USE testleading;

create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
```

### 기본 시나리오: 두 테이블의 Join 순서 바꾸기 {#basic-scenario-swapping-the-join-order-of-two-tables}

1. 원래 실행 계획:

    ```sql
    mysql> explain shape plan select * from t1 join t2 on t1.c1 = c2;
    +-------------------------------------------+
    | Explain String                            |
    +-------------------------------------------+
    | PhysicalResultSink                        |
    | --PhysicalDistribute                      |
    | ----PhysicalProject                       |
    | ------hashJoin[INNER_JOIN](t1.c1 = t2.c2) |
    | --------PhysicalOlapScan[t2]              |
    | --------PhysicalDistribute                |
    | ----------PhysicalOlapScan[t1]            |
    +-------------------------------------------+
    ```

2. t1과 t2의 Join 순서를 바꾸려면 앞부분에 `leading(t2 t1)`을 추가하면 됩니다. `EXPLAIN`을 실행했을 때 `Used`가 표시되면 Hint가 정상적으로 적용된 것입니다.

    ```sql
    mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
    +------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                              |
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

3. Leading Hint에 구문 오류가 있으면 해당 정보가 `SyntaxError` 항목으로 `EXPLAIN` 출력에 표시됩니다. 이 경우에도 실행 계획은 평소처럼 생성되며, Leading Hint만 사용되지 않습니다.

    ```sql
    mysql> explain shape plan select /*+ leading(t2 t3) */ * from t1 join t2 on t1.c1 = c2;
    +--------------------------------------------------------+
    | Explain String                                         |
    +--------------------------------------------------------+
    | PhysicalResultSink                                     |
    | --PhysicalDistribute                                   |
    | ----PhysicalProject                                    |
    | ------hashJoin[INNER_JOIN](t1.c1 = t2.c2)              |
    | --------PhysicalOlapScan[t1]                           |
    | --------PhysicalDistribute                             |
    | ----------PhysicalOlapScan[t2]                         |
    |                                                        |
    | Used:                                                  |
    | UnUsed:                                                |
    | SyntaxError: leading(t2 t3) Msg:can not find table: t3 |
    +--------------------------------------------------------+
    ```

### 확장 시나리오: 다양한 Join 트리 형태 구성하기 {#extended-scenario-constructing-different-join-tree-shapes}

다음 표는 자주 사용하는 네 가지 Join 트리 형태의 구문을 요약한 것입니다.

| 형태           | Leading 구문                | 설명                                              |
| -------------- | --------------------------- | ------------------------------------------------- |
| Left-deep tree | `leading(t1 t2 t3)`         | 기본 동작이며, 중괄호가 필요하지 않습니다.        |
| Right-deep tree| `leading(t1 {t2 t3})`       | 오른쪽 서브트리를 `{}`로 감쌉니다.                |
| Bushy tree     | `leading({t1 t2} {t3 t4})`  | 왼쪽과 오른쪽 서브트리를 모두 `{}`로 감쌉니다.    |
| Zig-zag tree   | `leading(t1 {t2 t3} t4)`    | 중간에 서브트리를 삽입하여 지그재그 형태를 만듭니다. |

#### Left-Deep Tree 구성 {#left-deep-tree}

앞서 설명한 것처럼 괄호를 사용하지 않으면 Leading Hint는 기본적으로 left-deep tree를 생성합니다.

```sql
mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
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

#### Right-Deep Tree 구성 {#right-deep-tree}

실행 계획을 right-deep tree, Bushy tree 또는 zig-zag tree 형태로 만들려면 중괄호를 추가하여 실행 계획의 형태를 제한하면 됩니다. Oracle처럼 left-deep tree에서 단계별로 순서를 바꿀 필요가 없습니다.

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3;
+-----------------------------------------------+
| Explain String                                |
+-----------------------------------------------+
| PhysicalResultSink                            |
| --PhysicalDistribute                          |
| ----PhysicalProject                           |
| ------hashJoin[INNER_JOIN](t1.c1 = t2.c2)     |
| --------PhysicalOlapScan[t1]                  |
| --------PhysicalDistribute                    |
| ----------hashJoin[INNER_JOIN](t2.c2 = t3.c3) |
| ------------PhysicalOlapScan[t2]              |
| ------------PhysicalDistribute                |
| --------------PhysicalOlapScan[t3]            |
|                                               |
| Used: leading(t1 { t2 t3 })                   |
| UnUsed:                                       |
| SyntaxError:                                  |
+-----------------------------------------------+
```

#### Bushy Tree 구성 {#bushy-tree}

```sql
mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3 join t4 on c3 = c4;
+-----------------------------------------------+
| Explain String                                |
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

#### Zig-Zag Tree 구성 {#zig-zag-tree}

```sql
mysql> explain shape plan select /*+ leading(t1 {t2 t3} t4) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3 join t4 on c3 = c4;
+--------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                      |
+--------------------------------------------------------------------------------------+
| PhysicalResultSink                                                                   |
| --PhysicalDistribute[DistributionSpecGather]                                         |
| ----PhysicalProject                                                                  |
| ------hashJoin[INNER_JOIN] hashCondition=((t3.c3 = t4.c4)) otherCondition=()         |
| --------PhysicalDistribute[DistributionSpecHash]                                     |
| ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
| ------------PhysicalOlapScan[t1]                                                     |
| ------------PhysicalDistribute[DistributionSpecHash]                                 |
| --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
| ----------------PhysicalOlapScan[t2]                                                 |
| ----------------PhysicalDistribute[DistributionSpecHash]                             |
| ------------------PhysicalOlapScan[t3]                                               |
| --------PhysicalDistribute[DistributionSpecHash]                                     |
| ----------PhysicalOlapScan[t4]                                                       |
|                                                                                      |
| Hint log:                                                                            |
| Used: leading(t1 { t2 t3 } t4)                                                       |
| UnUsed:                                                                              |
| SyntaxError:                                                                         |
+--------------------------------------------------------------------------------------+
```

### Non-inner Join 시나리오 {#non-inner-join-scenarios}

Non-Inner Join(예: Outer Join 또는 Semi/Anti Join)이 포함된 경우, Leading Hint는 원래 SQL의 의미를 바탕으로 각 Join의 유형을 자동으로 도출합니다. Leading Hint가 원래 SQL의 의미와 다르거나 해당 실행 계획을 생성할 수 없으면 `UnUsed`로 분류됩니다. 이는 정상적인 실행 계획 생성에 영향을 주지 않습니다.

다음은 순서를 바꿀 수 없는 예제입니다.

```sql
-------- test outer join which can not swap
-- t1 leftjoin (t2 join t3 on (P23)) on (P12) != (t1 leftjoin t2 on (P12)) join t3 on (P23)
mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
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
| Used:                                                                          |
| UnUsed: leading(t1 { t2 t3 })                                                  |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

다음은 순서를 바꿀 수 있는 경우와 바꿀 수 없는 경우의 예제입니다. 직접 실행하여 확인할 수 있습니다.

```sql
-------- test outer join which can swap
-- (t1 leftjoin t2  on (P12)) innerjoin t3 on (P13) = (t1 innerjoin t3 on (P13)) leftjoin t2  on (P12)
explain shape plan select * from t1 left join t2 on c1 = c2 join t3 on c1 = c3;
explain shape plan select /*+ leading(t1 t3 t2) */ * from t1 left join t2 on c1 = c2 join t3 on c1 = c3;

-- (t1 leftjoin t2  on (P12)) leftjoin t3 on (P13) = (t1 leftjoin t3 on (P13)) leftjoin t2  on (P12)
explain shape plan select * from t1 left join t2 on c1 = c2 left join t3 on c1 = c3;
explain shape plan select /*+ leading(t1 t3 t2) */ * from t1 left join t2 on c1 = c2 left join t3 on c1 = c3;

-- (t1 leftjoin t2  on (P12)) leftjoin t3 on (P23) = t1 leftjoin (t2  leftjoin t3 on (P23)) on (P12)
select /*+ leading(t2 t3 t1) SWAP_INPUT(t1) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;

-------- test outer join which can not swap
--  t1 leftjoin (t2  join t3 on (P23)) on (P12) != (t1 leftjoin t2  on (P12)) join t3 on (P23)
-- eliminated to inner join
explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 join t3 on c2 = c3;
explain graph select /*+ leading(t1 t2 t3) */ * from t1 left join (select * from t2 join t3 on c2 = c3) on c1 = c2;

-- test semi join
explain shape plan select * from t1 where c1 in (select c2 from t2);
explain shape plan select /*+ leading(t2 t1) */ * from t1 where c1 in (select c2 from t2);

-- test anti join
explain shape plan select * from t1 where exists (select c2 from t2);
```

### 뷰 / 별칭 시나리오 {#view--alias-scenarios}

별칭이 사용된 경우, 해당 별칭을 하나의 완전하고 독립적인 서브트리로 지정할 수 있습니다. 이러한 서브트리 내부에서는 텍스트에 작성된 순서에 따라 Join 순서가 결정됩니다.

```sql
mysql> explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
+--------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                      |
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

## Ordered Hint {#ordered-hint}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenario: Forcing the Join order to follow the SQL textual order -->

Ordered Hint는 Leading Hint의 특수한 경우로 볼 수 있으며, Join 순서를 SQL 텍스트에 작성된 순서로 강제하는 데 사용합니다.

### 구문 {#syntax-1}

Ordered Hint의 구문은 `/*+ ORDERED */`입니다. `SELECT` 키워드 뒤에 배치하고, 해당 `SELECT` 문의 나머지 쿼리를 바로 이어서 작성합니다.

### 예제 {#example}

다음은 Ordered Hint를 사용하는 예제입니다.

```sql
mysql> explain shape plan select /*+ ORDERED */ t1.c1 from t2 join t1 on t1.c1 = t2.c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t2]                                               |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalProject                                                    |
| --------------PhysicalOlapScan[t1]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t3]                                               |
|                                                                                |
| Hint log:                                                                      |
| Used: ORDERED                                                                  |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

### Leading Hint와의 우선순위 관계 {#priority-relationship-with-leading-hint}

Ordered Hint와 Leading Hint를 함께 사용하면 Ordered Hint가 Leading Hint보다 우선합니다. 즉, Leading Hint를 지정했더라도 Ordered Hint가 함께 있으면 쿼리 실행 계획은 Ordered Hint의 규칙을 따르며, Leading Hint는 무시됩니다.

다음 예제는 두 Hint를 함께 사용한 경우를 보여 줍니다.

```sql
mysql> explain shape plan select /*+ ORDERED LEADING(t1 t2 t3) */ t1.c1 from t2 join t1 on t1.c1 = t2.c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t2]                                               |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalProject                                                    |
| --------------PhysicalOlapScan[t1]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t3]                                               |
|                                                                                |
| Hint log:                                                                      |
| Used: ORDERED                                                                  |
| UnUsed: leading(t1 t2 t3)                                                      |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```

## Leading Hint와 Ordered Hint 비교 {#leading-hint-vs-ordered-hint-comparison}

<!-- Knowledge type: Comparison table -->
<!-- Applicable scenario: Choosing the appropriate Hint -->

| 비교 항목              | Leading Hint                                        | Ordered Hint                                                                |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| 구문                   | `/*+ LEADING(t1 t2 ...) */`                         | `/*+ ORDERED */`                                                            |
| Join 순서              | Hint에 테이블이 나열된 순서를 따름                  | SQL의 `FROM` 절에 테이블이 작성된 순서를 따름                               |
| Join 트리 형태 제어    | 지원하며, `{}`로 명시적으로 지정                    | 지원하지 않으며, left-deep tree로 고정                                      |
| 유연성                 | 높음. 모든 형태의 Join 트리를 지정할 수 있음        | 낮음. 텍스트에 작성된 순서만 따름                                           |
| 함께 사용한 경우       | `UnUsed`로 분류                                    | 우선 적용됨                                                                |

## 자주 묻는 질문(FAQ) {#frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Hint not taking effect / Error troubleshooting -->

### Q1: Leading Hint가 `UnUsed`로 표시되고 `Used`로 표시되지 않는 이유는 무엇인가요(`EXPLAIN` 출력)? {#q1-why-does-the-leading-hint-appear-in-unused-instead-of-used-in-explain}

일반적으로 다음 두 가지 이유가 있습니다.

- Leading Hint가 지정한 Join 순서가 원래 SQL과 의미적으로 동등하지 않습니다(예: 순서를 바꿀 수 없는 Outer Join 시나리오).
- 현재 버전에서 해당 기능을 아직 지원하지 않습니다.

이 경우 Doris는 일반적인 실행 계획 생성 절차로 돌아가며, 쿼리는 정상적으로 실행할 수 있습니다.

### Q2: `SyntaxError`에서 테이블을 찾을 수 없다고 표시되면 어떻게 해야 하나요? {#q2-what-should-i-do-if-syntaxerror-reports-that-a-table-cannot-be-found}

`SyntaxError`는 Hint 자체에 구문 오류가 있음을 나타냅니다. 예를 들어, `leading(t2 t3)`에서 지정한 `t3`가 SQL의 `FROM` 절에 없는 경우입니다. Hint의 테이블 이름이나 별칭이 SQL에서 실제로 사용하는 이름이나 별칭과 일치하는지 확인하세요.

### Q3: Ordered Hint와 Leading Hint를 함께 사용하면 어느 것이 적용되나요? {#q3-which-one-takes-effect-when-ordered-hint-and-leading-hint-are-used-at-the-same-time}

Ordered Hint의 우선순위가 더 높습니다. 두 Hint가 모두 있으면 쿼리는 Ordered Hint에 따라 실행되며(Join 순서가 SQL 텍스트에 작성된 순서를 따름), Leading Hint는 `UnUsed`로 분류됩니다.

### Q4: 기본적으로 어떤 형태의 Join 트리가 생성되나요? 어떻게 조정하나요? {#q4-what-shape-of-join-tree-is-generated-by-default-how-do-i-adjust-it}

중괄호를 사용하지 않으면 기본적으로 left-deep tree가 생성됩니다. right-deep tree, Bushy tree 또는 zig-zag tree를 생성하려면 중괄호 `{}`로 형태를 명시적으로 지정하세요. Oracle처럼 left-deep tree에서 단계별로 순서를 바꿀 필요가 없습니다.

### Q5: Hint의 테이블 이름은 정규화된 전체 이름이어야 하나요? {#q5-do-the-table-names-in-a-hint-need-to-be-fully-qualified}

아닙니다. Hint의 테이블 이름/별칭은 현재 쿼리의 `FROM` 절에서 사용하는 이름과 일치하기만 하면 됩니다. 데이터베이스 이름 접두사는 필요하지 않습니다.

## 요약 {#summary}

Leading Hint는 Join 순서를 수동으로 제어하는 강력한 기능으로, 운영 환경의 튜닝에 널리 사용됩니다. 적절히 사용하면 현장에서 필요한 Join 순서 튜닝을 수행하고 시스템 제어의 유연성을 높일 수 있습니다. Ordered Hint는 Leading Hint의 특수한 형태로, 현재 워크로드의 Join 순서를 텍스트에 작성된 순서로 고정하는 데 사용합니다. 사용할 때는 다른 Hint와의 우선순위 관계에 주의하세요.
