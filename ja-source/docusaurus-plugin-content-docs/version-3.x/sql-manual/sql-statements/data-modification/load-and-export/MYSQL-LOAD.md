---
{
  "title": "MYSQL LOAD",
  "description": "MySQL クライアントを使用してローカルデータファイルを Doris にインポートします。MySQL Load は同期インポート方式です。",
  "language": "ja"
}
---
## 説明

MySQLクライアントを使用して、ローカルデータファイルをDorisにインポートします。MySQL Loadは同期インポート方式であり、実行後すぐにインポート結果を返します。`LOAD DATA`文の戻り結果に基づいて、インポートが成功したかどうかを判断できます。MySQL Loadは一連のインポートタスクの原子性を保証でき、すべてのインポートが成功するか、すべて失敗するかのいずれかになります。

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

> ローカルファイルのパスを指定します。相対パスまたは絶対パスのいずれかを使用できます。現在、単一ファイルのみがサポートされており、複数ファイルはサポートされていません。

**2. `<tbl_name>`**

> Table名には、例に示すようにデータベース名を含めることができます。データベース名が省略された場合、現在のユーザーのデータベースが使用されます。

## オプションパラメータ

**1. `LOCAL`**

> `LOCAL`を指定すると、クライアントからファイルを読み取ることを示します。省略した場合は、FEサーバーのローカルストレージからファイルを読み取ります。FEサーバーからファイルをインポートする機能は、デフォルトで無効になっています。この機能を有効にするには、FEノードで`mysql_load_server_secure_path`を設定してセキュアパスを指定する必要があります。

**2. `<partition_name>`**

> インポート用に複数のパーティションを指定できます。カンマで区切ります。

**3. `<column_separator>`**

> カラム区切り文字を指定します。

**4. `<line_delimiter>`**

> 行区切り文字を指定します。

**5. `IGNORE <number> { LINES | ROWS }`**

> ユーザーはCSVファイルのヘッダーまたは任意の行数をスキップできます。この構文は`IGNORE num ROWS`で置き換えることもできます。

**6. `<col_name_or_user_var>`**

> カラムマッピング構文。具体的なパラメータについては、インポート時のデータ変換のカラムマッピングセクションを参照してください。

**7. `properties ("<key>"="<value>",...)`**

| パラメータ | パラメータ説明 |
| ---------------------- | ------------------------------------------------------------ |
| max_filter_ratio | フィルタリング可能なデータ（データの不規則性などの理由による）の最大許容比率。デフォルトは許容度ゼロです。 |
| timeout | インポートタイムアウト期間を秒で指定します。デフォルトは600秒で、有効範囲は1秒から259,200秒です。 |
| strict_mode | ユーザーはこのインポートに対してstrictモードを有効にするかどうかを指定できます。デフォルトは無効です。 |
| timezone | このインポートのタイムゾーンを指定します。デフォルトは東八時間帯です。このパラメータは、インポートに関わるすべてのタイムゾーン関連関数の結果に影響します。 |
| exec_mem_limit | インポートメモリ制限。デフォルトは2GBをバイト単位で指定します。 |
| trim_double_quotes | boolean型でデフォルト値は`false`です。`true`に設定すると、インポートファイルの各フィールドの最外側の二重引用符をトリムすることを意味します。 |
| enclose | 囲み文字。CSVデータフィールドに行区切り文字またはカラム区切り文字が含まれている場合、偶発的な切り詰めを防ぐために、単一バイト文字を囲み文字として保護用に指定できます。例えば、カラム区切り文字が","で囲み文字が"'"、データが"a,'b,c'"の場合、"b,c"は1つのフィールドとして解析されます。注意：`enclose`が`""`に設定されている場合、`trim_double_quotes`を`true`に設定する必要があります。 |
| escape | エスケープ文字。CSVフィールド内で囲み文字と同じ文字をエスケープするために使用されます。例えば、データが"a,'b,'c'"で囲み文字が"'"、"b,'c"を1つのフィールドとして解析したい場合、""などの単一バイトエスケープ文字を指定し、データを"a,'b,'c'"に変更する必要があります。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 注記 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Table | 指定されたデータベースTableのインポート権限。 |

## 使用上の注意

- MySQL Load文は`LOAD DATA`構文で始まり、LABELの指定は不要です。

## 例

1. クライアントのローカルファイル`testData`からデータベース`testDb`のTable`testTbl`にデータをインポートします。タイムアウトを100秒に指定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```
2. サーバーのローカルファイル `/root/testData` からデータをインポートします（FE設定 `mysql_load_server_secure_path` を `/root` に設定する必要があります）。データベース `testDb` 内のTable `testTbl` にインポートし、タイムアウトを100秒に指定します。

    ```sql
    LOAD DATA
    INFILE '/root/testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```
3. クライアントのローカルファイル`testData`から、データベース`testDb`内のTable`testTbl`にデータをインポートします。エラー率20%まで許容します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
4. クライアントのローカルファイル`testData`からデータベース`testDb`内のTable`testTbl`にデータをインポートし、エラー率20%を許可し、ファイルの列名を指定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    (k2, k1, v1)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
5. ローカルファイル`testData`からデータをインポートし、データベース`testDb`内のTable`testTbl`のパーティション`p1`と`p2`に格納します。エラー率は20%まで許可されます。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
6. ローカルのCSVファイル`testData`から、行区切り文字`0102`、列区切り文字`0304`を使用して、データベース`testDb`内のTable`testTbl`にデータをインポートします。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    COLUMNS TERMINATED BY '0304'
    LINES TERMINATED BY '0102'
    ```
7. ローカルファイル`testData`からデータをインポートし、データベース`testDb`のTable`testTbl`のパーティション`p1`および`p2`に格納します。最初の3行はスキップします。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    IGNORE 3 LINES
    ```
8. strict modeフィルタリングでデータをインポートし、タイムゾーンを`Africa/Abidjan`に設定します。

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
