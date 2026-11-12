---
title: Частые вопросы об асинхронных материализованных представлениях
description: "Краткий справочник по частым вопросам об асинхронных материализованных представлениях: как диагностировать и устранять ошибки создания, сбои обновления, проблемы с прозрачным переписыванием запросов и недоступность представлений."
keywords:
    - Частые вопросы об асинхронных материализованных представлениях
    - сбой обновления материализованного представления
    - материализованное представление не используется при прозрачном переписывании
    - ошибка секционированного материализованного представления
    - Unable to find a suitable base table for partitioning
    - MaterializedViewRewriteFail
    - grace_period
    - excluded_trigger_tables
---

<!-- Knowledge type: Troubleshooting / FAQ -->
<!-- Applicable scenarios: Diagnosing issues during async materialized view build, refresh, and query rewrite -->

В этом документе собраны частые вопросы и способы устранения неполадок, возникающих при использовании асинхронных материализованных представлений. Определение в одном предложении: **асинхронное материализованное представление** представляет собой предварительно вычисленный набор результатов, который обновляется на основе данных базовых таблиц по запросу или по расписанию и может использоваться для прозрачного переписывания запросов с целью их ускорения.

## Быстрая навигация {#quick-navigation}

<!-- Knowledge type: Index -->
<!-- Applicable scenarios: Quickly locating issues and the corresponding sections -->

Вопросы разделены на две категории по этапам работы пользователя; в приложении приведены справочные таблицы причин ошибок:

| Категория сценария | Рассматриваемые вопросы | Ключевые слова |
| --- | --- | --- |
| [Создание и обновление](#build-and-refresh) | Ошибки создания, стратегии обновления, изменение схемы, потребление ресурсов | `BUILD`, `REFRESH`, `workload_group` |
| [Запросы и прозрачное переписывание](#query-and-transparent-rewrite) | Используется ли представление, почему оно не используется, состояния недоступности | `explain`, `MaterializedViewRewrite`, `grace_period` |
| [Приложение](#appendix) | Таблица причин сбоев прозрачного переписывания, таблица причин ошибок создания секционированных представлений | Сводные справочные таблицы |

Быстрый поиск решения распространённых проблем:

- Если создание секционированного материализованного представления завершается ошибкой `Unable to find a suitable base table for partitioning`, перейдите к [Q12](#q12-error-when-building-a-partition-materialized-view) и [Приложению 2](#appendix-2-async-materialized-view-partition-build-failure-causes).
- Если при выполнении оператора создания выводится `Syntax error`, перейдите к [Q13](#q13-syntax-error-when-creating-a-materialized-view).
- Если обновление прошло успешно, но материализованное представление не содержит данных, перейдите к [Q14](#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh).
- Если секционированное материализованное представление каждый раз обновляется полностью, перейдите к [Q15](#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time).
- Если прозрачное переписывание не использует представление, перейдите к [Q1/Q2 раздела «Запросы и прозрачное переписывание»](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view) и [Приложению 1](#appendix-1-transparent-rewrite-failure-summary-information).

## Создание и обновление {#build-and-refresh}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Issues during materialized view creation, refresh, and modification -->

### Q1: Как материализованное представление определяет, какие разделы нужно обновить? {#q1-how-does-the-materialized-view-determine-which-partitions-need-to-be-refreshed}

Doris вычисляет соответствие разделов материализованного представления и базовых таблиц и сохраняет версии разделов базовых таблиц, использованные при последнем успешном обновлении. При следующем обновлении Doris сравнивает их с текущими версиями, чтобы определить, нужно ли обновлять раздел.

**Пример**: материализованное представление `mv1` создано на основе базовых таблиц `t1` и `t2` и секционировано по `t1`. Предположим, разделу `p202003` представления `mv1` соответствуют разделы `p20200301` и `p20200302` таблицы `t1`:

- После обновления `p202003` сохраняются текущие версии `p20200301`, `p20200302` и таблицы `t2`.
- Если при следующем обновлении версия `p20200301`, `p20200302` или `t2` изменилась, раздел `p202003` нужно обновить.

**Исключение по бизнес-логике**: если с точки зрения бизнес-логики изменения в `t2` не должны вызывать обновление `mv1`, это можно настроить с помощью свойства материализованного представления `excluded_trigger_tables`.

### Q2: Что делать, если материализованное представление потребляет слишком много ресурсов и влияет на другие нагрузки? {#q2-what-if-the-materialized-view-consumes-too-many-resources-and-affects-other-workloads}

В свойстве материализованного представления можно указать [workload_group](../../../admin-manual/workload-management/workload-group.md), чтобы управлять потреблением ресурсов задачей обновления материализованного представления.

**Важные замечания**: если лимит памяти слишком мал, а обновление отдельного раздела требует больше памяти, задача обновления завершится с ошибкой. Подбирайте эти настройки с учётом ваших бизнес-потребностей.

### Q3: Можно ли создать новое материализованное представление на основе существующего? {#q3-can-a-new-materialized-view-be-created-based-on-an-existing-materialized-view}

Да, эта возможность поддерживается начиная с Doris 2.1.3.

**Примечание**: логика обновления каждого материализованного представления независима. Например, если `mv2` создано на основе `mv1`, а `mv1` создано на основе `t1`, при обновлении `mv2` не учитывается, синхронизированы ли данные между `mv1` и `t1`.

### Q4: Какие внешние таблицы Doris поддерживает для материализованных представлений? {#q4-which-external-tables-does-doris-support-for-materialized-views}

Для создания материализованных представлений можно использовать любые внешние таблицы, поддерживаемые Doris. Однако сейчас **обновление разделов поддерживается только для Hive**. Поддержка других типов появится в последующих версиях.

### Q5: Материализованное представление кажется согласованным с данными Hive, но на самом деле данные расходятся {#q5-the-materialized-view-appears-consistent-with-hive-data-but-is-actually-inconsistent}

Материализованное представление может гарантировать согласованность своих данных только с результатом запроса через Catalog.

Поскольку Catalog содержит кеши метаданных и данных, для согласованности материализованного представления с данными в Hive необходимо использовать такие средства, как `Refresh Catalog`, чтобы данные в Catalog соответствовали данным в Hive.

### Q6: Поддерживает ли материализованное представление Schema Change? {#q6-does-the-materialized-view-support-schema-change}

Изменение не поддерживается. Атрибуты столбцов материализованного представления выводятся из определяющего его SQL; явное изменение этих атрибутов пользователем сейчас не поддерживается.

### Q7: Разрешён ли Schema Change для базовых таблиц, используемых материализованным представлением? {#q7-are-schema-changes-allowed-on-the-base-tables-used-by-a-materialized-view}

Да, но после изменения происходят следующие переходы состояний:

- Состояние любого материализованного представления, использующего эту базовую таблицу, меняется с `NORMAL` на `SCHEMA_CHANGE`.
- В состоянии `SCHEMA_CHANGE` материализованное представление нельзя использовать для прозрачного переписывания, но к нему по-прежнему можно обращаться напрямую.
- Если следующая задача обновления материализованного представления завершится успешно, его состояние изменится с `SCHEMA_CHANGE` обратно на `NORMAL`.

### Q8: Можно ли использовать таблицу с моделью Unique Key для создания материализованного представления? {#q8-can-a-table-with-the-unique-key-model-be-used-to-create-a-materialized-view}

Да. Материализованное представление не предъявляет требований к модели данных базовой таблицы, но **само материализованное представление может использовать только модель Duplicate Key**.

### Q9: Можно ли создавать индексы на материализованном представлении? {#q9-can-indexes-still-be-created-on-a-materialized-view}

Да.

### Q10: Блокирует ли обновление материализованного представления таблицу? {#q10-does-refreshing-a-materialized-view-lock-the-table}

В процессе обновления таблица блокируется только на очень коротком этапе; блокировка не удерживается постоянно. Длительность блокировки примерно соответствует длительности блокировки при загрузке данных.

### Q11: Подходят ли материализованные представления для обработки данных почти в реальном времени? {#q11-are-materialized-views-suitable-for-near-real-time-scenarios}

Скорее нет. Минимальная единица обновления материализованного представления представляет собой раздел, что при большом объёме данных требует значительных ресурсов и не обеспечивает достаточной свежести данных. Рекомендуется использовать синхронные материализованные представления или другие подходы.

### Q12: Ошибка при создании секционированного материализованного представления {#q12-error-when-building-a-partition-materialized-view}

**Сообщение об ошибке**:

```text
Unable to find a suitable base table for partitioning
```

**Анализ причины**:

Обычно причина заключается в том, что определяющий материализованное представление SQL и выбранный столбец секционирования не позволяют выполнять инкрементальное обновление разделов. Это приводит к ошибке при создании секционированного материализованного представления:

- Для инкрементального обновления разделов материализованного представления должны выполняться соответствующие требования. Подробнее см. [Режимы обновления материализованных представлений](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW.md#optional-parameters).
- Последняя версия может сообщать конкретную причину ошибки создания разделов. Сводку причин и пояснения см. в [Приложении 2](#appendix-2-async-materialized-view-partition-build-failure-causes).

**Пример**:

Ниже приведены две базовые таблицы: `orders` (секционированная) и `lineitem` (несекционированная):

```sql
CREATE TABLE IF NOT EXISTS orders (
  o_orderkey INTEGER NOT NULL, 
  o_custkey INTEGER NOT NULL, 
  o_orderstatus CHAR(1) NOT NULL, 
  o_totalprice DECIMALV3(15, 2) NOT NULL, 
  o_orderdate DATE NOT NULL, 
  o_orderpriority CHAR(15) NOT NULL, 
  o_clerk CHAR(15) NOT NULL, 
  o_shippriority INTEGER NOT NULL, 
  O_COMMENT VARCHAR(79) NOT NULL
) DUPLICATE KEY(o_orderkey, o_custkey) PARTITION BY RANGE(o_orderdate) (
  FROM 
    ('2024-05-01') TO ('2024-06-30') INTERVAL 1 DAY
) DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;


CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey INTEGER NOT NULL, 
  l_partkey INTEGER NOT NULL, 
  l_suppkey INTEGER NOT NULL, 
  l_linenumber INTEGER NOT NULL, 
  l_quantity DECIMALV3(15, 2) NOT NULL, 
  l_extendedprice DECIMALV3(15, 2) NOT NULL, 
  l_discount DECIMALV3(15, 2) NOT NULL, 
  l_tax DECIMALV3(15, 2) NOT NULL, 
  l_returnflag CHAR(1) NOT NULL, 
  l_linestatus CHAR(1) NOT NULL, 
  l_shipdate DATE NOT NULL, 
  l_commitdate DATE NOT NULL, 
  l_receiptdate DATE NOT NULL, 
  l_shipinstruct CHAR(25) NOT NULL, 
  l_shipmode CHAR(10) NOT NULL, 
  l_comment VARCHAR(44) NOT NULL
) DUPLICATE KEY(
  l_orderkey, l_partkey, l_suppkey, 
  l_linenumber
) DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;
```

Материализованное представление определяется следующим образом. Если выбрать `orders.o_orderdate` в качестве столбца секционирования, инкрементальное обновление разделов будет поддерживаться; при использовании `lineitem.l_shipdate` инкрементальное обновление невозможно.

```sql
CREATE MATERIALIZED VIEW mv_1 
       BUILD IMMEDIATE 
       REFRESH AUTO ON MANUAL 
       partition by(o_orderdate) 
       DISTRIBUTED BY RANDOM BUCKETS 2
       AS 
SELECT 
  l_linestatus, 
  sum(
    l_extendedprice * (1 - l_discount)
  ) AS revenue, 
  o_orderdate, 
  o_shippriority 
FROM 
  orders 
  LEFT JOIN lineitem ON l_orderkey = o_orderkey 
WHERE 
  o_orderdate <= DATE '2024-06-30' 
  AND o_orderdate >= DATE '2024-05-01' 
GROUP BY 
  l_linestatus, 
  o_orderdate, 
  o_shippriority;
```

**Почему нельзя выбрать `lineitem.l_shipdate` в качестве столбца секционирования**:

1. `lineitem.l_shipdate` не является столбцом секционирования базовой таблицы; более того, у таблицы `lineitem` вообще не настроен столбец секционирования.
2. `lineitem.l_shipdate` находится на стороне, где образуются значения `null` при операции `outer join`.

### Q13: Синтаксическая ошибка при создании материализованного представления {#q13-syntax-error-when-creating-a-materialized-view}

**Сообщение об ошибке**:

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Syntax error in line 1:
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
```

**Возможные причины**:

1. Операторы асинхронных материализованных представлений поддерживаются только новым оптимизатором. Убедитесь, что используется новый оптимизатор:

    ```sql
    SET enable_nereids_planner = true;
    ```

2. Оператор создания материализованного представления содержит **опечатки в ключевых словах** или **синтаксические ошибки в определяющем SQL**. Проверьте правильность SQL, определяющего материализованное представление, и оператора создания.

### Q14: После успешного обновления материализованное представление по-прежнему не содержит данных {#q14-the-materialized-view-still-has-no-data-after-a-successful-refresh}

Чтобы определить необходимость обновления данных, материализованному представлению нужно получить информацию о версиях базовой таблицы или её разделов.

Для озёр данных, которые сейчас не поддерживают получение информации о версиях (например, JDBC Catalog), при обновлении считается, что материализованное представление обновлять не нужно. **Поэтому при создании или обновлении таких материализованных представлений указывайте `complete` вместо `auto`**.

Информацию о развитии поддержки озёр данных в материализованных представлениях см. в разделе [Поддержка озёр данных](./overview.md).

### Q15: Почему секционированное материализованное представление каждый раз обновляется полностью? {#q15-why-does-a-partition-materialized-view-do-a-full-refresh-every-time}

Инкрементальное обновление разделов материализованного представления зависит от информации о версиях разделов базовой таблицы. Если данные раздела базовой таблицы, соответствующего разделу материализованного представления, изменились с момента последнего обновления, обновляется только этот раздел.

**Возможная причина**:

Изменились данные **таблицы, разделы которой не отслеживаются**, используемой в определяющем материализованное представление SQL. Из-за этого при обновлении невозможно определить, какие разделы нужно обновить, и доступно только полное обновление.

**Пример**:

Это материализованное представление отслеживает раздел `o_orderdate` таблицы `orders`. Однако при изменении данных `lineitem` или `partsupp` материализованное представление не может определить, какие разделы нужно обновить, и вынуждено выполнять полное обновление.

```sql
CREATE MATERIALIZED VIEW partition_mv
BUILD IMMEDIATE 
REFRESH AUTO 
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00' 
PARTITION BY (DATE_TRUNC(o_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2 
PROPERTIES 
("replication_num" = "3") 
AS 
SELECT 
o_orderdate, 
l_orderkey, 
l_partkey 
FROM 
orders 
LEFT JOIN lineitem ON l_orderkey = o_orderkey 
LEFT JOIN partsupp ON ps_partkey = l_partkey 
and l_suppkey = ps_suppkey;
```

**Порядок диагностики**:

- **Цель**: просмотреть базовые таблицы и столбцы секционирования, отслеживаемые материализованным представлением.
- **Команда**:

    ```sql
    SELECT * 
    FROM mv_infos('database'='db_name')
    WHERE Name = 'partition_mv' \G 
    ```

- **Пояснение**: в результате значение `MvPartitionInfo.partitionType`, равное `FOLLOW_BASE_TABLE`, означает, что раздел материализованного представления следует за разделом базовой таблицы; значение `relatedCol`, равное `o_orderdate`, указывает на секционирование по этому столбцу.

    ```text
                    Id: 1752809156450
                  Name: partition_mv
               JobName: inner_mtmv_1752809156450
                 State: NORMAL
    SchemaChangeDetail: 
          RefreshState: SUCCESS
           RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 DAY STARTS "2024-12-01 20:30:00"
              QuerySql: SELECT
                        `internal`.`doc_db`.`orders`.`o_orderdate`,
                        `internal`.`doc_db`.`lineitem`.`l_orderkey`,
                        `internal`.`doc_db`.`lineitem`.`l_partkey`
                        FROM
                        `internal`.`doc_db`.`orders`
                        LEFT JOIN `internal`.`doc_db`.`lineitem` ON `internal`.`doc_db`.`lineitem`.`l_orderkey` = `internal`.`doc_db`.`orders`.`o_orderkey`
                        LEFT JOIN `internal`.`doc_db`.`partsupp` ON `internal`.`doc_db`.`partsupp`.`ps_partkey` = `internal`.`doc_db`.`lineitem`.`l_partkey`
                        and `internal`.`doc_db`.`lineitem`.`l_suppkey` = `internal`.`doc_db`.`partsupp`.`ps_suppkey`
       MvPartitionInfo: MTMVPartitionInfo{partitionType=EXPR, relatedTable=orders, relatedCol='o_orderdate', partitionCol='o_orderdate'}
    SyncWithBaseTables: 1
    ```

**Решение**:

Если изменения данных таблиц `lineitem` или `partsupp` не влияют на материализованное представление, можно задать свойство `excluded_trigger_tables`, чтобы исключить полные обновления, вызываемые изменениями этих таблиц:

```sql
ALTER MATERIALIZED VIEW partition_mv set("excluded_trigger_tables"="lineitem,partsupp");
```

## Запросы и прозрачное переписывание {#query-and-transparent-rewrite}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Diagnosing materialized view hit rate and transparent rewrite failures -->

### Q1: Как проверить, использует ли запрос материализованное представление {#q1-how-to-confirm-whether-a-query-hits-the-materialized-view}

С помощью `explain query_sql` можно просмотреть сводную информацию об использовании материализованного представления.

**Пример материализованного представления**:

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**Выполните explain**:

```sql
explain
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**Интерпретация результата**:

Информация об использовании материализованных представлений находится в последней части плана. Основные поля имеют следующие значения:

| Поле | Значение |
| --- | --- |
| `MaterializedViewRewriteSuccessAndChose` | Список имён материализованных представлений, для которых прозрачное переписывание прошло успешно и которые CBO в итоге выбрал для использования |
| `MaterializedViewRewriteSuccessButNotChose` | Список имён материализованных представлений, для которых прозрачное переписывание прошло успешно, но которые CBO не выбрал (план выполнения их не использует) |
| `MaterializedViewRewriteFail` | Список материализованных представлений, для которых прозрачное переписывание завершилось неудачей, с кратким описанием причин |

Если информация, связанная с `MaterializedView`, отсутствует в конце вывода `explain`, материализованное представление находится в недоступном состоянии и поэтому не может участвовать в прозрачном переписывании. Ситуации, приводящие к недоступности материализованного представления, описаны в разделе «Использование и практика: просмотр состояния материализованного представления».

**Пример вывода**:

```text
| MaterializedView                                                                   |
| MaterializedViewRewriteSuccessAndChose:                                            |
| internal#regression_test_nereids_rules_p0_mv#mv11,                                 |
|                                                                                    |
| MaterializedViewRewriteSuccessButNotChose:                                         |
|                                                                                    |
| MaterializedViewRewriteFail:                                                       |
+------------------------------------------------------------------------------------+
```

### Q2: Почему материализованное представление не используется? {#q2-what-are-the-reasons-for-a-materialized-view-not-being-hit}

Сначала проверьте, используется ли представление, следуя [Q1](#q1-how-to-confirm-whether-a-query-hits-the-materialized-view):

```sql
explain
your_query_sql;
```

**Возможные причины, по которым представление не используется**:

1. В версиях до Doris 2.1.3 функция прозрачного переписывания для материализованных представлений по умолчанию отключена. Чтобы прозрачное переписывание работало, необходимо включить соответствующий переключатель. Конкретные переключатели описаны в разделе о переключателях асинхронных материализованных представлений.
2. Материализованное представление может находиться в недоступном состоянии. Инструкции по просмотру состояния создания материализованного представления см. в разделе «Просмотр состояния материализованного представления».
3. Если после двух предыдущих проверок представление по-прежнему не используется, определяющий его SQL и SQL запроса могут выходить за рамки текущих возможностей прозрачного переписывания. Подробнее см. [Возможности прозрачного переписывания с использованием материализованных представлений](../../../query-acceleration/materialized-view/async-materialized-view/functions-and-demands.md#22-transparent-query-rewrite).
4. Подробную сводную информацию о причинах, по которым представление не используется, и пояснения см. в [Приложении 1](#appendix-1-transparent-rewrite-failure-summary-information).

Следующие два примера иллюстрируют распространённые сценарии сбоев прозрачного переписывания.

#### Случай 1: Разный порядок соединения приводит к сбою переписывания {#case-1-inconsistent-join-order-causes-rewrite-failure}

**Создайте материализованное представление**:

```sql
CREATE MATERIALIZED VIEW mv11
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 10
PROPERTIES ('replication_num' = '1') 
AS
SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem  
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE;
```

**Выполните запрос**:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM orders 
LEFT OUTER JOIN lineitem on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Вывод explain**:

```text
| MaterializedView                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                   |
|                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                |
|                                                                                                           |
| MaterializedViewRewriteFail:                                                                              |
|   Name: internal#doc_test#mv11                                                                            |
|   FailSummary: View struct info is invalid, The graph logic between query and view is not consistent      |
```

`MaterializedViewRewriteFail` содержит описание причины сбоя `The graph logic between query and view is not consistent`. Оно указывает, что логика соединения в запросе и материализованном представлении не совпадает: различаются типы соединений или соединяемые таблицы. В этом примере порядок соединения таблиц в запросе отличается от порядка в материализованном представлении, поэтому выводится эта ошибка. Полные пояснения к описаниям причин см. в [Приложении 1](#appendix-1-transparent-rewrite-failure-summary-information).

#### Случай 2: Материализованное представление не покрывает измерения запроса {#case-2-dimensions-not-covered-by-the-materialized-view}

**Выполните запрос**:

```sql
explain
SELECT l_shipdate, l_linestatus, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_linestatus, O_ORDERDATE;
```

**Вывод explain**:

```text
| MaterializedView                                                                                                          |
| MaterializedViewRewriteSuccessAndChose:                                                                                   |
|                                                                                                                           |
| MaterializedViewRewriteSuccessButNotChose:                                                                                |
|                                                                                                                           |
| MaterializedViewRewriteFail:                                                                                              |
|   Name: internal#doc_test#mv11                                                                                            |
|   FailSummary: View struct info is invalid, View dimensions doesn't not cover the query dimensions                        |
```

Описание причины сбоя `View dimensions doesn't not cover the query dimensions` означает, что столбцы `group by` запроса нельзя получить из столбцов `group by` материализованного представления, поэтому выводится эта ошибка.

### Q3: В каких ситуациях состояние материализованного представления меняется и оно становится недоступным? {#q3-what-situations-cause-a-materialized-views-state-to-change-and-become-unavailable}

«Недоступно» означает, что **материализованное представление нельзя использовать для прозрачного переписывания**, но к самому представлению по-прежнему можно обращаться напрямую.

| Тип материализованного представления | Событие, вызывающее недоступность | Область воздействия |
| --- | --- | --- |
| Материализованное представление с полным обновлением | Изменение данных базовой таблицы / изменение схемы базовой таблицы | Недоступно всё материализованное представление |
| Секционированное материализованное представление | Изменение данных базовой таблицы | Недоступен соответствующий раздел |
| Секционированное материализованное представление | Изменение схемы базовой таблицы | Недоступно всё материализованное представление |

Сейчас сбой обновления также делает материализованное представление недоступным. В будущем это поведение будет улучшено: даже при сбое обновления существующее материализованное представление останется доступным для прозрачного переписывания.

### Q4: Прямой запрос к материализованному представлению не возвращает данных {#q4-direct-query-on-the-materialized-view-returns-no-data}

Возможные причины:

- Материализованное представление ещё создаётся.
- Создание материализованного представления завершилось с ошибкой.

Проверить это можно, запросив состояние материализованного представления. Подробнее см. в разделе «Просмотр состояния материализованного представления».

### Q5: Как работает прозрачное переписывание, если данные базовой таблицы изменились, а материализованное представление ещё не обновлено? {#q5-when-base-table-data-changes-but-the-materialized-view-has-not-been-refreshed-what-is-the-transparent-rewrite-behavior}

Данные асинхронного материализованного представления обновляются с некоторой задержкой относительно базовых таблиц. Поведение прозрачного переписывания зависит от типа базовой таблицы и порога `grace_period`.

**1. Внутренние таблицы и внешние таблицы, способные обнаруживать изменения данных (например, Hive)**:

`grace_period` задаёт максимальный период времени, в течение которого допускается несогласованность данных материализованного представления и базовых таблиц:

| Значение `grace_period` | Поведение переписывания |
| --- | --- |
| `0` | Для использования при прозрачном переписывании требуется полная согласованность данных материализованного представления и базовой таблицы; для внешних таблиц, которые не могут обнаруживать изменения данных (кроме Hive), материализованное представление можно использовать для прозрачного переписывания независимо от актуальности данных (данные могут быть несогласованными) |
| `10` (секунд) | Допускается отставание данных материализованного представления от данных базовой таблицы не более чем на 10 секунд. Пока отставание не превышает 10 секунд, материализованное представление по-прежнему можно использовать для прозрачного переписывания |

**2. Секционированное материализованное представление, в котором некоторые разделы неактуальны**:

- Если запрос не использует данные неактуальных разделов, материализованное представление остаётся доступным.
- Если запрос использует данные неактуальных разделов, а давность данных не превышает `grace_period`, материализованное представление остаётся доступным.
- Если давность данных превышает `grace_period`, запрос можно выполнить, объединив исходные таблицы с материализованным представлением. Для этого необходимо включить переключатель переписывания с объединением `enable_materialized_view_union_rewrite` (начиная с версии 2.1.5 он включён по умолчанию).

## Приложение {#appendix}

### Приложение 1: Сводная информация о причинах сбоев прозрачного переписывания {#appendix-1-transparent-rewrite-failure-summary-information}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating the cause of transparent rewrite failure based on the FailSummary in explain output -->

| Описание причины | Пояснение |
| --- | --- |
| View struct info is invalid | Структурная информация материализованного представления недопустима. Сейчас поддерживаются следующие шаблоны SQL для переписывания: запрос представляет собой join и материализованное представление также представляет собой join; запрос представляет собой agg, при этом материализованное представление не обязано содержать join. При прозрачном переписывании эта проблема отображается в большинстве случаев, поскольку каждое правило прозрачного переписывания обрабатывает определённый шаблон SQL, а правило, не соответствующее требованиям, при срабатывании сообщает об этой ошибке. Как правило, она не является основной причиной сбоя прозрачного переписывания |
| Materialized view rule exec fail | При выполнении правила прозрачного переписывания возникло исключение. Используйте `Explain memo plan query_sql`, чтобы просмотреть стек конкретного исключения |
| Match mode is invalid | Количество таблиц в запросе и материализованном представлении различается; переписывание пока не поддерживается |
| Query to view table mapping is null | Не удалось построить соответствие таблиц запроса и материализованного представления |
| queryToViewTableMappings are over the limit and be intercepted | В запросе слишком много таблиц, участвующих в самосоединениях, из-за чего пространство поиска при прозрачном переписывании становится слишком большим, поэтому переписывание прекращается |
| Query to view slot mapping is null | Не удалось построить соответствие слотов между таблицами запроса и таблицами материализованного представления |
| The graph logic between query and view is not consistent | Типы соединений в запросе и материализованном представлении различаются либо различаются соединяемые таблицы |
| Predicate compensate fail | Обычно диапазон условий запроса выходит за пределы диапазона материализованного представления. Например, в запросе используется `a > 10`, а в материализованном представлении используется `a > 15` |
| Rewrite compensate predicate by view fail | Не удалось компенсировать предикат. Обычно запрос содержит дополнительные по сравнению с материализованным представлением условия, которые нужно компенсировать, но используемые в них столбцы отсутствуют в предложении select материализованного представления |
| Calc invalid partitions fail | В секционированном материализованном представлении произошёл сбой при определении актуальности разделов, используемых запросом |
| mv can not offer any partition for query | Запрос использует только неактуальные разделы материализованного представления. С помощью `show partitions from mv_name` проверьте, равно ли поле `SyncWithBaseTables` разделов значению true. Если оно равно false, обновите соответствующий раздел вручную; если допустима некоторая задержка между данными материализованного представления и данными запроса, задайте свойство материализованного представления `grace_period` (в секундах) |
| Add filter to base table fail when union rewrite | Запрос использовал неактуальные разделы материализованного представления, и попытка объединить материализованное представление с исходной таблицей с помощью union all завершилась неудачей |
| RewrittenPlan output logical properties is different with target group | Переписывание завершено, но выходные данные материализованного представления не соответствуют исходному запросу |
| Rewrite expressions by view in join fail | При переписывании соединения поля или выражения, используемые в запросе, отсутствуют в материализованном представлении |
| Rewrite expressions by view in scan fail | При переписывании запроса к одной таблице поля или выражения, используемые в запросе, отсутствуют в материализованном представлении |
| Split view to top plan and agg fail, view doesn't not contain aggregate | При переписывании агрегации материализованное представление не содержит агрегации |
| Split query to top plan and agg fail | При переписывании агрегации запрос не содержит агрегации |
| rewritten expression contains aggregate functions when group equals aggregate rewrite | При совпадении предложений `group by` запроса и материализованного представления переписанное выражение содержит агрегатные функции |
| Can not rewrite expression when no roll up | При совпадении предложений `group by` запроса и материализованного представления не удалось переписать выражение |
| Query function roll up fail | При переписывании агрегации не удалось выполнить rollup агрегатной функции |
| View dimensions do not cover the query dimensions | Предложение `group by` запроса использует измерения, отсутствующие в предложении `group by` материализованного представления |
| View dimensions don't not cover the query dimensions in bottom agg | Предложение `group by` запроса использует измерения, отсутствующие в предложении `group by` материализованного представления |
| View dimensions do not cover the query group set dimensions | Предложение `group sets` запроса использует измерения, отсутствующие в предложении `group by` материализованного представления |
| The only one of query or view is scalar aggregate and can not rewrite expression meanwhile | Запрос содержит `group by`, а материализованное представление не содержит |
| Both query and view have group sets, or query doesn't have but view has, not supported | И запрос, и материализованное представление содержат `group sets`, либо запрос не содержит `group sets`, а материализованное представление содержит. В этом случае прозрачное переписывание не поддерживается |

### Приложение 2: Причины ошибок создания разделов асинхронного материализованного представления {#appendix-2-async-materialized-view-partition-build-failure-causes}

<!-- Knowledge type: Reference table -->
<!-- Applicable scenarios: Locating causes when an error is reported while creating a partition materialized view -->

Обновление секционированного материализованного представления основано на инкрементальном обновлении разделов:

1. **Шаг 1**: определить, можно ли сопоставить столбец секционирования материализованного представления с разделами базовой таблицы.
2. **Шаг 2**: вычислить конкретное соответствие, то есть определить, соотносятся ли разделы как 1:1 или 1:n.

| Описание причины | Пояснение |
| --- | --- |
| partition column can not be found in the SQL select column | Столбец, указанный после `partition by` в определении материализованного представления, должен присутствовать в предложении select определяющего его SQL |
| can't not find valid partition track column, because %s | Подходящий столбец секционирования не найден. Конкретная причина указана после `because` |
| partition track doesn't support mark join | Столбец, на который ссылается столбец секционирования материализованного представления, является столбцом секционирования входной таблицы mark join, что не поддерживается |
| partition column is in un supported join null generate side | Столбец, на который ссылается столбец секционирования материализованного представления, находится на стороне соединения, где образуются значения null, например на правой стороне left join |
| relation should be LogicalCatalogRelation | Тип сканирования базовой таблицы секционирования, на которую ссылается материализованное представление, должен быть `LogicalCatalogRelation`; другие типы не поддерживаются |
| self join doesn't support partition update | Создание материализованных представлений на основе SQL с самосоединением пока не поддерживается |
| partition track already has a related base table column | Сейчас столбец секционирования материализованного представления может ссылаться только на столбец секционирования одной базовой таблицы |
| relation base table is not MTMVRelatedTableIf | Базовая таблица секционирования, на которую ссылается материализованное представление, не наследует `MTMVRelatedTableIf`, интерфейс, указывающий, поддерживает ли таблица секционирование |
| The related base table is not partition table | Базовая таблица, используемая материализованным представлением, не является секционированной |
| The related base table partition column doesn't contain the mv partition | Столбец, указанный после `partition by` в материализованном представлении, отсутствует в базовой таблице секционирования |
| group by sets is empty, doesn't contain the target partition | Определяющий материализованное представление SQL использует агрегацию, но `group by` пуст |
| window partition sets don't contain the target partition | Используется оконная функция, но столбец секционирования, на который ссылается материализованное представление, отсутствует в предложении `partition by` |
| Unsupported plan operate in track partition | Определяющий материализованное представление SQL использует неподдерживаемые операции, например `order by` |
| context partition column should be slot from column | Используется оконная функция, и столбец секционирования, на который ссылается материализованное представление в предложении `partition by`, является выражением, а не простым столбцом |
| partition expressions use more than one slot reference | Столбец секционирования после `group by` или `partition by` представляет собой выражение, содержащее несколько столбцов, а не простой столбец. Например, `group by partition_col + other_col` |
| column to check using invalid implicit expression | Столбец секционирования материализованного представления может использовать только `date_trunc`. Выражения для столбца секционирования ограничены `date_trunc` и аналогичными выражениями |
| partition column time unit level should be greater than SQL select column | Временной шаг `date_trunc` после `partition by` в материализованном представлении меньше временного шага, указанного после select в определяющем материализованное представление SQL. Например, в материализованном представлении используется `partition by(date_trunc(col, 'day'))`, а определяющий его SQL содержит `date_trunc(col, 'month')` после select |
