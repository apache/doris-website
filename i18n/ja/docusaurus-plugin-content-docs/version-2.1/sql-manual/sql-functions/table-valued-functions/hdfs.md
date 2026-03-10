---
{
  "title": "HDFS | テーブル値関数",
  "language": "ja",
  "description": "HDFSテーブル値関数(tvf)は、ユーザーがS3互換オブジェクトストレージ上のファイル内容を、リレーショナルテーブルにアクセスするのと同じように読み取りおよびアクセスすることを可能にします。",
  "sidebar_label": "HDFS"
}
---
# HDFS

## 説明

HDFSテーブル値関数(tvf)は、ユーザーがS3互換オブジェクトストレージ上のファイル内容を、リレーショナルテーブルにアクセスするのと同じように読み取りおよびアクセスすることを可能にします。現在、`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`ファイル形式をサポートしています。

## 構文

```sql
HDFS(
    "uri" = "<uri>",
    "fs.defaultFS" = "<fs_defaultFS>",
    "hadoop.username" = "<hadoop_username>",
    "format" = "<format>",
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```
## 必須パラメータ
| パラメータ              | 説明                                                                                                            |
|------------------------|------------------------------------------------------------------------------------------------------------------------|
| `uri`                  | HDFSにアクセスするためのURI。URIパスが存在しない場合やファイルが空の場合、HDFS TVFは空のセットを返します。 |
| `fs.defaultFS`         | HDFSのデフォルトファイルシステムURI                                                                                    |
| `hadoop.username`      | 必須、任意の文字列を指定できますが空にはできません。                                                                        |
| `format`               | ファイル形式、必須。現在`csv/csv_with_names/csv_with_names_and_types/json/parquet/orc/avro`をサポートしています。           |

## オプションパラメータ

上記構文の`optional_property_key`では、必要に応じて以下のリストから対応するパラメータを選択でき、`optional_property_value`はそのパラメータの値です

| パラメータ                                   | 説明                                                                                                                                  | 備考                                                                             |
|---------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|
| `hadoop.security.authentication`            | HDFSセキュリティ認証タイプ                                                                                                            |                                                                                     |
| `hadoop.username`                           | 代替HDFSユーザー名                                                                                                                    |                                                                                     |
| `hadoop.kerberos.principal`                 | Kerberosプリンシパル                                                                                                                           |                                                                                     |
| `hadoop.kerberos.keytab`                    | Kerberos keytab                                                                                                                                 |                                                                                     |
| `dfs.client.read.shortcircuit`              | short-circuit読み取りを有効化                                                                                                                    |                                                                                     |
| `dfs.domain.socket.path`                   | ドメインソケットパス                                                                                                                           |                                                                                     |
| `dfs.nameservices`                          | HAモードのnameservice                                                                                                                  |                                                                                     |
| `dfs.ha.namenodes.your-nameservices`        | HAモードでのnamenodeの設定                                                                                                        |                                                                                     |
| `dfs.namenode.rpc-address.your-nameservices.your-namenode` | namenodeのRPCアドレスを指定                                                                                                     |                                                                                     |
| `dfs.client.failover.proxy.provider.your-nameservices` | フェイルオーバー用のプロキシプロバイダーを指定                                                                                                      |                                                                                     |
| `column_separator`                          | カラム区切り文字、デフォルトは`\t`                                                                                                            |                                                                                     |
| `line_delimiter`                            | 行区切り文字、デフォルトは`\n`                                                                                                              |                                                                                     |
| `compress_type`                             | サポートタイプ：`UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`。デフォルトは`UNKNOWN`で、URI拡張子に基づいてタイプが自動推測されます。 |                                                                                     |
| `read_json_by_line`                         | JSON形式のインポート用、デフォルトは`true`                                                                                                   | 参照: [JSON Load](../../../data-operate/import/file-format/json) |
| `strip_outer_array`                         | JSON形式のインポート用、デフォルトは`false`                                                                                                  | 参照: [JSON Load](../../../data-operate/import/file-format/json) |
| `json_root`                                 | JSON形式のインポート用、デフォルトは空                                                                                                   | 参照: [JSON Load](../../../data-operate/import/file-format/json) |
| `json_paths`                                | JSON形式のインポート用、デフォルトは空                                                                                                   | 参照: [JSON Load](../../../data-operate/import/file-format/json) |
| `num_as_string`                             | JSON形式のインポート用、デフォルトは`false`                                                                                                 | 参照: [JSON Load](../../../data-operate/import/file-format/json) |
| `fuzzy_parse`                               | JSON形式のインポート用、デフォルトは`false`                                                                                                 | 参照: [JSON Load](../../../data-operate/import/file-format/json) |
| `trim_double_quotes`                        | CSV形式のインポート用、ブール型。デフォルトは`false`。`true`の場合、各フィールドの最外側の二重引用符を削除します。                  |                                                                                     |
| `skip_lines`                                | CSV形式のインポート用、整数型。デフォルトは0。CSVファイルの最初の数行をスキップします。`csv_with_names`または`csv_with_names_and_types`が設定されている場合、このパラメータは無視されます。 |                                                                                     |
| `path_partition_keys`                       | ファイルパスに含まれるパーティションカラム名を指定します。例えば`/path/to/city=beijing/date="2023-07-09"`の場合、`path_partition_keys="city,date"`と入力すると、パスから対応するカラム名と値を自動的に読み取ってインポートします。 |                                                                                     |
| `resource`                                  | リソース名を指定します。HDFS TVFは既存のHDFSリソースを使用してHDFSに直接アクセスできます。HDFSリソースの作成については[CREATE-RESOURCE](../../sql-statements/cluster-management/compute-management/CREATE-RESOURCE)を参照してください。 | バージョン2.1.4以降でサポート。                                            |

## アクセス制御要件

| 権限     | オブジェクト | 備考 |
|:--------------|:-------|:------|
| USAGE_PRIV    | table  |       |
| SELECT_PRIV   | table  |       |


## 例

- hdfsストレージ上のcsv形式ファイルの読み取りとアクセス。

  ```sql
  select * from hdfs(
                "uri" = "hdfs://127.0.0.1:842/user/doris/csv_format_test/student.csv",
                "fs.defaultFS" = "hdfs://127.0.0.1:8424",
                "hadoop.username" = "doris",
                "format" = "csv");
  ```
  ```text
    +------+---------+------+
    | c1   | c2      | c3   |
    +------+---------+------+
    | 1    | alice   | 18   |
    | 2    | bob     | 20   |
    | 3    | jack    | 24   |
    | 4    | jackson | 19   |
    | 5    | liming  | 18   |
    +------+---------+------+
  ```
- HA モードの hdfs ストレージ上の csv 形式ファイルを読み取りおよびアクセスする。

  ```sql
  select * from hdfs(
              "uri" = "hdfs://127.0.0.1:842/user/doris/csv_format_test/student.csv",
              "fs.defaultFS" = "hdfs://127.0.0.1:8424",
              "hadoop.username" = "doris",
              "format" = "csv",
              "dfs.nameservices" = "my_hdfs",
              "dfs.ha.namenodes.my_hdfs" = "nn1,nn2",
              "dfs.namenode.rpc-address.my_hdfs.nn1" = "nanmenode01:8020",
              "dfs.namenode.rpc-address.my_hdfs.nn2" = "nanmenode02:8020",
              "dfs.client.failover.proxy.provider.my_hdfs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider");
  ```
  ```text
    +------+---------+------+
    | c1   | c2      | c3   |
    +------+---------+------+
    | 1    | alice   | 18   |
    | 2    | bob     | 20   |
    | 3    | jack    | 24   |
    | 4    | jackson | 19   |
    | 5    | liming  | 18   |
    +------+---------+------+
  ```
- `desc function` と一緒に使用できます：

  ```sql
  desc function hdfs(
              "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student_with_names.csv",
              "fs.defaultFS" = "hdfs://127.0.0.1:8424",
              "hadoop.username" = "doris",
              "format" = "csv_with_names");
  ```
