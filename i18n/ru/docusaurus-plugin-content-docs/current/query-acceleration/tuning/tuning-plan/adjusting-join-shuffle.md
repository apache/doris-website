---
{
    "title": "Настройка режима Shuffle для Join с помощью подсказок",
    "language": "ru",
    "description": "Как настроить режим Shuffle для Join в Doris с помощью Distribute Hint? В этой статье описаны синтаксис подсказок [shuffle] и [broadcast], сравнение планов выполнения и практические рекомендации по настройке.",
    "keywords": ["Doris Join Shuffle", "Distribute Hint", "подсказка broadcast", "подсказка shuffle", "настройка Join", "план выполнения Nereids"]
}
---

<!-- Knowledge type: concept + operation -->
<!-- Applicable scenario: manually adjust the Join data distribution mode to optimize query performance -->

Distribute Hint — это синтаксис подсказок Doris для ручного указания режима распределения данных правой таблицы в Join. Он позволяет переопределить выбор оптимизатора в отдельных сценариях, чтобы повысить производительность Join.

**Что проверить перед настройкой**:

- Вы проверили текущий режим распределения данных Join с помощью `EXPLAIN SHAPE PLAN`.
- Вы убедились, что в плане по умолчанию есть узкое место, снижающее производительность (например, для небольшой таблицы используется Shuffle, а для большой — Broadcast).
- Вы знаете объёмы данных в обеих таблицах и можете определить, подходит ли Broadcast или Shuffle.
- Подсказки используются только при профессиональной настройке производительности; при решении бизнес-задач ручное вмешательство не требуется.

:::caution Примечание
Doris уже предоставляет широкие возможности «из коробки», поэтому в подавляющем большинстве сценариев Doris адаптивно оптимизирует производительность, и пользователям не требуется вручную управлять подсказками при настройке бизнес-запросов. Эта глава предназначена главным образом для специалистов по настройке производительности; бизнес-пользователям достаточно общего понимания.
:::

## Синтаксис Distribute Hint {#distribute-hint-syntax}

<!-- Knowledge type: reference -->
<!-- Applicable scenario: specify the distribution mode of the Join right table when writing SQL -->

Doris поддерживает две независимые [подсказки Distribute Hint](../../../query-acceleration/hints/distribute-hint.md). Их необходимо размещать перед правой таблицей Join и заключать в квадратные скобки `[]`.

### Сравнение типов подсказок {#hint-type-comparison}

| Тип подсказки  | Режим распределения (DistributionSpec) | Типичный сценарий применения                                 | Затраты на передачу данных          |
| :------------- | :----------------------------------- | :----------------------------------------------------------- | :---------------------------------- |
| `[shuffle]`    | `DistributionSpecHash`               | Обе таблицы большие; данные перераспределяются по хешу Join Key | Данные обеих таблиц перераспределяются по ключу |
| `[broadcast]`  | `DistributionSpecReplicated`         | Правая таблица небольшая и реплицируется на каждый узел BE    | Правая таблица полностью реплицируется на каждый узел BE |

> Совет: можно также сочетать Leading Hint с Distribute Hint, чтобы одновременно задать режим Shuffle. Подробнее см. в разделе [Управление порядком Join с помощью Leading Hint](reordering-join-with-leading-hint.md).

### Минимальный пример {#minimal-example}

```sql
-- Force the right table to use Broadcast distribution
SELECT COUNT(*) FROM t2 JOIN [broadcast] t1 ON t1.c1 = t2.c2;

-- Force the right table to use Shuffle distribution
SELECT COUNT(*) FROM t2 JOIN [shuffle] t1 ON t1.c1 = t2.c2;
```

## Пример: проверка действия подсказки с помощью EXPLAIN {#case-verify-the-hint-effect-with-explain}

<!-- Knowledge type: operational example -->
<!-- Applicable scenario: verify whether a hint takes effect during tuning -->

В следующем примере на одном и том же запросе показана разница между планами выполнения до и после применения подсказки.

### Шаг 1: просмотр плана выполнения по умолчанию {#step-1-view-the-default-execution-plan}

**Цель**: проверить, какой режим распределения оптимизатор выбирает по умолчанию.

**Команда**:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN t2 ON t1.c1 = t2.c2;
```

**Описание**: в плане по умолчанию для `t2` используется `DistributionSpecHash`, то есть распределение Shuffle по хешу.

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

### Шаг 2: добавление подсказки [broadcast] {#step-2-add-the-broadcast-hint}

**Цель**: изменить режим распределения правой таблицы `t2` на Broadcast.

**Команда**:

```sql
EXPLAIN SHAPE PLAN SELECT COUNT(*) FROM t1 JOIN [broadcast] t2 ON t1.c1 = t2.c2;
```

**Описание**: в плане выполнения режим распределения для `t2` меняется с `DistributionSpecHash` на `DistributionSpecReplicated`, что указывает на успешное применение подсказки.

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

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenario: the hint does not take effect as expected, or it is hard to choose between hints -->

### Q1: почему добавленная подсказка не действует? {#q1-why-does-the-hint-not-take-effect-after-i-add-it}

-   Убедитесь, что подсказка находится перед **правой таблицей Join**, например `JOIN [broadcast] t1`, а не перед левой таблицей.
-   С помощью `EXPLAIN SHAPE PLAN` проверьте, соответствует ли `DistributionSpec` узла `PhysicalDistribute` вашим ожиданиям.
-   Подсказки с синтаксическими ошибками (например, пропущенными скобками или опечатками) игнорируются без предупреждения. Проверьте синтаксис SQL.

### Q2: когда использовать [broadcast], а когда [shuffle]? {#q2-when-should-i-use-broadcast-versus-shuffle}

| Сценарий                              | Рекомендуемая подсказка | Причина                                      |
| :------------------------------------ | :--------------- | :------------------------------------------- |
| Правая таблица небольшая (например, таблица измерений) | `[broadcast]`    | Позволяет избежать сетевых затрат на Shuffle большой таблицы |
| Обе таблицы большие, данные распределены равномерно | `[shuffle]`      | Broadcast увеличивает затраты на передачу данных правой таблицы |
| Данные по Join Key распределены крайне неравномерно | `[broadcast]`    | Позволяет избежать перегрузки отдельных узлов после Shuffle |

### Q3: нужно ли вручную указывать подсказку? {#q3-do-i-need-to-manually-specify-a-hint}

В большинстве сценариев это не требуется. Оптимизатор Doris адаптивно выбирает подходящий режим распределения. Используйте подсказку только тогда, когда производительность не соответствует ожиданиям и вы точно установили, что выбор оптимизатора неоптимален.

## Итоги {#summary}

Грамотное использование Distribute Hint позволяет оптимизировать режим Shuffle для операций Join и повысить производительность запросов. На практике рекомендуется сначала проанализировать план выполнения с помощью `EXPLAIN SHAPE PLAN`, а затем выбрать `[shuffle]` или `[broadcast]` с учётом объёма данных и особенностей их распределения.
