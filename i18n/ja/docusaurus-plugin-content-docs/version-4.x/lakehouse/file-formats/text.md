---
{
    "title": "Text/CSV/JSON",
    "language": "ja",
    "description": "このドキュメントでは、Doris におけるテキストファイル形式の読み取りと書き込みのサポートについて説明します。"
}
---

このドキュメントでは、Doris におけるテキストファイル形式の読み取りと書き込みのサポートについて説明します。

## Text/CSV

* カタログ

  `org.apache.hadoop.mapred.TextInputFormat` 形式の Hive テーブルの読み取りをサポートします。

  以下の SerDe をサポートします。

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde`（2.1.7 以降）
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe`（3.1.0 以降）  

* テーブル値関数

* インポート

  インポート機能は Text/CSV 形式をサポートします。詳細はインポートのドキュメントを参照してください。

* エクスポート

  エクスポート機能は Text/CSV 形式をサポートします。詳細はエクスポートのドキュメントを参照してください。

### サポートされる圧縮形式

* uncompressed
* gzip
* deflate
* bzip2
* zstd
* lz4
* snappy
* lzo

## JSON

### カタログ

- `org.apache.hadoop.hive.serde2.JsonSerDe`（3.0.4 以降）

- `org.apache.hive.hcatalog.data.JsonSerDe`（3.0.4 以降）

  1. プリミティブ型と複合型の両方をサポートします。
  2. SERDEPROPERTIES の `timestamp.formats` はサポートしません。

- [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde) を使用する Hive テーブル（3.0.6 以降）

  1. プリミティブ型と複合型の両方をサポートします。
  2. SERDEPROPERTIES は [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data) のみをサポートし、この JsonSerDe と同じように動作します。その他の SERDEPROPERTIES は有効になりません。
  3. [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays) はサポートしません（Text/CSV 形式のように、すべての列データを単一の配列に格納する方法）。
  4. [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array) はサポートしません（スカラーを単一要素の配列に変換する方法）。
  5. デフォルトでは、Doris はテーブルのスキーマを正しく認識できます。ただし、一部のパラメータをサポートしていないため、スキーマの自動認識に失敗する場合があります。その場合は、`read_hive_json_in_one_column = true` を設定すると、JSON 行全体を最初の列に格納して、元のデータをすべて読み取れます。その後、ユーザーが手動で処理できます。この機能を使用するには、最初の列のデータ型が `String` である必要があります。

### インポート

インポート機能は JSON 形式をサポートします。詳細はインポートのドキュメントを参照してください。

## 文字セット

現在、Doris がサポートする文字エンコーディングは UTF-8 のみです。ただし、Hive の Text 形式のテーブルのデータなどには、UTF-8 以外でエンコードされた内容が含まれる場合があります。その場合、読み取りに失敗し、次のエラーが発生します。

```text
Only support csv data in utf8 codec
```

この場合、次のようにセッション変数を設定できます。

```text
SET enable_text_validate_utf8 = false
```

これにより UTF-8 エンコーディングの検証が省略され、その内容を読み取れるようになります。このパラメータは検証を省略するためだけのもので、UTF-8 以外でエンコードされた内容は引き続き文字化けして表示されます。

このパラメータはバージョン 3.0.4 以降でサポートされています。
