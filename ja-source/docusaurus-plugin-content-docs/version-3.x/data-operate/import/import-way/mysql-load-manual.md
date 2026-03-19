---
{
  "title": "MySQL負荷",
  "description": "Apache Dorisは MySQL プロトコルと互換性があり、標準の MySQL LOAD DATA 構文を使用してローカルファイルをインポートすることをサポートしています。",
  "language": "ja"
}
---
Apache DorisはMySQLプロトコルと互換性があり、標準のMySQL [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html)構文を使用してローカルファイルをインポートできます。MySQL Loadは同期的なインポート方法で、完了時にインポート結果が返されます。つまり、ユーザーは返された結果からインポートが成功したかどうかを判断できます。一般的に、MySQL Loadメソッドは10GB未満のファイルの取り込みに使用できます。10GBを超えるファイルの場合は、より小さなファイルに分割することを推奨します。MySQL Loadは一連のインポートタスクの原子性を保証します。つまり、すべてのインポートが成功するか、すべてのインポートが失敗するかのいずれかになります。

## 適用可能なシナリオ

**サポートされている形式**

MySQL Loadは主に、クライアントのローカルマシンからCSVファイルをインポートしたり、プログラムを通じてデータストリームからデータをインポートしたりするために設計されています。

**制限事項**

CSVファイルをインポートする際は、null値と空文字列('')を区別することが重要です：

- null値はエスケープシーケンス\Nで表現されます。例えば、`a,\N,b`では、中央の列がnull値を表します。
- 空文字列は`a, ,b`のように空として直接表現され、中央の列が空文字列を表します。

## 実装

MySQL Loadは機能面でStream Loadに類似しています。どちらもローカルファイルをDorisクラスターにインポートします。そのため、MySQL Loadの実装はStream Loadの基本的なインポート機能を再利用しています。

MySQL Loadの主なプロセスは以下の通りです：

1. ユーザーがLOAD DATAリクエストをfrontend（FE）に送信し、FEが解析を行い、リクエストをStream Loadタスクにカプセル化します。
2. FEがbackend（BE）ノードを選択し、Stream Loadリクエストをそのノードに送信します。
3. 一方で、FEがMySQLクライアントからローカルファイルデータを非同期かつストリーミング方式で読み取り、Stream LoadのHTTPリクエストにリアルタイムで送信します。
4. MySQLクライアントからのデータ転送が完了すると、FEはStream Loadの完了を待ち、インポート結果（成功または失敗）をクライアントに表示します。

## 開始方法

### 準備

MySQL Loadにはターゲットtableに対するINSERT権限が必要です。GRANTコマンドを使用してユーザーアカウントに権限を付与できます。

### MySQL Loadジョブの作成

1. テストデータの準備

以下のサンプルデータを含むデータファイル`client_local.csv`を作成します：

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```
2. MySQLクライアントに接続する

LOAD DATAコマンドを実行する前に、MySQLクライアントに接続してください：

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```
:::caution
接続時には特定のパラメータオプションを使用する必要があります：

1. MySQLクライアントに接続する際は、`--local-infile`を含める必要があります。含めないとエラーが発生する可能性があります。
2. JDBC経由で接続する際は、URLで`allowLoadLocalInfile=true`を指定する必要があります。
:::

3. テストTableを作成

Dorisで以下のようにTableを作成します：

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```
4. LOAD DATA コマンドを実行する

MySQL クライアントに接続した後、Load ジョブを作成します。コマンドは以下の通りです：

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```
### 結果の確認

MySQL Loadは同期インポート方式であり、インポート結果はコマンドラインインターフェースでユーザーに返されます。インポートの実行が失敗した場合は、具体的なエラーメッセージが表示されます。

以下は、インポートされた行数を返す、成功したインポート結果の例です：

```SQL
Query OK, 6 row affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```
インポート中に例外が発生した場合、対応するエラーがクライアントに表示されます：

```SQL
ERROR 1105 (HY000): errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows with load id b612907c-ccf4-4ac2-82fe-107ece655f0f
```
`loadId`はエラーメッセージに含まれており、これに基づいて`show load warnings`コマンドで詳細情報を確認できます：

```SQL
show load warnings where label='b612907c-ccf4-4ac2-82fe-107ece655f0f';
```
### MySQL Load ジョブのキャンセル

Dorisでは MySQL Load ジョブの手動キャンセルは許可されていません。タイムアウトまたはインポートエラーが発生した場合、対応する MySQL Load ジョブはシステムによって自動的にキャンセルされます。

## マニュアル

### 構文

LOAD DATA の構文は以下の通りです：

```SQL
LOAD DATA LOCAL
INFILE '<load_data_file>'
INTO TABLE [<db_name>.]<table_name>
[PARTITION (partition_name [, partition_name] ...)]
[COLUMNS TERMINATED BY '<column_terminated_operator>']
[LINES TERMINATED BY '<line_terminated_operator>']
[IGNORE <ignore_lines> LINES]
[(col_name_or_user_var[, col_name_or_user_var] ...)]
[SET col_name={expr | DEFAULT}[, col_name={expr | DEFAULT}] ...]
[PROPERTIES (key1 = value1 [, key2=value2]) ]
```
Loadジョブのモジュールの説明：

| Module                | デスクリプション                                                  |
| --------------------- | ------------------------------------------------------------ |
| INFILE                | ローカルファイルパスを指定します。相対パスまたは絶対パスのいずれかを使用できます。現在、load_data_fileは単一ファイルのみをサポートしています。 |
| INTO TABLE            | データベースとTableを指定します。データベース名は省略可能です。 |
| PARTITION             | 対象パーティションを指定します。ユーザーがデータに対応するパーティションを特定できる場合は、これを指定することを推奨します。指定されたパーティションに適合しないデータはフィルタリングされます。 |
| COLUMNS TERMINATED BY | 列の区切り文字を指定します。                         |
| LINE TERMINATED BY    | 行の区切り文字を指定します。                            |
| IGNORE num LINES      | CSVインポートでスキップする行数を指定します。通常、ヘッダーをスキップするために1が指定されます。 |
| col_name_or_user_var  | 列マッピング構文を指定します。詳細については、[Column Mapping](https://doris.apache.org/docs/dev/data-operate/import/load-data-convert#column-mapping)を参照してください。 |
| PROPERTIES            | Loadのパラメータです。                                     |

### パラメータ

`PROPERTIES (key1 = value1 [, key2=value2])`構文により、Loadのパラメータを設定できます。

| Parameter          | デスクリプション                                                  |
| ------------------ | ------------------------------------------------------------ |
| max_filter_ratio   | 許可される最大フィルタリング率です。0から1の間（両端を含む）で指定する必要があります。デフォルト値は0で、エラー行に対する許容度がないことを示します。 |
| timeout            | インポートのタイムアウト時間（秒単位）です。デフォルト値は600です。許可される範囲は1秒から259200秒までです。 |
| strict_mode        | このインポートで厳密モードを有効にするかどうかです。デフォルトでは無効になっています。 |
| timezone           | このインポートのタイムゾーンです。デフォルトのタイムゾーンはUTC+8です。このパラメータは、インポートに関わるタイムゾーン関連の関数の結果に影響を与えます。 |
| exec_mem_limit     | インポートのメモリ制限で、デフォルトは2GB、バイト単位で測定されます。 |
| trim_double_quotes | ブール値、デフォルトはfalseです。これをtrueに設定すると、インポートファイルの各フィールドから最も外側の二重引用符が削除されます。 |
| enclose            | 囲み文字を指定します。CSVデータフィールドに改行または列区切り文字が含まれている場合、単一バイト文字を囲み文字として指定することで、意図しない切り詰めを防ぐことができます。例えば、列区切り文字が","で、囲み文字が"'"の場合、データ"a,'b,c'"において、"b,c"は一つのフィールドとして解析されます。 |
| escape             | エスケープ文字を指定します。これは、データに囲み文字と同じ文字が含まれており、それをフィールドの一部として扱う必要がある場合に使用されます。例えば、データが"a,'b,'c'"で、囲み文字が"'"であり、"b,'c"を一つのフィールドとして解析したい場合、"\"などの単一バイトエスケープ文字を指定して、データを"a,'b,\'c'"に変更する必要があります。 |

## Example

### ロードタイムアウトの指定

PROPERTIESで`timeout`を指定することで、インポートのタイムアウト時間を調整できます。例えば、100秒に設定する場合：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timeout"="100");
```
### 許容エラー率の指定

PROPERTIESで`max_filter_ratio`を指定することで、許容エラー率を調整できます。例えば、20%に設定する場合：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("max_filter_ratio"="0.2");
```
### Import column mapping

以下の例では、CSVファイル内の列の順序を調整します。

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
(k2, k1, v1);
```
### カラムと行の区切り文字を指定する

`COLUMNS TERMINATED BY`と`LINES TERMINATED BY`句を使用して、カラムと行の区切り文字を指定できます。以下の例では、カラムと行の区切り文字としてそれぞれ(,)と(\n)が使用されています。

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```
### 対象パーティションの指定

`PARTITION`句を使用してインポートの対象パーティションを指定できます。以下の例では、指定されたパーティション'p1'と'p2'にデータが読み込まれ、これら2つのパーティションに属さないデータはフィルタリングされます：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PARTITION (p1, p2);
```
### タイムゾーンの指定

PROPERTIESで`timezone`を指定できます。以下の例では、タイムゾーンがAfrica/Abidjanに設定されています：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timezone"="Africa/Abidjan");
```
### importのメモリ制限を指定する

PROPERTIESの`exec_mem_limit`パラメータによってimportのメモリ制限を指定できます。以下の例では、メモリ制限が10Gに設定されています：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("exec_mem_limit"="10737418240");
```
## さらなるヘルプ

MySQL Loadに関連するより詳細な構文とベストプラクティスについては、MySQL Loadコマンドマニュアルを参照してください。
