---
{
    "title": "S3 順序付き取り込み",
    "sidebar_label": "順序付き取り込み",
    "language": "ja",
    "description": "Doris Streaming Job を使用して、SQL、開始オフセット、バッチ処理、命名上の制約を含め、S3 ファイルを辞書順のキー順で継続的に取り込みます。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "順序付き取り込み"
    ]
}
---

:::caution 実験的機能

Doris の継続ロードは実験的機能であり、Doris 4.1.5 以降でサポートされます。

:::

順序付き取り込みでは `ORDERED_LIST` を使用して、パスとファイル名を含む**辞書順のキー順**で新しい S3 オブジェクトを継続的に検出します。タイムスタンプまたは連番が増加する名前のログや ETL ファイルに適しています。この順序はファイルの検出方法を示すものであり、対象テーブル内の行順序を保証するものではありません。

これはデフォルトの S3 取り込みモードで、キューは必要ありません。任意の順序で到着するファイルには[通知取り込み](./continuous-load-s3-notification.md)を使用してください。準備済みの静的なファイルセットには[一度限りの取り込み](./continuous-load-s3-one-time.md)を使用してください。

## 仕組み {#how-it-works}

Doris は、最後にコミットされたキーより後にある一致ファイルをスキャンします。新しいキーは、コミット済みキーより辞書順で大きくなければなりません。`file1`、`file2`、`file3` の取り込み後に新しくアップロードされた `file0` は読み取られません。新しいファイルがない場合、ジョブは `max_interval` の間隔でポーリングします。

## クイックスタート {#quick-start}

### ステップ 1: 対象テーブルとファイルを準備する {#step-1-prepare-the-target-table-and-files}

実行アカウントには対象テーブルに対する `LOAD` 権限と、データベースおよびテーブルを作成するための対応する権限が必要です。S3 資格情報には `s3:ListBucket` と `s3:GetObject` が必要です。Doris ノードは S3 エンドポイントにアクセスできなければなりません。

```sql
CREATE DATABASE IF NOT EXISTS db1;
CREATE TABLE db1.tbl1 (
    id INT,
    name STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

この例では、単一 BE クラスター向けに単一レプリカを使用します。実稼働クラスターに合わせてレプリカ数を設定してください。次の内容を `s3://bucket/001.csv` としてアップロードし、SQL 内のバケット、エンドポイント、Region、資格情報を実際の値に置き換えてください。

```text
1,Alice
2,Bob
```

### ステップ 2: ジョブを作成する {#step-2-create-the-job}

`s3.ingestion_mode` を省略するとデフォルトが使用されます。明示的に設定する場合は、Job で `ORDERED_LIST` を指定し、その設定を `PROPERTIES` に記述します。

```SQL
CREATE JOB my_job
ON STREAMING
DO
INSERT INTO db1.tbl1
select * from S3(
    "uri" = "s3://bucket/*.csv",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "format" = "csv",
    "column_separator" = ","
);
```

取り込み後、`SELECT * FROM db1.tbl1 ORDER BY id;` を実行します。期待される結果は次のとおりです。

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
|  2 | Bob   |
+----+-------+
```

### ステップ 3: 進行状況を監視する {#step-3-monitor-progress}

```sql
SELECT Name, Status, CurrentOffset, EndOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = 'my_job';
```

`001.csv` の取り込みがコミットされた後、`Status` は `RUNNING`、`CurrentOffset` は `{"fileName":"001.csv"}` になります。取り込みを続けるには、`002.csv` など、より大きいキーのファイルをアップロードします。新しいファイルがない場合もジョブは実行中のままです。

## パラメータ {#parameters}

Job の `PROPERTIES` に次の項目を設定します。S3 接続、資格情報、ファイル形式のオプションは `S3(...)` に記述します。

| パラメータ | 型 | デフォルト | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 文字列 | `ORDERED_LIST` | いいえ | `ORDERED_LIST` に設定します。作成後は変更できません。 |
| `offset` | JSON 文字列 | なし | いいえ | このキーより後だけを厳密に読み取ります。例: `'{"fileName":"data/001.csv"}'`。指定しない場合、一致するパスの先頭から開始します。 |
| `s3.max_batch_files` | 正の整数 | `256` | いいえ | バッチあたりのファイル数のしきい値です。 |
| `s3.max_batch_bytes` | 整数 | `10737418240` | いいえ | バッチあたりのバイト数のしきい値です。範囲は `104857600` から `10737418240` までです。単位サフィックスは受け付けません。 |
| `max_interval` | 正の整数 | `10` | いいえ | 新しいファイルがないときのアイドル時のスケジュール間隔（秒）です。 |

バッチのしきい値に達するまでジョブが挿入を待機する必要はありません。

### 特定のファイルの後から開始する {#start-after-a-specific-file}

`data/001.csv` とそれ以前のファイルがすでに処理されている場合は、次のように `data/002.csv` から読み取りを開始します。

```sql
CREATE JOB s3_after_offset_job
PROPERTIES (
    "s3.ingestion_mode" = "ORDERED_LIST",
    "offset" = "{\"fileName\":\"data/001.csv\"}"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/data/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>"
);
```

これは `data/001.csv` とそれより小さいすべてのキーをスキップし、それより後にある一致キーだけを取り込みます。この例では、クイックスタートとの重複を避けるため、別の対象テーブルを使用してください。

取り込みモードと S3 URI は作成後に変更できません。モードまたはパスを変更するには、別のジョブを作成してください。

## トラブルシューティングと制限事項 {#troubleshooting-and-limitations}

- **新しいファイルが取り込まれない:** キーが URI に一致し、`CurrentOffset` より大きいことを確認してください。カーソルより前に追加されたファイルはバックフィルされません。バックフィルには別のプレフィックスと一度限りのジョブを使用するか、ファイルをアップロードする前に通知取り込みを設定してください。
- **順序が予期したものと異なる:** `000001.csv` のような固定幅のタイムスタンプまたはゼロ埋めしたカウンターを使用してください。そうしないと、`file10` は `file2` より前に並びます。
- **オブジェクトが上書きまたは削除される:** 各キーを一意にし、取り込み中はその内容を変更せず、読み取り可能な状態に保ってください。すでにコミットされたオブジェクトを上書きしても、再度の取り込みはトリガーされません。
- **空のパスで作成に失敗する:** ジョブの作成時、S3 TVF にはスキーマを推測するため、一致していて読み取り可能な空でないファイルが必要です。

一時停止、再開、タスクの検査については[継続ロードの概要](./continuous-load-overview.md)を参照してください。ジョブの変更については [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md) を参照してください。
