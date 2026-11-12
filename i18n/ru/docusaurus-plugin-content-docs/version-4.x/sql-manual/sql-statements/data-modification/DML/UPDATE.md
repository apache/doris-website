---
{
    "title": "UPDATE",
    "language": "ru",
    "description": "Эта инструкция используется для обновления данных. В настоящее время инструкция UPDATE поддерживает только модель UNIQUE KEY."
}
---

## Описание {#description}

Эта инструкция используется для обновления данных. В настоящее время инструкция UPDATE поддерживает только модель UNIQUE KEY.

Операция UPDATE пока поддерживает обновление только столбцов Value. Об обновлении столбцов Key см. раздел [Обновление столбцов Key с помощью FlinkCDC](../../../../connection-integration/data-integration/flink-doris-connector.md#updating-key-columns-with-flink-cdc).
#### Синтаксис {#syntax}

```sql
[cte]
UPDATE target_table [table_alias]
    SET assignment_list
    [ FROM additional_tables]
    [WHERE condition]
    [ORDER BY column [ASC | DESC] [NULLS FIRST | NULLS LAST] [, ...]]
    [LIMIT [offset,] count]
```

#### Обязательные параметры {#required-parameters}

+ target_table: Целевая таблица, данные которой нужно обновить. Может быть указана в формате 'db_name.table_name'
+ assignment_list: Столбцы, которые нужно обновить, в формате 'col_name = value, col_name = value'

#### Необязательные параметры {#optional-parameters}

+ cte: Общее табличное выражение, например 'WITH a AS SELECT * FROM tbl'
+ table_alias: Псевдоним таблицы
+ FROM additional_tables: Задаёт одну или несколько таблиц, используемых для выбора обновляемых строк или задания новых значений. Если здесь используется целевая таблица, для неё необходимо явно указать псевдоним.
+ WHERE condition: Условие отбора строк для обновления, выражение, возвращающее true или false.
+ ORDER BY column: Задаёт порядок обновления строк. Обычно используется вместе с LIMIT, чтобы управлять тем, какие строки будут затронуты.
+ LIMIT [offset,] count: Ограничивает количество обновляемых строк. При использовании с ORDER BY обновляет первые `count` строк после сортировки. Если указан `offset`, перед обновлением пропускает первые `offset` строк. При использовании без ORDER BY набор обновляемых строк не определён однозначно.

#### Примечание {#note}

В настоящее время инструкция UPDATE поддерживает обновление строк только в модели UNIQUE KEY.

Если не указаны ни `WHERE`, ни `LIMIT`, обновляются все строки таблицы. Прежде чем опускать предложение `WHERE`, всегда проверяйте, какие строки должны быть затронуты.

## Примеры {#example}

Таблица `test` использует модель UNIQUE KEY и содержит четыре столбца: k1, k2, v1, v2. Столбцы k1, k2 являются ключами, v1, v2 содержат значения; для агрегации используется метод Replace.

1. Обновить столбец v1 в таблице 'test' для строк, удовлетворяющих условиям k1 =1 , k2 =2, установив значение 1

```sql
UPDATE test SET v1 = 1 WHERE k1=1 and k2=2;
```

2. Увеличить значение столбца v1 в строках таблицы 'test', где k1=1, на 1

```sql
UPDATE test SET v1 = v1+1 WHERE k1=1;
```

3. Использовать результат соединения `t2` с `t3` для обновления `t1`

```sql
-- create t1, t2, t3 tables
CREATE TABLE t1
  (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
UNIQUE KEY (id)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1', "function_column.sequence_col" = "c4");

CREATE TABLE t2
  (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

CREATE TABLE t3
  (id INT)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

-- insert data
INSERT INTO t1 VALUES
  (1, 1, '1', 1.0, '2000-01-01'),
  (2, 2, '2', 2.0, '2000-01-02'),
  (3, 3, '3', 3.0, '2000-01-03');

INSERT INTO t2 VALUES
  (1, 10, '10', 10.0, '2000-01-10'),
  (2, 20, '20', 20.0, '2000-01-20'),
  (3, 30, '30', 30.0, '2000-01-30'),
  (4, 4, '4', 4.0, '2000-01-04'),
  (5, 5, '5', 5.0, '2000-01-05');

INSERT INTO t3 VALUES
  (1),
  (4),
  (5);

-- update t1
UPDATE t1
  SET t1.c1 = t2.c1, t1.c3 = t2.c3 * 100
  FROM t2 INNER JOIN t3 ON t2.id = t3.id
  WHERE t1.id = t2.id;
```

Ожидаемый результат: обновляется только строка с id = 1 в таблице t1

```
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 1  | 10 | 1  | 1000.0 | 2000-01-01 |
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

4. Использование cte

```sql
create table orders(
    o_orderkey bigint,
    o_totalprice decimal(15, 2)
) unique key(o_orderkey)
distributed by hash(o_orderkey) buckets 1 
properties (
    "replication_num" = "1"
);

insert into orders values
(1, 34.1),
(2, 432.8);

create table lineitem(
    l_linenumber int,
    o_orderkey bigint,
    l_discount  decimal(15, 2)
) unique key(l_linenumber)
distributed by hash(l_linenumber) buckets 1 
properties (
    "replication_num" = "1"
);

insert into lineitem values
(1, 1, 1.23),
(2, 1, 3.21),
(3, 2, 18.08),
(4, 2, 23.48);

with discount_orders as (
    select * from orders 
    where o_totalprice > 100
)
update lineitem  set l_discount = l_discount*0.9
from discount_orders 
where lineitem.o_orderkey = discount_orders.o_orderkey;
```

5. Обновление с ORDER BY и LIMIT: установить значение столбца v1 в 0 для первых 3 строк с наибольшими значениями v1, для которых k1 > 0

```sql
UPDATE test SET v1 = 0 WHERE k1 > 0 ORDER BY v1 DESC LIMIT 3;
```

6. Обновление с ORDER BY, LIMIT и offset: пропустить первые 10 строк и обновить следующие 5 строк, упорядоченных по k1

```sql
UPDATE test SET v1 = 100 ORDER BY k1 ASC LIMIT 10, 5;
```

## Ключевые слова {#keywords}

    UPDATE

## Рекомендации по использованию {#best-practice}
