---
{
    "title": "INSERT",
    "language": "ja",
    "description": "INSERT 文はデータの挿入操作を実行します。"
}
---

## 説明

INSERT 文はデータの挿入操作を実行します。

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 パラメータ

> tablet_name: データのインポート先となるテーブル。`db_name.table_name` の形式でも指定できます。
>
> partitions: インポート先のパーティションを指定します。`table_name` に存在するパーティションでなければなりません。複数のパーティション名はカンマで区切ります。
>
> label: INSERT タスクのラベルを指定します。
>
> column_name: インポート先の列を指定します。`table_name` に存在する列でなければなりません。
>
> expression: 対応する列に代入する式。
>
> DEFAULT: 対応する列のデフォルト値を使用します。
>
> query: 一般的なクエリ。その結果が対象テーブルに書き込まれます。
>
> hint: `INSERT` の実行動作を指定するヒント。次のいずれかを選択できます: `/*+ STREAMING */`、`/*+ SHUFFLE */`、`/*+ NOSHUFFLE */.
> 1. STREAMING: 現在は実際の効果がなく、以前のバージョンとの互換性のために残されています。（以前のバージョンでは、このヒントを追加するとラベルが返されましたが、現在はデフォルトでラベルが返されます。）
> 2. SHUFFLE: 対象テーブルがパーティションテーブルの場合、このヒントを有効にすると再パーティション化が行われます。
> 3. NOSHUFFLE: 対象テーブルがパーティションテーブルでも再パーティション化は行われません。ただし、データを各パーティションへ正しく配置するための処理は行われます。

merge-on-write が有効な Unique テーブルでは、INSERT 文を使用して一部の列だけを更新することもできます。INSERT 文で一部の列を更新するには、セッション変数 enable_unique_key_partial_update を true に設定する必要があります（デフォルトは false で、一部の列の更新は許可されません）。一部の列を更新する場合、挿入対象の列には少なくともすべての Key 列と、更新する列を含める必要があります。挿入する行の Key 列の値が元のテーブルにすでに存在する場合、同じ Key 列の値を持つ行のデータが更新されます。存在しない場合は、新しい行がテーブルに挿入されます。この場合、INSERT 文で指定しなかった列にはデフォルト値が設定されているか、NULL が許可されている必要があります。指定しなかった列には、まずデフォルト値が使用されます。デフォルト値がない列には NULL が設定されます。NULL を許可しない列がある場合、挿入は失敗します。

INSERT 文が厳格モードで動作するかどうかを制御するセッション変数 `enable_insert_strict` のデフォルト値は true です。つまり、INSERT 文はデフォルトで厳格モードになり、このモードでは一部の列の更新時に存在しない Key の行を挿入できません。そのため、INSERT 文で一部の列を更新し、存在しない Key の行も挿入する場合は、`enable_unique_key_partial_update` を true に設定すると同時に、`enable_insert_strict` を false に設定する必要があります。

注意:

`INSERT` 文の実行時には、文字列が長すぎる場合など、対象テーブルの形式に合わないデータはデフォルトで除外されます。ただし、データを除外したくない場合は、セッション変数 `enable_insert_strict` を `true` に設定すると、データが除外されたときに `INSERT` が失敗するようにできます。

## 例

`test` テーブルには `c1` と `c2` の二つの列があります。

1. `test` テーブルに一行のデータをインポートする

```sql
INSERT INTO test VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT);
INSERT INTO test (c1) VALUES (1);
```

一番目と二番目の文は同じ結果になります。対象列を指定しない場合、テーブル内の列順がデフォルトの対象列順として使用されます。
三番目と四番目の文も同じ意味で、`c2` 列のデフォルト値を使用してデータをインポートします。

2. `test` テーブルに複数行のデータを一度にインポートする

```sql
INSERT INTO test VALUES (1, 2), (3, 2 + 2);
INSERT INTO test (c1, c2) VALUES (1, 2), (3, 2 * 2);
INSERT INTO test (c1) VALUES (1), (3);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
```

一番目と二番目の文は同じ結果になり、`test` テーブルに二行のデータを一度にインポートします。
三番目と四番目の文も同じ結果になり、`c2` 列のデフォルト値を使用して `test` テーブルに二行のデータをインポートします。

3. クエリ結果を `test` テーブルにインポートする

```sql
INSERT INTO test SELECT * FROM test2;
INSERT INTO test (c1, c2) SELECT * from test2;
```

4. パーティションとラベルを指定して、クエリ結果を `test` テーブルにインポートする

```sql
INSERT INTO test PARTITION(p1, p2) WITH LABEL `label1` SELECT * FROM test2;
INSERT INTO test WITH LABEL `label1` (c1, c2) SELECT * from test2;
```


## キーワード

    INSERT

## ベストプラクティス

1. 返された結果を確認する

   INSERT 操作は同期操作であり、結果が返された時点で操作は終了しています。返された結果に応じて、適切な処理を行う必要があります。

   1. 実行が成功し、結果セットが空の場合

      INSERT に対応する SELECT 文の結果セットが空の場合、次のように返されます。

      ```sql
      mysql> insert into tbl1 select * from empty_tbl;
      Query OK, 0 rows affected (0.02 sec)
      ```

      `Query OK` は実行の成功を示します。`0 rows affected` はデータがインポートされなかったことを示します。

   2. 実行が成功し、結果セットが空でない場合

      結果セットが空でない場合、次のような結果が返されます。

      1. INSERT が正常に実行され、データが参照可能な場合:

         ```sql
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 4 rows affected (0.38 sec)
         {'label':'insert_8510c568-9eda-4173-9e36-6adc7d35291c', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 with label my_label1 select * from tbl2;
         Query OK, 4 rows affected (0.38 sec)
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 2 rows affected, 2 warnings (0.31 sec)
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'visible', 'txnId':'4005'}
         
         mysql> insert into tbl1 select * from tbl2;
         Query OK, 2 rows affected, 2 warnings (0.31 sec)
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         ```

         `Query OK` は実行の成功を示します。`4 rows affected` は合計 4 行のデータがインポートされたことを示します。`2 warnings` は除外された行数を示します。

         JSON 文字列も返されます。

         ```json
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         {'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
         ```

         `label` はユーザーが指定したラベル、または自動生成されたラベルです。ラベルは INSERT INTO インポートジョブの ID です。各インポートジョブのラベルは、一つのデータベース内で一意です。

         `status` はインポートしたデータが参照可能かどうかを示します。参照可能な場合は `visible`、そうでない場合は `committed` と表示されます。

         `txnId` は、この INSERT に対応するインポートトランザクションの ID です。

         `err` フィールドには、その他の予期しないエラーが表示されます。

         除外された行を確認するには、次の文を実行します。

         ```sql
         show load where label="xxx";
         ```

         返された結果に含まれる URL を使用して、エラーデータを確認できます。詳しくは、後述の「エラー行の確認」を参照してください。

         **データが参照できない状態は一時的なものです。このバッチのデータは最終的に参照可能になります。**

         次の文で、このバッチのデータが参照可能かどうかを確認できます。

         ```sql
         show transaction where id=4005;
         ```

         返された結果の `TransactionStatus` 列が `visible` の場合、データは参照可能です。

   3. 実行が失敗した場合

      実行に失敗した場合、データはインポートされず、次の結果が返されます。

      ```sql
      mysql> insert into tbl1 select * from tbl2 where k1 = "a";
      ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=__shard_2/error_log_insert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0
      ```

      `ERROR 1064 (HY000): all partitions have no load data` は失敗の理由を示します。続く URL を使用してエラーデータを確認できます。

      ```sql
      show load warnings on "url";
      ```

      具体的なエラー行を確認できます。

2. タイムアウト時間

   INSERT 操作のタイムアウトは、max(insert_timeout, query_timeout) で決まります。どちらも環境変数で、insert_timeout のデフォルト値は 4 時間、query_timeout のデフォルト値は 5 分です。操作がタイムアウトを超えると、ジョブはキャンセルされます。insert_timeout は、INSERT 文のデフォルトのタイムアウトを長くし、通常のクエリに適用される短いデフォルトのタイムアウトがインポートタスクに影響しないようにするために導入されました。

3. ラベルと原子性

   INSERT 操作でもインポートの原子性が保証されます。詳しくは、[インポートトランザクションと原子性](../../../../data-operate/transaction.md)を参照してください。

   `CTE(Common Table Expressions)` を INSERT 操作のクエリ部分に使用する場合は、`WITH LABEL` 部分と `column` 部分を指定する必要があります。

4. 除外率のしきい値

   他のインポート方法とは異なり、INSERT 操作では除外率のしきい値（`max_filter_ratio`）を指定できません。デフォルトのしきい値は 1 で、エラーのある行を無視できることを意味します。

   データを除外したくない場合は、[セッション変数](../../session/variable/SET-VARIABLE) `enable_insert_strict` を `true` に設定すると、データが除外されたときに `INSERT` が失敗するようにできます。

5. パフォーマンスに関する注意

   `VALUES` を使って一行ずつ挿入するのは避けてください。この方法を使う必要がある場合は、複数行のデータを一つの INSERT 文にまとめて一括でコミットしてください。
