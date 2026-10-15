---
{
    "title": "LOCAL | テーブル値関数",
    "language": "ja",
    "description": "LOCAL テーブル値関数（TVF）を使用すると、リレーショナルテーブルにアクセスするように、BE ノード上のローカルファイルの内容を読み取れます。",
    "sidebar_label": "LOCAL"
}
---

# LOCAL

## 説明

LOCAL テーブル値関数（TVF）を使用すると、リレーショナルテーブルにアクセスするように、BE ノード上のローカルファイルの内容を読み取れます。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` 形式をサポートしています。

## 構文

```sql
LOCAL(
  "file_path" = "<file_path>", 
  "backend_id" = "<backend_id>",
  "format" = "<format>"
  [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```

## 必須パラメータ
| パラメータ | 説明 | 備考 |
|-----------|------|------|
| `file_path` | 読み取るファイルのパス。`user_files_secure_path` ディレクトリからの相対パスを指定します。`user_files_secure_path` は [BE の設定項目](../../../admin-manual/config/be-config.md)です。<br />パスに `..` は含められません。`logs/*.log` のような glob 構文によるパターンマッチを使用できます。 | |
| `backend_id` | ファイルがある BE ノードの ID。`show backends` コマンドで確認できます。 | バージョン 2.1.1 より前では、Doris はローカルデータファイルの読み取り先として BE ノードを指定する方法のみをサポートします。 |
| `format` | 必須のファイル形式。`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` をサポートします。 | |

## オプションパラメータ
| パラメータ | 説明 | 備考 |
|-----------|------|------|
| `shared_storage` | デフォルトは false です。true の場合、指定したファイルは共有ストレージ（NAS など）にあります。共有ストレージは POSIX ファイルインターフェイスをサポートし、すべての BE ノードにマウントされている必要があります。<br />`shared_storage` が true の場合、`backend_id` は省略できます。Doris はすべての BE ノードを使用してデータにアクセスできます。`backend_id` を指定した場合は、指定した BE ノードのみからデータにアクセスします。 | バージョン 2.1.2 以降でサポート |
| `column_separator` | 列区切り文字。省略可能で、デフォルトは `\t` です。 | |
| `line_delimiter` | 行区切り文字。省略可能で、デフォルトは `\n` です。 | |
| `compress_type` | 圧縮形式。省略可能です。`UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK` をサポートします。デフォルトは `UNKNOWN` で、`uri` の末尾から形式が自動的に推測されます。 | |
| `read_json_by_line` | JSON 形式のインポートで使用します。省略可能で、デフォルトは `true` です。 | 参照: [JSON の読み込み](../../../data-operate/import/file-format/json) |
| `strip_outer_array` | JSON 形式のインポートで使用します。省略可能で、デフォルトは `false` です。 | 参照: [JSON の読み込み](../../../data-operate/import/file-format/json) |
| `json_root` | JSON 形式のインポートで使用します。省略可能で、デフォルトは空です。 | 参照: [JSON の読み込み](../../../data-operate/import/file-format/json) |
| `json_paths` | JSON 形式のインポートで使用します。省略可能で、デフォルトは空です。 | 参照: [JSON の読み込み](../../../data-operate/import/file-format/json) |
| `num_as_string` | JSON 形式のインポートで使用します。省略可能で、デフォルトは `false` です。 | 参照: [JSON の読み込み](../../../data-operate/import/file-format/json) |
| `fuzzy_parse` | JSON 形式のインポートで使用します。省略可能で、デフォルトは `false` です。 | 参照: [JSON の読み込み](../../../data-operate/import/file-format/json) |
| `trim_double_quotes` | CSV 形式のインポートで使用します。省略可能で、デフォルトは `false` です。true の場合、CSV ファイルの各フィールドを囲む最も外側の二重引用符を除去します。 | CSV 形式用 |
| `skip_lines` | CSV 形式のインポートで使用します。省略可能で、デフォルトは `0` です。CSV ファイルの先頭から指定した行数をスキップします。形式が `csv_with_names` または `csv_with_names_and_types` の場合、このパラメータは無視されます。 | CSV 形式用 |
| `path_partition_keys` | 省略可能です。ファイルパスに含まれるパーティション列名を指定します。たとえば、パスが `/path/to/city=beijing/date="2023-07-09"` の場合は `path_partition_keys="city,date"` を指定します。インポート時に、対応する列名と値がパスから自動的に読み取られます。 | |
| `enable_mapping_varbinary` | デフォルトは false です。PARQUET/ORC の読み取り時、BYTE_ARRAY 型は STRING 型にマッピングされます。有効にすると VARBINARY 型にマッピングされます。 | 4.0.3 以降でサポート |
| `enable_mapping_timestamp_tz` | デフォルトは `false` です。PARQUET（`TIMESTAMP` に `isAdjustedToUTC` が設定されている場合）または ORC（`TIMESTAMP_INSTANT`）の読み取り時、型は `DATETIME` にマッピングされます。有効にすると `TIMESTAMPTZ` 型にマッピングされます。 | バージョン 4.0.3 以降でサポート |

## アクセス制御要件
| 権限 | 対象 | 備考 |
| :--------- |:-------|:------|
| ADMIN_PRIV | グローバル |       |


## 使用上の注意

- LOCAL TVF の詳しい使い方については、[S3](./s3.md) TVF を参照してください。両者の違いは、ストレージシステムへのアクセス方法だけです。

- LOCAL TVF を使用して NAS 上のデータにアクセスする

  NAS の共有ストレージは、複数のノードに同時にマウントできます。各ノードは共有ストレージ内のファイルにローカルファイルと同じようにアクセスできます。そのため、NAS をローカルファイルシステムとみなし、LOCAL TVF でアクセスできます。

  `"shared_storage" = "true"` を設定すると、Doris は指定したファイルにどの BE ノードからでもアクセスできるものとして扱います。ワイルドカードで一連のファイルを指定した場合、Doris は複数の BE ノードにファイルアクセス要求を分散します。これにより、複数のノードでファイルを分散スキャンし、クエリの性能を向上できます。


## 例

指定した BE 上のログファイルを分析する:
```sql
select * from local(
        "file_path" = "log/be.out",
        "backend_id" = "10006",
        "format" = "csv")
       where c1 like "%start_time%" limit 10;
```
```text
+--------------------------------------------------------+
| c1                                                     |
+--------------------------------------------------------+
| start time: 2023 年 08 月 07 日 星期一 23:20:32 CST       |
| start time: 2023 年 08 月 07 日 星期一 23:32:10 CST       |
| start time: 2023 年 08 月 08 日 星期二 00:20:50 CST       |
| start time: 2023 年 08 月 08 日 星期二 00:29:15 CST       |
+--------------------------------------------------------+
```

`${DORIS_HOME}/student.csv` にある CSV 形式のファイルを読み取る:
```sql
select * from local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
```
```text
+------+---------+--------+
| c1   | c2      | c3     |
+------+---------+--------+
| 1    | alice   | 18     |
| 2    | bob     | 20     |
| 3    | jack    | 24     |
| 4    | jackson | 19     |
| 5    | liming  | d18    |
+------+---------+--------+
```--+---------+--------+
```

NAS 上のファイルをクエリする:
```sql
select * from local(
        "file_path" = "/mnt/doris/prefix_*.txt",
        "format" = "csv",
        "column_separator" =",",
        "shared_storage" = "true");
```
```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
+------+------+------+
```

`desc function` とともに使用できます:
```sql
desc function local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
```
```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```
