---
{
  "title": "BROKER LOAD",
  "language": "ja",
  "description": "Broker Loadは、Dorisにおけるデータインポート方法で、主にHDFSやS3などのリモートストレージシステムから大規模データをインポートするために使用されます。"
}
---
## 説明

Broker LoadはDorisにおけるデータインポート手法で、主にHDFSやS3などのリモートストレージシステムから大規模データをインポートするために使用されます。MySQL APIを通じて開始され、非同期インポート手法です。インポートの進行状況と結果は`SHOW LOAD`文を使用してクエリできます。

以前のバージョンでは、S3 LoadとHDFS LoadはBrokerプロセスに依存していました。現在は、追加のBrokerプロセスに依存することなく、データソースから直接データを読み取ります。それでも、類似した構文のため、S3 Load、HDFS Load、Broker Loadは総称してBroker Loadと呼ばれています。

## 構文

```sql
LOAD LABEL [<db_name>.]<load_label>
(
[ { MERGE | APPEND | DELETE } ]
DATA INFILE
(
"<file_path>"[, ...]
)
[ NEGATIVE ]
INTO TABLE `<table_name>`
[ PARTITION ( <partition_name> [ , ... ] ) ]
[ COLUMNS TERMINATED BY "<column_separator>" ]
[ LINES TERMINATED BY "<line_delimiter>" ]
[ FORMAT AS "<file_type>" ]
[ COMPRESS_TYPE AS "<compress_type>" ]
[ (<column_list>) ]
[ COLUMNS FROM PATH AS (<column_name> [ , ... ] ) ]
[ SET (<column_mapping>) ]
[ PRECEDING FILTER <predicate> ]
[ WHERE <predicate> ]
[ DELETE ON <expr> ]
[ ORDER BY <source_sequence> ]
[ PROPERTIES ("<key>"="<value>" [, ...] ) ]
)
WITH BROKER "<broker_name>"
(   <broker_properties>
    [ , ... ])
[ PROPERTIES (
    <load_properties>
    [ , ... ]) ]
[COMMENT "<comment>" ];
```
## 必須パラメータ

**1. `<db_name>`**
> インポート対象のデータベース名を指定します。

**2. `<load_label>`**
> 各インポートタスクには一意のLabelを指定する必要があります。このLabelを使用して後でジョブの進行状況を照会できます。

**3. `<table_name>`**
> インポートタスクに対応するテーブルを指定します。

**4. `<file_path>`**
> インポートするファイルパスを指定します。複数のパスを指定でき、ワイルドカードも使用できます。パスは最終的にファイルと一致する必要があります。ディレクトリのみと一致する場合、インポートは失敗します。

**5. `<broker_name>`**
> 使用するBrokerサービスの名前を指定します。例えば、パブリッククラウドDorisでは、Brokerサービス名は`bos`です。

**6. `<broker_properties>`**
> brokerで必要な情報を指定します。この情報は通常、BrokerがBOSやHDFSなどのリモートストレージシステムにアクセスできるようにするために使用されます。
>
>```text
>  (
>      "username" = "user",
>      "password" = "pass",
>      ...
>  )
>```

## オプションパラメータ

**1. `merge | append | delete`**  
> データマージタイプ。デフォルトは`append`で、このインポートが通常の追記書き込み操作であることを示します。`merge`と`delete`タイプはunique keyモデルのテーブルにのみ適用されます。`merge`タイプは`[delete on]`文と組み合わせて使用し、削除フラグ列をマークする必要があります。`delete`タイプは今回インポートされるすべてのデータが削除データであることを示します。

**2. `negative`**  
> 「負の」インポートを示します。この方法は整数sum集計タイプの集計データテーブルにのみ適用されます。インポートデータ内のsum集計列に対応する整数値を負の値にし、誤ったデータを相殺するために使用されます。

**3. `<partition_name>`**  
> テーブルの特定のパーティションのみをインポートするよう指定します。例：`partition (p1, p2,...)`。パーティション範囲外の他のデータは無視されます。

**4. `<column_separator>`**  
> 列区切り文字を指定します。CSV形式でのみ有効で、単一バイト区切り文字のみ指定できます。

**5. `<line_delimiter>`**  
> 行区切り文字を指定します。CSV形式でのみ有効で、単一バイト区切り文字のみ指定できます。

**6. `<file_type>`**  
> ファイル形式を指定します。`csv`（デフォルト）、`parquet`、`orc`形式をサポートします。

**7. `<compress_type>`**  
> ファイル圧縮タイプを指定します。`gz`、`bz2`、`lz4frame`をサポートします。

**8. `<column_list>`**  
> 元のファイル内の列順序を指定します。

**9. `columns from path as (<c1>, <c2>,...)`**  
> インポートファイルパスから抽出する列を指定します。

**10. `<column_mapping>`**  
> 列変換関数を指定します。

**11. `preceding filter <predicate>`**  
> データは最初に`column list`と`columns from path as`に従って元のデータ行に結合され、その後preceding filter条件に従ってフィルタリングされます。

**12. `where <predicate>`**  
> 条件に従ってインポートデータをフィルタリングします。

**13. `delete on <expr>`**  
> `merge`インポートモードと組み合わせて使用し、unique keyモデルのテーブルにのみ適用されます。インポートデータ内の削除フラグを表す列と計算関係を指定します。

**14. `<source_sequence>`**  
> unique keyモデルのテーブルにのみ適用されます。インポートデータ内のsequence列を表す列を指定し、主にインポート時のデータ順序を保証するために使用されます。

**15. `properties ("<key>"="<value>",...)`**  
> インポートファイル形式のパラメータを指定します。CSV、JSONなどの形式に適用されます。例えば、`json_root`、`jsonpaths`、`fuzzy_parse`などのパラメータを指定できます。  
> `enclose`: 囲み文字。CSVデータフィールドに行区切り文字または列区切り文字が含まれている場合、誤った切り詰めを防ぐために単一バイト文字を囲み文字として指定できます。例えば、列区切り文字が「,」で、囲み文字が「'」、データが「a,'b,c'」の場合、「b,c」は一つのフィールドとして解析されます。  
> 注意：`enclose`が`"`に設定されている場合、`trim_double_quotes`を`true`に設定する必要があります。  
> `escape`: エスケープ文字。フィールド内で囲み文字と同じ文字をエスケープするために使用されます。例えば、データが「a,'b,'c'」、囲み文字が「'」で、「b,'c」を一つのフィールドとして解析したい場合、「""」などの単一バイトエスケープ文字を指定し、データを「a,'b,'c'」に変更する必要があります。

**16. `<load_properties>`**  
> 以下のオプションパラメータがあり、実際の環境に基づいて追加できます。

| パラメータ | パラメータ説明 |
| ---------------------- | ------------------------------------------------------------ |
| timeout | インポートタイムアウト期間。デフォルトは4時間、単位は秒です。 |
| max_filter_ratio | フィルタリング可能データの最大許容比率（データの不正規性などの理由による）。デフォルトは0で許容しない。値の範囲は0から1です。 |
| exec_mem_limit | インポートメモリ制限。デフォルトは2GB、単位はバイトです。 |
| strict_mode | データに対して厳格な制限を課すかどうか。デフォルトは`false`です。 |
| partial_columns | ブール型。`true`に設定すると、部分列更新を使用することを示します。デフォルト値は`false`です。テーブルモデルがUniqueでMerge on Writeを使用している場合にのみ設定できます。 |
| timezone | タイムゾーンを指定します。これは`strftime`、`alignment_timestamp`、`from_unixtime`など、タイムゾーンの影響を受ける一部の関数に影響します。詳細は[Time Zone](https://chatgpt.com/advanced/time - zone.md)ドキュメントを参照してください。指定されていない場合、「Asia/Shanghai」が使用されます。 |
| load_parallelism | インポート並行性。デフォルトは1です。インポート並行性を増やすと、複数の実行計画が開始され、インポートタスクが同時に実行され、インポートプロセスが高速化されます。 |
| send_batch_parallelism | バッチデータ送信の並行性を設定します。並行性の値がBE設定の`max_send_batch_parallelism_per_job`を超える場合、`max_send_batch_parallelism_per_job`の値が使用されます。 |
| load_to_single_tablet | ブール型。`true`に設定すると、対応するパーティションの単一のタブレットへのデータインポートをサポートすることを示します。デフォルト値は`false`です。ジョブ内のタスク数は全体的な並行性に依存し、random bucketを持つOLAPテーブルをインポートする場合にのみ設定できます。 |
| priority | インポートタスクの優先度を設定します。オプションは`HIGH/NORMAL/LOW`で、デフォルトは`NORMAL`です。`PENDING`状態のインポートタスクの場合、優先度の高いタスクが最初に`LOADING`状態になります。 |
| comment | インポートタスクの備考情報を指定します。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Table | 指定されたデータベーステーブルのインポート権限。 |

## 例

1. HDFSからバッチデータをインポートします。インポートファイルは`file.txt`で、カンマ区切りで、テーブル`my_table`にインポートします。

    ```sql
    LOAD LABEL example_db.label1
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file.txt")
        INTO TABLE `my_table`
        COLUMNS TERMINATED BY ","
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```
2. ワイルドカードを使用してHDFSからデータをインポートし、2つのファイルバッチをマッチさせて、それぞれを2つのテーブルにインポートします。ワイルドカードを使用して2つのファイルバッチ `file - 10*` と `file - 20*` をマッチさせ、それぞれをテーブル `my_table1` と `my_table2` にインポートします。`my_table1` については、パーティション `p1` にインポートするよう指定し、ソースファイルの2列目と3列目の値に1を加算してからインポートします。

    ```sql
    LOAD LABEL example_db.label2
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-10*")
        INTO TABLE `my_table1`
        PARTITION (p1)
        COLUMNS TERMINATED BY ","
        (k1, tmp_k2, tmp_k3)
        SET (
            k2 = tmp_k2 + 1,
            k3 = tmp_k3 + 1
        ),
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file-20*")
        INTO TABLE `my_table2`
        COLUMNS TERMINATED BY ","
        (k1, k2, k3)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```
3. HDFSからデータのバッチをインポートします。区切り文字をデフォルトのHive区切り文字`\\x01`として指定し、ワイルドカード`*`を使用して`data`ディレクトリ下のすべてのディレクトリ内のすべてのファイルを指定します。シンプル認証を使用し、同時にnamenode HAを設定します。

    ```sql
    LOAD LABEL example_db.label3
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/user/doris/data/*/*")
        INTO TABLE `my_table`
        COLUMNS TERMINATED BY "\\x01"
    )
    WITH BROKER my_hdfs_broker
    (
        "username" = "",
        "password" = "",
        "fs.defaultFS" = "hdfs://my_ha",
        "dfs.nameservices" = "my_ha",
        "dfs.ha.namenodes.my_ha" = "my_namenode1, my_namenode2",
        "dfs.namenode.rpc-address.my_ha.my_namenode1" = "nn1_host:rpc_port",
        "dfs.namenode.rpc-address.my_ha.my_namenode2" = "nn2_host:rpc_port",
        "dfs.client.failover.proxy.provider.my_ha" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
    );
    ```
4. Parquet形式でデータをインポートし、`FORMAT`を`parquet`として指定します。デフォルトでは、ファイルの拡張子によって判定されます。

    ```sql
    LOAD LABEL example_db.label4
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/file")
        INTO TABLE `my_table`
        FORMAT AS "parquet"
        (k1, k2, k3)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```
5. ファイルパスからデータをインポートし、パーティションフィールドを抽出します。`my_table`の列は`k1, k2, k3, city, utc_date`です。ディレクトリ`hdfs://hdfs_host:hdfs_port/user/doris/data/input/dir/city = beijing`には以下のファイルが含まれています：

    ```text
    hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-01/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=beijing/utc_date=2020-10-02/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-03/0000.csv
    hdfs://hdfs_host:hdfs_port/input/city=tianji/utc_date=2020-10-04/0000.csv
    ```
ファイルには`k1, k2, k3`の3列のデータのみが含まれており、`city`と`utc_date`の2列のデータはファイルパスから抽出されます。

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("hdfs://hdfs_host:hdfs_port/input/city=beijing/*/*")
        INTO TABLE `my_table`
        FORMAT AS "csv"
        (k1, k2, k3)
        COLUMNS FROM PATH AS (city, utc_date)
    )
    WITH BROKER hdfs
    (
        "username"="hdfs_user",
        "password"="hdfs_password"
    );
    ```
6. インポートするデータをフィルタリングします。元のデータで`k1 = 1`かつ変換後に`k1 > k2`の行のみがインポートされます。

    ```sql
    LOAD LABEL example_db.label6
    (
        DATA INFILE("hdfs://host:port/input/file")
        INTO TABLE `my_table`
        (k1, k2, k3)
        SET (
            k2 = k2 + 1
        )
        PRECEDING FILTER k1 = 1
        WHERE k1 > k2
    )
    WITH BROKER hdfs
    (
        "username"="user",
        "password"="pass"
    );
    ```
7. データをインポートし、ファイルパスから時間パーティションフィールドを抽出します。時間には`%3A`が含まれます（HDFSパスでは`:`は許可されていないため、すべての`:`が`%3A`に置き換えられます）。

   ```sql
   LOAD LABEL example_db.label7
   (
       DATA INFILE("hdfs://host:port/user/data/*/test.txt") 
       INTO TABLE `tbl12`
       COLUMNS TERMINATED BY ","
       (k2,k3)
       COLUMNS FROM PATH AS (data_time)
       SET (
           data_time=str_to_date(data_time, '%Y-%m-%d %H%%3A%i%%3A%s')
       )
   )
   WITH BROKER hdfs
   (
       "username"="user",
       "password"="pass"
   );
   ```
このディレクトリには以下のファイルが含まれています:

   ```text
   /user/data/data_time=2020-02-17 00%3A00%3A00/test.txt
   /user/data/data_time=2020-02-18 00%3A00%3A00/test.txt
   ```
テーブル構造は以下の通りです:

   ```text
   data_time DATETIME,
   k2        INT,
   k3        INT
   ```
8. HDFSからデータのバッチをインポートし、タイムアウト期間とフィルタリング比率を指定します。プレーンテキスト認証でbroker `my_hdfs_broker`を使用します。インポートされたデータで`v2 > 100`の列と一致する元データの列を削除し、他の列は通常通りインポートします。

   ```sql
   LOAD LABEL example_db.label8
   (
       MERGE DATA INFILE("HDFS://test:802/input/file")
       INTO TABLE `my_table`
       (k1, k2, k3, v2, v1)
       DELETE ON v2 > 100
   )
   WITH HDFS
   (
       "hadoop.username"="user",
       "password"="pass"
   )
   PROPERTIES
   (
       "timeout" = "3600",
       "max_filter_ratio" = "0.1"
   );
   ```
インポートには`MERGE`メソッドを使用してください。`my_table`はUnique Keyモデルを持つテーブルである必要があります。インポートされたデータの`v2`列の値が100より大きい場合、その行は削除行とみなされます。

   インポートタスクのタイムアウト期間は3600秒で、最大10%のエラー率が許可されます。

9. インポート時に`source_sequence`列を指定して、`UNIQUE_KEYS`テーブルでの置換順序を確保してください：

   ```sql
   LOAD LABEL example_db.label9
   (
       DATA INFILE("HDFS://test:802/input/file")
       INTO TABLE `my_table`
       COLUMNS TERMINATED BY ","
       (k1,k2,source_sequence,v1,v2)
       ORDER BY source_sequence
   ) 
   WITH HDFS
   (
       "hadoop.username"="user",
       "password"="pass"
   )
   ```
`my_table`はUnique Keyモデルを持つテーブルである必要があり、`Sequence Col`を指定する必要があります。データは、ソースデータの`source_sequence`列の値に従って順序付けされます。

10. HDFSからデータのバッチをインポートし、ファイル形式を`json`として指定し、`json_root`と`jsonpaths`を設定します：

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("HDFS://test:port/input/file.json")
        INTO TABLE `my_table`
        FORMAT AS "json"
        PROPERTIES(
          "json_root" = "$.item",
          "jsonpaths" = "[$.id, $.city, $.code]"
        )       
    )
    WITH BROKER HDFS (
        "hadoop.username" = "user",
        "password" = ""
    )
    PROPERTIES
    (
        "timeout"="1200",
        "max_filter_ratio"="0.1"
    );
    ```
`jsonpaths`は`column list`と`SET (column_mapping)`と組み合わせて使用できます：

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("HDFS://test:port/input/file.json")
        INTO TABLE `my_table`
        FORMAT AS "json"
        (id, code, city)
        SET (id = id * 10)
        PROPERTIES(
          "json_root" = "$.item",
          "jsonpaths" = "[$.id, $.code, $.city]"
        )       
    )
    WITH BROKER HDFS (
        "hadoop.username" = "user",
        "password" = ""
    )
    PROPERTIES
    (
        "timeout"="1200",
        "max_filter_ratio"="0.1"
    );
    ```
11. Tencent Cloud COSからCSV形式でデータをインポートします。

    ```sql
    LOAD LABEL example_db.label10
    (
        DATA INFILE("cosn://my_bucket/input/file.csv")
        INTO TABLE `my_table`
        (k1, k2, k3)
    )
    WITH BROKER "broker_name"
    (
        "fs.cosn.userinfo.secretId" = "xxx",
        "fs.cosn.userinfo.secretKey" = "xxxx",
        "fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxxxxx.myqcloud.com"
    )
    ```
12. CSVデータをインポートする際に、二重引用符を削除し、最初の5行をスキップしてください。

    ```sql 
    LOAD LABEL example_db.label12
    (
        DATA INFILE("cosn://my_bucket/input/file.csv")
        INTO TABLE `my_table`
        (k1, k2, k3)
        PROPERTIES("trim_double_quotes" = "true", "skip_lines" = "5")
    )
    WITH BROKER "broker_name"
    (
        "fs.cosn.userinfo.secretId" = "xxx",
        "fs.cosn.userinfo.secretKey" = "xxxx",
        "fs.cosn.bucket.endpoint_suffix" = "cos.xxxxxxxxx.myqcloud.com"
    )
    ```
