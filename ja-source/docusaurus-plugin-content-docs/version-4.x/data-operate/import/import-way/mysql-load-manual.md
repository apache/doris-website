---
{
  "title": "MySQL負荷",
  "description": "Apache Dorisは、MySQLプロトコルと互換性があり、標準のMySQL LOAD DATA構文を使用してローカルファイルをインポートすることをサポートしています。",
  "language": "ja"
}
---
Apache Doris は MySQL プロトコルと互換性があり、標準的な MySQL の [LOAD DATA](https://dev.mysql.com/doc/refman/8.0/en/load-data.html) 構文を使用してローカルファイルをインポートすることをサポートしています。MySQL Load は同期インポート方式であり、完了時にインポート結果が返されます。つまり、ユーザーは返された結果からインポートが成功したかどうかを判断できます。一般的に、MySQL Load 方式は 10GB 未満のサイズのファイルの取り込みに使用できます。10GB より大きなファイルの場合は、より小さなファイルに分割することを推奨します。MySQL Load は一連のインポートタスクの原子性を保証します。つまり、すべてのインポートが成功するか、すべてのインポートが失敗するかのいずれかです。

## 適用シナリオ

**サポートされる形式**

MySQL Load は主に、クライアントのローカルマシンから CSV ファイルをインポートしたり、プログラムを通じてデータストリームからデータをインポートしたりするために設計されています。

**制限事項**

CSV ファイルをインポートする際は、null 値と空文字列（''）を区別することが重要です。

- Null 値はエスケープシーケンス \N で表現されます。例えば、`a,\N,b` では、中央の列が null 値を表現します。
- 空文字列は `a, ,b` のように直接空として表現され、中央の列が空文字列を表現します。

## 実装

MySQL Load は機能面で Stream Load と似ています。どちらも Doris クラスターにローカルファイルをインポートすることを含みます。したがって、MySQL Load の実装は Stream Load の基本インポート機能を再利用します。

MySQL Load の主なプロセスは以下を含みます。

1. ユーザーが frontend（FE）に LOAD DATA リクエストを送信し、FE が解析を実行して Stream Load タスクにリクエストをカプセル化します。
2. FE が backend（BE）ノードを選択し、そこに Stream Load リクエストを送信します。
3. 同時に、FE が MySQL クライアントからローカルファイルデータを非同期かつストリーミング方式で読み取り、Stream Load の HTTP リクエストにリアルタイムで送信します。
4. MySQL クライアントからのデータ転送が完了すると、FE は Stream Load の終了を待機し、インポート結果（成功または失敗）をクライアントに表示します。

## 開始方法

### 準備

MySQL Load にはターゲットtableに対する INSERT 権限が必要です。GRANT コマンドを使用してユーザーアカウントに権限を付与できます。

### MySQL Load ジョブの作成

1. テストデータの準備

以下のサンプルデータを含むデータファイル `client_local.csv` を作成します。

```SQL
1,10
2,20
3,30
4,40
5,50
6,60
```
2. MySQLクライアントに接続する

LOAD DATAコマンドを実行する前に、MySQLクライアントに接続します：

```Shell
mysql --local-infile  -h <fe_ip> -P <fe_query_port> -u root -D testdb
```
:::caution
接続時には特定のパラメータオプションを使用する必要があります：

1. MySQLクライアントに接続する際は、`--local-infile`を含める必要があります。そうでなければエラーが発生する可能性があります。
2. JDBC経由で接続する際は、URLに`allowLoadLocalInfile=true`を指定する必要があります。
:::

3. テストTableの作成

Dorisで以下のようにTableを作成します：

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
### 結果の確認

MySQL Loadは同期的なインポート方式であり、インポートの結果はコマンドラインインターフェースでユーザーに返されます。インポートの実行が失敗した場合、具体的なエラーメッセージが表示されます。

以下は、インポートが成功した場合の結果の例で、インポートされた行数が返されます：

```SQL
Query OK, 6 row affected (0.17 sec)
Records: 6  Deleted: 0  Skipped: 0  Warnings: 0
```
インポート中に例外が発生した場合、対応するエラーがクライアントに表示されます：

```SQL
ERROR 1105 (HY000): errCode = 2, detailMessage = [DATA_QUALITY_ERROR]too many filtered rows with load id b612907c-ccf4-4ac2-82fe-107ece655f0f
```
`loadId` はエラーメッセージに含まれており、これに基づいて `show load warnings` コマンドを使用して詳細情報を確認できます：

```SQL
show load warnings where label='b612907c-ccf4-4ac2-82fe-107ece655f0f';
```
### MySQL Load ジョブのキャンセル

DorisではMySQL Loadジョブの手動キャンセルは許可されていません。タイムアウトまたはインポートエラーが発生した場合、対応するMySQL Loadジョブはシステムによって自動的にキャンセルされます。

## マニュアル

### 構文

LOAD DATAの構文は以下の通りです：

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
Load ジョブのモジュールの説明：

| Module                | デスクリプション                                                  |
| --------------------- | ------------------------------------------------------------ |
| INFILE                | ローカルファイルパスを指定します。相対パスまたは絶対パスのどちらでも指定できます。現在、load_data_file は単一ファイルのみサポートしています。 |
| INTO TABLE            | データベースとTableを指定します。データベース名は省略可能です。 |
| PARTITION             | 対象パーティションを指定します。ユーザーがデータに対応するパーティションを決定できる場合は、これを指定することを推奨します。指定されたパーティションに適合しないデータはフィルタリングされます。 |
| COLUMNS TERMINATED BY | 列の区切り文字を指定します。                         |
| LINE TERMINATED BY    | 行の区切り文字を指定します。                            |
| IGNORE num LINES      | CSV インポートでスキップする行数を指定します。通常はヘッダーをスキップするために1が指定されます。 |
| col_name_or_user_var  | 列マッピング構文を指定します。詳細については、[Column Mapping](https://doris.apache.org/docs/dev/data-operate/import/load-data-convert#column-mapping) を参照してください。 |
| PROPERTIES            | Load のパラメータです。                                     |

### パラメータ

`PROPERTIES (key1 = value1 [, key2=value2])` 構文により、Load のパラメータを設定できます。

| Parameter          | デスクリプション                                                  |
| ------------------ | ------------------------------------------------------------ |
| max_filter_ratio   | 許可される最大フィルタリング率です。0以上1以下の値である必要があります。デフォルト値は0で、エラー行を一切許可しないことを示します。 |
| timeout            | インポートタイムアウトで、秒単位で測定されます。デフォルト値は600です。許可される範囲は1秒から259200秒です。 |
| strict_mode        | このインポートで厳密モードを有効にするかどうかです。デフォルトでは無効です。 |
| timezone           | このインポートのタイムゾーンです。デフォルトのタイムゾーンは UTC+8 です。このパラメータは、インポートに関連するタイムゾーン関連関数の結果に影響します。 |
| exec_mem_limit     | インポートのメモリ制限で、デフォルトは2GB、バイト単位で測定されます。 |
| trim_double_quotes | ブール値で、デフォルトは false です。これが true に設定された場合、インポートファイルの各フィールドから最外側の二重引用符が取り除かれます。 |
| enclose            | 囲み文字を指定します。CSV データフィールドに改行または列の区切り文字が含まれている場合、誤った切り詰めを防ぐために単一バイト文字を囲み文字として指定できます。例えば、列の区切り文字が ","、囲み文字が "'" の場合、データ "a,'b,c'" において "b,c" は1つのフィールドとして解析されます。 |
| escape             | エスケープ文字を指定します。これは、データに囲み文字と同じ文字が含まれており、それをフィールドの一部として扱う必要がある場合に使用されます。例えば、データが "a,'b,'c'"、囲み文字が "'"で、"b,'c" を1つのフィールドとして解析したい場合、"\" などの単一バイトエスケープ文字を指定してデータを "a,'b,\'c'" に変更する必要があります。 |

## 例

### ロードタイムアウトの指定

PROPERTIES で `timeout` を指定することにより、インポートタイムアウトを調整できます。例えば、100秒に設定する場合：

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
### 列と行の区切り文字を指定する

`COLUMNS TERMINATED BY`句と`LINES TERMINATED BY`句を使用して、列と行の区切り文字を指定できます。以下の例では、列の区切り文字として(,)、行の区切り文字として(\n)がそれぞれ使用されています。

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
COLUMNS TERMINATED BY ','
LINES TERMINATED BY '\n';
```
### ターゲットパーティションの指定

`PARTITION`句を使用して、インポートのターゲットパーティションを指定できます。次の例では、指定されたパーティション'p1'と'p2'にデータがロードされ、これら2つのパーティションに属さないデータはフィルタリングされます：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PARTITION (p1, p2);
```
### タイムゾーンの指定

PROPERTIESで`timezone`を指定することができます。以下の例では、タイムゾーンをAfrica/Abidjanに設定しています：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("timezone"="Africa/Abidjan");
```
### インポート時のメモリ制限の指定

PROPERTIES内の`exec_mem_limit`パラメータを使用してインポート時のメモリ制限を指定できます。以下の例では、メモリ制限が10Gに設定されています：

```SQL
LOAD DATA LOCAL
INFILE 'testData'
INTO TABLE testDb.testTbl
PROPERTIES ("exec_mem_limit"="10737418240");
```
## より詳しいヘルプ

MySQL Loadに関するより詳細な構文とベストプラクティスについては、[MySQL Load](../../../sql-manual/sql-statements/data-modification/load-and-export/MYSQL-LOAD)コマンドマニュアルを参照してください。
