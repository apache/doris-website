---
{
    "title": "ORC | ファイル形式",
    "language": "ja",
    "description": "Stream Load、Broker Load、TVF を使用して ORC 形式のデータファイルを Apache Doris にインポートする方法を、完全な使用例とともに説明します。",
    "sidebar_label": "ORC",
    "keywords": [
        "Doris ORC インポート",
        "ORC 形式",
        "Stream Load ORC",
        "Broker Load ORC",
        "S3 TVF ORC",
        "HDFS TVF ORC",
        "Apache Doris ファイル形式"
    ]
}
---

<!-- Knowledge type: Operating procedure / Configuration parameters -->
<!-- Applicable scenario: Data import / File format selection -->

このドキュメントでは、ORC 形式のデータファイルを Apache Doris にインポートする方法について、対応するインポート方法と代表的な使用例を説明します。

## 対応するインポート方法 {#supported-import-methods}

次の表に、Doris で ORC 形式に使用できるインポート方法と、それぞれに適したケースを示します。

| インポート方法 | 適したケース | ドキュメント |
| --- | --- | --- |
| Stream Load | ローカルマシンまたはクライアントから HTTP 経由で ORC ファイルを送信する | [Stream Load](../import-way/stream-load-manual.md) |
| Broker Load | オブジェクトストレージまたは HDFS 上の ORC ファイルを非同期で一括インポートする | [Broker Load](../import-way/broker-load-manual.md) |
| INSERT INTO FROM S3 TVF | テーブル値関数を使用して S3 上の ORC ファイルを読み取る | [S3 TVF](../../../sql-manual/sql-functions/table-valued-functions/s3) |
| INSERT INTO FROM HDFS TVF | テーブル値関数を使用して HDFS 上の ORC ファイルを読み取る | [HDFS TVF](../../../sql-manual/sql-functions/table-valued-functions/hdfs) |

## 使用例 {#usage-examples}

このセクションでは、インポート方法ごとに ORC 形式の代表的な使用例を示します。各例では、`<user>`、`<fe_host>`、`bucket` などのプレースホルダーを、実際の環境に合わせた値に置き換えてください。

### Stream Load によるインポート {#stream-load-import}

ローカルの ORC ファイルを HTTP 経由で Doris に送信するには、この方法を使用します。

```shell
curl --location-trusted -u <user>:<passwd> \
    -H "format: orc" \
    -T example.orc \
    http://<fe_host>:<fe_http_port>/api/example_db/example_table/_stream_load
```

ポイント:

- リクエストヘッダー `-H "format: orc"` で、データ形式に ORC を指定します。
- `-T` で、インポートするローカル ORC ファイルのパスを指定します。
- URL には、インポート先のデータベースとテーブルを指定する必要があります。

### Broker Load によるインポート {#broker-load-import}

オブジェクトストレージ（S3 など）または HDFS 上の ORC ファイルを一括インポートするには、この方法を使用します。

```sql
LOAD LABEL example_db.example_label
(
    DATA INFILE("s3://bucket/example.orc")
    INTO TABLE example_table
    FORMAT AS "orc"
)
WITH S3 
(
    ...
);
```

ポイント:

- `FORMAT AS "orc"` で、データファイルの形式を明示的に指定します。
- `DATA INFILE` に ORC ファイルの保存先パスを指定します。
- `WITH S3 (...)` に、オブジェクトストレージのアクセス認証情報やその他の接続情報を指定します。

### TVF によるインポート {#tvf-import}

テーブル値関数（TVF）を使用してリモートの ORC ファイルを直接読み取り、結果をテーブルに書き込むには、この方法を使用します。

```sql
INSERT INTO example_table
SELECT *
FROM S3
(
    "uri" = "s3://bucket/example.orc",
    "format" = "orc",
    ...
);
```

ポイント:

- TVF のパラメータに `"format" = "orc"` を指定して、データ形式を設定します。
- `"uri"` で、オブジェクトストレージまたは HDFS 上の ORC ファイルのパスを指定します。
- インポート先のテーブルに書き込む前に、`SELECT` 句で列のプルーニング、フィルタリング、変換の処理を追加できます。

## FAQ {#faq}

**Q1: ORC ファイルをインポートする際、`format` パラメータを明示的に指定する必要がありますか？**

はい。Stream Load、Broker Load、TVF のいずれを使用する場合も、`format` を `orc` と明示的に指定する必要があります。指定しないと、データはデフォルトの形式（CSV など）で解析され、インポートに失敗します。

**Q2: ORC ファイルのインポートでは、Stream Load、Broker Load、TVF をどのように使い分けますか？**

- データ量が少ないローカルファイルやクライアント側のファイルには、Stream Load を推奨します。
- リモートのオブジェクトストレージや HDFS 上にある大量のファイルを一括でインポートする場合は、Broker Load を推奨します。
- インポート時に列のプルーニング、フィルタリング、変換を行う必要がある場合は、TVF（`INSERT INTO ... SELECT FROM S3/HDFS`）を推奨します。

**Q3: 使用例の `...` は何を意味しますか？**

使用例の `...` はプレースホルダーです。環境に必要な接続パラメータ（S3 の `AK/SK`、`endpoint`、`region` など）や、その他のオプションパラメータに置き換えてください。パラメータの全一覧については、各インポート方法の公式ドキュメントを参照してください。
