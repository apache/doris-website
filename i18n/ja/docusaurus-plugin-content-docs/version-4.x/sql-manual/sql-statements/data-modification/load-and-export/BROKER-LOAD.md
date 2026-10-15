---
{
    "title": "BROKER LOAD",
    "language": "ja",
    "description": "Broker Load は、主に HDFS や S3 などのリモートストレージシステムから大規模なデータを取り込むために使用する Doris のデータロード方式です。"
}
---

## 説明

Broker Load は、主に HDFS や S3 などのリモートストレージシステムから大規模なデータを取り込むために使用する Doris のデータロード方式です。MySQL API を介して開始する非同期のロード方式で、進捗と結果は `SHOW LOAD` ステートメントで確認できます。

以前のバージョンでは、S3 Load と HDFS Load は Broker プロセスに依存していました。現在は、追加の Broker プロセスを使用せずにデータソースから直接データを読み取ります。ただし、構文が似ているため、S3 Load、HDFS Load、Broker Load を総称して Broker Load と呼びます。

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
> ロード先のデータベース名を指定します。

**2. `<load_label>`**
> 各ロードタスクに一意の Label を指定します。この Label を使って、後からタスクの進捗を確認できます。

**3. `<table_name>`**
> ロードタスクの対象テーブルを指定します。

**4. `<file_path>`**
> ロードするファイルのパスを指定します。複数のパスやワイルドカードを指定できます。パスは最終的にファイルに一致する必要があり、ディレクトリにしか一致しない場合はロードに失敗します。

**5. `<broker_name>`**
> 使用する Broker サービスの名前を指定します。例えば、パブリッククラウド版 Doris では、Broker サービス名は `bos` です。

**6. `<broker_properties>`**
> Broker に必要な情報を指定します。通常、この情報は Broker が BOS や HDFS などのリモートストレージシステムにアクセスするために使用されます。
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
> データのマージ方式です。デフォルトは `append` で、通常の追記操作を表します。`merge` と `delete` は Unique Key モデルのテーブルにのみ適用できます。`merge` は、削除フラグ列を指定する `[delete on]` ステートメントと併用する必要があります。`delete` は、今回ロードするすべてのデータが削除データであることを表します。

**2. `negative`**  
> 負の値としてロードすることを示します。この方式は、整数型の SUM 集約列を持つ Aggregate Key テーブルにのみ適用できます。ロードするデータの SUM 集約列に対応する整数値の符号を反転させ、誤ったデータを相殺するために使用します。

**3. `<partition_name>`**  
> テーブルの特定のパーティションにのみロードすることを指定します。例：`partition (p1, p2,...)`。指定したパーティションの範囲外のデータは無視されます。

**4. `<column_separator>`**  
> 列区切り文字を指定します。CSV 形式でのみ有効で、指定できる区切り文字は単一バイトに限られます。

**5. `<line_delimiter>`**  
> 行区切り文字を指定します。CSV 形式でのみ有効で、指定できる区切り文字は単一バイトに限られます。

**6. `<file_type>`**  
> ファイル形式を指定します。`csv`（デフォルト）、`parquet`、`orc` をサポートします。

**7. `<compress_type>`**  
> ファイルの圧縮形式を指定します。`gz`、`bz2`、`lz4frame` をサポートします。

**8. `<column_list>`**  
> 元のファイルに含まれる列の順序を指定します。

**9. `columns from path as (<c1>, <c2>,...)`**  
> ロード対象ファイルのパスから抽出する列を指定します。

**10. `<column_mapping>`**  
> 列の変換関数を指定します。

**11. `preceding filter <predicate>`**  
> まず `column list` と `columns from path as` に従って元のデータ行を構成し、その後で preceding filter の条件に従ってフィルタリングします。

**12. `where <predicate>`**  
> 条件に従ってロードするデータをフィルタリングします。

**13. `delete on <expr>`**  
> `merge` ロードモードと併用し、Unique Key モデルのテーブルにのみ適用できます。ロードするデータで削除フラグを表す列と、その計算関係を指定します。

**14. `<source_sequence>`**  
> Unique Key モデルのテーブルにのみ適用できます。ロードするデータでシーケンス列を表す列を指定し、主にロード時のデータの順序を保証するために使用します。

**15. `properties ("<key>"="<value>",...)`**  
> CSV や JSON などのロード対象ファイル形式に関するパラメータを指定します。例えば、`json_root`、`jsonpaths`、`fuzzy_parse` などを指定できます。  
> `enclose`：囲み文字です。CSV データのフィールドに行区切り文字や列区切り文字が含まれる場合、意図しない位置で分割されないよう、単一バイトの囲み文字を指定できます。例えば、列区切り文字が ","、囲み文字が "'"、データが "a,'b,c'" の場合、"b,c" は単一のフィールドとして解析されます。  
> 注：`enclose` を `"` に設定する場合は、`trim_double_quotes` を `true` に設定する必要があります。  
> `escape`：フィールド内の囲み文字と同じ文字をエスケープするための文字です。例えば、データが "a,'b,'c'"、囲み文字が "'" で、"b,'c" を単一のフィールドとして解析したい場合は、`""` のような単一バイトのエスケープ文字を指定し、データを "a,'b,'c'" に変更する必要があります。

**16. `<load_properties>`**  
> 次のオプションパラメータを、実際の環境に応じて追加できます。

| パラメータ | 説明 |
| ---------------------- | ------------------------------------------------------------ |
| timeout | ロードのタイムアウト時間です。デフォルトは 4 時間で、単位は秒です。 |
| max_filter_ratio | フィルタリング可能なデータ（データ形式の不整合など）の最大許容割合です。デフォルトでは許容せず、値の範囲は 0 から 1 です。 |
| exec_mem_limit | ロード時のメモリ上限です。デフォルトは 2GB で、単位はバイトです。 |
| strict_mode | データに厳密な制約を適用するかどうかを指定します。デフォルトは `false` です。 |
| partial_columns | 真偽値です。`true` にすると一部の列のみを更新します。デフォルトは `false` です。Unique Key モデルかつ Merge on Write を使用するテーブルでのみ設定できます。 |
| timezone | タイムゾーンを指定します。`strftime`、`alignment_timestamp`、`from_unixtime` など、タイムゾーンの影響を受ける関数に作用します。詳細は[タイムゾーン](../../../../admin-manual/cluster-management/time-zone.md)のドキュメントを参照してください。指定しない場合は "Asia/Shanghai" が使用されます。 |
| load_parallelism | ロードの並列度です。デフォルトは 1 です。並列度を上げると、複数の実行プランでロードタスクを同時に処理し、ロードを高速化できます。 |
| send_batch_parallelism | バッチデータの送信に使用する並列度を設定します。指定した値が BE 設定の `max_send_batch_parallelism_per_job` を超える場合は、`max_send_batch_parallelism_per_job` の値が使用されます。 |
| load_to_single_tablet | 真偽値です。`true` にすると、対応するパーティションの単一のタブレットにデータをロードできます。デフォルトは `false` です。ジョブのタスク数は全体の並列度に依存し、ランダムバケットを使用する OLAP テーブルにロードする場合にのみ設定できます。 |
| priority | ロードタスクの優先度を設定します。選択肢は `HIGH/NORMAL/LOW` で、デフォルトは `NORMAL` です。`PENDING` 状態のロードタスクでは、優先度が高いタスクから先に `LOADING` 状態へ移行します。 |
| comment | ロードタスクの備考を指定します。 |

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | テーブル | 指定したデータベーステーブルに対するロード権限。 |

## 例

S3、HDFS、JSON 形式、Merge モード、パスに基づくパーティション値の抽出などを扱う詳しい例については、データロードガイドの[Broker Load](../../../../data-operate/import/import-way/broker-load-manual.md)を参照してください。
