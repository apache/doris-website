---
{
    "title": "INSERT INTO VALUES",
    "language": "ja",
    "description": "INSERT INTO VALUES 文を使用し、SQL に直接記述したデータを Doris テーブルに同期的かつ原子的にロードします。機能検証、デモ、少量データの取り込みに適しています。",
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

INSERT INTO VALUES 文は、SQL に直接記述した値を Doris テーブルにロードします。**同期的なデータロード方式**であり、実行後に結果が直接返されるため、応答からロードの成否を確認できます。この方式では、データロードタスクの**原子性**が保証されます。すべてのデータが正常にロードされるか、まったくロードされないかのいずれかです。

## ユースケース {#use-cases}

INSERT INTO VALUES は、主に次の二つの用途に適しています。

| 用途 | 説明 |
| --- | --- |
| 機能検証 / デモ | 少量の模擬データをロードして Doris の機能を検証します。構文は MySQL と同じです。 |
| 少量データの取り込み | 同時実行数が少なく、データ量が小さい場合に使用します。 |

:::tip パフォーマンスに関するヒント
INSERT INTO VALUES を同時実行する際の性能は、コミット段階のボトルネックによって制限されます。データ量が多い場合は、[Group Commit](../load-best-practices/group-commit-manual.md) を有効にすると、より高いスループットが得られます。
:::

## 仕組み {#how-it-works}

INSERT INTO VALUES は、MySQL プロトコルを介してジョブを FE ノードに送信し、実行します。処理の流れは次のとおりです。

1. クライアントが MySQL プロトコルを介して INSERT INTO VALUES 文を FE に送信します。
2. FE が実行計画を生成します。前半にはクエリ関連のオペレーターが含まれ、最後のオペレーターである `OlapTableSink` がクエリ結果を対象テーブルに書き込みます。
3. FE が実行計画を BE ノードに配布し、そのうち一つの BE を **Coordinator** ノードとして選びます。
4. Coordinator ノードがデータを受け取り、ほかの BE ノードに分配して書き込みを完了します。

## クイックスタート {#quick-start}

INSERT INTO VALUES は MySQL プロトコルを介して送信されます。以下では MySQL のコマンドラインを使用し、文の送信から結果の確認までを示します。構文の詳細は [INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT) を参照してください。

### 前提条件 {#prerequisites}

INSERT INTO VALUES を実行するには、対象テーブルに対する **INSERT 権限**が必要です。現在のユーザーに権限がない場合は、[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO) コマンドで付与してください。

### データロードジョブを作成する {#create-a-load-job}

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

#### ステップ 2：INSERT INTO VALUES でデータを書き込む {#step-2-run-insert-into-values-to-write-data}

:::caution 本番環境での使用は推奨しません
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

同期的なデータロード方式のため、結果はクライアントに直接返されます。

```JSON
Query OK, 5 rows affected (0.308 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

#### ステップ 3：ロードしたデータを確認する {#step-3-verify-the-loaded-data}

```sql
MySQL> SELECT COUNT(*) FROM testdb.test_table;
+----------+
| count(*) |
+----------+
|        5 |
+----------+
1 row in set (0.179 sec)
```

### データロードジョブを確認する {#view-the-load-job}

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

### データロードジョブをキャンセルする {#cancel-the-load-job}

MySQL クライアントでは、`Ctrl-C` を使用して実行中の INSERT INTO VALUES ジョブをキャンセルできます。

## リファレンス {#reference}

### データロードコマンドの構文 {#load-command-syntax}

```sql
INSERT INTO target_table (col1, col2, ...)
VALUES (val1, val2, ...), (val3, val4, ...), ...;
```

:::note
INSERT INTO VALUES は通常、デモにのみ使用します。本番環境での使用は推奨しません。
:::

### データロードの設定パラメーター {#load-configuration-parameters}

#### FE の設定 {#fe-configuration}

| パラメーター | デフォルト値 | 説明 |
| --- | --- | --- |
| `insert_load_default_timeout_second` | 14400（4 時間） | データロードタスクのタイムアウト時間を秒単位で指定します。この時間内にタスクが完了しない場合、システムがタスクをキャンセルし、ステータスが `CANCELLED` に変わります。 |

#### セッション変数 {#session-variables}

| パラメーター | デフォルト値 | 説明 |
| --- | --- | --- |
| `insert_timeout` | 14400（4 時間） | INSERT INTO を SQL 文として実行する際のタイムアウト時間を秒単位で指定します。 |
| `enable_insert_strict` | true | `true` に設定すると、不適格なデータが見つかった場合にロードが失敗します。`false` に設定すると、不適格な行は無視され、少なくとも一行が正常にロードされればロードは成功とみなされます。バージョン 2.1.4 以前では、INSERT INTO のエラー率は制御できません。このパラメーターで選べるのは、データ品質を厳密に検査するか、エラーのあるデータを完全に無視するかのいずれかです。 |
| `insert_max_filter_ratio` | 1.0 | バージョン 2.1.5 以降でサポートされ、`enable_insert_strict = false` の場合にのみ有効です。`INSERT INTO ... VALUES` と `INSERT INTO ... SELECT` でフィルタリングされる行の最大割合を制御します。Doris テーブル、外部テーブル、および S3、HDFS、LOCAL などのファイル TVF からのクエリも対象です。設定範囲は 0 から 1 で、デフォルトは 1.0 です。`filtered_rows / (loaded_rows + filtered_rows)` がこの値を超えると、INSERT は失敗します。1.0 を設定するとすべての行のフィルタリングが許容されますが、ほかの実行エラーが無視されるわけではありません。 |

:::info データが不適格となる主な原因
元データの列の長さが対象列の長さを超えている、列の型が一致しない、パーティションが一致しない、列の順序が一致しない、といった原因があります。
:::

### データロードの戻り値 {#load-return-values}

INSERT INTO VALUES は SQL 文です。戻り値には、次のフィールドを持つ JSON 文字列が含まれます。

| パラメーター | 説明 |
| -------- | ------------------------------------------------------------ |
| `Label`  | データロードジョブのラベルです。`INSERT INTO tbl WITH LABEL label ...` で指定できます。 |
| `Status` | ロードしたデータの可視性を示すステータスです。<br />- `visible`：ロードが成功し、データが参照できます。<br />- `committed`：ロードは完了しています。データが参照できるようになるまで時間がかかる場合がありますが、再試行は不要です。<br />- `Label Already Exists`：ラベルが重複しているため、別のラベルに変更する必要があります。<br />- `Fail`：ロードに失敗しました。 |
| `Err`    | データロードのエラーメッセージです。 |
| `TxnId`  | データロードトランザクションの ID です。 |

以下に、代表的な四つの戻り値の例を示します。

#### ケース 1：INSERT が成功した場合 {#scenario-1-insert-executed-successfully}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.05 sec)
{'label':'label_26eebc33411f441c_b2b286730d495e2c', 'status':'VISIBLE', 'txnId':'61071'}
```

- `Query OK`：文が正常に実行されたことを示します。
- `5 rows affected`：合計 5 行がロードされたことを示します。

#### ケース 2：警告を伴って INSERT が成功した場合 {#scenario-2-insert-executed-successfully-with-warnings}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
Query OK, 4 rows affected, 1 warning (0.04 sec)
{'label':'label_a8d99ae931194d2b_93357aac59981a18', 'status':'VISIBLE', 'txnId':'61068'}
```

- `Query OK`：文が正常に実行されたことを示します。
- `4 rows affected`：合計 4 行がロードされたことを示します。
- `1 warnings`：一行がフィルタリングされたことを示します。

フィルタリングされた行は、[SHOW LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-LOAD.md) 文で確認できます。結果に含まれる `URL` を使用してエラーデータを照会できます。詳しくは、後述の[エラー行を確認する](#view-error-rows)を参照してください。

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

#### ケース 3：INSERT は成功したが、ステータスが committed の場合 {#scenario-3-insert-executed-successfully-but-status-is-committed}

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (4, "Alexander", 60), (5, "Ava", 17);
Query OK, 5 rows affected (0.04 sec)
{'label':'label_78bf5396d9594d4d_a8d9a914af40f73d', 'status':'COMMITTED', 'txnId':'61074'}
```

データが参照できないのは一時的な状態であり、このバッチのデータは最終的に参照できるようになります。[SHOW TRANSACTION](../../../sql-manual/sql-statements/transaction/SHOW-TRANSACTION.md) 文で可視性を確認してください。`TransactionStatus` 列が `VISIBLE` になると、データを参照できます。

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

#### ケース 4：INSERT の実行に失敗した場合 {#scenario-4-insert-execution-failed}

実行に失敗した場合、データは一切ロードされていません。

```sql
mysql> INSERT INTO test_table (user_id, name, age) VALUES (1, "Emily", 25), (2, "Benjamin", 35), (3, "Olivia", 28), (NULL, "Alexander", 60), (5, "Ava", 17);
ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000. url: http://10.16.10.7:8747/api/_load_error_log?file=__shard_22/error_log_insert_stmt_5fafe6663e1a45e0-a666c1722ffc8c55_5fafe6663e1a45e0_a666c1722ffc8c55
```

- `ERROR 1105 (HY000): errCode = 2, detailMessage = Insert has too many filtered data 1/5 insert_max_filter_ratio is 0.100000.` は失敗の理由を示します。
- 末尾の url を使用してエラーデータを照会できます。詳しくは、後述の[エラー行を確認する](#view-error-rows)を参照してください。

## ベストプラクティス {#best-practices}

### データ量 {#data-volume}

INSERT INTO VALUES は通常、テストやデモに使用します。大量のデータのロードには**推奨しません**。大量のデータを書き込む場合は、[Group Commit](../load-best-practices/group-commit-manual.md) またはほかのバッチロード方式を使用してください。

### エラー行を確認する {#view-error-rows}

INSERT INTO の戻り値に `url` フィールドが含まれている場合は、次のコマンドでエラー行を確認できます。

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

よくあるエラーの原因は次のとおりです。

- 元データの列の長さが対象列の長さを超えている。
- 列の型が一致しない。
- パーティションが一致しない。
- 列の順序が一致しない。

INSERT INTO がエラー行を無視するかどうかは、セッション変数 `enable_insert_strict` で制御できます。

## よくある質問 {#faq}

<!-- Knowledge type: FAQ -->

**Q1：INSERT INTO VALUES は同期的ですか、非同期的ですか？**

A：同期的です。文の実行後にデータロードの結果が直接返されるため、追加のポーリングは不要です。

**Q2：INSERT INTO VALUES は原子性を保証しますか？**

A：はい。一回の INSERT INTO VALUES に含まれるすべてのデータが正常にロードされるか、すべて失敗するかのいずれかです。一部だけが書き込まれることはありません。

**Q3：戻り値のステータスが `COMMITTED` の場合、ロードは失敗していますか？**

A：いいえ。`COMMITTED` はロードが完了し、データがまもなく参照できるようになることを示します。再試行は不要です。`SHOW TRANSACTION` で `TransactionStatus` が `VISIBLE` になるまで確認してください。

**Q4：`Insert has too many filtered data` と報告されるのはなぜですか？**

A：`enable_insert_strict=false` の場合に、フィルタリングされたデータの割合が `insert_max_filter_ratio` で設定したしきい値を超えたためです。`insert_max_filter_ratio` の値を緩和するか、元データがテーブルのスキーマ（列の型や NULL の許可など）に適合しているか確認してください。

**Q5：大量のデータをバッチロードするには、どの方式を使用すべきですか？**

A：同時実行数やデータ量が多い場合、INSERT INTO VALUES はコミット段階のボトルネックによって制限されます。[Group Commit](../load-best-practices/group-commit-manual.md) を有効にするか、Stream Load や Broker Load などの専用のロード方式を選んでください。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| `null value for not null column` エラーが発生する | NOT NULL 列に NULL 値を挿入した。 | 元データを修正するか、対象列で NULL を許可します。 |
| `Insert has too many filtered data` エラーが発生する | フィルタリングされた行の割合が `insert_max_filter_ratio` を超えている。 | `insert_max_filter_ratio` のしきい値を上げるか、元データを修正します。 |
| `Label Already Exists` エラーが発生する | 指定したラベルがすでに使用されている。 | 別のラベルを使用するか、ラベルの指定を省略してシステムに自動生成させます。 |
| タスクが長時間完了せず、キャンセルされる | `insert_load_default_timeout_second` または `insert_timeout` を超えている。 | 対応するタイムアウト値を増やすか、データロードを複数のバッチに分割します。 |
| 同時実行数が多いとスループットが低い | コミット段階のボトルネックによって制限されている。 | [Group Commit](../load-best-practices/group-commit-manual.md) を有効にします。 |

## 関連情報 {#more-help}

INSERT INTO の詳しい構文については、[INSERT INTO](../../../sql-manual/sql-statements/data-modification/DML/INSERT.md) コマンドのマニュアルを参照してください。MySQL クライアントのコマンドラインで `HELP INSERT` を入力して、詳しい情報を確認することもできます。
