---
title: Distribute Hint для управления способами распределения данных при Join
language: ru
description: Как с помощью Distribute Hint принудительно задать способ распределения данных shuffle или broadcast для Join и настроить производительность запросов.
keywords:
    - Distribute Hint
    - Join Shuffle
    - Broadcast Join
    - Doris Hint
    - настройка Join
    - способ распределения
---

<!-- Knowledge type: Feature description / Operation steps -->
<!-- Applicable scenarios: Join performance tuning / Forcing the distribution method -->

## Обзор {#overview}

Distribute Hint управляет распределением (Shuffle) данных правой таблицы при выполнении Join и часто используется для ручной настройки плана выполнения Join. Явное указание способа распределения позволяет гибко влиять на план выполнения запроса, когда автоматический выбор оптимизатора оказывается неудачным.

**Основные возможности:**

- Принудительное использование способа распределения `shuffle` или `broadcast` для правой таблицы Join.
- Совместное использование с Ordered Hint и Leading Hint для более точной настройки Join.
- Если подсказку невозможно применить, система применяет её по мере возможности и не выдаёт ошибку.

## Быстрая навигация {#quick-navigation}

- [Правила синтаксиса](#syntax-rules)
- [Описание способов распределения](#distribution-method-description)
- [Примеры использования](#use-cases)
    - [Совместное использование с Ordered Hint](#combined-with-ordered-hint)
    - [Совместное использование с Leading Hint](#combined-with-leading-hint)
- [Часто задаваемые вопросы](#faq)

## Правила синтаксиса {#syntax-rules}

| Правило | Описание |
| --- | --- |
| Расположение | Distribute Hint указывается перед правой таблицей Join |
| Допустимые типы | `[shuffle]` или `[broadcast]` |
| Ограничение количества | Поддерживается любое количество подсказок Distribute Hint |
| Обработка сбоев | Если соответствующий план невозможно построить, ошибка не выдаётся. Подсказка применяется по мере возможности, а итоговый способ распределения определяется по выводу EXPLAIN |

## Описание способов распределения {#distribution-method-description}

EXPLAIN Shape Plan показывает тип распределения оператора Distribute. Типы имеют следующие значения:

| Тип распределения | Значение |
| --- | --- |
| `DistributionSpecReplicated` | Копирует соответствующие данные на все узлы BE (распределение Broadcast) |
| `DistributionSpecGather` | Собирает данные на узле FE |
| `DistributionSpecHash` | Распределяет данные между разными узлами BE по определённому hashKey с использованием заданного алгоритма (распределение Shuffle) |

## Примеры использования {#use-cases}

### Совместное использование с Ordered Hint {#combined-with-ordered-hint}

**Сценарий**: сначала с помощью Ordered Hint зафиксируйте порядок Join в соответствии с порядком таблиц в тексте запроса, затем с помощью Distribute Hint укажите нужный способ распределения для каждого Join.

**До** (план по умолчанию):

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

**После** (с указанием распределения Broadcast):

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

Способ распределения данных таблицы `t1` меняется с `DistributionSpecHash` на `DistributionSpecReplicated`, что означает, что распределение Broadcast было применено.

### Совместное использование с Leading Hint {#combined-with-leading-hint}

**Сценарий**: используйте подсказку `LEADING`, чтобы зафиксировать порядок Join, одновременно задавая соответствующий способ `DISTRIBUTE` для каждой операции `JOIN`. Это позволяет полностью контролировать план выполнения.

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

## Часто задаваемые вопросы {#faq}

**Вопрос 1: Что произойдёт, если Distribute Hint записана неверно или соответствующий план невозможно построить?**

Система не выдаёт ошибку и пытается применить подсказку по мере возможности. Определить, была ли подсказка в итоге применена, можно по типу оператора Distribute в выводе `EXPLAIN`.

**Вопрос 2: Когда следует использовать `shuffle`, а когда — `broadcast`?**

- `broadcast`: используйте, когда объём данных правой таблицы невелик и затраты на их копирование на все узлы BE ниже затрат на Shuffle.
- `shuffle`: используйте, когда обе таблицы содержат большой объём данных и перераспределение по hashKey эффективнее.

**Вопрос 3: Можно ли указать способ распределения сразу для нескольких операций Join?**

Да. Количество подсказок Distribute Hint не ограничено. Их можно сочетать с Ordered Hint и Leading Hint, чтобы отдельно задать способ распределения для каждого Join.

## Итоги {#summary}

Distribute Hint часто используется для управления способом Join Shuffle и позволяет вручную задать способ распределения `shuffle` или `broadcast`. Грамотное использование Distribute Hint позволяет настроить способ Join Shuffle под условия конкретной среды и более гибко управлять системой.
