---
{
  "title": "JDBC カタログ",
  "description": "JDBC カタログは、標準のJDBCインターフェースを通じてJDBCプロトコルと互換性のあるデータベースへの接続をサポートします。",
  "language": "ja"
}
---
JDBC カタログは、標準的なJDBCインターフェースを通じて、JDBCプロトコルと互換性のあるデータベースへの接続をサポートします。

本ドキュメントでは、JDBC カタログの一般的な設定と使用方法を紹介します。異なるJDBCソースについては、それぞれのドキュメントを参照してください。

:::info Note
DorisのJDBC カタログ機能は、データの読み取りと処理にJavaレイヤーに依存しており、全体的なパフォーマンスはJDKバージョンの影響を受ける可能性があります。古いバージョンのJDK（JDK 8など）の一部の内部ライブラリは効率が低く、リソース消費量の増加につながる可能性があります。より高いパフォーマンスが必要な場合は、デフォルトでJDK 17でコンパイルされ、より優れた全体的なパフォーマンスを提供するDoris 3.0の使用を推奨します。
:::

## 適用シナリオ

JDBC カタログは、データソースから少量のデータをDorisにインポートしたり、JDBCデータソース内の小さなtableに対してjoinクエリを実行したりするなど、データ統合にのみ適しています。JDBC カタログは、データソースでのクエリを高速化したり、大量のデータに一度にアクセスしたりすることはできません。

## サポートされているデータベース

Doris JDBC カタログは以下のデータベースへの接続をサポートしています：

| サポートされているデータソース |
| ---------------------------------- |
| [ MySQL](./jdbc-mysql-catalog.md)      |
| [ PostgreSQL](./jdbc-mysql-catalog.md) |
| [ Oracle](./jdbc-mysql-catalog.md)     |
| [ SQL サーバー](./jdbc-mysql-catalog.md) |
| [ IBM DB2](./jdbc-mysql-catalog.md)    |
| [ ClickHouse](./jdbc-clickhouse-catalog.md) |
| [ SAP HANA](./jdbc-saphana-catalog.md)   |
| [ Oceanbase](./jdbc-oceanbase-catalog.md) |

[Developer Guide](https://doris.apache.org/community/how-to-contribute/jdbc-catalog-developer-guide)を参照して、新しい、サポートされていないJDBCデータソースのサポートを開発することができます。

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
      | `driver_url`     | JDBCドライバーファイルのパス。ドライバーパッケージのセキュリティについては付録を参照してください。 | 3つの方法をサポート。以下を参照してください。 |
      | `driver_class`   | JDBCドライバーのクラス名            |                               |

      `driver_url`は以下の3つの指定方法をサポートしています：
    
      1. ファイル名。例：`mysql-connector-j-8.3.0.jar`。JarファイルはFEおよびBE配置ディレクトリ下の`jdbc_drivers/`ディレクトリに事前に配置する必要があります。システムはこのディレクトリ内を自動的に検索します。場所は`fe.conf`と`be.conf`の`jdbc_drivers_dir`設定により変更することも可能です。
      
      2. ローカル絶対パス。例：`file:///path/to/mysql-connector-j-8.3.0.jar`。Jarファイルはすべての FE/BE ノードの指定されたパスに事前に配置する必要があります。
      
      3. HTTP URL。例：`http://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`。システムはこのHTTPアドレスからドライバーファイルをダウンロードします。認証なしのHTTPサービスのみをサポートしています。

  * オプションプロパティ

      | パラメータ名                | デフォルト値 | 説明                                                                                                                                   |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | 外部データソースからデータベース、Table、カラム名を小文字で同期するかどうか                                        |
      | `meta_names_mapping`          |               | 外部データソースが`MY_TABLE`と`my_table`のように大文字小文字のみが異なる名前を持つ場合、DorisはCatalogをクエリする際に曖昧性によりエラーを報告します。競合を解決するために`meta_names_mapping`パラメータを設定する必要があります。 |
      | `only_specified_database`     | false         | `jdbc_url`で指定されたデータベースのみを同期するかどうか（このDatabaseはDorisのDatabaseレベルにマップされます）                       |
      | `connection_pool_min_size`    | 1             | 接続プール内の最小接続数を定義します。プールの初期化に使用され、keep-aliveが有効な場合に少なくともこの数のアクティブな接続を保証します。 |
      | `connection_pool_max_size`    | 30            | 接続プール内の最大接続数を定義します。各Catalogに対応する各FEまたはBEノードは最大でこの数の接続を保持できます。 |
      | `connection_pool_max_wait_time`| 5000         | プールで利用可能な接続がない場合にクライアントが接続を待機する最大待機時間をミリ秒で定義します。                         |
      | `connection_pool_max_life_time`| 1800000      | プール内の接続の最大アクティブ継続時間（ミリ秒）を設定します。この時間を超えた接続はリサイクルされます。さらに、この値の半分がプールの最小退去アイドル時間として使用され、この時間に達した接続は退去の対象となります。 |
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
### Query最適化

#### Predicate Pushdown

JDBC Catalogがデータソースにアクセスする際、基本的にBEノードを選択し、JDBC Clientを使用して生成されたSQLクエリをソースに送信し、データを取得します。そのため、パフォーマンスは生成されたSQLがソース側でどれだけ効率的に実行されるかにのみ依存します。Dorisは述語条件をプッシュダウンし、生成されたSQLに組み込むことを試みます。生成されたSQLを確認するには、`EXPLAIN SQL`文を使用できます。

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
#### ファンクション Pushdown

述語条件について、Dorisおよび外部データソースでセマンティクスまたはビヘイビアが一致しない場合があります。そのため、DorisはJDBC外部Tableクエリにおける述語プッシュダウンを以下のパラメータ変数で制限・制御しています：

> 注意：現在、DorisはMySQL、Clickhouse、Oracleデータソースの述語プッシュダウンのみをサポートしています。今後、より多くのデータソースがサポートされる予定です。

- `enable_jdbc_oracle_null_predicate_push_down`

    セッション変数です。デフォルトは`false`です。つまり、述語条件に`NULL`値が含まれている場合、述語はOracleデータソースにプッシュダウンされません。これは、Oracleバージョン21以前では、Oracleが`NULL`を演算子としてサポートしていないためです。

    このパラメータは2.1.7および3.0.3以降でサポートされています。

- `enable_jdbc_cast_predicate_push_down`

    セッション変数です。デフォルトは`false`です。つまり、述語条件に明示的または暗示的なCASTがある場合、述語はJDBCデータソースにプッシュダウンされません。CASTのビヘイビアは異なるデータベース間で一致しないため、正確性を保証するために、デフォルトではCASTはプッシュダウンされません。ただし、ユーザーはCASTのビヘイビアが一致するかを手動で検証できます。一致する場合は、このパラメータを`true`に設定して、より多くの述語をプッシュダウンしてパフォーマンスを向上させることができます。

    このパラメータは2.1.7および3.0.3以降でサポートされています。

- ファンクション プッシュダウンブラックリストとホワイトリスト

    同じシグネチャを持つ関数でも、DorisおよびExternal データソースでセマンティクスが一致しない場合があります。Dorisは関数プッシュダウン用に事前定義されたブラックリストとホワイトリストを持っています：

    | Data Source   | Blacklist | Whitelist | デスクリプション     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQLは FE設定項目`jdbc_mysql_unsupported_pushdown_functions`を通じて追加のブラックリスト項目を設定することも可能です。例：`jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- Function書き換えルール

    DorisとExternal データソースには、ビヘイビアは一致するが名前が異なる関数がいくつか存在します。Dorisは関数プッシュダウンの際にこれらの関数を書き換えることをサポートしています。現在、以下の書き換えルールが組み込まれています：

    | Data Source   | Doris ファンクション | Target ファンクション |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- カスタム関数プッシュダウンと書き換えルール

    3.0.7以降のバージョンでは、Dorisはより柔軟な関数プッシュダウンと書き換えルールをサポートします。ユーザーはCatalogプロパティで特定のCatalogに対する関数プッシュダウンと書き換えルールを設定できます：

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```
`function_rules`を通じて、以下のルールを指定できます：

    - `pushdown`

        関数プッシュダウンルールを指定します。`supported`と`unsupported`配列は、それぞれプッシュダウン可能な関数名とプッシュダウン不可能な関数名を指定します。関数が両方の配列に存在する場合、`supported`が優先されます。

        Dorisは最初にシステムの事前定義されたブラックリストとホワイトリストを適用し、その後ユーザー指定のブラックリストとホワイトリストを適用します。

    - `rewrite`

        関数書き換えルールを定義します。上記の例のように、関数名`to_date`は`date2`として書き換えられ、プッシュダウンされます。

        注意：プッシュダウンが許可された関数のみが書き換えられます。

#### 行数制限

クエリに`LIMIT`キーワードが含まれている場合、Dorisは`LIMIT`句をデータソースにプッシュダウンして、データ転送量を削減します。`EXPLAIN`文を使用して、生成されたSQLに`LIMIT`句が含まれているかを確認できます。

## 書き込み操作

DorisはJDBCプロトコル経由で対応するデータソースへのデータの書き戻しをサポートしています。

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```
## Statement Passthrough

### 適用シナリオ

DorisはStatement Passthroughを通じて、JDBCデータソースで対応するDDL、DML、およびクエリステートメントを直接実行することをサポートしています。この機能は以下のシナリオに適用されます：

* 複雑なクエリパフォーマンスの向上

  デフォルトでは、Dorisクエリオプティマイザは元のSQLを解析し、特定のルールに基づいてデータソースに送信するSQLを生成します。この生成されたSQLは通常、シンプルな単一Tableクエリであり、集約やjoinクエリなどの演算子を含むことができません。例えば、以下のクエリを考えてみてください：

  ```sql
  SELECT smallint_u, sum(int_u)
  FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;
  ```
最終的に生成されるSQLは以下のようになります：

  ```sql
  SELECT smallint_u, int_u 
  FROM all_types
  WHERE smallint_u > 10;
  ```
この場合、集約操作はDoris内で実行されます。そのため、一部のシナリオでは、大量のデータをネットワーク経由でソースから読み取る必要があり、クエリ効率が低下する可能性があります。statement passthroughを使用することで、元のSQLをデータソースに直接渡すことができ、データソース自体の計算能力を活用してSQLを実行し、クエリパフォーマンスを向上させることができます。

* 統合管理

  クエリSQLに加えて、statement passthrough機能はDDLおよびDMLステートメントも渡すことができます。これにより、ユーザーはDorisを通じてソースデータに対して直接データベースやTable操作を実行できます。例えば、Tableの作成、削除、またはTable構造の変更などが可能です。

### Passthrough SQL

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog', 
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```
`QUERY`Table関数は2つのパラメータを取ります：

* `catalog`: カタログの名前で、カタログの名前と一致する必要があります。
* `query`: 実行するクエリステートメントで、対応するデータソースの構文を直接使用して記述します。

### Passthrough DDLとDML

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```
`EXECUTE_STMT()`関数は2つのパラメータを受け取ります：

* 第1パラメータ：カタログの名前。現在はJDBC型カタログのみがサポートされています。
* 第2パラメータ：実行するSQL文。現在はDDLとDML文のみがサポートされており、対応するデータソースの構文で記述する必要があります。

### 使用制限

`CALL EXECUTE_STMT()`コマンドを使用する際、Dorisはユーザーが記述したSQL文をカタログに関連付けられたJDBCデータソースに直接送信して実行します。その結果、この操作には以下の制限があります：

* SQL文は対応するデータソースの構文に従う必要があります。Dorisは構文チェックやセマンティックチェックを行いません。

* SQL文で参照されるTable名は、`db.tbl`のような完全修飾名を使用することが推奨されます。データベースが指定されない場合、JDBCカタログのJDBC URLのデータベース名が使用されます。

* SQL文はJDBCデータソース外のデータベースやTableを参照することはできず、DorisのデータベースやTableも参照できません。ただし、Doris JDBCカタログと同期されていないJDBCデータソース内のTableは参照可能です。

* DML文を実行する際、挿入、更新、削除された行数を取得することはできません。コマンドの成功または失敗のみを判定できます。

* カタログに対する`LOAD`権限を持つユーザーのみが`CALL EXECUTE_STMT()`コマンドを実行できます。

* カタログに対する`SELECT`権限を持つユーザーのみが`query()`Table関数を実行できます。

* カタログ作成時に指定されたJDBCユーザーは、対応する文を実行するためにソース上で必要な権限を持つ必要があります。

* `query()`Table関数で読み取られる結果のデータ型は、クエリされるカタログ型でサポートされるデータ型と一致します。

## 付録

### 大文字小文字の区別設定

デフォルトでは、Dorisのデータベース名とTable名は大文字小文字を区別し、列名は大文字小文字を区別しません。この動作は設定パラメータで変更できます。さらに、一部のJDBCデータソースでは、データベース名、Table名、列名の大文字小文字の区別ルールがDorisと異なる場合があります。この不一致により、JDBC Catalogを介した名前マッピング時に命名の競合が発生する可能性があります。以下のセクションでは、このような問題の解決方法を説明します。

#### 表示名とクエリ名

Dorisでは、オブジェクト名（ここではTable名を例とします）は**表示名**と**クエリ名**に分けることができます。例えば、Table名の場合、**表示名**は`SHOW TABLES`の結果で表示される名前を指し、**クエリ名**は`SELECT`文で使用できる名前を指します。

例えば、Tableの実際の名前が`MyTable`の場合、Frontend（FE）パラメータ`lower_case_table_names`の設定に応じて、このTableの**表示名**と**クエリ名**が異なる場合があります：

| 設定 | 説明 | 実際の名前 | 表示名 | クエリ名 |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | デフォルト設定。元の名前が保存・表示され、クエリは大文字小文字を区別します。 | `MyTable` | `MyTable` | クエリで大文字小文字を区別、以下を使用する必要があります：`MyTable` |
| `lower_case_table_names=1` | 名前は小文字で保存・表示され、クエリは大文字小文字を区別しません。 | `MyTable` | `mytable` | クエリで大文字小文字を区別しません。例：`MyTable`または`mytable`を使用できます。 |
| `lower_case_table_names=2` | 元の名前が保存・表示されますが、クエリは大文字小文字を区別しません。 | `MyTable` | `MyTable` | クエリで大文字小文字を区別しません。例：`MyTable`または`mytable`を使用できます。 |

#### JDBC Catalog名の大文字小文字区別ルール

Doris自体は**Table名**の大文字小文字区別ルールの設定のみを許可します。しかし、JDBC Catalogでは**データベース名**と**列名**に対する追加の処理が必要です。そのため、追加のCatalogプロパティ`lower_case_meta_names`を使用して`lower_case_table_names`と連携します。

| 設定 | 説明 |
| --- | --- |
| `lower_case_meta_names` | Catalog作成時に`properties`で指定され、そのCatalogにのみ適用されます。デフォルト値は`false`です。`true`に設定すると、Dorisはすべてのデータベース名、Table名、列名を小文字に変換して保存・表示します。Dorisでのクエリでは小文字名を使用する必要があります。 |
| `lower_case_table_names` | Frontend（FE）設定項目で、`fe.conf`で設定され、クラスタ全体に適用されます。デフォルト値は`0`です。 |

> 注意：`lower_case_meta_names = true`の場合、`lower_case_table_names`設定は無視され、すべてのデータベース名、Table名、列名が小文字に変換されます。

`lower_case_meta_names`（true/false）と`lower_case_table_names`（0/1/2）の組み合わせに基づいて、**保存**と**クエリ**時のデータベース名、Table名、列名の動作を以下の表で示します（「元のまま」は外部データソースの大文字小文字を保持、「小文字」は自動的に小文字に変換、「任意」はクエリで任意の大文字小文字を使用可能を意味します）：

| `lower_case_table_names` & `lower_case_meta_names` | データベース表示名 | Table表示名 | 列表示名 | データベースクエリ名 | Tableクエリ名 | 列クエリ名 |
| -------------------------------------------------- | ----------------- | ------------- | ------- | ------------------- | --------------- | --------- |
| `0 & false`                                       | 元のまま           | 元のまま       | 元のまま | 元のまま             | 元のまま         | 任意      |
| `0 & true`                                        | 小文字            | 小文字         | 小文字   | 小文字              | 小文字          | 任意      |
| `1 & false`                                       | 元のまま           | 小文字         | 元のまま | 元のまま             | 任意            | 任意      |
| `1 & true`                                        | 小文字            | 小文字         | 小文字   | 小文字              | 任意            | 任意      |
| `2 & false`                                       | 元のまま           | 元のまま       | 元のまま | 元のまま             | 任意            | 任意      |
| `2 & true`                                        | 小文字            | 小文字         | 小文字   | 小文字              | 任意            | 任意      |

#### 大文字小文字競合チェック

JDBC Catalogを介して名前マッピングを実行する際、命名の競合が発生する可能性があります。例えば、ソースの列名が大文字小文字を区別し、`ID`と`id`の2つの列がある場合、`lower_case_meta_names = true`を設定すると、これらの2つの列は小文字に変換された後に競合します。Dorisは以下のルールに従って競合チェックを実行します：

* どのシナリオでも、Dorisは**列名**の大文字小文字競合をチェックします（例：`id`と`ID`が同時に存在するかどうか）。

* `lower_case_meta_names = true`の場合、Dorisはデータベース名、Table名、列名の大文字小文字競合をチェックします（例：`DORIS`と`doris`が同時に存在するかどうか）。

* `lower_case_meta_names = false`で`lower_case_table_names`が`1`または`2`に設定されている場合、Dorisは**Table名**の競合をチェックします（例：`orders`と`ORDERS`が同時に存在するかどうか）。

* `lower_case_table_names = 0`の場合、データベース名とTable名は大文字小文字を区別し、追加の変換は必要ありません。

#### 大文字小文字競合の解決方法

競合が発生した場合、Dorisはエラーをスローし、以下のアプローチを使用して競合を解決する必要があります。

大文字小文字の違いのみを持つデータベース、Table、または列（例：`DORIS`と`doris`）がDorisで適切に区別できない場合、Catalogに`meta_names_mapping`を設定して手動マッピングを指定することで競合を解決できます。

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
### ドライバーパッケージセキュリティ

Driver packageはユーザーによってDorisクラスターにアップロードされるため、一定のセキュリティリスクが生じます。ユーザーは以下の措置を通じてセキュリティを強化できます：

1. Dorisは`jdbc_drivers_dir`ディレクトリ内のすべてのdriver packageを安全であると見なし、それらに対してパスチェックを実行しません。管理者は、セキュリティを確保するために、このディレクトリ内のファイルを自分で管理する必要があります。

2. driver packageがローカルパスまたはHTTPパスを使用して指定されている場合、Dorisは以下のチェックを実行します：

   * 許可されるdriver packageパスは、FE設定項目`jdbc_driver_secure_path`を通じて制御されます。この設定には複数のパスを含めることができ、セミコロンで区切られます。この設定が行われると、Dorisは`driver_url`パスプレフィックスが`jdbc_driver_secure_path`に含まれているかどうかをチェックします。含まれていない場合、作成は拒否されます。

     例：

     `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"`が設定されている場合、`file:///path/to/jdbc_drivers`または`http://path/to/jdbc_drivers`で始まるdriver packageパスのみが許可されます。

   * このパラメータのデフォルト値は`*`です。空であるか`*`に設定されている場合、すべてのJar packageパスが許可されます。

3. データディレクトリを作成する際、`checksum`パラメータを使用してdriver packageのチェックサムを指定できます。driver packageのロード後、Dorisはチェックサムを検証し、検証に失敗した場合、作成は拒否されます。

### Connection Pool クリーンアップ

Dorisでは、個別のデータソース接続の頻繁な開閉を避けるために、各FEおよびBEノードがconnection poolを維持しています。プール内の各接続は、データソースとの接続を確立し、クエリを実行するために使用できます。タスクが完了すると、これらの接続は再利用のためにプールに返されます。これにより、パフォーマンスが向上するだけでなく、接続確立のシステムオーバーヘッドが削減され、データソースの接続制限に達することを防ぐのに役立ちます。

connection poolのサイズは、異なるワークロードにより適応するために、実際のニーズに応じて調整できます。通常、プール内の最小接続数は、keep-aliveメカニズムが有効になっているときに少なくとも1つの接続がアクティブな状態を保つために、1に設定する必要があります。最大接続数は、過度なリソース消費を避けるために適切な値に設定する必要があります。

BE上で使用されていないconnection poolキャッシュの蓄積を防ぐために、BE上で`jdbc_connection_pool_cache_clear_time_sec`パラメータを設定して、キャッシュクリーンアップ間隔を指定できます。デフォルト値は28,800秒（8時間）で、この時間後にBEはこの時間内に使用されていないすべてのconnection poolキャッシュを強制的にクリアします。

### Credential アップデート

JDBC Catalogを使用して外部データソースに接続する際は、データベースの認証情報を慎重に更新することが重要です。

Dorisはクエリに迅速に応答するために、connection poolを通じてアクティブな接続を維持しています。しかし、認証情報を変更した後、connection poolは古い認証情報を使用して新しい接続を試行し続け、失敗する可能性があります。システムは一定数のアクティブな接続を維持しようとするため、これらの誤った試行は繰り返され、一部のデータベースシステムでは、頻繁な失敗によりアカウントロックアウトが発生する可能性があります。

認証情報を変更する必要がある場合は、DorisのJDBC Catalog設定を同期して更新し、Dorisクラスターを再起動して、すべてのノードが最新の認証情報を使用することを確保し、接続失敗と潜在的なアカウントロックアウトを防ぐことが推奨されます。

可能なアカウントロックアウトには以下が含まれます：

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL サーバー: Login is locked out
```
### Connection Pool トラブルシューティング

1. HikariPool接続タイムアウトエラー: `Connection is not available, request timed out after 5000ms`

   * 考えられる原因

     * 原因1: ネットワークの問題（例：サーバーに到達できない）

     * 原因2: 認証の問題（無効なユーザー名またはパスワードなど）

     * 原因3: 高いネットワークレイテンシにより接続作成が5秒のタイムアウトを超過

     * 原因4: 同時クエリ数が多すぎてプールに設定された最大接続数を超過

   * 解決方法

     * `Connection is not available, request timed out after 5000ms`エラーのみが発生する場合は、原因3と4を確認してください：

       * 高いネットワークレイテンシまたはリソース枯渇を確認する。

       * プールの最大接続数を増やす：

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```
* 接続タイムアウトを増加させる:

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```
* `Connection is not available, request timed out after 5000ms` 以外に追加のエラーメッセージがある場合は、これらの追加エラーを確認してください：

       * ネットワークの問題（サーバーに到達できない等）により接続失敗が発生する場合があります。ネットワーク接続が安定していることを確認してください。

       * 認証の問題（無効なユーザー名またはパスワード等）も接続失敗の原因となる場合があります。設定内のデータベース認証情報を確認し、ユーザー名とパスワードが正しいことを確認してください。

       * 具体的なエラーメッセージに基づいて、ネットワーク、データベース、または認証に関連する問題を調査し、根本原因を特定してください。
