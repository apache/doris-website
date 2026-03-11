---
{
  "title": "テキスト/CSV/JSON",
  "language": "ja",
  "description": "このドキュメントは、Dorisにおけるテキストファイル形式の読み取りと書き込みのサポートについて紹介します。"
}
---
このドキュメントはDorisでのテキストファイル形式の読み書きサポートについて紹介します。

## Text/CSV

* Catalog

  `org.apache.hadoop.mapred.TextInputFormat`形式のHiveテーブルの読み取りをサポートします。

  以下のSerDeをサポートします：

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (2.1.7以降)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (3.1.0以降)  

* Table Valued Function

* Import

  インポート機能はText/CSV形式をサポートします。詳細はインポートドキュメントを参照してください。

* Export

  エクスポート機能はText/CSV形式をサポートします。詳細はエクスポートドキュメントを参照してください。

### サポートされている圧縮形式

* uncompressed
* gzip
* deflate
* bzip2
* zstd
* lz4
* snappy
* lzo

## JSON

### Catalog

- `org.apache.hadoop.hive.serde2.JsonSerDe` (3.0.4以降)

- `org.apache.hive.hcatalog.data.JsonSerDe` (3.0.4以降)

  1. プリミティブ型と複合型の両方をサポートします。
  2. `timestamp.formats` SERDEPROPERTIESはサポートしません。

- [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde)のHiveテーブル (3.0.6以降)

  1. プリミティブ型と複合型の両方をサポートします。
  2. SERDEPROPERTIES: [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data)のみサポートされ、このJsonSerDeと同様に動作します。その他のSERDEPROPERTIESは有効ではありません。
  3. [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays)はサポートしません（Text/CSV形式と同様で、すべての列データが単一の配列に配置されます）。
  4. [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array)はサポートしません（スカラーを単一要素配列に昇格）。
  5. デフォルトでは、Dorisはテーブルスキーマを正しく認識できます。ただし、特定のパラメータのサポート不足により、自動スキーマ認識が失敗する場合があります。この場合、`read_hive_json_in_one_column = true`を設定して、JSONの行全体を最初の列に配置することで、元のデータを完全に読み取れるようになります。ユーザーは手動で処理できます。この機能には最初の列のデータ型が`String`である必要があります。

### Import

インポート機能はJSON形式をサポートします。詳細はインポートドキュメントを参照してください。

## 文字セット

現在、DorisはUTF-8文字セットエンコーディングのみをサポートしています。ただし、HiveのText形式のテーブル内のデータなど、一部のデータにはUTF-8以外のエンコーディングで符号化されたコンテンツが含まれている場合があり、読み取りに失敗して以下のエラーが発生します：

```text
Only support csv data in utf8 codec
```
この場合、セッション変数を以下のように設定できます：

```text
SET enable_text_validate_utf8 = false
```
これにより UTF-8 エンコーディングチェックが無視され、このコンテンツを読み取ることができます。このパラメータはチェックをスキップするためにのみ使用され、UTF-8 以外でエンコードされたコンテンツは依然として文字化けして表示されることに注意してください。

このパラメータはバージョン 3.0.4 以降でサポートされています。
