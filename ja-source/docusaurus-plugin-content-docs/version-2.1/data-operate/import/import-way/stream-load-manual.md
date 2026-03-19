---
{
  "title": "Stream Load",
  "language": "ja",
  "description": "Stream LoadはHTTPプロトコルを通じてローカルファイルやデータストリームをDorisにインポートすることをサポートしています。"
}
---
Stream Loadは、HTTPプロトコルを通じてローカルファイルまたはデータストリームをDorisにインポートすることをサポートしています。

Stream Loadは同期インポート方式で、インポートの実行後にインポート結果を返すため、リクエストレスポンスを通じてインポートの成功を判断できます。一般的に、ユーザーはStream Loadを使用して10GB以下のファイルをインポートできます。ファイルが大きすぎる場合は、ファイルを分割してからStream Loadを使用してインポートすることを推奨します。Stream Loadは、バッチインポートタスクの原子性を保証でき、つまりすべて成功するかすべて失敗するかのいずれかです。

:::tip

`curl`を使用したシングルスレッド読み込みと比較して、Doris StreamloaderはApache Dorisにデータを読み込むために設計されたクライアントツールです。同時読み込み機能により、大規模データセットの取り込みレイテンシを削減します。以下の機能を備えています：

- **並列読み込み**: Stream Load方式のマルチスレッド読み込み。`workers`パラメータを使用して並列度レベルを設定できます。
- **マルチファイル読み込み:** 複数のファイルやディレクトリを一度に同時読み込み。再帰的ファイル取得をサポートし、ワイルドカード文字でファイル名を指定できます。
- **パストラバーサルサポート:** ソースファイルがディレクトリ内にある場合のパストラバーサルをサポート
- **復元力と継続性:** 部分的な読み込み失敗の場合、失敗ポイントからデータ読み込みを再開できます。
- **自動リトライメカニズム:** 読み込み失敗の場合、デフォルトの回数だけ自動的にリトライできます。読み込みが依然として失敗する場合、手動リトライ用のコマンドを出力します。

詳細な手順とベストプラクティスについては、[Doris Streamloader](../../../ecosystem/doris-streamloader)を参照してください。
:::

## ユーザーガイド

Stream LoadはHTTP経由でローカルまたはリモートソースからCSV、JSON、Parquet、ORC形式のデータのインポートをサポートしています。

- null値: null値を表すには`\N`を使用します。例えば、`a,\N,b`は中間の列がnullであることを示します。
- 空文字列: 2つの区切り文字の間に文字がない場合、空文字列が表現されます。例えば、`a,,b`では、2つのカンマの間に文字がなく、中間の列の値が空文字列であることを示しています。

### 基本原理

Stream Loadを使用する場合、HTTPプロトコルを通じてFE（Frontend）ノードにインポートジョブを開始する必要があります。FEはラウンドロビン方式でリクエストをBE（Backend）ノードにリダイレクトし、負荷分散を実現します。特定のBEノードに直接HTTPリクエストを送信することも可能です。Stream Loadでは、Dorisが1つのノードをCoordinatorノードとして選択します。Coordinatorノードはデータの受信と他のノードへの配布を担当します。

次の図は、一部のインポート詳細を省略したStream Loadの主な流れを示しています。

![Basic principles](/images/stream-load.png)

1. クライアントがFE（Frontend）にStream Loadインポートジョブリクエストを送信します。
2. FEがラウンドロビン方式でBE（Backend）をCoordinatorノードとして選択し、インポートジョブのスケジューリングを担当させ、その後クライアントにHTTPリダイレクトを返します。
3. クライアントがCoordinator BEノードに接続し、インポートリクエストを送信します。
4. Coordinator BEがデータを適切なBEノードに配布し、インポート完了後にクライアントにインポート結果を返します。
5. 代替として、クライアントが直接BEノードをCoordinatorとして指定し、インポートジョブを直接配布することも可能です。

## クイックスタート

Stream LoadはHTTPプロトコルを通じてデータをインポートします。以下の例では、curlツールを使用してStream Loadを通じてインポートジョブを送信する方法を実演します。

### 前提条件の確認

Stream Loadは対象テーブルに対する`INSERT`権限が必要です。`INSERT`権限がない場合、[GRANT](../../../sql-manual/sql-statements/account-management/GRANT-TO)コマンドを通じてユーザーに権限を付与できます。

### 読み込みジョブの作成

#### CSVの読み込み

1. 読み込みデータの作成

   `streamload_example.csv`という名前のCSVファイルを作成します。具体的な内容は以下の通りです

```sql
1,Emily,25
2,Benjamin,35
3,Olivia,28
4,Alexander,60
5,Ava,17
6,William,69
7,Sophia,32
8,James,64
9,Emma,37
10,Liam,64
```
2. 読み込み用テーブルの作成

   以下の特定の構文を使用して、インポート先となるテーブルを作成します：

```sql
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
3. ロードジョブを有効にする

   Stream Loadジョブは`curl`コマンドを使用して送信できます。

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
Stream Loadは同期メソッドで、結果がユーザーに直接返されます。

```sql
{
    "TxnId": 3,
    "Label": "123",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 118,
    "LoadTimeMs": 173,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 70,
    "ReadDataTimeMs": 2,
    "WriteDataTimeMs": 48,
    "CommitAndPublishTimeMs": 52
}
```
4. データの表示

```sql
mysql> select count(*) from testdb.test_streamload;
+----------+
| count(*) |
+----------+
|       10 |
+----------+
```
#### JSONの読み込み

1. 読み込みデータの作成

`streamload_example.json`という名前のJSONファイルを作成します。具体的な内容は以下の通りです

```sql
[
{"userid":1,"username":"Emily","userage":25},
{"userid":2,"username":"Benjamin","userage":35},
{"userid":3,"username":"Olivia","userage":28},
{"userid":4,"username":"Alexander","userage":60},
{"userid":5,"username":"Ava","userage":17},
{"userid":6,"username":"William","userage":69},
{"userid":7,"username":"Sophia","userage":32},
{"userid":8,"username":"James","userage":64},
{"userid":9,"username":"Emma","userage":37},
{"userid":10,"username":"Liam","userage":64}
]
```
2. ロード用のテーブルの作成

   以下の特定の構文を使用して、インポート先となるテーブルを作成します：

```sql
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
3. ロードジョブの有効化

   Stream Loadジョブは`curl`コマンドを使用して送信できます。

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "label:124" \
    -H "Expect:100-continue" \
    -H "format:json" -H "strip_outer_array:true" \
    -H "jsonpaths:[\"$.userid\", \"$.username\", \"$.userage\"]" \
    -H "columns:user_id,name,age" \
    -T streamload_example.json \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
:::info Note

JSONファイルがJSON配列ではなく、各行がJSONオブジェクトの場合は、ヘッダー `-H "strip_outer_array:false"` と `-H "read_json_by_line:true"` を追加してください。

JSONファイルのルートノードにあるJSONオブジェクトをロードする必要がある場合、jsonpathsは $.として指定する必要があります。例：`-H "jsonpaths:[\"$.\"]`"
:::

Stream Loadは同期メソッドで、結果は直接ユーザーに返されます。

```sql
{
    "TxnId": 7,
    "Label": "125",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 10,
    "NumberLoadedRows": 10,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 471,
    "LoadTimeMs": 52,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 11,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 23,
    "CommitAndPublishTimeMs": 16
}
```
### load jobの表示

デフォルトでは、Stream Loadは同期的にクライアントに結果を返すため、システムはStream Loadの履歴ジョブを記録しません。記録が必要な場合は、`be.conf`に設定`enable_stream_load_record=true`を追加してください。詳細については、[BE configuration options](../../../admin-manual/config/be-config)を参照してください。

設定後、`show stream load`コマンドを使用して完了したStream Loadジョブを表示できます。

```sql
mysql> show stream load from testdb;
+-------+--------+-----------------+---------------+---------+---------+------+-----------+------------+--------------+----------------+-----------+-------------------------+-------------------------+------+---------+
| Label | Db     | Table           | ClientIp      | Status  | Message | Url  | TotalRows | LoadedRows | FilteredRows | UnselectedRows | LoadBytes | StartTime               | FinishTime              | User | Comment |
+-------+--------+-----------------+---------------+---------+---------+------+-----------+------------+--------------+----------------+-----------+-------------------------+-------------------------+------+---------+
| 12356 | testdb | test_streamload | 192.168.88.31 | Success | OK      | N/A  | 10        | 10         | 0            | 0              | 118       | 2023-11-29 08:53:00.594 | 2023-11-29 08:53:00.650 | root |         |
+-------+--------+-----------------+---------------+---------+---------+------+-----------+------------+--------------+----------------+-----------+-------------------------+-------------------------+------+---------+
1 row in set (0.00 sec)
```
### loadジョブのキャンセル

ユーザーはStream Load操作を手動でキャンセルすることはできません。Stream Loadジョブは、タイムアウト（0に設定）またはインポートエラーが発生した場合、システムによって自動的にキャンセルされます。

## リファレンスマニュアル

### コマンド

Stream Loadの構文は以下の通りです：

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
  -H "Expect:100-continue" [-H ""...] \
  -T <file_path> \
  -XPUT http://fe_host:http_port/api/{db}/{table}/_stream_load
```
Stream Load操作では、HTTPチャンクとノンチャンクの両方のインポート方法をサポートしています。ノンチャンクインポートの場合、アップロードされるコンテンツの長さを示すContent-Lengthヘッダーが必要で、これによりデータの整合性が保証されます。

### ロード設定パラメータ

#### FE設定

1. `stream_load_default_timeout_second`

   - デフォルト値: 259200 (s)

   - 動的設定: Yes
   - FE Master専用設定: Yes

パラメータ説明: Stream Loadのデフォルトタイムアウト。設定されたタイムアウト時間内（秒単位）にロードジョブが完了しない場合、システムによりキャンセルされます。指定時間内にソースファイルをインポートできない場合、ユーザーはStream Loadリクエストで個別のタイムアウトを設定できます。または、FEの`stream_load_default_timeout_second`パラメータを調整してグローバルデフォルトタイムアウトを設定してください。

#### BE設定

1. `streaming_load_max_mb`

   - デフォルト値: 10240 (MB)
   - 動的設定: Yes
   - パラメータ説明: Stream Loadの最大インポートサイズ。ユーザーの元ファイルがこの値を超える場合、BEの`streaming_load_max_mb`パラメータを調整する必要があります。

2. Headerパラメータ

   HTTPヘッダーセクションを通じてロードパラメータを渡すことができます。具体的なパラメータ説明については以下を参照してください。

| パラメータ                   | パラメータ説明                                       |
| ---------------------------- | ------------------------------------------------------------ |
| label                        | このDorisインポートのラベルを指定するために使用されます。同じラベルのデータは複数回インポートできません。ラベルが指定されていない場合、Dorisが自動的に生成します。ユーザーはラベルを指定することで、同じデータの重複インポートを避けることができます。Dorisはデフォルトで3日間インポートジョブラベルを保持しますが、この期間は`label_keep_max_second`を使用して調整できます。例えば、このインポートのラベルを123として指定するには、コマンド`-H "label:123"`を使用します。ラベルの使用により、ユーザーが同じデータを繰り返しインポートすることを防げます。ユーザーが同じデータバッチに同じラベルを使用することを強く推奨します。これにより、同じデータバッチの重複リクエストが一度だけ受け入れられ、At-Most-Onceセマンティクスが保証されます。ラベルに対応するインポートジョブのステータスがCANCELLEDの場合、そのラベルは再度使用できます。 |
| column_separator             | インポートファイル内のカラムセパレータを指定するために使用され、デフォルトは`\t`です。セパレータが見えない文字の場合、`\x`をプレフィックスとして付け、16進形式で表現する必要があります。複数の文字をカラムセパレータとして組み合わせることもできます。例えば、Hiveファイルのセパレータを`\x01`として指定するには、コマンド`-H "column_separator:\x01"`を使用します。 |
| line_delimiter               | インポートファイル内の行デリミタを指定するために使用され、デフォルトは`\n`です。複数の文字を行デリミタとして組み合わせることもできます。例えば、行デリミタを`\n`として指定するには、コマンド`-H "line_delimiter:\n"`を使用します。 |
| columns                      | インポートファイル内のカラムとテーブル内のカラムとの対応関係を指定するために使用されます。ソースファイル内のカラムがテーブルの内容と正確に一致する場合、このフィールドを指定する必要はありません。ソースファイルのスキーマがテーブルと一致しない場合、データ変換のためにこのフィールドが必要です。インポートファイル内のフィールドへの直接カラム対応と、式で表現される派生カラムの2つのフォーマットがあります。詳細な例については[データ変換](../../../data-operate/import/load-data-convert)を参照してください。 |
| where                        | 不要なデータを除外するために使用されます。ユーザーが特定のデータを除外する必要がある場合、このオプションを設定することで実現できます。例えば、k1カラムが20180601に等しいデータのみをインポートするには、インポート時に`-H "where: k1 = 20180601"`を指定します。 |
| max_filter_ratio             | フィルタ可能な（不正またはその他の問題のある）データの最大許容比率を指定するために使用され、デフォルトはゼロ許容です。値の範囲は0から1です。インポートされたデータのエラー率がこの値を超えると、インポートは失敗します。不正なデータは、where条件によってフィルタリングされた行を含みません。例えば、すべての正しいデータの最大インポート（100%許容）を行うには、コマンド`-H "max_filter_ratio:1"`を指定します。 |
| partitions                   | このインポートに関わるパーティションを指定するために使用されます。ユーザーがデータの対応パーティションを判断できる場合、このオプションを指定することを推奨します。これらのパーティション基準を満たさないデータは除外されます。例えば、パーティションp1とp2へのインポートを指定するには、コマンド`-H "partitions: p1, p2"`を使用します。 |
| timeout                      | インポートのタイムアウトを秒単位で指定するために使用されます。デフォルトは600秒で、設定可能範囲は1秒から259200秒です。例えば、インポートタイムアウトを1200秒として指定するには、コマンド`-H "timeout:1200"`を使用します。 |
| strict_mode                  | このインポートでストリクトモードを有効にするかどうかを指定するために使用され、デフォルトでは無効です。例えば、ストリクトモードを有効にするには、コマンド`-H "strict_mode:true"`を使用します。 |
| timezone                     | このインポートで使用するタイムゾーンを指定するために使用され、デフォルトはGMT+8です。このパラメータは、インポートに関わるすべてのタイムゾーン関連関数の結果に影響します。例えば、インポートタイムゾーンをAfrica/Abidjanとして指定するには、コマンド`-H "timezone:Africa/Abidjan"`を使用します。 |
| exec_mem_limit               | インポートのメモリ制限で、デフォルトは2GBです。単位はバイトです。 |
| format                       | インポートされるデータのフォーマットを指定するために使用され、デフォルトはCSVです。現在サポートされているフォーマット：CSV、JSON、arrow、csv_with_names（csvファイルの最初の行のフィルタリングをサポート）、csv_with_names_and_types（csvファイルの最初の2行のフィルタリングをサポート）、Parquet、ORC。例えば、インポートデータフォーマットをJSONとして指定するには、コマンド`-H "format:json"`を使用します。 |
| jsonpaths                    | JSONデータフォーマットをインポートする方法は2つあります：シンプルモードとマッチングモード。jsonpathsが指定されていない場合、シンプルモードとなり、JSONデータはオブジェクトタイプである必要があります。マッチングモードは、JSONデータが比較的複雑で、jsonpathsパラメータを通じて対応する値をマッチングする必要がある場合に使用されます。シンプルモードでは、JSON内のキーはテーブル内のカラム名と一対一で対応する必要があります。例えば、JSONデータ`{"k1":1, "k2":2, "k3":"hello"}`では、k1、k2、k3がそれぞれテーブル内のカラムに対応します。 |
| strip_outer_array            | `strip_outer_array`がtrueに設定されている場合、JSONデータが配列オブジェクトで始まり、配列内のオブジェクトを平坦化することを示します。デフォルト値はfalseです。JSONデータの最外層が配列を示す`[]`で表現されている場合、`strip_outer_array`をtrueに設定する必要があります。例えば、次のデータでは、`strip_outer_array`をtrueに設定すると、Dorisにインポートされた際に2行のデータが生成されます：`[{"k1": 1, "v1": 2}, {"k1": 3, "v1": 4}]`。 |
| json_root                    | `json_root`は有効なjsonpath文字列で、JSONドキュメントのルートノードを指定し、デフォルト値は""です。 |
| merge_type                   | データのマージタイプ。3つのタイプがサポートされています：<br/>- APPEND（デフォルト）：このバッチのすべてのデータが既存データに追加されることを示します<br/>- DELETE：このバッチのデータとマッチするキーを持つすべての行の削除を示します<br/>- MERGE：DELETE条件と組み合わせて使用する必要があります。DELETE条件を満たすデータはDELETEセマンティクスに従って処理され、残りはAPPENDセマンティクスに従って処理されます<br/>例えば、マージモードをMERGEとして指定するには：`-H "merge_type: MERGE" -H "delete: flag=1"` |
| delete                       | MERGEでのみ意味を持ち、データの削除条件を表します。 |
| function_column.sequence_col | UNIQUE KEYSモデルにのみ適用されます。同じKeyカラム内で、指定されたsource_sequenceカラムに従ってValueカラムが置換されることを保証します。source_sequenceは、データソースのカラムまたはテーブル構造の既存カラムのいずれかです。 |
| fuzzy_parse                  | ブール型です。trueに設定された場合、最初の行をスキーマとしてJSONが解析されます。このオプションを有効にするとJSONインポートの効率が向上しますが、すべてのJSONオブジェクトのキーの順序が最初の行と一致している必要があります。デフォルトはfalseで、JSONフォーマットでのみ使用されます。 |
| num_as_string                | ブール型です。trueに設定された場合、JSON解析中に数値型が文字列に変換され、インポートプロセス中の精度損失がないことを保証します。 |
| read_json_by_line            | ブール型です。trueに設定された場合、1行につき1つのJSONオブジェクトの読み取りをサポートし、デフォルトはfalseです。 |
| send_batch_parallelism       | バッチ処理されたデータを送信する並列処理の並列度を設定します。並列度値がBEで設定された`max_send_batch_parallelism_per_job`を超える場合、調整BEは`max_send_batch_parallelism_per_job`値を使用します。 |
| hidden_columns               | インポートデータの隠しカラムを指定するために使用され、HeaderにColumnsが含まれていない場合に有効です。複数の隠しカラムはカンマで区切られます。システムはユーザー指定のデータをインポートに使用します。次の例では、インポートデータの最後のカラムは`__DORIS_SEQUENCE_COL__`です。`hidden_columns: __DORIS_DELETE_SIGN__,__DORIS_SEQUENCE_COL__`。 |
| load_to_single_tablet        | ブール型です。trueに設定された場合、パーティションに対応する単一のTabletにのみデータをインポートすることをサポートし、デフォルトはfalseです。このパラメータは、ランダムバケッティングを使用するOLAPテーブルへのインポート時にのみ許可されます。 |
| compress_type                | 現在、CSVファイルの圧縮のみがサポートされています。圧縮フォーマットには、gz、lzo、bz2、lz4、lzop、deflateがあります。 |
| trim_double_quotes           | ブール型です。trueに設定された場合、CSVファイルの各フィールドの最外層の二重引用符をトリミングすることを示し、デフォルトはfalseです。 |
| skip_lines                   | 整数型です。CSVファイルの開始時にスキップする行数を指定するために使用され、デフォルトは0です。`format`が`csv_with_names`または`csv_with_names_and_types`に設定されている場合、このパラメータは無効になります。 |
| comment                      | String型で、デフォルト値は空文字列です。タスクに追加情報を追加するために使用されます。 |
| enclose                      | 囲み文字を指定します。CSVデータフィールドに行デリミタまたはカラムデリミタが含まれている場合、予期しない切り捨てを防ぐため、保護用の囲み文字として単一バイト文字を指定できます。例えば、カラムデリミタが","で囲み文字が"'"の場合、データ"a,'b,c'"では"b,c"が単一フィールドとして解析されます。注意：囲み文字が二重引用符（"）に設定されている場合、`trim_double_quotes`をtrueに設定してください。 |
| escape                       | エスケープ文字を指定します。フィールド内で囲み文字と同じ文字をエスケープするために使用されます。例えば、データが"a,'b,'c'"で、囲み文字が"'"で、"b,'c"を単一フィールドとして解析したい場合、""などの単一バイトエスケープ文字を指定し、データを"a,'b','c'"に変更する必要があります。 |
| memtable_on_sink_node        | データロード時にDataSinkノードでMemTableを有効にするかどうか、デフォルトはfalseです。 |
|unique_key_update_mode        | Uniqueテーブルでの更新モード、現在はMerge-On-Write Uniqueテーブルにのみ有効です。3つのタイプをサポート：`UPSERT`、`UPDATE_FIXED_COLUMNS`、`UPDATE_FLEXIBLE_COLUMNS`。`UPSERT`：データがupsertセマンティクスでロードされることを示します；`UPDATE_FIXED_COLUMNS`：データが部分更新を通じてロードされることを示します；`UPDATE_FLEXIBLE_COLUMNS`：データが柔軟な部分更新を通じてロードされることを示します。|

### ロード戻り値

Stream Loadは同期インポート方式で、ロード結果はロード戻り値の作成を通じて直接ユーザーに提供されます。以下に示します：

```sql
{
    "TxnId": 1003,
    "Label": "b6f3bc78-0d2c-45d9-9e4c-faa0a0149bee",
    "Status": "Success",
    "ExistingJobStatus": "FINISHED", // optional
    "Message": "OK",
    "NumberTotalRows": 1000000,
    "NumberLoadedRows": 1000000,
    "NumberFilteredRows": 1,
    "NumberUnselectedRows": 0,
    "LoadBytes": 40888898,
    "LoadTimeMs": 2144,
    "BeginTxnTimeMs": 1,
    "StreamLoadPutTimeMs": 2,
    "ReadDataTimeMs": 325,
    "WriteDataTimeMs": 1933,
    "CommitAndPublishTimeMs": 106,
    "ErrorURL": "http://192.168.1.1:8042/api/_load_error_log?file=__shard_0/error_log_insert_stmt_db18266d4d9b4ee5-abb00ddd64bdf005_db18266d4d9b4ee5_abb00ddd64bdf005"
}
```
戻り結果のパラメータは以下の表で説明されています：

| Parameters             | Parameters description                                       |
| ---------------------- | ------------------------------------------------------------ |
| TxnId                  | インポートトランザクションID                                        |
| Label                  | ロードジョブのLabel、`-H "label:<label_id>"`で指定されます。    |
| Status                 | 最終的なロードStatus。**Success**: ロードジョブが成功しました。**Publish Timeout**: ロードジョブは完了しましたが、データの可視性に遅延がある可能性があります。**Label Already Exists**: labelが重複しており、新しいlabelが必要です。**Fail**: ロードジョブが失敗しました。 |
| ExistingJobStatus      | 既に存在するlabelに対応するロードジョブのステータス。このフィールドはStatusが**Label Already Exists**の場合のみ表示されます。ユーザーはこのステータスを使用して、既存のlabelに対応するインポートジョブのステータスを知ることができます。**RUNNING**はジョブがまだ実行中であることを意味し、**FINISHED**はジョブが成功したことを意味します。 |
| Message                | ロードジョブに関連するエラー情報。                                |
| NumberTotalRows        | ロードジョブ中に処理された行の総数。                            |
| NumberLoadedRows       | 正常にロードされた行数。                                      |
| NumberFilteredRows     | データ品質基準を満たさなかった行数。                           |
| NumberUnselectedRows   | WHERE条件に基づいてフィルタリングされた行数。                   |
| LoadBytes              | データ量（バイト単位）。                                       |
| LoadTimeMs             | ロードジョブの完了にかかった時間（ミリ秒単位）。                |
| BeginTxnTimeMs         | Frontend node (FE)からトランザクションの開始を要求するのにかかった時間（ミリ秒単位）。 |
| StreamLoadPutTimeMs    | FEからロードジョブデータの実行プランを要求するのにかかった時間（ミリ秒単位）。 |
| ReadDataTimeMs         | ロードジョブ中のデータ読み取りに費やした時間（ミリ秒単位）。       |
| WriteDataTimeMs        | ロードジョブ中のデータ書き込み操作にかかった時間（ミリ秒単位）。   |
| CommitAndPublishTimeMs | FEからトランザクションのコミットと公開を要求するのにかかった時間（ミリ秒単位）。 |
| ErrorURL               | データ品質に問題がある場合、ユーザーはこのURLにアクセスしてエラーのある特定の行を確認できます。 |

ユーザーはErrorURLにアクセスして、データ品質の問題によりインポートに失敗したデータを確認できます。`curl "<ErrorURL>"`コマンドを実行することで、ユーザーはエラーのあるデータに関する情報を直接取得できます。

## ロード例

### ロードタイムアウトと最大サイズの設定

ロードジョブのタイムアウトは秒単位で測定されます。指定されたタイムアウト期間内にロードジョブが完了しない場合、システムによってキャンセルされ、`CANCELLED`としてマークされます。`timeout`パラメータを指定するか、fe.confファイルに`stream_load_default_timeout_second`パラメータを追加することで、Stream Loadジョブのタイムアウトを調整できます。

ロードを開始する前に、ファイルサイズに基づいてタイムアウトを計算する必要があります。例えば、推定ロードパフォーマンスが50MB/sの100GBファイルの場合：

```
Load time ≈ 100GB / 50MB/s ≈ 2048s
```
Stream Load ジョブの作成に3000秒のタイムアウトを指定するには、以下のコマンドを使用できます：

```Shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "timeout:3000"
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### 最大エラー許容率の設定

Load jobは、フォーマットエラーがある一定量のデータを許容できます。許容率は`max_filter_ratio`パラメータを使用して設定されます。デフォルトでは0に設定されており、これは単一のエラーデータ行が存在する場合でも、Load job全体が失敗することを意味します。ユーザーが問題のあるデータ行を無視したい場合は、このパラメータを0から1の間の値に設定できます。Dorisは不正なデータフォーマットの行を自動的にスキップします。許容率の計算に関する詳細情報については、[Data Transformation](../../../data-operate/import/load-data-convert)のドキュメントを参照してください。

以下のコマンドを使用して、Stream Load jobの作成時に`max_filter_ratio`許容率を0.4に指定できます：

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "max_filter_ratio:0.4" \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### 読み込みフィルタ条件の設定

読み込みジョブ中に、WHERE パラメータを使用してインポートされるデータに条件フィルタを適用できます。フィルタされたデータはフィルタ比率の計算に含まれず、`max_filter_ratio` の設定に影響しません。読み込みジョブが完了した後、`num_rows_unselected` を確認することで、フィルタされた行数を表示できます。

以下のコマンドを使用して、Stream Load ジョブを作成する際の WHERE フィルタ条件を指定できます：

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "where:age>=35" \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### 特定のパーティションへのデータ読み込み

ローカルファイルからテーブルのパーティションp1とp2にデータを読み込み、20%のエラー率を許可します。

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "label:123" \
    -H "Expect:100-continue" \
    -H "max_filter_ratio:0.2" \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -H "partitions: p1, p2" \ 
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### 特定のタイムゾーンへのデータ読み込み

Dorisには現在組み込みのタイムゾーン時刻型がないため、すべての`DATETIME`関連型は絶対的な時点のみを表し、タイムゾーン情報を含まず、Dorisシステムのタイムゾーンの変更によって変わることもありません。したがって、タイムゾーンを持つデータのインポートについては、統一された処理方法として特定のターゲットタイムゾーンのデータに変換します。Dorisシステムでは、これはセッション変数`time_zone`で表されるタイムゾーンです。

インポートでは、パラメータ`timezone`を通じてターゲットタイムゾーンを指定します。この変数は、タイムゾーン変換が発生し、タイムゾーンに敏感な関数が計算される際にセッション変数`time_zone`を置き換えます。したがって、特別な事情がない限り、インポートトランザクションで`timezone`を現在のDorisクラスターの`time_zone`と一致するよう設定する必要があります。これは、タイムゾーンを持つすべての時刻データがこのタイムゾーンに変換されることを意味します。

例えば、Dorisシステムのタイムゾーンが"+08:00"で、インポートデータの時刻列に「2012-01-01 01:00:00+00:00」と「2015-12-12 12:12:12-08:00」という2つのデータが含まれている場合、インポート時に`-H "timezone: +08:00"`でインポートトランザクションのタイムゾーンを指定すると、両方のデータがそのタイムゾーンに変換されて「2012-01-01 09:00:00」と「2015-12-13 04:12:12」という結果を得ます。

タイムゾーンの解釈に関する詳細については、ドキュメント[Time Zone](../../../admin-manual/cluster-management/time-zone)を参照してください。

### ストリーミングインポート

Stream LoadはHTTPプロトコルベースのインポートで、Java、Go、Pythonなどのプログラミング言語を使用したストリーミングインポートをサポートしています。これがStream Loadと名付けられた理由です。

以下の例では、bashコマンドパイプラインを通じてこの使用方法を実演しています。インポートデータは、ローカルファイルからではなく、プログラムによってストリーミング形式で生成されます。

```shell
seq 1 10 | awk '{OFS="\t"}{print $1, $1 * 10}' | curl --location-trusted -u root -T - http://host:port/api/testDb/testTbl/_stream_load
```
### CSV最初の行フィルタリングを設定

ファイルデータ:

```Plain
 id,name,age
 1,doris,20
 2,flink,10
```
`format=csv_with_names`を指定してロード中に最初の行をフィルタリング

```Plain
curl --location-trusted -u root -T test.csv  -H "label:1" -H "format:csv_with_names" -H "column_separator:," http://host:port/api/testDb/testTbl/_stream_load
```
### DELETE操作でのmerge_typeの指定

Stream Loadには、APPEND、DELETE、MERGEの3つのインポートタイプがあります。これらは`merge_type`パラメータを指定することで調整できます。インポートされたデータと同じキーを持つすべてのデータを削除するように指定したい場合は、以下のコマンドを使用できます：

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "merge_type: DELETE" \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
ロード前:

```sql
+--------+----------+----------+------+
| siteid | citycode | username | pv   |
+--------+----------+----------+------+
|      3 |        2 | tom      |    2 |
|      4 |        3 | bush     |    3 |
|      5 |        3 | helen    |    3 |
+--------+----------+----------+------+
```
インポートされたデータは以下の通りです：

```sql
3,2,tom,0
```
インポート後、元のテーブルデータは削除され、以下の結果になります：

```sql
+--------+----------+----------+------+
| siteid | citycode | username | pv   |
+--------+----------+----------+------+
|      4 |        3 | bush     |    3 |
|      5 |        3 | helen    |    3 |
+--------+----------+----------+------+
```
### MERGE操作のmerge_type指定

`merge_type`をMERGEとして指定することで、インポートされたデータをテーブルにマージできます。MERGEセマンティクスは、DELETE条件と組み合わせて使用する必要があります。これは、DELETE条件を満たすデータはDELETEセマンティクスに従って処理され、残りのデータはAPPENDセマンティクスに従ってテーブルに追加されることを意味します。以下の操作は、`siteid`が1の行を削除し、残りのデータをテーブルに追加することを表しています：

```shell
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "merge_type: MERGE" \
    -H "delete: siteid=1" \
    -H "column_separator:," \
    -H "columns:user_id,name,age" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
ロード前:

```sql
+--------+----------+----------+------+
| siteid | citycode | username | pv   |
+--------+----------+----------+------+
|      4 |        3 | bush     |    3 |
|      5 |        3 | helen    |    3 |
|      1 |        1 | jim      |    2 |
+--------+----------+----------+------+
```
インポートされたデータは以下の通りです：

```sql
2,1,grace,2
3,2,tom,2
1,1,jim,2
```
読み込み後、条件に従って`siteid = 1`の行が削除され、`siteid`が2と3の行がテーブルに追加されます：

```sql
+--------+----------+----------+------+
| siteid | citycode | username | pv   |
+--------+----------+----------+------+
|      4 |        3 | bush     |    3 |
|      2 |        1 | grace    |    2 |
|      3 |        2 | tom      |    2 |
|      5 |        3 | helen    |    3 |
+--------+----------+----------+------+
```
### merge の sequence column の指定

Unique Key を持つテーブルにSequence columnがある場合、Sequence columnの値は、同じKey column内でのREPLACE集約関数における置換順序の基準として機能します。大きな値は小さな値を置き換えることができます。このようなテーブルで`DORIS_DELETE_SIGN`に基づいて削除をマークする場合、Keyが同じであり、Sequence columnの値が現在の値以上であることを確認する必要があります。`function_column.sequence_col`パラメータを指定することで、`merge_type: DELETE`と組み合わせて削除操作を実行できます。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "merge_type: DELETE" \
    -H "function_column.sequence_col: age" \
    -H "column_separator:," \
    -H "columns: name, gender, age" 
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
以下のテーブルスキーマが与えられた場合：

```sql
SET show_hidden_columns=true;
Query OK, 0 rows affected (0.00 sec)

DESC table1;
+------------------------+--------------+------+-------+---------+---------+
| Field                  | Type         | Null | Key   | Default | Extra   |
+------------------------+--------------+------+-------+---------+---------+
| name                   | VARCHAR(100) | No   | true  | NULL    |         |
| gender                 | VARCHAR(10)  | Yes  | false | NULL    | REPLACE |
| age                    | INT          | Yes  | false | NULL    | REPLACE |
| __DORIS_DELETE_SIGN__  | TINYINT      | No   | false | 0       | REPLACE |
| __DORIS_SEQUENCE_COL__ | INT          | Yes  | false | NULL    | REPLACE |
+------------------------+--------------+------+-------+---------+---------+
4 rows in set (0.00 sec)
```
元のテーブルデータは以下の通りです：

```sql
+-------+--------+------+
| name  | gender | age  |
+-------+--------+------+
| li    | male   |   10 |
| wang  | male   |   14 |
| zhang | male   |   12 |
+-------+--------+------+
```
1. Sequenceパラメータはエフェクトを受け取り、loading sequence列の値はテーブル内の既存データ以上になります。

   loading data as:

```sql
li,male,10
```
`function_column.sequence_col`が`age`として指定されており、`age`の値がテーブル内の既存の列以上であるため、元のテーブルデータは削除されます。テーブルデータは次のようになります：

```sql
+-------+--------+------+
| name  | gender | age  |
+-------+--------+------+
| wang  | male   |   14 |
| zhang | male   |   12 |
+-------+--------+------+
```
2. Sequenceパラメータが効果を発揮しない場合、読み込みsequence列の値が、テーブル内の既存データ以下である：

   読み込みデータは以下の通り：

```sql
li,male,9
```
`function_column.sequence_col`が`age`として指定されているが、`age`の値がテーブル内の既存の列より小さいため、削除操作は実行されません。テーブルデータは変更されず、プライマリキーが`li`の行は引き続き表示されます：

```sql
+-------+--------+------+
| name  | gender | age  |
+-------+--------+------+
| li    | male   |   10 |
| wang  | male   |   14 |
| zhang | male   |   12 |
+-------+--------+------+
```
削除されない理由は、基盤となる依存関係レベルにおいて、まず同じキーを持つ行をチェックするためです。より大きなsequence列の値を持つ行データを表示します。その後、その行の`DORIS_DELETE_SIGN`値をチェックします。1の場合、外部には表示されません。0の場合、まだ読み取られて表示されます。

### 囲み文字を使用したデータの読み込み

CSVファイル内のデータがデリミタまたはセパレータを含んでいる場合、単一バイト文字を囲み文字として指定することで、データが切り詰められることを防ぐことができます。

例えば、以下のデータでは、コンマがセパレータとして使用されているが、フィールド内にも存在する場合：

```sql
zhangsan,30,'Shanghai, HuangPu District, Dagu Road'
```
単一引用符 ' などの囲み文字を指定することで、`Shanghai, HuangPu District, Dagu Road` 全体を単一のフィールドとして扱うことができます。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "column_separator:," \
    -H "enclose:'" \
    -H "columns:username,age,address" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
フィールド内に囲み文字も含まれている場合、例えば `Shanghai City, Huangpu District, \'Dagu Road` を単一のフィールドとして扱いたい場合は、まずカラム内で文字列エスケープを実行する必要があります：

```
Zhang San,30,'Shanghai, Huangpu District, \'Dagu Road'
```
escape パラメータを使用して、単一バイト文字であるエスケープ文字を指定できます。この例では、バックスラッシュ `\` がエスケープ文字として使用されています。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "column_separator:," \
    -H "enclose:'" \
    -H "escape:\\" \
    -H "columns:username,age,address" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### DEFAULT CURRENT_TIMESTAMP型を含むフィールドの読み込み

DEFAULT CURRENT_TIMESTAMP型のフィールドを含むテーブルへのデータ読み込みの例を以下に示します：

テーブルスキーマ：

```sql
`id` bigint(30) NOT NULL,
`order_code` varchar(30) DEFAULT NULL COMMENT '',
`create_time` datetimev2(3) DEFAULT CURRENT_TIMESTAMP
```
JSON データ型:

```Plain
{"id":1,"order_Code":"avc"}
```
コマンド:

```shell
curl --location-trusted -u root -T test.json -H "label:1" -H "format:json" -H 'columns: id, order_code, create_time=CURRENT_TIMESTAMP()' http://host:port/api/testDb/testTbl/_stream_load
```
### JSON形式データ読み込みのためのシンプルモード

JSONフィールドがテーブル内のカラム名と一対一で対応している場合、パラメータ"strip_outer_array:true"と"format:json"を指定することで、JSON データ形式をテーブルにインポートできます。

例えば、テーブルが以下のように定義されている場合：

```sql
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "User ID",
    name               VARCHAR(20)           COMMENT "User name",
    age                INT                   COMMENT "User age"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
そして、データフィールド名はテーブルの列名と一対一で対応します：

```sql
[
{"user_id":1,"name":"Emily","age":25},
{"user_id":2,"name":"Benjamin","age":35},
{"user_id":3,"name":"Olivia","age":28},
{"user_id":4,"name":"Alexander","age":60},
{"user_id":5,"name":"Ava","age":17},
{"user_id":6,"name":"William","age":69},
{"user_id":7,"name":"Sophia","age":32},
{"user_id":8,"name":"James","age":64},
{"user_id":9,"name":"Emma","age":37},
{"user_id":10,"name":"Liam","age":64}
]
```
以下のコマンドを使用してJSONデータをテーブルに読み込むことができます：

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "format:json" \
    -H "strip_outer_array:true" \
    -T streamload_example.json \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### 複雑なJSON形式データの読み込みにおけるマッチングモード

JSONデータがより複雑で、テーブル内の列名と一対一で対応できない場合、または余分な列がある場合、jsonpathsパラメータを使用して列名マッピングを完了し、データマッチングインポートを実行できます。例えば、以下のデータの場合：

```sql
[
{"userid":1,"hudi":"lala","username":"Emily","userage":25,"userhp":101},
{"userid":2,"hudi":"kpkp","username":"Benjamin","userage":35,"userhp":102},
{"userid":3,"hudi":"ji","username":"Olivia","userage":28,"userhp":103},
{"userid":4,"hudi":"popo","username":"Alexander","userage":60,"userhp":103},
{"userid":5,"hudi":"uio","username":"Ava","userage":17,"userhp":104},
{"userid":6,"hudi":"lkj","username":"William","userage":69,"userhp":105},
{"userid":7,"hudi":"komf","username":"Sophia","userage":32,"userhp":106},
{"userid":8,"hudi":"mki","username":"James","userage":64,"userhp":107},
{"userid":9,"hudi":"hjk","username":"Emma","userage":37,"userhp":108},
{"userid":10,"hudi":"hua","username":"Liam","userage":64,"userhp":109}
]
```
指定された列に一致するようにjsonpathsパラメータを指定できます：

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "format:json" \
    -H "strip_outer_array:true" \
    -H "jsonpaths:[\"$.userid\", \"$.username\", \"$.userage\"]" \
    -H "columns:user_id,name,age" \
    -T streamload_example.json \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### データロード用のJSONルートノードの指定

JSONデータにネストしたJSONフィールドが含まれている場合、インポートするJSONのルートノードを指定する必要があります。デフォルト値は""です。

例えば、以下のデータで、commentカラムのデータをテーブルにインポートしたい場合：

```sql
[
    {"user":1,"comment":{"userid":101,"username":"Emily","userage":25}},
    {"user":2,"comment":{"userid":102,"username":"Benjamin","userage":35}},
    {"user":3,"comment":{"userid":103,"username":"Olivia","userage":28}},
    {"user":4,"comment":{"userid":104,"username":"Alexander","userage":60}},
    {"user":5,"comment":{"userid":105,"username":"Ava","userage":17}},
    {"user":6,"comment":{"userid":106,"username":"William","userage":69}},
    {"user":7,"comment":{"userid":107,"username":"Sophia","userage":32}},
    {"user":8,"comment":{"userid":108,"username":"James","userage":64}},
    {"user":9,"comment":{"userid":109,"username":"Emma","userage":37}},
    {"user":10,"comment":{"userid":110,"username":"Liam","userage":64}}
    ]
```
まず、json_rootパラメータを使用してルートノードをコメントとして指定し、その後jsonpathsパラメータに従ってカラム名マッピングを完了する必要があります。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "format:json" \
    -H "strip_outer_array:true" \
    -H "json_root: $.comment" \
    -H "jsonpaths:[\"$.userid\", \"$.username\", \"$.userage\"]" \
    -H "columns:user_id,name,age" \
    -T streamload_example.json \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### 配列データ型の読み込み

例えば、以下のデータが配列型を含む場合：

```sql
1|Emily|[1,2,3,4]
2|Benjamin|[22,45,90,12]
3|Olivia|[23,16,19,16]
4|Alexander|[123,234,456]
5|Ava|[12,15,789]
6|William|[57,68,97]
7|Sophia|[46,47,49]
8|James|[110,127,128]
9|Emma|[19,18,123,446]
10|Liam|[89,87,96,12]
```
以下のテーブル構造にデータを読み込みます：

```sql
CREATE TABLE testdb.test_streamload(
    typ_id     BIGINT          NOT NULL COMMENT "ID",
    name       VARCHAR(20)     NULL     COMMENT "Name",
    arr        ARRAY<int(10)>  NULL     COMMENT "Array"
)
DUPLICATE KEY(typ_id)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```
Stream Load ジョブを使用して、テキストファイルから ARRAY 型を直接テーブルに読み込むことができます。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "column_separator:|" \
    -H "columns:typ_id,name,arr" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### map データ型の読み込み

インポートされたデータが map 型を含む場合、以下の例のように：

```sql
[
{"user_id":1,"namemap":{"Emily":101,"age":25}},
{"user_id":2,"namemap":{"Benjamin":102,"age":35}},
{"user_id":3,"namemap":{"Olivia":103,"age":28}},
{"user_id":4,"namemap":{"Alexander":104,"age":60}},
{"user_id":5,"namemap":{"Ava":105,"age":17}},
{"user_id":6,"namemap":{"William":106,"age":69}},
{"user_id":7,"namemap":{"Sophia":107,"age":32}},
{"user_id":8,"namemap":{"James":108,"age":64}},
{"user_id":9,"namemap":{"Emma":109,"age":37}},
{"user_id":10,"namemap":{"Liam":110,"age":64}}
]
```
以下のテーブル構造にデータを読み込みます：

```sql
CREATE TABLE testdb.test_streamload(
    user_id            BIGINT       NOT NULL COMMENT "ID",
    namemap            Map<STRING, INT>  NULL     COMMENT "Name"
)
DUPLICATE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
テキストファイルからマップタイプを Stream Load タスクを使用してテーブルに直接ロードできます。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "format: json" \
    -H "strip_outer_array:true" \
    -T streamload_example.json \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### Bitmapデータ型の読み込み

インポート処理中にBitmap型のデータに遭遇した場合、to_bitmapを使用してデータをBitmapに変換するか、bitmap_empty関数を使用してBitmapを埋めることができます。

例えば、以下のデータの場合：

```sql
1|koga|17723
2|nijg|146285
3|lojn|347890
4|lofn|489871
5|jfin|545679
6|kon|676724
7|nhga|767689
8|nfubg|879878
9|huang|969798
10|buag|97997
```
以下のBitmap型を含むテーブルにデータを読み込みます：

```sql
CREATE TABLE testdb.test_streamload(
    typ_id     BIGINT                NULL   COMMENT "ID",
    hou        VARCHAR(10)           NULL   COMMENT "one",
    arr        BITMAP  BITMAP_UNION  NOT NULL   COMMENT "two"
)
AGGREGATE KEY(typ_id,hou)
DISTRIBUTED BY HASH(typ_id,hou) BUCKETS 10;
```
そして、データをBitmap型に変換するためにto_bitmapを使用します。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "Expect:100-continue" \
    -H "columns:typ_id,hou,arr,arr=to_bitmap(arr)" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### HyperLogLogデータ型の読み込み

hll_hash関数を使用してデータをhll型に変換できます。以下の例のようになります：

```sql
1001|koga
1002|nijg
1003|lojn
1004|lofn
1005|jfin
1006|kon
1007|nhga
1008|nfubg
1009|huang
1010|buag
```
以下のテーブルにデータを読み込みます：

```sql
CREATE TABLE testdb.test_streamload(
    typ_id           BIGINT          NULL   COMMENT "ID",
    typ_name         VARCHAR(10)     NULL   COMMENT "NAME",
    pv               hll hll_union   NOT NULL   COMMENT "hll"
)
AGGREGATE KEY(typ_id,typ_name)
DISTRIBUTED BY HASH(typ_id) BUCKETS 10;
```
そして、インポートにはhll_hashコマンドを使用します。

```sql
curl --location-trusted -u <doris_user>:<doris_password> \
    -H "column_separator:|" \
    -H "columns:typ_id,typ_name,pv=hll_hash(typ_id)" \
    -T streamload_example.csv \
    -XPUT http://<fe_ip>:<fe_http_port>/api/testdb/test_streamload/_stream_load
```
### カラムマッピング、派生カラム、およびフィルタリング

Dorisは、ロード文において非常に豊富なカラム変換およびフィルタリング操作をサポートしています。ほとんどの組み込み関数をサポートしています。この機能の正しい使用方法については、[Data Transformation](../../../data-operate/import/load-data-convert)のドキュメントを参照してください。

### strict modeインポートの有効化

strict_mode属性は、インポートタスクがstrict modeで実行されるかどうかを設定するために使用されます。この属性は、カラムマッピング、変換、およびフィルタリングの結果に影響し、部分的なカラム更新の動作も制御します。strict modeの具体的な手順については、[Handling Messy Data](../../../data-operate/import/handling-messy-data)のドキュメントを参照してください。

### インポート時の部分的なカラム更新/柔軟な部分更新の実行

インポート時の部分的なカラム更新の表現方法については、Data Manipulation/Data Updateのドキュメントを参照してください。
