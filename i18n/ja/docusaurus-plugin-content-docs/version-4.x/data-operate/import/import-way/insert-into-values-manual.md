---
{
    "title": "Insert Into Values によるデータの挿入",
    "language": "ja",
    "description": "INSERT INTO VALUES 文を使用し、SQL のインラインデータを Doris テーブルに同期的かつ原子的にデータロードします。機能検証、デモ、少量データの取り込みに適しています。",
    "keywords": [
        "INSERT INTO VALUES",
        "Doris synchronous load",
        "SQL write to Doris",
        "atomic load",
        "group commit",
        "insert_max_filter_ratio",
        "enable_insert_strict",
        "insert_load_default_timeout_second"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Feature validation / Demo / Small-batch data ingestion -->

INSERT INTO VALUES 文は、SQL のインライン値を Doris テーブルにデータロードします。これは**同期データロード方式**であり、実行後に結果が直接返されるため、応答からデータロードの成否を判断できます。この方式ではデータロードタスクの**原子性**が保証されます。すべてのデータが正常にロードされるか、まったくロードされないかのどちらかです。

## ユースケース {#use-cases}

INSERT INTO VALUES は、次の用途を想定しています。

| 用途 | 説明 |
| --- | --- |
| 機能検証 / デモ | 少量のモックデータをロードして Doris の機能を検証します。構文は MySQL と同じです。 |
| 少量データの取り込み | 同時実行数とデータ量が少ない場合に使用します。 |

:::tip パフォーマンスに関するヒント
INSERT INTO VALUES を同時実行する際の性能は、コミット段階のボトルネックによって制限されます。データ量が多い場合は、[Group Commit](../load-best-practices/group-commit-manual.md) を有効にすると、より高いスループットを得られます。
:::

## 動作の仕組み {#how-it-works}

INSERT INTO VALUES は、MySQL プロトコルを通じて FE ノードにジョブを送信し、実行します。全体の流れは次のとおりです。

1. クライアントが MySQL プロトコルを通じて INSERT INTO VALUES 文を FE に送信します。
2. FE が実行計画を生成します。前半にはクエリ関連の演算子が含まれ、最後の演算子である `OlapTableSink` がクエリ結果を対象テーブルに書き込みます。
3. FE が実行計画を BE ノードに配布して実行させ、BE の中から **Coordinator** ノードを選択します。
4. Coordinator ノードがデータを受け取り、ほかの BE ノードに分配して書き込みを完了します。

## クイックスタート {#quick-start}

INSERT INTO VALUES は MySQL プロトコルを通じて送信されます。以下では MySQL コマンドラインを使用して、送信から実行までの流れを示します。構文の詳細は [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) を参照してください。

### 前提条件 {#prerequisites}

INSERT INTO VALUES を実行するには、対象テーブルに対する **INSERT 権限**が必要です。現在のユーザーに権限がない場合は、[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) コマンドで付与してください。

### データロードジョブの作成 {#create-a-load-job}

#### ステップ 1：対象テーブルを作成する {#step-1-create-the-target-table}

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### ステップ 2：INSERT INTO VALUES を実行してデータを書き込む {#step-2-run-insert-into-values-to-write-data}

:::caution 本番環境での使用は推奨しません
INSERT INTO VALUES は通常、デモやテストでのみ使用します。本番環境でのデータ取り込みには推奨しません。
:::

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

同期データロード方式のため、結果はクライアントに直接返されます。

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

#### ステップ 3：ロードされたデータを確認する {#step-3-verify-the-loaded-data}

```sql
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```

### データロードジョブの確認 {#view-the-load-job}

完了した INSERT INTO VALUES ジョブは、`SHOW LOAD` コマンドで確認できます。

```sql
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

### データロードジョブのキャンセル {#cancel-the-load-job}

MySQL クライアントでは、`Ctrl-C` を使用して実行中の INSERT INTO VALUES ジョブをキャンセルできます。

## リファレンス {#reference}

### データロードコマンドの構文 {#load-command-syntax}

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

:::note
INSERT INTO VALUES は通常、デモでのみ使用します。本番環境での使用は推奨しません。
:::

### データロードの設定パラメータ {#load-configuration-parameters}

#### FE の設定 {#fe-configuration}

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400（4 時間） | データロードタスクのタイムアウト時間を秒単位で指定します。この時間内にタスクが完了しない場合、システムがキャンセルし、ステータスは `CANCELLED` に変わります。 |

#### セッション変数 {#session-variables}

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| `insert_timeout` | 14400（4 時間） | INSERT INTO を SQL 文として実行する際のタイムアウト時間を秒単位で指定します。 |
| `enable_insert_strict` | true | `true` に設定すると、不適格なデータが見つかった場合にデータロードが失敗します。`false` に設定すると、不適格な行は無視され、少なくとも 1 行が正しくロードされれば成功とみなされます。バージョン 2.1.4 以前では、INSERT INTO でエラー率を制御できません。このパラメータで選択できるのは、データ品質を厳密に検査するか、エラーデータを完全に無視するかのいずれかです。 |
| `insert_max_filter_ratio` | 1.0 | バージョン 2.1.5 以降でサポートされ、`enable_insert_strict = false` の場合にのみ有効です。`INSERT INTO ... VALUES` と `INSERT INTO ... SELECT` でフィルタリングされる行の最大割合を制御します。Doris テーブル、外部テーブル、S3、HDFS、LOCAL などのファイル TVF からのクエリも対象です。設定範囲は 0 から 1 で、デフォルトは 1.0 です。`filtered_rows / (loaded_rows + filtered_rows)` がこの値を超えると、INSERT は失敗します。1.0 を指定するとすべての行のフィルタリングが許容されますが、ほかの実行エラーは抑制されません。 |

:::info データが不適格と判定される主な原因
ソース列の長さが対象列の長さを超えている、列の型が一致しない、パーティションが一致しない、列の順序が一致しない、といった原因があります。
:::

### データロードの戻り値 {#load-return-values}

INSERT INTO VALUES は SQL 文です。戻り値には、次のフィールドを持つ JSON 文字列が含まれます。

| パラメータ | 説明 |
| -------- | ------------------------------------------------------------ |
| `Label`  | データロードジョブのラベルです。`INSERT INTO tbl WITH LABEL label ...` で指定できます。 |
| `Status` | ロードされたデータの可視性を示すステータスです。<br />- `visible`：データロードに成功し、データが可視になっています。<br />- `committed`：データロードは完了しています。データが可視になるまで遅延が生じる場合がありますが、再試行は不要です。<br />- `Label Already Exists`：ラベルが重複しているため、別のラベルに変更する必要があります。<br />- `Fail`：データロードに失敗しました。 |
| `Err`    | データロードのエラーメッセージです。 |
| `TxnId`  | データロードトランザクションの ID です。 |

代表的な戻り値の例を以下に示します。

#### シナリオ 1：INSERT が正常に実行された場合 {#scenario-1-insert-executed-successfully}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

- `Query OK`：文が正常に実行されたことを示します。
- `5 rows affected`：合計 5 行がロードされたことを示します。

#### シナリオ 2：警告を伴って INSERT が正常に実行された場合 {#scenario-2-insert-executed-successfully-with-warnings}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

- `Query OK`：文が正常に実行されたことを示します。
- `4 rows affected`：合計 4 行がロードされたことを示します。
- `1 warnings`：1 行がフィルタリングされたことを示します。

フィルタリングされた行は、[SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md) 文で確認できます。結果の `URL` を使用してエラーデータを照会できます。詳しくは後述の[エラー行の確認](#view-error-rows)を参照してください。

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

#### シナリオ 3：INSERT は正常に実行されたが、ステータスが committed の場合 {#scenario-3-insert-executed-successfully-but-status-is-committed}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

データが見えないのは一時的な状態で、このバッチのデータは最終的に可視になります。[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md) 文で可視性を確認できます。`TransactionStatus` 列が `VISIBLE` になれば、データは可視です。

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

#### シナリオ 4：INSERT の実行に失敗した場合 {#scenario-4-insert-execution-failed}

実行に失敗すると、データはまったくロードされません。

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` は失敗の理由を示します。
- 末尾の url を使用してエラーデータを照会できます。詳しくは後述の[エラー行の確認](#view-error-rows)を参照してください。

## ベストプラクティス {#best-practices}

### データ量 {#data-volume}

INSERT INTO VALUES は通常、テストやデモで使用します。大量のデータのロードには**推奨しません**。大量のデータを書き込む場合は、[Group Commit](../load-best-practices/group-commit-manual.md) またはほかのバッチデータロード方式を使用してください。

### エラー行の確認 {#view-error-rows}

INSERT INTO の戻り値に `url` フィールドがある場合、次のコマンドでエラー行を確認できます。

```sql
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

主なエラー原因は次のとおりです。

- ソース列の長さが対象列の長さを超えている。
- 列の型が一致しない。
- パーティションが一致しない。
- 列の順序が一致しない。

INSERT INTO がエラー行を無視するかどうかは、セッション変数 `enable_insert_strict` で制御します。

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1：INSERT INTO VALUES は同期方式ですか、非同期方式ですか？**

A：同期方式です。文の実行後にデータロード結果が直接返されるため、追加のポーリングは不要です。

**Q2：INSERT INTO VALUES では原子性が保証されますか？**

A：はい。同一の INSERT INTO VALUES に含まれるデータは、すべて正常にロードされるか、すべて失敗するかのどちらかです。一部のみが書き込まれることはありません。

**Q3：返されたステータスが `COMMITTED` の場合、データロードに失敗したという意味ですか？**

A：いいえ。`COMMITTED` はデータロードが完了し、データがまもなく可視になることを示します。再試行は不要です。`SHOW TRANSACTION` で `TransactionStatus` を確認し、`VISIBLE` になるまで待ってください。

**Q4：`Insert has too many filtered data` と報告されるのはなぜですか？**

A：`enable_insert_strict=false` の場合、フィルタリングされたデータの割合が `insert_max_filter_ratio` で設定したしきい値を超えたためです。`insert_max_filter_ratio` の設定を緩めるか、ソースデータがテーブルスキーマに適合しているかを確認してください。列の型や NULL の許可設定などを確認します。

**Q5：大量のデータをロードするには、どの方式を使用すべきですか？**

A：INSERT INTO VALUES は、同時実行数やデータ量が多い場合、コミット段階のボトルネックによって制限されます。[Group Commit](../load-best-practices/group-commit-manual.md) を有効にするか、Stream Load や Broker Load などの専用のデータロード方式を選択してください。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| エラー `null value for not null column` | NOT NULL 列に NULL 値を挿入しました。 | ソースデータを修正するか、対象列で NULL を許可するように変更します。 |
| エラー `Insert has too many filtered data` | フィルタリングされた行の割合が `insert_max_filter_ratio` を超えています。 | `insert_max_filter_ratio` のしきい値を上げるか、ソースデータを修正します。 |
| エラー `Label Already Exists` | 指定したラベルがすでに使用されています。 | 別のラベルを使用するか、ラベルを指定せずにシステムに自動生成させます。 |
| タスクが長時間実行され、完了前にキャンセルされる。 | `insert_load_default_timeout_second` または `insert_timeout` を超えています。 | 対応するタイムアウトパラメータを大きくするか、データロードを複数のバッチに分割します。 |
| 同時実行数が多いとスループットが低い。 | コミット段階のボトルネックによって制限されています。 | [Group Commit](../load-best-practices/group-commit-manual.md) を有効にします。 |

## その他のヘルプ {#more-help}

INSERT INTO の構文の詳細は、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md) コマンドのマニュアルを参照してください。MySQL クライアントのコマンドラインで `HELP INSERT` と入力して、さらに詳しいヘルプを表示することもできます。
