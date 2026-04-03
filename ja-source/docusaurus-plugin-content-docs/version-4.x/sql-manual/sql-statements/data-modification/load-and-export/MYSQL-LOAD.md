---
{
  "title": "MYSQL LOAD",
  "description": "MySQL クライアントを使用して、ローカルデータファイルを Doris にインポートします。MySQL Load は同期インポート方式で、",
  "language": "ja"
}
---
## デスクリプション

MySQLクライアントを使用してローカルデータファイルをDorisにインポートします。MySQL Loadは同期インポート方式であり、実行後すぐにインポート結果を返します。`LOAD DATA`ステートメントの戻り結果に基づいてインポートが成功したかどうかを判断できます。MySQL Loadは一連のインポートタスクの原子性を保証できます。つまり、すべてのインポートが成功するか、すべて失敗するかのどちらかです。

## Syntax

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

> ローカルファイルのパスを指定します。相対パスまたは絶対パスのいずれかを指定できます。現在、単一ファイルのみサポートされており、複数ファイルはサポートされていません。

**2. `<tbl_name>`**

> Table名には例に示すように、データベース名を含めることができます。データベース名が省略された場合、現在のユーザーのデータベースが使用されます。

## オプションパラメータ

**1. `LOCAL`**

> `LOCAL`を指定すると、クライアントからファイルを読み込むことを示します。省略した場合、FEサーバーのローカルストレージからファイルを読み込みます。FEサーバーからのファイルインポート機能は、デフォルトで無効になっています。この機能を有効にするには、FEノードで`mysql_load_server_secure_path`を設定して、セキュアパスを指定する必要があります。

**2. `<partition_name>`**

> インポート用に複数のパーティションを指定できます。カンマで区切って指定します。

**3. `<column_separator>`**

> カラム区切り文字を指定します。

**4. `<line_delimiter>`**

> 行区切り文字を指定します。

**5. `IGNORE <number> { LINES | ROWS }`**

> ユーザーはCSVファイルのヘッダーまたは任意の行数をスキップできます。この構文は`IGNORE num ROWS`で置き換えることもできます。

**6. `<col_name_or_user_var>`**

> カラムマッピング構文です。具体的なパラメータについては、[インポート時のデータ変換](../../../../data-operate/import/import-way/mysql-load-manual.md)のカラムマッピングセクションを参照してください。

**7. `properties ("<key>"="<value>",...)`**

| パラメータ | パラメータ説明 |
| ---------------------- | ------------------------------------------------------------ |
| max_filter_ratio | フィルタリング可能なデータ（データの不正などの理由による）の最大許容比率です。デフォルトは許容度ゼロです。 |
| timeout | インポートのタイムアウト期間を秒単位で指定します。デフォルトは600秒で、有効範囲は1秒から259,200秒です。 |
| strict_mode | ユーザーはこのインポートで厳密モードを有効にするかどうかを指定できます。デフォルトは無効です。 |
| timezone | このインポートのタイムゾーンを指定します。デフォルトは東8時間帯です。このパラメータは、インポートに関与するすべてのタイムゾーン関連関数の結果に影響します。 |
| exec_mem_limit | インポートのメモリ制限で、デフォルトはバイト単位で2GBです。 |
| trim_double_quotes | ブール型でデフォルト値は`false`です。`true`に設定すると、インポートファイルの各フィールドの最も外側のダブルクォートをトリムすることを意味します。 |
| enclose | 囲み文字です。CSVデータフィールドに行区切り文字またはカラム区切り文字が含まれている場合、誤った切り詰めを防ぐために、保護用の囲み文字として1バイト文字を指定できます。たとえば、カラム区切り文字が","、囲み文字が"'"、データが"a,'b,c'"の場合、"b,c"が1つのフィールドとして解析されます。注意：`enclose`が`""`に設定されている場合、`trim_double_quotes`は`true`に設定する必要があります。 |
| escape | エスケープ文字です。CSVフィールド内の囲み文字と同じ文字をエスケープするために使用されます。たとえば、データが"a,'b,'c'"、囲み文字が"'"で、"b,'c"を1つのフィールドとして解析したい場合、""などの1バイトエスケープ文字を指定し、データを"a,'b,'c'"に変更する必要があります。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 注記 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Table | 指定されたデータベースTableのインポート権限。 |

## 使用上の注意

- MySQL Load文は`LOAD DATA`構文で開始し、LABELの指定は必要ありません。

## 例

1. クライアントのローカルファイル`testData`からデータベース`testDb`のTable`testTbl`にデータをインポートします。タイムアウトを100秒に指定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```
2. サーバーのローカルファイル `/root/testData` からデータをインポートします（FE設定 `mysql_load_server_secure_path` を `/root` に設定する必要があります）。データベース `testDb` のTable `testTbl` にインポートし、タイムアウトを100秒に指定します。

    ```sql
    LOAD DATA
    INFILE '/root/testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```
3. クライアントのローカルファイル `testData` からデータベース `testDb` 内のTable `testTbl` にデータをインポートし、エラー率20%を許可する。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
4. クライアントのローカルファイル`testData`から、データベース`testDb`内のTable`testTbl`にデータをインポートし、エラー率20%を許可し、ファイルの列名を指定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    (k2, k1, v1)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
5. ローカルファイル`testData`からデータベース`testDb`内のTable`testTbl`のパーティション`p1`と`p2`にデータをインポートし、エラー率20%を許可します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
6. ローカルCSVファイル`testData`から、行区切り文字`0102`、列区切り文字`0304`を使用して、データベース`testDb`内のTable`testTbl`にデータをインポートします。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    COLUMNS TERMINATED BY '0304'
    LINES TERMINATED BY '0102'
    ```
7. ローカルファイル`testData`から、データベース`testDb`のTable`testTbl`のパーティション`p1`および`p2`にデータをインポートし、最初の3行をスキップします。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    IGNORE 3 LINES
    ```
8. strict mode フィルタリングでデータをインポートし、タイムゾーンを `Africa/Abidjan` に設定します。

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
