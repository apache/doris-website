---
{
  "title": "LOCAL | table値関数",
  "sidebar_label": "LOCAL",
  "description": "ローカルtable値関数（tvf）は、ユーザーがbeノード上のローカルファイルの内容を、リレーショナルtableにアクセスするのと同様に読み取りおよびアクセスすることを可能にします。",
  "language": "ja"
}
---
# LOCAL

## デスクリプション

Local table-valued-function(tvf)は、ユーザーがbeノード上のローカルファイルの内容を読み取りアクセスすることを可能にし、リレーショナルtableにアクセスするのと同様に扱えます。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`ファイル形式をサポートしています。

## syntax

```sql
LOCAL(
  "file_path" = "<file_path>", 
  "backend_id" = "<backend_id>",
  "format" = "<format>"
  [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```
## Required パラメータ
| Parameter         | デスクリプション                                                                                                                                                                                          | Remarks                                           |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `file_path`       | 読み取り対象のファイルパス。`user_files_secure_path`ディレクトリに対する相対パスで指定します。`user_files_secure_path`パラメータはBEの設定項目です。<br />パスには`..`を含めることはできません。パターンマッチングにはglobシンタックスを使用できます（例：`logs/*.log`）。 |                                                   |
| `backend_id`      | ファイルが配置されているBEノードのID。`show backends`コマンドで取得できます。                                                                                                  | バージョン2.1.1より前では、Dorisは指定したBEノード上のローカルデータファイルの読み取りのみをサポートしており、BEノードの指定が必要でした。 |
| `format`          | ファイル形式。必須項目です。サポートされている形式は`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`です。                                                                             |                                                   |

## Optional パラメータ
| Parameter              | デスクリプション                                                                                                                                                       | Remarks                                                                |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `shared_storage`        | デフォルトは false。true の場合、指定されたファイルは共有ストレージ（例：NAS）上に配置されます。共有ストレージはPOSIXファイルインターフェースをサポートし、全BEノードにマウントされている必要があります。<br />`shared_storage`がtrueの場合、`backend_id`は省略可能です。DorisはすべてのBEノードを利用してデータにアクセスすることがあります。`backend_id`が設定されている場合、指定されたBEノードでのみデータにアクセスします。 | バージョン2.1.2からサポート                                      |
| `column_separator`      | カラム区切り文字。オプション。デフォルトは`\t`。                                                                                                                                 |                                                                       |
| `line_delimiter`        | 行区切り文字。オプション。デフォルトは`\n`。                                                                                                                                   |                                                                       |
| `compress_type`         | 圧縮タイプ。オプション。サポートされているタイプは`UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`。デフォルトは`UNKNOWN`で、`uri`の拡張子から自動的に推論されます。 |                                                                       |
| `read_json_by_line`     | JSON形式のインポート用。オプション。デフォルトは`true`。                                                                                                                            | 参照: [Json Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array`     | JSON形式のインポート用。オプション。デフォルトは`false`。                                                                                                                           | 参照: [Json Load](../../../data-operate/import/file-format/json) |
| `json_root`             | JSON形式のインポート用。オプション。デフォルトは空。                                                                                                                               | 参照: [Json Load](../../../data-operate/import/file-format/json) |
| `json_paths`            | JSON形式のインポート用。オプション。デフォルトは空。                                                                                                                               | 参照: [Json Load](../../../data-operate/import/file-format/json) |
| `num_as_string`         | JSON形式のインポート用。オプション。デフォルトは`false`。                                                                                                                            | 参照: [Json Load](../../../data-operate/import/file-format/json) |
| `fuzzy_parse`           | JSON形式のインポート用。オプション。デフォルトは`false`。                                                                                                                            | 参照: [Json Load](../../../data-operate/import/file-format/json) |
| `trim_double_quotes`    | CSV形式のインポート用。オプション。デフォルトは`false`。trueの場合、CSVファイルの各フィールドの最外側のダブルクオートをトリムします。                                          | CSV形式用                                                           |
| `skip_lines`            | CSV形式のインポート用。オプション。デフォルトは`0`。CSVファイルの最初の数行をスキップします。形式が`csv_with_names`または`csv_with_names_and_types`の場合、このパラメータは無視されます。 | CSV形式用                                                           |
| `path_partition_keys`   | オプション。ファイルパスに含まれるパーティションカラム名を指定します（例：`/path/to/city=beijing/date="2023-07-09"`の場合、`path_partition_keys="city,date"`と記入）。パスから対応するカラム名と値を自動的に読み取ってインポートします。 |                                                                       |
| `enable_mapping_varbinary` | デフォルトは false。PARQUET/ORC読み取り時にBYTE_ARRAY型をSTRING型にマッピングします。有効にすると、VARBINARY型にマッピングします。 | 4.0.3以降でサポート |

## Access Control Requirements
| Privilege  | Object | 注釈 |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |


## Usage 注釈

- local tvfのより詳細な使用方法については、[S3](./s3.md) tvfを参照してください。両者の唯一の違いはストレージシステムへのアクセス方法です。

- local tvfを通じたNAS上のデータへのアクセス

  NAS共有ストレージは同時に複数のノードにマウントすることができます。各ノードは、ローカルファイルと同様に共有ストレージ内のファイルにアクセスできます。そのため、NASはローカルファイルシステムとして扱うことができ、local tvfを通じてアクセスします。

  `"shared_storage" = "true"`を設定した場合、Dorisは指定されたファイルが任意のBEノードからアクセス可能であると判断します。ワイルドカードを使用して一連のファイルが指定された場合、Dorisはファイルへのアクセス要求を複数のBEノードに分散し、複数のノードを使用して分散ファイルスキャンを実行し、クエリパフォーマンスを向上させます。


## Examples

指定されたBE上のログファイルを分析する：

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
path `${DORIS_HOME}/student.csv` に配置されたcsv形式のファイルを読み取りおよびアクセスします：

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
