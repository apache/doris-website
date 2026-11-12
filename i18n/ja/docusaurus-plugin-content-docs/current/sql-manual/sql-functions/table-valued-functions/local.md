---
{
    "title": "LOCAL | テーブル値関数",
    "language": "ja",
    "description": "LOCAL テーブル値関数（TVF）を使用すると、リレーショナルテーブルにアクセスする場合と同じように、BE ノード上のローカルファイルの内容を読み取ってアクセスできます。",
    "sidebar_label": "LOCAL"
}
---

# LOCAL {#local}

## 説明 {#description}

LOCAL テーブル値関数（TVF）を使用すると、リレーショナルテーブルにアクセスする場合と同じように、BE ノード上のローカルファイルの内容を読み取ってアクセスできます。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` 形式のファイルに対応しています。

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
| パラメータ         | 説明 | 備考 |
|-------------------|------|------|
| `file_path`       | 読み取るファイルのパス。`user_files_secure_path` ディレクトリからの相対パスで指定します。`user_files_secure_path` パラメータは [BE の設定項目](../../../admin-manual/config/be-config.md)です。<br /> パスに `..` を含めることはできません。`logs/*.log` のように、glob 構文を使用してパターンに一致するファイルを指定できます。 | |
| `backend_id`      | ファイルがある BE ノードの ID。`show backends` コマンドで取得できます。 | バージョン 2.1.1 より前の Doris では、ローカルデータファイルの読み取り先として BE ノードを指定する方法のみがサポートされています。 |
| `format`          | ファイル形式。必須です。対応形式は `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` です。 | |

## オプションパラメータ {#optional-parameters}
| パラメータ | 説明 | 備考 |
|------------|------|------|
| `shared_storage` | デフォルトは false です。true にすると、指定したファイルが共有ストレージ（NAS など）上にあるものとして扱います。共有ストレージは POSIX ファイルインターフェイスに対応し、すべての BE ノードにマウントされている必要があります。<br /> `shared_storage` が true の場合、`backend_id` は省略できます。Doris はすべての BE ノードを使用してデータにアクセスできます。`backend_id` を設定した場合は、指定した BE ノードからのみデータにアクセスします。 | バージョン 2.1.2 以降でサポート |
| `column_separator` | カラム区切り文字。省略可能で、デフォルトは `\t` です。 | |
| `line_delimiter` | 行区切り文字。省略可能で、デフォルトは `\n` です。 | |
| `compress_type` | 圧縮形式。省略可能です。対応形式は `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK` です。デフォルトは `UNKNOWN` で、`uri` の拡張子から形式が自動的に推定されます。 | |
| `read_json_by_line` | JSON 形式のインポートに使用します。省略可能で、デフォルトは `true` です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `strip_outer_array` | JSON 形式のインポートに使用します。省略可能で、デフォルトは `false` です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `json_root` | JSON 形式のインポートに使用します。省略可能で、デフォルトは空です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `json_paths` | JSON 形式のインポートに使用します。省略可能で、デフォルトは空です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `num_as_string` | JSON 形式のインポートに使用します。省略可能で、デフォルトは `false` です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `fuzzy_parse` | JSON 形式のインポートに使用します。省略可能で、デフォルトは `false` です。 | 参照：[JSON データロード](../../../data-operate/import/file-format/json) |
| `trim_double_quotes` | CSV 形式のインポートに使用します。省略可能で、デフォルトは `false` です。true にすると、CSV ファイルの各フィールドを囲む一番外側の二重引用符を取り除きます。 | CSV 形式用 |
| `skip_lines` | CSV 形式のインポートに使用します。省略可能で、デフォルトは `0` です。CSV ファイルの先頭から指定した行数をスキップします。形式が `csv_with_names` または `csv_with_names_and_types` の場合、このパラメータは無視されます。 | CSV 形式用 |
| `path_partition_keys` | 省略可能です。ファイルパスに含まれるパーティションカラム名を指定します。たとえば、パスが `/path/to/city=beijing/date="2023-07-09"` の場合は、`path_partition_keys="city,date"` と指定します。インポート時に、対応するカラム名と値がパスから自動的に読み取られます。 | |
| `enable_mapping_varbinary` | 開発版では、互換性のために受け付けられますが、値は無視されます。外部のバイナリデータは常に `VARBINARY` にマッピングされます。Doris 4.1.5 では、この TVF オプションを引き続き設定でき、デフォルトは `false` です。 | 4.0.3 以降でサポート |
| `enable_mapping_timestamp_tz` | 4.1.5 以降では、互換性のために受け付けられますが、値は無視されます。`isAdjustedToUTC=true` の Parquet Timestamp と ORC の `TIMESTAMP_INSTANT` は、このオプションが `false` の場合でも常に `TIMESTAMPTZ` にマッピングされます。 | 4.0.3 以降でサポート |
| `hive.parquet.time-zone` | 省略可能な文字列で、デフォルトは空です。4.1.5 以降でサポートされています。Parquet INT96 の書き込み元のタイムゾーンを、IANA タイムゾーンまたは -12:00 から +14:00 までのオフセットで指定します。CST や PRC などの短い別名は使用できません。詳しくは [Parquet](../../../lakehouse/file-formats/parquet.md#timestamp-and-date-compatibility) を参照してください。 | 4.1.5 以降 |

## アクセス制御の要件 {#access-control-requirements}
| 権限 | オブジェクト | 備考 |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |


## 使用上の注意 {#usage-notes}

- LOCAL TVF の詳しい使い方については、[S3](./s3.md) TVF を参照してください。両者の違いは、ストレージシステムへのアクセス方法だけです。

- LOCAL TVF を使用した NAS 上のデータへのアクセス

  NAS の共有ストレージは、複数のノードに同時にマウントできます。各ノードは、ローカルファイルと同じように共有ストレージ上のファイルにアクセスできます。そのため、NAS をローカルファイルシステムとして扱い、LOCAL TVF からアクセスできます。

  `"shared_storage" = "true"` を設定すると、Doris は指定したファイルにどの BE ノードからでもアクセスできるものとして扱います。ワイルドカードで複数のファイルを指定した場合、Doris はファイルへのアクセス要求を複数の BE ノードに分散します。これにより、複数のノードでファイルを分散スキャンし、クエリ性能を向上させることができます。


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

パス `${DORIS_HOME}/student.csv` にある CSV 形式のファイルを読み取ってアクセスします。
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

NAS 上のファイルにクエリを実行します。
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

`desc function` と組み合わせて使用できます。
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
