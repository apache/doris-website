---
{
  "title": "テキスト/CSV/JSON",
  "language": "ja",
  "description": "このドキュメントでは、Dorisにおけるテキストファイルフォーマットの読み取りと書き込みのサポートについて紹介します。"
}
---
このドキュメントは、Dorisでのテキストファイルフォーマットの読み書きサポートについて説明します。

## Text/CSV

* カタログ

  `org.apache.hadoop.mapred.TextInputFormat`フォーマットのHiveテーブルの読み取りをサポートします。

  以下のSerDeをサポートします：

  - `org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe`
  - `org.apache.hadoop.hive.serde2.OpenCSVSerde` (Since 2.1.7)
  - `org.apache.hadoop.hive.serde2.MultiDelimitSerDe` (Since 3.1.0)

* table Valued Function

* Import

  インポート機能はText/CSVフォーマットをサポートします。詳細はインポートドキュメントを参照してください。

* Export

  エクスポート機能はText/CSVフォーマットをサポートします。詳細はエクスポートドキュメントを参照してください。

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

- `org.apache.hadoop.hive.serde2.JsonSerDe` (Since 3.0.4)

- `org.apache.hive.hcatalog.data.JsonSerDe` (Since 3.0.4)

  1. プリミティブ型と複合型の両方をサポートします。
  2. `timestamp.formats` SERDEPROPERTIESはサポートしていません。

- [`org.openx.data.jsonserde.JsonSerDe`](https://github.com/rcongiu/Hive-JSON-Serde)のHiveテーブル (Since 3.0.6)

  1. プリミティブ型と複合型の両方をサポートします。
  2. SERDEPROPERTIES: [`ignore.malformed.json`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#importing-malformed-data)のみサポートされ、このJsonSerDeと同様の動作をします。その他のSERDEPROPERTIESは有効ではありません。
  3. [`Using Arrays`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#using-arrays)はサポートしていません（Text/CSVフォーマットと同様に、すべての列データが単一の配列に配置される）。
  4. [`Promoting a Scalar to an Array`](https://github.com/rcongiu/Hive-JSON-Serde?tab=readme-ov-file#promoting-a-scalar-to-an-array)はサポートしていません（スカラー値を単一要素の配列に昇格）。
  5. デフォルトでは、Dorisはテーブルスキーマを正しく認識できます。ただし、特定のパラメータのサポート不足により、自動スキーマ認識が失敗する場合があります。この場合、`read_hive_json_in_one_column = true`を設定してJSONの行全体を最初の列に配置することで、元のデータを完全に読み取ることができます。その後、ユーザーが手動で処理できます。この機能では、最初の列のデータ型が`String`である必要があります。

### Import

インポート機能はJSONフォーマットをサポートします。詳細はインポートドキュメントを参照してください。

## 文字セット

現在、DorisはUTF-8文字セットエンコーディングのみをサポートします。ただし、Hive Textフォーマットテーブル内のデータなど、一部のデータにはUTF-8以外のエンコーディングでエンコードされた内容が含まれている場合があり、読み取りが失敗し、以下のエラーが発生します：

```text
Only support csv data in utf8 codec
```
この場合、セッション変数を次のように設定できます：

```text
SET enable_text_validate_utf8 = false
```
これはUTF-8エンコーディングチェックを無視し、このコンテンツを読み取ることを可能にします。このパラメータはチェックをスキップするためにのみ使用され、UTF-8以外でエンコードされたコンテンツは依然として文字化けして表示されることに注意してください。

このパラメータはバージョン3.0.4から対応しています。
