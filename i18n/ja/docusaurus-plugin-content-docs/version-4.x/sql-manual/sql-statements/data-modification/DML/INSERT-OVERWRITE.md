---
{
    "title": "INSERT OVERWRITE",
    "language": "ja",
    "description": "テーブル全体またはテーブルの一部のパーティションを上書きするステートメント"
}
---

## 説明

このステートメントは、テーブル全体またはテーブルの一部のパーティションを上書きします。

```sql
INSERT OVERWRITE table table_name
    [ PARTITION (p1, ... | *) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 パラメータ

> table_name: 上書き先のテーブル。既存のテーブルを指定します。`db_name.table_name` の形式でも指定できます。
>
> partitions: 上書きするテーブルのパーティション。次の 2 つの形式を使用できます。
>
> > 1. パーティション名。`table_name` に存在するパーティションをカンマで区切って指定します。
> > 2. アスタリスク (*)。[パーティションの自動検出](#overwrite-auto-detect-partition)を有効にします。書き込み対象のデータから該当するパーティションを自動検出し、それらを上書きします。この形式は Apache Doris 2.1.3 以降でサポートされています。
>
> label: INSERT タスクのラベルを指定します。
>
> column_name: 上書き先の列。`table_name` に存在する列を指定します。
>
> expression: 列に割り当てる式。
>
> DEFAULT: 列のデフォルト値を使用します。
>
> query: 通常のクエリ。その結果で上書き先を上書きします。
>
> hint: `INSERT` の実行動作を指定するヒント。`/*+ STREAMING */`、`/*+ SHUFFLE */`、`/*+ NOSHUFFLE */` のいずれかを指定できます。
>
> 1. STREAMING: 現在は実際の効果がなく、以前のバージョンとの互換性のために残されています。以前はこのヒントを指定するとラベルが返されましたが、現在はデフォルトでラベルが返されます。
> 2. SHUFFLE: 上書き先がパーティションテーブルの場合、データを再分配します。
> 3. NOSHUFFLE: 上書き先がパーティションテーブルでもデータを再分配しません。ただし、データを各パーティションに正しく配置するための別の処理が行われます。

注意:

1. 現在のバージョンでは、セッション変数 `enable_insert_strict` はデフォルトで `true` です。`INSERT OVERWRITE` の実行中に、上書き対象のパーティションの条件を満たさないデータなど、上書き先テーブルの形式に合わないデータが除外されると、上書きは失敗します。
2. `INSERT OVERWRITE` は、まず新しいテーブルを作成して上書きするデータを挿入し、次に古いテーブルを新しいテーブルでアトミックに置き換えてテーブル名を変更します。そのため、テーブルの上書きが完了するまでは、古いテーブルのデータに通常どおりアクセスできます。

### 自動パーティションテーブルの場合

INSERT OVERWRITE の対象が自動パーティションテーブルの場合、動作は[セッション変数](../../session/variable/SET-VARIABLE.md) `enable_auto_create_when_overwrite` によって次のように決まります。

1. PARTITION を指定しない場合（テーブル全体を上書きする場合）、`enable_auto_create_when_overwrite` が `true` であれば、テーブルを上書きし、対応するパーティションがないデータに対してテーブルの自動パーティション化ルールに従ってパーティションを作成し、そのデータを取り込みます。`enable_auto_create_when_overwrite` が `false` であれば、対応するパーティションがないデータはエラー行として蓄積され、最終的に失敗します。
2. 上書きする PARTITION を指定した場合、この処理中は自動パーティションテーブルが通常のパーティションテーブルとして動作します。既存のパーティションの条件を満たさないデータは、新しいパーティションを作成せずに除外されます。
3. PARTITION に `partition(*)`（パーティションを自動検出して上書き）を指定した場合、`enable_auto_create_when_overwrite` が `true` であれば、対応するパーティションがあるデータについてはそのパーティションを上書きし、対象外の既存パーティションは変更しません。同時に、対応するパーティションがないデータについては、テーブルの自動パーティション化ルールに従ってパーティションを作成し、データを取り込みます。`enable_auto_create_when_overwrite` が `false` であれば、対応するパーティションがないデータはエラー行として蓄積され、最終的に失敗します。

`enable_auto_create_when_overwrite` が存在しないバージョンでは、この変数の値が `false` の場合と同じ動作になります。

動作の概要を次の表に示します。

1. `enable_auto_create_when_overwrite` を有効にした自動パーティションテーブル:

|    | 上書きするパーティション | その他のパーティションを消去 | 対応するパーティションがないデータ用のパーティションを自動作成 |
|-|-|-|-|
| PARTITION 指定なし（テーブル全体） | すべて | √ | √ |
| パーティションを指定 | 明示的に指定したパーティション | × | × |
| `partition(*)` | データが属するパーティション | × | √ |

2. 通常のテーブル、および `enable_auto_create_when_overwrite` を無効にした自動パーティションテーブル:

|    | 上書きするパーティション | その他のパーティションを消去 | 対応するパーティションがないデータ用のパーティションを自動作成 |
|-|-|-|-|
| PARTITION 指定なし（テーブル全体） | すべて | √ | × |
| パーティションを指定 | 明示的に指定したパーティション | × | × |
| `partition(*)` | データが属するパーティション | × | × |

次に例を示します。

```sql
mysql> create table auto_list(
    ->              k0 varchar null
    ->          )
    ->          auto partition by list (k0)
    ->          (
    ->              PARTITION p1 values in (("Beijing"), ("BEIJING")),
    ->              PARTITION p2 values in (("Shanghai"), ("SHANGHAI")),
    ->              PARTITION p3 values in (("xxx"), ("XXX")),
    ->              PARTITION p4 values in (("list"), ("LIST")),
    ->              PARTITION p5 values in (("1234567"), ("7654321"))
    ->          )
    ->          DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    ->          properties("replication_num" = "1");
Query OK, 0 rows affected (0.14 sec)

mysql> insert into auto_list values ("Beijing"),("Shanghai"),("xxx"),("list"),("1234567");
Query OK, 5 rows affected (0.22 sec)

mysql> insert overwrite table auto_list partition(*) values ("BEIJING"), ("new1");
Query OK, 2 rows affected (0.28 sec)

mysql> select * from auto_list;
+----------+ --- p1 is overwritten, new1 gets the new partition, and the other partitions remain unchanged.
| k0       |
+----------+
| 1234567  |
| BEIJING  |
| list     |
| xxx      |
| new1     |
| Shanghai |
+----------+
6 rows in set (0.48 sec)

mysql> insert overwrite table auto_list values ("SHANGHAI"), ("new2");
Query OK, 2 rows affected (0.17 sec)

mysql> select * from auto_list;
+----------+ --- The whole table is overwritten, and new2 gets the new partition.
| k0       |
+----------+
| new2     |
| SHANGHAI |
+----------+
2 rows in set (0.15 sec)
```

## 例

`test` というテーブルがあるとします。このテーブルには `c1` と `c2` の 2 つの列、および `p1` と `p2` の 2 つのパーティションがあります。

```sql
CREATE TABLE IF NOT EXISTS test (
  `c1` int NOT NULL DEFAULT "1",
  `c2` int NOT NULL DEFAULT "4"
) ENGINE=OLAP
UNIQUE KEY(`c1`)
PARTITION BY LIST (`c1`)
(
PARTITION p1 VALUES IN ("1","2","3"),
PARTITION p2 VALUES IN ("4","5","6")
)
DISTRIBUTED BY HASH(`c1`) BUCKETS 3
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1",
  "in_memory" = "false",
  "storage_format" = "V2"
);
```

後述するクエリによる上書きでは、もう 1 つのテーブル `test2` を参照します。このテーブルは同じ `(c1, c2)` の列構成を持つため、`INSERT OVERWRITE test SELECT * FROM test2` を実行できます。

```sql
CREATE TABLE IF NOT EXISTS test2 (
  `c1` int NOT NULL,
  `c2` int NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c1`) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO test2 VALUES (1, 10), (2, 20);
```

### テーブルの上書き

1. `test` テーブルを `VALUES` 形式で上書きします。

   ```sql
   // Single-row overwrite.
   INSERT OVERWRITE table test VALUES (1, 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, DEFAULT);
   INSERT OVERWRITE table test (c1) VALUES (1);
   // Multi-row overwrite.
   INSERT OVERWRITE table test VALUES (1, 2), (3, 2 + 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, 2), (3, 2 * 2);
   INSERT OVERWRITE table test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
   INSERT OVERWRITE table test (c1) VALUES (1), (3);
   ```

- 1 番目と 2 番目のステートメントは同じ結果になります。上書き時に対象の列を指定しない場合、テーブルの列順が使用されます。上書きに成功すると、`test` テーブルには 1 行だけが残ります。
- 3 番目と 4 番目のステートメントは同じ結果になります。指定しなかった列 `c2` にはデフォルト値の 4 が設定されます。上書きに成功すると、`test` テーブルには 1 行だけが残ります。
- 5 番目と 6 番目のステートメントは同じ結果になります。ステートメントでは `2+2` や `2*2` などの式を使用できます。式は実行時に計算され、その結果が `test` テーブルに書き込まれます。上書きに成功すると、`test` テーブルには 2 行が残ります。
- 7 番目と 8 番目のステートメントは同じ結果になります。指定しなかった列 `c2` にはデフォルト値の 4 が設定されます。上書きに成功すると、`test` テーブルには 2 行が残ります。

2. クエリを使用して `test` テーブルを上書きします。`test2` テーブルと `test` テーブルのデータ形式は一致している必要があります。一致しない場合は、暗黙の型変換が行われます。

   ```sql
   INSERT OVERWRITE table test SELECT * FROM test2;
   INSERT OVERWRITE table test (c1, c2) SELECT * from test2;
   ```

- 1 番目と 2 番目のステートメントは同じ結果になります。`test2` テーブルから取得したデータで `test` テーブルを上書きします。上書きに成功すると、`test` テーブルのデータは `test2` テーブルのデータと一致します。

3. ラベルを指定して `test` テーブルを上書きします。

   ```sql
   INSERT OVERWRITE table test WITH LABEL `label1` SELECT * FROM test2;
   INSERT OVERWRITE table test WITH LABEL `label2` (c1, c2) SELECT * from test2;
   ```

- `SHOW LOAD;` コマンドで、この `label` によるロードジョブの状態を確認できます。ラベルは一意である必要があります。

### テーブルのパーティションの上書き

INSERT OVERWRITE でパーティションを上書きするときは、実際には次の 3 つのステップを単一のトランザクションにまとめて実行します。途中で失敗した場合、実行済みの操作はロールバックされます。

1. パーティション `p1` を上書きする場合、まず対象のパーティションと同じ構造を持つ空の一時パーティション `pTMP` を作成します。
2. `pTMP` にデータを書き込みます。
3. `p1` を `pTMP` でアトミックに置き換えます。

次に例を示します。

1. `P1` と `P2` のパーティションを、`test` テーブルに対する `VALUES` 形式のステートメントで上書きします。

   ```sql
   // Single-row overwrite.
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (1, 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, DEFAULT);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1) VALUES (1);
   // Multi-row overwrite.
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (1, 2), (4, 2 + 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, 2), (4, 2 * 2);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) VALUES (1, DEFAULT), (4, DEFAULT);
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1) VALUES (1), (4);
   ```

   これらのステートメントは、テーブル全体ではなく、テーブル内のパーティションを上書きします。パーティションは 1 つずつ上書きすることも、複数まとめて上書きすることもできます。対応するパーティションの条件を満たすデータだけが正常に書き込まれます。上書きするデータに、指定したどのパーティションの条件も満たさないデータが含まれている場合、上書きは失敗します。失敗する例を次に示します。

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (7, 2);
   ```

   このステートメントのデータ (`c1=7`) はパーティション `P1` と `P2` の条件を満たさないため、上書きは失敗します。

2. パーティション `P1` と `P2` を、`test` テーブルに対するクエリで上書きします。`test2` テーブルと `test` テーブルのデータ形式は一致している必要があります。一致しない場合は、暗黙の型変換が行われます。

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) SELECT * from test2;
   ```

3. パーティション `P1` と `P2` を、`test` テーブルでラベルを指定して上書きします。

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label3` SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label4` (c1, c2) SELECT * from test2;
   ```

### パーティションの自動検出と上書き

> この機能はバージョン 2.1.3 以降で使用できます。

INSERT OVERWRITE コマンドの PARTITION 句に `PARTITION(*)` を指定すると、データが属するパーティションを自動的に検出して上書きします。例を次に示します。

```sql
mysql> create table test(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p10 values less than (10),
    -> PARTITION p100 values less than (100),
    -> PARTITION pMAX values less than (maxvalue)
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.11 sec)

mysql> insert into test values (1), (2), (15), (100), (200);
Query OK, 5 rows affected (0.29 sec)

mysql> select * from test order by k0;
+------+
| k0   |
+------+
|    1 |
|    2 |
|   15 |
|  100 |
|  200 |
+------+
5 rows in set (0.23 sec)

mysql> insert overwrite table test partition(*) values (3), (1234);
Query OK, 2 rows affected (0.24 sec)

mysql> select * from test order by k0;
+------+
| k0   |
+------+
|    3 |
|   15 |
| 1234 |
+------+
3 rows in set (0.20 sec)
```

この例では、データ 3 と 1234 が属するパーティション `p10` と `pMAX` のデータがすべて上書きされ、パーティション `p100` は変更されません。この操作は、INSERT OVERWRITE で PARTITION 句を使って上書きするパーティションを明示的に指定する構文を簡略化したもので、[パーティションを指定して上書きする場合](#overwrite-table-partition)と同じ方法で実装されています。`PARTITION(*)` を使用すると、多数のパーティションを上書きするときに、すべてのパーティション名を手動で指定する必要がありません。

## キーワード

INSERT OVERWRITE, OVERWRITE, AUTO DETECT
