---
{
    "title": "HDFS | テーブル値関数",
    "language": "ja",
    "description": "HDFS テーブル値関数を使用して、HDFS 上のファイルをリレーショナルテーブルとして読み取ります。",
    "sidebar_label": "HDFS"
}
---

<a id="local"></a>

# HDFS {#hdfs}

## 説明 {#description}

HDFS テーブル値関数（TVF）は、HDFS 上のファイルをリレーショナルテーブルとして読み取ります。`csv`、`csv_with_names`、`csv_with_names_and_types`、`json`、`parquet`、`orc`、`avro` の形式をサポートします。

## 構文 {#syntax}

```sql
HDFS(
    "uri" = "<uri>",
    "fs.defaultFS" = "<fs_defaultFS>",
    "hadoop.username" = "<hadoop_username>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## パラメータ {#parameters}

### 必須パラメータ {#required-parameters}

| パラメータ | 説明 |
| --- | --- |
| `uri` | 読み取るファイルの HDFS URI。パスが存在しない場合やファイルが空の場合、TVF は空の結果を返します。 |
| `fs.defaultFS` | デフォルトの HDFS ファイルシステム URI。 |
| `hadoop.username` | HDFS ユーザー名。空でない文字列を指定します。 |
| `format` | ファイル形式：`csv`、`csv_with_names`、`csv_with_names_and_types`、`json`、`parquet`、`orc`、`avro`。 |

### オプションパラメータ {#optional-parameters}

`<optional_property_key>` には以下のキーを、`<optional_property_value>` にはそれぞれに対応する値を指定します。

| パラメータ | 説明 | 備考 |
| --- | --- | --- |
| `hadoop.security.authentication` | HDFS の認証方式。 | |
| `hadoop.kerberos.principal` | Kerberos プリンシパル。 | |
| `hadoop.kerberos.keytab` | Kerberos キータブファイル。 | |
| `dfs.client.read.shortcircuit` | HDFS のショートサーキット読み取りを有効にします。 | |
| `dfs.domain.socket.path` | ドメインソケットのパス。 | |
| `dfs.nameservices` | HA モードで使用する nameservice。 | |
| `dfs.ha.namenodes.<nameservice>` | HA モードで指定した nameservice の NameNode ID。 | |
| `dfs.namenode.rpc-address.<nameservice>.<namenode>` | 指定した NameNode の RPC アドレス。 | |
| `dfs.client.failover.proxy.provider.<nameservice>` | nameservice のフェイルオーバープロキシプロバイダークラス。 | |
| `column_separator` | 列区切り文字。デフォルトは `\t`。 | |
| `line_delimiter` | 行区切り文字。デフォルトは `\n`。 | |
| `compress_type` | 圧縮形式：`UNKNOWN`、`PLAIN`、`GZ`、`LZO`、`BZ2`、`LZ4FRAME`、`DEFLATE`、`SNAPPYBLOCK`。デフォルトは `UNKNOWN` で、URI の拡張子から圧縮形式を推定します。 | |
| `read_json_by_line` | JSON を行単位で読み取ります。デフォルトは `true`。 | [JSON データロード](../../../data-operate/import/file-format/json) |
| `strip_outer_array` | JSON の最外層の配列を取り除きます。デフォルトは `false`。 | [JSON データロード](../../../data-operate/import/file-format/json) |
| `json_root` | JSON のルートパス。デフォルトは空です。 | [JSON データロード](../../../data-operate/import/file-format/json) |
| `json_paths` | JSON フィールドのパス。デフォルトは空です。 | [JSON データロード](../../../data-operate/import/file-format/json) |
| `num_as_string` | JSON の数値を文字列として読み取ります。デフォルトは `false`。 | [JSON データロード](../../../data-operate/import/file-format/json) |
| `fuzzy_parse` | JSON のファジー解析を有効にします。デフォルトは `false`。 | [JSON データロード](../../../data-operate/import/file-format/json) |
| `trim_double_quotes` | CSV 用の真偽値。デフォルトは `false`。有効にすると、各フィールドの外側の二重引用符を取り除きます。 | |
| `skip_lines` | CSV 用の整数値。デフォルトは `0`。先頭の行をスキップします。`csv_with_names` と `csv_with_names_and_types` では無視されます。 | |
| `path_partition_keys` | パスに含まれるパーティション列名をカンマで区切って指定します。`/path/to/city=beijing/date=2023-07-09` の場合、`city,date` を指定すると、それらの値を抽出できます。 | |
| `resource` | HDFS へのアクセスに使用する既存の HDFS Resource。[CREATE RESOURCE](../../sql-statements/cluster-management/compute-management/CREATE-RESOURCE) を参照してください。 | 2.1.4 以降 |
| `enable_mapping_varbinary` | 開発版では互換性のためだけに受け付けられ、値は無視されます。外部のバイナリデータは常に `VARBINARY` にマッピングされます。Doris 4.1.5 では、この TVF オプションは引き続き設定可能で、デフォルトは `false` です。 | 4.0.3 以降 |
| `enable_mapping_timestamp_tz` | 4.1.5 以降、互換性のためだけに受け付けられ、値は無視されます。Parquet Timestamp の `isAdjustedToUTC=true` と ORC の `TIMESTAMP_INSTANT` は、このオプションが `false` でも常に `TIMESTAMPTZ` にマッピングされます。 | 4.0.3 以降 |
| `hive.parquet.time-zone` | 省略可能な文字列で、デフォルトは空です。Parquet INT96 の書き込み元のタイムゾーンを指定します。IANA タイムゾーン、または `-12:00` から `+14:00` までの UTC オフセットを指定できます。`CST` や `PRC` などの短い別名は使用できません。[Parquet](../../../lakehouse/file-formats/parquet.md#timestamp-and-date-compatibility) を参照してください。 | 4.1.5 以降 |

### アクセス制御の要件 {#access-control-requirements}

`resource` パラメータを使用する場合、クエリを実行するユーザーには、その Resource に対する `USAGE` 権限が必要です。また、Doris から HDFS にネットワーク経由でアクセスでき、対象ファイルに対する有効な HDFS または Kerberos の認証情報が必要です。

## 戻り値 {#return-value}

ファイルから列名と型を推定したテーブルを返します。NULL フィールドは SQL NULL として返されます。存在しないパスや空のファイルに対しては、空の結果を返します。パラメータが無効な場合、ストレージにアクセスできない場合、またはファイルの形式が不正な場合は、解析または実行に失敗することがあります。

## 例 {#examples}

以下の例では、HDFS ファイル `student.csv` に次の内容が含まれているものとします。

```text
1,alice,18
2,bob,20
3,jack,24
4,jackson,19
5,liming,18
```

### CSV ファイルを読み取る {#read-a-csv-file}

```sql
SELECT * FROM HDFS(
    "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8424",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ","
);
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

### HA 構成の HDFS から CSV ファイルを読み取る {#read-a-csv-file-from-ha-hdfs}

HA クラスターの nameservice と両方の NameNode アドレスを設定します。URI と `fs.defaultFS` には論理 nameservice を使用します。

```sql
SELECT * FROM HDFS(
    "uri" = "hdfs://my_hdfs/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://my_hdfs",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ",",
    "dfs.nameservices" = "my_hdfs",
    "dfs.ha.namenodes.my_hdfs" = "nn1,nn2",
    "dfs.namenode.rpc-address.my_hdfs.nn1" = "namenode01:8020",
    "dfs.namenode.rpc-address.my_hdfs.nn2" = "namenode02:8020",
    "dfs.client.failover.proxy.provider.my_hdfs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
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

### 推定されたスキーマを確認する {#inspect-the-inferred-schema}

```sql
DESC FUNCTION HDFS(
    "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8424",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ","
);
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

## 使用上の注意 {#usage-notes}

その他の一般的なファイルオプションについては、[S3 TVF](./s3.md) を参照してください。HDFS 固有の認証と HA の設定については、[HDFS ストレージ](../../../lakehouse/storages/hdfs.md) を参照してください。
