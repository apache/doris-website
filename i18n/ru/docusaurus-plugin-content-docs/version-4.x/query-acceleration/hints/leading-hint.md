---
title: Управление порядком Join с помощью Leading Hint
language: ru
description: Как использовать Leading Hint в Doris, чтобы вручную задавать порядок Join нескольких таблиц и решать сложные задачи оптимизации запросов.
keywords:
    - Doris Leading Hint
    - Управление порядком Join
    - Ordered Hint
    - Левоглубокое дерево, правоглубокое дерево, кустистое дерево
    - Настройка Join Reorder
    - SyntaxError UnUsed
---

<!-- Knowledge type: Feature description / Operation steps -->
<!-- Applicable scenario: Complex query performance tuning / Manual intervention in Join order -->

## Определение в одном предложении {#one-sentence-definition}

Leading Hint представляет собой подсказку для запросов в Doris, которая позволяет вручную задавать порядок Join нескольких таблиц. Комментарий `/*+ LEADING(...) */` после ключевого слова `SELECT` указывает оптимизатору, в каком порядке построить план Join, что позволяет повысить производительность сложных запросов.

## Обзор сценариев применения {#quick-look-at-applicable-scenarios}

<!-- Knowledge type: Scenario guide -->
<!-- Applicable scenario: Choosing the appropriate Hint type -->

Рассмотрите возможность использования Leading Hint или Ordered Hint в следующих случаях:

- Порядок Join, автоматически выбранный оптимизатором, неоптимален и требует ручной корректировки.
- В сложном Join нескольких таблиц нужно явно задать форму левоглубокого, правоглубокого, кустистого или зигзагообразного дерева.
- Представление или подзапрос участвует в Join Reorder под псевдонимом, и нужно задать положение всего поддерева как единого целого.
- Нужно принудительно задать порядок Join в соответствии с порядком таблиц в тексте SQL (с помощью Ordered Hint).

## Контрольный список перед использованием {#pre-use-checklist}

<!-- Knowledge type: Operation checklist -->

Перед добавлением подсказки проверьте следующее:

- [ ] В SQL есть как минимум две таблицы, участвующие в Join.
- [ ] Имена таблиц или псевдонимы в подсказке совпадают с указанными в предложении `FROM`.
- [ ] Вы сравнили исходный план с целевым с помощью `EXPLAIN SHAPE PLAN`.
- [ ] Вы проверили, что целевой порядок Join семантически эквивалентен исходному SQL (особенно в сценариях с Outer Join / Semi / Anti Join).

## Быстрая навигация {#quick-navigation}

- [Обычная подсказка Leading Hint](#regular-leading-hint): базовый синтаксис, состояния применения, типичное использование.
- [Примеры типовых сценариев](#typical-scenario-examples): базовое использование + левоглубокое дерево / правоглубокое дерево / кустистое дерево / зигзагообразное дерево / Join, отличный от Inner Join / представление.
- [Подсказка Ordered Hint](#ordered-hint): частный случай, фиксирующий порядок Join в соответствии с порядком в тексте запроса.
- [Часто задаваемые вопросы (FAQ)](#frequently-asked-questions-faq): причины, по которым подсказка не применяется, приоритет относительно других подсказок и другие вопросы.

## Обычная подсказка Leading Hint {#regular-leading-hint}

<!-- Knowledge type: Syntax description -->

### Синтаксис {#syntax}

Leading Hint позволяет задать порядок соединения таблиц, которому должен следовать оптимизатор. В Doris базовый синтаксис выглядит следующим образом:

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```

Примечания к синтаксису:

- Подсказка Leading Hint заключается между `/*+` и `*/` и размещается после ключевого слова `SELECT` в операторе SQL.
- `tablespec` обозначает имя таблицы или её псевдоним; необходимо указать как минимум две таблицы.
- Несколько таблиц разделяются пробелами или `,`.
- Фигурные скобки `{}` позволяют явно задать форму дерева Join.

Минимальный пример:

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

### Состояния применения подсказки {#hint-effective-states}

Если Leading Hint не применяется, план строится обычным образом. `EXPLAIN` показывает, была ли применена подсказка. Возможны три основных состояния:

| Состояние     | Описание                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `Used`        | Подсказка Leading Hint успешно применяется.                                                                                                    |
| `UnUsed`      | Неподдерживаемые случаи: порядок Join, заданный в Leading Hint, не эквивалентен исходному SQL либо эта возможность ещё не поддерживается в данной версии (подробнее см. ограничения). |
| `SyntaxError` | В Leading Hint есть синтаксическая ошибка, например не найдена соответствующая таблица.                                                 |

### Основные правила {#core-rules}

1. **По умолчанию строится левоглубокое дерево**: если скобки не используются, Leading Hint по умолчанию формирует левоглубокое дерево.

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

2. **Используйте фигурные скобки, чтобы задать форму дерева Join**: с помощью `{}` можно явно управлять формой дерева Join.

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

3. **Представления и псевдонимы поддерживаются в качестве параметров**: если представление участвует в Join Reorder под псевдонимом, его можно указать в качестве параметра Leading Hint.

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

## Примеры типовых сценариев {#typical-scenario-examples}

<!-- Knowledge type: Operation example -->
<!-- Applicable scenario: Learning Leading Hint usage / Copying examples for verification -->

### Подготовка: операторы создания таблиц {#preparation-table-creation-statements}

Все приведённые ниже примеры используют этот набор тестовых таблиц.

```sql
CREATE DATABASE testleading;
USE testleading;

create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
```

### Базовый сценарий: изменение порядка Join двух таблиц {#basic-scenario-swapping-the-join-order-of-two-tables}

1. Исходный план:

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

2. Чтобы поменять порядок Join таблиц t1 и t2, достаточно добавить в начало запроса `leading(t2 t1)`. В выводе `EXPLAIN` состояние `Used` означает, что подсказка успешно применяется.

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

3. Если в Leading Hint есть синтаксическая ошибка, сведения о ней отображаются в строке `SyntaxError` вывода `EXPLAIN`. При этом план по-прежнему строится обычным образом, а Leading Hint просто не применяется.

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

### Расширенный сценарий: построение деревьев Join различной формы {#extended-scenario-constructing-different-join-tree-shapes}

В следующей таблице приведён синтаксис для четырёх распространённых форм дерева Join:

| Форма          | Синтаксис Leading              | Описание                                       |
| -------------- | --------------------------- | ------------------------------------------------- |
| Левоглубокое дерево | `leading(t1 t2 t3)`         | Поведение по умолчанию; фигурные скобки не нужны.     |
| Правоглубокое дерево| `leading(t1 {t2 t3})`       | Заключите правое поддерево в `{}`.                 |
| Кустистое дерево     | `leading({t1 t2} {t3 t4})`  | Заключите левое и правое поддеревья в `{}`.  |
| Зигзагообразное дерево   | `leading(t1 {t2 t3} t4)`    | Вставьте поддерево в середину, чтобы получить зигзагообразную форму.  |

#### Левоглубокое дерево {#left-deep-tree}

Как упоминалось ранее, если скобки не используются, Leading Hint по умолчанию формирует левоглубокое дерево.

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

#### Правоглубокое дерево {#right-deep-tree}

Чтобы придать плану форму правоглубокого, кустистого или зигзагообразного дерева, достаточно добавить фигурные скобки, задающие его форму. Пошагово преобразовывать левоглубокое дерево, как в Oracle, не требуется.

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

#### Кустистое дерево {#bushy-tree}

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

#### Зигзагообразное дерево {#zig-zag-tree}

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

### Сценарии с Join, отличными от Inner Join {#non-inner-join-scenarios}

Если используются Join, отличные от Inner Join (например, Outer Join или Semi/Anti Join), Leading Hint автоматически определяет тип каждого Join на основе семантики исходного SQL. Если порядок, заданный в Leading Hint, не соответствует семантике исходного SQL или такой план невозможно построить, подсказка попадает в `UnUsed`. Это не влияет на построение плана обычным образом.

Ниже приведён пример, в котором порядок изменить нельзя:

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

Ниже приведены примеры, в которых порядок можно и нельзя изменить. Их можно проверить самостоятельно.

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

### Сценарии с представлениями и псевдонимами {#view--alias-scenarios}

При использовании псевдонимов можно указать псевдоним как целое независимое поддерево. Внутри таких поддеревьев порядок Join формируется в соответствии с порядком в тексте запроса.

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

## Подсказка Ordered Hint {#ordered-hint}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenario: Forcing the Join order to follow the SQL textual order -->

Ordered Hint можно рассматривать как частный случай Leading Hint, который принудительно задаёт порядок Join в соответствии с порядком в тексте SQL.

### Синтаксис {#syntax-1}

Ordered Hint имеет синтаксис `/*+ ORDERED */`. Подсказка размещается после ключевого слова `SELECT` в операторе `SELECT`, а сразу за ней следует остальная часть запроса.

### Пример {#example}

Ниже приведён пример использования Ordered Hint:

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

### Приоритет относительно Leading Hint {#priority-relationship-with-leading-hint}

При одновременном использовании Ordered Hint и Leading Hint приоритет имеет Ordered Hint. Это означает, что даже при наличии Leading Hint план запроса выполняется по правилам Ordered Hint, а Leading Hint игнорируется.

Следующий пример показывает одновременное использование обеих подсказок:

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

## Сравнение Leading Hint и Ordered Hint {#leading-hint-vs-ordered-hint-comparison}

<!-- Knowledge type: Comparison table -->
<!-- Applicable scenario: Choosing the appropriate Hint -->

| Параметр              | Leading Hint                                        | Ordered Hint                                                                |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| Синтаксис                 | `/*+ LEADING(t1 t2 ...) */`                         | `/*+ ORDERED */`                                                            |
| Порядок Join             | Соответствует порядку перечисления таблиц в подсказке | Соответствует порядку таблиц в предложении SQL `FROM` |
| Управление формой дерева Join | Поддерживается; форма явно задаётся с помощью `{}`        | Не поддерживается; всегда используется левоглубокое дерево                                    |
| Гибкость            | Высокая; можно задать любую форму дерева Join            | Низкая; используется только порядок в тексте запроса                                         |
| При совместном использовании     | Попадает в `UnUsed`                                  | Имеет приоритет                                                              |

## Часто задаваемые вопросы (FAQ) {#frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Hint not taking effect / Error troubleshooting -->

### Вопрос 1: Почему Leading Hint отображается в `UnUsed`, а не в `Used` в выводе `EXPLAIN`? {#q1-why-does-the-leading-hint-appear-in-unused-instead-of-used-in-explain}

Обычно причины относятся к двум категориям:

- Порядок Join, заданный в Leading Hint, семантически не эквивалентен исходному SQL (например, в сценарии с Outer Join, где перестановка недопустима).
- Текущая версия ещё не поддерживает эту возможность.

В этом случае Doris возвращается к обычному построению плана, и запрос по-прежнему может выполняться корректно.

### Вопрос 2: Что делать, если `SyntaxError` сообщает, что таблица не найдена? {#q2-what-should-i-do-if-syntaxerror-reports-that-a-table-cannot-be-found}

`SyntaxError` означает, что в самой подсказке есть синтаксическая ошибка. Например, в подсказке `leading(t2 t3)` указана таблица `t3`, которой нет в предложении `FROM` исходного SQL. Проверьте, совпадают ли имена таблиц или псевдонимы в подсказке с теми, которые фактически используются в SQL.

### Вопрос 3: Какая подсказка применяется при одновременном использовании Ordered Hint и Leading Hint? {#q3-which-one-takes-effect-when-ordered-hint-and-leading-hint-are-used-at-the-same-time}

Ordered Hint имеет более высокий приоритет. Если присутствуют обе подсказки, запрос выполняется в соответствии с Ordered Hint (порядок Join соответствует порядку в тексте SQL), а Leading Hint попадает в `UnUsed`.

### Вопрос 4: Какая форма дерева Join используется по умолчанию? Как её изменить? {#q4-what-shape-of-join-tree-is-generated-by-default-how-do-i-adjust-it}

Если фигурные скобки не используются, по умолчанию строится левоглубокое дерево. Чтобы получить правоглубокое, кустистое или зигзагообразное дерево, явно задайте форму с помощью фигурных скобок `{}`. Пошагово преобразовывать левоглубокое дерево, как в Oracle, не требуется.

### Вопрос 5: Нужно ли указывать полные имена таблиц в подсказке? {#q5-do-the-table-names-in-a-hint-need-to-be-fully-qualified}

Нет. Достаточно, чтобы имена таблиц или псевдонимы в подсказке совпадали с именами в предложении `FROM` текущего запроса. Префикс с именем базы данных не требуется.

## Итоги {#summary}

Leading Hint предоставляет широкие возможности для ручного управления порядком Join и часто используется при оптимизации в производственной среде. При правильном применении Leading Hint позволяет настраивать порядок Join под конкретную рабочую нагрузку и гибче управлять системой. Ordered Hint представляет собой особую форму Leading Hint, которая фиксирует порядок Join для текущей рабочей нагрузки в соответствии с порядком в тексте запроса. При её использовании учитывайте приоритет относительно других подсказок.
