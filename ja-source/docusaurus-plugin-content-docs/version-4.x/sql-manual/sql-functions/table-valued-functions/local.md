---
{
  "title": "LOCAL | table Valued Functions",
  "sidebar_label": "LOCAL",
  "description": "ローカルtable値関数(tvf)を使用すると、ユーザーはbeノード上のローカルファイルの内容を、リレーショナルtableにアクセスするのと同じように読み取りおよびアクセスできます。",
  "language": "ja"
}
---
# LOCAL

## デスクリプション

ローカルtable値関数（tvf）は、ユーザーがbeノード上のローカルファイルの内容を読み取ってアクセスすることを可能にし、リレーショナルtableにアクセスするのと同様に扱えます。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`ファイル形式をサポートしています。

## syntax

```sql
LOCAL(
  "file_path" = "<file_path>", 
  "backend_id" = "<backend_id>",
  "format" = "<format>"
  [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```
## 必須パラメータ
| Parameter         | デスクリプション                                                                                                                                                                                          | Remarks                                           |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `file_path`       | 読み取るファイルのパス。`user_files_secure_path` ディレクトリからの相対パスを指定します。`user_files_secure_path` パラメータは BE の設定項目です。<br /> パスに `..` を含めることはできません。`logs/*.log` のように、パターンマッチングに glob 構文を使用できます。 |                                                   |
| `backend_id`      | ファイルが配置されている BE ノードの ID。`show backends` コマンドで取得できます。                                                                                                                    | バージョン 2.1.1 より前では、Doris は指定した BE ノード上のローカルデータファイルを読み取るための BE ノードの指定のみをサポートします。 |
| `format`          | ファイル形式。必須です。サポートされている形式は `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` です。                                                                               |                                                   |

## オプションパラメータ
| Parameter              | デスクリプション                                                                                                                                                                       | Remarks                                                                |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `shared_storage`        | デフォルトは false です。true の場合、指定されたファイルは共有ストレージ（NAS など）に配置されています。共有ストレージは POSIX ファイルインターフェースをサポートし、すべての BE ノードにマウントされている必要があります。<br /> `shared_storage` が true の場合、`backend_id` は省略できます。Doris はすべての BE ノードを利用してデータにアクセスする場合があります。`backend_id` が設定されている場合、指定された BE ノードでのみデータにアクセスします。 | バージョン 2.1.2 以降でサポート                                      |
| `column_separator`      | 列区切り文字。オプションで、デフォルトは `\t` です。                                                                                                                                 |                                                                       |
| `line_delimiter`        | 行区切り文字。オプションで、デフォルトは `\n` です。                                                                                                                                   |                                                                       |
| `compress_type`         | 圧縮タイプ。オプションです。サポートされているタイプは `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK` です。デフォルトは `UNKNOWN` で、`uri` の拡張子からタイプが自動的に推論されます。 |                                                                       |
| `read_json_by_line`     | JSON 形式のインポート用。オプションで、デフォルトは `true` です。                                                                                                                            | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array`     | JSON 形式のインポート用。オプションで、デフォルトは `false` です。                                                                                                                           | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `json_root`             | JSON 形式のインポート用。オプションで、デフォルトは空です。                                                                                                                               | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `json_paths`            | JSON 形式のインポート用。オプションで、デフォルトは空です。                                                                                                                               | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `num_as_string`         | JSON 形式のインポート用。オプションで、デフォルトは `false` です。                                                                                                                            | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `fuzzy_parse`           | JSON 形式のインポート用。オプションで、デフォルトは `false` です。                                                                                                                            | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `trim_double_quotes`    | CSV 形式のインポート用。オプションで、デフォルトは `false` です。true の場合、CSV ファイル内の各フィールドの最外側の二重引用符を削除します。                                          | CSV 形式用                                                           |
| `skip_lines`            | CSV 形式のインポート用。オプションで、デフォルトは `0` です。CSV ファイルの最初の数行をスキップすることを意味します。形式が `csv_with_names` または `csv_with_names_and_types` の場合、このパラメータは無視されます。 | CSV 形式用                                                           |
| `path_partition_keys`   | オプション。ファイルパスに含まれるパーティション列名を指定します。例：`/path/to/city=beijing/date="2023-07-09"` の場合、`path_partition_keys="city,date"` と記入します。これにより、対応する列名と値がパスから自動的に読み取られ、インポートに使用されます。 |                                                                       |
| `enable_mapping_varbinary` | デフォルトは false です。PARQUET/ORC を読み取る際、BYTE_ARRAY タイプを STRING にマップします。有効にすると、VARBINARY タイプにマップします。 | 4.0.3 以降でサポート |

## アクセス制御要件
| Privilege  | Object | 注釈 |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |


## 使用上の注意

- local tvf のより詳細な使用方法については、[S3](./s3.md) tvf を参照してください。両者の唯一の違いは、ストレージシステムへのアクセス方法です。

- local tvf を通じた NAS 上のデータへのアクセス

  NAS 共有ストレージは、複数のノードに同時にマウントできます。各ノードは、ローカルファイルと同様に共有ストレージ内のファイルにアクセスできます。そのため、NAS をローカルファイルシステムとして考え、local tvf を通じてアクセスできます。

  `"shared_storage" = "true"` を設定すると、Doris は指定されたファイルが任意の BE ノードからアクセス可能であると判断します。ワイルドカードを使用してファイルのセットが指定された場合、Doris はファイルへのアクセス要求を複数の BE ノードに分散し、複数のノードを使用して分散ファイルスキャンを実行し、クエリパフォーマンスを向上させます。


## 例

指定した BE 上のログファイルを解析：

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
path `${DORIS_HOME}/student.csv` にあるcsv形式のファイルを読み取り、アクセスします：

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

Query files on NAS:
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

Can be used with `desc function` :
```sql
desc function local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");

```
```text
+-------+------+------+-------+---------+-------+
| Field | タイプ | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+

```
