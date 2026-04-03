---
{
  "title": "MYSQL LOAD",
  "language": "ja",
  "description": "MySQL clientを使用してローカルデータファイルをDorisにインポートします。MySQL Loadは同期インポート方式です。"
}
---
## 説明

MySQLクライアントを使用してローカルデータファイルをDorisにインポートします。MySQL Loadは同期インポート方式で、実行後すぐにインポート結果を返します。`LOAD DATA`文の戻り値に基づいてインポートが成功したかどうかを判断できます。MySQL Loadはバッチインポートタスクの原子性を保証し、すべてのインポートが成功するか、すべて失敗するかのどちらかになります。

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

> ローカルファイルのパスを指定します。相対パスまたは絶対パスのいずれでも可能です。現在は単一ファイルのみサポートされており、複数ファイルはサポートされていません。

**2. `<tbl_name>`**

> テーブル名にはデータベース名を含めることができます（例を参照）。データベース名が省略された場合、現在のユーザーのデータベースが使用されます。

## オプションパラメータ

**1. `LOCAL`**

> `LOCAL`を指定すると、クライアントからファイルを読み込むことを示します。省略した場合はFEサーバーのローカルストレージからファイルを読み込みます。FEサーバーからファイルをインポートする機能はデフォルトで無効になっています。この機能を有効にするには、FEノードで`mysql_load_server_secure_path`を設定してセキュアパスを指定する必要があります。

**2. `<partition_name>`**

> インポート対象として複数のパーティションを指定できます。カンマで区切って指定します。

**3. `<column_separator>`**

> カラム区切り文字を指定します。

**4. `<line_delimiter>`**

> 行区切り文字を指定します。

**5. `IGNORE <number> { LINES | ROWS }`**

> ユーザーはCSVファイルのヘッダーまたは任意の行数をスキップできます。この構文は`IGNORE num ROWS`で置き換えることも可能です。

**6. `<col_name_or_user_var>`**

> カラムマッピング構文です。具体的なパラメータについては、[インポート時のデータ変換](../../../../data-operate/import/import-way/mysql-load-manual.md)のカラムマッピングセクションを参照してください。

**7. `properties ("<key>"="<value>",...)`**

| パラメータ | パラメータ説明 |
| ---------------------- | ------------------------------------------------------------ |
| max_filter_ratio | データ異常などの理由によりフィルタリング可能なデータの最大許容比率。デフォルトは許容しない（ゼロ）。 |
| timeout | インポートタイムアウト期間を秒単位で指定します。デフォルトは600秒で、有効範囲は1秒から259,200秒です。 |
| strict_mode | ユーザーは今回のインポートでストリクトモードを有効にするかどうかを指定できます。デフォルトは無効です。 |
| timezone | 今回のインポートのタイムゾーンを指定します。デフォルトは東八時間帯です。このパラメータはインポートに含まれるすべてのタイムゾーン関連関数の結果に影響します。 |
| exec_mem_limit | インポートメモリ制限。デフォルトは2GBでバイト単位です。 |
| trim_double_quotes | boolean型でデフォルト値は`false`です。`true`に設定すると、インポートファイルの各フィールドの最外側のダブルクォートをトリミングすることを意味します。 |
| enclose | 囲み文字。CSVデータフィールドに行区切り文字またはカラム区切り文字が含まれている場合、誤った切り捨てを防ぐために、保護用の囲み文字として単一バイト文字を指定できます。例えば、カラム区切り文字が","で囲み文字が"'"、データが"a,'b,c'"の場合、"b,c"が一つのフィールドとして解析されます。注意：`enclose`が`""`に設定されている場合、`trim_double_quotes`を`true`に設定する必要があります。 |
| escape | エスケープ文字。CSVフィールド内で囲み文字と同じ文字をエスケープするために使用されます。例えば、データが"a,'b,'c'"で囲み文字が"'"、"b,'c"を一つのフィールドとして解析したい場合、""などの単一バイトエスケープ文字を指定し、データを"a,'b,'c'"に変更する必要があります。 |

## アクセス制御要件

このSQLコマンドを実行するユーザーには、少なくとも以下の権限が必要です：

| 権限 | オブジェクト | 備考 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Table | 指定されたデータベーステーブルのインポート権限。 |

## 使用上の注意

- MySQL Load文は`LOAD DATA`構文で始まり、LABELの指定は不要です。

## 例

1. クライアントのローカルファイル`testData`から、データベース`testDb`のテーブル`testTbl`にデータをインポートします。タイムアウトを100秒に指定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```
2. サーバーのローカルファイル `/root/testData` からデータをインポートし（FE設定 `mysql_load_server_secure_path` を `/root` に設定する必要があります）、データベース `testDb` のテーブル `testTbl` に格納します。タイムアウトを100秒に指定します。

    ```sql
    LOAD DATA
    INFILE '/root/testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```
3. クライアントのローカルファイル`testData`から、データベース`testDb`内のテーブル`testTbl`にデータをインポートし、エラー率20%を許可する。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
4. クライアントのローカルファイル `testData` からデータベース `testDb` 内のテーブル `testTbl` にデータをインポートし、エラー率20%を許可し、ファイルの列名を指定します。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    (k2, k1, v1)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
5. ローカルファイル`testData`からデータをインポートし、データベース`testDb`内のテーブル`testTbl`のパーティション`p1`と`p2`に格納します。エラー率20%まで許可されます。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```
6. ローカルCSVファイル`testData`から、行区切り文字`0102`と列区切り文字`0304`を使用してデータベース`testDb`のテーブル`testTbl`にデータをインポートします。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    COLUMNS TERMINATED BY '0304'
    LINES TERMINATED BY '0102'
    ```
7. ローカルファイル`testData`からデータベース`testDb`のテーブル`testTbl`のパーティション`p1`と`p2`にデータをインポートし、最初の3行をスキップします。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    IGNORE 3 LINES
    ```
8. 厳密モードフィルタリングでデータをインポートし、タイムゾーンを`Africa/Abidjan`に設定します。

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
