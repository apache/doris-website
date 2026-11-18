---
{
    "title": "INSERT",
    "language": "ja",
    "description": "この文はデータの挿入を行います。"
}
---

## 説明 {#description}

この文はデータの挿入を行います。

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```

 パラメーター

> tablet_name: データのインポート先となるテーブル。`db_name.table_name` の形式でも指定できます
>
> partitions: インポート先のパーティション。`table_name` に存在するパーティションを指定する必要があります。複数のパーティション名はコンマで区切ります
>
> label: Insert タスクに指定するラベル
>
> column_name: 指定するインポート先の列。`table_name` に存在する列である必要があります
>
> expression: 列に代入する式
>
> DEFAULT: 対応する列のデフォルト値を使用します
>
> query: 通常のクエリ。クエリの結果が対象に書き込まれます
>
> hint: `INSERT` の実行動作を指定する指示子。`/*+ STREAMING */`、`/*+ SHUFFLE */`、`/*+ NOSHUFFLE */. のいずれかを選択できます
> 1. STREAMING: 現在は実際の効果がなく、以前のバージョンとの互換性のためだけに残されています。以前のバージョンではこの hint を追加するとラベルが返されましたが、現在はデフォルトでラベルが返されます
> 2. SHUFFLE: 対象テーブルがパーティションテーブルの場合、この hint を有効にすると再パーティション化が行われます
> 3. NOSHUFFLE: 対象テーブルがパーティションテーブルでも再パーティション化は行われません。ただし、データが各パーティションに正しく配置されるよう、ほかの処理が行われます

merge-on-write を有効にした Unique テーブルでは、insert 文を使用して部分列更新も実行できます。insert 文で部分列更新を行うには、セッション変数 enable_unique_key_partial_update を true に設定する必要があります。この変数のデフォルト値は false であり、デフォルトでは insert 文による部分列更新は許可されません。部分列更新を行う場合、挿入対象の列には、少なくともすべての Key 列と更新する列を含める必要があります。挿入する行の Key 列の値が元のテーブルにすでに存在する場合、同じ Key 列の値を持つ行のデータが更新されます。存在しない場合は、新しい行がテーブルに挿入されます。この場合、insert 文で指定しなかった列にはデフォルト値が設定されているか、NULL を許容する必要があります。指定されていない列には、まずデフォルト値が使用されます。デフォルト値がない列には NULL が設定されます。その列が NULL を許容しない場合、挿入は失敗します。

insert 文を厳格モードで実行するかどうかを制御するセッション変数 `enable_insert_strict` のデフォルト値は true です。つまり、insert 文はデフォルトで厳格モードで実行され、このモードでは部分列更新時に存在しない Key の更新は許可されません。そのため、insert 文による部分列更新で存在しない Key を挿入するには、`enable_unique_key_partial_update` を true に設定するとともに、`enable_insert_strict` を false に設定する必要があります。

注意:

`INSERT` 文の実行時には、文字列が長すぎるなど、対象テーブルの形式に適合しないデータはデフォルトで除外されます。ただし、データの除外を許容しない場合は、セッション変数 `enable_insert_strict` を `true` に設定することで、データが除外されたときに `INSERT` が成功しないようにできます。

## 例 {#example}

`test` テーブルには `c1` と `c2` の2つの列があります。

1. `test` テーブルに1行のデータをインポートする

```sql
INSERT INTO test VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT);
INSERT INTO test (c1) VALUES (1);
```

1番目と2番目の文は同じ結果になります。対象列を指定しない場合は、テーブル内の列の順序がデフォルトの対象列の順序として使用されます。
3番目と4番目の文も同じ意味で、`c2` 列のデフォルト値を使用してデータをインポートします。

2. `test` テーブルに複数行のデータを一度にインポートする

```sql
INSERT INTO test VALUES (1, 2), (3, 2 + 2);
INSERT INTO test (c1, c2) VALUES (1, 2), (3, 2 * 2);
INSERT INTO test (c1) VALUES (1), (3);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
```

1番目と2番目の文は同じ結果になり、`test` テーブルに2行のデータを一度にインポートします。
3番目と4番目の文も同じ結果になり、`c2` 列のデフォルト値を使用して `test` テーブルに2行のデータをインポートします。

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


## キーワード {#keywords}

    INSERT

## ベストプラクティス {#best-practice}

1. 返された結果を確認する

   INSERT 操作は同期処理であり、結果が返された時点で操作は終了しています。返された結果に応じて適切に処理してください。

   1. 実行に成功し、結果セットが空の場合

      insert に対応する select 文の結果セットが空の場合、次のように返されます。

      ```sql
      mysql> insert into tbl1 select * from empty_tbl;
      Query OK, 0 rows affected (0.02 sec)
      ```

      `Query OK` は実行が成功したことを示します。`0 rows affected` はデータがインポートされなかったことを示します。

   2. 実行に成功し、結果セットが空でない場合

      結果セットが空でない場合、返される結果は次のように分かれます。

      1. Insert の実行に成功し、データが可視になった場合:

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

         `Query OK` は実行が成功したことを示します。`4 rows affected` は合計4行のデータがインポートされたことを示します。`2 warnings` は除外された行数を示します。

         JSON 文字列も返されます。

         ```json
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         {'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
         ```

         `label` はユーザーが指定したラベル、または自動生成されたラベルです。ラベルは、この Insert Into インポートジョブの ID です。各インポートジョブには、同一データベース内で一意のラベルが付けられます。

         `status` はインポートしたデータが可視かどうかを示します。可視の場合は `visible`、不可視の場合は `committed` と表示されます。

         `txnId` は、この insert に対応するインポートトランザクションの ID です。

         `err` フィールドには、その他の予期しないエラーが表示されます。

         除外された行を確認するには、次の文を実行します。

         ```sql
         show load where label="xxx";
         ```

         返された結果に含まれる URL を使用して、エラーになったデータを確認できます。詳細は、後述の **エラー行の確認** を参照してください。

         **データが不可視なのは一時的な状態であり、このバッチのデータは最終的に可視になります**

         このバッチのデータが可視かどうかは、次の文で確認できます。

         ```sql
         show transaction where id=4005;
         ```

         返された結果の `TransactionStatus` 列が `visible` であれば、データは可視です。

   3. 実行に失敗した場合

      実行に失敗した場合、データは一切インポートされず、次のように返されます。

      ```sql
      mysql> insert into tbl1 select * from tbl2 where k1 = "a";
      ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=__shard_2/error_log_insert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0
      ```

      `ERROR 1064 (HY000): all partitions have no load data` は失敗の理由を示します。続く URL を使用すると、エラーになったデータを確認できます。

      ```sql
      show load warnings on "url";
      ```

      これにより、具体的なエラー行を確認できます。

2. タイムアウト時間

   INSERT 操作のタイムアウト時間は max(insert_timeout, query_timeout) によって決まります。どちらも環境変数で、insert_timeout のデフォルト値は4時間、query_timeout のデフォルト値は5分です。タイムアウト時間を超えると、ジョブはキャンセルされます。insert_timeout は、INSERT 文のデフォルトのタイムアウト時間を長くし、通常のクエリに適用される短いデフォルトのタイムアウト時間がインポートタスクに影響しないようにするために導入されました。

3. ラベルと原子性

   INSERT 操作でもインポートの原子性が保証されます。詳しくは、[インポートトランザクションと原子性](../../../../data-operate/transaction.md) を参照してください。

   insert 操作のクエリ部分に `CTE(Common Table Expressions)` を使用する場合は、`WITH LABEL` と `column` の部分を指定する必要があります。

4. 除外のしきい値

   INSERT は、ロードプロパティ `max_filter_ratio` ではなく、セッション変数 `insert_max_filter_ratio` を使用して除外のしきい値を制御します。`insert_max_filter_ratio` はバージョン2.1.5以降でサポートされ、値の範囲は0から1、デフォルト値は1.0です。`enable_insert_strict = false` の場合にのみ有効です。`INSERT INTO ... VALUES` と `INSERT INTO ... SELECT` に適用され、Doris テーブル、外部テーブル、ファイル TVF が対象に含まれます。`filtered_rows / (loaded_rows + filtered_rows)` がこの値を超えると、INSERT は失敗します。

   データが1行でも除外されたら失敗させるには、[セッション変数](../../session/variable/SET-VARIABLE) `enable_insert_strict` を `true`（デフォルト値）に設定します。この場合、行が1つでも除外されると INSERT は失敗します。除外のしきい値によって、SQL 解析エラーやデータソースへのアクセス失敗など、その他の実行エラーが抑制されることはありません。

5. パフォーマンス上の注意点

   `VALUES` を使用した単一行の挿入は推奨されません。この方法を使用する必要がある場合は、複数行のデータを1つの INSERT 文にまとめて一括コミットしてください。
