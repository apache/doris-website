---
{
    "title": "INSERT INTO VALUES",
    "language": "ja",
    "description": "INSERT INTO VALUES 文を使用して、SQL に直接記述したデータを Doris のテーブルに同期的かつアトミックにロードします。機能検証、デモ、少量のデータ取り込みに適しています。",
    "keywords": [
        "INSERT INTO VALUES",
        "Doris の同期ロード",
        "SQL による Doris への書き込み",
        "アトミックなロード",
        "Group Commit",
        "insert_max_filter_ratio",
        "enable_insert_strict",
        "insert_load_default_timeout_second"
    ]
}
---

<!-- Knowledge type: Procedure / Configuration parameters -->
<!-- Applicable scenarios: Feature validation / Demo / Small-batch data ingestion -->

INSERT INTO VALUES 文は、SQL に直接記述した値を Doris のテーブルにロードします。これは**同期ロード方式**で、実行後にロード結果を直接返すため、応答から成功したかどうかを確認できます。この方式はロードタスクの**アトミック性**を保証します。データはすべて正常にロードされるか、まったくロードされないかのいずれかです。

## ユースケース {#use-cases}

INSERT INTO VALUES は、次の二つの用途を想定しています。

| 用途 | 説明 |
| --- | --- |
| 機能検証とデモ | 少量のサンプルデータをロードして Doris の機能を検証します。構文は MySQL と同じです。 |
| 少量のデータ取り込み | 同時実行数が少なく、データ量も少ない場合に使用します。 |

:::tip パフォーマンスに関するヒント
INSERT INTO VALUES を同時実行する場合、コミット段階がスループットのボトルネックになります。データ量が多い場合は、[Group Commit](../load-best-practices/group-commit-manual.md) を有効にしてスループットを向上させてください。
:::

## 動作の仕組み {#how-it-works}

INSERT INTO VALUES は MySQL プロトコルを介して FE ノードにジョブを送り、実行します。全体の流れは次のとおりです。

1. クライアントが MySQL プロトコルを介して INSERT INTO VALUES 文を FE に送信します。
2. FE が実行計画を生成します。前半にはクエリ関連のオペレーターが含まれ、最後のオペレーターである `OlapTableSink` がクエリ結果を対象テーブルに書き込みます。
3. FE が実行計画を BE ノードに配布して実行させ、一つの BE を **Coordinator** ノードとして選択します。
4. Coordinator ノードがデータを受け取り、ほかの BE ノードに分配して書き込みを完了します。

## クイックスタート {#quick-start}

INSERT INTO VALUES は MySQL プロトコルを介して送信されます。次の例では、MySQL コマンドラインを使って送信から結果の確認までを示します。構文の詳細については、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) を参照してください。

### 前提条件 {#prerequisites}

INSERT INTO VALUES の実行には、対象テーブルに対する **INSERT 権限**が必要です。現在のユーザーに権限がない場合は、[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) コマンドで付与してください。

### ロードジョブの作成 {#create-a-load-job}

#### ステップ 1: 対象テーブルを作成する {#step-1-create-the-target-table}

```sql
CREATE TABLE testdb.test_table(
    user_id            BIGINT       NOT NULL COMMENT "user id",
    name               VARCHAR(20)           COMMENT "name",
    age                INT                   COMMENT "age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

#### ステップ 2: INSERT INTO VALUES でデータを書き込む {#step-2-run-insert-into-values-to-write-data}

:::caution 本番環境での使用は非推奨
INSERT INTO VALUES は通常、デモやテストにのみ使用します。本番環境でのデータ取り込みには推奨しません。
:::

```sql
INSERT INTO testdb.test_table (user_id, name, age)
VALUES (1, "Emily", 25),
       (2, "Benjamin", 35),
       (3, "Olivia", 28),
       (4, "Alexander", 60),
       (5, "Ava", 17);
```

同期ロード方式のため、結果はクライアントに直接返されます。

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

#### ステップ 3: ロードされたデータを確認する {#step-3-verify-the-loaded-data}

```sql
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```

### ロードジョブの確認 {#view-the-load-job}

完了した INSERT INTO VALUES ジョブを確認するには、`SHOW LOAD` コマンドを使用します。

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

### ロードジョブのキャンセル {#cancel-the-load-job}

実行中の INSERT INTO VALUES ジョブをキャンセルするには、MySQL クライアントで `Ctrl-C` を使用します。

## リファレンス {#reference}

### ロードコマンドの構文 {#load-command-syntax}

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

:::note
INSERT INTO VALUES は通常デモにのみ使用し、本番環境での使用は推奨しません。
:::

### ロード設定パラメーター {#load-configuration-parameters}

#### FE 設定 {#fe-configuration}

| パラメーター | デフォルト値 | 説明 |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400（4 時間） | ロードタスクのタイムアウト（秒）。この時間内にロードタスクが完了しなければ、システムがキャンセルし、ステータスは `CANCELLED` に変わります。 |

#### セッション変数 {#session-variables}

| パラメーター | デフォルト値 | 説明 |
| --- | --- | --- |
| `insert_timeout` | 14400（4 時間） | INSERT INTO を SQL 文として実行する際のタイムアウト（秒）。 |
| `enable_insert_strict` | true | `true` に設定すると、不適合なデータが一件でもあればロードは失敗します。`false` に設定すると、不適合な行は無視され、少なくとも一行が正しくロードされればロードは成功と見なされます。バージョン 2.1.4 以前では、INSERT INTO でエラー率を制御できません。このパラメーターで指定できるのは、厳格なデータ品質チェックか、エラーデータの完全な無視のいずれかです。 |
| `insert_max_filter_ratio` | 1.0 | バージョン 2.1.5 以降でサポートされます。**`enable_insert_strict=false` の場合にのみ有効です。** `INSERT INTO FROM S3/HDFS/LOCAL()` のエラー許容率を制御します。値の範囲は 0 から 1 です。デフォルトの 1.0 は、すべてのエラーを許容することを意味します。エラー行の割合がこの値を超えると、INSERT タスクは失敗します。 |

:::info 不適合なデータの主な原因
ソースの列の長さが対象列の長さを超える、列の型が一致しない、パーティションが一致しない、列の順序が一致しない、などです。
:::

### ロードの戻り値 {#load-return-values}

INSERT INTO VALUES は SQL 文です。戻り値には、次のフィールドを含む JSON 文字列が含まれます。

| パラメーター | 説明 |
| -------- | ------------------------------------------------------------ |
| `Label`  | ロードジョブのラベルです。`INSERT INTO tbl WITH LABEL label ...` で指定できます。 |
| `Status` | ロードされたデータの可視性を示すステータスです。<br />- `visible`: ロードが成功し、データは参照可能です。<br />- `committed`: ロードは完了しています。データが参照可能になるまで時間がかかる場合がありますが、再試行は不要です。<br />- `Label Already Exists`: ラベルが重複しています。別のラベルに変更する必要があります。<br />- `Fail`: ロードに失敗しました。 |
| `Err`    | ロードのエラーメッセージです。 |
| `TxnId`  | ロードトランザクションの ID です。 |

代表的な四つの戻り値の例を以下に示します。

#### ケース 1: INSERT が正常に実行された場合 {#scenario-1-insert-executed-successfully}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

- `Query OK`: 文が正常に実行されたことを示します。
- `5 rows affected`: 合計 5 行がロードされたことを示します。

#### ケース 2: 警告を伴って INSERT が正常に実行された場合 {#scenario-2-insert-executed-successfully-with-warnings}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

- `Query OK`: 文が正常に実行されたことを示します。
- `4 rows affected`: 合計 4 行がロードされたことを示します。
- `1 warnings`: 1 行が除外されたことを示します。

除外された行を確認するには、[SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md) 文を使用します。結果の `URL` からエラーデータを照会できます。以下の「[エラー行の確認](#view-error-rows)」を参照してください。

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

#### ケース 3: INSERT は正常に実行されたが、ステータスが committed の場合 {#scenario-3-insert-executed-successfully-but-status-is-committed}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

データが参照できないのは一時的な状態です。このバッチのデータはいずれ参照可能になります。[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md) 文で可視性を確認してください。`TransactionStatus` 列が `VISIBLE` になると、データを参照できます。

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

#### ケース 4: INSERT の実行に失敗した場合 {#scenario-4-insert-execution-failed}

実行に失敗した場合、データは一行もロードされません。

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` は失敗の理由を示します。
- 末尾の URL からエラーデータを照会できます。以下の「[エラー行の確認](#view-error-rows)」を参照してください。

## ベストプラクティス {#best-practices}

### データ量 {#data-volume}

INSERT INTO VALUES は通常、テストやデモに使用します。大量のデータのロードには**推奨しません**。大量データの書き込みには、[Group Commit](../load-best-practices/group-commit-manual.md) またはほかのバッチロード方式を使用してください。

### エラー行の確認 {#view-error-rows}

INSERT INTO の戻り値に `url` フィールドが含まれている場合は、次のコマンドでエラー行を確認します。

```sql
SHOW LOAD WARNINGS ON "url";
```

例:

```sql
mysql> SHOW LOAD WARNINGS ON "http://10.16.10.7:8743/api/_load_error_log?file=__shard_18/error_log_insert_stmt_a8d99ae931194d2b-93357aac59981a19_a8d99ae931194d2b_93357aac59981a19"\G
*************************** 1. row ***************************
         JobId: -1
         Label: NULL
ErrorMsgDetail: Reason: column_name[user_id], null value for not null column, type=BIGINT. src line []; 
1 row in set (0.00 sec)
```

主なエラーの原因は次のとおりです。

- ソースの列の長さが対象列の長さを超えている。
- 列の型が一致しない。
- パーティションが一致しない。
- 列の順序が一致しない。

INSERT INTO がエラー行を無視するかどうかは、セッション変数 `enable_insert_strict` で制御します。

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: INSERT INTO VALUES は同期方式ですか、それとも非同期方式ですか？**

A: 同期方式です。文の実行後にロード結果が直接返されるため、追加のポーリングは不要です。

**Q2: INSERT INTO VALUES はアトミック性を保証しますか？**

A: はい。一つの INSERT INTO VALUES に含まれるデータは、すべて正常にロードされるか、全体が失敗するかのいずれかで、部分的な書き込みは発生しません。

**Q3: 戻り値のステータスが `COMMITTED` の場合、ロードは失敗していますか？**

A: いいえ。`COMMITTED` はロードが完了し、データが間もなく参照可能になることを示します。再試行は不要です。`SHOW TRANSACTION` で `TransactionStatus` が `VISIBLE` になるまで確認してください。

**Q4: `Insert has too many filtered data` と表示されるのはなぜですか？**

A: `enable_insert_strict=false` の場合、除外されたデータの割合が `insert_max_filter_ratio` で設定したしきい値を超えたためです。`insert_max_filter_ratio` の制限を緩めるか、ソースデータがテーブルのスキーマ（列の型、NULL の許可など）に適合しているか確認してください。

**Q5: 大量データのロードには、どの方式を使用すべきですか？**

A: INSERT INTO VALUES は、同時実行数やデータ量が多いとコミット段階がボトルネックになります。[Group Commit](../load-best-practices/group-commit-manual.md) を有効にするか、Stream Load や Broker Load などの専用のロード方式を選んでください。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| `null value for not null column` エラー | NOT NULL 列に NULL 値を挿入した。 | ソースデータを修正するか、対象列で NULL を許可してください。 |
| `Insert has too many filtered data` エラー | 除外された行の割合が `insert_max_filter_ratio` を超えた。 | `insert_max_filter_ratio` のしきい値を上げるか、ソースデータを修正してください。 |
| `Label Already Exists` エラー | 指定したラベルがすでに使用されている。 | 別のラベルを使用するか、ラベルを指定せずにシステムに自動生成させてください。 |
| タスクが長時間実行された後、完了せずにキャンセルされる。 | `insert_load_default_timeout_second` または `insert_timeout` を超えた。 | 対応するタイムアウト値を増やすか、ロードを複数のバッチに分けてください。 |
| 同時実行数が多いとスループットが低い。 | コミット段階がボトルネックになっている。 | [Group Commit](../load-best-practices/group-commit-manual.md) を有効にしてください。 |

## 関連情報 {#more-help}

INSERT INTO の構文の詳細については、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md) コマンドのマニュアルを参照してください。MySQL クライアントのコマンドラインで `HELP INSERT` と入力して、追加情報を確認することもできます。
