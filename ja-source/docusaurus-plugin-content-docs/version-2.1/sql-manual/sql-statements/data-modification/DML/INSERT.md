---
{
  "title": "挿入",
  "language": "ja",
  "description": "変更文はデータ挿入操作を完了することです。"
}
---
## 説明

変更ステートメントは、データ挿入操作を完了するためのものです。

```sql
INSERT INTO table_name
    [ PARTITION (p1, ...) ]
    [ WITH LABEL label]
    [ (column [, ...]) ]
    [ [ hint [, ...] ] ]
    { VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
```
パラメータ

> tablet_name: データをインポートする対象テーブル。`db_name.table_name`の形式で指定できます
>
> partitions: インポートするパーティションを指定します。`table_name`に存在するパーティションである必要があります。複数のパーティション名はカンマで区切ります
>
> label: Insertタスクのラベルを指定します
>
> column_name: 指定する対象列。`table_name`に存在する列である必要があります
>
> expression: 列に割り当てる必要がある対応する式
>
> DEFAULT: 対応する列にデフォルト値を使用させます
>
> query: 一般的なクエリ。クエリの結果が対象に書き込まれます
>
> hint: `INSERT`の実行動作を示すために使用される指標。次の値のいずれかを選択できます：`/*+ STREAMING */`、`/*+ SHUFFLE */`、または`/*+ NOSHUFFLE */`
> 1. STREAMING: 現在、実際の効果はなく、以前のバージョンとの互換性のためにのみ保持されています。（以前のバージョンでは、このhintを追加するとラベルが返されましたが、現在はデフォルトでラベルが返されます）
> 2. SHUFFLE: 対象テーブルがパーティションテーブルの場合、このhintを有効にするとrepartiitонが実行されます。
> 3. NOSHUFFLE: 対象テーブルがパーティションテーブルであってもrepartiitонは実行されませんが、データが各パーティションに正しく配置されることを保証するために他の操作が実行されます。

merge-on-writeが有効なUniqueテーブルの場合、insert文を使用して部分列更新も実行できます。insert文で部分列更新を実行するには、セッション変数enable_unique_key_partial_updateをtrue に設定する必要があります（この変数のデフォルト値はfalseで、デフォルトではinsert文による部分列更新は許可されていません）。部分列更新を実行する場合、挿入される列は少なくともすべてのKey列を含み、更新したい列を指定する必要があります。挿入される行のKey列の値が元のテーブルに既に存在する場合、同じキー列値を持つ行のデータが更新されます。挿入される行のKey列の値が元のテーブルに存在しない場合、新しい行がテーブルに挿入されます。この場合、insert文で指定されていない列は、デフォルト値を持つかnull許可である必要があります。これらの欠落している列は、まずデフォルト値で埋められ、列にデフォルト値がない場合はnullで埋められます。列がnullを許可しない場合、insert操作は失敗します。

insert文が厳密モードで動作するかどうかを制御するセッション変数`enable_insert_strict`のデフォルト値はtrueであることに注意してください。つまり、insert文はデフォルトで厳密モードになっており、このモードでは部分列更新における存在しないキーの更新は許可されません。したがって、insert文を部分列更新に使用し、存在しないキーを挿入したい場合は、`enable_unique_key_partial_update`をtrueに設定し、同時に`enable_insert_strict`をfalseに設定する必要があります。

注意：

`INSERT`文を実行する場合、デフォルトの動作では、文字列が長すぎるなど、対象テーブルの形式に適合しないデータがフィルタリングされます。ただし、データをフィルタリングしないことが求められるビジネスシナリオでは、セッション変数`enable_insert_strict`を`true`に設定することで、データがフィルタリングされた場合に`INSERT`が正常に実行されないことを保証できます。

## 例

`test`テーブルには`c1`、`c2`の2つの列が含まれています。

1. `test`テーブルに1行のデータをインポートします

```sql
INSERT INTO test VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, 2);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT);
INSERT INTO test (c1) VALUES (1);
```
最初と2番目のステートメントは同じ効果があります。対象列が指定されていない場合、テーブル内の列順序がデフォルトの対象列として使用されます。
3番目と4番目のステートメントは同じ意味を表現しており、`c2`列のデフォルト値を使用してデータインポートを完了します。

2. 複数行のデータを`test`テーブルに一度にインポートする

```sql
INSERT INTO test VALUES (1, 2), (3, 2 + 2);
INSERT INTO test (c1, c2) VALUES (1, 2), (3, 2 * 2);
INSERT INTO test (c1) VALUES (1), (3);
INSERT INTO test (c1, c2) VALUES (1, DEFAULT), (3, DEFAULT);
```
最初と2番目のステートメントは同じ効果を持ち、2つのデータを一度に`test`テーブルにインポートします
3番目と4番目のステートメントの効果は既知であり、`c2`列のデフォルト値を使用して2つのデータを`test`テーブルにインポートします

3. クエリ結果を`test`テーブルにインポートする

```sql
INSERT INTO test SELECT * FROM test2;
INSERT INTO test (c1, c2) SELECT * from test2;
```
4. クエリ結果を`test`テーブルにインポートし、パーティションとラベルを指定する

```sql
INSERT INTO test PARTITION(p1, p2) WITH LABEL `label1` SELECT * FROM test2;
INSERT INTO test WITH LABEL `label1` (c1, c2) SELECT * from test2;
```
## Keywords

    INSERT

## ベストプラクティス

1. 戻り値の結果を確認する

   INSERT操作は同期操作であり、結果の戻りは操作の終了を示します。ユーザーは異なる戻り値の結果に応じて対応する処理を実行する必要があります。

   1. 実行が成功し、結果セットが空の場合

      select文に対応するinsertの結果セットが空の場合、以下のように戻ります：

      ```sql
      mysql> insert into tbl1 select * from empty_tbl;
      Query OK, 0 rows affected (0.02 sec)
      ```
`Query OK` は実行が成功したことを示します。`0 rows affected` は、データがインポートされなかったことを意味します。

   2. 実行が成功し、結果セットが空ではない

      結果セットが空ではない場合。返される結果は以下の状況に分かれます：

      1. Insertが正常に実行され、可視である：

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
`Query OK`は正常に実行されたことを示します。`4 rows affected`は合計4行のデータがインポートされたことを意味します。`2 warnings`はフィルタされる行数を示します。

         またjson文字列を返します：

         ```json
         {'label':'my_label1', 'status':'visible', 'txnId':'4005'}
         {'label':'insert_f0747f0e-7a35-46e2-affa-13a235f4020d', 'status':'committed', 'txnId':'4005'}
         {'label':'my_label1', 'status':'visible', 'txnId':'4005', 'err':'some other error'}
         ```
`label`はユーザーが指定したラベルまたは自動生成されたラベルです。LabelはこのInsert IntoインポートジョブのIDです。各インポートジョブは単一のデータベース内で一意のLabelを持ちます。

         `status`はインポートされたデータが表示可能かどうかを示します。表示可能な場合は`visible`、表示不可能な場合は`committed`を表示します。

         `txnId`はこのinsertに対応するインポートトランザクションのidです。

         `err`フィールドはその他の予期しないエラーを表示します。

         フィルタリングされた行を表示する必要がある場合、ユーザーは以下のステートメントを渡すことができます

         ```sql
         show load where label="xxx";
         ```
返却された結果のURLは、間違ったデータをクエリするために使用できます。詳細については、後述の**エラー行の表示**の概要を参照してください。

         **データの不可視性は一時的な状態であり、このバッチのデータは最終的に可視化されます**

         以下のステートメントで、このバッチのデータの可視ステータスを確認できます：

         ```sql
         show transaction where id=4005;
         ```
返却結果の`TransactionStatus`カラムが`visible`の場合、表現データは可視状態です。

   3. 実行失敗

      実行失敗は、データのインポートが成功しなかったことを示し、以下が返却されます：

      ```sql
      mysql> insert into tbl1 select * from tbl2 where k1 = "a";
      ERROR 1064 (HY000): all partitions have no load data. url: http://10.74.167.16:8042/api/_load_error_log?file=__shard_2/error_log_insert_stmt_ba8bb9e158e4879-ae8de8507c0bf8a2_ba8bb9e158e4879_ae8de8507c0
      ```
`ERROR 1064 (HY000): all partitions have no load data`は失敗の理由を示しています。以下のURLを使用して間違ったデータをクエリできます：

      ```sql
      show load warnings on "url";
      ```
特定のエラー行を確認できます。

2. タイムアウト時間

    INSERT操作のタイムアウトは、max(insert_timeout, query_timeout)によって制御されます。両方とも環境変数であり、insert_timeoutのデフォルトは4時間、query_timeoutのデフォルトは5分です。操作がタイムアウトを超えた場合、ジョブはキャンセルされます。insert_timeoutの導入は、INSERT文がより長いデフォルトタイムアウトを持つことを保証し、通常のクエリに適用される短いデフォルトタイムアウトによってインポートタスクが影響を受けないようにするためです。

3. ラベルと原子性

   INSERT操作はインポートの原子性も保証します。[Import Transactions and Atomicity](../../../../data-operate/transaction.md)ドキュメントを参照してください。

   insert操作でクエリ部分として`CTE(Common Table Expressions)`を使用する場合、`WITH LABEL`と`column`の部分を指定する必要があります。

4. フィルタ閾値

   他のインポート方法とは異なり、INSERT操作ではフィルタ閾値（`max_filter_ratio`）を指定できません。デフォルトのフィルタ閾値は1で、これはエラーのある行を無視できることを意味します。

   データがフィルタリングされないことを要求するビジネスシナリオでは、[session variable](../../session/variable/SET-VARIABLE) `enable_insert_strict`を`true`に設定することで、データがフィルタリングされた場合に`INSERT`が正常に実行されないことを保証できます。

5. パフォーマンスの問題

   `VALUES`方式を使用した単一行挿入は行わないでください。この方法を使用する必要がある場合は、複数行のデータを1つのINSERT文にまとめて一括コミットしてください。
