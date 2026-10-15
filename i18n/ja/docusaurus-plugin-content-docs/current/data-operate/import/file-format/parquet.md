---
{
    "title": "Parquet | ファイル形式",
    "language": "ja",
    "description": "Apache Doris に Parquet ファイルをインポートする方法を説明します。Stream Load、Broker Load、S3/HDFS TVF をサポートし、それぞれの例を示します。",
    "keywords": [
        "Doris Parquet インポート",
        "Parquet ファイル形式",
        "Parquet の Stream Load",
        "Parquet の Broker Load",
        "S3 TVF",
        "HDFS TVF",
        "列指向ストレージのインポート"
    ],
    "sidebar_label": "Parquet"
}
---

<!-- Knowledge type: Operating procedure / File format reference -->
<!-- Applicable scenarios: Data import / File format adaptation -->

このドキュメントでは、Parquet 形式のデータファイルを Apache Doris にインポートする方法を説明し、各インポート方法の例を示します。

## 適用シナリオ

Parquet は、オフラインのデータウェアハウスやオブジェクトストレージへの大量データの保存によく使われる列指向ストレージ形式です。次のような場合に、Parquet をインポート元として利用できます。

- S3 や HDFS などのオブジェクトストレージまたは分散ファイルシステムから履歴データを一括インポートする場合。
- ローカルまたはサーバーで生成した Parquet ファイルを Stream Load で送信する場合。
- リモートに保存された Parquet ファイルを Broker Load で一括ロードする場合。
- テーブル値関数（TVF）を使用して、オブジェクトストレージや HDFS 上の Parquet データを必要なときにクエリし、結果を Doris に書き込む場合。

## サポートされるインポート方法

次の表に、Parquet 形式をサポートするインポート方法と主な用途を示します。

| インポート方法 | 適用シナリオ | ドキュメント |
| --- | --- | --- |
| Stream Load | ローカルまたはサーバー側のファイルをリアルタイムまたはバッチで送信 | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | リモートストレージ（HDFS、オブジェクトストレージ）から一括インポート | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | S3 上の Parquet ファイルを直接クエリし、対象テーブルに書き込み | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | HDFS 上の Parquet ファイルを直接クエリし、対象テーブルに書き込み | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## 使用例

このセクションでは、各インポート方法の最小限の実行例を示します。例に含まれるプレースホルダー（`<user>`、`<fe_host>`、`bucket` など）は、実際の環境に合わせて置き換えてください。

### 1. Stream Load で Parquet をインポートする

ローカルの Parquet ファイルを HTTP インターフェース経由で Doris のテーブルに直接送信するには、リクエストヘッダーで `format: parquet` を明示的に指定します。

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: parquet" \
    -T example.parquet \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

補足:

- `-H "format: parquet"`: インポートするファイルが Parquet 形式であることを指定します。
- `-T example.parquet`: アップロードするローカルの Parquet ファイルを指定します。
- URL 内の `example_db` と `example_table` は、それぞれインポート先のデータベースとテーブルです。

### 2. Broker Load で Parquet をインポートする

この方法は、オブジェクトストレージや HDFS から Parquet ファイルを一括ロードする場合に適しています。`FORMAT AS "parquet"` でファイル形式を指定します。

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.parquet")
    INTO TABLE example_table
    FORMAT AS "parquet"
)
WITH S3 
(
    ...
);
```

補足:

- `DATA INFILE`: Parquet ファイルのリモートパスを指定します。`s3://` や `hdfs://` などのプロトコルをサポートします。
- `FORMAT AS "parquet"`: インポート元のファイルが Parquet 形式であることを指定します。
- `WITH S3 (...)`: `endpoint`、`access_key`、`secret_key` など、オブジェクトストレージへのアクセスに必要な認証情報を指定します。

### 3. TVF で Parquet をインポートする

テーブル値関数（TVF）と `INSERT INTO ... SELECT` を組み合わせると、リモートの Parquet ファイルを直接読み込み、対象テーブルに書き込めます。この方法は、必要なときにインポートする場合や、アドホック分析の結果を永続化する場合に適しています。

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.parquet",
    "format" = "parquet",
    ...
);
```

補足:

- `S3(...)`: テーブル値関数です。パラメータには `uri` と `format` を含める必要があります。必要に応じて認証情報などのパラメータを追加します。
- HDFS 上の Parquet ファイルを読み込む場合は、`S3` を `HDFS` に置き換えます。
- `SELECT *` を列リストやフィルター条件付きのクエリに置き換えると、必要なデータだけをインポートできます。

## FAQ

**Q1: Parquet をインポートするとき、ファイル形式を明示的に指定する必要がありますか？**

はい。Stream Load ではリクエストヘッダーの `format: parquet`、Broker Load では `FORMAT AS "parquet"`、TVF ではパラメータの `"format" = "parquet"` で指定します。

**Q2: HDFS から Parquet をインポートできますか？**

はい。Broker Load（`hdfs://` パスを `DATA INFILE` に指定）または HDFS TVF を使用できます。

**Q3: TVF を使ったインポートと Broker Load の違いは何ですか？**

Broker Load は非同期の一括インポートジョブであり、大量データのバッチ処理や定期実行に適しています。TVF は `INSERT INTO ... SELECT` を通じて同期的に実行され、必要なときのインポートや、ロード前にフィルタリング、集計などの処理が必要な場合に適しています。
