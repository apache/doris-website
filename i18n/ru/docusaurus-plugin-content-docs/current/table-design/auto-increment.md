---
{
    "title": "Автоинкрементный столбец",
    "language": "ru",
    "description": "Автоинкрементные столбцы Doris (AUTO_INCREMENT) автоматически генерируют уникальное значение BIGINT для каждой строки, упрощая загрузку данных в таких сценариях, как генерация первичных ключей, словарное кодирование и эффективная пагинация."
}
---

<!-- Knowledge type: Feature concept + procedure + use cases -->

В Doris автоинкрементный столбец (Auto Increment Column) автоматически генерирует уникальные числовые значения. Обычно он используется для создания уникального идентификатора каждой строки, например первичного ключа. При вставке новой записи автоинкрементному столбцу автоматически присваивается увеличивающееся значение, избавляя от необходимости вручную задавать числа. Использование автоинкрементного столбца Doris обеспечивает уникальность и согласованность данных, упрощает вставку данных, сокращает количество ошибок, связанных с человеческим фактором, и повышает эффективность управления данными. Поэтому автоинкрементный столбец хорошо подходит для сценариев, в которых нужны уникальные идентификаторы, например идентификаторы пользователей.

## Основные возможности {#core-features}

### Поведение при записи {#write-behavior}

При записи данных в таблицу с автоинкрементным столбцом Doris действует следующим образом:

| Сценарий записи                                                                | Обработка                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Записываемые данные **не содержат** автоинкрементный столбец               | Doris автоматически генерирует уникальное значение и заполняет им столбец |
| Записываемые данные **содержат** автоинкрементный столбец со значением NULL     | Doris заменяет NULL уникальным значением, сгенерированным системой      |
| Записываемые данные **содержат** автоинкрементный столбец со значением, отличным от NULL | Значение, указанное пользователем, сохраняется без изменений                          |

:::caution Важно
Указанное пользователем значение, отличное от NULL, может нарушить уникальность автоинкрементного столбца.
:::

### Уникальность {#uniqueness}

Doris гарантирует, что значения, сгенерированные в автоинкрементном столбце, **уникальны на уровне таблицы**. Однако:

- **Гарантия уникальности**: распространяется только на значения, сгенерированные системой.
- **Значения, указанные пользователем**: Doris не проверяет и не обеспечивает уникальность значений, которые пользователь задаёт в автоинкрементном столбце. Это может привести к появлению дубликатов.

### Плотность значений {#density}

Автоинкрементные значения, генерируемые Doris, обычно **образуют плотную последовательность**, однако следует учитывать несколько особенностей:

- **Возможные пропуски**: из-за оптимизаций производительности в последовательности могут возникать пропуски. Для повышения эффективности каждый узел backend (BE) заранее выделяет блок уникальных значений, причём блоки разных узлов не пересекаются.
- **Отсутствие хронологического порядка**: Doris не гарантирует, что значения, сгенерированные при более поздних записях, будут больше значений, сгенерированных при более ранних записях.

:::info Примечание
По автоинкрементным значениям нельзя определить хронологический порядок записи данных.
:::

## Создание автоинкрементного столбца {#creating-an-auto-increment-column}

<!-- Knowledge type: Syntax + constraints -->

### Синтаксис {#syntax}

Чтобы использовать автоинкрементный столбец, добавьте атрибут `AUTO_INCREMENT` к соответствующему столбцу при выполнении [CREATE-TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE):

- Если начальное значение не указано, по умолчанию используется `1`.
- При создании таблицы можно вручную задать начальное значение автоинкрементного столбца с помощью `AUTO_INCREMENT(start_value)`.

### Ограничения {#constraints-and-limitations}

1. Автоинкрементный столбец могут содержать только таблицы моделей Duplicate и Unique.
2. В таблице может быть не более одного автоинкрементного столбца.
3. Автоинкрементный столбец должен иметь тип `BIGINT` и ограничение `NOT NULL`.
4. Начальное значение автоинкрементного столбца, заданное вручную, должно быть больше или равно 0.

### Примеры создания таблиц {#table-creation-examples}

**Пример 1: таблица модели Duplicate, в которой ключевой столбец является автоинкрементным**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**Пример 2: таблица модели Duplicate, в которой ключевой столбец является автоинкрементным с начальным значением 100**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT(100),
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**Пример 3: таблица модели Duplicate, в которой столбец значений является автоинкрементным**

```sql
CREATE TABLE `demo`.`tbl` (
    `uid` BIGINT NOT NULL,
    `name` BIGINT NOT NULL,
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `value` BIGINT NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`uid`, `name`)
DISTRIBUTED BY HASH(`uid`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**Пример 4: таблица модели Unique, в которой ключевой столбец является автоинкрементным**

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

**Пример 5: таблица модели Unique, в которой столбец значений является автоинкрементным**

```sql
CREATE TABLE `demo`.`tbl` (
    `text` varchar(65533) NOT NULL,
    `id` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`text`)
DISTRIBUTED BY HASH(`text`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

## Загрузка данных {#data-ingestion}

<!-- Use cases: regular ingestion / partial column update -->

### Обычная загрузка {#regular-ingestion}

Рассмотрим следующую таблицу:

```sql
CREATE TABLE `demo`.`tbl` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### Сценарий 1: INSERT INTO без указания автоинкрементного столбца {#scenario-1-insert-into-without-specifying-the-auto-increment-column}

При загрузке данных с помощью оператора `insert into` без указания автоинкрементного столбца `id` Doris автоматически заполняет столбец `id` сгенерированными значениями:

```sql
insert into tbl(name, value) values("Bob", 10), ("Alice", 20), ("Jack", 30);

select * from tbl order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
+------+-------+-------+
```

#### Сценарий 2: Stream Load без указания автоинкрементного столбца {#scenario-2-stream-load-without-specifying-the-auto-increment-column}

Аналогично, при импорте файла `test.csv` с помощью Stream Load без указания автоинкрементного столбца `id` Doris автоматически заполняет столбец `id` сгенерированными значениями.

Содержимое `test.csv`:

```text
Tom,40
John,50
```

Выполните команду загрузки:

```shell
curl --location-trusted -u user:passwd \
    -H "columns:name,value" \
    -H "column_separator:," \
    -T ./test.csv \
    http://{host}:{port}/api/{db}/tbl/_stream_load
```

Проверьте результат с помощью запроса:

```sql
select * from tbl order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
|    4 | Tom   |    40 |
|    5 | John  |    50 |
+------+-------+-------+
```

#### Сценарий 3: INSERT INTO с указанием автоинкрементного столбца со значениями NULL {#scenario-3-insert-into-specifying-the-auto-increment-column-with-null-values}

Если при выполнении `id` указан как автоинкрементный столбец в операторе `insert into`, все значения `null` в этом столбце заменяются сгенерированными значениями:

```sql
insert into tbl(id, name, value) values(null, "Doris", 60), (null, "Nereids", 70);

select * from tbl order by id;
+------+---------+-------+
| id   | name    | value |
+------+---------+-------+
|    1 | Bob     |    10 |
|    2 | Alice   |    20 |
|    3 | Jack    |    30 |
|    4 | Tom     |    40 |
|    5 | John    |    50 |
|    6 | Doris   |    60 |
|    7 | Nereids |    70 |
+------+---------+-------+
```

### Частичное обновление столбцов {#partial-column-update}

При частичном обновлении столбцов в таблице модели Unique с режимом merge-on-write, содержащей автоинкрементный столбец, поведение зависит от того, является ли автоинкрементный столбец ключевым:

| Положение автоинкрементного столбца | Поведение при обновлении                                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Ключевой столбец**                 | Пользователь должен явно указать ключевой столбец, а набор столбцов для частичного обновления должен включать автоинкрементный столбец. Загрузка выполняется так же, как при обычном частичном обновлении столбцов.                 |
| **Неключевой столбец**             | Если автоинкрементный столбец не указан, его значение берётся из существующей строки таблицы. Если он указан, значения `null` заменяются сгенерированными значениями, значения, отличные от `null`, сохраняются, после чего данные вставляются с учётом правил частичного обновления столбцов. |

#### Пример 1: автоинкрементный столбец является ключевым {#example-1-auto-increment-column-as-a-key-column}

```sql
CREATE TABLE `demo`.`tbl2` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` varchar(65533) NOT NULL,
    `value` int(11) NOT NULL DEFAULT "0"
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);

insert into tbl2(id, name, value) values(1, "Bob", 10), (2, "Alice", 20), (3, "Jack", 30);

select * from tbl2 order by id;
+------+-------+-------+
| id   | name  | value |
+------+-------+-------+
|    1 | Bob   |    10 |
|    2 | Alice |    20 |
|    3 | Jack  |    30 |
+------+-------+-------+

set enable_unique_key_partial_update=true;
set enable_insert_strict=false;
insert into tbl2(id, name) values(1, "modified"), (4, "added");

select * from tbl2 order by id;
+------+----------+-------+
| id   | name     | value |
+------+----------+-------+
|    1 | modified |    10 |
|    2 | Alice    |    20 |
|    3 | Jack     |    30 |
|    4 | added    |     0 |
+------+----------+-------+
```

#### Пример 2: автоинкрементный столбец является неключевым {#example-2-auto-increment-column-as-a-non-key-column}

```sql
CREATE TABLE `demo`.`tbl3` (
    `id` BIGINT NOT NULL,
    `name` varchar(100) NOT NULL,
    `score` BIGINT NOT NULL,
    `aid` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);

insert into tbl3(id, name, score) values(1, "Doris", 100), (2, "Nereids", 200), (3, "Bob", 300);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   100 |    0 |
|    2 | Nereids |   200 |    1 |
|    3 | Bob     |   300 |    2 |
+------+---------+-------+------+

set enable_unique_key_partial_update=true;
set enable_insert_strict=false;
insert into tbl3(id, score) values(1, 999), (2, 888);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   999 |    0 |
|    2 | Nereids |   888 |    1 |
|    3 | Bob     |   300 |    2 |
+------+---------+-------+------+

insert into tbl3(id, aid) values(1, 1000), (3, 500);

select * from tbl3 order by id;
+------+---------+-------+------+
| id   | name    | score | aid  |
+------+---------+-------+------+
|    1 | Doris   |   999 | 1000 |
|    2 | Nereids |   888 |    1 |
|    3 | Bob     |   300 |  500 |
+------+---------+-------+------+
```

## Типичные сценарии использования {#typical-use-cases}

<!-- Use cases: dictionary encoding / efficient pagination -->

### Сценарий использования 1: словарное кодирование {#use-case-1-dictionary-encoding}

**Область применения**: при построении профилей пользователей с использованием битовых карт для когортного анализа необходимо создать словарь пользователей, в котором каждому пользователю соответствует уникальное целочисленное значение. Плотно расположенные значения словаря повышают производительность работы с битовыми картами.

Следующие шаги иллюстрируют процедуру на примере офлайн-анализа UV/PV.

#### Шаг 1: создание таблицы с подробными данными о поведении пользователей {#step-1-create-the-user-behavior-detail-table}

Предположим, что подробные данные хранятся в следующей таблице поведения пользователей:

```sql
CREATE TABLE `demo`.`dwd_dup_tbl` (
    `user_id` varchar(50) NOT NULL,
    `dim1` varchar(50) NOT NULL,
    `dim2` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim4` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `visit_time` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`user_id`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### Шаг 2: создание таблицы словаря с автоинкрементным столбцом {#step-2-create-the-dictionary-table-using-an-auto-increment-column}

```sql
CREATE TABLE `demo`.`dictionary_tbl` (
    `user_id` varchar(50) NOT NULL,
    `aid` BIGINT NOT NULL AUTO_INCREMENT
) ENGINE=OLAP
UNIQUE KEY(`user_id`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "enable_unique_key_merge_on_write" = "true"
);
```

#### Шаг 3: загрузка данных для построения соответствий кодирования {#step-3-load-data-to-build-the-encoding-mapping}

Загрузите значения `user_id` из существующих данных в таблицу словаря, чтобы построить соответствие между `user_id` и целочисленными значениями:

```sql
insert into dictionary_tbl(user_id)
select user_id from dwd_dup_tbl group by user_id;
```

Или используйте следующий подход, чтобы загрузить в таблицу словаря только значения `user_id` из новых данных:

```sql
insert into dictionary_tbl(user_id)
select dwd_dup_tbl.user_id from dwd_dup_tbl left join dictionary_tbl
on dwd_dup_tbl.user_id = dictionary_tbl.user_id
where dwd_dup_tbl.visit_time > '2023-12-10' and dictionary_tbl.user_id is NULL;
```

:::tip
В реальных сценариях для записи данных в Doris также можно использовать Flink Connector.
:::

#### Шаг 4: создание таблицы результатов агрегации {#step-4-create-the-aggregate-result-table}

Предположим, что `dim1`, `dim3` и `dim5` — интересующие нас измерения для статистического анализа. Создайте следующую таблицу агрегации для хранения результатов:

```sql
CREATE TABLE `demo`.`dws_agg_tbl` (
    `dim1` varchar(50) NOT NULL,
    `dim3` varchar(50) NOT NULL,
    `dim5` varchar(50) NOT NULL,
    `user_id_bitmap` BITMAP BITMAP_UNION NOT NULL,
    `pv` BIGINT SUM NOT NULL
) ENGINE=OLAP
AGGREGATE KEY(`dim1`,`dim3`,`dim5`)
DISTRIBUTED BY HASH(`dim1`) BUCKETS 32
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

#### Шаг 5: агрегация данных и выполнение запросов {#step-5-aggregate-the-data-and-run-queries}

Агрегируйте данные и сохраните результат в таблице результатов агрегации:

```sql
insert into dws_agg_tbl
select dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5, BITMAP_UNION(TO_BITMAP(dictionary_tbl.aid)), COUNT(1)
from dwd_dup_tbl INNER JOIN dictionary_tbl on dwd_dup_tbl.user_id = dictionary_tbl.user_id
group by dwd_dup_tbl.dim1, dwd_dup_tbl.dim3, dwd_dup_tbl.dim5;
```

Выполните запросы UV и PV:

```sql
select dim1, dim3, dim5, bitmap_count(user_id_bitmap) as uv, pv from dws_agg_tbl;
```

### Сценарий использования 2: эффективная пагинация {#use-case-2-efficient-pagination}

**Предпосылки**: при отображении данных на странице часто требуется пагинация. Традиционный подход к пагинации обычно использует `limit`, `offset` и `order by` в SQL. Однако при глубокой пагинации, когда смещение очень велико, этот подход считывает все данные в память, выполняет полную сортировку и лишь затем продолжает обработку, даже если фактически требуется всего несколько строк. Это неэффективно.

**Идея оптимизации**: с помощью автоинкрементного столбца каждой строке можно присвоить уникальное значение. При выполнении запроса сохраните максимальное значение `max_value` столбца `unique_value` с предыдущей страницы, а затем используйте `where unique_value > max_value limit rows_per_page`, чтобы на раннем этапе отфильтровать большой объём данных за счёт проталкивания предикатов и повысить эффективность пагинации.

#### Традиционная пагинация (неэффективная) {#traditional-pagination-inefficient}

Предположим, что данные следующей рабочей таблицы нужно выводить постранично:

```sql
CREATE TABLE `demo`.`records_tbl` (
    `user_id` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT ""
) DUPLICATE KEY (`user_id`, `name`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

Предположим, что на каждой странице отображается 100 строк:

- Получение страницы 1:

    ```sql
    select * from records_tbl order by user_id, name limit 100;
    ```

- Получение страницы 2:

    ```sql
    select * from records_tbl order by user_id, name limit 100 offset 100;
    ```

#### Пагинация с автоинкрементным столбцом (эффективная) {#auto-increment-column-pagination-efficient}

Добавьте в таблицу автоинкрементный столбец, чтобы присвоить каждой строке уникальный идентификатор:

```sql
CREATE TABLE `demo`.`records_tbl2` (
    `user_id` int(11) NOT NULL COMMENT "",
    `name` varchar(26) NOT NULL COMMENT "",
    `address` varchar(41) NOT NULL COMMENT "",
    `city` varchar(11) NOT NULL COMMENT "",
    `nation` varchar(16) NOT NULL COMMENT "",
    `region` varchar(13) NOT NULL COMMENT "",
    `phone` varchar(16) NOT NULL COMMENT "",
    `mktsegment` varchar(11) NOT NULL COMMENT "",
    `unique_value` BIGINT NOT NULL AUTO_INCREMENT
) DUPLICATE KEY (`user_id`, `name`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

На каждой странице отображается 100 строк:

- **Запрос страницы 1**:

    ```sql
    select * from records_tbl2 order by unique_value limit 100;
    ```

- **Запрос страницы 2**: сохраните в программе максимальное значение `unique_value`, возвращённое предыдущим запросом (предположим, что оно равно 99), а затем выполните:

    ```sql
    select * from records_tbl2 where unique_value > 99 order by unique_value limit 100;
    ```

- **Прямой переход к более поздней странице**: при прямом запросе более поздней страницы получить максимальное значение `unique_value` с предыдущей страницы неудобно. Например, чтобы сразу получить страницу 101, выполните следующий запрос:

    ```sql
    select user_id, name, address, city, nation, region, phone, mktsegment
    from records_tbl2, (select unique_value as max_value from records_tbl2 order by unique_value limit 1 offset 9999) as previous_data
    where records_tbl2.unique_value > previous_data.max_value
    order by unique_value limit 100;
    ```
