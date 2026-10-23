---
{
    "title": "DELETE",
    "language": "ru",
    "description": "Этот оператор используется для удаления данных по условию из раздела указанной таблицы (базового индекса)."
}
---

## Описание {#description}

Этот оператор используется для удаления данных по условию из раздела указанной таблицы (базового индекса).

При этой операции также удаляются данные из индекса rollup, связанного с этим базовым индексом.

#### Синтаксис {#syntax}

Синтаксис 1: позволяет указывать только предикаты фильтрации

```SQL
DELETE FROM table_name [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
WHERE
column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

Синтаксис 2: применим только к модели UNIQUE KEY

```sql
[cte]
DELETE FROM table_name
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    [WHERE condition]
    [ORDER BY column [ASC | DESC] [NULLS FIRST | NULLS LAST] [, ...]]
    [LIMIT [offset,] count]
```

#### Обязательные параметры {#required-parameters}

+ table_name: задаёт таблицу, из которой удаляются строки.
+ column_name: столбец таблицы table_name.
+ op: оператор логического сравнения. Допустимые операторы: =, >, <, >=, <=, !=, in, not in.
+ value | value_list: значение или список значений для логического сравнения.

#### Необязательные параметры {#optional-parameters}

+ cte: общее табличное выражение, например 'WITH a AS SELECT * FROM tbl'.
+ PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): задаёт раздел или разделы, из которых выбираются строки для удаления.
+ table_alias: псевдоним таблицы.
+ USING additional_tables: если для определения удаляемых строк в предложении WHERE нужно обратиться к дополнительным таблицам, укажите их имена в предложении USING. В предложении USING также можно указывать подзапросы, определяющие строки для удаления.
+ WHERE condition: задаёт условие выбора строк для удаления. Обязательно для синтаксиса 1. Необязательно для синтаксиса 2.
+ ORDER BY column: задаёт порядок удаления строк. Обычно используется вместе с LIMIT, чтобы управлять выбором удаляемых строк.
+ LIMIT [offset,] count: ограничивает количество удаляемых строк. При использовании с ORDER BY удаляет первые `count` строк после сортировки. Если указан `offset`, перед удалением пропускает первые `offset` строк. При использовании без ORDER BY набор удаляемых строк не определён однозначно.

#### Примечание {#note}

1. При использовании модели AGGREGATE (UNIQUE) можно задавать условия только для ключевых столбцов.
2. Если выбранный ключевой столбец отсутствует в индексе rollup, удаление выполнить нельзя.
3. При использовании синтаксиса 1 условия могут быть связаны только через "and". Чтобы реализовать связь "or", нужно записать условия в двух операторах DELETE.
4. В синтаксисе 1 для секционированной таблицы можно указать раздел. Если раздел не указан, Doris определит его по заданным условиям. В двух случаях Doris не может определить раздел по условиям: 1) условия не содержат столбцов разбиения; 2) для столбца разбиения используется оператор not in. Если секционированная таблица не является таблицей Unique и раздел не указан либо его нельзя определить по условиям, для применения оператора удаления ко всем разделам необходимо установить для переменной сеанса delete_without_partition значение true.

:::tip Советы
Эта возможность поддерживается начиная с версии Apache Doris 1.2
:::

5. После выполнения этого оператора эффективность запросов может на некоторое время снизиться. Степень влияния зависит от количества условий удаления, указанных в операторе. Чем больше условий, тем сильнее влияние.
6. Если в синтаксисе 2 не указаны ни `WHERE`, ни `LIMIT`, будут удалены все строки таблицы. Прежде чем опускать предложение `WHERE`, всегда проверяйте, какие данные предполагается удалить.

## Примеры {#example}

В примерах 1-3, 6 и 7 используется таблица `my_table`, созданная приведёнными ниже командами. Это таблица с уникальным ключом, разбитая по списку на два раздела: `p1` и `p2`:

```sql
CREATE TABLE my_table (
  k1 INT,
  k2 VARCHAR(16)
)
UNIQUE KEY (k1)
PARTITION BY LIST (k1) (
  PARTITION p1 VALUES IN (1, 2, 3, 4, 5),
  PARTITION p2 VALUES IN (6, 7, 8, 9, 10)
)
DISTRIBUTED BY HASH (k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO my_table VALUES
  (1, 'a'), (3, 'abc'), (5, 'abc'),
  (6, 'b'), (8, 'abc'), (10, 'd');
```

1. Удаление строки данных, в которой значение столбца k1 равно 3, из раздела p1 таблицы my_table

   ```sql
   DELETE FROM my_table PARTITION p1
       WHERE k1 = 3;
   ```

2. Удаление строк данных, в которых значение столбца k1 больше или равно 3, а значение столбца k2 равно "abc", из раздела p1 таблицы my_table

   ```sql
   DELETE FROM my_table PARTITION p1
   WHERE k1 >= 3 AND k2 = "abc";
   ```

3. Удаление строк данных, в которых значение столбца k1 больше или равно 3, а значение столбца k2 равно "abc", из разделов p1, p2 таблицы my_table

   ```sql
   DELETE FROM my_table PARTITIONS (p1, p2)
   WHERE k1 >= 3 AND k2 = "abc";
   ```

4. Использование результата соединения `t2` с `t3` для удаления строк из `t1`. Таблица, из которой удаляются строки, должна использовать модель UNIQUE KEY

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
   
   -- remove rows from t1
   DELETE FROM t1
     USING t2 INNER JOIN t3 ON t2.id = t3.id
     WHERE t1.id = t2.id;
   ```

   Ожидаемое содержимое `t1` после удаления (удалена только строка, в которой `id = 1`):

   ```sql
   SELECT * FROM t1 ORDER BY id;
   ```

   ```text
   +----+----+----+--------+------------+
   | id | c1 | c2 | c3     | c4         |
   +----+----+----+--------+------------+
   | 2  | 2  | 2  |    2.0 | 2000-01-02 |
   | 3  | 3  | 3  |    3.0 | 2000-01-03 |
   +----+----+----+--------+------------+
   ```

5. Использование cte

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
   delete from lineitem
   using discount_orders
   where lineitem.o_orderkey = discount_orders.o_orderkey;
   ```

6. Удаление с ORDER BY и LIMIT: удаление первых 3 строк после сортировки по k1 по возрастанию

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 3;
   ```

7. Удаление с ORDER BY, LIMIT и offset: пропуск первых 10 строк и удаление следующих 5 строк после сортировки по k1

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 10, 5;
   ```

## Ключевые слова {#keywords}

    DELETE

## Рекомендации {#best-practice}
