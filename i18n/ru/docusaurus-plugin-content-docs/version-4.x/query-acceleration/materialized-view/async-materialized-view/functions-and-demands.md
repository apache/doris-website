---
{
    "title": "Управление асинхронными материализованными представлениями и выполнение запросов к ним",
    "language": "ru",
    "description": "Как создавать асинхронные материализованные представления в Doris и ускорять запросы с помощью прямых запросов и прозрачного переписывания. В статье рассматриваются политики обновления, настройка секционирования и эксплуатация.",
    "keywords": ["асинхронное материализованное представление Doris", "CREATE MATERIALIZED VIEW", "прозрачное переписывание запросов", "обновление материализованного представления", "секционированное материализованное представление", "вложенное материализованное представление"]
}
---

<!-- Knowledge type: Operations manual + Reference documentation -->
<!-- Applicable scenarios: Use Doris async materialized views to accelerate queries, build data models, and operate and manage materialized views -->

Асинхронные материализованные представления позволяют ускорять запросы в Doris за счёт предварительных вычислений. Статья следует обычному рабочему процессу пользователя и последовательно рассматривает следующие темы:

- **Создание материализованных представлений**: синтаксис, политики обновления и настройка секционирования.
- **Запросы к материализованным представлениям**: прямые запросы и прозрачное переписывание запросов.
- **Эксплуатация материализованных представлений**: изменение, удаление, мониторинг и настройка соответствующих параметров.

Перед чтением убедитесь, что:

- Вы понимаете основные понятия и сценарии применения асинхронных материализованных представлений.
- Новый оптимизатор включён (`enable_nereids_planner = true`).
- Вы знакомы с основами создания таблиц и синтаксисом SQL.

---

## 1. Создание материализованных представлений {#1-create-materialized-views}

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building an async materialized view for the first time -->

### 1.1 Права доступа {#11-permissions}

Для создания материализованного представления необходимы два типа прав:

- **Право на создание материализованного представления**: такое же, как право на создание таблицы.
- **Право на запросы к базовым таблицам**: такое же, как право SELECT (то есть право выполнять запросы к базовым таблицам, на которые ссылается SQL-определение материализованного представления).

### 1.2 Синтаксис создания {#12-creation-syntax}

Полный синтаксис создания асинхронного материализованного представления:

```sql
CREATE MATERIALIZED VIEW
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ]
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [refresh_trigger]]
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
| Момент обновления | `IMMEDIATE`   | Обновление сразу после создания (по умолчанию). |
| Момент обновления | `DEFERRED`    | Отложенное обновление после создания. |
| Метод обновления | `COMPLETE`    | Полное обновление всех секций. |
| Метод обновления | `AUTO`        | Инкрементальное обновление, когда это возможно; переход к полному обновлению, если изменения обнаружить невозможно. |
| Способ запуска | `ON MANUAL`   | Пользователь запускает обновление вручную с помощью операторов SQL. |
| Способ запуска | `ON SCHEDULE` | Периодический запуск с указанным интервалом. |
| Способ запуска | `ON COMMIT`   | Автоматический запуск при изменении данных базовой таблицы (поддерживается начиная с Apache Doris 2.1.4). |

#### 1.3.2 ON MANUAL: запуск вручную {#132-on-manual-manual-trigger}

Обновление материализованного представления запускается оператором SQL. Доступны три стратегии:

**Стратегия 1**: проверить, изменились ли данные секций базовой таблицы с момента последнего обновления, и обновить только изменившиеся секции.

```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```

:::tip Совет
- Если базовая таблица, на которую ссылается SQL-определение материализованного представления, является таблицей JDBC, Doris не может обнаружить изменения её данных, поэтому при обновлении необходимо указать `COMPLETE`. В противном случае может возникнуть ситуация, когда базовая таблица содержит данные, а материализованное представление нет.
- В настоящее время Doris может обнаруживать изменения данных только во внутренних таблицах и таблицах источника данных Hive. Поддержка других источников данных добавляется постепенно.
:::

**Стратегия 2**: пропустить проверку изменений данных секций базовой таблицы и сразу обновить все секции материализованного представления.

```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```

**Стратегия 3**: обновить только указанные секции.

```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1, partitionName2);
```

:::tip Совет
- Значение `partitionName` можно получить с помощью `SHOW PARTITIONS FROM mvName`.
- Обнаружение изменений данных секций базовых таблиц Hive поддерживается начиная с версии 2.1.3. Другие внешние таблицы пока не поддерживаются, а внутренние таблицы поддерживаются всегда.
:::

#### 1.3.3 ON SCHEDULE: периодический запуск {#133-on-schedule-periodic-trigger}

Укажите интервал обновления в операторе создания. Параметр `refreshUnit` может принимать значения `minute`, `hour`, `day`, `week` и другие.

**Пример 1**: полное обновление (`REFRESH COMPLETE`), все секции обновляются каждые 10 часов.

```sql
CREATE MATERIALIZED VIEW mv_6
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
AS
SELECT * FROM lineitem;
```

**Пример 2**: инкрементальное обновление, когда это возможно (`REFRESH AUTO`), с запуском каждые 10 часов. Обновляются только секции с изменившимися данными; если инкрементальное обновление невозможно, выполняется полное обновление.

```sql
CREATE MATERIALIZED VIEW mv_7
REFRESH AUTO ON SCHEDULE EVERY 10 hour
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

:::tip Совет
Начиная с версии 2.1.3 Doris может автоматически определять секции таблиц Hive, которые необходимо обновить.
:::

#### 1.3.4 ON COMMIT: автоматический запуск {#134-on-commit-automatic-trigger}

:::tip Совет
Эта возможность поддерживается начиная с Apache Doris 2.1.4.
:::

После изменения данных базовой таблицы автоматически запускается обновление соответствующего материализованного представления. Набор обновляемых секций определяется так же, как при периодическом запуске.

```sql
CREATE MATERIALIZED VIEW mv_8
REFRESH AUTO ON COMMIT
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

Когда данные в секции `t1` базовой таблицы `lineitem` изменяются, автоматически запускается обновление соответствующей секции материализованного представления.

:::caution Внимание
Если данные базовой таблицы меняются часто, этот способ запуска не рекомендуется: задачи обновления будут создаваться слишком часто и потреблять чрезмерное количество ресурсов.
:::

Подробнее см. [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW).

#### 1.3.5 Полные примеры {#135-complete-examples}

Следующие полные примеры демонстрируют механизм обновления. Сначала создайте базовые таблицы и заполните их начальными данными:

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

Обновление выполняется сразу после создания (`BUILD IMMEDIATE`), метод обновления предусматривает инкрементальное обновление, когда это возможно (`REFRESH AUTO`), а запуск выполняется вручную (`ON MANUAL`). У полного материализованного представления без секционирования есть только одна секция, поэтому любое изменение данных базовой таблицы приводит к полному обновлению.

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

Обновление откладывается (`BUILD DEFERRED`), используется полное обновление (`REFRESH COMPLETE`), первое обновление назначено на `2024-12-01 20:30:00`, а затем выполняется раз в день.

:::tip Совет
Время, указанное в `STARTS`, должно быть позже текущего времени. Если задано `BUILD IMMEDIATE`, сразу после создания выполняется одно обновление, а затем обновления выполняются раз в день начиная с `2024-12-01 20:30:00`.
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

Обновление выполняется немедленно (`BUILD IMMEDIATE`), используется полное обновление (`REFRESH COMPLETE`), а запуск выполняется автоматически (`ON COMMIT`). Изменение данных в любой из таблиц `orders` или `lineitem` автоматически запускает обновление.

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

### 1.4 Настройка секционирования {#14-partition-configuration}

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building partitioned materialized views and accelerating partition-grained queries -->

При создании секционированного материализованного представления необходимо указать `PARTITION BY`. **Выражение, на которое ссылается столбец секционирования, может использовать только функцию `date_trunc` и идентификаторы.**

#### 1.4.1 Пример допустимого столбца секционирования {#141-valid-partition-column-example}

Столбец, на который ссылается столбец секционирования, использует только функцию `date_trunc`. Для секционированного материализованного представления обычно используется метод обновления `AUTO`.

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

#### 1.4.2 Пример недопустимого столбца секционирования {#142-invalid-partition-column-example}

Следующий оператор не сможет создать материализованное представление, поскольку столбец секционирования использует функцию `date_add()`.

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

#### 1.4.3 Секционирование базовой таблицы по нескольким столбцам {#143-multi-column-partitioning-of-the-base-table}

В настоящее время секционирование по нескольким столбцам поддерживается только для внешних таблиц Hive. Например, если секционирование первого уровня выполняется по дате, а второго уровня по региону, материализованное представление может выбрать столбец секционирования любого уровня в качестве собственного столбца секционирования.

Оператор создания таблицы Hive:

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

**Сценарий 1: использовать `year` в качестве столбца секционирования.** Материализованное представление `mv_hive` будет содержать три секции: `('2020')`, `('2021')` и `('2022')`.

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

**Сценарий 2: использовать `region` в качестве столбца секционирования.** Материализованное представление `mv_hive2` будет содержать две секции: `('bj')` и `('sh')`.

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

#### 1.4.4 Использование только части секций базовой таблицы {#144-use-only-a-subset-of-base-table-partitions}

Сценарий применения: базовая таблица содержит много секций, но материализованному представлению нужны только недавние «горячие» данные.

Оператор создания базовой таблицы:

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

Материализованное представление синхронизирует данные только за последний день. Если текущее время — `2024-03-28 xx:xx:xx`, материализованное представление будет содержать только одну секцию `[("2024-03-28"),("2024-03-29")]`.

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

Через день, когда наступит `2024-03-29 xx:xx:xx`, в `t1` добавляется новая секция `[("2024-03-29"),("2024-03-30")]`. После обновления материализованное представление будет содержать только одну секцию `[("2024-03-29"),("2024-03-30")]`.

:::tip Совет
Если столбец секционирования имеет строковый тип, можно задать свойство материализованного представления `partition_date_format`, например `%Y-%m-%d`.
:::

#### 1.4.5 Укрупнение секций {#145-partition-roll-up}

:::tip Совет
Секционирование по диапазонам поддерживается начиная с Doris 2.1.5.
:::

**Сценарий применения**: после агрегирования данных базовой таблицы объём данных в каждой секции значительно уменьшается. Укрупнение секций сокращает количество секций в материализованном представлении.

Оператор создания базовой таблицы:

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

**Укрупнение до месяца**: материализованное представление содержит две секции: `[("2020-01-01","2020-02-01")]` и `[("2020-02-01","2020-03-01")]`.

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

**Укрупнение до года**: материализованное представление содержит только одну секцию: `[("2020-01-01","2021-01-01")]`.

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

:::tip Совет
Если столбец секционирования имеет строковый тип, формат даты можно указать с помощью свойства `partition_date_format`, например `'%Y-%m-%d'`.
:::

Подробнее см. [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW).

#### 1.4.6 Обновление секций по нескольким источникам {#146-multi-source-partition-refresh}

**Определение**: асинхронное материализованное представление может отслеживать секции нескольких таблиц. Это означает, что при изменении данных любой из этих таблиц выполняется обновление секций материализованного представления, а не его полное обновление.

**Ограничения**:

- Поддерживаются только материализованные представления, построенные на основе `INNER JOIN` или `UNION` (включая `UNION ALL`).
- Если материализованное представление использует `UNION`, каждая часть объединения должна поддерживать отслеживание изменений секций (PCT). Например, если материализованное представление определено как `q1 union all q2`, то и `q1`, и `q2` при самостоятельном использовании для создания материализованного представления должны поддерживать обновление секций, а порядок полученных столбцов секционирования должен совпадать.
- Границы секций в нескольких таблицах PCT должны быть согласованы:

    **Допустимый пример**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)
    Partitions of base table t2: [2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)
    ```

    Наборы секций базовых таблиц совпадают не полностью, но их границы не пересекаются.

    **Недопустимый пример**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)
    Partitions of base table t2: [2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)
    ```

    Секции `[2020-01-01, 2020-01-03)` и `[2020-01-01, 2020-01-02)` пересекаются, но не совпадают.

### 1.5 Примечания к SQL-определению {#15-sql-definition-notes}

Асинхронные материализованные представления можно создавать на основе внутренних представлений (View), но **создание на основе представлений из внешних источников данных не поддерживается**.

Учитывайте следующее:

- Если внутреннее представление, от которого зависит материализованное представление, изменено или пересоздано, данные асинхронного материализованного представления становятся несогласованными с базовой таблицей. Данные в материализованном представлении сохраняются, но его нельзя использовать для прозрачного переписывания запросов.
- Если изменение структуры затрагивает таблицу или столбец, по которым асинхронное материализованное представление отслеживает секции, либо меняет его схему, обновить материализованное представление не удастся.
- Если изменение не затрагивает перечисленные элементы, после обновления материализованное представление снова можно использовать в обычном режиме.

---

## 2. Запросы к материализованным представлениям {#2-query-materialized-views}

Начиная с версии 4.1.5 запросы к историческим снимкам и запросы Time Travel к внешним таблицам исключаются из прозрачного переписывания с использованием текущих данных материализованного представления, чтобы запрос читал запрошенный снимок. Это ограничение не влияет на переписывание запросов к текущим данным.

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Use materialized views to accelerate queries -->

Существует два способа выполнения запросов к материализованным представлениям: **прямой запрос** и **прозрачное переписывание запроса**.

| Способ выполнения запроса | Требуется изменение исходного запроса | Сценарии применения |
| ------------ | ------------------ | ---------------------------------------------- |
| Прямой запрос | Да | Вы знаете о существовании материализованного представления и хотите явно использовать результаты его предварительных вычислений. |
| Прозрачное переписывание | Нет | Вы хотите использовать материализованные представления для ускорения запросов незаметно для пользователей. |

### 2.1 Прямые запросы к материализованным представлениям {#21-direct-query-of-materialized-views}

Материализованное представление можно рассматривать как таблицу и выполнять к нему прямые запросы с условиями фильтрации, агрегированием и другими операциями.

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

**Прозрачное переписывание** означает, что система автоматически оптимизирует и переписывает запрос при обработке, без необходимости изменять его вручную. Асинхронные материализованные представления Doris используют алгоритм прозрачного переписывания на основе шаблона SPJG (SELECT-PROJECT-JOIN-GROUP-BY). Алгоритм анализирует структуру SQL, автоматически находит подходящие материализованные представления и выбирает оптимальный вариант для выполнения запроса.

Следующая таблица обобщает возможности прозрачного переписывания, поддерживаемые Doris:

| Возможность переписывания | Сценарии применения |
| ------------------ | ------------------------------------------------------------- |
| Компенсация предикатов | Условия `WHERE` запроса и материализованного представления не полностью совпадают. |
| Переписывание JOIN | Запрос и материализованное представление используют одинаковые таблицы и одинаковый тип JOIN. |
| Преобразование типа JOIN | Типы JOIN в запросе и материализованном представлении различаются, но материализованное представление может предоставить достаточно данных. |
| Переписывание агрегирования | Измерения группировки запроса и материализованного представления совпадают. |
| Переписывание агрегирования с доагрегированием | Измерения материализованного представления включают измерения запроса, а агрегатные функции запроса можно выразить через функции материализованного представления. |
| Переписывание многомерного агрегирования | Материализованное представление не использует `GROUPING SETS`/`CUBE`/`ROLLUP`, но запрос содержит многомерное агрегирование. |
| Переписывание с компенсацией секций | Если секционированное материализованное представление не может предоставить все данные для запроса, выполняется `UNION ALL` с базовой таблицей. |
| Переписывание с использованием вложенных материализованных представлений | Материализованное представление построено на основе другого материализованного представления. |
| Использование представления без агрегирования для агрегирующего запроса | Запрос выполняет агрегирование, а материализованное представление не содержит агрегирования, но может предоставить все необходимые столбцы. |
| Переписывание оконных функций | И запрос, и материализованное представление содержат оконные функции, определения которых полностью совпадают. |
| Переписывание Limit / TopN | Запрос содержит `ORDER BY` или `LIMIT`, и материализованное представление удовлетворяет требованиям. |

#### 2.2.1 Компенсация предикатов {#221-predicate-compensation}

Условия запроса и материализованного представления не обязаны совпадать. Добавляя недостающие предикаты поверх материализованного представления, можно выразить исходный запрос и максимально широко использовать одно и то же представление.

Если условия `WHERE` материализованного представления и запроса являются выражениями, соединёнными через `AND`, возможны два случая:

**Случай 1: выражение запроса содержит выражение материализованного представления**. Можно применить компенсацию предикатов.

Например, если условие запроса — `a > 5 AND b > 10 AND c = 7`, а условие материализованного представления — `a > 5 AND b > 10`, то условие материализованного представления является подмножеством условия запроса и достаточно добавить условие `c = 7`.

**Случай 2: выражение запроса не полностью содержит выражение материализованного представления**. Если из условия запроса можно вывести условие материализованного представления (обычно это выражения сравнения и диапазона, такие как `>`, `<`, `=`, `IN`), компенсация предикатов также возможна. Добавляемым условием будет само условие запроса.

Например, если условие запроса — `a > 5 AND b = 10`, а условие материализованного представления — `a > 1 AND b > 8`, то условие материализованного представления охватывает условие запроса и допускает компенсацию; добавляемое условие — `a > 5 AND b = 10`.

**Ограничения компенсации предикатов**:

- Для выражений, соединённых через `OR`, компенсация предикатов не поддерживается; для успешного переписывания условия должны совпадать.
- Для выражений, не являющихся сравнением или проверкой диапазона, например `LIKE`, компенсация предикатов не поддерживается; для успешного переписывания условия должны совпадать.

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

Следующие запросы могут использовать это материализованное представление через прозрачное переписывание. Повторное использование одного представления сокращает время переписывания и затраты на построение:

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

**Сценарий применения**: запрос и материализованное представление используют одинаковые таблицы. Предложения `WHERE` могут находиться как во входных данных JOIN, так и за пределами JOIN, причём и в материализованном представлении, и в запросе. Оптимизатор пытается прозрачно переписать запросы такого вида.

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

Следующий запрос допускает прозрачное переписывание. Условие `l_linenumber > 1` можно поднять на уровень выше и выразить запрос через результаты предварительных вычислений материализованного представления. При использовании материализованного представления вычислять JOIN заново не требуется.

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

#### 2.2.3 Преобразование типа JOIN {#223-join-derivation}

Если типы JOIN в запросе и материализованном представлении различаются, прозрачное переписывание всё равно возможно, когда материализованное представление предоставляет все необходимые запросу данные. Для этого выполняется компенсация предикатов за пределами JOIN.

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

Оператор запроса:

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

#### 2.2.4 Переписывание агрегирования {#224-aggregation-rewrite}

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

Следующий запрос допускает прозрачное переписывание: измерения агрегирования совпадают, поле `o_shippriority` материализованного представления можно использовать для фильтрации результатов, а измерения GROUP BY и агрегатные функции можно переписать с использованием материализованного представления. Использование материализованного представления с агрегированием сокращает объём вычислений:

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

#### 2.2.5 Переписывание агрегирования с доагрегированием {#225-aggregation-rewrite-roll-up}

Переписывание возможно и тогда, когда измерения агрегирования не совпадают. Для этого должны выполняться следующие требования:

- Измерения `GROUP BY` материализованного представления должны включать измерения `GROUP BY` запроса. Запрос может не содержать `GROUP BY`.
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

Следующий запрос допускает прозрачное переписывание. Измерения материализованного представления включают измерения запроса, поэтому для доагрегирования используются функции из `SELECT` материализованного представления. Например, функция `bitmap_union` материализованного представления при доагрегировании преобразуется в `bitmap_union_count`, что семантически соответствует `count(distinct)` в запросе.

Доагрегирование позволяет повторно использовать одно материализованное представление в нескольких запросах и сокращает затраты на построение:

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

**Список агрегатных функций, поддерживающих доагрегирование**:

| Функция в запросе | Функция в материализованном представлении | Функция после доагрегирования |
| ------------------------------------------------------- | ------------------------------------------- | -------------------- |
| `max`                                                   | `max`                                       | `max`                |
| `min`                                                   | `min`                                       | `min`                |
| `sum`                                                   | `sum`                                       | `sum`                |
| `count`                                                 | `count`                                     | `sum`                |
| `count(distinct)`                                       | `bitmap_union`                              | `bitmap_union_count` |
| `bitmap_union`                                          | `bitmap_union`                              | `bitmap_union`       |
| `bitmap_union_count`                                    | `bitmap_union`                              | `bitmap_union_count` |
| `hll_union_agg`, `approx_count_distinct`, `hll_cardinality` | `hll_union` или `hll_raw_agg`            | `hll_union_agg`      |
| `any_value`                                             | `any_value` или столбец, на который ссылается `any_value` после SELECT | `any_value`          |

#### 2.2.6 Переписывание многомерного агрегирования {#226-multi-dimensional-aggregation-rewrite}

Прозрачное переписывание поддерживает многомерное агрегирование: материализованное представление не использует `GROUPING SETS`/`CUBE`/`ROLLUP`, запрос содержит многомерное агрегирование, а столбцы `GROUP BY` материализованного представления включают все столбцы, на которые ссылается многомерное агрегирование запроса.

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

Следующий запрос может использовать материализованное представление, повторно используя результаты агрегирования и сокращая объём вычислений:

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

#### 2.2.7 Переписывание с компенсацией секций {#227-partition-compensation-rewrite}

**Сценарий применения**: если секционированное материализованное представление не может предоставить все необходимые запросу данные, данные исходных базовых таблиц и материализованного представления объединяются с помощью `UNION ALL` в итоговый результат.

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

Если в базовую таблицу добавлена новая секция `2023-10-21`, а материализованное представление ещё не обновлено, результат можно получить, объединив материализованное представление с исходными таблицами через `UNION ALL`.

```sql
INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

Оператор запроса:

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

Запрос может частично использовать результаты предварительных вычислений материализованного представления, сокращая соответствующий объём вычислений.

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
Компенсация секций уже поддерживается, но компенсация условий с помощью `UNION ALL` пока недоступна.

Например, если материализованное представление создано с условием фильтрации `WHERE l_shipdate > '2023-10-19'`, а запрос содержит `WHERE l_shipdate > '2023-10-18'`, компенсировать различие через `UNION ALL` пока невозможно. Поддержка запланирована.
:::

:::info Примечание
Начиная с версии 3.1.0 переписывание с компенсацией секций поддерживает следующие типы секционированных таблиц: внутренние таблицы, Hive, Iceberg и Paimon. Переписывание с компенсацией секций применяется только тогда, когда секционированное материализованное представление построено на основе секционированной таблицы одного из этих типов.
:::

#### 2.2.8 Переписывание с использованием вложенных материализованных представлений {#228-nested-materialized-view-rewrite}

**Определение**: SQL-определение материализованного представления может использовать другие материализованные представления. Такое представление называется вложенным. Теоретически число уровней вложенности не ограничено. К вложенным материализованным представлениям можно выполнять прямые запросы; они также могут участвовать в прозрачном переписывании.

**Сценарии применения**: обычно используются для моделирования данных и сложных запросов. Если одного материализованного представления недостаточно для прозрачного переписывания, можно разделить сложный запрос и построить вложенные материализованные представления.

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

Следующий запрос можно успешно переписать с использованием как `mv8_0_inner_mv`, так и `mv8_0`; модель стоимости в итоге выбирает `mv8_0`:

```sql
SELECT lineitem.l_linenumber
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey
WHERE o_orderstatus = 'o';
```

:::caution Внимание
- Чем больше уровней вложенности у материализованного представления, тем дольше выполняется прозрачное переписывание. Рекомендуемая глубина вложенности — не более 3 уровней.
- Прозрачное переписывание с использованием вложенных материализованных представлений по умолчанию отключено. О включении см. [3.11 Связанные настройки](#311-related-configuration).
:::

#### 2.2.9 Использование материализованного представления без агрегирования для агрегирующего запроса {#229-aggregation-query-hits-a-non-aggregation-materialized-view}

Если запрос выполняет агрегирование, а материализованное представление не содержит агрегирования, но предоставляет все используемые запросом столбцы, переписывание всё равно возможно. Например, если запрос сначала выполняет JOIN, а затем агрегирование с помощью `GROUP BY`, полезно использовать материализованное представление, содержащее этот JOIN.

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

Следующий запрос может использовать `mv10_0`, исключая необходимость вычислять `lineitem JOIN orders`:

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

Если и запрос, и материализованное представление содержат оконные функции, определения которых полностью совпадают, можно применить прозрачное переписывание. Переписывание оконных функций повторно использует предварительно вычисленные результаты оконных функций из материализованного представления, значительно повышая производительность запросов со сложными оконными вычислениями. **В настоящее время прозрачное переписывание поддерживается для всех оконных функций.**

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

Следующий запрос может использовать `mv11_0`, исключая вычисление оконных функций. Хотя условие запроса `o_orderkey > 2` отличается от условия материализованного представления, переписывание всё равно возможно:

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

Следующий запрос может использовать `mv11_1`, исключая вычисление оконных функций. Поскольку `o_orderdate` является полем `PARTITION BY` оконной функции, прозрачное переписывание возможно, хотя условие запроса `o_orderdate > '2023-12-10'` вычисляется до выполнения оконной функции:

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
В примере используется одна таблица, но переписывание оконных функций также применимо к сценариям JOIN нескольких таблиц.
:::

#### 2.2.11 Переписывание Limit и TopN {#2211-limit-and-topn-rewrite}

Если запрос содержит предложение `ORDER BY` или `LIMIT` (то есть является запросом Top-N), а материализованное представление предоставляет достаточно данных для выполнения требований `ORDER BY` и `LIMIT` запроса, оптимизатор может использовать его для прозрачного переписывания. Это значительно ускоряет распространённые аналитические сценарии Top-N.

**Условия переписывания**:

| Проверяемый элемент | Правило проверки |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORDER BY   | Предложение `ORDER BY` запроса должно быть совместимо с предложением `ORDER BY` материализованного представления или совпадать с ним. |
| LIMIT      | Если материализованное представление не содержит `LIMIT`, попытка переписывания возможна для любого запроса с `LIMIT`.<br/>Если материализованное представление содержит `LIMIT N`, то `LIMIT M` запроса должен удовлетворять условию `M <= N`.<br/>Если материализованное представление содержит `LIMIT N OFFSET L`, то `LIMIT M OFFSET O` запроса должен удовлетворять условиям `O >= L` и `M + O <= N + L`. |
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

Значения полей:

- **`MaterializedViewRewriteSuccessAndChose`**: список имён материализованных представлений, для которых прозрачное переписывание прошло успешно и которые были выбраны CBO (оптимизатором на основе стоимости).
- **`MaterializedViewRewriteSuccessButNotChose`**: список имён материализованных представлений, для которых прозрачное переписывание прошло успешно, но которые в итоге не были выбраны CBO.
- **`MaterializedViewRewriteFail`**: материализованные представления, для которых прозрачное переписывание завершилось неудачно, с кратким описанием причин.

#### 2.3.2 Подробная информация: EXPLAIN MEMO PLAN {#232-detailed-view-explain-memo-plan}

Чтобы подробно изучить процесс отбора материализованных представлений, переписывания и окончательного выбора:

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
| Удаление материализованного представления | Право на удаление материализованного представления (такое же, как при удалении таблицы). |
| Изменение материализованного представления | Право на изменение материализованного представления (такое же, как при изменении таблицы). |
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

Подробнее см. [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW).

### 3.4 Просмотр оператора создания материализованного представления {#34-view-the-creation-statement-of-a-materialized-view}

```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

Подробнее см. [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW).

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
    - Для полностью построенного материализованного представления значение `1` означает, что его можно использовать для прозрачного переписывания.
    - Для материализованного представления с инкрементальным обновлением секций проверка выполняется на уровне секций. Даже если некоторые секции недоступны, материализованное представление можно использовать для прозрачного переписывания, если секции, к которым обращается запрос, корректны. Возможность прозрачного переписывания в основном зависит от поля `SyncWithBaseTables` секций, используемых запросом: `1` означает доступность, `0` — недоступность.
- **`JobName`**: имя задания построения материализованного представления. У каждого материализованного представления есть одно задание, а каждое обновление создаёт новую задачу; отношение между заданием и задачами — 1:n.
- **`State`**: значение `SCHEMA_CHANGE` означает, что схема базовой таблицы изменилась. В этом случае материализованное представление нельзя использовать для прозрачного переписывания (прямые запросы не затрагиваются). После следующего успешного обновления состояние снова станет `NORMAL`.
- **`SchemaChangeDetail`**: причина перехода в состояние `SCHEMA_CHANGE`.
- **`RefreshState`**: состояние обновления последней задачи материализованного представления. Если оно равно `FAIL`, для дальнейшего поиска причины сбоя можно использовать команду `tasks()` (см. [3.7 Получение информации о задачах обновления (TASK)](#37-query-refresh-task-task-information)).

**Состояние прозрачного переписывания**:

- **Нормальное состояние**: материализованное представление в данный момент доступно для прозрачного переписывания.
- **Ненормальное / недоступное состояние**: материализованное представление нельзя использовать для прозрачного переписывания, но прямые запросы по-прежнему возможны.

Подробнее см. [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos).

### 3.7 Получение информации о задачах обновления (TASK) {#37-query-refresh-task-task-information}

У каждого материализованного представления есть одно задание, а каждое обновление создаёт новую задачу; отношение между заданием и задачами — 1:n. Чтобы просмотреть состояние задач по имени материализованного представления:

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

- **`NeedRefreshPartitions` / `CompletedPartitions`**: секции, которые задача должна обновить, и секции, которые уже обновлены.
- **`Status`**: значение `FAILED` означает, что выполнение завершилось с ошибкой. Причину можно посмотреть в `ErrorMsg`, а подробную информацию найти в журналах Doris по `LastQueryId`. В настоящее время сбой задачи делает существующее материализованное представление недоступным. В будущем это поведение будет изменено: даже при сбое задачи существующее материализованное представление останется доступным для прозрачного переписывания.
- **`ErrorMsg`**: причина сбоя.
- **`RefreshMode`**:
    - `COMPLETE`: обновлены все секции.
    - `PARTIAL`: обновлена часть секций.
    - `NOT_REFRESH`: нет секций, требующих обновления.

:::info Примечание
- По умолчанию сохраняются и отображаются 100 задач. Это количество можно изменить с помощью `max_persistence_task_count` в `fe.conf`. При превышении лимита старые записи задач удаляются; если значение меньше 1, записи не сохраняются. Настройка вступает в силу только после перезапуска FE.
- Если при создании материализованного представления задано свойство `grace_period`, в некоторых случаях его можно использовать для прозрачного переписывания, даже когда `SyncWithBaseTables` равно `false` или `0`.
- Значение `grace_period` задаётся в секундах и определяет допустимое отставание данных материализованного представления от данных базовой таблицы.
    - Значение `0`: для прозрачного переписывания данные материализованного представления должны полностью соответствовать данным базовой таблицы.
    - Значение `10`: допускается задержка в 10 секунд; материализованное представление можно использовать для прозрачного переписывания в течение 10 секунд.
:::

Подробнее см. [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks).

### 3.8 Получение задания JOB, соответствующего материализованному представлению {#38-query-the-job-corresponding-to-a-materialized-view}

```sql
SELECT *
FROM jobs("type"="mv")
WHERE Name = "inner_mtmv_75043";
```

Подробнее см. [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs).

### 3.9 Получение информации о секциях материализованного представления {#39-query-materialized-view-partition-information}

Для секционированного материализованного представления используйте `SHOW PARTITIONS`, чтобы просмотреть состояние `SyncWithBaseTables`:

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

Основное поле для проверки — `SyncWithBaseTables`: `true` означает, что секцию можно использовать для прозрачного переписывания, а `false` — что нельзя.

Подробнее см. [SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS).

### 3.10 Просмотр схемы материализованного представления {#310-view-the-schema-of-a-materialized-view}

Подробнее см. [DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE).

### 3.11 Связанные настройки {#311-related-configuration}

<!-- Knowledge type: Reference documentation -->
<!-- Applicable scenarios: Tuning materialized view transparent rewrite behavior -->

#### 3.11.1 Переключатели переменных сеанса {#3111-session-variable-switches}

| Переключатель | Описание |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SET enable_nereids_planner = true;`                                           | Асинхронные материализованные представления поддерживаются только новым оптимизатором. Включите этот переключатель, если прозрачное переписывание не применяется. |
| `SET enable_materialized_view_rewrite = true;`                                 | Включает или отключает прозрачное переписывание запросов. Включено по умолчанию начиная с версии 2.1.5. |
| `SET materialized_view_rewrite_enable_contain_external_table = true;`          | Определяет, могут ли материализованные представления, участвующие в прозрачном переписывании, содержать внешние таблицы. По умолчанию запрещено. Если SQL-определение материализованного представления содержит внешние таблицы и вы хотите использовать его для прозрачного переписывания, включите этот переключатель. |
| `SET materialized_view_rewrite_success_candidate_num = 3;`                     | Максимальное количество успешно переписанных вариантов, допускаемых к рассмотрению CBO. По умолчанию — 3. Если прозрачное переписывание работает медленно, уменьшите это значение. |
| `SET enable_materialized_view_union_rewrite = true;`                           | Определяет, разрешено ли объединять базовую таблицу и материализованное представление через `UNION ALL` для выполнения запроса, если секционированное материализованное представление не предоставляет все необходимые данные. По умолчанию разрешено. Отключите этот переключатель, если при использовании материализованного представления обнаружены ошибки в данных. |
| `SET enable_materialized_view_nest_rewrite = true;`                            | Определяет, разрешено ли переписывание с использованием вложенных представлений. По умолчанию запрещено. Включите его, если сложный SQL-запрос требует построения вложенных материализованных представлений для их использования при переписывании. |
| `SET materialized_view_relation_mapping_max_count = 8;`                        | Максимальное количество сопоставлений отношений, разрешённых при прозрачном переписывании. Сопоставления сверх этого лимита отбрасываются. Обычно они возникают при соединении таблиц с самими собой, а их количество определяется декартовым произведением (например, 3 таблицы могут дать 8 комбинаций). По умолчанию — 8. Если прозрачное переписывание работает медленно, уменьшите это значение. |
| `SET enable_dml_materialized_view_rewrite = true;`                             | Определяет, включено ли прозрачное переписывание с использованием материализованных представлений на основе информации о структуре при выполнении DML. По умолчанию включено. |
| `SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;` | Определяет, включено ли прозрачное переписывание на основе информации о структуре при выполнении DML, когда материализованное представление содержит внешние таблицы, изменения данных которых невозможно обнаруживать в реальном времени. По умолчанию отключено. |

#### 3.11.2 Настройки fe.conf {#3112-feconf-configuration}

| Параметр настройки | Описание |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `job_mtmv_task_consumer_thread_num` | Определяет количество задач обновления материализованных представлений, которые могут выполняться одновременно. По умолчанию — 10; задачи сверх этого количества переходят в состояние ожидания. Изменение значения требует перезапуска FE. |
