---
{
  "title": "ローカル",
  "language": "ja",
  "description": "ローカルテーブル値関数（tvf）は、ユーザーがbeノード上のローカルファイルの内容をリレーショナルテーブルにアクセスするのと同じように読み取りおよびアクセスすることを可能にします。"
}
---
## 説明

ローカルテーブル値関数(tvf)は、ユーザーがbeノード上のローカルファイルの内容を、リレーショナルテーブルにアクセスするように読み取りアクセスできるようにします。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`ファイル形式をサポートしています。

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
| Parameter         | Description                                                                                                                                                                          | Remarks                                           |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `file_path`       | 読み取るファイルのパスで、`user_files_secure_path` ディレクトリからの相対パスです。`user_files_secure_path` パラメータは [BE設定項目](../../../admin-manual/config/be-config.md) です。<br /> パスに `..` を含めることはできません。また、`logs/*.log` などのパターンマッチングにglobシンタックスを使用できます。 |                                                   |
| `backend_id`      | ファイルが配置されているBEノードのID。`show backends` コマンドで取得できます。                                                                                                  | バージョン2.1.1以前では、Dorisはそのノード上のローカルデータファイルを読み取るためのBEノード指定のみをサポートします。 |
| `format`          | ファイル形式で、必須です。サポートされている形式は `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` です。                                                                             |                                                   |

## オプションパラメータ
| Parameter              | Description                                                                                                                                                                       | Remarks                                                                |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `shared_storage`        | デフォルトはfalseです。trueの場合、指定されたファイルは共有ストレージ（例：NAS）上に配置されています。共有ストレージはPOSIXファイルインターフェースをサポートし、全てのBEノードにマウントされている必要があります。<br /> `shared_storage` がtrueの場合、`backend_id` は省略可能です。DorisはすべてのBEノードを利用してデータにアクセスする場合があります。`backend_id` が設定されている場合、指定されたBEノードでのみデータにアクセスします。 | バージョン2.1.2から対応                                      |
| `column_separator`      | カラム区切り文字、オプション、デフォルトは `\t` です。                                                                                                                                 |                                                                       |
| `line_delimiter`        | 行区切り文字、オプション、デフォルトは `\n` です。                                                                                                                                   |                                                                       |
| `compress_type`         | 圧縮タイプ、オプション。サポートされているタイプは `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK` です。デフォルトは `UNKNOWN` で、`uri` サフィックスからタイプが自動的に推論されます。 |                                                                       |
| `read_json_by_line`     | JSON形式のインポート用、オプション、デフォルトは `true` です。                                                                                                                            | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array`     | JSON形式のインポート用、オプション、デフォルトは `false` です。                                                                                                                           | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `json_root`             | JSON形式のインポート用、オプション、デフォルトは空です。                                                                                                                               | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `json_paths`            | JSON形式のインポート用、オプション、デフォルトは空です。                                                                                                                               | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `num_as_string`         | JSON形式のインポート用、オプション、デフォルトは `false` です。                                                                                                                            | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `fuzzy_parse`           | JSON形式のインポート用、オプション、デフォルトは `false` です。                                                                                                                            | 参照：[Json Load](../../../data-operate/import/file-format/json) |
| `trim_double_quotes`    | CSV形式のインポート用、オプション、デフォルトは `false` です。trueの場合、CSVファイル内の各フィールドの最外側のダブルクォートを削除します。                                          | CSV形式用                                                           |
| `skip_lines`            | CSV形式のインポート用、オプション、デフォルトは `0` で、CSVファイルの最初の数行をスキップすることを意味します。形式が `csv_with_names` または `csv_with_names_and_types` の場合、このパラメータは無視されます。 | CSV形式用                                                           |
| `path_partition_keys`   | オプション、ファイルパスに含まれるパーティションカラム名を指定します。例：`/path/to/city=beijing/date="2023-07-09"` の場合、`path_partition_keys="city,date"` と記入します。これにより、パスから対応するカラム名と値を自動的に読み取ってインポートします。 |                                                                       |


## アクセス制御要件
| Privilege  | Object | Notes |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |


## 使用上の注意

- local tvfのより詳細な使用方法については、[S3](./s3.md) tvfを参照してください。両者の唯一の違いは、ストレージシステムへのアクセス方法です。

- local tvfを通じてNAS上のデータにアクセス

  NAS共有ストレージは複数のノードに同時にマウントすることができます。各ノードはローカルファイルと同じように共有ストレージ内のファイルにアクセスできます。そのため、NASはローカルファイルシステムと考えることができ、local tvfを通じてアクセスします。

  `"shared_storage" = "true"` を設定すると、Dorisは指定されたファイルが任意のBEノードからアクセス可能であると認識します。ワイルドカードを使用してファイルセットが指定された場合、Dorisはファイルにアクセスするリクエストを複数のBEノードに分散し、複数のノードを使用して分散ファイルスキャンを実行し、クエリパフォーマンスを向上させます。


## 使用例

指定されたBE上のログファイルを分析：

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
パス `${DORIS_HOME}/student.csv` にあるcsv形式のファイルを読み取りアクセスします：

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
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+

```
