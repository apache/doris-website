---
{
    "title": "DELETE",
    "language": "ja",
    "description": "この文は、指定したテーブル（ベースインデックス）のパーティションから、条件に一致するデータを削除するために使用します。"
}
---

## 説明

この文は、指定したテーブル（ベースインデックス）のパーティションから、条件に一致するデータを削除するために使用します。

この操作では、対象のベースインデックスに関連するロールアップインデックスのデータも削除されます。

#### 構文

構文 1: この構文では、フィルター条件のみ指定できます。

```SQL
DELETE FROM table_name [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
WHERE
column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

構文 2: この構文は UNIQUE KEY モデルでのみ使用できます。

```sql
[cte]
DELETE FROM table_name
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    [WHERE condition]
    [ORDER BY column [ASC | DESC] [NULLS FIRST | NULLS LAST] [, ...]]
    [LIMIT [offset,] count]
```

#### 必須パラメータ

+ table_name: 行を削除する対象のテーブルを指定します。
+ column_name: table_name に属する列を指定します。
+ op: 論理比較演算子です。指定できる演算子は =、>、<、>=、<=、!=、in、not in です。
+ value | value_list: 論理比較に使用する値または値のリストです。

#### オプションパラメータ

+ cte: 共通テーブル式です。例: 'WITH a AS SELECT * FROM tbl'。
+ PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): 削除対象の行を選択するパーティションを指定します。
+ table_alias: テーブルのエイリアスです。
+ USING additional_tables: 削除対象の行を特定するために WHERE 句で追加のテーブルを参照する場合、そのテーブル名を USING 句に指定します。削除対象の行を特定するサブクエリも USING 句に指定できます。
+ WHERE condition: 削除対象の行を選択する条件を指定します。構文 1 では必須、構文 2 では省略可能です。
+ ORDER BY column: 行を削除する順序を指定します。通常、対象行を制御するために LIMIT と併用します。
+ LIMIT [offset,] count: 削除する行数を制限します。ORDER BY と併用すると、並べ替え後の先頭 `count` 行を削除します。`offset` を指定すると、先頭の `offset` 行を飛ばしてから削除します。ORDER BY を指定しない場合、対象となる行は非決定的です。

#### 注意事項

1. AGGREGATE（UNIQUE）モデルを使用する場合、キー列に対する条件のみ指定できます。
2. 選択したキー列がロールアップに存在しない場合、削除は実行できません。
3. 構文 1 を使用する場合、条件は「AND」でのみ結合できます。「OR」の関係にするには、条件を二つの DELETE 文に分けて記述する必要があります。
4. 構文 1 でパーティションテーブルを使用する場合、パーティションを指定できます。指定しない場合、Doris は指定された条件からパーティションを推定します。次の二つの場合、Doris は条件からパーティションを推定できません。1) 条件にパーティション列が含まれていない場合。2) パーティション列の演算子が in ではない場合。パーティションテーブルが Unique テーブルではなく、パーティションを指定していないか、条件からパーティションを推定できない場合、すべてのパーティションに DELETE 文を適用するには、セッション変数 delete_without_partition を true に設定する必要があります。

:::tip ヒント
この機能は Apache Doris 1.2 以降でサポートされています。
:::

5. この文を実行した後、しばらくの間、クエリ効率が低下する可能性があります。影響の程度は文に指定した削除条件の数によって異なり、条件が多いほど影響も大きくなります。
6. 構文 2 で `WHERE` と `LIMIT` のどちらも指定しない場合、テーブル内のすべての行が削除されます。`WHERE` 句を省略する前に、対象範囲を必ず確認してください。

## 例

1. my_table のパーティション p1 から、k1 列の値が 3 の行を削除します。

   ```sql
   DELETE FROM my_table PARTITION p1
       WHERE k1 = 3;
   ```

2. my_table のパーティション p1 から、k1 列の値が 3 以上で、k2 列の値が "abc" の行を削除します。

   ```sql
   DELETE FROM my_table PARTITION p1
   WHERE k1 >= 3 AND k2 = "abc";
   ```

3. my_table のパーティション p1、p2 から、k1 列の値が 3 以上で、k2 列の値が "abc" の行を削除します。

   ```sql
   DELETE FROM my_table PARTITIONS (p1, p2)
   WHERE k1 >= 3 AND k2 = "abc";
   ```

4. `t2` と `t3` の結合結果を使用して `t1` から行を削除します。この削除構文は UNIQUE KEY モデルのみをサポートします。

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
   
   期待される結果は、テーブル t1 から id = 1 の行だけが削除されることです。
   
   ```
   +----+----+----+--------+------------+
   | id | c1 | c2 | c3     | c4         |
   +----+----+----+--------+------------+
   | 2  | 2  | 2  |    2.0 | 2000-01-02 |
   | 3  | 3  | 3  |    3.0 | 2000-01-03 |
   +----+----+----+--------+------------+
   ```

5. CTE を使用します。

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

6. ORDER BY と LIMIT を使用し、k1 の昇順で先頭の 3 行を削除します。

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 3;
   ```

7. ORDER BY、LIMIT、オフセットを使用し、k1 の順序で先頭の 10 行を飛ばして次の 5 行を削除します。

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 10, 5;
   ```

## キーワード

    DELETE

## ベストプラクティス
