---
{
    "title": "CREATE ASYNC MATERIALIZED VIEW",
    "language": "ru",
    "description": "Оператор создания асинхронного материализованного представления. Имена и типы столбцов определяются на основе SQL-оператора материализованного представления."
}
---

## Описание {#description}

Оператор создания асинхронного материализованного представления. Имена и типы столбцов определяются на основе SQL-оператора материализованного представления. Можно задавать собственные имена столбцов, но задавать их типы нельзя.

## Синтаксис {#syntax}


```sql
CREATE MATERIALIZED VIEW 
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ] 
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [<refresh_trigger>]]
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

Где:


```sql
columns_definition
  : -- Column definition
    <col_name> 
      [ COMMENT '<col_comment>' ]
refresh_trigger
  : ON MANUAL
  | ON SCHEDULE EVERY <int_value> <refresh_unit> [ STARTS '<start_time>']
  | ON COMMIT
```

## Обязательные параметры {#required-parameters}

**1. `<materialized_view_name>`**

> Задаёт идентификатор (то есть имя) материализованного представления. Он должен быть уникальным в базе данных, в которой создаётся таблица.
>
> Идентификатор должен начинаться с буквы (если включена поддержка имён Unicode, это может быть символ любого языка) и не может содержать пробелы или специальные символы, если только вся строка идентификатора не заключена в обратные кавычки (например, `My Object`).
>
> Идентификатор не может быть зарезервированным ключевым словом.
>
> Подробнее см. в требованиях к идентификаторам и зарезервированным ключевым словам.

**2. `<query>`**

> Обязательный параметр при создании материализованного представления. Задаёт оператор SELECT, который используется для заполнения представления данными.

## Необязательные параметры {#optional-parameters}

**1. `<key_cols>`**

> Ключевые столбцы таблицы. В Doris ключевыми должны быть первые K столбцов таблицы. Подробнее об ограничениях для ключей и выборе ключевых столбцов см. в соответствующих разделах главы «Модель данных».

**2. `<build_mode>`**

> Момент обновления: определяет, следует ли обновлять материализованное представление сразу после создания.
>
> IMMEDIATE: немедленное обновление. Значение по умолчанию: IMMEDIATE.
>
> DEFERRED: отложенное обновление.

**3. `<refresh_method>`**

> Способ обновления:
>
> COMPLETE: обновить все партиции.
>
> AUTO: попытаться выполнить инкрементальное обновление, обновив только те партиции, которые изменились с момента последнего обновления материализованного представления. Если инкрементальное обновление невозможно, обновляются все партиции.

:::caution Примечание
Если партиционированное материализованное представление использует режим обновления COMPLETE, при каждом обновлении будут полностью обновляться данные всех партиций. Таким образом, оно фактически работает как непартиционированное материализованное представление.
:::

**4. `<refresh_trigger>`**

> Способ запуска обновления:
>
> MANUAL: обновление вручную.
>
> ON SCHEDULE: обновление по расписанию.
>
> ON COMMIT: обновление по триггеру, при котором изменения данных базовой таблицы запускают обновление материализованного представления.

**5. `<refresh_unit>`**

> Единица времени для периодического обновления. В настоящее время поддерживаются MINUTE, HOUR, DAY и WEEK.

**6. `<partition_col>`**

> Если PARTITION BY не указан, по умолчанию создаётся только одна партиция.
>
> Если указано поле партиционирования, система автоматически определяет, из какой базовой таблицы оно получено, и синхронизирует партиции с базовой таблицей (в настоящее время поддерживаются внутренние таблицы и таблицы Hive). Для внутренних таблиц допускается только одно поле партиционирования.
>
> Материализованные представления также позволяют сократить количество партиций за счёт их укрупнения. В настоящее время для укрупнения партиций поддерживается функция `date_trunc`.

**7. `<partition_unit>`**

> Гранулярность агрегации при укрупнении партиций. В настоящее время поддерживаются HOUR, DAY, WEEK, QUARTER, MONTH и YEAR.

**8. `<start_time>`**

> Запланированное время начала должно быть в будущем, то есть позже текущего времени.

**9. `<table_property>`**

Большинство свойств внутренних таблиц можно использовать и для материализованных представлений. Кроме того, существуют свойства, предназначенные специально для материализованных представлений. Они перечислены ниже:

| Имя свойства                    | Описание                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| grace_period                     | Максимально допустимое отставание данных материализованного представления в секундах при переписывании запросов. Если данные партиции A материализованного представления не совпадают с данными базовой таблицы, а последнее обновление партиции A произошло в 10:15:00 при текущем системном времени 10:15:08, эта партиция не будет использоваться для прозрачного переписывания запросов. Однако если для `grace_period` задано значение 10, партиция будет использоваться для прозрачного переписывания. |
| excluded_trigger_tables          | Имена таблиц, разделённые запятыми, которые следует игнорировать при обновлении данных. Например, `table1,table2`. |
| refresh_partition_num            | Количество партиций, обновляемых одним оператором INSERT. Значение по умолчанию: 1. При обновлении материализованного представления сначала определяется список партиций для обновления, затем он разбивается на несколько операторов INSERT, которые выполняются последовательно. Если выполнение оператора INSERT завершается ошибкой, вся задача останавливается. Материализованное представление обеспечивает атомарность отдельного оператора INSERT, а ошибка INSERT не влияет на партиции, которые уже были успешно обновлены. |
| workload_group                   | Имя `workload_group`, используемой при выполнении задач обновления материализованного представления. Это свойство позволяет ограничить ресурсы, используемые материализованным представлением при обновлении данных, чтобы избежать влияния на другие рабочие процессы. Подробнее о создании и использовании `workload_group` см. в документации [WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/dev/admin-manual/workload-management/workload-group). |
| partition_sync_limit             | Если поле партиционирования базовой таблицы имеет временной тип, это свойство вместе с `partition_sync_time_unit` позволяет настроить диапазон партиций для синхронизации с базовой таблицей. Например, если задать значение 2, а для `partition_sync_time_unit` указать `MONTH`, будут синхронизироваться только партиции и данные базовой таблицы за последние 2 месяца. Минимальное значение: `1`. С течением времени материализованное представление автоматически добавляет и удаляет партиции при каждом обновлении. Например, если сейчас материализованное представление содержит данные за месяцы 2 и 3, в следующем месяце оно автоматически удалит данные за месяц 2 и добавит данные за месяц 4. |
| partition_sync_time_unit         | Единица времени для обновления партиций. Поддерживаются DAY/MONTH/YEAR (по умолчанию DAY). |
| partition_date_format            | Если поле партиционирования базовой таблицы имеет строковый тип и вы хотите использовать возможности `partition_sync_limit`, можно задать формат даты для разбора времени партиции с помощью настройки `partition_date_format`. |
| enable_nondeterministic_function | Определяет, разрешено ли использовать в SQL-определении материализованного представления недетерминированные функции, такие как current_date(), now(), random() и т. д. Если задано true, их использование разрешено, в противном случае запрещено. По умолчанию использование запрещено. |
| use_for_rewrite                  | Определяет, участвует ли это материализованное представление в прозрачном переписывании запросов. Если задано false, оно не участвует в прозрачном переписывании. Значение по умолчанию: true. В сценариях моделирования данных, если материализованное представление используется только для прямых запросов, с помощью этого свойства можно исключить его из прозрачного переписывания и тем самым сократить время отклика запросов. |
| compute_group | Поддерживается начиная с версии 4.1.5. Необязательная строка, по умолчанию не задана. Поддерживается только в режиме с разделением вычислений и хранения; явно привязывает Compute Group для обновления и имеет приоритет над выбором в сеансе или при ручном обновлении. При создании и изменении проверяется привилегия `USAGE` пользователя, выполняющего операцию; при обновлении проверяется существование группы. На этапе обновления привилегии создателя в настоящее время повторно не проверяются, поэтому отзыв только привилегии `USAGE` у создателя не препятствует обновлению. Значение `DEFAULT` зарезервировано и не допускается. Чтобы изменить привязку, используйте `ALTER MATERIALIZED VIEW ... SET ("compute_group" = "cg_refresh")`. |

:::caution Примечание
В версиях Apache Doris до 2.1.10 предложение DISTRIBUTED BY обязательно: его отсутствие приводит к ошибке.
Начиная с Apache Doris 2.1.10, если оно не указано, по умолчанию используется распределение RANDOM.
:::

:::caution Примечание
В версиях Apache Doris до 2.1.10/3.0.6 свойство excluded_trigger_tables поддерживало только имена базовых таблиц.
Начиная с этих версий поддерживаются полностью квалифицированные имена таблиц, включающие Catalog и базу данных (например, internal.db1.table1).
:::

## Требования к правам доступа {#access-control-requirements}

Пользователь, выполняющий эту SQL-команду, должен иметь как минимум следующие привилегии:

| Привилегия   | Объект      | Примечания                                                        |
| ----------- | ----------- | ------------------------------------------------------------ |
| CREATE_PRIV | База данных    |                                                              |
| SELECT_PRIV | Таблица, представление | Требуется привилегия SELECT_PRIV на таблицы или представления, к которым обращается `<query>` |

## Примечания {#notes}

- Ограничения DML и DDL для материализованных представлений:

  Материализованные представления не поддерживают операции изменения схемы, такие как изменение типов столбцов, добавление или удаление столбцов, поскольку столбцы определяются на основе SQL-определения материализованного представления.

  Материализованные представления не поддерживают ручные операции insert into и insert overwrite.

- Условия создания партиционированных материализованных представлений:

  > Для инкрементального обновления по партициям SQL-определение материализованного представления и поле партиционирования должны соответствовать следующим условиям:
  >
  > 1. Как минимум одна из базовых таблиц, используемых материализованным представлением, должна быть партиционированной.
  > 2. Партиционированная базовая таблица, используемая материализованным представлением, должна использовать стратегию партиционирования List или Range.
  > 3. SQL-определение материализованного представления может содержать только одно поле партиционирования в предложении Partition By.
  > 4. Поле партиционирования из предложения Partition By SQL-определения материализованного представления должно присутствовать после Select.
  > 5. Если в SQL-определении материализованного представления используется Group By, поле партиционирования должно присутствовать после Group By.
  > 6. Если в SQL-определении материализованного представления используется оконная функция, поле партиционирования должно присутствовать после Partition By.
  > 7. Изменения данных должны происходить в партиционированной таблице; если они происходят в непартиционированной таблице, требуется полное построение материализованного представления.
  > 8. Если материализованное представление использует в качестве поля партиционирования поле со стороны Join, для которой генерируются значения NULL, инкрементальное обновление по партициям невозможно. Например, для LEFT OUTER JOIN поле партиционирования должно находиться слева, а не


## Примеры {#examples}

Подготовка: в приведённых ниже примерах материализованные представления создаются на основе стандартных базовых таблиц `orders`, `lineitem` и `partsupp` в стиле TPC-H. Создайте их один раз (партиционированная версия `orders` также используется в примере 2; в примере 2 последующий оператор `CREATE TABLE IF NOT EXISTS orders` не выполняет никаких действий):

```sql
CREATE TABLE IF NOT EXISTS orders (
  o_orderkey      INT NOT NULL,
  o_custkey       INT NOT NULL,
  o_orderstatus   CHAR(1) NOT NULL,
  o_totalprice    DECIMALV3(15,2) NOT NULL,
  o_orderdate     DATE NOT NULL,
  o_orderpriority CHAR(15) NOT NULL,
  o_clerk         CHAR(15) NOT NULL,
  o_shippriority  INT NOT NULL,
  o_comment       VARCHAR(79) NOT NULL
)
DUPLICATE KEY (o_orderkey, o_custkey)
PARTITION BY RANGE (o_orderdate) (FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY)
DISTRIBUTED BY HASH (o_orderkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey      INT NOT NULL,
  l_partkey       INT NOT NULL,
  l_suppkey       INT NOT NULL,
  l_linenumber    INT NOT NULL,
  l_quantity      DECIMAL(15,2) NOT NULL,
  l_extendedprice DECIMAL(15,2) NOT NULL,
  l_discount      DECIMAL(15,2) NOT NULL,
  l_tax           DECIMAL(15,2) NOT NULL,
  l_returnflag    CHAR(1) NOT NULL,
  l_linestatus    CHAR(1) NOT NULL,
  l_shipdate      DATE NOT NULL,
  l_commitdate    DATE NOT NULL,
  l_receiptdate   DATE NOT NULL,
  l_shipinstruct  CHAR(25) NOT NULL,
  l_shipmode      CHAR(10) NOT NULL,
  l_comment       VARCHAR(44) NOT NULL
)
DUPLICATE KEY (l_orderkey, l_partkey, l_suppkey, l_linenumber)
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE IF NOT EXISTS partsupp (
  ps_partkey    INT NOT NULL,
  ps_suppkey    INT NOT NULL,
  ps_availqty   INT NOT NULL,
  ps_supplycost DECIMAL(15,2) NOT NULL,
  ps_comment    VARCHAR(199) NOT NULL
)
DUPLICATE KEY (ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH (ps_partkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

1. Непартиционированное материализованное представление

```sql

CREATE MATERIALIZED VIEW complete_mv (
orderdate COMMENT 'Order date',
orderkey COMMENT 'Order key',
partkey COMMENT 'Part key'
)
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
DISTRIBUTED BY HASH (orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "1")
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

2. Партиционированное материализованное представление 

Как показано ниже, если указан столбец партиционирования, система автоматически определяет, из какой базовой таблицы он получен, и синхронизирует партиции с базовой таблицей. Базовая таблица партиционирована по дням (столбец партиционирования: o_orderdate, тип партиционирования: RANGE). Материализованное представление партиционировано по месяцам: функция DATE_TRUNC укрупняет партиции базовой таблицы до месяцев.
```sql
CREATE TABLE IF NOT EXISTS orders  (
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
FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES (
"replication_num" = "3"
);
```

```sql
CREATE MATERIALIZED VIEW partition_mv
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
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

В следующем примере создать партиционированное материализованное представление невозможно, поскольку столбец партиционирования использует функцию, отличную от date_trunc. Сообщение об ошибке: because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)

```sql
CREATE MATERIALIZED VIEW partition_mv_2
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
PARTITION BY (DATE_TRUNC(min_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "3")
AS
SELECT
min(o_orderdate) AS min_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey
GROUP BY
o_orderdate,
l_orderkey,
l_partkey;
```

3. Изменение свойств материализованного представления. Используйте оператор ALTER MATERIALIZED VIEW. 

Например:
```sql
ALTER MATERIALIZED VIEW partition_mv
SET (
"grace_period" = "10",
"excluded_trigger_tables" = "lineitem,partsupp"
);
```

4. Изменение режима обновления материализованного представления. Используйте оператор ALTER MATERIALIZED VIEW. 
Например:

```sql
ALTER MATERIALIZED VIEW partition_mv REFRESH COMPLETE;
After running SHOW CREATE MATERIALIZED VIEW partition_mv;, you can see that the refresh mode has been changed to COMPLETE.
```
