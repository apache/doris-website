---
{
    "title": "Синхронное материализованное представление",
    "language": "ru",
    "description": "Как использовать синхронные материализованные представления Doris для ускорения агрегации, сопоставления префиксных индексов и вычисления выражений? В статье рассматриваются сценарии использования, синтаксис, проверка использования представлений и часто задаваемые вопросы.",
    "keywords": ["синхронное материализованное представление Doris", "материализованное представление", "ускорение запросов", "bitmap_union", "префиксный индекс", "предварительное вычисление агрегатов"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenarios: aggregation precomputation, prefix index matching, prefiltering, expression precomputation -->

Синхронное материализованное представление (Sync Materialized View) — это специальная таблица в Doris, которая заранее вычисляет и сохраняет результат оператора SELECT, выполняемого над базовой таблицей. Doris автоматически поддерживает представление, обеспечивает его строгую согласованность с базовой таблицей при записи и во время выполнения запроса автоматически выбирает оптимальное представление для ускорения чтения.

## Примечания по использованию {#usage-notes}

Перед использованием синхронного материализованного представления проверьте следующее:

- Поддерживаются только операторы SELECT к **одной таблице**, без JOIN, HAVING, LIMIT и LATERAL VIEW
- Список SELECT не должен содержать автоинкрементные столбцы, константы, повторяющиеся выражения, оконные функции или столбцы типа VARBINARY
- Агрегатные функции в списке SELECT должны быть корневыми выражениями (`sum(a + 1)` поддерживается, `sum(a) + 1` не поддерживается)
- Имена столбцов материализованного представления не должны конфликтовать с именами столбцов базовой таблицы или других представлений (во избежание конфликтов можно использовать псевдоним `col as xxx`)
- Оценено влияние количества представлений одной таблицы на производительность загрузки данных
- В модели Unique Key представление может только изменять порядок столбцов; агрегация не поддерживается

## Что такое синхронное материализованное представление {#what-is-a-sync-materialized-view}

<!-- Knowledge type: concept -->

Синхронное материализованное представление — это специальная таблица в Doris, которая хранит заранее вычисленный набор данных на основе заданного оператора SELECT. Doris автоматически поддерживает данные синхронного материализованного представления. При добавлении или удалении данных Doris обеспечивает синхронное обновление базовой таблицы и таблицы материализованного представления, сохраняя их согласованность. Соответствующая команда завершается только после окончания синхронизации; дополнительное ручное обслуживание не требуется. Во время выполнения запроса Doris автоматически выбирает оптимальное материализованное представление и читает данные непосредственно из него.

## Сценарии использования {#applicable-scenarios}

<!-- Applicable scenarios: when to choose a sync materialized view -->

| Сценарий | Описание |
| --- | --- |
| Ускорение агрегации | Предварительное вычисление ресурсоёмких агрегатов, таких как SUM/COUNT/BITMAP_UNION |
| Использование других префиксных индексов | Если столбцы фильтрации запроса не соответствуют префиксному индексу базовой таблицы, создайте представление, начинающееся со столбцов фильтрации |
| Предварительная фильтрация для сокращения сканирования | Используйте условие WHERE для ранней фильтрации и уменьшения объёма данных |
| Предварительное вычисление сложных выражений | Заранее вычисляйте сложные выражения, такие как `abs(k1)+k2+1`, и используйте готовые результаты при выполнении запросов |

## Ограничения {#limitations}

<!-- Knowledge type: constraints -->

| Категория | Ограничение |
| --- | --- |
| Поддерживаемый синтаксис | Поддерживается только SELECT к одной таблице с WHERE/GROUP BY/ORDER BY; JOIN, HAVING, LIMIT и LATERAL VIEW не поддерживаются |
| Способ выполнения запросов | Нельзя напрямую выполнять запросы к синхронному материализованному представлению (в отличие от асинхронных материализованных представлений) |
| Список SELECT | Не может содержать автоинкрементные столбцы, константы, повторяющиеся выражения или оконные функции; не может содержать столбцы типа VARBINARY |
| Требования к именам столбцов | Имена не должны совпадать с именами столбцов базовой таблицы или других материализованных представлений этой таблицы; во избежание конфликтов используйте псевдоним (`col as xxx`) |
| Агрегатные функции | Должны быть корневыми выражениями (`sum(a) + 1` не поддерживается, `sum(a + 1)` поддерживается); после агрегатной функции не допускаются другие неагрегатные выражения (`SELECT x, sum(a)` допускается, `SELECT sum(a), x` не допускается) |
| Ограничение на удаление | Если столбец, указанный в условии DELETE, присутствует в материализованном представлении, перед удалением данных сначала удалите представление |
| Производительность загрузки данных | Слишком большое количество материализованных представлений одной таблицы замедляет загрузку данных, поскольку представления обновляются вместе с базовой таблицей |
| Модель данных | Материализованное представление в модели Unique Key может только изменять порядок столбцов; агрегация не поддерживается |

## Использование синхронного материализованного представления {#using-a-sync-materialized-view}

Doris предоставляет полный набор операторов DDL для создания, просмотра и удаления материализованных представлений. В следующем примере показано, как использовать материализованное представление для ускорения агрегации.

### Подготовка данных базовой таблицы {#prepare-base-table-data}

Предположим, у пользователя есть таблица с подробными данными о продажах, в которой для каждой транзакции записаны её идентификатор, продавец, магазин, время продажи и сумма.

```sql
-- Create a test_db
create database test_db;
use test_db;

-- Create the table
create table sales_records
(
    record_id int, 
    seller_id int, 
    store_id int, 
    sale_date date, 
    sale_amt bigint
) 
distributed by hash(record_id) 
properties("replication_num" = "1");

-- Insert data
insert into sales_records values(1,1,1,"2020-02-02",1), (1,1,1,"2020-02-02",2);
```

### Создание материализованного представления {#create-a-materialized-view}

**Цель**: Создать представление с предварительной агрегацией для запросов, которые часто анализируют продажи по магазинам.

**Команда**:

```sql
create materialized view store_amt as 
select store_id as store_id_, sum(sale_amt) from sales_records group by store_id;
```

**Описание**: Это представление группирует данные по `store_id` и суммирует `sale_amt` для каждого магазина, ускоряя запросы с агрегацией по магазинам.

### Проверка создания материализованного представления {#check-whether-the-materialized-view-is-created}

**Цель**: Проверить состояние задачи, поскольку создание материализованного представления выполняется асинхронно.

**Команда**:

```sql
show alter table materialized view from test_db;
```

**Описание**: В результате отображаются все задачи создания материализованных представлений для этой базы данных. Пример вывода:

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```

Описание основных полей:

| Поле | Значение |
| --- | --- |
| TableName | Исходная таблица материализованного представления |
| RollupIndexName | Имя материализованного представления |
| State | Состояние задачи. `FINISHED` означает, что представление успешно создано и может автоматически выбираться для запросов |

### Отмена создания материализованного представления {#cancel-creation-of-a-materialized-view}

**Цель**: Отменить задачу создания, пока фоновая асинхронная задача ещё выполняется.

**Команда**:

```sql
cancel alter table materialized view from test_db.sales_records;
```

**Описание**: Если материализованное представление уже создано, эта команда не может отменить его создание, но вы можете удалить представление командой drop.

### Просмотр схемы материализованного представления {#view-the-schema-of-a-materialized-view}

**Цель**: Просмотреть все материализованные представления целевой таблицы и их схемы.

**Команда**:

```sql
desc sales_records all;
```

**Описание**: Вывод выглядит следующим образом:

```sql
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName     | IndexKeysType | Field               | Type   | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
| sales_records | DUP_KEYS      | record_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | seller_id           | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | store_id            | INT    | INT          | Yes  | true  | NULL    |       | true    |            |             |
|               |               | sale_date           | DATE   | DATEV2       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               | sale_amt            | BIGINT | BIGINT       | Yes  | false | NULL    | NONE  | true    |            |             |
|               |               |                     |        |              |      |       |         |       |         |            |             |
| store_amt     | AGG_KEYS      | mv_store_id         | INT    | INT          | Yes  | true  | NULL    |       | true    | `store_id` |             |
|               |               | mva_SUM__`sale_amt` | BIGINT | BIGINT       | Yes  | false | NULL    | SUM   | true    | `sale_amt` |             |
+---------------+---------------+---------------------+--------+--------------+------+-------+---------+-------+---------+------------+-------------+
```

Как видно, у таблицы `sales_records` есть материализованное представление с именем `store_amt`, созданное на предыдущем шаге.

### Просмотр оператора CREATE материализованного представления {#view-the-create-statement-of-a-materialized-view}

**Цель**: Получить исходный DDL материализованного представления.

**Команда**:

```sql
show create materialized view store_amt on sales_records;
```

**Описание**: Вывод выглядит следующим образом:

```sql
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| TableName     | ViewName  | CreateStmt                                                                                                 |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
| sales_records | store_amt | create materialized view store_amt as select store_id, sum(sale_amt) from sales_records group by store_id |
+---------------+-----------+------------------------------------------------------------------------------------------------------------+
```

### Выполнение запроса с использованием материализованного представления {#query-the-materialized-view}

**Цель**: Запросы по-прежнему обращаются к базовой таблице, а Doris автоматически переписывает их для использования материализованного представления.

**Команда**:

```sql
select store_id, sum(sale_amt) from sales_records group by store_id;
```

Для приведённого выше запроса автоматически выбирается `store_amt`. С помощью команды `EXPLAIN` можно проверить, используется ли материализованное представление в текущем запросе:

```sql
explain select store_id, sum(sale_amt) from sales_records group by store_id;
```

**Описание**: Результат выглядит следующим образом:

```sql
+------------------------------------------------------------------------+
| Explain String (Nereids Planner)                                       |
+------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                        |
|   OUTPUT EXPRS:                                                        |
|     store_id[#11]                                                      |
|     sum(sale_amt)[#12]                                                 |
|   PARTITION: HASH_PARTITIONED: store_id_[#7]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: true                                             |
|                                                                        |
|   VRESULT SINK                                                         |
|      MYSQL_PROTOCAL                                                    |
|                                                                        |
|   3:VAGGREGATE (merge finalize)(384)                                   |
|   |  output: sum(partial_sum(__sum_1)[#8])[#10]                        |
|   |  group by: store_id_[#7]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  final projections: store_id_[#9], sum(__sum_1)[#10]               |
|   |  final project output tuple id: 4                                  |
|   |  distribute expr lists: store_id_[#7]                              |
|   |                                                                    |
|   2:VEXCHANGE                                                          |
|      offset: 0                                                         |
|      distribute expr lists:                                            |
|                                                                        |
| PLAN FRAGMENT 1                                                        |
|                                                                        |
|   PARTITION: HASH_PARTITIONED: record_id[#2]                           |
|                                                                        |
|   HAS_COLO_PLAN_NODE: false                                            |
|                                                                        |
|   STREAM DATA SINK                                                     |
|     EXCHANGE ID: 02                                                    |
|     HASH_PARTITIONED: store_id_[#7]                                    |
|                                                                        |
|   1:VAGGREGATE (update serialize)(374)                                 |
|   |  STREAMING                                                         |
|   |  output: partial_sum(__sum_1[#1])[#8]                              |
|   |  group by: store_id_[#0]                                           |
|   |  sortByGroupKey: false                                             |
|   |  cardinality = 1                                                   |
|   |  distribute expr lists:                                            |
|   |                                                                    |
|   0:VOlapScanNode(369)                                                 |
|      TABLE: test_db.sales_records(store_amt), PREAGGREGATION: ON       |
|      partitions = 1/1 (sales_records)                                  |
|      tablets = 10/10, tabletList = 266568, 266570, 266572 ...          |
|      cardinality = 1, avgRowSize = 1805.0, numNodes = 1                |
|      pushAggOp = NONE                                                  |
|                                                                        |
|                                                                        |
| ========== MATERIALIZATIONS ==========                                 |
|                                                                        |
| MaterializedView                                                       |
| MaterializedViewRewriteSuccessAndChose:                                |
|   internal.test_db.sales_records.store_amt chose,                      |
|                                                                        |
| MaterializedViewRewriteSuccessButNotChose:                             |
|   not chose: none,                                                     |
|                                                                        |
| MaterializedViewRewriteFail:                                           |
|                                                                        |
|                                                                        |
| ========== STATISTICS ==========                                       |
| planned with unknown column statistics                                 |
+------------------------------------------------------------------------+
```

В поле `MaterializedViewRewriteSuccessAndChose` отображаются материализованные представления, которые были успешно выбраны для запроса. Пример:

```sql
+------------------------------------------------------------------------+
| MaterializedViewRewriteSuccessAndChose:                                |  
|   internal.test_db.sales_records.store_amt chose,                      |
+------------------------------------------------------------------------+
```

Приведённый выше вывод показывает, что запрос успешно использует материализованное представление с именем `store_amt`. Обратите внимание: если целевая таблица не содержит данных, материализованное представление может не использоваться.

#### Описание полей MATERIALIZATIONS {#materializations-field-descriptions}

| Поле | Значение |
| --- | --- |
| MaterializedViewRewriteSuccessAndChose | Материализованное представление, которое было успешно выбрано и использовано для оптимизации запроса |
| MaterializedViewRewriteSuccessButNotChose | Материализованное представление, которое подошло для запроса, но не было выбрано (не является оптимальным по оценке стоимости) |
| MaterializedViewRewriteFail | Материализованное представление, которое не подошло для запроса. Исходный SQL не удалось сопоставить с существующим представлением |

### Удаление материализованного представления {#drop-a-materialized-view}

**Цель**: Удалить материализованное представление, которое больше не нужно.

**Команда**:

```sql
drop materialized view store_amt on sales_records;
```

## Примеры {#examples}

### Пример 1: Ускорение запросов с агрегацией {#example-1-accelerate-aggregation-queries}

<!-- Applicable scenarios: exact deduplication aggregation such as UV/PV -->

**Бизнес-сценарий**: Вычислить UV (количество уникальных посетителей) и PV (количество просмотров) рекламного объявления.

**Шаги**:

1. Создайте исходную таблицу, в которой хранятся подробные данные о кликах по рекламе:

    ```sql
    create table advertiser_view_record
    (
        click_time datetime, 
        advertiser varchar(10), 
        channel varchar(10), 
        user_id int
    ) distributed by hash(user_id) properties("replication_num" = "1");
    insert into advertiser_view_record values("2020-02-02 02:02:02",'a','a',1), ("2020-02-02 02:02:02",'a','a',2);
    ```

2. Пользователь хочет получить UV рекламного объявления (точное количество уникальных пользователей для одного и того же объявления). Типичный запрос выглядит так:

    ```sql
    select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

3. Для вычисления UV создайте материализованное представление с `bitmap_union`, чтобы заранее выполнить точную дедупликацию. В Doris результат `count(distinct)` совпадает с результатом `bitmap_union_count`, поэтому материализованное представление с агрегацией через `bitmap_union` может ускорить запрос:

    ```sql
    create materialized view advertiser_uv as 
    select 
        advertiser as advertiser_, 
        channel as channel_, 
        bitmap_union(to_bitmap(user_id)) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

4. После создания материализованного представления выполните исходный запрос UV ещё раз. Doris автоматически прочитает данные из `advertiser_uv`:

    ```sql
    select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

5. После выбора материализованного представления фактически выполняемый запрос переписывается следующим образом:

    ```sql
    select 
        advertiser, 
        channel, 
        bitmap_union_count(to_bitmap(user_id)) 
    from 
        advertiser_uv 
    group by 
        advertiser, channel;
    ```

6. С помощью команды `explain` проверьте, было ли для запроса выбрано материализованное представление:

    ```sql
    explain select 
        advertiser, 
        channel, 
        count(distinct user_id) 
    from 
        advertiser_view_record 
    group by 
        advertiser, channel;
    ```

7. Вывод выглядит следующим образом:

    ```sql
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                                                                                         |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    | PLAN FRAGMENT 0                                                                                                                                         |
    |   OUTPUT EXPRS:                                                                                                                                         |
    |     advertiser[#13]                                                                                                                                     |
    |     channel[#14]                                                                                                                                        |
    |     count(DISTINCT user_id)[#15]                                                                                                                        |
    |   PARTITION: HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                            |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: true                                                                                                                              |
    |                                                                                                                                                         |
    |   VRESULT SINK                                                                                                                                          |
    |      MYSQL_PROTOCAL                                                                                                                                     |
    |                                                                                                                                                         |
    |   3:VAGGREGATE (merge finalize)(440)                                                                                                                    |
    |   |  output: bitmap_union_count(partial_bitmap_union_count(__bitmap_union_2)[#9])[#12]                                                                  |
    |   |  group by: advertiser_[#7], channel_[#8]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  final projections: advertiser_[#10], channel_[#11], bitmap_union_count(__bitmap_union_2)[#12]                                                      |
    |   |  final project output tuple id: 4                                                                                                                   |
    |   |  distribute expr lists: advertiser_[#7], channel_[#8]                                                                                               |
    |   |                                                                                                                                                     |
    |   2:VEXCHANGE                                                                                                                                           |
    |      offset: 0                                                                                                                                          |
    |      distribute expr lists:                                                                                                                             |
    |                                                                                                                                                         |
    | PLAN FRAGMENT 1                                                                                                                                         |
    |                                                                                                                                                         |
    |   PARTITION: HASH_PARTITIONED: user_id[#6]                                                                                                              |
    |                                                                                                                                                         |
    |   HAS_COLO_PLAN_NODE: false                                                                                                                             |
    |                                                                                                                                                         |
    |   STREAM DATA SINK                                                                                                                                      |
    |     EXCHANGE ID: 02                                                                                                                                     |
    |     HASH_PARTITIONED: advertiser_[#7], channel_[#8]                                                                                                     |
    |                                                                                                                                                         |
    |   1:VAGGREGATE (update serialize)(430)                                                                                                                  |
    |   |  STREAMING                                                                                                                                          |
    |   |  output: partial_bitmap_union_count(__bitmap_union_2[#2])[#9]                                                                                       |
    |   |  group by: advertiser_[#0], channel_[#1]                                                                                                            |
    |   |  sortByGroupKey:false                                                                                                                               |
    |   |  cardinality=1                                                                                                                                      |
    |   |  distribute expr lists:                                                                                                                             |
    |   |                                                                                                                                                     |
    |   0:VOlapScanNode(425)                                                                                                                                  |
    |      TABLE: test_db.advertiser_view_record(advertiser_uv), PREAGGREGATION: ON                                                                           |
    |      partitions=1/1 (advertiser_view_record)                                                                                                            |
    |      tablets=10/10, tabletList=266637,266639,266641 ...                                                                                                 |
    |      cardinality=1, avgRowSize=0.0, numNodes=1                                                                                                          |
    |      pushAggOp=NONE                                                                                                                                     |
    |                                                                                                                                                         |
    |                                                                                                                                                         |
    | ========== MATERIALIZATIONS ==========                                                                                                                  |
    |                                                                                                                                                         |
    | MaterializedView                                                                                                                                        |
    | MaterializedViewRewriteSuccessAndChose:                                                                                                                 |
    |   internal.test_db.advertiser_view_record.advertiser_uv chose,                                                                                          |
    |                                                                                                                                                         |
    | MaterializedViewRewriteSuccessButNotChose:                                                                                                              |
    |   not chose: none,                                                                                                                                      |
    |                                                                                                                                                         |
    | MaterializedViewRewriteFail:                                                                                                                            |
    |                                                                                                                                                         |
    |                                                                                                                                                         |
    | ========== STATISTICS ==========                                                                                                                        |
    | planed with unknown column statistics                                                                                                                   |
    +---------------------------------------------------------------------------------------------------------------------------------------------------------+
    ```

8. В выводе `explain` присутствует строка `internal.test_db.advertiser_view_record.advertiser_uv chose`. Это означает, что запрос напрямую сканирует данные материализованного представления и представление успешно выбрано. При этом `count(distinct)` для столбца `user_id` переписывается в `bitmap_union_count(to_bitmap)`, что обеспечивает точную дедупликацию с помощью Bitmap.

### Пример 2: Использование другого префиксного индекса {#example-2-match-a-different-prefix-index}

<!-- Applicable scenarios: filter conditions not covered by the base table prefix index -->

**Бизнес-сценарий**: Использование префиксного индекса.

Исходная таблица пользователя содержит три столбца (k1, k2, k3), причём k1 и k2 настроены как столбцы префиксного индекса. Если условие запроса содержит `where k1=1 and k2=2`, индекс может ускорить его выполнение. Однако условия вида `where k3=3` не позволяют использовать префиксный индекс. Чтобы решить эту проблему, можно создать материализованное представление, первым столбцом которого будет `k3`.

**Шаги**:

1. Создайте таблицу и вставьте данные:

    ```sql
    create table test_table
    (
        k1 int, 
        k2 int, 
        k3 int, 
        kx int
    ) 
    distributed by hash(k1) 
    properties("replication_num" = "1");
    
    insert into test_table values(1,1,1,1),(3,3,3,3);
    ```

2. Создайте материализованное представление, использующее k3 в качестве префиксного индекса:

    ```sql
    create materialized view mv_1 as SELECT k3 as k3_, k2 as k2_, k1 as k1_ FROM test_table;
    ```

3. С помощью `EXPLAIN` проверьте, выбирается ли для запроса материализованное представление:

    ```sql
    explain select k1, k2, k3 from test_table where k3=3;
    ```

4. Вывод выглядит следующим образом:

    ```sql
    +----------------------------------------------------------+
    | Explain String(Nereids Planner)                          |
    +----------------------------------------------------------+
    | PLAN FRAGMENT 0                                          |
    |   OUTPUT EXPRS:                                          |
    |     k1[#7]                                               |
    |     k2[#8]                                               |
    |     k3[#9]                                               |
    |   PARTITION: HASH_PARTITIONED: k1_[#2]                   |
    |                                                          |
    |   HAS_COLO_PLAN_NODE: false                              |
    |                                                          |
    |   VRESULT SINK                                           |
    |      MYSQL_PROTOCAL                                      |
    |                                                          |
    |   0:VOlapScanNode(256)                                   |
    |      TABLE: test_db.test_table(mv_1), PREAGGREGATION: ON |
    |      PREDICATES: (mv_k3[#0] = 3)                         |
    |      partitions=1/1 (test_table)                         |
    |      tablets=10/10, tabletList=271177,271179,271181 ...  |
    |      cardinality=1, avgRowSize=0.0, numNodes=1           |
    |      pushAggOp=NONE                                      |
    |      final projections: k1_[#2], mv_k2[#1], mv_k3[#0]    |
    |      final project output tuple id: 2                    |
    |                                                          |
    |                                                          |
    | ========== MATERIALIZATIONS ==========                   |
    |                                                          |
    | MaterializedView                                         |
    | MaterializedViewRewriteSuccessAndChose:                  |
    |   internal.test_db.test_table.mv_1 chose,                |
    |                                                          |
    | MaterializedViewRewriteSuccessButNotChose:               |
    |   not chose: none,                                       |
    |                                                          |
    | MaterializedViewRewriteFail:                             |
    |                                                          |
    |                                                          |
    | ========== STATISTICS ==========                         |
    | planed with unknown column statistics                    |
    +----------------------------------------------------------+
    ```

5. В выводе `EXPLAIN` присутствует строка `internal.test_db.test_table.mv_1 chose`, которая означает, что для запроса успешно выбрано материализованное представление.

### Пример 3: Ускорение запросов с помощью предварительной фильтрации и вычисления выражений {#example-3-accelerate-queries-with-prefiltering-and-expression-computation}

<!-- Applicable scenarios: repeated computation of complex expressions or subset queries under fixed WHERE conditions -->

**Бизнес-сценарий**: Заранее отфильтровать данные или ускорить вычисление выражений.

**Шаги**:

1. Создайте таблицу и вставьте данные:

    ```sql
    create table d_table (
       k1 int null,
       k2 int not null,
       k3 bigint null,
       k4 date null
    )
    duplicate key (k1,k2,k3)
    distributed BY hash(k1) buckets 3
    properties("replication_num" = "1");
    
    insert into d_table select 1,1,1,'2020-02-20';
    insert into d_table select 2,2,2,'2021-02-20';
    insert into d_table select 3,-3,null,'2022-02-20';
    ```

2. Создайте два материализованных представления: одно для предварительного вычисления выражений, другое для предварительной фильтрации данных:

    ```sql
    -- mv1 performs expression computation in advance
    create materialized view mv1 as 
    select 
        abs(k1)+k2+1,        
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        abs(k1)+k2+1;
    
    -- mv2 filters with a where expression in advance to reduce the data volume in the materialized view
    create materialized view mv2 as 
    select 
        year(k4),
        month(k4) 
    from 
        d_table 
    where 
        year(k4) = 2020;
    ```

3. Проверьте использование материализованных представлений:

    ```sql
    -- Hits mv1
    select 
        abs(k1)+k2+1,
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        abs(k1)+k2+1;
        
    -- Hits mv1
    select 
        bin(abs(k1)+k2+1),
        sum(abs(k2+2)+k3+3) 
    from 
        d_table 
    group by 
        bin(abs(k1)+k2+1);
    
    -- Hits mv2
    select 
        year(k4) + month(k4) 
    from 
        d_table 
    where 
        year(k4) = 2020;
    
    -- Hits the original table d_table; does not hit mv2 because the where condition does not match
    select 
        year(k4),
        month(k4) 
    from 
        d_table;
    ```

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: FAQ -->

### Вопрос 1: Почему после создания материализованного представления запрос не удаётся переписать с его использованием? {#q1-after-the-materialized-view-is-created-why-is-it-not-rewritten-successfully}

**Причина**: Материализованное представление может всё ещё находиться в процессе создания.

**Команда диагностики**:

```sql
show alter table materialized view from test_db;
```

**Описание**: Если значение поля `State` отличается от `FINISHED`, дождитесь завершения создания. Запрос сможет использовать материализованное представление только после того, как состояние изменится на `FINISHED`. Кроме того, если базовая таблица не содержит данных, представление также может не выбираться.

### Вопрос 2: Почему после обновления с 2.x до 3.0.0 ранее созданные синхронные материализованные представления больше не используются? {#q2-after-upgrading-from-2x-to-300-why-are-previous-sync-materialized-views-no-longer-hit}

**Причина**: Начиная с версии 3.0.0, по умолчанию применяется прозрачное переписывание запросов с использованием синхронных материализованных представлений на основе информации о структуре плана.

**Решение**: Если запрос использует представление в 2.x, но не использует его в 3.0.0, отключите следующий параметр (включён по умолчанию):

```sql
SET enable_sync_mv_cost_based_rewrite = false;
```

### Вопрос 3: Чем отличаются синхронные и асинхронные материализованные представления? {#q3-what-is-the-difference-between-sync-and-async-materialized-views}

| Критерий сравнения | Синхронное материализованное представление | Асинхронное материализованное представление |
| --- | --- | --- |
| Согласованность данных | Строгая согласованность с базовой таблицей; синхронное обновление при записи | Асинхронное обновление с задержкой |
| Поддерживаемый синтаксис | Только SELECT к одной таблице | Поддерживаются сложные запросы, например JOIN нескольких таблиц |
| Прямой запрос | Не поддерживается; представление должно использоваться через автоматическое переписывание запросов к базовой таблице | Поддерживаются прямые запросы к представлению |
| Затраты на обслуживание | Поддерживается автоматически без ручного вмешательства | Требуется политика обновления |
| Сценарии использования | Агрегация по одной таблице, префиксный индекс, предварительная фильтрация, предварительное вычисление выражений | JOIN нескольких таблиц и предварительные вычисления по нескольким таблицам |
