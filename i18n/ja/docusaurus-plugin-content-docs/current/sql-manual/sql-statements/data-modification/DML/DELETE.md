---
{
  "title": "DELETE",
  "language": "ja",
  "description": "このステートメントは、指定されたテーブル（base index）パーティションのデータを条件付きで削除するために使用されます。"
}
---
## 説明

このステートメントは、指定されたテーブル（base index）パーティション内のデータを条件付きで削除するために使用されます。

この操作では、このbase indexに関連するrollup indexのデータも削除されます。

#### 構文

構文1：この構文ではフィルタ述語のみを指定できます

```SQL
DELETE FROM table_name [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
WHERE
column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```
構文2：この構文はUNIQUE KEYモデルでのみ使用できます

```sql
[cte]
DELETE FROM table_name
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition
```
#### 必須パラメータ

+ table_name: 行が削除されるテーブルを指定します。
+ column_name: table_nameに属するカラム
+ op: 論理比較演算子。opのオプションタイプには以下が含まれます: =, >, <, >=, <=, !=, in, not in
+ value | value_list: 論理比較に使用される値または値のリスト
+ WHERE条件: 削除対象の行を選択するために使用する条件を指定します

#### オプションパラメータ

+ cte: Common Table Expression、例：'WITH a AS SELECT * FROM tbl'。
+ PARTITION partition_name | PARTITIONS (partition_name [, partition_name]): 削除対象の行を選択するパーティションまたは複数のパーティションを指定します
+ table_alias: テーブルのエイリアス
+ USING additional_tables: WHERE句で削除対象の行を特定するために追加のテーブルを参照する必要がある場合は、USING句でそれらのテーブル名を指定します。USING句を使用して、削除対象の行を特定するサブクエリを指定することもできます。

#### 注意

1. AGGREGATE (UNIQUE)モデルを使用する場合は、キーカラムに対する条件のみ指定できます。
2. 選択されたキーカラムがrollupに存在しない場合、削除を実行できません。
3. 構文1を使用する場合、条件は「and」関係のみ持つことができます。「or」関係を実現したい場合は、2つのDELETE文で条件を記述する必要があります。
4. 構文1では、パーティション化されたテーブルの場合、パーティションを指定できます。指定されていない場合、Dorisは指定された条件からパーティションを推測します。Dorisが条件からパーティションを推測できない場合が2つあります：1) 条件にパーティションカラムが含まれていない; 2) パーティションカラムの演算子がinではない。パーティション化されたテーブルがUniqueテーブルではなく、パーティションが指定されていない、または条件からパーティションを推測できない場合、すべてのパーティションにdelete文を適用するには、セッション変数delete_without_partitionをtrueにする必要があります。

:::tip Tips
この機能はApache Doris 1.2バージョン以降でサポートされています
:::

5. このステートメントは、実行後しばらくの間クエリ効率を低下させる可能性があります。影響の度合いは、ステートメントで指定された削除条件の数に依存します。指定する条件が多いほど、影響は大きくなります。

## 例

1. my_tableパーティションp1でk1カラムの値が3であるデータ行を削除

   ```sql
   DELETE FROM my_table PARTITION p1
       WHERE k1 = 3;
   ```
2. my_tableパーティションp1で、列k1の値が3以上かつ列k2の値が"abc"であるデータ行を削除する

   ```sql
   DELETE FROM my_table PARTITION p1
   WHERE k1 >= 3 AND k2 = "abc";
   ```
3. my_tableのパーティションp1、p2において、列k1の値が3以上かつ列k2の値が"abc"であるデータ行を削除する

   ```sql
   DELETE FROM my_table PARTITIONS (p1, p2)
   WHERE k1 >= 3 AND k2 = "abc";
   ```
4. `t2`と`t3`の結合結果を使用して`t1`から行を削除する。削除テーブルはユニークキーモデルのみをサポートする

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
期待される結果は、テーブルt1でid = 1の行のみを削除することです

   ```
   +----+----+----+--------+------------+
   | id | c1 | c2 | c3     | c4         |
   +----+----+----+--------+------------+
   | 2  | 2  | 2  |    2.0 | 2000-01-02 |
   | 3  | 3  | 3  |    3.0 | 2000-01-03 |
   +----+----+----+--------+------------+
   ```
5. cteを使用する

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
## キーワード

    DELETE

## ベストプラクティス
