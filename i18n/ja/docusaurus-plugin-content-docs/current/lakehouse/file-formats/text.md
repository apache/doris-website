---
{
  "title": "Text/CSV/JSON",
  "language": "ja",
  "description": "このドキュメントでは、Dorisにおけるテキストファイル形式の読み取りと書き込みのサポートについて紹介します。"
}
---
このドキュメントでは、Dorisでのテキストファイルフォーマットの読み書きサポートについて紹介します。

## Text/CSV

* カタログ

  `org.apache.hadoop.mapred.TextInputFormat`フォーマットのHiveテーブルの読み取りをサポートします。

  以下のSerDeをサポート：

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (2.1.7以降)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (3.1.0以降)

* table Valued Function

* Import

  インポート機能はText/CSVフォーマットをサポートします。詳細については、インポートドキュメントを参照してください。

* Export

  エクスポート機能はText/CSVフォーマットをサポートします。詳細については、エクスポートドキュメントを参照してください。

### サポートされる圧縮フォーマット

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

- `org.apache.hadoop.hive.serde2.JsonSerDe` (3.0.4以降)

- `org.apache.hive.hcatalog.data.JsonSerDe` (3.0.4以降)

  1. プリミティブ型と複合型の両方をサポートします。
  2. `timestamp.formats` SERDEPROPERTIESはサポートしません。

- [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde)のHiveテーブル (3.0.6以降)

  1. プリミティブ型と複合型の両方をサポートします。
  2. SERDEPROPERTIES: [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data)のみサポートされ、このJsonSerDeと同じ動作をします。その他のSERDEPROPERTIESは有効ではありません。
  3. [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays)をサポートしません（Text/CSVフォーマットと同様に、すべての列データが単一配列に配置される）。
  4. [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array)をサポートしません（スカラーを単一要素配列に昇格させる）。
  5. デフォルトでは、Dorisはテーブルスキーマを正しく認識できます。しかし、特定のパラメータのサポートがないため、自動スキーマ認識が失敗する場合があります。この場合、`read_hive_json_in_one_column = true`を設定してJSON行全体を最初の列に配置し、元のデータを完全に読み取れるようにできます。ユーザーはその後手動で処理できます。この機能には最初の列のデータ型が`String`である必要があります。

### Import

インポート機能はJSONフォーマットをサポートします。詳細については、インポートドキュメントを参照してください。

## Character Set

現在、DorisはUTF-8文字セットエンコーディングのみサポートしています。しかし、HiveのTextフォーマットテーブルのデータなど、一部のデータには非UTF-8エンコーディングでエンコードされたコンテンツが含まれている場合があり、読み取り失敗を引き起こし、以下のエラーが発生します：

```text
Only support csv data in utf8 codec
```
この場合、次のようにセッション変数を設定できます：

```text
SET enable_text_validate_utf8 = false
```
これはUTF-8エンコーディングチェックを無視し、このコンテンツを読み取ることを可能にします。このパラメータはチェックをスキップするためにのみ使用され、UTF-8以外でエンコードされたコンテンツは依然として文字化けして表示されることに注意してください。

このパラメータはバージョン3.0.4以降でサポートされています。
