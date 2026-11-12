---
{
    "title": "Управление порядком Join с помощью Leading Hint: как задать порядок Join вручную для оптимизации запросов",
    "sidebar_label": "Управление порядком Join с помощью Leading Hint",
    "language": "ru",
    "description": "Как вручную задать порядок Join в Doris с помощью Leading Hint? В статье приведены практические примеры перестановки левой и правой таблиц, построения left-deep tree, right-deep tree и Bushy tree, а также совместного использования с Distribute Hint.",
    "keywords": ["Doris Leading Hint", "порядок Join", "left-deep tree", "right-deep tree", "Bushy tree", "Distribute Hint", "Nereids Planner", "настройка запросов"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenarios: complex multi-table Join tuning, manual intervention when CBO selection is suboptimal -->

**Leading Hint** представляет собой синтаксис подсказок для ручного задания порядка Join нескольких таблиц в SQL. Он позволяет оптимизировать планы выполнения сложных запросов в определённых сценариях. Подробное описание синтаксиса приведено в документации [leading hint](../../../query-acceleration/hints/leading-hint.md).

### Перед чтением {#reading-notes}

- Вы знакомы с оптимизатором Nereids в Doris и выводом `EXPLAIN SHAPE PLAN`
- Текущий запрос выполняет Join нескольких таблиц, а порядок, автоматически выбранный оптимизатором, не соответствует ожиданиям
- Вам нужно задать структуру Join в виде left-deep tree, right-deep tree или Bushy tree
- Вам нужно одновременно управлять порядком Join и способом распределения данных (Shuffle / Broadcast)

:::caution Примечание
Doris уже предоставляет широкие возможности без дополнительной настройки. В подавляющем большинстве случаев оптимизатор адаптивно подбирает план для повышения производительности в различных сценариях, и **пользователям не требуется выполнять ручную настройку с помощью Hint**. Материал этой главы предназначен прежде всего для специалистов по настройке производительности; бизнес-пользователям достаточно иметь общее представление об этих возможностях.
:::

## Краткая справка по сценариям использования {#quick-reference-for-applicable-scenarios}

<!-- Knowledge type: reference -->
<!-- Applicable scenarios: quickly determine which Hint form to use -->

| Сценарий | Рекомендуемый синтаксис Hint | Итоговая структура Join |
| --- | --- | --- |
| Поменять местами левую и правую таблицы в Join двух таблиц | `leading(t2 t1)` | Левая и правая таблицы поменяны местами |
| Принудительно использовать left-deep tree для нескольких таблиц | `leading(t1 t2 t3)` | left-deep tree |
| Принудительно использовать right-deep tree для нескольких таблиц | `leading(t1 {t2 t3})` | right-deep tree |
| Принудительно использовать Bushy tree для нескольких таблиц | `leading({t1 t2} {t3 t4})` | Bushy tree |
| Подзапрос / представление участвует в Join как единое целое | `leading(alias t1)` | Псевдоним выступает как единый узел Join |
| Управлять порядком и способом распределения данных одновременно | `leading(a shuffle b broadcast c)` | Заданный порядок и указанный способ Shuffle / Broadcast |

> Определение в одном предложении: Leading Hint = ручное указание оптимизатору, «для каких таблиц выполнять Join сначала, для каких затем и с какой структурой».

## Пример 1: изменение порядка левой и правой таблиц {#case-1-adjusting-the-order-of-left-and-right-tables}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: swap the left and right tables in a two-table Join -->

**Цель**: изменить порядок по умолчанию `t1 join t2` на `t2 join t1`.

**Исходный план**:

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

**Применение Leading Hint**:

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

**Пояснение**: запись `Used: leading(t2 t1)` в журнале Hint означает, что подсказка применена и левая и правая таблицы поменяны местами.

## Пример 2: принудительное использование left-deep tree {#case-2-forcing-a-left-deep-tree}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: join multiple tables in a linear, sequential manner -->

**Цель**: выполнить Join таблиц `t1`, `t2` и `t3` в виде left-deep tree со структурой `((t1 ⨝ t2) ⨝ t3)`.

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

**Пояснение**: запись `Used: leading(t1 t2 t3)` в журнале Hint означает, что подсказка применена и план имеет структуру left-deep tree.

## Пример 3: принудительное использование right-deep tree {#case-3-forcing-a-right-deep-tree}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: have the right subtree carry the main Join chain -->

**Цель**: заключить вложенный Join справа в фигурные скобки `{}`, чтобы построить right-deep tree со структурой `(t1 ⨝ (t2 ⨝ t3))`.

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

**Пояснение**: запись `Used: leading(t1 { t2 t3 })` в журнале Hint означает, что подсказка применена и план имеет структуру right-deep tree.

## Пример 4: принудительное использование Bushy tree {#case-4-forcing-a-bushy-tree}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: four or more tables, where the left and right subtrees should each Join first before being combined -->

**Цель**: использовать две пары скобок `{}` для левого и правого поддеревьев соответственно, чтобы построить Bushy tree со структурой `((t1 ⨝ t2) ⨝ (t3 ⨝ t4))`.

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

**Пояснение**: запись `Used: leading({ t1 t2 } { t3 t4 })` в журнале Hint означает, что подсказка применена и план имеет структуру Bushy tree.

## Пример 5: участие представления / подзапроса в Join как единого целого {#case-5-view--subquery-participating-in-the-join-as-a-whole}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: a subquery or view has an alias and needs to participate in ordering as a single Join node -->

**Цель**: выполнить Join подзапроса с псевдонимом `alias` и внешней таблицы `t1` в заданном порядке.

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

**Пояснение**: запись `Used: leading(alias t1)` в журнале Hint означает, что подсказка применена и подзапрос `alias` рассматривается как единый узел.

## Пример 6: совместное использование Distribute Hint и Leading Hint {#case-6-mixing-distribute-hint-with-leading-hint}

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: complex multi-table queries that need to control both Join order and distribution method -->

**Цель**: при задании порядка Join указать способ распределения данных `shuffle` или `broadcast` для каждой пары соединяемых таблиц.

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

**Значение ключевых слов**:

| Ключевое слово | Назначение |
| --- | --- |
| `leading(...)` | Управляет общим взаимным порядком таблиц и структурой Join |
| `shuffle` | Указывает, что этот Join использует распределение Shuffle |
| `broadcast` | Указывает, что этот Join использует распределение Broadcast |
| `{ ... }` | Объединяет несколько таблиц в поддерево, определяя структуру Join |

**Пояснение**: сочетая эти два типа Hint, можно гибко управлять порядком и способом выполнения Join одновременно, что упрощает ручное задание нужного плана выполнения.

:::caution Рекомендации по использованию
- Используйте `EXPLAIN`, чтобы тщательно проанализировать план выполнения и убедиться, что Leading Hint даёт ожидаемый результат.
- После обновления версии Doris или изменения бизнес-данных повторно оценивайте эффект Leading Hint, фиксируйте результаты и своевременно вносите корректировки.
:::

## Часто задаваемые вопросы {#frequently-asked-questions}

<!-- Knowledge type: troubleshooting -->
<!-- Applicable scenarios: the Hint does not take effect or behavior does not meet expectations -->

### Вопрос 1: Hint не сработал, а в журнале Hint есть записи в `UnUsed` или `SyntaxError`? {#q1-the-hint-did-not-take-effect-and-the-hint-log-shows-content-under-unused-or-syntaxerror}

- **Распространённые причины**: опечатки в именах таблиц / псевдонимах в Hint, несовпадение количества таблиц в Hint и SQL или непарные скобки.
- **Диагностика**: проверьте раздел `Hint log` в конце вывода `EXPLAIN SHAPE PLAN` и найдите конкретное сообщение в строке `UnUsed` или `SyntaxError`.

### Вопрос 2: как связаны Leading Hint и Distribute Hint? {#q2-what-is-the-relationship-between-leading-hint-and-distribute-hint}

- `leading` определяет, **для каких таблиц выполнять Join сначала и какова будет итоговая структура**; `shuffle` / `broadcast` определяет **способ распределения данных для каждой пары соединяемых таблиц**.
- Их можно использовать независимо или совместно, как в [примере 6](#case-6-mixing-distribute-hint-with-leading-hint).

### Вопрос 3: почему нельзя разбить подзапрос на отдельные части в Leading Hint? {#q3-why-can-a-subquery-not-be-split-into-a-leading-hint}

- Подзапрос / представление участвует в порядке, заданном через `leading`, как **единый узел**, обозначенный его псевдонимом. См. [пример 5](#case-5-view--subquery-participating-in-the-join-as-a-whole).
- Если нужно также задать порядок таблиц внутри подзапроса, укажите ещё одну подсказку `leading` внутри него.

### Вопрос 4: когда не следует использовать Leading Hint? {#q4-when-should-leading-hint-not-be-used}

- План, автоматически выбранный оптимизатором, уже оптимален.
- Если бизнес-данные часто меняются, а статистика нестабильна, фиксация плана с помощью Hint может привести к снижению производительности.

## Итоги {#summary}

<!-- Knowledge type: concept -->
<!-- Applicable scenarios: deciding whether to adopt Leading Hint -->

- **Leading Hint** позволяет вручную управлять порядком и структурой Join (left-deep tree / right-deep tree / Bushy tree).
- **Его можно сочетать с подсказками Shuffle / Broadcast**, чтобы одновременно управлять порядком и способом распределения данных.
- **Используйте с осторожностью**: применяйте Leading Hint только после полного изучения особенностей запроса и распределения данных и периодически пересматривайте его по мере изменения версий и данных.
