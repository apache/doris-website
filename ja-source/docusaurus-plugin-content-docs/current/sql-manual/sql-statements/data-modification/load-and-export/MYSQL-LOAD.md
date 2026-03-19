---
{
  "title": "MYSQL LOAD",
  "language": "ja",
  "description": "MySQL clientを使用してローカルデータファイルをDorisにインポートします。MySQL Loadは同期インポート方式です。"
}
---
## 説明

MySQLクライアントを使用してローカルデータファイルをDorisにインポートします。MySQL Loadは同期インポート方式で、実行後すぐにインポート結果を返します。`LOAD DATA`文の戻り値に基づいてインポートが成功したかどうかを判定できます。MySQL Loadは一連のインポートタスクの原子性を保証し、すべてのインポートが成功するか、すべてが失敗するかのいずれかになります。

## 構文

```sql
LOAD DATA
[ LOCAL ]
INFILE "<file_name>"
INTO TABLE "<tbl_name>"
[ PARTITION (<partition_name> [, ... ]) ]
[ COLUMNS TERMINATED BY "<column_separator>" ]
[ LINES TERMINATED BY "<line_delimiter>" ]
[ IGNORE <number> {LINES | ROWS} ]
[ (<col_name_or_user_var> [, ... ] ) ]
[ SET (col_name={<expr> | DEFAULT} [, col_name={<expr> | DEFAULT}] ...) ]
[ PROPERTIES ("<key>" = "<value>" [ , ... ]) ]
```
## 必須パラメータ

**1. `<file_name>`**

> ローカルファイルのパスを指定します。相対パスまたは絶対パスのいずれでも可能です。現在、単一ファイルのみがサポートされており、複数ファイルはサポートされていません。

**2. `<tbl_name>`**

> テーブル名にはデータベース名を含めることができます（例を参照）。データベース名が省略された場合、現在のユーザーのデータベースが使用されます。

## オプションパラメータ

**1. `LOCAL`**

> `LOCAL`を指定すると、クライアントからファイルを読み込むことを示します。省略した場合、FEサーバーのローカルストレージからファイルを読み込みます。FEサーバーからファイルをインポートする機能は、デフォルトで無効になっています。この機能を有効にするには、FEノードで`mysql_load_server_secure_path`を設定してセキュアパスを指定する必要があります。

**2. `<partition_name>`**

> インポート用に複数のパーティションを指定できます。カンマで区切ります。

**3. `<column_separator>`**

> カラムセパレータを指定します。

**4. `<line_delimiter>`**

> ラインデリミタを指定します。

**5. `IGNORE <number> { LINES | ROWS }`**

> ユーザーはCSVファイルのヘッダーまたは任意の行数をスキップできます。この構文は`IGNORE num ROWS`で置き換えることもできます。

**6. `<col_name_or_user_var>`**

> カラムマッピング構文。具体的なパラメータについては、[インポート時のデータ変換](../../../../data-operate/import/import-way/mysql-load-manual.md)のカラムマッピングセクションを参照してください。

**7.  `properties ("<key>"="<value>",...)`**  

| パラメータ | パラメータ説明 |
| ---------------------- | ------------------------------------------------------------ |
| max_filter_ratio | フィルタリング可能なデータ（データの不規則性などの理由による）の最大許容比率。デフォルトは許容なし。 |
| timeout | インポートタイムアウト期間を秒単位で指定します。デフォルトは600秒で、有効範囲は1秒から259,200秒です。 |
| strict_mode | ユーザーはこのインポートに対してストリクトモードを有効にするかどうかを指定できます。デフォルトは無効です。 |
| timezone | このインポートのタイムゾーンを指定します。デフォルトは現在のクラスターのタイムゾーンです。このパラメータは、インポートに関わるすべてのタイムゾーン関連関数の結果に影響します。 |
| exec_mem_limit | インポートメモリ制限。デフォルトはバイト単位で2GBです。 |
| trim_double_quotes | ブール型で、デフォルト値は`false`です。`true`に設定すると、インポートファイルの各フィールドの最も外側のダブルクォートをトリミングすることを意味します。 |
| enclose | 囲み文字。CSVデータフィールドに行セパレータやカラムセパレータが含まれる場合、誤った切り捨てを防ぐために、単一バイト文字を保護用の囲み文字として指定できます。例えば、カラムセパレータが","で、囲み文字が"'"で、データが"a,'b,c'"の場合、"b,c"が1つのフィールドとして解析されます。注意：`enclose`が`""`に設定されている場合、`trim_double_quotes`を`true`に設定する必要があります。 |
| escape | エスケープ文字。CSVフィールド内で囲み文字と同じ文字をエスケープするために使用されます。例えば、データが"a,'b,'c'"で、囲み文字が"'"で、"b,'c"を1つのフィールドとして解析したい場合、""などの単一バイトエスケープ文字を指定し、データを"a,'b,'c'"に変更する必要があります。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 注記 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Table | 指定されたデータベーステーブルのインポート権限。 |

## 使用上の注意

- MySQL Load文は`LOAD DATA`構文で始まり、LABELを指定する必要はありません。

## 例

1. クライアントのローカルファイル`testData`からデータベース`testDb`のテーブル`testTbl`にデータをインポートします。タイムアウトを100秒に指定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```
2. サーバーのローカルファイル`/root/testData`からデータをインポートします（FE設定`mysql_load_server_secure_path`を`/root`に設定する必要があります）。データベース`testDb`内のテーブル`testTbl`にインポートし、タイムアウトを100秒に指定します。

    ```sql
    LOAD DATA
    INFILE '/root/testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```
3. クライアントのローカルファイル`testData`から、データベース`testDb`内のテーブル`testTbl`にデータをインポートします。エラー率20%を許可します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
4. クライアントのローカルファイル`testData`からデータベース`testDb`内のテーブル`testTbl`にデータをインポートし、エラー率20%を許可して、ファイルの列名を指定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    (k2, k1, v1)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
5. ローカルファイル`testData`から、データベース`testDb`のテーブル`testTbl`のパーティション`p1`と`p2`にデータをインポートし、エラー率20%を許可します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
6. ローカルのCSVファイル`testData`から、行区切り文字`0102`、列区切り文字`0304`を使用して、データベース`testDb`のテーブル`testTbl`にデータをインポートします。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    COLUMNS TERMINATED BY '0304'
    LINES TERMINATED BY '0102'
    ```
7. ローカルファイル`testData`からデータベース`testDb`内のテーブル`testTbl`のパーティション`p1`と`p2`にデータをインポートし、最初の3行をスキップします。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    IGNORE 3 LINES
    ```
8. 厳密モードフィルタリングを使用してデータをインポートし、タイムゾーンを`Africa/Abidjan`に設定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("strict_mode"="true", "timezone"="Africa/Abidjan")
    ```
9. インポートメモリを10GBに制限し、データインポートのタイムアウトを10分に設定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("exec_mem_limit"="10737418240", "timeout"="600")
    ```
