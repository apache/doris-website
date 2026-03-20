---
{
  "title": "Text/CSV/JSON",
  "description": "この文書では、Dorisにおけるテキストファイル形式の読み取りおよび書き込みのサポートについて紹介します。",
  "language": "ja"
}
---
この文書では、Dorisにおけるテキストファイル形式の読み書きサポートについて紹介します。

## Text/CSV

* カタログ

  `org.apache.hadoop.mapred.TextInputFormat`形式のHiveTableの読み取りをサポートしています。

  以下のSerDeをサポートしています：

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (2.1.7以降)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (3.1.0以降)

* table Valued ファンクション

* Import

  Import機能はText/CSV形式をサポートしています。詳細についてはimportドキュメントを参照してください。

* Export

  Export機能はText/CSV形式をサポートしています。詳細についてはexportドキュメントを参照してください。

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

### カタログ

- `org.apache.hadoop.hive.serde2.JsonSerDe` (3.0.4以降)

- `org.apache.hive.hcatalog.data.JsonSerDe` (3.0.4以降)

  1. プリミティブ型と複合型の両方をサポートしています。
  2. `timestamp.formats` SERDEPROPERTIESはサポートしていません。

- [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde)のHiveTable (3.0.6以降)

  1. プリミティブ型と複合型の両方をサポートしています。
  2. SERDEPROPERTIES： [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data)のみサポートされており、このJsonSerDeと同じ動作をします。その他のSERDEPROPERTIESは効果がありません。
  3. [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays)はサポートしていません（Text/CSV形式と同様に、すべての列データが単一の配列に配置される）。
  4. [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array)はサポートしていません（スカラー値を単一要素配列に昇格させる）。
  5. デフォルトでは、Dorisはtableスキーマを正しく認識できます。ただし、特定のパラメータのサポート不足により、自動スキーマ認識が失敗する場合があります。この場合、`read_hive_json_in_one_column = true`を設定することで、JSON行全体を最初の列に配置し、元のデータが完全に読み取られるようにできます。ユーザーは手動で処理を行うことができます。この機能を使用するには、最初の列のデータ型が`String`である必要があります。

### Import

Import機能はJSON形式をサポートしています。詳細についてはimportドキュメントを参照してください。

## 文字セット

現在、DorisはUTF-8文字セットエンコーディングのみをサポートしています。ただし、Hive Text形式のtable内のデータなど、一部のデータにはUTF-8以外のエンコーディングでエンコードされたコンテンツが含まれている場合があり、読み取りエラーが発生し、以下のエラーが表示されます：

```text
Only support csv data in utf8 codec
```
この場合、セッション変数を次のように設定できます：

```text
SET enable_text_validate_utf8 = false
```
これによりUTF-8エンコーディングチェックが無視され、このコンテンツを読み込むことができます。このパラメータはチェックをスキップするためにのみ使用され、UTF-8以外でエンコードされたコンテンツは依然として文字化けして表示されることに注意してください。

このパラメータはバージョン3.0.4以降でサポートされています。
