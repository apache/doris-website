---
{
  "title": "JDBCカタログ",
  "language": "ja",
  "description": "JDBCカタログは、標準JDBCインターフェースを通じてJDBCプロトコルと互換性のあるデータベースへの接続をサポートします。"
}
---
JDBC カタログは、標準のJDBCインターフェースを通じてJDBCプロトコルと互換性のあるデータベースへの接続をサポートします。

本ドキュメントでは、JDBC カタログの一般的な設定と使用方法について説明します。異なるJDBCソースについては、それぞれのドキュメントを参照してください。

:::info Note
DorisのJDBC カタログ機能はJavaレイヤーによるデータの読み取りと処理に依存しており、全体的なパフォーマンスはJDKバージョンの影響を受ける可能性があります。古いバージョンのJDK（JDK 8など）の一部の内部ライブラリは効率が劣り、リソース消費量の増加につながる可能性があります。より高いパフォーマンスが必要な場合は、デフォルトでJDK 17でコンパイルされ、より優れた全体的なパフォーマンスを提供するDoris 3.0の使用を推奨します。
:::

## 適用シナリオ

JDBC カタログは、データソースからDorisへの少量のデータのインポートや、JDBCデータソース内の小さなテーブルに対するjoinクエリなど、データ統合にのみ適しています。JDBC カタログは、データソースでのクエリを高速化したり、大量のデータに一度にアクセスしたりすることはできません。

## サポート対象データベース

Doris JDBC カタログは以下のデータベースへの接続をサポートします：

| サポート対象データソース |
| ---------------------------------- |
| [ MySQL](./jdbc-mysql-catalog.md)      |
| [ PostgreSQL](./jdbc-mysql-catalog.md) |
| [ Oracle](./jdbc-mysql-catalog.md)     |
| [ SQL サーバー](./jdbc-mysql-catalog.md) |
| [ IBM DB2](./jdbc-mysql-catalog.md)    |
| [ ClickHouse](./jdbc-clickhouse-catalog.md) |
| [ SAP HANA](./jdbc-saphana-catalog.md)   |
| [ Oceanbase](./jdbc-oceanbase-catalog.md) |

[Developer Guide](https://doris.apache.org/community/how-to-contribute/jdbc-catalog-developer-guide)を参照して、新しい未サポートのJDBCデータソースのサポートを開発できます。

## カタログの設定

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

      | パラメータ名   | 説明                              | 例                       |
      | ---------------- | ---------------------------------------- | ----------------------------- |
      | `user`           | データソースのユーザー名                     |                               |
      | `password`       | データソースのパスワード                     |                               |
      | `jdbc_url`       | データソース接続URL               | `jdbc:mysql://host:3306`      |
      | `driver_url`     | JDBCドライバファイルのパス。ドライバパッケージのセキュリティについては付録を参照してください。 | 3つの方法をサポート、以下を参照。 |
      | `driver_class`   | JDBCドライバのクラス名            |                               |

      `driver_url`は以下の3つの仕様をサポートします：
    
      1. ファイル名。例：`mysql-connector-j-8.3.0.jar`。JarファイルはFEおよびBEデプロイメントディレクトリ下の`jdbc_drivers/`ディレクトリに事前配置する必要があります。システムは自動的にこのディレクトリで検索します。場所は`fe.conf`および`be.conf`の`jdbc_drivers_dir`設定で変更することも可能です。
      
      2. ローカル絶対パス。例：`file:///path/to/mysql-connector-j-8.3.0.jar`。JarファイルはすべてのFE/BEノードの指定されたパスに事前配置する必要があります。
      
      3. HTTP URL。例：`http://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`。システムはこのHTTPアドレスからドライバファイルをダウンロードします。認証なしのHTTPサービスのみをサポートします。

  * オプションプロパティ

      | パラメータ名                | デフォルト値 | 説明                                                                                                                                   |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | 外部データソースからのデータベース、テーブル、カラム名を小文字で同期するかどうか                                        |
      | `meta_names_mapping`          |               | 外部データソースに`MY_TABLE`と`my_table`のように大文字小文字のみが異なる名前がある場合、DorisはCatalogをクエリする際に曖昧性によりエラーを報告します。競合を解決するために`meta_names_mapping`パラメータを設定する必要があります。 |
      | `only_specified_database`     | false         | `jdbc_url`で指定されたデータベースのみを同期するかどうか（このDatabaseはDorisのDatabaseレベルにマップされます）                       |
      | `connection_pool_min_size`    | 1             | 接続プールの最小接続数を定義し、プールの初期化とキープアライブが有効な場合に少なくともこの数のアクティブな接続を確保するために使用されます。 |
      | `connection_pool_max_size`    | 30            | 接続プールの最大接続数を定義します。各Catalogに対応する各FEまたはBEノードは最大この数の接続を保持できます。 |
      | `connection_pool_max_wait_time`| 5000         | プールで使用可能な接続がない場合にクライアントが接続を待機する最大待機時間をミリ秒で定義します。                         |
      | `connection_pool_max_life_time`| 1800000      | プール内の接続の最大アクティブ継続時間（ミリ秒）を設定します。この時間を超えた接続はリサイクルされます。さらに、この値の半分がプールの最小退去アイドル時間として使用され、この時間に達した接続が退去対象になります。 |
      | `connection_pool_keep_alive`  | false         | BEノードでのみ有効で、最小退去アイドル時間に達したが最大ライフタイムに達していない接続をアクティブに保つかどうかを決定します。不要なリソース使用量を削減するためにデフォルトで無効になっています。 |
        
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
### クエリの最適化

#### 述語のプッシュダウン

JDBC Catalogがデータソースにアクセスする際、基本的にBEノードを選択し、JDBC Clientを使用して生成されたSQLクエリをソースに送信し、データを取得します。そのため、パフォーマンスは生成されたSQLがソース側でどれだけ効率的に実行されるかにのみ依存します。Dorisは述語条件をプッシュダウンし、生成されるSQLに組み込もうとします。`EXPLAIN SQL`文を使用して、生成されたSQLを確認できます。

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

述語条件については、DorisとNULL data sourcesで意味動作が一致しない場合があります。そのため、DorisはJDBC外部テーブルクエリにおける述語pushdownを以下のパラメータ変数で制限・制御しています：

> 注記：現在、DorisはMySQL、Clickhouse、Oracleデータソースの述語pushdownのみをサポートしています。将来的により多くのデータソースがサポートされる予定です。

- `enable_jdbc_oracle_null_predicate_push_down`

    セッション変数。デフォルトは`false`です。つまり、述語条件に`NULL`値が含まれる場合、述語はOracleデータソースにpushdownされません。これは、Oracleバージョン21以前では、Oracleが`NULL`を演算子としてサポートしていないためです。

    このパラメータは2.1.7および3.0.3以降でサポートされています。

- `enable_jdbc_cast_predicate_push_down`

    セッション変数。デフォルトは`false`です。つまり、述語条件に明示的または暗黙的なCASTがある場合、述語はJDBCデータソースにpushdownされません。CASTの動作は異なるデータベース間で一致しないため、正確性を保証するために、デフォルトではCASTはpushdownされません。ただし、ユーザーはCASTの動作が一致するかどうかを手動で検証できます。一致する場合、このパラメータを`true`に設定して、より多くの述語をpushdownし、パフォーマンスを向上させることができます。

    このパラメータは2.1.7および3.0.3以降でサポートされています。

- Function pushdownブラックリストとホワイトリスト

    同じシグネチャを持つ関数でも、DorisとNULL data sourcesで意味が一致しない場合があります。Dorisは、function pushdownのためにいくつかのブラックリストとホワイトリストを事前定義しています：

    | Data Source   | Blacklist | Whitelist | Description     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQLは、FE設定項目`jdbc_mysql_unsupported_pushdown_functions`を通じて追加のブラックリスト項目も設定できます。例：`jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- Function書き換えルール

    DorisとNULL data sourcesには、動作は一致するが名前が異なる関数があります。Dorisは、function pushdown時にこれらの関数を書き換えることをサポートしています。現在、以下の書き換えルールが組み込まれています：

    | Data Source   | Doris Function | Target Function |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- カスタムfunction pushdownおよび書き換えルール

    3.0.7以降のバージョンでは、Dorisはより柔軟なfunction pushdownおよび書き換えルールをサポートしています。ユーザーは、Catalogプロパティで特定のCatalogのfunction pushdownおよび書き換えルールを設定できます：

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```
`function_rules`を通じて、以下のルールを指定できます：

    - `pushdown`

        関数プッシュダウンルールを指定します。`supported`と`unsupported`配列は、それぞれプッシュダウンできる関数名とできない関数名を指定します。関数が両方の配列に存在する場合、`supported`が優先されます。

        Dorisは最初にシステムの事前定義されたブラックリストとホワイトリストを適用し、次にユーザー指定のブラックリストとホワイトリストを適用します。

    - `rewrite`

        関数リライトルールを定義します。上記の例のように、関数名`to_date`は`date2`として書き換えられ、プッシュダウンされます。

        注意：プッシュダウンが許可されている関数のみがリライトされます。

#### 行数制限

クエリに`LIMIT`キーワードが含まれている場合、Dorisは`LIMIT`句をデータソースにプッシュダウンして、データ転送量を削減します。`EXPLAIN`文を使用して、生成されたSQLに`LIMIT`句が含まれているかどうかを確認できます。

## 書き込み操作

DorisはJDBCプロトコル経由で対応するデータソースへのデータ書き戻しをサポートしています。

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```
## Statement Passthrough

### 適用シナリオ

Dorisはstatement passthroughを通じて、JDBCデータソースで対応するDDL、DML、およびクエリステートメントを直接実行することをサポートします。この機能は以下のシナリオで適用されます：

* 複雑なクエリのパフォーマンス向上

  デフォルトでは、Dorisクエリオプティマイザーは元のSQLを解析し、特定のルールに基づいてデータソースに送信するSQLを生成します。この生成されたSQLは通常、シンプルな単一テーブルクエリであり、集計やjoinクエリなどの演算子を含むことはできません。例えば、以下のクエリを考えてみてください：

  ```sql
  SELECT smallint_u, sum(int_u)
  FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;
  ```
最終的に生成されるSQLは次のようになります:

  ```sql
  SELECT smallint_u, int_u 
  FROM all_types
  WHERE smallint_u > 10;
  ```
この場合、集約操作はDoris内で実行されます。そのため、一部のシナリオでは、ネットワーク経由でソースから大量のデータを読み取る必要があり、クエリ効率が低下する可能性があります。statement passthroughを使用することで、元のSQLを直接データソースに渡すことができ、データソース自身の計算能力を活用してSQLを実行し、クエリパフォーマンスを向上させることができます。

* 統合管理

  クエリSQLに加えて、statement passthrough機能はDDLおよびDMLステートメントも通すことができます。これにより、ユーザーはDorisを通じて直接ソースデータに対してデータベースやテーブル操作を実行できます。例えば、テーブルの作成、削除、またはテーブル構造の変更などです。

### Passthrough SQL

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog', 
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```
`QUERY`テーブル関数は2つのパラメータを取ります：

* `catalog`：カタログの名前。カタログの名前と一致する必要があります。
* `query`：実行するクエリステートメント。対応するデータソースの構文を直接使用して記述します。

### Passthrough DDLとDML

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```
`EXECUTE_STMT()` 関数は2つのパラメータを受け取ります：

* 最初のパラメータ：カタログ名。現在、JDBC タイプのカタログのみサポートされています。
* 2番目のパラメータ：実行するSQL文。現在、DDL文とDML文のみサポートされており、対応するデータソースの構文で記述する必要があります。

### 使用制限

`CALL EXECUTE_STMT()` コマンドを使用する際、Doris はユーザーが記述したSQL文を、カタログに関連付けられたJDBCデータソースに直接送信して実行します。その結果、この操作には以下の制限があります：

* SQL文は対応するデータソースの構文に従う必要があります。Doris は構文チェックやセマンティックチェックを行いません。

* SQL文で参照されるテーブル名は、`db.tbl` のような完全修飾名を使用することが推奨されます。データベースが指定されていない場合、JDBC カタログのJDBC URLのデータベース名が使用されます。

* SQL文はJDBCデータソース外のデータベースやテーブルを参照することはできず、Doris のデータベースやテーブルも参照できません。ただし、Doris JDBC カタログと同期されていないJDBCデータソース内のテーブルは参照できます。

* DML文を実行する際、挿入、更新、削除された行数を取得することはできません。コマンドの成功または失敗のみ判定できます。

* カタログに対する `LOAD` 権限を持つユーザーのみが `CALL EXECUTE_STMT()` コマンドを実行できます。

* カタログに対する `SELECT` 権限を持つユーザーのみが `query()` テーブル関数を実行できます。

* カタログ作成時に指定されたJDBCユーザーは、対応する文を実行するために、ソース上で必要な権限を持っている必要があります。

* `query()` テーブル関数によって読み取られる結果のデータ型は、クエリされるカタログタイプでサポートされるデータ型と一致します。

## 付録

### 大文字小文字区別設定

デフォルトでは、Doris のデータベース名とテーブル名は大文字小文字を区別し、カラム名は大文字小文字を区別しません。この動作は設定パラメータによって変更できます。さらに、一部のJDBCデータソースのデータベース、テーブル、カラム名の大文字小文字区別ルールは、Doris のものと異なる場合があります。この不一致により、JDBC Catalog を介した名前マッピング時に名前の競合が発生する可能性があります。以下のセクションでは、このような問題を解決する方法について説明します。

#### 表示名とクエリ名

Doris では、オブジェクト名（ここではテーブル名を例として使用）を**表示名**と**クエリ名**に分けることができます。例えば、テーブル名の場合、**表示名**は `SHOW TABLES` の結果に表示される名前を指し、**クエリ名**は `SELECT` 文で使用できる名前を指します。

例えば、テーブルの実際の名前が `MyTable` の場合、このテーブルの**表示名**と**クエリ名**は、Frontend (FE) パラメータ `lower_case_table_names` の設定によって異なる場合があります：

| 設定 | 説明 | 実際の名前 | 表示名 | クエリ名 |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | デフォルト設定。元の名前が保存・表示され、クエリは大文字小文字を区別します。 | `MyTable` | `MyTable` | クエリでは大文字小文字を区別し、次のように使用する必要があります：`MyTable` |
| `lower_case_table_names=1` | 名前は小文字で保存・表示され、クエリは大文字小文字を区別しません。 | `MyTable` | `mytable` | クエリでは大文字小文字を区別せず、例えば `MyTable` または `mytable` を使用できます。 |
| `lower_case_table_names=2` | 元の名前が保存・表示されますが、クエリは大文字小文字を区別しません。 | `MyTable` | `MyTable` | クエリでは大文字小文字を区別せず、例えば `MyTable` または `mytable` を使用できます。 |

#### JDBC Catalog 名の大文字小文字区別ルール

Doris 自体は**テーブル名**の大文字小文字区別ルールの設定のみを許可します。しかし、JDBC Catalog では**データベース名**と**カラム名**に対する追加の処理が必要です。そのため、追加の Catalog プロパティ `lower_case_meta_names` を使用して、`lower_case_table_names` と連携させます。

| 設定 | 説明 |
| --- | --- |
| `lower_case_meta_names` | Catalog 作成時に `properties` で指定され、そのカタログにのみ適用されます。デフォルト値は `false` です。`true` に設定すると、Doris はすべてのデータベース、テーブル、カラム名を小文字に変換して保存・表示します。クエリでは Doris で小文字名を使用する必要があります。 |
| `lower_case_table_names` | Frontend (FE) 設定項目で、`fe.conf` で設定され、クラスタ全体に適用されます。デフォルト値は `0` です。 |

> 注意：`lower_case_meta_names = true` の場合、`lower_case_table_names` 設定は無視され、すべてのデータベース、テーブル、カラム名が小文字に変換されます。

`lower_case_meta_names` (true/false) と `lower_case_table_names` (0/1/2) の組み合わせに基づいて、**保存**と**クエリ**時のデータベース、テーブル、カラム名の動作を次の表に示します（「元のまま」は外部データソースの大文字小文字をそのまま保持することを意味し、「小文字」は自動的に小文字に変換することを意味し、「任意の大文字小文字」はクエリで任意の大文字小文字を使用できることを意味します）：

| `lower_case_table_names` & `lower_case_meta_names` | データベース表示名 | テーブル表示名 | カラム表示名 | データベースクエリ名 | テーブルクエリ名 | カラムクエリ名 |
| -------------------------------------------------- | --------------------- | ------------------ | ------------------- | ------------------- | ---------------- | ----------------- |
| `0 & false`                                       | 元のまま              | 元のまま           | 元のまま            | 元のまま            | 元のまま         | 任意の大文字小文字          |
| `0 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 小文字        | 任意の大文字小文字          |
| `1 & false`                                       | 元のまま              | 小文字          | 元のまま            | 元のまま            | 任意の大文字小文字         | 任意の大文字小文字          |
| `1 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の大文字小文字         | 任意の大文字小文字          |
| `2 & false`                                       | 元のまま              | 元のまま           | 元のまま            | 元のまま            | 任意の大文字小文字         | 任意の大文字小文字          |
| `2 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の大文字小文字         | 任意の大文字小文字          |

#### 大文字小文字競合チェック

JDBC Catalog を通じて名前マッピングを実行する際、名前の競合が発生する場合があります。例えば、ソースのカラム名が大文字小文字を区別し、`ID` と `id` という2つのカラムが存在する場合です。`lower_case_meta_names = true` を設定すると、これら2つのカラムは小文字に変換された後に競合します。Doris は以下のルールに従って競合チェックを実行します：

* あらゆるシナリオで、Doris は**カラム名**の大文字小文字競合をチェックします（例：`id` と `ID` が同時に存在するかどうか）。

* `lower_case_meta_names = true` の場合、Doris はデータベース名、テーブル名、カラム名の大文字小文字競合をチェックします（例：`DORIS` と `doris` が同時に存在するかどうか）。

* `lower_case_meta_names = false` かつ `lower_case_table_names` が `1` または `2` に設定されている場合、Doris は**テーブル名**の競合をチェックします（例：`orders` と `ORDERS` が同時に存在するかどうか）。

* `lower_case_table_names = 0` の場合、データベース名とテーブル名は大文字小文字を区別し、追加の変換は必要ありません。

#### 大文字小文字競合の解決策

競合が発生した場合、Doris はエラーをスローし、以下のアプローチを使用して競合を解決する必要があります。

大文字小文字の違いのみのデータベース、テーブル、またはカラム（例：`DORIS` と `doris`）が原因で Doris が適切に区別できない場合、Catalog に `meta_names_mapping` を設定して手動マッピングを指定することで競合を解決できます。

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
### ドライバパッケージセキュリティ

ドライバパッケージはユーザーによってDorisクラスターにアップロードされるため、一定のセキュリティリスクが存在します。ユーザーは以下の措置によってセキュリティを強化できます：

1. Dorisは`jdbc_drivers_dir`ディレクトリ内のすべてのドライバパッケージを安全であると見なし、それらに対してパスチェックを実行しません。管理者は、このディレクトリ内のファイルを自分で管理して、その安全性を確保する必要があります。

2. ドライバパッケージがローカルパスまたはHTTPパスを使用して指定された場合、Dorisは以下のチェックを実行します：

   * 許可されたドライバパッケージパスは、FE設定項目`jdbc_driver_secure_path`によって制御されます。この設定には複数のパスを含めることができ、セミコロンで区切られます。この設定が設定されると、Dorisは`driver_url`パスプレフィックスが`jdbc_driver_secure_path`に含まれているかどうかをチェックします。含まれていない場合、作成は拒否されます。

     例：

     `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"`が設定されている場合、`file:///path/to/jdbc_drivers`または`http://path/to/jdbc_drivers`で始まるドライバパッケージパスのみが許可されます。

   * このパラメータのデフォルト値は`*`です。空または`*`に設定されている場合、すべてのJarパッケージパスが許可されます。

3. データディレクトリを作成する際、`checksum`パラメータを使用してドライバパッケージのチェックサムを指定できます。ドライバパッケージをロードした後、Dorisはチェックサムを検証し、検証が失敗した場合、作成は拒否されます。

### Connection Pool クリーンアップ

Dorisでは、各FEおよびBEノードがconnection poolを維持して、個々のデータソース接続の頻繁な開閉を避けています。プール内の各接続は、データソースとの接続を確立してクエリを実行するために使用できます。タスクが完了した後、これらの接続は再利用のためにプールに戻され、これによりパフォーマンスが向上するだけでなく、接続確立のシステムオーバーヘッドが削減され、データソースの接続制限に達することを防ぐのに役立ちます。

connection poolのサイズは、実際のニーズに応じて調整して、異なるワークロードにより適応できます。通常、プール内の最小接続数は1に設定して、keep-aliveメカニズムが有効になっているときに少なくとも1つの接続がアクティブな状態を保つようにする必要があります。最大接続数は、過度なリソース消費を避けるために合理的な値に設定する必要があります。

BEで使用されていないconnection poolキャッシュの蓄積を防ぐため、BEで`jdbc_connection_pool_cache_clear_time_sec`パラメータを設定してキャッシュクリーンアップ間隔を指定できます。デフォルト値は28,800秒（8時間）で、この時間が経過するとBEはこの時間内に使用されていないすべてのconnection poolキャッシュを強制的にクリアします。

### 認証情報の更新

JDBC Catalogを使用して外部データソースに接続する際、データベース認証情報を慎重に更新することが重要です。

Dorisはconnection poolを通じてアクティブな接続を維持して、クエリに迅速に応答します。しかし、認証情報を変更した後、connection poolは古い認証情報を使用して新しい接続を試行し続け、失敗する可能性があります。システムは一定数のアクティブな接続を維持しようとするため、これらの誤った試行が繰り返され、一部のデータベースシステムでは、頻繁な失敗がアカウントロックアウトにつながる可能性があります。

認証情報を変更する必要がある場合は、Doris JDBC Catalogの設定を同期して更新し、Dorisクラスターを再起動して、すべてのノードが最新の認証情報を使用するようにし、接続失敗や潜在的なアカウントロックアウトを防ぐことが推奨されます。

潜在的なアカウントロックアウトには以下が含まれます：

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
```
### コネクションプール トラブルシューティング

1. HikariPool コネクションタイムアウトエラー: `Connection is not available, request timed out after 5000ms`

   * 考えられる原因

     * 原因1: ネットワークの問題（例：サーバーに到達不可）

     * 原因2: 認証の問題（無効なユーザー名またはパスワードなど）

     * 原因3: ネットワークの高遅延により、コネクション作成が5秒のタイムアウトを超過

     * 原因4: 同時クエリ数が多すぎて、プールに設定された最大コネクション数を超過

   * 解決方法

     * エラー `Connection is not available, request timed out after 5000ms` のみが発生する場合は、原因3と4を確認してください：

       * ネットワークの高遅延またはリソース不足を確認してください。

       * プールの最大コネクション数を増やしてください：

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```
* 接続タイムアウトを増やす:

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```
* `Connection is not available, request timed out after 5000ms` 以外に追加のエラーメッセージがある場合は、以下の追加エラーを確認してください:

       * ネットワークの問題（例：サーバーに到達できない）により接続障害が発生する可能性があります。ネットワーク接続が安定していることを確認してください。

       * 認証の問題（例：無効なユーザー名またはパスワード）も接続障害の原因となる可能性があります。設定内のデータベース認証情報を確認し、ユーザー名とパスワードが正しいことを確認してください。

       * 根本原因を特定するため、具体的なエラーメッセージに基づいてネットワーク、データベース、または認証に関連する問題を調査してください。
