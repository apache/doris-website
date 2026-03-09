---
{
  "title": "INSERT INTO VALUES",
  "language": "ja",
  "description": "INSERT INTO VALUES文は、SQLから値をDorisテーブルにインポートすることをサポートします。INSERT INTO VALUESは同期インポート方式です。"
}
---
INSERT INTO VALUES文は、SQLからDorisテーブルに値をインポートすることをサポートしています。INSERT INTO VALUESは同期インポート方式で、インポート実行後にインポート結果が返されます。インポートが成功したかどうかは、返された結果に基づいて判断できます。INSERT INTO VALUESはインポートタスクの原子性を保証し、すべてのデータが正常にインポートされるか、まったくインポートされないかのどちらかになります。

## 適用シナリオ

1. ユーザーがDorisシステムの機能を検証するために、少数のテストデータレコードのみをインポートしたい場合、INSERT INTO VALUES構文が適用できます。これはMySQL構文に似ています。ただし、本番環境でINSERT INTO VALUESを使用することは推奨されません。
2. 並行INSERT INTO VALUESジョブのパフォーマンスは、commit段階でボトルネックになります。大量のデータをロードする場合、[group commit](../../../data-operate/import/group-commit-manual)を有効にして高いパフォーマンスを実現できます。

## 実装

INSERT INTO VALUESを使用する際、インポートジョブはMySQLプロトコルを使用してFEノードに開始・送信される必要があります。FEは実行プランを生成し、これにはクエリ関連演算子が含まれ、最後の演算子がOlapTableSinkです。OlapTableSink演算子は、クエリ結果をターゲットテーブルに書き込む責任があります。実行プランはその後、実行のためにBEノードに送信されます。DorisはCoordinatorとして1つのBEノードを指定し、そのノードがデータを受信して他のBEノードに分散します。

## 開始方法

INSERT INTO VALUESジョブは、MySQLプロトコルを使用して送信・転送されます。以下の例では、MySQLコマンドラインインターフェースを通じてINSERT INTO VALUESを使用してインポートジョブを送信する方法を示しています。

### 準備

INSERT INTO VALUESには、ターゲットテーブルに対するINSERT権限が必要です。GRANTコマンドを使用してユーザーアカウントに権限を付与できます。

### INSERT INTO VALUESジョブの作成

**INSERT INTO VALUES**

1. ソーステーブルを作成

```SQL
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
2. `INSERT INTO VALUES`を使用してソーステーブルにデータをインポートします（本番環境では推奨されません）。

```SQL
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```
INSERT INTO VALUESは同期インポート方式であり、インポート結果が直接ユーザーに返されます。

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```
3. インポートされたデータを表示します。

```SQL
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```
### INSERT INTO VALUES ジョブの表示

完了した INSERT INTO VALUES タスクを表示するには、`SHOW LOAD` コマンドを使用できます。

```SQL
mysql> SHOW LOAD FROM testdb\G
*************************** 1. row ***************************
         JobId: 77172
         Label: label_26eebc33411f441c_b2b286730d495e2c
         State: FINISHED
      Progress: Unknown id: 77172
          Type: INSERT
       EtlInfo: NULL
      TaskInfo: cluster:N/A; timeout(s):14400; max_filter_ratio:0.0
      ErrorMsg: NULL
    CreateTime: 2024-11-20 16:44:08
  EtlStartTime: 2024-11-20 16:44:08
 EtlFinishTime: 2024-11-20 16:44:08
 LoadStartTime: 2024-11-20 16:44:08
LoadFinishTime: 2024-11-20 16:44:08
           URL: 
    JobDetails: {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0}
 TransactionId: 61071
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```
### INSERT INTO VALUES ジョブのキャンセル

現在実行中のINSERT INTO VALUES ジョブは Ctrl-C でキャンセルできます。

## マニュアル

### 構文

INSERT INTO VALUES は通常、テスト目的で使用されます。本番環境での使用は推奨されません。

```SQL
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```
### パラメーター設定

**FE Config**

| 名前 | デフォルト値 | 説明 |
| --- | --- | --- |
| insert_load_default_timeout_second | 14400s (4 hours) | インポートタスクのタイムアウト（秒単位）。インポートタスクがこのタイムアウト期間内に完了しない場合、システムによってキャンセルされ、`CANCELLED`としてマークされます。 |

**Session Variable**

| 名前 | デフォルト値 | 説明 |
| --- | --- | --- |
| insert_timeout | 14400s (4 hours) | SQLステートメントとしてのINSERT INTOのタイムアウト（秒単位）。 |
| enable_insert_strict | true | これがtrueに設定されている場合、タスクが無効なデータを含む際にINSERT INTOは失敗します。falseに設定されている場合、INSERT INTOは無効な行を無視し、少なくとも1行が正常にインポートされる限りインポートは成功したと見なされます。バージョン2.1.4まで。INSERT INTOはエラー率を制御できないため、このパラメーターはデータ品質を厳密にチェックするか、無効なデータを完全に無視するために使用されます。データ無効性の一般的な理由には、ソースデータの列長が宛先列長を超える、列タイプの不一致、パーティションの不一致、列順序の不一致が含まれます。 |
| insert_max_filter_ratio | 1.0 | バージョン2.1.5以降。`enable_insert_strict`がfalseの場合のみ有効。`INSERT INTO FROM S3/HDFS/LOCAL()`を使用する際のエラー許容度を制御するために使用されます。デフォルト値は1.0で、すべてのエラーが許容されることを意味します。0と1の間の小数にすることができます。エラー行数がこの比率を超えた場合、INSERTタスクは失敗することを意味します。 |

### 戻り値

INSERT INTO VALUESはSQLステートメントであり、その結果としてJSON文字列を返します。

JSON文字列内のパラメーター：

| パラメーター | 説明                                                  |
| --------- | ------------------------------------------------------------ |
| Label     | インポートジョブのラベル：「INSERT INTO tbl WITH LABEL label...」を使用して指定できます |
| Status    | インポートされたデータの可視性：可視化されている場合は「visible」と表示されます。そうでない場合は「committed」と表示されます。「committed」状態では、インポートは完了していますが、データが可視化されるまでに遅延がある可能性があります。この場合、再試行の必要はありません。`visible`：インポートが成功し、データが可視化されています。`committed`：インポートは完了していますが、データが可視化されるまでに遅延がある可能性があります。この場合、再試行の必要はありません。Label Already Exists：指定されたラベルが既に存在するため、別のラベルに変更する必要があります。Fail：インポートが失敗しました。 |
| Err       | エラーメッセージ                                                |
| TxnId     | インポートトランザクションのID                                 |

**成功したINSERT**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```
`Query OK`は実行が成功したことを示します。`5 rows affected`は合計5行のデータがインポートされたことを示します。

**警告付きの成功したINSERT**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```
`Query OK`は実行が成功したことを示します。`4 rows affected`は合計4行のデータがインポートされたことを示します。`1 warnings`はフィルタリングされた行数を示します。

フィルタリングされた行を確認するには、[SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD)文を使用できます。

このステートメントの結果には、エラーデータを照会するために使用できるURLが含まれます。詳細については、以下の「エラー行の確認」セクションを参照してください。

```sql
mysql> SHOW LOAD WHERE label="label_a8d99ae931194d2b_93357aac59981a18"\G
*************************** 1. row ***************************
         JobId: 77158
         Label: label_a8d99ae931194d2b_93357aac59981a18
         State: FINISHED
      Progress: Unknown id: 77158
          Type: INSERT
       EtlInfo: NULL
      TaskInfo: cluster:N/A; timeout(s):14400; max_filter_ratio:0.0
      ErrorMsg: NULL
    CreateTime: 2024-11-20 16:35:40
  EtlStartTime: 2024-11-20 16:35:40
 EtlFinishTime: 2024-11-20 16:35:40
 LoadStartTime: 2024-11-20 16:35:40
LoadFinishTime: 2024-11-20 16:35:40
           URL: http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19
    JobDetails: {"Unfinished backends":{},"ScannedRows":0,"TaskNumber":0,"LoadBytes":0,"All backends":{},"FileNumber":0,"FileSize":0}
 TransactionId: 61068
  ErrorTablets: {}
          User: root
       Comment: 
1 row in set (0.00 sec)
```
**コミット済みステータスでのINSERTの成功**

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```
データの非表示状態は一時的なもので、データは最終的に表示されるようになります。

[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md)文を使用して、データのバッチの表示ステータスを確認できます。

結果の`TransactionStatus`列が`visible`の場合、データが表示されていることを示します。

```sql
mysql> SHOW TRANSACTION WHERE id=61074\G
*************************** 1. row ***************************
     TransactionId: 61074
             Label: label_78bf5396d9594d4d_a8d9a914af40f73d
       Coordinator: FE: 10.16.10.7
 TransactionStatus: VISIBLE
 LoadJobSourceType: INSERT_STREAMING
       PrepareTime: 2024-11-20 16:51:54
     PreCommitTime: NULL
        CommitTime: 2024-11-20 16:51:54
       PublishTime: 2024-11-20 16:51:54
        FinishTime: 2024-11-20 16:51:54
            Reason: 
ErrorReplicasCount: 0
        ListenerId: -1
         TimeoutMs: 14400000
            ErrMsg: 
1 row in set (0.00 sec)
```
**空でない結果セットだがINSERTに失敗**

実行の失敗は、データが正常にインポートされなかったことを意味します。エラーメッセージが返されます：

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```
`ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.`は失敗の根本原因を示しています。エラーメッセージに提供されたURLを使用してエラーデータを特定できます。詳細については、下記の「エラー行の表示」セクションを参照してください。

## ベストプラクティス

### データサイズ

INSERT INTO VALUESは通常テストやデモに使用され、INSERT INTO VALUESで大量のデータをロードすることは推奨されません。

### エラー行の表示

INSERT INTOの結果にURLフィールドが含まれている場合、以下のコマンドを使用してエラー行を表示できます：

```SQL
SHOW LOAD WARNINGS ON "url";
```
例：

```sql
mysql> SHOW LOAD WARNINGS ON "http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19"\G
*************************** 1. row ***************************
         JobId: -1
         Label: NULL
ErrorMsgDetail: Reason: column_name[user_id], null value for not null column, type=BIGINT. src line []; 
1 row in set (0.00 sec)
```
エラーの一般的な原因には、ソースデータのカラム長が宛先カラム長を超過する場合、カラム型の不一致、パーティションの不一致、カラム順序の不一致が含まれます。

環境変数`enable_insert_strict`を設定することで、INSERT INTOがエラー行を無視するかどうかを制御できます。

## More help

INSERT INTOの詳細な構文については、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT)コマンドマニュアルを参照してください。また、MySQLクライアントのコマンドラインで`HELP INSERT`と入力することで、さらなる情報を得ることもできます。
