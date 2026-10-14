---
{
    "title": "INSERT OVERWRITE",
    "language": "ja",
    "description": "この文は、テーブル全体またはテーブル内の一部のパーティションを上書きします"
}
---

## 説明

この文は、テーブル全体またはテーブル内の一部のパーティションを上書きします。

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
> partitions: 上書きするテーブルのパーティション。次の二つの形式をサポートします。
>
> > 1. パーティション名。`table_name` に存在するパーティションの名前をカンマで区切って指定します。
> > 2. アスタリスク（*）。[上書き対象パーティションの自動検出](#overwrite-auto-detect-partition)を有効にします。書き込み対象のデータから関連するパーティションを自動的に検出し、それらを上書きします。この形式は Apache Doris 2.1.3 以降でサポートされています。
>
> label: INSERT タスクに付けるラベル。
>
> column_name: 上書き先の列。`table_name` に存在する列を指定します。
>
> expression: 列に代入する式。
>
> DEFAULT: 列のデフォルト値を使用します。
>
> query: 一般的なクエリ。その結果で対象を上書きします。
>
> hint: `INSERT` の実行動作を指定するヒント。`/*+ STREAMING */`、`/*+ SHUFFLE */`、`/*+ NOSHUFFLE */` のいずれかを指定できます。
>
> 1. STREAMING: 現在は実際の効果はなく、以前のバージョンとの互換性のために残されています。以前のバージョンではこのヒントを付けるとラベルが返されましたが、現在はデフォルトでラベルが返されます。
> 2. SHUFFLE: 対象テーブルがパーティションテーブルの場合、再パーティション化を実行します。
> 3. NOSHUFFLE: 対象テーブルがパーティションテーブルでも再パーティション化は実行しません。ただし、データを各パーティションに正しく格納するためのほかの処理は実行します。

注意事項:

1. 現行バージョンでは、セッション変数 `enable_insert_strict` はデフォルトで `true` です。`INSERT OVERWRITE` の実行中に対象テーブルの形式に適合しないデータが除外される場合、対象テーブルの上書きは失敗します。たとえば、パーティションを上書きするときに、すべてのデータがパーティション条件を満たすとは限らない場合です。
2. `INSERT OVERWRITE` 文は、まず新しいテーブルを作成し、上書きするデータをその新しいテーブルに挿入した後、古いテーブルを新しいテーブルにアトミックに置き換えて名前を変更します。そのため、テーブルの上書き中も、完了するまでは古いテーブルのデータに通常どおりアクセスできます。

### 自動パーティションテーブルの場合

INSERT OVERWRITE の対象が自動パーティションテーブルの場合、動作は[セッション変数](../../session/variable/SET-VARIABLE.md) `enable_auto_create_when_overwrite` によって次のように制御されます。

1. PARTITION を指定しない場合（テーブル全体を上書きする場合）、`enable_auto_create_when_overwrite` が `true` であれば、対応するパーティションがないデータに対してテーブルの自動パーティション化ルールに従ってパーティションを作成し、そのデータを受け入れます。`enable_auto_create_when_overwrite` が `false` であれば、対応するパーティションが見つからないデータはエラー行として蓄積され、最終的に処理が失敗します。
2. 上書き対象の PARTITION を指定した場合、この処理中の自動パーティションテーブルは通常のパーティションテーブルと同じように動作します。既存のパーティションの条件を満たさないデータは、新しいパーティションを作成せずに除外されます。
3. PARTITION に `partition(*)` を指定した場合（パーティションを自動検出して上書きする場合）、`enable_auto_create_when_overwrite` が `true` であれば、対応するパーティションが既にあるデータについてはそのパーティションを上書きし、それ以外の既存のパーティションは変更しません。同時に、対応するパーティションがないデータについては、テーブルの自動パーティション化ルールに従ってパーティションを作成し、データを格納します。`enable_auto_create_when_overwrite` が `false` であれば、対応するパーティションが見つからないデータはエラー行として蓄積され、最終的に処理が失敗します。

`enable_auto_create_when_overwrite` が存在しないバージョンでは、この変数の値が `false` の場合と同じ動作になります。

動作をまとめると、次のようになります。

1. `enable_auto_create_when_overwrite` が有効な自動パーティションテーブル:

|    | 上書きするパーティション | その他のパーティションの削除 | 対応するパーティションがないデータ用の自動作成 |
|-|-|-|-|
| PARTITION 指定なし（テーブル全体） | すべて | √ | √ |
| パーティションを指定 | 明示的に指定したパーティション | × | × |
| `partition(*)` | データが属するパーティション | × | √ |

2. 通常のテーブル、および `enable_auto_create_when_overwrite` が無効な自動パーティションテーブル:

|    | 上書きするパーティション | その他のパーティションの削除 | 対応するパーティションがないデータ用の自動作成 |
|-|-|-|-|
| PARTITION 指定なし（テーブル全体） | すべて | √ | × |
| パーティションを指定 | 明示的に指定したパーティション | × | × |
| `partition(*)` | データが属するパーティション | × | × |

以下に例を示します。

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

`test` という名前のテーブルがあるとします。このテーブルには、`c1` と `c2` の二つの列、および `p1` と `p2` の二つのパーティションがあります。

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

- 一番目と二番目の文は同じ結果になります。上書き時に対象列を指定しない場合は、テーブル内の列の順序がデフォルトの対象列順序として使用されます。上書きに成功すると、`test` テーブルには一行のデータだけが残ります。
- 三番目と四番目の文は同じ結果になります。指定されていない列 `c2` には、デフォルト値の 4 が設定されます。上書きに成功すると、`test` テーブルには一行のデータだけが残ります。
- 五番目と六番目の文は同じ結果になります。文中では `2+2` や `2*2` のような式を使用できます。式の結果は文の実行中に計算され、`test` テーブルに書き込まれます。上書きに成功すると、`test` テーブルには二行のデータが残ります。
- 七番目と八番目の文は同じ結果になります。指定されていない列 `c2` には、デフォルト値の 4 が設定されます。上書きに成功すると、`test` テーブルには二行のデータが残ります。

2. クエリ形式で `test` テーブルを上書きします。`test2` テーブルと `test` テーブルのデータ形式は一致している必要があります。一致しない場合は、暗黙のデータ型変換が行われます。

   ```sql
   INSERT OVERWRITE table test SELECT * FROM test2;
   INSERT OVERWRITE table test (c1, c2) SELECT * from test2;
   ```

- 一番目と二番目の文は同じ結果になります。これらの文は `test2` テーブルからデータを取得し、取得したデータで `test` テーブルを上書きします。上書きに成功すると、`test` テーブルのデータは `test2` テーブルのデータと一致します。

3. ラベルを指定して `test` テーブルを上書きします。

   ```sql
   INSERT OVERWRITE table test WITH LABEL `label1` SELECT * FROM test2;
   INSERT OVERWRITE table test WITH LABEL `label2` (c1, c2) SELECT * from test2;
   ```

- `SHOW LOAD;` コマンドを使用して、この `label` でインポートされたジョブの状態を確認できます。ラベルは一意である必要があります。

### テーブルのパーティションの上書き {#overwrite-table-partition}

INSERT OVERWRITE でパーティションを書き換えるときは、実際には次の三つのステップを一つのトランザクションにまとめて実行します。途中で失敗した場合、実行済みの操作はロールバックされます。

1. パーティション `p1` を書き換える場合、まず対象のパーティションと同じ構造を持つ空の一時パーティション `pTMP` を作成します。
2. `pTMP` にデータを書き込みます。
3. `p1` を `pTMP` にアトミックに置き換えます。

以下に例を示します。

1. パーティション `P1` と `P2` を持つ `test` テーブルで、`VALUES` 形式を使用してそれらを上書きします。

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

   テーブル全体の上書きとは異なり、上記の文はテーブル内のパーティションを上書きします。パーティションは一つずつ上書きすることも、複数を一度に上書きすることもできます。対応するパーティションの絞り込み条件を満たすデータだけが正常に書き込まれます。書き込むデータに、指定したどのパーティションの条件も満たさないデータが含まれていると、上書きは失敗します。失敗する例を以下に示します。

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) VALUES (7, 2);
   ```

   上記の文で書き込むデータ（`c1=7`）はパーティション `P1` と `P2` の条件を満たさないため、上書きは失敗します。

2. パーティション `P1` と `P2` を、`test` テーブル内でクエリ形式により上書きします。`test2` テーブルと `test` テーブルのデータ形式は一致している必要があります。一致しない場合は、暗黙のデータ型変換が行われます。

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) (c1, c2) SELECT * from test2;
   ```

3. パーティション `P1` と `P2` を、`test` テーブル内でラベルを指定して上書きします。

   ```sql
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label3` SELECT * FROM test2;
   INSERT OVERWRITE table test PARTITION(p1,p2) WITH LABEL `label4` (c1, c2) SELECT * from test2;
   ```

### 上書き対象パーティションの自動検出 {#overwrite-auto-detect-partition}

> この機能はバージョン 2.1.3 以降で使用できます。

INSERT OVERWRITE コマンドの PARTITION 句に `PARTITION(*)` を指定すると、データが属するパーティションを自動的に検出して上書きします。例を示します。

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

この例では、値 3 と 1234 が属するパーティション `p10` と `pMAX` の全データが上書きされ、パーティション `p100` は変更されません。この操作は、INSERT OVERWRITE で PARTITION 句に上書き対象のパーティションを明示的に指定する操作の構文上の簡略化とみなせます。実装方法も[パーティションを指定した上書き](#overwrite-table-partition)と同じです。`PARTITION(*)` 構文を使うと、多数のパーティションを上書きする際に、すべてのパーティション名を手動で列挙する必要がなくなります。

## キーワード

INSERT OVERWRITE, OVERWRITE, AUTO DETECT
