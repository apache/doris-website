---
{
  "title": "JDBC カタログ",
  "language": "ja",
  "description": "JDBC CatalogはJDBCプロトコルと互換性のあるデータベースに標準JDBCインターフェースを通じて接続することをサポートします。"
}
---
JDBC Catalogは、標準のJDBCインターフェースを通じてJDBCプロトコルと互換性のあるデータベースへの接続をサポートします。

本ドキュメントでは、JDBC Catalogの一般的な設定と使用方法を紹介します。異なるJDBCソースについては、それぞれのドキュメントを参照してください。

:::info Note
DorisのJDBC Catalog機能は、データの読み取りと処理にJavaレイヤーに依存しており、全体的なパフォーマンスはJDKバージョンの影響を受ける可能性があります。古いバージョンのJDK（JDK 8など）の一部の内部ライブラリは効率が低く、より高いリソース消費につながる可能性があります。より高いパフォーマンスが必要な場合は、デフォルトでJDK 17でコンパイルされ、より良い全体的なパフォーマンスを提供するDoris 3.0の使用を推奨します。
:::

## 適用シナリオ

JDBC Catalogは、データソースからDorisへの少量のデータのインポートや、JDBCデータソース内の小さなテーブルでの結合クエリなど、データ統合にのみ適しています。JDBC Catalogは、データソースでのクエリを高速化したり、一度に大量のデータにアクセスしたりすることはできません。

## サポートされているデータベース

Doris JDBC Catalogは以下のデータベースへの接続をサポートします：

| サポートされているデータソース |
| ---------------------------------- |
| [ MySQL](./jdbc-mysql-catalog.md)      |
| [ PostgreSQL](./jdbc-mysql-catalog.md) |
| [ Oracle](./jdbc-mysql-catalog.md)     |
| [ SQL Server](./jdbc-mysql-catalog.md) |
| [ IBM DB2](./jdbc-mysql-catalog.md)    |
| [ ClickHouse](./jdbc-clickhouse-catalog.md) |
| [ SAP HANA](./jdbc-saphana-catalog.md)   |
| [ Oceanbase](./jdbc-oceanbase-catalog.md) |

[Developer Guide](https://doris.apache.org/community/how-to-contribute/jdbc-catalog-developer-guide)を参照して、新しい、サポートされていないJDBCデータソースのサポートを開発できます。

## Catalogの設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' =='jdbc', -- required
    {JdbcProperties},
    {CommonProperties}
);
```
* `{JdbcProperties}`

  * 必須プロパティ

      | パラメータ名     | 説明                              | 例                       |
      | ---------------- | ---------------------------------------- | ----------------------------- |
      | `user`           | データソースのユーザー名                     |                               |
      | `password`       | データソースのパスワード                     |                               |
      | `jdbc_url`       | データソース接続URL               | `jdbc:mysql://host:3306`      |
      | `driver_url`     | JDBCドライバーファイルのパス。ドライバーパッケージのセキュリティについては付録を参照してください。 | 3つの方法をサポートしています。以下を参照してください。 |
      | `driver_class`   | JDBCドライバーのクラス名            |                               |

      `driver_url`は以下の3つの指定方法をサポートしています：
    
      1. ファイル名。例：`mysql-connector-j-8.3.0.jar`。JarファイルはFEおよびBEデプロイメントディレクトリ下の`jdbc_drivers/`ディレクトリに事前に配置する必要があります。システムは自動的にこのディレクトリで検索します。場所は`fe.conf`および`be.conf`の`jdbc_drivers_dir`設定で変更することも可能です。
      
      2. ローカル絶対パス。例：`file:///path/to/mysql-connector-j-8.3.0.jar`。Jarファイルはすべての FE/BE ノードの指定されたパスに事前に配置する必要があります。
      
      3. HTTP URL。例：`http://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`。システムはこのHTTPアドレスからドライバーファイルをダウンロードします。認証なしのHTTPサービスのみサポートしています。

  * オプションプロパティ

      | パラメータ名                | デフォルト値 | 説明                                                                                                                                   |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | 外部データソースからのデータベース、テーブル、カラム名を小文字で同期するかどうか                                        |
      | `meta_names_mapping`          |               | 外部データソースで`MY_TABLE`や`my_table`のように大文字小文字のみが異なる名前がある場合、DorisはCatalogクエリ時に曖昧性によりエラーを報告します。競合を解決するには`meta_names_mapping`パラメータを設定する必要があります。 |
      | `only_specified_database`     | false         | `jdbc_url`で指定されたデータベースのみを同期するかどうか（このDatabaseはDorisのDatabaseレベルにマップされます）                       |
      | `connection_pool_min_size`    | 1             | 接続プールの最小接続数を定義します。プールの初期化に使用され、キープアライブが有効な場合に少なくともこの数のアクティブな接続を確保します。 |
      | `connection_pool_max_size`    | 30            | 接続プールの最大接続数を定義します。各Catalogに対応する各FEまたはBEノードは最大でこの数の接続を保持できます。 |
      | `connection_pool_max_wait_time`| 5000         | プールで接続が利用できない場合にクライアントが接続を待機する最大待機時間をミリ秒で定義します。                         |
      | `connection_pool_max_life_time`| 1800000      | プール内の接続の最大アクティブ期間（ミリ秒）を設定します。この時間を超えた接続はリサイクルされます。また、この値の半分がプールの最小退去アイドル時間として使用され、この時間に達した接続は退去対象となります。 |
      | `connection_pool_keep_alive`  | false         | BEノードでのみ有効で、最小退去アイドル時間に達したが最大ライフタイムに達していない接続をアクティブに保つかどうかを決定します。不要なリソース使用量を削減するため、デフォルトで無効になっています。 |
        
* `[CommonProperties]`

  CommonPropertiesセクションは共通プロパティの設定に使用されます。**共通プロパティ**については[Catalog概要](../catalog-overview.md)セクションを参照してください。

## クエリ操作

### 基本クエリ

```sql
-- 1. switch to catalog, use database and query
SWITCH mysql_ctl;
USE mysql_db;
SELECT * FROM mysql_tbl LIMIT 10;

-- 2. use mysql database directly
USE mysql_ctl.mysql_db;
SELECT * FROM mysql_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM mysql_ctl.mysql_db.mysql_tbl LIMIT 10;
```
### クエリ最適化

#### 述語プッシュダウン

JDBC Catalogがデータソースにアクセスする際、基本的にBEノードを選択し、JDBC Clientを使用して生成されたSQLクエリをソースに送信し、データを取得します。そのため、パフォーマンスは生成されたSQLがソース側でどれだけ効率的に実行されるかにのみ依存します。Dorisは述語条件をプッシュダウンし、生成されたSQLに組み込もうとします。`EXPLAIN SQL`文を使用して生成されたSQLを確認できます。

```sql
EXPLAIN SELECT smallint_u, sum(int_u)
FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;

...
|   0:VJdbcScanNode(206)                                                                             |
|      TABLE: `doris_test`.`all_types`                                                               |
|      QUERY: SELECT `smallint_u`, `int_u` FROM `doris_test`.`all_types` WHERE ((`smallint_u` > 10)) |
|      PREDICATES: (smallint_u[#1] > 10)                                                             |
|      final projections: smallint_u[#1], int_u[#3]                                                  |
|      final project output tuple id: 1   
...                                                           |
```
#### Function Pushdown

述語条件について、Dorisと外部データソースでは、セマンティクスや動作が一致しない場合があります。そのため、DorisはJDBC外部テーブルクエリにおける述語プッシュダウンを以下のパラメータ変数を通じて制限・制御します：

> 注意：現在、Dorisは MySQL、Clickhouse、Oracle データソースの述語プッシュダウンのみをサポートしています。今後、より多くのデータソースがサポートされる予定です。

- `enable_jdbc_oracle_null_predicate_push_down`

    セッション変数。デフォルトは `false` です。つまり、述語条件に `NULL` 値が含まれている場合、述語はOracleデータソースにプッシュダウンされません。これは、Oracleバージョン21より前では、Oracleが `NULL` を演算子としてサポートしていないためです。

    このパラメータは 2.1.7 および 3.0.3 からサポートされています。

- `enable_jdbc_cast_predicate_push_down`

    セッション変数。デフォルトは `false` です。つまり、述語条件に明示的または暗黙的な CAST がある場合、述語はJDBCデータソースにプッシュダウンされません。CAST の動作はデータベース間で一致しないため、正確性を保証するため、デフォルトではCAST はプッシュダウンされません。ただし、ユーザーは CAST の動作が一致するかどうかを手動で確認できます。一致する場合、このパラメータを `true` に設定することで、より多くの述語をプッシュダウンしてパフォーマンスを向上させることができます。

    このパラメータは 2.1.7 および 3.0.3 からサポートされています。

- Function プッシュダウンのブラックリストとホワイトリスト

    同じシグネチャを持つ関数でも、Dorisと外部データソースでセマンティクスが一致しない場合があります。Dorisでは、関数プッシュダウン用の事前定義されたブラックリストとホワイトリストがあります：

    | データソース   | ブラックリスト | ホワイトリスト | 説明     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQLでは、FE設定項目 `jdbc_mysql_unsupported_pushdown_functions` を通じて追加のブラックリスト項目も設定できます。例：`jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- Function書き換えルール

    Dorisと外部データソースには、一致した動作を持つが名前が異なる関数があります。Dorisは関数プッシュダウン時にこれらの関数を書き換えることをサポートしています。現在、以下の書き換えルールが組み込まれています：

    | データソース   | Doris Function | ターゲット Function |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- カスタム関数プッシュダウンと書き換えルール

    3.0.7 以降のバージョンでは、Dorisはより柔軟な関数プッシュダウンと書き換えルールをサポートしています。ユーザーは Catalog プロパティで特定の Catalog に対して関数プッシュダウンと書き換えルールを設定できます：

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```
`function_rules`により、以下のルールを指定できます：

    - `pushdown`

        関数のプッシュダウンルールを指定します。`supported`と`unsupported`の配列は、それぞれプッシュダウン可能な関数名とプッシュダウン不可能な関数名を指定します。関数が両方の配列に存在する場合、`supported`が優先されます。

        Dorisは最初にシステムの事前定義されたブラックリストとホワイトリストを適用し、その後ユーザー指定のブラックリストとホワイトリストを適用します。

    - `rewrite`

        関数のリライトルールを定義します。上記の例のように、関数名`to_date`は`date2`としてリライトされ、プッシュダウンされます。

        注意：プッシュダウンが許可されている関数のみがリライトされます。

#### 行数制限

クエリに`LIMIT`キーワードが含まれている場合、Dorisはデータ転送量を削減するために`LIMIT`句をデータソースにプッシュダウンします。生成されたSQLに`LIMIT`句が含まれているかを確認するには、`EXPLAIN`文を使用できます。

## 書き込み操作

DorisはJDBCプロトコル経由で対応するデータソースへのデータ書き戻しをサポートしています。

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```
## Statement Passthrough

### 適用シナリオ

Dorisは、statement passthroughを通じてJDBCデータソースで対応するDDL、DML、およびクエリステートメントを直接実行することをサポートしています。この機能は以下のシナリオに適用されます：

* 複雑なクエリのパフォーマンス向上

  デフォルトでは、Dorisクエリオプティマイザは元のSQLを解析し、特定のルールに基づいてデータソースに送信するSQLを生成します。この生成されたSQLは通常、単純な単一テーブルクエリであり、集約やjoinクエリなどの演算子を含むことはできません。例えば、以下のクエリを考えてみます：

  ```sql
  SELECT smallint_u, sum(int_u)
  FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;
  ```
最終的に生成されるSQLは次のようになります：

  ```sql
  SELECT smallint_u, int_u 
  FROM all_types
  WHERE smallint_u > 10;
  ```
この場合、集約操作はDoris内で実行されます。そのため、一部のシナリオでは、大量のデータをネットワーク経由でソースから読み取る必要があり、クエリ効率が低下する可能性があります。statement passthroughを使用すると、元のSQLを直接データソースに渡すことができ、データソース自体の計算能力を活用してSQLを実行し、クエリパフォーマンスを向上させることができます。

* 統合管理

  クエリSQL以外にも、statement passthrough機能はDDLおよびDMLステートメントも渡すことができます。これにより、ユーザーはDorisを通じてソースデータに対して直接データベースやテーブル操作を実行できます。例えば、テーブルの作成、削除、またはテーブル構造の変更などが可能です。

### Passthrough SQL

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog', 
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```
`QUERY`テーブル関数は2つのパラメータを受け取ります：

* `catalog`: カタログの名前。カタログの名前と一致する必要があります。
* `query`: 実行するクエリ文。対応するデータソースの構文を直接使用して記述します。

### Passthrough DDLとDML

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```
`EXECUTE_STMT()` 関数は2つのパラメータを取ります：

* 第1パラメータ：カタログ名。現在、JDBC型のカタログのみがサポートされています。
* 第2パラメータ：実行するSQL文。現在、DDLおよびDML文のみがサポートされており、対応するデータソースの構文で記述する必要があります。

### 使用制限

`CALL EXECUTE_STMT()` コマンドを使用する際、Dorisはユーザーが記述したSQL文を、カタログに関連するJDBCデータソースに直接送信して実行します。その結果、この操作には以下の制限があります：

* SQL文は対応するデータソースの構文に従う必要があります。Dorisは構文や意味的チェックを実行しません。

* SQL文で参照されるテーブル名は、`db.tbl` のように完全修飾名を使用することが推奨されます。データベースが指定されていない場合、JDBCカタログのJDBC URLのデータベース名が使用されます。

* SQL文はJDBCデータソース外のデータベースやテーブルを参照することはできず、Dorisのデータベースやテーブルも参照できません。ただし、Doris JDBCカタログと同期されていないJDBCデータソース内のテーブルは参照できます。

* DML文を実行する際、挿入、更新、または削除された行数は取得できません。コマンドの成功または失敗のみを判定できます。

* カタログに対して `LOAD` 権限を持つユーザーのみが `CALL EXECUTE_STMT()` コマンドを実行できます。

* カタログに対して `SELECT` 権限を持つユーザーのみが `query()` テーブル関数を実行できます。

* カタログ作成時に指定されたJDBCユーザーは、対応する文を実行するためにソースで必要な権限を持っている必要があります。

* `query()` テーブル関数によって読み取られる結果のデータ型は、クエリされるカタログ型でサポートされるデータ型と一致します。

## 付録

### 大文字小文字区別設定

デフォルトでは、Dorisのデータベースおよびテーブル名は大文字小文字を区別し、列名は大文字小文字を区別しません。この動作は設定パラメータによって変更できます。また、一部のJDBCデータソースでのデータベース、テーブル、列名の大文字小文字区別ルールは、Dorisのものと異なる場合があります。この不一致により、JDBC Catalogを介した名前マッピング中に命名競合が発生する可能性があります。以下のセクションでは、このような問題を解決する方法について説明します。

#### 表示名とクエリ名

Dorisでは、オブジェクト名（ここではテーブル名を例として使用します）は**表示名**と**クエリ名**に分けることができます。例えば、テーブル名について、**表示名**は `SHOW TABLES` の結果に表示される名前を指し、**クエリ名**は `SELECT` 文で使用できる名前を指します。

例えば、テーブルの実際の名前が `MyTable` の場合、このテーブルの**表示名**と**クエリ名**は、Frontend（FE）パラメータ `lower_case_table_names` の設定によって異なる場合があります：

| 設定 | 説明 | 実際の名前 | 表示名 | クエリ名 |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | デフォルト設定。元の名前が保存・表示され、クエリは大文字小文字を区別します。 | `MyTable` | `MyTable` | クエリで大文字小文字を区別し、次を使用する必要があります：`MyTable` |
| `lower_case_table_names=1` | 名前は小文字で保存・表示され、クエリは大文字小文字を区別しません。 | `MyTable` | `mytable` | クエリで大文字小文字を区別せず、例えば `MyTable` または `mytable` を使用できます。 |
| `lower_case_table_names=2` | 元の名前が保存・表示されますが、クエリは大文字小文字を区別しません。 | `MyTable` | `MyTable` | クエリで大文字小文字を区別せず、例えば `MyTable` または `mytable` を使用できます。 |

#### JDBC Catalog名大文字小文字区別ルール

Doris自体では、**テーブル名**の大文字小文字区別ルールの設定のみが可能です。しかし、JDBC Catalogには**データベース名**と**列名**の追加処理が必要です。そのため、追加のCatalogプロパティ `lower_case_meta_names` を `lower_case_table_names` と組み合わせて使用します。

| 設定 | 説明 |
| --- | --- |
| `lower_case_meta_names` | Catalog作成時に `properties` で指定され、そのCatalogのみに適用されます。デフォルト値は `false` です。`true` に設定すると、Dorisはすべてのデータベース、テーブル、列名を小文字に変換して保存・表示します。クエリではDorisで小文字の名前を使用する必要があります。 |
| `lower_case_table_names` | Frontend（FE）設定項目で、`fe.conf` で設定され、クラスタ全体に適用されます。デフォルト値は `0` です。 |

> 注意：`lower_case_meta_names = true` の場合、`lower_case_table_names` 設定は無視され、すべてのデータベース、テーブル、列名が小文字に変換されます。

`lower_case_meta_names`（true/false）と `lower_case_table_names`（0/1/2）の組み合わせに基づいて、**保存**と**クエリ**時のデータベース、テーブル、列名の動作は以下の表に示されます（「原形」は外部データソースからの大文字小文字を保持することを意味し、「小文字」は自動的に小文字に変換することを意味し、「任意の大文字小文字」はクエリで任意の大文字小文字を使用できることを意味します）：

| `lower_case_table_names` & `lower_case_meta_names` | データベース表示名 | テーブル表示名 | 列表示名 | データベースクエリ名 | テーブルクエリ名 | 列クエリ名 |
| -------------------------------------------------- | --------------------- | ------------------ | ------------------- | ------------------- | ---------------- | ----------------- |
| `0 & false`                                       | 原形              | 原形           | 原形            | 原形            | 原形         | 任意の大文字小文字          |
| `0 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 小文字        | 任意の大文字小文字          |
| `1 & false`                                       | 原形              | 小文字          | 原形            | 原形            | 任意の大文字小文字         | 任意の大文字小文字          |
| `1 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の大文字小文字         | 任意の大文字小文字          |
| `2 & false`                                       | 原形              | 原形           | 原形            | 原形            | 任意の大文字小文字         | 任意の大文字小文字          |
| `2 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の大文字小文字         | 任意の大文字小文字          |

#### 大文字小文字競合チェック

JDBC Catalogを通じて名前マッピングを実行する際、命名競合が発生する可能性があります。例えば、ソースの列名が大文字小文字を区別し、`ID` と `id` の2つの列がある場合です。`lower_case_meta_names = true` を設定すると、これらの2つの列は小文字に変換された後に競合します。Dorisは以下のルールに従って競合チェックを実行します：

* 任意のシナリオで、Dorisは**列名**の大文字小文字競合をチェックします（例：`id` と `ID` が同時に存在するかどうか）。

* `lower_case_meta_names = true` の場合、Dorisはデータベース名、テーブル名、列名の大文字小文字競合をチェックします（例：`DORIS` と `doris` が同時に存在するかどうか）。

* `lower_case_meta_names = false` かつ `lower_case_table_names` が `1` または `2` に設定されている場合、Dorisは**テーブル名**の競合をチェックします（例：`orders` と `ORDERS` が同時に存在するかどうか）。

* `lower_case_table_names = 0` の場合、データベースおよびテーブル名は大文字小文字を区別し、追加の変換は必要ありません。

#### 大文字小文字競合の解決策

競合が発生した場合、Dorisはエラーをスローし、以下のアプローチを使用して競合を解決する必要があります。

大文字小文字の違いのみのデータベース、テーブル、または列（例：`DORIS` と `doris`）によってDorisが適切に区別できない場合、Catalogの `meta_names_mapping` を設定して手動マッピングを指定することで競合を解決できます。

**例**

```json
{
  "databases": [
    {
      "remoteDatabase": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "doris",
      "mapping": "doris_2"
    }
  ],
  "tables": [
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "doris",
      "mapping": "doris_2"
    }
  ],
  "columns": [
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "remoteColumn": "DORIS",
      "mapping": "doris_1"
    },
    {
      "remoteDatabase": "DORIS",
      "remoteTable": "DORIS",
      "remoteColumn": "doris",
      "mapping": "doris_2"
    }
  ]
}
```
### ドライバーパッケージのセキュリティ

ドライバーパッケージはユーザーによってDorisクラスターにアップロードされるため、一定のセキュリティリスクがあります。ユーザーは以下の措置を通じてセキュリティを向上させることができます：

1. Dorisは`jdbc_drivers_dir`ディレクトリ内のすべてのドライバーパッケージを安全とみなし、それらに対してパスチェックを実行しません。管理者はこのディレクトリ内のファイルを自分で管理し、そのセキュリティを確保する必要があります。

2. ドライバーパッケージがローカルパスまたはHTTPパスを使用して指定されている場合、Dorisは以下のチェックを実行します：

   * 許可されるドライバーパッケージパスは、FE設定項目`jdbc_driver_secure_path`によって制御されます。この設定は複数のパスを含むことができ、セミコロンで区切られます。この設定が設定されると、Dorisは`driver_url`パスプレフィックスが`jdbc_driver_secure_path`に含まれているかどうかをチェックします。含まれていない場合、作成は拒否されます。

     例：

     `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"`が設定されている場合、`file:///path/to/jdbc_drivers`または`http://path/to/jdbc_drivers`で始まるドライバーパッケージパスのみが許可されます。

   * このパラメーターのデフォルトは`*`です。空または`*`に設定されている場合、すべてのJarパッケージパスが許可されます。

3. データディレクトリを作成する際、`checksum`パラメーターを使用してドライバーパッケージのチェックサムを指定できます。ドライバーパッケージを読み込んだ後、Dorisはチェックサムを検証し、検証が失敗した場合、作成は拒否されます。

### コネクションプールのクリーンアップ

Dorisでは、各FEおよびBEノードが個別のデータソース接続の頻繁な開閉を避けるためにコネクションプールを維持します。プール内の各接続は、データソースとの接続を確立し、クエリを実行するために使用できます。タスクが完了した後、これらの接続は再利用のためにプールに返されます。これにより、パフォーマンスが向上するだけでなく、接続確立のシステムオーバーヘッドが削減され、データソースの接続制限に達することを防ぐのに役立ちます。

コネクションプールのサイズは、異なるワークロードにより適応するために実際のニーズに応じて調整できます。通常、プール内の最小接続数は、キープアライブメカニズムが有効になっている際に少なくとも1つの接続がアクティブのままになることを保証するために1に設定する必要があります。最大接続数は、過度なリソース消費を避けるために合理的な値に設定する必要があります。

BE上で未使用のコネクションプールキャッシュの蓄積を防ぐために、BE上で`jdbc_connection_pool_cache_clear_time_sec`パラメーターを設定してキャッシュクリーンアップ間隔を指定できます。デフォルト値は28,800秒（8時間）で、この時間が経過すると、BEはこの時間内に使用されていないすべてのコネクションプールキャッシュを強制的にクリアします。

### 認証情報の更新

JDBC Catalogを使用して外部データソースに接続する際、データベースの認証情報を慎重に更新することが重要です。

Dorisは、クエリに迅速に応答するためにコネクションプールを通じてアクティブな接続を維持します。しかし、認証情報を変更した後、コネクションプールは古い認証情報を使用して新しい接続を試行し続け、失敗する可能性があります。システムは一定数のアクティブ接続を維持しようとするため、これらの誤った試行が繰り返され、一部のデータベースシステムでは、頻繁な失敗がアカウントロックアウトにつながる可能性があります。

認証情報を変更する必要がある場合は、DorisのJDBC Catalog設定を同期して更新し、すべてのノードが最新の認証情報を使用することを保証し、接続の失敗と潜在的なアカウントロックアウトを防ぐためにDorisクラスターを再起動することが推奨されます。

起こりうるアカウントロックアウトには以下が含まれます：

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
```
### Connection Pool トラブルシューティング

1. HikariPool Connection Timeout Error: `Connection is not available, request timed out after 5000ms`

   * 考えられる原因

     * 原因 1: ネットワークの問題（例：サーバーに到達できない）

     * 原因 2: 無効なユーザー名やパスワードなどの認証の問題

     * 原因 3: 高いネットワークレイテンシによりコネクション作成が5秒のタイムアウトを超過

     * 原因 4: 同時クエリ数が多すぎてプールで設定された最大コネクション数を超過

   * 解決方法

     * エラー `Connection is not available, request timed out after 5000ms` のみが発生する場合は、原因 3 と 4 を確認してください：

       * 高いネットワークレイテンシまたはリソース不足を確認する。

       * プールの最大コネクション数を増加させる：

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```
* 接続タイムアウトを増加する:

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```
* `Connection is not available, request timed out after 5000ms` 以外に追加のエラーメッセージがある場合は、これらの追加エラーを確認してください：

       * ネットワークの問題（例：サーバーに到達できない）により接続の失敗が発生する可能性があります。ネットワーク接続が安定していることを確認してください。

       * 認証の問題（例：無効なユーザー名またはパスワード）も接続の失敗を引き起こす可能性があります。設定内のデータベース認証情報を確認し、ユーザー名とパスワードが正しいことを確認してください。

       * 根本原因を特定するために、特定のエラーメッセージに基づいてネットワーク、データベース、または認証に関連する問題を調査してください。
