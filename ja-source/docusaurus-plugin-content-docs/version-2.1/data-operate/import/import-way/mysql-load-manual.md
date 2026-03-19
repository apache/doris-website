---
{
  "title": "MySQLロード",
  "language": "ja",
  "description": "Apache DorisはMySQLプロトコルと互換性があり、標準のMySQL LOAD DATA構文を使用してローカルファイルをインポートすることをサポートしています。"
}
---
Apache DorisはMySQLプロトコルと互換性があり、標準のMySQL [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html)構文を使用してローカルファイルをインポートすることができます。MySQL Loadは同期的なインポート方法で、完了時にインポート結果が返されます。つまり、ユーザーは返された結果からインポートが成功したかどうかを判断できます。一般的に、MySQL Load方法は10GB未満のファイルの取り込みに使用できます。10GBを超えるファイルの場合は、より小さなファイルに分割することを推奨します。MySQL Loadはバッチインポートタスクの原子性を保証し、すべてのインポートが成功するか、すべてのインポートが失敗するかのいずれかになります。

## 適用可能なシナリオ

**サポートされる形式**

MySQL Loadは主にクライアントのローカルマシンからCSVファイルをインポートしたり、プログラムを通じてデータストリームからデータをインポートしたりするために設計されています。

**制限事項**

CSVファイルをインポートする際は、null値と空文字列（''）を区別することが重要です：

- null値はエスケープシーケンス\Nで表現されます。例えば、`a,\N,b`では、中央の列がnull値を表します。
- 空文字列は`a, ,b`のように直接空として表現され、中央の列が空文字列を表します。

## 実装

MySQL LoadはStream Loadと機能的に類似しています。どちらもローカルファイルをDorisクラスターにインポートすることを含みます。そのため、MySQL Loadの実装はStream Loadの基本的なインポート機能を再利用しています。

MySQL Loadの主なプロセスには以下が含まれます：

1. ユーザーがフロントエンド（FE）にLOAD DATAリクエストを送信し、FEが解析を実行してリクエストをStream Loadタスクにカプセル化します。
2. FEがバックエンド（BE）ノードを選択し、Stream Loadリクエストを送信します。
3. 同時に、FEはMySQLクライアントからローカルファイルデータを非同期でストリーミング方式で読み取り、Stream LoadのHTTPリクエストにリアルタイムで送信します。
4. MySQLクライアントからのデータ転送が完了すると、FEはStream Loadの完了を待機し、インポート結果（成功または失敗）をクライアントに表示します。

## はじめに

### 準備

MySQL Loadには対象テーブルに対するINSERT権限が必要です。GRANTコマンドを使用してユーザーアカウントに権限を付与できます。

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

1. MySQLクライアントに接続する際は、`--local-infile`を含める必要があります。そうしないとエラーが発生する可能性があります。
2. JDBC経由で接続する際は、URLに`allowLoadLocalInfile=true`を指定する必要があります。
:::

3. テストテーブルの作成

Dorisで以下のようにテーブルを作成します：

```SQL
CREATE TABLE testdb.t1 (
    pk     INT, 
    v1     INT SUM
) AGGREGATE KEY (pk) 
DISTRIBUTED BY hash (pk);
```
4. LOAD DATAコマンドを実行する

MySQLクライアントに接続した後、Loadジョブを作成します。コマンドは以下の通りです：

```SQL
LOAD DATA LOCAL
INFILE 'client_local.csv'
INTO TABLE testdb.t1
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```
### 結果の表示

MySQL Loadは同期的なインポート方法であり、インポートの結果はコマンドラインインターフェースでユーザーに返されます。インポートの実行が失敗した場合、具体的なエラーメッセージが表示されます。

以下は成功したインポート結果の例で、インポートされた行数が返されます：

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

Doris では MySQL Load ジョブの手動キャンセルはできません。タイムアウトやインポートエラーが発生した場合、対応する MySQL Load ジョブはシステムによって自動的にキャンセルされます。

## マニュアル

### 構文

LOAD DATA の構文は以下の通りです:

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

| モジュール            | 説明                                                         |
| --------------------- | ------------------------------------------------------------ |
| INFILE                | ローカルファイルパスを指定します。相対パスまたは絶対パスのいずれかを使用できます。現在、load_data_fileは単一ファイルのみをサポートしています。 |
| INTO TABLE            | データベースとテーブルを指定します。データベース名は省略できます。 |
| PARTITION             | ターゲットパーティションを指定します。ユーザーがデータに対応するパーティションを特定できる場合は、これを指定することをお勧めします。指定されたパーティションに適合しないデータは除外されます。 |
| COLUMNS TERMINATED BY | 列区切り文字を指定します。                                   |
| LINE TERMINATED BY    | 行区切り文字を指定します。                                   |
| IGNORE num LINES      | CSVインポート時にスキップする行数を指定します。通常、ヘッダーをスキップするために1を指定します。 |
| col_name_or_user_var  | 列マッピング構文を指定します。詳細については、[Column Mapping](https://doris.apache.org/docs/dev/data-operate/import/load-data-convert#column-mapping)を参照してください。 |
| PROPERTIES            | Loadのパラメータです。                                       |

### パラメータ

`PROPERTIES (key1 = value1 [, key2=value2])`構文により、Loadのパラメータを設定できます。

| パラメータ         | 説明                                                         |
| ------------------ | ------------------------------------------------------------ |
| max_filter_ratio   | 許可される最大フィルタリング率。0から1の間である必要があります（境界値を含む）。デフォルト値は0で、エラー行に対する許容度がないことを示します。 |
| timeout            | インポートタイムアウト（秒単位）。デフォルト値は600です。許可される範囲は1秒から259200秒です。 |
| strict_mode        | このインポートでstrictモードを有効にするかどうか。デフォルトでは無効です。 |
| timezone           | このインポートのタイムゾーン。デフォルトのタイムゾーンはUTC+8です。このパラメータは、インポートに関連するタイムゾーン関連の関数の結果に影響します。 |
| exec_mem_limit     | インポートのメモリ制限。デフォルトは2GB、バイト単位で測定されます。 |
| trim_double_quotes | ブール値、デフォルトはfalseです。これをtrueに設定すると、インポートファイルの各フィールドから最も外側の二重引用符が削除されます。 |
| enclose            | 囲み文字を指定します。CSVデータフィールドに改行または列区切り文字が含まれている場合、単一バイト文字を囲み文字として指定することで、偶発的な切り詰めを防ぐことができます。たとえば、列区切り文字が","で、囲み文字が"'"の場合、データ"a,'b,c'"では、"b,c"が1つのフィールドとして解析されます。 |
| escape             | エスケープ文字を指定します。これは、データが囲み文字と同じ文字を含み、それをフィールドの一部として扱う必要がある場合に使用されます。たとえば、データが"a,'b,'c'"で、囲み文字が"'"で、"b,'c"を1つのフィールドとして解析したい場合は、"\"などの単一バイトエスケープ文字を指定して、データを"a,'b,\'c'"に変更する必要があります。 |

## 例

### ロードタイムアウトの指定

PROPERTIESで`timeout`を指定することで、インポートタイムアウトを調整できます。たとえば、100秒に設定する場合：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timeout"="100");
```
### 許容可能なエラー率の指定

PROPERTIES で `max_filter_ratio` を指定することで、許容可能なエラー率を調整できます。例えば、20% に設定する場合：

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
### 列と行の区切り文字を指定する

`COLUMNS TERMINATED BY`句と`LINES TERMINATED BY`句を使用して、列と行の区切り文字を指定できます。次の例では、列の区切り文字として(,)、行の区切り文字として(\n)がそれぞれ使用されています。

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```
### ターゲットパーティションの指定

`PARTITION`句を使用してインポートのターゲットパーティションを指定できます。以下の例では、データは指定されたパーティション'p1'と'p2'にロードされ、これら2つのパーティションに属さないデータはフィルタリングされます：

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
### インポートのメモリ制限の指定

PROPERTIESの`exec_mem_limit`パラメータでインポートのメモリ制限を指定できます。以下の例では、メモリ制限が10Gに設定されています：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("exec_mem_limit"="10737418240");
```
## その他のヘルプ

MySQL Loadに関するより詳細な構文とベストプラクティスについては、[MySQL Load](../../../sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD)コマンドマニュアルを参照してください。
