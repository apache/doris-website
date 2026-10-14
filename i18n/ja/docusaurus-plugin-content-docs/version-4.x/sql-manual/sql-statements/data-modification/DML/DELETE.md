---
{
    "title": "DELETE",
    "language": "ja",
    "description": "この文は、指定したテーブル（ベースインデックス）のパーティション内のデータを条件に基づいて削除するために使用します。"
}
---

## 説明

この文は、指定したテーブル（ベースインデックス）のパーティション内のデータを条件に基づいて削除するために使用します。

この操作では、ベースインデックスに関連するロールアップインデックスのデータも削除されます。

#### 構文

構文 1: この構文では、フィルター条件のみを指定できます。

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
+ column_name: table_name に属する列です。
+ op: 論理比較演算子です。指定できる演算子は =、>、<、>=、<=、!=、in、not in です。
+ value | value_list: 論理比較に使用する値または値のリストです。

#### 省略可能なパラメータ

+ cte: 共通テーブル式です。例: 'WITH a AS SELECT * FROM tbl'。
+ PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): 削除する行を選択するパーティションを指定します。
+ table_alias: テーブルのエイリアスです。
+ USING additional_tables: 削除する行の特定に役立つ追加のテーブルを WHERE 句で参照する場合は、そのテーブル名を USING 句で指定します。USING 句では、削除する行を特定するサブクエリも指定できます。
+ WHERE condition: 削除する行を選択する条件を指定します。構文 1 では必須、構文 2 では省略可能です。
+ ORDER BY column: 行を削除する順序を指定します。通常、対象の行を制御するために LIMIT と併用します。
+ LIMIT [offset,] count: 削除する行数を制限します。ORDER BY と併用すると、並べ替え後の先頭 `count` 行を削除します。`offset` を指定した場合は、先頭の `offset` 行をスキップしてから削除します。ORDER BY を指定しない場合、削除対象の行は非決定的です。

#### 注意事項

1. AGGREGATE（UNIQUE）モデルを使用する場合は、キー列に対する条件のみを指定できます。
2. 選択したキー列がロールアップに存在しない場合、削除できません。
3. 構文 1 では、条件を「and」でのみ結合できます。「or」で結合したい場合は、条件を 2 つの DELETE 文に分ける必要があります。
4. 構文 1 でパーティションテーブルを使用する場合、パーティションを指定できます。指定しない場合、Doris は指定された条件からパーティションを推定します。次の 2 つの場合、Doris は条件からパーティションを推定できません。1) 条件にパーティション列が含まれていない場合、2) パーティション列の演算子が in でない場合。パーティションテーブルが Unique テーブルではなく、パーティションを指定していない場合、または条件からパーティションを推定できない場合、すべてのパーティションに DELETE 文を適用するには、セッション変数 delete_without_partition を true に設定する必要があります。

:::tip Tips
この機能は Apache Doris 1.2 以降でサポートされています。
:::

5. この文を実行すると、その後しばらくの間、クエリ効率が低下する可能性があります。影響の程度は、文に指定した削除条件の数によって異なります。条件が多いほど、影響も大きくなります。
6. 構文 2 で `WHERE` と `LIMIT` のどちらも指定しない場合、テーブル内のすべての行が削除されます。`WHERE` 句を省略する前に、必ず意図した削除範囲を確認してください。

## 例

例 1～3、6、7 では、次の準備で作成する `my_table` テーブルを使用します。このテーブルは、`p1` と `p2` の 2 つのパーティションを持つ、リストパーティション化された UNIQUE KEY テーブルです。

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

1. my_table のパーティション p1 から、列 k1 の値が 3 の行を削除します。

   ```sql
   DELETE FROM my_table PARTITION p1
       WHERE k1 = 3;
   ```

2. my_table のパーティション p1 から、列 k1 の値が 3 以上で、列 k2 の値が "abc" の行を削除します。

   ```sql
   DELETE FROM my_table PARTITION p1
   WHERE k1 >= 3 AND k2 = "abc";
   ```

3. my_table のパーティション p1 と p2 から、列 k1 の値が 3 以上で、列 k2 の値が "abc" の行を削除します。

   ```sql
   DELETE FROM my_table PARTITIONS (p1, p2)
   WHERE k1 >= 3 AND k2 = "abc";
   ```

4. `t2` と `t3` の結合結果を使用して `t1` から行を削除します。この形式の削除は UNIQUE KEY モデルのテーブルのみをサポートします。

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

   削除後に想定される `t1` の状態（`id = 1` の行だけが削除されます）:

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

7. ORDER BY、LIMIT、オフセットを使用し、k1 の順に先頭の 10 行をスキップして、次の 5 行を削除します。

   ```sql
   DELETE FROM my_table ORDER BY k1 ASC LIMIT 10, 5;
   ```

## キーワード

    DELETE

## ベストプラクティス

