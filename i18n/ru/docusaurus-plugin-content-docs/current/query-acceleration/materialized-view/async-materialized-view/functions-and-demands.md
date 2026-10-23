---
{
    "title": "Управление асинхронными материализованными представлениями и запросы к ним",
    "language": "ru",
    "description": "Как создавать асинхронные материализованные представления в Doris и ускорять запросы с помощью прямых запросов и прозрачного переписывания. В статье рассматриваются политики обновления, настройка разделов и операции обслуживания.",
    "keywords": ["асинхронное материализованное представление Doris", "CREATE MATERIALIZED VIEW", "прозрачное переписывание запросов", "обновление материализованного представления", "материализованное представление с разделами", "вложенное материализованное представление"]
}
---

<!-- Knowledge type: Operations manual + Reference documentation -->
<!-- Applicable scenarios: Use Doris async materialized views to accelerate queries, build data models, and operate and manage materialized views -->

Асинхронные материализованные представления — это возможность Doris для ускорения запросов за счёт предварительных вычислений. Статья построена в соответствии с рабочим процессом пользователя и последовательно охватывает следующие темы:

- **Создание материализованных представлений**: синтаксис, политики обновления и настройка разделов.
- **Запросы к материализованным представлениям**: прямые запросы и прозрачное переписывание запросов.
- **Обслуживание материализованных представлений**: изменение, удаление, мониторинг и настройка связанных параметров.

Перед чтением убедитесь, что:

- Вы понимаете основные понятия и сценарии применения асинхронных материализованных представлений.
- Новый оптимизатор включён (`enable_nereids_planner = true`).
- Вы знакомы с основами создания таблиц и синтаксисом SQL.

---

## 1. Создание материализованных представлений {#1-create-materialized-views}

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building an async materialized view for the first time -->

### 1.1 Права доступа {#11-permissions}

Для создания материализованного представления требуются следующие два типа прав:

- **Право на создание материализованного представления**: такое же, как право на создание таблицы.
- **Право на запросы к базовым таблицам**: такое же, как право SELECT (то есть право выполнять запросы к базовым таблицам, на которые ссылается SQL-определение материализованного представления).

### 1.2 Синтаксис создания {#12-creation-syntax}

Полный синтаксис создания асинхронного материализованного представления:

```sql
CREATE MATERIALIZED VIEW
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ]
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [FALLBACK] [refresh_trigger]]
    [ [DUPLICATE] KEY (<key_cols>) ]
    [ COMMENT '<table_comment>' ]
    [ PARTITION BY (
        { <partition_col>
            | DATE_TRUNC(<partition_col>, <partition_unit>) }
                    )]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ])
    ]
    AS <query>
```

### 1.3 Настройка обновления {#13-refresh-configuration}

Настройка обновления включает три категории параметров: **момент обновления (build_mode)**, **метод обновления (refresh_method)** и **способ запуска (refresh_trigger)**.

#### 1.3.1 Обзор параметров {#131-parameter-overview}

| Категория | Значение | Описание |
| -------- | ------------- | -------------------------------------------------------------------------- |
| Момент обновления | `IMMEDIATE`   | Обновить сразу после создания (по умолчанию). |
| Момент обновления | `DEFERRED`    | Отложить обновление после создания. |
| Метод обновления | `COMPLETE`    | Полное обновление всех разделов. |
| Метод обновления | `PARTITIONS`  | Пересчитывает изменившиеся разделы материализованного представления. |
| Метод обновления | `INCREMENTAL` | Использует Incremental View Maintenance (IVM) для обработки изменений на уровне строк. |
| Метод обновления | `AUTO`        | Doris автоматически выбирает IVM, обновление разделов или полное обновление. |
| Способ запуска | `ON MANUAL`   | Запускается пользователем вручную с помощью инструкций SQL. |
| Способ запуска | `ON SCHEDULE` | Запускается периодически с указанным интервалом. |
| Способ запуска | `ON COMMIT`   | Запускается автоматически при изменении данных базовой таблицы (поддерживается начиная с Apache Doris 2.1.4). |

#### 1.3.2 ON MANUAL: запуск вручную {#132-on-manual-manual-trigger}

При запуске обновления материализованного представления с помощью инструкции SQL можно переопределить метод обновления, заданный при создании.

**Стратегия 1**: использовать IVM для обработки изменений на уровне строк в базовых таблицах между двумя обновлениями.

```sql
REFRESH MATERIALIZED VIEW mvName INCREMENTAL FALLBACK;
```

`FALLBACK` позволяет Doris перейти к обновлению разделов или полному обновлению, если безопасное выполнение IVM невозможно. Строгое инкрементальное обновление без `FALLBACK` сразу завершается ошибкой. Предварительные требования, поддерживаемые сценарии и правила перехода к другим методам обновления для IVM описаны в разделе [Инкрементальное обслуживание представлений (IVM)](incremental-materialized-view).

**Стратегия 2**: позволить Doris автоматически выбрать доступный метод обновления.

```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```

:::tip Совет
- Если базовая таблица, на которую ссылается SQL-определение материализованного представления, является таблицей JDBC, Doris не может обнаруживать изменения её данных, поэтому при обновлении необходимо указать `COMPLETE`. Иначе может возникнуть ситуация, когда в базовой таблице есть данные, а в материализованном представлении их нет.
- Сейчас Doris может обнаруживать изменения данных только во внутренних таблицах и таблицах источников данных Hive. Поддержка других источников данных добавляется постепенно.
:::

**Стратегия 3**: пропустить проверку изменений данных в разделах базовых таблиц и сразу обновить все разделы материализованного представления.

```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```

**Стратегия 4**: обновить только указанные разделы.

```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1, partitionName2);
```

:::tip Совет
- Значение `partitionName` можно получить с помощью `SHOW PARTITIONS FROM mvName`.
- Обнаружение изменений данных в разделах базовых таблиц Hive поддерживается начиная с версии 2.1.3. Для других внешних таблиц оно пока не поддерживается, а для внутренних таблиц поддерживается всегда.
:::

#### 1.3.3 ON SCHEDULE: периодический запуск {#133-on-schedule-periodic-trigger}

Укажите интервал обновления в инструкции создания. Значением `refreshUnit` может быть `minute`, `hour`, `day`, `week` и так далее.

**Пример 1**: полное обновление (`REFRESH COMPLETE`), все разделы обновляются каждые 10 часов.

```sql
CREATE MATERIALIZED VIEW mv_6
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
AS
SELECT * FROM lineitem;
```

**Пример 2**: инкрементальное обновление, когда это возможно (`REFRESH AUTO`), с запуском каждые 10 часов. Обновляются только разделы, данные которых изменились; если инкрементальное обновление невозможно, выполняется полное обновление.

```sql
CREATE MATERIALIZED VIEW mv_7
REFRESH AUTO ON SCHEDULE EVERY 10 hour
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

:::tip Совет
Начиная с версии 2.1.3 Doris может автоматически определять разделы таблиц Hive, которые необходимо обновить.
:::

#### 1.3.4 ON COMMIT: автоматический запуск {#134-on-commit-automatic-trigger}

:::tip Совет
Эта возможность поддерживается начиная с Apache Doris 2.1.4.
:::

После изменения данных базовой таблицы обновление соответствующего материализованного представления запускается автоматически. Набор обновляемых разделов определяется так же, как при периодическом запуске.

```sql
CREATE MATERIALIZED VIEW mv_8
REFRESH AUTO ON COMMIT
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

При изменении данных в разделе `t1` базовой таблицы `lineitem` автоматически запускается обновление соответствующего раздела материализованного представления.

:::caution Внимание
Если данные базовой таблицы меняются часто, этот способ запуска не рекомендуется: частое создание задач обновления приводит к чрезмерному потреблению ресурсов.
:::

Подробности см. в разделе [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW).

#### 1.3.5 Полные примеры {#135-complete-examples}

Следующие полные примеры демонстрируют механизм обновления. Сначала создайте базовые таблицы и заполните их исходными данными:

```sql
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
(FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
(2, 4, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
(3, 2, 4, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-19', '2023-10-19', '2023-10-19', 'a', 'b', 'yyyyyyyyy');

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
FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;

INSERT INTO orders VALUES
(1, 1, 'o', 9.5, '2023-10-17', 'a', 'b', 1, 'yy'),
(1, 1, 'o', 10.5, '2023-10-18', 'a', 'b', 1, 'yy'),
(2, 1, 'o', 11.5, '2023-10-19', 'a', 'b', 1, 'yy'),
(3, 1, 'o', 12.5, '2023-10-19', 'a', 'b', 1, 'yy');

CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey     INTEGER NOT NULL,
    ps_suppkey     INTEGER NOT NULL,
    ps_availqty    INTEGER NOT NULL,
    ps_supplycost  DECIMALV3(15,2)  NOT NULL,
    ps_comment     VARCHAR(199) NOT NULL
)
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES
(2, 3, 9, 10.01, 'supply1'),
(4, 3, 10, 11.01, 'supply2'),
(2, 3, 10, 11.01, 'supply3');
```

**Пример 1: немедленное инкрементальное обновление + запуск вручную**

Первое обновление выполняется сразу после создания (`BUILD IMMEDIATE`), метод обновления — инкрементальный, когда это возможно (`REFRESH AUTO`), а способ запуска — ручной (`ON MANUAL`). У полного материализованного представления без разбиения на разделы есть только один раздел, поэтому любое изменение данных базовой таблицы приводит к полному обновлению.

```sql
CREATE MATERIALIZED VIEW mv_1_0
BUILD IMMEDIATE
REFRESH AUTO
ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**Пример 2: отложенное полное обновление + запуск по расписанию**

Первое обновление отложено (`BUILD DEFERRED`), метод обновления — полный (`REFRESH COMPLETE`), время первого обновления — `2024-12-01 20:30:00`, далее обновление выполняется раз в день.

:::tip Совет
Время, указанное в `STARTS`, должно быть позже текущего времени. Если задано `BUILD IMMEDIATE`, сразу после создания однократно выполняется обновление, а затем оно выполняется раз в день начиная с `2024-12-01 20:30:00`.
:::

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD DEFERRED
REFRESH COMPLETE
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**Пример 3: немедленное полное обновление + автоматический запуск**

Первое обновление выполняется немедленно (`BUILD IMMEDIATE`), метод обновления — полный (`REFRESH COMPLETE`), а способ запуска — автоматический (`ON COMMIT`). Изменение данных в любой из таблиц `orders` или `lineitem` автоматически запускает обновление.

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD IMMEDIATE
REFRESH COMPLETE
ON COMMIT
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

### 1.4 Настройка разделов {#14-partition-configuration}

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building partitioned materialized views and accelerating partition-grained queries -->

При создании материализованного представления с разделами необходимо указать `PARTITION BY`. **Выражение, на которое ссылается столбец разбиения, может использовать только функцию `date_trunc` и идентификаторы.**

#### 1.4.1 Пример допустимого столбца разбиения {#141-valid-partition-column-example}

Столбец, на который ссылается столбец разбиения, использует только функцию `date_trunc`. Для материализованного представления с разделами обычно используется метод обновления `AUTO`.

```sql
CREATE MATERIALIZED VIEW mv_2_0
BUILD IMMEDIATE
REFRESH AUTO
ON MANUAL
PARTITION BY (order_date_month)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    date_trunc(o_orderdate, 'month') as order_date_month,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 1.4.2 Пример недопустимого столбца разбиения {#142-invalid-partition-column-example}

Следующая инструкция не позволяет создать материализованное представление, поскольку столбец разбиения использует функцию `date_add()`.

```sql
CREATE MATERIALIZED VIEW mv_2_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (order_date_month)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    date_trunc(date_add(o_orderdate, INTERVAL 2 DAY), 'month') as order_date_month,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

Сообщение об ошибке: `because column to check use invalid implicit expression, invalid expression is days_add(o_orderdate#4, 2)`.

#### 1.4.3 Разбиение базовой таблицы по нескольким столбцам {#143-multi-column-partitioning-of-the-base-table}

В настоящее время разбиение по нескольким столбцам поддерживается только для внешних таблиц Hive. Например, если разбиение первого уровня выполняется по дате, а второго — по региону, материализованное представление может выбрать столбец любого уровня в качестве собственного столбца разбиения.

Инструкция создания таблицы Hive:

```sql
CREATE TABLE hive1 (
    `k1` int)
PARTITIONED BY (
    `year` int,
    `region` string)
STORED AS ORC;

ALTER TABLE hive1 ADD IF NOT EXISTS
PARTITION(year=2020, region="bj")
PARTITION(year=2020, region="sh")
PARTITION(year=2021, region="bj")
PARTITION(year=2021, region="sh")
PARTITION(year=2022, region="bj")
PARTITION(year=2022, region="sh");
```

**Сценарий 1: использовать `year` в качестве столбца разбиения.** Материализованное представление `mv_hive` будет содержать три раздела: `('2020')`, `('2021')` и `('2022')`.

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

**Сценарий 2: использовать `region` в качестве столбца разбиения.** Материализованное представление `mv_hive2` будет содержать два раздела: `('bj')` и `('sh')`.

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

#### 1.4.4 Использование только части разделов базовой таблицы {#144-use-only-a-subset-of-base-table-partitions}

Сценарий применения: в базовой таблице много разделов, но материализованному представлению нужны только недавние «горячие» данные.

Инструкция создания базовой таблицы:

```sql
CREATE TABLE t1 (
    `k1` INT,
    `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
    PARTITION p26 VALUES [("2024-03-26"),("2024-03-27")),
    PARTITION p27 VALUES [("2024-03-27"),("2024-03-28")),
    PARTITION p28 VALUES [("2024-03-28"),("2024-03-29"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

Материализованное представление синхронизирует данные только за последний день. Если текущее время — `2024-03-28 xx:xx:xx`, материализованное представление будет содержать только один раздел `[("2024-03-28"),("2024-03-29")]`.

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`k2`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
    'partition_sync_limit' = '1',
    'partition_sync_time_unit' = 'DAY'
)
AS
SELECT * FROM t1;
```

Через день, когда время станет `2024-03-29 xx:xx:xx`, в `t1` добавится новый раздел `[("2024-03-29"),("2024-03-30")]`. После обновления материализованное представление будет содержать только один раздел `[("2024-03-29"),("2024-03-30")]`.

:::tip Совет
Если столбец разбиения имеет строковый тип, можно задать свойство материализованного представления `partition_date_format`, например `%Y-%m-%d`.
:::

#### 1.4.5 Укрупнение разделов {#145-partition-roll-up}

:::tip Совет
Разбиение по диапазонам поддерживается начиная с Doris 2.1.5.
:::

**Сценарий применения**: после агрегации данных базовой таблицы объём данных в каждом разделе значительно уменьшается. Укрупнение разделов сокращает их количество в материализованном представлении.

Инструкция создания базовой таблицы:

```sql
CREATE TABLE `t1` (
    `k1` LARGEINT NOT NULL,
    `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
    PARTITION p_20200101 VALUES [("2020-01-01"),("2020-01-02")),
    PARTITION p_20200102 VALUES [("2020-01-02"),("2020-01-03")),
    PARTITION p_20200201 VALUES [("2020-02-01"),("2020-02-02"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

**Укрупнение до месяца**: материализованное представление содержит два раздела: `[("2020-01-01","2020-02-01")]` и `[("2020-02-01","2020-03-01")]`.

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

**Укрупнение до года**: материализованное представление содержит только один раздел: `[("2020-01-01","2021-01-01")]`.

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

:::tip Совет
Если столбец разбиения имеет строковый тип, формат даты можно указать с помощью свойства `partition_date_format`, например `'%Y-%m-%d'`.
:::

Подробности см. в разделе [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW).

#### 1.4.6 Обновление разделов по нескольким источникам {#146-multi-source-partition-refresh}

**Определение**: асинхронное материализованное представление может отслеживать изменения разделов нескольких таблиц. Это означает, что при изменении данных любой из этих таблиц материализованное представление выполняет обновление разделов вместо полного обновления.

**Ограничения**:

- Поддерживаются только материализованные представления, построенные на основе `INNER JOIN` или `UNION` (включая `UNION ALL`).
- Если материализованное представление использует `UNION`, каждая часть объединения должна поддерживать отслеживание изменений разделов (PCT). Например, если материализованное представление определено как `q1 union all q2`, то и `q1`, и `q2` при отдельном использовании для создания материализованного представления должны поддерживать обновление разделов, а выведенные столбцы разбиения должны идти в согласованном порядке.
- Гранулярность разделов нескольких таблиц PCT должна быть согласована:

    **Допустимый пример**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)
    Partitions of base table t2: [2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)
    ```

    Наборы разделов базовых таблиц совпадают не полностью, но несовпадающие разделы не пересекаются.

    **Недопустимый пример**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)
    Partitions of base table t2: [2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)
    ```

    `[2020-01-01, 2020-01-03)` и `[2020-01-01, 2020-01-02)` пересекаются, но не совпадают.

### 1.5 Примечания к SQL-определению {#15-sql-definition-notes}

Асинхронные материализованные представления можно создавать на основе внутренних представлений (View), но **создание на основе представлений из внешних источников данных не поддерживается**.

Обратите внимание на следующее:

- При изменении или пересоздании внутреннего представления, от которого зависит материализованное представление, данные асинхронного материализованного представления перестают соответствовать базовой таблице. Данные в материализованном представлении при этом сохраняются, но использовать его для прозрачного переписывания запросов нельзя.
- Если изменение структуры затрагивает таблицу или столбец отслеживания разделов, от которых зависит асинхронное материализованное представление, либо меняет его схему, обновление материализованного представления завершится ошибкой.
- Если изменение не затрагивает перечисленные элементы, после обновления материализованное представление снова можно использовать в обычном режиме.

---

## 2. Запросы к материализованным представлениям {#2-query-materialized-views}

Начиная с версии 4.1.5 запросы к историческим снимкам и запросы Time Travel к внешним таблицам исключены из прозрачного переписывания с использованием текущих данных материализованных представлений, поэтому запрос читает запрошенный снимок. Это ограничение не влияет на переписывание запросов к текущим данным.

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Use materialized views to accelerate queries -->

Существует два способа выполнять запросы к материализованным представлениям: **прямой запрос** и **прозрачное переписывание запроса**.

| Способ запроса | Требуется изменение исходного запроса | Сценарии применения |
| ------------ | ------------------ | ---------------------------------------------- |
| Прямой запрос | Да | Вы знаете о существовании материализованного представления и хотите явно использовать результаты его предварительных вычислений. |
| Прозрачное переписывание | Нет | Вы хотите использовать материализованные представления для ускорения запросов без изменений со стороны пользователей. |

### 2.1 Прямые запросы к материализованным представлениям {#21-direct-query-of-materialized-views}

С материализованным представлением можно работать как с таблицей: выполнять прямые запросы с условиями фильтрации, агрегацией и другими операциями.

**Определение материализованного представления**:

```sql
CREATE MATERIALIZED VIEW mv_5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

**Исходный запрос**:

```sql
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE o_orderdate = '2023-10-18';
```

**Эквивалентный прямой запрос к материализованному представлению** (пользователь должен переписать его вручную):

```sql
SELECT
    l_linenumber,
    o_custkey
FROM mv_5
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

### 2.2 Прозрачное переписывание запросов {#22-transparent-query-rewrite}

**Прозрачное переписывание** означает, что система автоматически оптимизирует и переписывает запрос в процессе его обработки, без ручного изменения со стороны пользователя. Для асинхронных материализованных представлений Doris используется алгоритм прозрачного переписывания на основе шаблона SPJG (SELECT-PROJECT-JOIN-GROUP-BY). Алгоритм анализирует структуру SQL, автоматически находит подходящие материализованные представления и выбирает оптимальный вариант для выполнения запроса.

В следующей таблице перечислены возможности прозрачного переписывания, поддерживаемые Doris:

| Возможность переписывания | Сценарии применения |
| ------------------ | ------------------------------------------------------------- |
| Компенсация предикатов | Условия `WHERE` запроса и материализованного представления не полностью совпадают. |
| Переписывание JOIN | Запрос и материализованное представление используют одни и те же таблицы и одинаковый тип JOIN. |
| Выведение JOIN | Типы JOIN в запросе и материализованном представлении различаются, но материализованное представление может предоставить достаточно данных. |
| Переписывание агрегации | Измерения группировки в запросе и материализованном представлении совпадают. |
| Переписывание агрегации со свёрткой | Набор измерений материализованного представления включает измерения запроса, а агрегатные функции запроса можно выразить через функции материализованного представления. |
| Переписывание многомерной агрегации | Материализованное представление не использует `GROUPING SETS`/`CUBE`/`ROLLUP`, а запрос содержит многомерную агрегацию. |
| Переписывание с компенсацией разделов | Если материализованное представление с разделами не может предоставить все данные для запроса, они объединяются с данными базовой таблицы через `UNION ALL`. |
| Переписывание с использованием вложенных материализованных представлений | Материализованное представление построено на основе другого материализованного представления. |
| Использование представления без агрегации для агрегирующего запроса | Запрос содержит агрегацию, а материализованное представление не содержит агрегации, но может предоставить все необходимые столбцы. |
| Переписывание оконных функций | И запрос, и материализованное представление содержат оконные функции, определения которых полностью совпадают. |
| Переписывание Limit / TopN | Запрос содержит `ORDER BY` или `LIMIT`, а материализованное представление удовлетворяет требованиям. |

#### 2.2.1 Компенсация предикатов {#221-predicate-compensation}

Условия запроса и материализованного представления не обязательно должны совпадать. Дополнительные предикаты поверх материализованного представления позволяют выразить запрос и максимально широко использовать это представление повторно.

Если условия `WHERE` материализованного представления и запроса являются выражениями, соединёнными через `AND`, возможны два случая:

**Случай 1: выражение запроса содержит выражение материализованного представления** — можно применить компенсацию предикатов.

Например, если условие запроса — `a > 5 AND b > 10 AND c = 7`, а условие материализованного представления — `a > 5 AND b > 10`, то условие материализованного представления является подмножеством условия запроса и достаточно добавить только условие `c = 7`.

**Случай 2: выражение запроса не полностью содержит выражение материализованного представления** — если из условия запроса можно вывести условие материализованного представления (обычно для сравнений и диапазонов, например `>`, `<`, `=`, `IN`), компенсацию предикатов также можно применить. Результирующим компенсирующим условием будет само условие запроса.

Например, если условие запроса — `a > 5 AND b = 10`, а условие материализованного представления — `a > 1 AND b > 8`, то условие материализованного представления охватывает условие запроса и допускает компенсацию; результирующее компенсирующее условие — `a > 5 AND b = 10`.

**Ограничения компенсации предикатов**:

- Для выражений, соединённых через `OR`, компенсация предикатов не поддерживается: для успешного переписывания условия должны совпадать.
- Для выражений, не являющихся сравнениями или диапазонами, например `LIKE`, компенсация предикатов не поддерживается: для успешного переписывания условия должны совпадать.

**Пример**:

Определение материализованного представления:

```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

Следующие запросы могут использовать одно и то же материализованное представление за счёт прозрачного переписывания, что сокращает время переписывания и затраты на построение представлений:

```sql
SELECT l_linenumber,
       o_custkey,
       o_orderdate
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 2;
```

```sql
SELECT l_linenumber,
       o_custkey,
       o_orderdate
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 2 AND o_orderdate = '2023-10-19';
```

#### 2.2.2 Переписывание JOIN {#222-join-rewrite}

**Сценарий применения**: запрос и материализованное представление используют одни и те же таблицы. Предложения `WHERE` могут находиться во входных данных JOIN или вне JOIN как в материализованном представлении, так и в запросе. Оптимизатор пытается выполнить прозрачное переписывание запросов такого вида.

**Поддерживаемые типы JOIN**:

- `INNER JOIN`
- `LEFT OUTER JOIN`
- `RIGHT OUTER JOIN`
- `FULL OUTER JOIN`
- `LEFT SEMI JOIN`
- `RIGHT SEMI JOIN`
- `LEFT ANTI JOIN`
- `RIGHT ANTI JOIN`

**Пример**:

Определение материализованного представления:

```sql
CREATE MATERIALIZED VIEW mv2
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

Следующий запрос допускает прозрачное переписывание. Условие `l_linenumber > 1` можно поднять выше, а результаты предварительных вычислений материализованного представления — использовать для выражения запроса. Использование материализованного представления позволяет избежать вычисления JOIN.

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

#### 2.2.3 Выведение JOIN {#223-join-derivation}

Если типы JOIN в запросе и материализованном представлении различаются, прозрачное переписывание всё ещё возможно, когда материализованное представление может предоставить все необходимые запросу данные. Для этого используются компенсирующие предикаты вне JOIN.

**Пример**:

Определение материализованного представления:

```sql
CREATE MATERIALIZED VIEW mv3
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    l_suppkey,
    o_orderdate;
```

Инструкция запроса:

```sql
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_suppkey = 3
GROUP BY
    l_shipdate,
    l_suppkey,
    o_orderdate;
```

#### 2.2.4 Переписывание агрегации {#224-aggregation-rewrite}

**Условия применения**: измерения группировки в запросе и определении материализованного представления совпадают, а агрегатные функции запроса можно выразить через агрегатные функции материализованного представления.

**Пример**:

Определение материализованного представления:

```sql
CREATE MATERIALIZED VIEW mv4
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
GROUP BY
    o_shippriority,
    o_comment;
```

Следующий запрос допускает прозрачное переписывание: измерения агрегации совпадают, поле `o_shippriority` материализованного представления можно использовать для фильтрации результатов, а измерения GROUP BY и агрегатные функции можно переписать с использованием материализованного представления. Использование материализованного представления с агрегацией сокращает объём вычислений агрегации:

```sql
SELECT
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
WHERE o_shippriority IN (1, 2)
GROUP BY
    o_shippriority,
    o_comment;
```

#### 2.2.5 Переписывание агрегации со свёрткой {#225-aggregation-rewrite-roll-up}

Переписывание возможно и тогда, когда измерения агрегации не совпадают. Требования:

- Набор измерений `GROUP BY` материализованного представления должен включать измерения `GROUP BY` запроса. В запросе может отсутствовать `GROUP BY`.
- Агрегатные функции запроса должны выражаться через агрегатные функции материализованного представления.

**Пример**:

Определение материализованного представления:

```sql
CREATE MATERIALIZED VIEW mv5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, o_orderdate, l_partkey, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    bitmap_union(to_bitmap(CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END)) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

Следующий запрос допускает прозрачное переписывание. Набор измерений материализованного представления включает измерения запроса, поэтому для свёртки предпринимается попытка использовать функции из `SELECT` материализованного представления. Например, функция `bitmap_union` материализованного представления в итоге сворачивается в `bitmap_union_count`, что семантически соответствует `count(distinct)` в запросе.

Свёртка агрегации позволяет повторно использовать одно материализованное представление в нескольких запросах, сокращая затраты на построение представлений:

```sql
SELECT
    l_shipdate, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_partkey = 3
GROUP BY
    l_shipdate,
    l_suppkey;
```

**Список агрегатных функций, поддерживающих свёртку**:

| Функция в запросе | Функция в материализованном представлении | Функция после свёртки |
| ------------------------------------------------------- | ------------------------------------------- | -------------------- |
| `max`                                                   | `max`                                       | `max`                |
| `min`                                                   | `min`                                       | `min`                |
| `sum`                                                   | `sum`                                       | `sum`                |
| `count`                                                 | `count`                                     | `sum`                |
| `count(distinct)`                                       | `bitmap_union`                              | `bitmap_union_count` |
| `bitmap_union`                                          | `bitmap_union`                              | `bitmap_union`       |
| `bitmap_union_count`                                    | `bitmap_union`                              | `bitmap_union_count` |
| `hll_union_agg`, `approx_count_distinct`, `hll_cardinality` | `hll_union` или `hll_raw_agg`            | `hll_union_agg`      |
| `any_value`                                             | `any_value` или столбец после SELECT, на который ссылается `any_value` | `any_value`          |

#### 2.2.6 Переписывание многомерной агрегации {#226-multi-dimensional-aggregation-rewrite}

Прозрачное переписывание поддерживает многомерную агрегацию: материализованное представление не использует `GROUPING SETS`/`CUBE`/`ROLLUP`, запрос содержит многомерную агрегацию, а столбцы `GROUP BY` материализованного представления включают все столбцы, используемые многомерной агрегацией запроса.

**Пример**:

Определение материализованного представления:

```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice) AS sum_total,
       max(o_totalprice) AS max_total,
       min(o_totalprice) AS min_total,
       count(*) AS count_all
FROM orders
GROUP BY
    o_orderstatus, o_orderdate, o_orderpriority;
```

Следующий запрос может использовать материализованное представление, повторно используя результаты агрегации и сокращая объём вычислений:

```sql
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice),
       max(o_totalprice),
       min(o_totalprice),
       count(*)
FROM orders
GROUP BY
    GROUPING SETS ((o_orderstatus, o_orderdate), (o_orderpriority), (o_orderstatus), ());
```

#### 2.2.7 Переписывание с компенсацией разделов {#227-partition-compensation-rewrite}

**Сценарий применения**: если материализованное представление с разделами не может предоставить все необходимые запросу данные, используйте `UNION ALL`, чтобы объединить данные исходных базовых таблиц и материализованного представления в итоговый результат.

**Пример**:

Определение материализованного представления:

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

Если в базовую таблицу добавлен новый раздел `2023-10-21`, а материализованное представление ещё не обновлено, результат можно получить, объединив материализованное представление с исходными таблицами через `UNION ALL`.

```sql
INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

Инструкция запроса:

```sql
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

Запрос может частично использовать сохранённые результаты предварительных вычислений, избегая соответствующих вычислений.

Пример результата переписывания:

```sql
SELECT *
FROM mv7
UNION ALL
SELECT t1.l_shipdate, o_orderdate, t1.l_partkey, t1.l_suppkey, sum(o_totalprice) AS sum_total
FROM (SELECT * FROM lineitem WHERE l_shipdate = '2023-10-21') t1
LEFT JOIN orders ON t1.l_orderkey = orders.o_orderkey AND t1.l_shipdate = o_orderdate
GROUP BY
    t1.l_shipdate,
    o_orderdate,
    t1.l_partkey,
    t1.l_suppkey;
```

:::caution Внимание
Компенсация разделов уже поддерживается, но компенсация условий с помощью `UNION ALL` пока не поддерживается.

Например, если материализованное представление построено с условием фильтрации `WHERE l_shipdate > '2023-10-19'`, а условие запроса — `WHERE l_shipdate > '2023-10-18'`, такой случай пока нельзя компенсировать через `UNION ALL`. Поддержка запланирована.
:::

:::info Примечание
Начиная с версии 3.1.0 переписывание с компенсацией разделов поддерживает следующие типы таблиц с разделами: внутренние таблицы, Hive, Iceberg и Paimon. Переписывание с компенсацией разделов запускается только тогда, когда материализованное представление с разделами построено на основе таблицы с разделами одного из этих типов.
:::

#### 2.2.8 Переписывание с использованием вложенных материализованных представлений {#228-nested-materialized-view-rewrite}

**Определение**: SQL-определение материализованного представления может использовать другие материализованные представления. Такое представление называется вложенным материализованным представлением. Теоретически число уровней вложенности не ограничено. К вложенным материализованным представлениям можно обращаться напрямую, а также использовать их в прозрачном переписывании.

**Сценарии применения**: обычно используются для моделирования данных и сложных запросов. Если одно материализованное представление не позволяет выполнить прозрачное переписывание, можно разбить сложный запрос на части и построить вложенные материализованные представления.

**Пример**:

Создайте внутреннее материализованное представление `mv8_0_inner_mv`:

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

Создайте внешнее материализованное представление `mv8_0`:

```sql
CREATE MATERIALIZED VIEW mv8_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey,
    ps_availqty
FROM mv8_0_inner_mv
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```

Следующий запрос можно успешно переписать с использованием как `mv8_0_inner_mv`, так и `mv8_0`, а модель стоимости в итоге выбирает `mv8_0`:

```sql
SELECT lineitem.l_linenumber
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey
WHERE o_orderstatus = 'o';
```

:::caution Внимание
- Чем больше уровней вложенности у материализованного представления, тем дольше выполняется прозрачное переписывание. Рекомендуется ограничить глубину вложенности 3 уровнями.
- Прозрачное переписывание с использованием вложенных материализованных представлений по умолчанию отключено. О том, как его включить, см. [3.11 Связанные настройки](#311-related-configuration).
:::

#### 2.2.9 Использование материализованного представления без агрегации для агрегирующего запроса {#229-aggregation-query-hits-a-non-aggregation-materialized-view}

Если запрос содержит агрегацию, а материализованное представление не содержит её, но может предоставить все используемые запросом столбцы, переписывание всё равно возможно. Например, если запрос сначала выполняет JOIN, а затем агрегацию с помощью `GROUP BY`, полезно использовать материализованное представление, содержащее этот JOIN.

```sql
CREATE MATERIALIZED VIEW mv10_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, o_totalprice
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate;
```

Следующий запрос может использовать `mv10_0`, избегая вычисления `lineitem JOIN orders`:

```sql
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

#### 2.2.10 Переписывание оконных функций {#2210-window-function-rewrite}

Если и запрос, и материализованное представление содержат оконные функции, определения которых полностью совпадают, можно применить прозрачное переписывание. Оно позволяет повторно использовать предварительно вычисленные результаты оконных функций из материализованного представления и значительно повышает производительность запросов со сложными оконными вычислениями. **В настоящее время прозрачное переписывание поддерживается для всех оконных функций.**

**Пример 1**:

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT *
FROM (
    SELECT
        o_orderkey,
        FIRST_VALUE(o_custkey) OVER (
            PARTITION BY o_orderdate
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS first_value,
        RANK() OVER (
            PARTITION BY o_orderdate, o_orderstatus
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rank_value
    FROM orders
) t
WHERE o_orderkey > 1;
```

Следующий запрос может использовать `mv11_0`, избегая вычисления оконных функций. Хотя условие запроса `o_orderkey > 2` отличается от условия материализованного представления, переписывание всё равно возможно:

```sql
SELECT *
FROM (
    SELECT
        o_orderkey,
        FIRST_VALUE(o_custkey) OVER (
            PARTITION BY o_orderdate
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS first_value,
        RANK() OVER (
            PARTITION BY o_orderdate, o_orderstatus
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rank_value
    FROM orders
) t
WHERE o_orderkey > 2;
```

**Пример 2**:

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderkey,
    o_orderdate,
    FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
    RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
FROM orders
WHERE o_orderdate > '2023-12-09';
```

Следующий запрос может использовать `mv11_1`, избегая вычисления оконных функций. Поскольку `o_orderdate` является полем `PARTITION BY` оконной функции, прозрачное переписывание возможно, даже несмотря на то, что условие запроса `o_orderdate > '2023-12-10'` вычисляется до выполнения оконной функции:

```sql
SELECT
    o_orderdate,
    FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
    RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
FROM orders
WHERE o_orderdate > '2023-12-10';
```

:::tip Совет
В примере используется одна таблица, но переписывание оконных функций применимо и к сценариям с JOIN нескольких таблиц.
:::

#### 2.2.11 Переписывание Limit и TopN {#2211-limit-and-topn-rewrite}

Если запрос содержит предложение `ORDER BY` или `LIMIT` (то есть является запросом Top-N), а материализованное представление может предоставить достаточно данных для выполнения требований `ORDER BY` и `LIMIT` запроса, оптимизатор может использовать материализованное представление для прозрачного переписывания. Это значительно ускоряет распространённые аналитические сценарии Top-N.

**Условия переписывания**:

| Проверяемый элемент | Правило проверки |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORDER BY   | Предложение `ORDER BY` запроса должно быть совместимо с предложением `ORDER BY` материализованного представления или совпадать с ним. |
| LIMIT      | Если в материализованном представлении нет `LIMIT`, попытка переписывания возможна для любого запроса с `LIMIT`.<br/>Если материализованное представление содержит `LIMIT N`, значение `LIMIT M` запроса должно удовлетворять условию `M <= N`.<br/>Если материализованное представление содержит `LIMIT N OFFSET L`, значения `LIMIT M OFFSET O` запроса должны удовлетворять условиям `O >= L` и `M + O <= N + L`. |
| Условия WHERE | Остальные условия `WHERE` материализованного представления и запроса должны совпадать. |

**Пример 1**:

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 8 OFFSET 1;
```

Следующий запрос может использовать `mv11_0` и удовлетворяет условиям проверки:

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

Следующий запрос не может использовать `mv11_0`, поскольку содержит дополнительное условие `o_orderdate > '2023-12-08'`. Если бы материализованное представление `mv11_0` также содержало это условие `WHERE`, запрос мог бы его использовать:

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

**Пример 2**:

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey,
    o_orderkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 4 OFFSET 2;
```

Сочетание `ORDER BY + LIMIT` в следующем запросе преобразуется в TopN, который может использовать `mv11_1` и удовлетворяет условиям проверки:

```sql
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 2 OFFSET 3;
```

### 2.3 Проверка прозрачного переписывания (Explain) {#23-inspect-transparent-rewrite-explain}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Debugging why a query did not hit the materialized view -->

#### 2.3.1 Краткая информация: EXPLAIN {#231-brief-view-explain}

Чтобы просмотреть краткую информацию о процессе прозрачного переписывания с использованием материализованных представлений:

```sql
EXPLAIN <query_sql>
```

Возвращаемая информация (фрагмент, относящийся к материализованным представлениям):

```text
| MaterializedView                                                              |
| MaterializedViewRewriteSuccessAndChose:                                       |
|   Names: mv5                                                                  |
| MaterializedViewRewriteSuccessButNotChose:                                    |
|                                                                               |
| MaterializedViewRewriteFail:                                                  |
|   Name: mv4                                                                   |
|   FailSummary: Match mode is invalid, View struct info is invalid             |
|   Name: mv3                                                                   |
|   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid |
|   Name: mv1                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
|   Name: mv2                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
```

Значение полей:

- **`MaterializedViewRewriteSuccessAndChose`**: список имён материализованных представлений, для которых прозрачное переписывание выполнено успешно и которые выбрал CBO (оптимизатор на основе стоимости).
- **`MaterializedViewRewriteSuccessButNotChose`**: список имён материализованных представлений, для которых прозрачное переписывание выполнено успешно, но которые CBO в итоге не выбрал.
- **`MaterializedViewRewriteFail`**: материализованные представления, для которых прозрачное переписывание не удалось, с кратким описанием причин.

#### 2.3.2 Подробная информация: EXPLAIN MEMO PLAN {#232-detailed-view-explain-memo-plan}

Чтобы подробно изучить процесс подбора материализованных представлений, переписывания и окончательного выбора:

```sql
EXPLAIN MEMO PLAN <query_sql>
```

---

## 3. Обслуживание материализованных представлений {#3-maintain-materialized-views}

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Day-to-day operations and management of materialized views -->

### 3.1 Права доступа {#31-permissions}

| Операция | Необходимое право |
| ----------------------------- | ------------------------- |
| Удаление материализованного представления | Право на удаление материализованного представления (такое же, как для удаления таблицы). |
| Изменение материализованного представления | Право на изменение материализованного представления (такое же, как для изменения таблицы). |
| Приостановка / возобновление / отмена / обновление материализованного представления | Право на создание материализованного представления. |

### 3.2 Изменение материализованного представления {#32-modify-a-materialized-view}

#### 3.2.1 Изменение свойств материализованного представления {#321-modify-materialized-view-properties}

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
    "grace_period" = "10"
);
```

#### 3.2.2 Атомарная замена материализованного представления (переименование) {#322-atomic-replacement-of-a-materialized-view-rename}

Сначала создайте новое материализованное представление для замены:

```sql
CREATE MATERIALIZED VIEW mv9_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

Замените `mv7` на `mv9_0` и удалите `mv7`:

```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```

### 3.3 Удаление материализованного представления {#33-drop-a-materialized-view}

```sql
DROP MATERIALIZED VIEW mv_1;
```

Подробности см. в разделе [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW).

### 3.4 Просмотр инструкции создания материализованного представления {#34-view-the-creation-statement-of-a-materialized-view}

```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

Подробности см. в разделе [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW).

### 3.5 Приостановка / включение / отмена обновления {#35-pause--enable--cancel-a-refresh}

| Операция | Справочная документация |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Приостановить материализованное представление | [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB) |
| Включить материализованное представление | [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB) |
| Отменить задачу обновления материализованного представления | [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK) |

### 3.6 Получение информации о материализованном представлении {#36-query-materialized-view-information}

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G
```

Пример возвращаемого результата:

```text
*************************** 1. row ***************************
                Id: 139570
              Name: mv11
           JobName: inner_mtmv_139570
             State: NORMAL
SchemaChangeDetail:
      RefreshState: SUCCESS
       RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON MANUAL
          QuerySql: SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE
           EnvInfo: EnvInfo{ctlId='0', dbId='16813'}
      MvProperties: {}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=lineitem, relatedCol='l_shipdate', partitionCol='l_shipdate'}
SyncWithBaseTables: 1
```

**Описание основных полей**:

- **`SyncWithBaseTables`**: согласованы ли данные материализованного представления с базовыми таблицами.
    - Для материализованного представления с полным построением значение `1` означает, что его можно использовать для прозрачного переписывания.
    - Для материализованного представления с инкрементальным обновлением по разделам оценка выполняется на уровне разделов. Даже если некоторые разделы недоступны, материализованное представление всё ещё можно использовать для прозрачного переписывания, если разделы, к которым обращается запрос, действительны. Возможность прозрачного переписывания главным образом зависит от поля `SyncWithBaseTables` разделов, используемых запросом: `1` означает доступность, `0` — недоступность.
- **`JobName`**: имя задания построения материализованного представления. У каждого материализованного представления есть одно задание, а при каждом обновлении создаётся новая задача; отношение между заданием и задачами — 1:n.
- **`State`**: значение `SCHEMA_CHANGE` означает, что схема базовой таблицы изменилась. В этом случае материализованное представление нельзя использовать для прозрачного переписывания (прямые запросы не затрагиваются). После следующего успешного обновления состояние вернётся к `NORMAL`.
- **`SchemaChangeDetail`**: указывает причину перехода в состояние `SCHEMA_CHANGE`.
- **`RefreshState`**: состояние обновления последней задачи материализованного представления. Если значение равно `FAIL`, для уточнения причины ошибки можно использовать команду `tasks()` (см. [3.7 Получение информации о задаче обновления (TASK)](#37-query-refresh-task-task-information)).

**Состояние прозрачного переписывания**:

- **Нормальное состояние**: материализованное представление в данный момент доступно для прозрачного переписывания.
- **Ненормальное / недоступное состояние**: материализованное представление нельзя использовать для прозрачного переписывания, но прямые запросы по-прежнему возможны.

Подробности см. в разделе [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos).

### 3.7 Получение информации о задаче обновления (TASK) {#37-query-refresh-task-task-information}

У каждого материализованного представления есть одно задание, а при каждом обновлении создаётся новая задача; отношение между заданием и задачами — 1:n. Чтобы просмотреть состояние задач по имени материализованного представления:

```sql
SELECT *
FROM tasks("type"="mv")
WHERE
    MvDatabaseName = 'mv_db_name' AND
    mvName = 'mv_name'
ORDER BY CreateTime DESC \G
```

Пример возвращаемого результата:

```text
*************************** 1. row ***************************
               TaskId: 167019363907545
                JobId: 139872
              JobName: inner_mtmv_139570
                 MvId: 139570
               MvName: mv11
         MvDatabaseId: 16813
       MvDatabaseName: regression_test_nereids_rules_p0_mv
               Status: SUCCESS
             ErrorMsg:
           CreateTime: 2024-06-21 10:31:43
            StartTime: 2024-06-21 10:31:43
           FinishTime: 2024-06-21 10:31:45
           DurationMs: 2466
          TaskContext: {"triggerMode":"SYSTEM","isComplete":false}
          RefreshMode: COMPLETE
NeedRefreshPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
  CompletedPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
             Progress: 100.00% (15/15)
          LastQueryId: fe700ca3d6504521-bb522fc9ccf615e3
```

**Описание основных полей**:

- **`NeedRefreshPartitions` / `CompletedPartitions`**: разделы, которые задача должна обновить, и разделы, которые уже обновлены.
- **`Status`**: значение `FAILED` означает неудачное выполнение. Причину можно посмотреть в `ErrorMsg`, а подробную информацию — найти в журналах Doris по `LastQueryId`. В настоящее время сбой задачи делает существующее материализованное представление недоступным. В будущем это поведение изменится: даже при сбое задачи существующее материализованное представление останется доступным для прозрачного переписывания.
- **`ErrorMsg`**: причина ошибки.
- **`RefreshMode`**:
    - `COMPLETE`: обновлены все разделы.
    - `PARTIAL`: обновлена часть разделов.
    - `NOT_REFRESH`: нет разделов, требующих обновления.

:::info Примечание
- По умолчанию сохраняется и отображается 100 задач. Это количество можно изменить с помощью `max_persistence_task_count` в `fe.conf`. При превышении этого количества старые записи о задачах удаляются; если значение меньше 1, сохранение не выполняется. Настройка вступает в силу только после перезапуска FE.
- Если при создании материализованного представления задано свойство `grace_period`, в некоторых случаях его всё ещё можно использовать для прозрачного переписывания, даже когда `SyncWithBaseTables` равно `false` или `0`.
- Единица измерения `grace_period` — секунды. Свойство задаёт допустимое отставание данных материализованного представления от данных базовой таблицы.
    - Значение `0`: для прозрачного переписывания данные материализованного представления должны полностью соответствовать данным базовой таблицы.
    - Значение `10`: допускается задержка в 10 секунд; в пределах 10 секунд материализованное представление можно использовать для прозрачного переписывания.
:::

Подробности см. в разделе [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks).

### 3.8 Получение задания JOB, соответствующего материализованному представлению {#38-query-the-job-corresponding-to-a-materialized-view}

```sql
SELECT *
FROM jobs("type"="mv")
WHERE Name = "inner_mtmv_75043";
```

Подробности см. в разделе [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs).

### 3.9 Получение информации о разделах материализованного представления {#39-query-materialized-view-partition-information}

Для материализованного представления с разделами используйте `SHOW PARTITIONS`, чтобы просмотреть состояние `SyncWithBaseTables`:

```sql
SHOW PARTITIONS FROM mv_name;
```

Пример возвращаемого результата:

```Plain
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

Основное поле для проверки — `SyncWithBaseTables`: `true` означает, что раздел можно использовать для прозрачного переписывания, а `false` — что нельзя.

Подробности см. в разделе [SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS).

### 3.10 Просмотр схемы материализованного представления {#310-view-the-schema-of-a-materialized-view}

Подробности см. в разделе [DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE).

### 3.11 Связанные настройки {#311-related-configuration}

<!-- Knowledge type: Reference documentation -->
<!-- Applicable scenarios: Tuning materialized view transparent rewrite behavior -->

#### 3.11.1 Переключатели переменных сеанса {#3111-session-variable-switches}

| Переключатель | Описание |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SET enable_nereids_planner = true;`                                           | Асинхронные материализованные представления поддерживаются только новым оптимизатором. Включите этот переключатель, если прозрачное переписывание не работает. |
| `SET enable_materialized_view_rewrite = true;`                                 | Включает или отключает прозрачное переписывание запросов. Включено по умолчанию начиная с версии 2.1.5. |
| `SET materialized_view_rewrite_enable_contain_external_table = true;`          | Определяет, могут ли материализованные представления, участвующие в прозрачном переписывании, содержать внешние таблицы. По умолчанию запрещено. Если SQL-определение материализованного представления содержит внешние таблицы и вы хотите использовать его для прозрачного переписывания, включите этот переключатель. |
| `SET materialized_view_rewrite_success_candidate_num = 3;`                     | Максимальное количество успешно переписанных вариантов, допускаемых к рассмотрению CBO. По умолчанию 3. Если прозрачное переписывание выполняется медленно, уменьшите это значение. |
| `SET enable_materialized_view_union_rewrite = true;`                           | Определяет, разрешено ли объединять базовую таблицу и материализованное представление через `UNION ALL` для выполнения запроса, если материализованное представление с разделами не может предоставить все необходимые данные. По умолчанию разрешено. Отключите этот переключатель, если обнаружите ошибки в данных при использовании материализованного представления. |
| `SET enable_materialized_view_nest_rewrite = true;`                            | Определяет, разрешено ли переписывание с использованием вложенных представлений. По умолчанию запрещено. Включите его, если SQL-запрос сложен и для его переписывания требуется построить вложенные материализованные представления. |
| `SET materialized_view_relation_mapping_max_count = 8;`                        | Максимальное количество сопоставлений отношений, допустимых при прозрачном переписывании. Сопоставления сверх этого предела отбрасываются. Обычно такие сопоставления возникают при соединении таблиц с самими собой, а их количество определяется декартовым произведением (например, 3 таблицы могут дать 8 комбинаций). По умолчанию 8. Если прозрачное переписывание выполняется медленно, уменьшите это значение. |
| `SET enable_dml_materialized_view_rewrite = true;`                             | Определяет, включено ли прозрачное переписывание с использованием материализованных представлений на основе информации о структуре при выполнении DML. По умолчанию включено. |
| `SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;` | Определяет, включено ли прозрачное переписывание на основе информации о структуре при выполнении DML, если материализованное представление содержит внешние таблицы, изменения данных которых невозможно обнаружить в реальном времени. По умолчанию отключено. |

#### 3.11.2 Настройки fe.conf {#3112-feconf-configuration}

| Параметр настройки | Описание |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `job_mtmv_task_consumer_thread_num` | Управляет количеством задач обновления материализованных представлений, которые могут выполняться одновременно. По умолчанию 10; задачи сверх этого количества переходят в состояние ожидания. Для изменения значения требуется перезапуск FE. |
