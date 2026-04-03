---
{
  "title": "LOCAL | table Valued Functions",
  "sidebar_label": "LOCAL",
  "description": "Local table-valued-function(tvf)は、ユーザーがbeノード上のローカルファイルの内容を読み取りアクセスすることを可能にし、リレーショナルtableにアクセスするのと同様に操作できます。",
  "language": "ja"
}
---
# LOCAL

## デスクリプション

Local table-valued-function(tvf)は、ユーザーがbeノード上のローカルファイルの内容を、リレーショナルtableにアクセスするのと同じように読み取りおよびアクセスできるようにします。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`ファイル形式をサポートしています。

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
| Parameter         | デスクリプション                                                                                                                                                                          | Remarks                                           |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `file_path`       | 読み取り対象ファイルのパスで、`user_files_secure_path`ディレクトリからの相対パスです。`user_files_secure_path`パラメータはBE設定項目です。<br />パスには`..`を含めることはできません。パターンマッチングには`logs/*.log`のようなglob構文が使用できます。 |                                                   |
| `backend_id`      | ファイルが配置されているBEノードのIDです。`show backends`コマンドで取得できます。                                                                                  | バージョン2.1.1以前では、Dorisはそのノード上のローカルデータファイルを読み取るためのBEノードの指定のみをサポートしています。 |
| `format`          | ファイル形式で、必須です。サポートされている形式は`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`です。                                                                             |                                                   |

## オプションパラメータ
| Parameter              | デスクリプション                                                                                                                                                                       | Remarks                                                                |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `shared_storage`        | デフォルトはfalseです。trueの場合、指定されたファイルは共有ストレージ（NASなど）に配置されます。共有ストレージはPOSIXファイルインターフェースをサポートし、すべてのBEノードにマウントされている必要があります。<br />`shared_storage`がtrueの場合、`backend_id`は省略可能です。DorisはすべてのBEノードを利用してデータにアクセスする場合があります。`backend_id`が設定されている場合、指定されたBEノードでのみデータにアクセスします。 | バージョン2.1.2以降でサポート                                      |
| `column_separator`      | 列区切り文字で、オプション、デフォルトは`\t`です。                                                                                                                                 |                                                                       |
| `line_delimiter`        | 行区切り文字で、オプション、デフォルトは`\n`です。                                                                                                                                   |                                                                       |
| `compress_type`         | 圧縮タイプで、オプションです。サポートされているタイプは`UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`です。デフォルトは`UNKNOWN`で、`uri`の拡張子からタイプが自動的に推測されます。 |                                                                       |
| `read_json_by_line`     | JSON形式のインポート用で、オプション、デフォルトは`true`です。                                                                                                                            | 参照: Json Load |
| `strip_outer_array`     | JSON形式のインポート用で、オプション、デフォルトは`false`です。                                                                                                                           | 参照: Json Load |
| `json_root`             | JSON形式のインポート用で、オプション、デフォルトは空です。                                                                                                                               | 参照: Json Load |
| `json_paths`            | JSON形式のインポート用で、オプション、デフォルトは空です。                                                                                                                               | 参照: Json Load |
| `num_as_string`         | JSON形式のインポート用で、オプション、デフォルトは`false`です。                                                                                                                            | 参照: Json Load |
| `fuzzy_parse`           | JSON形式のインポート用で、オプション、デフォルトは`false`です。                                                                                                                            | 参照: Json Load |
| `trim_double_quotes`    | CSV形式のインポート用で、オプション、デフォルトは`false`です。trueの場合、CSVファイルの各フィールドの最外部の二重引用符をトリムします。                                          | CSV形式用                                                           |
| `skip_lines`            | CSV形式のインポート用で、オプション、デフォルトは`0`で、CSVファイルの最初の数行をスキップすることを意味します。形式が`csv_with_names`または`csv_with_names_and_types`の場合、このパラメータは無視されます。 | CSV形式用                                                           |
| `path_partition_keys`   | オプションで、ファイルパスに含まれるパーティション列名を指定します。例：`/path/to/city=beijing/date="2023-07-09"`の場合、`path_partition_keys="city,date"`と記入します。これにより、パスから対応する列名と値を自動的に読み取ってインポートに使用します。 |                                                                       |
| `enable_mapping_varbinary` | デフォルトはfalseです。PARQUET/ORCを読み取る際、BYTE_ARRAY型をSTRINGにマッピングします。有効にすると、VARBINARY型にマッピングします。 | 4.0.3以降でサポート |

## アクセス制御要件
| Privilege  | Object | 注釈 |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |


## 使用上の注意

- local tvfの詳細な使用方法については、[S3](./s3.md) tvfを参照してください。両者の唯一の違いは、ストレージシステムへのアクセス方法です。

- local tvfを通じてNAS上のデータにアクセス

  NAS共有ストレージは、複数のノードに同時にマウントすることができます。各ノードは、ローカルファイルと同様に共有ストレージ内のファイルにアクセスできます。そのため、NASはローカルファイルシステムとして考えることができ、local tvfを通じてアクセスします。

  `"shared_storage" = "true"`を設定すると、Dorisは指定されたファイルが任意のBEノードからアクセス可能であると判断します。ワイルドカードを使用して一連のファイルが指定された場合、Dorisはファイルアクセス要求を複数のBEノードに分散し、複数のノードを使用して分散ファイルスキャンを実行し、クエリ性能を向上させます。


## 使用例

指定されたBE上のログファイルを解析：

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
パス `${DORIS_HOME}/student.csv` に配置されたcvs形式ファイルを読み取りおよびアクセスする：

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
