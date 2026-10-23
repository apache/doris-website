---
{
    "title": "Прозрачное переписывание с асинхронными материализованными представлениями: ускорение сложных запросов",
    "sidebar_label": "Прозрачное переписывание с асинхронными MV",
    "language": "ru",
    "description": "Как использовать асинхронные материализованные представления Doris для прозрачного переписывания? В этой статье описаны алгоритм переписывания на основе SPJG, практические примеры и способы проверки использования представлений, которые помогут ускорить сложные запросы с соединениями и агрегацией.",
    "keywords": ["асинхронное материализованное представление Doris", "прозрачное переписывание", "SPJG", "ускорение запросов", "explain shape plan", "использование материализованного представления"]
}
---

<!-- Knowledge type: Concept + How-to guide -->
<!-- Applicable scenario: Performance optimization for complex JOIN/aggregation queries -->

Прозрачное переписывание с использованием асинхронных материализованных представлений означает, что Doris автоматически анализирует структуру SQL-запроса и переписывает его в эквивалентный запрос на основе существующих материализованных представлений. Это позволяет повторно использовать заранее вычисленные результаты и ускорить выполнение запроса.

## Перед началом {#before-you-read}

- Вы знакомы с основными понятиями [асинхронных материализованных представлений](../../materialized-view/async-materialized-view/overview.md).
- У вас есть опыт работы с SQL и `EXPLAIN`.
- Запрос соответствует шаблону SPJG (SELECT-PROJECT-JOIN-GROUP-BY).
- У вас есть права на создание материализованных представлений и выполнение запросов к таблицам.

## Обзор {#overview}

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Understanding the principles of transparent rewriting -->

[Асинхронные материализованные представления](../../materialized-view/async-materialized-view/overview.md) используют алгоритм прозрачного переписывания на основе шаблона SPJG (SELECT-PROJECT-JOIN-GROUP-BY).

Основные возможности этого алгоритма:

- **Анализ структуры**: автоматически разбирает логическую структуру SQL-запроса.
- **Подбор представлений**: ищет подходящие варианты среди существующих материализованных представлений.
- **Прозрачное переписывание**: преобразует запрос в эквивалентный запрос на основе материализованного представления без изменения исходного SQL.
- **Повышение производительности**: значительно ускоряет запросы и снижает вычислительные затраты за счёт повторного использования заранее вычисленных результатов.

## Сценарии применения {#applicable-scenarios}

<!-- Knowledge type: Decision reference -->
<!-- Applicable scenario: Deciding whether to use transparent rewriting -->

| Особенность сценария | Рекомендуется ли прозрачное переписывание? | Описание |
| --- | --- | --- |
| Сложные запросы с JOIN + GROUP BY | Рекомендуется | Естественным образом соответствуют шаблону SPJG |
| Часто повторяющиеся запросы с агрегацией | Рекомендуется | Предварительные вычисления дают значительный выигрыш |
| Базовые таблицы с редко изменяющимися данными | Рекомендуется | Низкие затраты на обслуживание |
| Базовые таблицы с часто изменяющимися данными | Не рекомендуется | Высокие накладные расходы на обновление материализованных представлений |
| Только простые точечные запросы | Не рекомендуется | Ограниченный выигрыш от предварительных вычислений |
| Ограниченные ресурсы хранения | Использовать с осторожностью | Материализованным представлениям требуется дополнительное место для хранения |

## Практический пример: ускорение запросов с помощью материализованного представления {#hands-on-example-accelerating-queries-with-a-materialized-view}

<!-- Knowledge type: How-to guide -->
<!-- Applicable scenario: End-to-end implementation of transparent rewriting -->

Следующий пошаговый пример на наборе данных TPC-H демонстрирует весь процесс прозрачного переписывания.

### Шаг 1: создание базовых таблиц {#step-1-create-the-base-tables}

**Цель**: создать таблицы `orders` и `lineitem` для примера и загрузить в них данные.

**Команды**:

```sql
CREATE DATABASE IF NOT EXISTS tpch;
USE tpch;

CREATE TABLE IF NOT EXISTS orders (
    o_orderkey       integer not null,
    o_custkey        integer not null,
    o_orderstatus    char(1) not null,
    o_totalprice     decimalv3(15,2) not null,
    o_orderdate      date not null,
    o_orderpriority  char(15) not null,
    o_clerk          char(15) not null,
    o_shippriority   integer not null,
    o_comment        varchar(79) not null
)
DUPLICATE KEY(o_orderkey, o_custkey)
PARTITION BY RANGE(o_orderdate)(
    FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO orders VALUES
    (1, 1, 'o', 99.5, '2023-10-17', 'a', 'b', 1, 'yy'),
    (2, 2, 'o', 109.2, '2023-10-18', 'c','d',2, 'mm'),
    (3, 3, 'o', 99.5, '2023-10-19', 'a', 'b', 1, 'yy');

CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey    integer not null,
    l_partkey     integer not null,
    l_suppkey     integer not null,
    l_linenumber  integer not null,
    l_quantity    decimalv3(15,2) not null,
    l_extendedprice  decimalv3(15,2) not null,
    l_discount    decimalv3(15,2) not null,
    l_tax         decimalv3(15,2) not null,
    l_returnflag  char(1) not null,
    l_linestatus  char(1) not null,
    l_shipdate    date not null,
    l_commitdate  date not null,
    l_receiptdate date not null,
    l_shipinstruct char(25) not null,
    l_shipmode     char(10) not null,
    l_comment      varchar(44) not null
)
DUPLICATE KEY(l_orderkey, l_partkey, l_suppkey, l_linenumber)
PARTITION BY RANGE(l_shipdate)
(FROM ('2023-10-17') TO ('2023-10-20') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3
PROPERTIES ("replication_num" = "1");

INSERT INTO lineitem VALUES
    (1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
    (2, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
    (3, 2, 3, 6, 7.5, 8.5, 9.5, 10.5, 'k', 'o', '2023-10-19', '2023-10-19', '2023-10-19', 'c', 'd', 'xxxxxxxxx');
```

**Примечания**: обе таблицы партиционированы по дате, что упрощает обновление материализованного представления по партициям.

### Шаг 2: создание асинхронного материализованного представления {#step-2-create-an-async-materialized-view}

**Цель**: создать асинхронное материализованное представление `mv1` с предварительной агрегацией на основе `lineitem` и `orders`.

**Команды**:

```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
PARTITION BY(l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, SUM(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
l_shipdate,
o_orderdate,
l_partkey,
l_suppkey;
```

**Основные параметры**:

| Параметр | Значение | Описание |
| --- | --- | --- |
| `BUILD IMMEDIATE` | Немедленное построение | Материализация данных сразу после создания |
| `REFRESH COMPLETE ON MANUAL` | Полное обновление вручную | Обновление запускается пользователем |
| `PARTITION BY(l_shipdate)` | Разбиение по ключу партиционирования | Соответствие партициям базовой таблицы для инкрементального обслуживания |
| `DISTRIBUTED BY RANDOM BUCKETS 2` | Случайное распределение по бакетам | Упрощает настройку распределения |

### Шаг 3: выполнение запроса и проверка прозрачного переписывания {#step-3-run-the-query-and-verify-transparent-rewriting}

**Цель**: убедиться, что запрос переписан в план выполнения на основе `mv1`.

**Команды**:

```sql
mysql> explain shape plan SELECT l_shipdate, SUM(o_totalprice) AS total_price
    -> FROM lineitem
    -> LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
    -> WHERE l_partkey = 2 AND l_suppkey = 3
    -> GROUP BY l_shipdate;
+-------------------------------------------------------------------+
| Explain String(Nereids Planner)                                   |
+-------------------------------------------------------------------+
| PhysicalResultSink                                                |
| --PhysicalDistribute[DistributionSpecGather]                      |
| ----PhysicalProject                                               |
| ------hashAgg[GLOBAL]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                  |
| ----------hashAgg[LOCAL]                                          |
| ------------PhysicalProject                                       |
| --------------filter((mv1.l_partkey = 2) and (mv1.l_suppkey = 3)) |
| ----------------PhysicalOlapScan[mv1]                             |
+-------------------------------------------------------------------+
```

**Примечания**: в конце плана выполнения отображается `PhysicalOlapScan[mv1]`. Это означает, что запрос был прозрачно переписан и использует `mv1`.

### Шаг 4: просмотр подробного статуса переписывания {#step-4-inspect-rewriting-status-details}

**Цель**: использовать `explain` для просмотра более подробной информации о статусе переписывания.

**Команды**:

```sql
| ========== MATERIALIZATIONS ==========                                            |
|                                                                                   |
| MaterializedView                                                                  |
| MaterializedViewRewriteSuccessAndChose:                                           |
|   internal.tpch.mv1 chose,                                                        |
|                                                                                   |
| MaterializedViewRewriteSuccessButNotChose:                                        |
|   not chose: none,                                                                |
|                                                                                   |
| MaterializedViewRewriteFail:                                                      |
```

**Основные поля**:

| Поле | Значение |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | Переписывание выполнено успешно, и оптимизатор выбрал полученный план |
| `MaterializedViewRewriteSuccessButNotChose` | Переписывание выполнено успешно, но полученный план не выбран (его стоимость не оптимальна) |
| `MaterializedViewRewriteFail` | Переписывание не удалось |

## Рекомендации по использованию {#usage-recommendations}

<!-- Knowledge type: Best practice -->
<!-- Applicable scenario: Materialized view design and operations -->

:::tip Рекомендации по использованию

- **Предварительно вычисленные результаты**: материализованное представление заранее вычисляет и сохраняет результаты запроса, позволяя избежать повторных вычислений при каждом запросе. Оно хорошо подходит для часто выполняемых сложных запросов.
- **Сокращение операций соединения**: материализованное представление может объединять данные из нескольких таблиц в одном представлении, сокращая количество операций соединения при выполнении запроса и повышая его эффективность.
- **Автоматическое обновление**: при изменении данных базовой таблицы материализованное представление может обновляться автоматически, чтобы результаты запросов отражали актуальное состояние данных.
- **Дополнительные затраты на хранение**: материализованному представлению требуется дополнительное место для хранения. При его создании сопоставляйте выигрыш в производительности запросов с затратами на хранение.
- **Затраты на обслуживание**: обслуживание материализованного представления потребляет системные ресурсы. Если базовая таблица часто обновляется, накладные расходы на обновление представления высоки, поэтому выбирайте подходящую стратегию обновления.
- **Сценарии применения**: материализованные представления подходят для сценариев, в которых данные меняются редко, а запросы выполняются часто. Для часто меняющихся данных более подходящими могут быть вычисления в реальном времени.

:::

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshooting rewriting misses and lower-than-expected performance -->

### Вопрос 1: что делать, если запрос не использует материализованное представление? {#q1-what-should-i-do-if-my-query-does-not-hit-a-materialized-view}

Выполните проверку в следующем порядке:

1. Используйте `explain`, чтобы проверить, содержит ли раздел `MATERIALIZATIONS` информацию `RewriteFail`.
2. Убедитесь, что запрос соответствует шаблону SPJG (SELECT-PROJECT-JOIN-GROUP-BY).
3. Проверьте, покрывают ли поля материализованного представления все столбцы, необходимые запросу.
4. Убедитесь, что материализованное представление доступно для использования (построено и не помечено как недействительное).

### Вопрос 2: почему переписывание выполняется успешно, но полученный план не выбирается? {#q2-why-does-rewriting-succeed-but-does-not-get-chosen}

`MaterializedViewRewriteSuccessButNotChose` означает, что оптимизатор оценивает стоимость переписанного плана выше, чем стоимость исходного. Можно попробовать следующее:

- Изменить стратегию партиционирования и распределения по бакетам для материализованного представления.
- Собрать статистику с помощью `ANALYZE`, чтобы оптимизатор мог точнее оценивать стоимость.

### Вопрос 3: что делать, если материализованное представление обновляется слишком медленно? {#q3-what-should-i-do-if-materialized-view-refresh-is-too-slow}

- Предпочитайте инкрементальное обновление полному.
- Согласуйте ключ партиционирования материализованного представления с ключом базовой таблицы и выполняйте обновление по партициям.
- Оцените частоту записи в базовую таблицу и избегайте запуска обновления в периоды пиковой нагрузки.

### Вопрос 4: как убедиться, что запрос использует материализованное представление после переписывания? {#q4-how-do-i-confirm-whether-a-rewrite-is-hit}

Выполните `EXPLAIN` или `EXPLAIN SHAPE PLAN` и проверьте:

- Присутствует ли `PhysicalOlapScan[mv name]` в плане.
- Содержит ли `RewriteSuccessAndChose` в разделе `MATERIALIZATIONS` целевое материализованное представление.

### Типичные сообщения об ошибках {#common-error-keywords}

- `MaterializedViewRewriteFail`: переписывание не удалось. Обычно это вызвано тем, что SQL не соответствует шаблону SPJG, или отсутствием необходимых полей.
- `not chose`: переписывание выполнено успешно, но полученный план не выбран. Обычно это связано с оценкой стоимости.
- `MV is not in NORMAL state`: материализованное представление находится в нештатном состоянии. Проверьте историю его обновлений.

## Итоги {#summary}

Правильное использование асинхронных материализованных представлений может значительно повысить производительность сложных запросов с соединениями и агрегацией на больших наборах данных. При их применении учитывайте затраты на хранение, накладные расходы на обновление и актуальность данных, чтобы найти баланс между производительностью и стоимостью.
