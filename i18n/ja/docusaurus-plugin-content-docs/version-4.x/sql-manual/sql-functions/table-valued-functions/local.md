---
{
    "title": "LOCAL | テーブル値関数",
    "language": "ja",
    "description": "LOCAL テーブル値関数（tvf）を使用すると、リレーショナルテーブルにアクセスするのと同じように、BE ノード上のローカルファイルを読み取れます。",
    "sidebar_label": "LOCAL"
}
---

# LOCAL {#local}

## 概要 {#description}

LOCAL テーブル値関数（tvf）を使用すると、リレーショナルテーブルにアクセスするのと同じように、BE ノード上のローカルファイルの内容を読み取り、アクセスできます。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` 形式をサポートしています。

## 構文 {#syntax}

```sql
LOCAL(
  "file_path" = "<file_path>",
  "backend_id" = "<backend_id>",
  "format" = "<format>"
  [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```

## 必須パラメータ {#required-parameters}
| パラメータ | 説明 | 備考 |
|---|---|---|
| `file_path` | 読み取るファイルのパス。`user_files_secure_path` ディレクトリからの相対パスで指定します。`user_files_secure_path` パラメータは [BE の設定項目](../../../admin-manual/config/be-config.md)です。<br />パスに `..` を含めることはできません。`logs/*.log` のように、glob 構文によるパターンマッチングを使用できます。 | |
| `backend_id` | ファイルが存在する BE ノードの ID。`show backends` コマンドで取得できます。 | バージョン 2.1.1 より前の Doris では、指定した BE ノード上のローカルデータファイルの読み取りのみをサポートします。 |
| `format` | 必須のファイル形式。`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` をサポートします。 | |

## オプションパラメータ {#optional-parameters}
| パラメータ | 説明 | 備考 |
|---|---|---|
| `shared_storage` | デフォルトは false です。true の場合、指定したファイルは共有ストレージ（NAS など）上にあります。共有ストレージは POSIX ファイルインターフェースをサポートし、すべての BE ノードにマウントされている必要があります。<br />`shared_storage` が true の場合、`backend_id` を省略できます。Doris はすべての BE ノードを使用してデータにアクセスする場合があります。`backend_id` を指定した場合は、指定した BE ノードからのみデータにアクセスします。 | バージョン 2.1.2 以降でサポート |
| `column_separator` | 列の区切り文字。省略可能で、デフォルトは `\t` です。 | |
| `line_delimiter` | 行の区切り文字。省略可能で、デフォルトは `\n` です。 | |
| `compress_type` | 圧縮タイプ。省略可能です。`UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK` をサポートします。デフォルトは `UNKNOWN` で、`uri` の拡張子からタイプを自動的に推定します。 | |
| `read_json_by_line` | JSON 形式のインポートで使用します。省略可能で、デフォルトは `true` です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `strip_outer_array` | JSON 形式のインポートで使用します。省略可能で、デフォルトは `false` です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `json_root` | JSON 形式のインポートで使用します。省略可能で、デフォルトは空です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `json_paths` | JSON 形式のインポートで使用します。省略可能で、デフォルトは空です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `num_as_string` | JSON 形式のインポートで使用します。省略可能で、デフォルトは `false` です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `fuzzy_parse` | JSON 形式のインポートで使用します。省略可能で、デフォルトは `false` です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `trim_double_quotes` | CSV 形式のインポートで使用します。省略可能で、デフォルトは `false` です。true の場合、CSV ファイルの各フィールドを囲む最も外側の二重引用符を除去します。 | CSV 形式用 |
| `skip_lines` | CSV 形式のインポートで使用します。省略可能で、デフォルトは `0` です。CSV ファイルの先頭から指定した行数をスキップします。形式が `csv_with_names` または `csv_with_names_and_types` の場合、このパラメータは無視されます。 | CSV 形式用 |
| `path_partition_keys` | 省略可能です。ファイルパスに含まれるパーティション列名を指定します。たとえば、パスが `/path/to/city=beijing/date="2023-07-09"` の場合、`path_partition_keys="city,date"` と指定します。インポート時に、対応する列名と値がパスから自動的に読み取られます。 | |
| `enable_mapping_varbinary` | デフォルトは false です。PARQUET/ORC の読み取り時、BYTE_ARRAY 型を STRING 型にマッピングします。有効にすると VARBINARY 型にマッピングします。 | バージョン 4.0.3 以降でサポート |
| `enable_mapping_timestamp_tz` | バージョン 4.1.5 以降は互換性のためにのみ受け付けられ、値は無視されます。Parquet Timestamp の `isAdjustedToUTC=true` と ORC の `TIMESTAMP_INSTANT` は、このオプションが `false` でも常に `TIMESTAMPTZ` にマッピングされます。独立した `enable_mapping_varbinary` オプションは引き続き設定可能で、デフォルトは `false` です。 | バージョン 4.0.3 以降でサポート |
| `hive.parquet.time-zone` | 省略可能な文字列で、デフォルトは空です。バージョン 4.1.5 以降でサポートします。Parquet INT96 の書き込み側のタイムゾーンを指定します。IANA タイムゾーン、または -12:00 から +14:00 までのオフセットを指定できます。CST や PRC などの短い別名は使用できません。詳しくは [Parquet](../../../lakehouse/file-formats/parquet.md#timestamp-and-date-compatibility) を参照してください。 | バージョン 4.1.5 以降 |

## アクセス制御の要件 {#access-control-requirements}
| 権限 | オブジェクト | 備考 |
| :--- | :--- | :--- |
| ADMIN_PRIV | global | |


## 使用上の注意 {#usage-notes}

- local tvf の詳しい使い方は、[S3](./s3.md) tvf を参照してください。両者の違いは、ストレージシステムへのアクセス方法のみです。

- local tvf による NAS 上のデータへのアクセス

  NAS 共有ストレージは複数のノードに同時にマウントできます。各ノードは、共有ストレージ内のファイルにローカルファイルと同じようにアクセスできます。そのため、NAS をローカルファイルシステムとして扱い、local tvf からアクセスできます。

  `"shared_storage" = "true"` を設定すると、Doris は指定されたファイルにどの BE ノードからもアクセスできるものとして扱います。ワイルドカードで複数のファイルを指定した場合、Doris はファイルへのアクセス要求を複数の BE ノードに分散します。これにより、複数のノードで分散ファイルスキャンを実行し、クエリの性能を向上させることができます。


## 例 {#examples}

指定した BE 上のログファイルを分析します。
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

パス `${DORIS_HOME}/student.csv` にある CSV 形式のファイルを読み取り、アクセスします。
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

NAS 上のファイルをクエリします。
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

`desc function` と併用できます。
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
