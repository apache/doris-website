---
{
    "title": "DELETE",
    "language": "ru",
    "description": "Эта инструкция используется для удаления данных по условию в указанной партиции таблицы (базового индекса)."
}
---

## Описание {#description}

Эта инструкция используется для удаления данных по условию в указанной партиции таблицы (базового индекса).

Эта операция также удаляет данные индекса rollup, связанного с этим базовым индексом.

#### Синтаксис {#syntax}

Синтаксис 1: позволяет задавать только предикаты фильтрации

```SQL
DELETE FROM table_name [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
WHERE
column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

Синтаксис 2: доступен только для модели UNIQUE KEY

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

+ table_name: указывает таблицу, из которой удаляются строки.
+ column_name: столбец таблицы table_name.
+ op: оператор логического сравнения. Возможные значения op: =, >, <, >=, <=, !=, in, not in.
+ value | value_list: значение или список значений для логического сравнения.

#### Необязательные параметры {#optional-parameters}

+ cte: общее табличное выражение, например 'WITH a AS SELECT * FROM tbl'.
+ PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): указывает партицию или партиции, из которых выбираются строки для удаления.
+ table_alias: псевдоним таблицы.
+ USING additional_tables: если в предложении WHERE нужно обратиться к дополнительным таблицам, чтобы определить удаляемые строки, укажите имена этих таблиц в предложении USING. В предложении USING также можно указать подзапросы, определяющие удаляемые строки.
+ WHERE condition: задаёт условие выбора строк для удаления. Обязательно для синтаксиса 1. Необязательно для синтаксиса 2.
+ ORDER BY column: задаёт порядок удаления строк. Обычно используется вместе с LIMIT, чтобы определить, какие строки будут затронуты.
+ LIMIT [offset,] count: ограничивает количество удаляемых строк. При использовании с ORDER BY удаляет первые `count` строк после сортировки. Если задан `offset`, перед удалением пропускает первые `offset` строк. При использовании без ORDER BY набор затронутых строк недетерминирован.

#### Примечания {#note}

1. При использовании модели AGGREGATE (UNIQUE) можно задавать условия только для ключевого столбца.
2. Если выбранный ключевой столбец отсутствует в rollup, удаление невозможно.
3. При использовании синтаксиса 1 условия можно объединять только связкой "and". Для связи "or" нужно записать условия в двух инструкциях DELETE.
4. В синтаксисе 1 для партиционированной таблицы можно указать партицию. Если она не указана, Doris определяет партицию по заданным условиям. В двух случаях Doris не может определить партицию по условиям: 1) условия не содержат столбцов партиционирования; 2) для столбца партиционирования используется оператор not in. Если партиционированная таблица не является таблицей Unique и партиция не указана или её невозможно определить по условиям, переменная сеанса delete_without_partition должна иметь значение true, чтобы инструкция delete применялась ко всем партициям.

:::tip Советы
Эта возможность поддерживается начиная с версии Apache Doris 1.2
:::

5. В течение некоторого времени после выполнения эта инструкция может снижать эффективность запросов. Степень влияния зависит от количества условий удаления, указанных в инструкции. Чем больше условий, тем сильнее влияние.
6. Если в синтаксисе 2 не указаны ни `WHERE`, ни `LIMIT`, будут удалены все строки таблицы. Прежде чем опускать предложение `WHERE`, всегда проверяйте, какие строки предполагается удалить.

## Примеры {#example}

1. Удаление строки данных, в которой значение столбца k1 равно 3, из партиции p1 таблицы my_table

   ```sql
   DELETE FROM my_table PARTITION p1
       WHERE k1 = 3;
   ```

2. Удаление строк данных, в которых значение столбца k1 больше или равно 3, а значение столбца k2 равно "abc", из партиции p1 таблицы my_table

   ```sql
   DELETE FROM my_table PARTITION p1
   WHERE k1 >= 3 AND k2 = "abc";
   ```

3. Удаление строк данных, в которых значение столбца k1 больше или равно 3, а значение столбца k2 равно "abc", из партиций p1, p2 таблицы my_table

   ```sql
   DELETE FROM my_table PARTITIONS (p1, p2)
   WHERE k1 >= 3 AND k2 = "abc";
   ```

4. Использование результата соединения `t2` с `t3` для удаления строк из `t1`. Таблица, из которой удаляются строки, должна использовать модель unique key

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
   
   Ожидаемый результат: из таблицы t1 удалена только строка, где id = 1
   
   ```
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

6. Удаление с ORDER BY и LIMIT: удалить первые 3 строки после сортировки по k1 по возрастанию

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 3;
   ```

7. Удаление с ORDER BY, LIMIT и offset: пропустить первые 10 строк и удалить следующие 5 строк после сортировки по k1

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 10, 5;
   ```

## Ключевые слова {#keywords}

    DELETE

## Рекомендации {#best-practice}
