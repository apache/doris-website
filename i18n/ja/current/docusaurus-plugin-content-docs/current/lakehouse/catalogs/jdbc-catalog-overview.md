---
{
  "title": "JDBCカタログ",
  "language": "ja",
  "description": "JDBCカタログは、標準のJDBCインターフェースを通じてJDBCプロトコルと互換性のあるデータベースへの接続をサポートします。"
}
---
JDBC Catalogは、標準のJDBCインターフェースを通じてJDBCプロトコルと互換性のあるデータベースへの接続をサポートします。

この文書では、JDBC Catalogの一般的な設定と使用方法について説明します。異なるJDBCソースについては、それぞれのドキュメントを参照してください。

:::info Note
DorisのJDBC Catalog機能は、データの読み込みと処理にJavaレイヤーに依存しており、全体的なパフォーマンスはJDKバージョンの影響を受ける可能性があります。古いバージョンのJDK（JDK 8など）の一部の内部ライブラリは効率が低く、リソース消費の増加につながる可能性があります。より高いパフォーマンスが必要な場合は、デフォルトでJDK 17でコンパイルされ、より良い全体的なパフォーマンスを提供するDoris 3.0の使用を推奨します。
:::

## 適用シナリオ

JDBC Catalogは、データソースから少量のデータをDorisにインポートしたり、JDBCデータソース内の小さなテーブルに対してjoinクエリを実行したりするなど、データ統合にのみ適しています。JDBC Catalogは、データソースでのクエリを高速化したり、大量のデータに一度にアクセスしたりすることはできません。

## サポートされているデータベース

Doris JDBC Catalogは以下のデータベースへの接続をサポートしています：

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

      | パラメータ名      | 説明                                      | 例                            |
      | ---------------- | ---------------------------------------- | ----------------------------- |
      | `user`           | データソースのユーザー名                     |                               |
      | `password`       | データソースのパスワード                     |                               |
      | `jdbc_url`       | データソース接続URL                        | `jdbc:mysql://host:3306`      |
      | `driver_url`     | JDBCドライバーファイルのパス。ドライバーパッケージのセキュリティについては、付録を参照してください。 | 3つの方式をサポート、以下を参照。 |
      | `driver_class`   | JDBCドライバーのクラス名                    |                               |

      `driver_url`は以下の3つの仕様をサポートします：
    
      1. ファイル名。例：`mysql-connector-j-8.3.0.jar`。JarファイルはFEおよびBEデプロイディレクトリ下の`jdbc_drivers/`ディレクトリに事前配置する必要があります。システムはこのディレクトリで自動検索します。この場所は`fe.conf`および`be.conf`の`jdbc_drivers_dir`設定で変更することもできます。
      
      2. ローカル絶対パス。例：`file:///path/to/mysql-connector-j-8.3.0.jar`。JarファイルはすべてのFE/BEノードの指定パスに事前配置する必要があります。
      
      3. HTTP URL。例：`http://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`。システムはこのHTTPアドレスからドライバーファイルをダウンロードします。認証なしのHTTPサービスのみサポートします。

  * オプションプロパティ

      | パラメータ名                   | デフォルト値   | 説明                                                                                                                                          |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | 外部データソースからデータベース、テーブル、カラム名を小文字で同期するかどうか                                                                   |
      | `meta_names_mapping`          |               | 外部データソースに`MY_TABLE`と`my_table`のように大文字小文字のみが異なる名前がある場合、DorisはCatalogをクエリする際に曖昧性によりエラーを報告します。競合を解決するために`meta_names_mapping`パラメータを設定する必要があります。 |
      | `only_specified_database`     | false         | `jdbc_url`で指定されたデータベースのみを同期するかどうか（このDatabaseはDorisのDatabaseレベルにマッピングされます）                              |
      | `connection_pool_min_size`    | 1             | コネクションプールの最小接続数を定義し、プールの初期化とキープアライブが有効な場合に最低限この数のアクティブ接続を保証するために使用されます。        |
      | `connection_pool_max_size`    | 30            | コネクションプールの最大接続数を定義します。各Catalogに対応する各FEまたはBEノードは最大この数の接続を保持できます。                               |
      | `connection_pool_max_wait_time`| 5000         | プールで利用可能な接続がない場合にクライアントが接続を待機する最大待機時間をミリ秒で定義します。                                                 |
      | `connection_pool_max_life_time`| 1800000      | プール内の接続の最大アクティブ期間（ミリ秒）を設定します。この時間を超える接続はリサイクルされます。さらに、この値の半分がプールの最小退去アイドル時間として使用され、この時間に到達した接続が退去対象となります。 |
      | `connection_pool_keep_alive`  | false         | BEノードでのみ有効で、最小退去アイドル時間に到達したが最大ライフタイムに到達していない接続をアクティブに保つかどうかを決定します。不要なリソース使用量を削減するため、デフォルトでは無効になっています。 |
        
* `[CommonProperties]`

  CommonPropertiesセクションは共通プロパティの設定に使用されます。**共通プロパティ**について詳しくは[Catalog Overview](../catalog-overview.md)セクションを参照してください。

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

JDBC Catalogがデータソースにアクセスする際、本質的にはBEノードを選択し、JDBC Clientを使用して生成されたSQLクエリをソースに送信し、データを取得します。そのため、パフォーマンスは生成されたSQLがソース側でどれだけ効率的に実行されるかにのみ依存します。Dorisは述語条件のプッシュダウンを試行し、それらを生成されたSQLに組み込みます。`EXPLAIN SQL`文を使用して生成されたSQLを確認できます。

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

述語条件については、Dorisと外部データソースでセマンティクスや動作が一致しない場合があります。そのため、DorisはJDBC外部テーブルクエリにおける述語pushdownを以下のパラメータ変数を通じて制限・制御します：

> 注意：現在、Dorisは MySQL、Clickhouse、Oracle データソースに対してのみ述語pushdownをサポートしています。今後、より多くのデータソースがサポートされる予定です。

- `enable_jdbc_oracle_null_predicate_push_down`

    セッション変数。デフォルトは `false` です。つまり、述語条件に `NULL` 値が含まれている場合、その述語はOracleデータソースにpushdownされません。これは、Oracleバージョン21以前では、Oracleが `NULL` をオペレータとしてサポートしないためです。

    このパラメータは2.1.7および3.0.3以降でサポートされています。

- `enable_jdbc_cast_predicate_push_down`

    セッション変数。デフォルトは `false` です。つまり、述語条件に明示的または暗黙的なCASTがある場合、その述語はJDBCデータソースにpushdownされません。CASTの動作は異なるデータベース間で一致しないため、正確性を保証するために、CASTはデフォルトでpushdownされません。ただし、ユーザーはCASTの動作が一致するかどうかを手動で検証することができます。一致する場合は、このパラメータを `true` に設定して、より多くの述語をpushdownし、パフォーマンスを向上させることができます。

    このパラメータは2.1.7および3.0.3以降でサポートされています。

- Function pushdownのブラックリストとホワイトリスト

    同じシグネチャを持つ関数でも、Dorisと外部データソースでセマンティクスが一致しない場合があります。Dorisでは、function pushdownのためのブラックリストとホワイトリストが事前定義されています：

    | Data Source   | Blacklist | Whitelist | Description     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQLでは、FE設定項目 `jdbc_mysql_unsupported_pushdown_functions` を通じて追加のブラックリスト項目も設定できます。例：`jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- Function書き換えルール

    Dorisと外部データソースには、一致した動作をするが名前が異なる関数があります。Dorisは、function pushdown時にこれらの関数の書き換えをサポートしています。現在、以下の書き換えルールが組み込まれています：

    | Data Source   | Doris Function | Target Function |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- カスタムfunction pushdownおよび書き換えルール

    3.0.7以降のバージョンでは、Dorisはより柔軟なfunction pushdownおよび書き換えルールをサポートします。ユーザーは、Catalogプロパティで特定のCatalogに対するfunction pushdownおよび書き換えルールを設定できます：

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```
`function_rules`を通じて、以下のルールを指定できます：

    - `pushdown`

        関数プッシュダウンルールを指定します。`supported`と`unsupported`配列は、それぞれプッシュダウンできる関数名とできない関数名を指定します。関数が両方の配列に存在する場合、`supported`が優先されます。

        Dorisは最初にシステムの事前定義されたブラックリストとホワイトリストを適用し、その後ユーザー指定のブラックリストとホワイトリストを適用します。

    - `rewrite`

        関数書き換えルールを定義します。上記の例のように、関数名`to_date`は`date2`として書き換えられ、プッシュダウンされます。

        注意：プッシュダウンが許可された関数のみが書き換えられます。

#### 行数制限

クエリに`LIMIT`キーワードが含まれている場合、Dorisはデータ転送量を削減するために`LIMIT`句をデータソースにプッシュダウンします。`EXPLAIN`ステートメントを使用して、生成されたSQLに`LIMIT`句が含まれているかどうかを確認できます。

## 書き込み操作

DorisはJDBCプロトコルを介して対応するデータソースへのデータの書き戻しをサポートしています。

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```
## Statement Passthrough

### 適用可能なシナリオ

Dorisは、statement passthroughを通じてJDBCデータソースで対応するDDL、DML、およびクエリステートメントを直接実行することをサポートしています。この機能は以下のシナリオで適用できます：

* 複雑なクエリパフォーマンスの向上

  デフォルトでは、Dorisクエリオプティマイザは元のSQLを解析し、特定のルールに基づいてデータソースに送信されるSQLを生成します。この生成されたSQLは通常、単純な単一テーブルクエリであり、集約やjoinクエリなどのオペレータを含むことができません。例えば、以下のクエリを考えてください：

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
この場合、集約操作はDoris内で実行されます。そのため、一部のシナリオでは、ネットワーク経由でソースから大量のデータを読み取る必要があり、クエリ効率が低下する可能性があります。statement passthroughを使用することで、元のSQLを直接データソースに渡すことができ、データソース自体の計算能力を活用してSQLを実行し、クエリパフォーマンスを向上させることができます。

* 統合管理

  クエリSQL以外にも、statement passthrough機能はDDLおよびDMLステートメントも渡すことができます。これにより、ユーザーはDorisを通じて直接ソースデータに対してデータベースおよびテーブル操作を実行できます。例えば、テーブルの作成、削除、またはテーブル構造の変更などです。

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
* `query`: 実行するクエリステートメント。対応するデータソースの構文を直接使用して記述します。

### Passthrough DDLおよびDML

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```
`EXECUTE_STMT()`関数は2つのパラメータを取ります：

* 第1パラメータ：カタログの名前。現在、JDBC型のカタログのみがサポートされています。
* 第2パラメータ：実行するSQL文。現在、DDLとDML文のみがサポートされており、対応するデータソースの構文を使用して記述する必要があります。

### 使用制限

`CALL EXECUTE_STMT()`コマンドを使用する際、Dorisはユーザーが書いたSQL文を、カタログに関連付けられたJDBCデータソースに直接送信して実行します。その結果、この操作には以下の制限があります：

* SQL文は対応するデータソースの構文に従う必要があります。Dorisは構文や意味的なチェックを実行しません。

* SQL文で参照されるテーブル名は、`db.tbl`のような完全修飾名を使用することが推奨されます。データベースが指定されていない場合、JDBCカタログのJDBC URLのデータベース名が使用されます。

* SQL文は、JDBCデータソース外のデータベースやテーブルを参照することはできず、Dorisのデータベースやテーブルも参照できません。ただし、DorisのJDBCカタログと同期されていないJDBCデータソース内のテーブルは参照できます。

* DML文を実行する際、挿入、更新、削除された行数は取得できません。コマンドの成功または失敗のみが判定できます。

* カタログに対する`LOAD`権限を持つユーザーのみが`CALL EXECUTE_STMT()`コマンドを実行できます。

* カタログに対する`SELECT`権限を持つユーザーのみが`query()`テーブル関数を実行できます。

* カタログ作成時に指定されたJDBCユーザーは、対応する文を実行するためにソース上で必要な権限を持つ必要があります。

* `query()`テーブル関数によって読み取られる結果のデータ型は、クエリされたカタログタイプでサポートされているデータ型と一致します。

## 付録

### 大文字小文字区別設定

デフォルトでは、Dorisのデータベース名とテーブル名は大文字小文字を区別し、カラム名は区別しません。この動作は設定パラメータを通じて変更できます。さらに、一部のJDBCデータソースにおけるデータベース、テーブル、カラム名の大文字小文字区別ルールは、Dorisのものと異なる場合があります。この違いにより、JDBCカタログを介した名前マッピング中に名前の競合が発生する可能性があります。以下のセクションでは、このような問題を解決する方法について説明します。

#### 表示名とクエリ名

Dorisでは、オブジェクト名（ここではテーブル名を例として使用）は**表示名**と**クエリ名**に分けることができます。例えば、テーブル名の場合、**表示名**は`SHOW TABLES`の結果に表示される名前を指し、**クエリ名**は`SELECT`文で使用できる名前を指します。

例えば、テーブルの実際の名前が`MyTable`である場合、このテーブルの**表示名**と**クエリ名**は、フロントエンド（FE）パラメータ`lower_case_table_names`の設定によって異なる場合があります：

| 設定 | 説明 | 実際の名前 | 表示名 | クエリ名 |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | デフォルト設定。元の名前が保存・表示され、クエリは大文字小文字を区別する。 | `MyTable` | `MyTable` | クエリで大文字小文字を区別、使用する必要がある：`MyTable` |
| `lower_case_table_names=1` | 名前は小文字で保存・表示され、クエリは大文字小文字を区別しない。 | `MyTable` | `mytable` | クエリで大文字小文字を区別しない、例：`MyTable`または`mytable`が使用可能。 |
| `lower_case_table_names=2` | 元の名前が保存・表示されるが、クエリは大文字小文字を区別しない。 | `MyTable` | `MyTable` | クエリで大文字小文字を区別しない、例：`MyTable`または`mytable`が使用可能。 |

#### JDBCカタログ名の大文字小文字区別ルール

Doris自体は**テーブル名**の大文字小文字区別ルールの設定のみを許可します。しかし、JDBCカタログでは**データベース名**と**カラム名**の追加処理が必要です。そのため、`lower_case_table_names`と連携して動作する追加のカタログプロパティ`lower_case_meta_names`を使用します。

| 設定 | 説明 |
| --- | --- |
| `lower_case_meta_names` | カタログ作成時に`properties`を介して指定され、そのカタログにのみ適用される。デフォルト値は`false`。`true`に設定すると、Dorisはすべてのデータベース、テーブル、カラム名を小文字に変換して保存・表示する。クエリはDoris内で小文字名を使用する必要がある。 |
| `lower_case_table_names` | フロントエンド（FE）設定項目で、`fe.conf`で設定され、クラスタ全体に適用される。デフォルト値は`0`。 |

> 注：`lower_case_meta_names = true`の場合、`lower_case_table_names`設定は無視され、すべてのデータベース、テーブル、カラム名が小文字に変換されます。

`lower_case_meta_names`（true/false）と`lower_case_table_names`（0/1/2）の組み合わせに基づいて、データベース、テーブル、カラム名の**保存**と**クエリ**における動作を以下の表に示します（「元のまま」は外部データソースからの大文字小文字を保持することを意味し、「小文字」は自動的に小文字に変換することを意味し、「任意の大文字小文字」はクエリで任意の大文字小文字を使用できることを意味します）：

| `lower_case_table_names` & `lower_case_meta_names` | データベース表示名 | テーブル表示名 | カラム表示名 | データベースクエリ名 | テーブルクエリ名 | カラムクエリ名 |
| -------------------------------------------------- | --------------------- | ------------------ | ------------------- | ------------------- | ---------------- | ----------------- |
| `0 & false`                                       | 元のまま              | 元のまま           | 元のまま            | 元のまま            | 元のまま         | 任意の大文字小文字          |
| `0 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 小文字        | 任意の大文字小文字          |
| `1 & false`                                       | 元のまま              | 小文字          | 元のまま            | 元のまま            | 任意の大文字小文字         | 任意の大文字小文字          |
| `1 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の大文字小文字         | 任意の大文字小文字          |
| `2 & false`                                       | 元のまま              | 元のまま           | 元のまま            | 元のまま            | 任意の大文字小文字         | 任意の大文字小文字          |
| `2 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の大文字小文字         | 任意の大文字小文字          |

#### 大文字小文字競合チェック

JDBCカタログを通じて名前マッピングを実行する際、名前の競合が発生する可能性があります。例えば、ソースのカラム名が大文字小文字を区別し、`ID`と`id`の2つのカラムがある場合。`lower_case_meta_names = true`が設定されていると、これらの2つのカラムは小文字に変換された後に競合します。Dorisは以下のルールに従って競合チェックを実行します：

* すべてのシナリオにおいて、Dorisは**カラム名**の大文字小文字競合をチェックします（例：`id`と`ID`が同時に存在するかどうか）。

* `lower_case_meta_names = true`の場合、Dorisはデータベース名、テーブル名、カラム名の大文字小文字競合をチェックします（例：`DORIS`と`doris`が同時に存在するかどうか）。

* `lower_case_meta_names = false`かつ`lower_case_table_names`が`1`または`2`に設定されている場合、Dorisは**テーブル名**の競合をチェックします（例：`orders`と`ORDERS`が同時に存在するかどうか）。

* `lower_case_table_names = 0`の場合、データベース名とテーブル名は大文字小文字を区別し、追加の変換は必要ありません。

#### 大文字小文字競合の解決方法

競合が発生した場合、Dorisはエラーを投げ、以下のアプローチを使用して競合を解決する必要があります。

大文字小文字のみが異なるデータベース、テーブル、またはカラム（例：`DORIS`と`doris`）がDorisで適切に区別できない場合、カタログに`meta_names_mapping`を設定して手動マッピングを指定することで競合を解決できます。

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

ドライバパッケージはユーザーによってDorisクラスターにアップロードされるため、一定のセキュリティリスクが生じます。ユーザーは以下の手段でセキュリティを強化できます：

1. Dorisは`jdbc_drivers_dir`ディレクトリ内のすべてのドライバパッケージを安全であるとみなし、それらに対してパスチェックを実行しません。管理者は、セキュリティを確保するため、このディレクトリ内のファイルを自ら管理する必要があります。

2. ドライバパッケージがローカルパスまたはHTTPパスを使用して指定される場合、Dorisは以下のチェックを実行します：

   * 許可されるドライバパッケージパスは、FE設定項目`jdbc_driver_secure_path`を介して制御されます。この設定は複数のパスを含めることができ、セミコロンで区切られます。この設定が設定されている場合、Dorisは`driver_url`パスプレフィックスが`jdbc_driver_secure_path`に含まれているかどうかをチェックします。含まれていない場合、作成は拒否されます。

     例：

     `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"`が設定されている場合、`file:///path/to/jdbc_drivers`または`http://path/to/jdbc_drivers`で始まるドライバパッケージパスのみが許可されます。

   * このパラメータはデフォルトで`*`です。空または`*`に設定されている場合、すべてのJarパッケージパスが許可されます。

3. データディレクトリを作成する際、`checksum`パラメータを使用してドライバパッケージのチェックサムを指定できます。ドライバパッケージの読み込み後、Dorisはチェックサムを検証し、検証に失敗した場合、作成は拒否されます。

### コネクションプールクリーンアップ

Dorisでは、各FEおよびBEノードは個別のデータソース接続の頻繁な開閉を避けるため、コネクションプールを維持します。プール内の各接続は、データソースとの接続確立およびクエリの実行に使用できます。タスク完了後、これらの接続は再利用のためプールに返され、これによりパフォーマンスが向上するだけでなく、接続確立のシステムオーバーヘッドが削減され、データソースの接続制限に達することを防ぐのに役立ちます。

コネクションプールのサイズは、異なるワークロードにより適応するため、実際のニーズに応じて調整できます。通常、キープアライブメカニズムが有効になっている場合に少なくとも1つの接続がアクティブなままであることを保証するため、プール内の最小接続数は1に設定すべきです。最大接続数は、過度なリソース消費を避けるため、合理的な値に設定すべきです。

BE上の未使用のコネクションプールキャッシュの蓄積を防ぐため、BE上で`jdbc_connection_pool_cache_clear_time_sec`パラメータを設定して、キャッシュクリーンアップ間隔を指定できます。デフォルト値は28,800秒（8時間）で、この時間が経過した後、BEはこの期間内に使用されていないすべてのコネクションプールキャッシュを強制的にクリアします。

### 認証情報更新

JDBC Catalogを使用して外部データソースに接続する際は、データベース認証情報の更新を慎重に行うことが重要です。

Dorisはクエリに迅速に応答するため、コネクションプールを通じてアクティブな接続を維持します。しかし、認証情報変更後、コネクションプールは古い認証情報を使い続けて新しい接続を試行し、失敗する可能性があります。システムは一定数のアクティブな接続を維持しようとするため、これらの誤った試行は繰り返され、一部のデータベースシステムでは、頻繁な失敗によりアカウントロックアウトが発生する可能性があります。

認証情報を変更する必要がある場合は、DorisのJDBC Catalog設定を同期して更新し、Dorisクラスターを再起動して、すべてのノードが最新の認証情報を使用するようにし、接続失敗や潜在的なアカウントロックアウトを防ぐことを推奨します。

発生する可能性のあるアカウントロックアウトには以下があります：

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
```
### Connection Pool トラブルシューティング

1. HikariPool Connection Timeout Error: `Connection is not available, request timed out after 5000ms`

   * 考えられる原因

     * 原因1：ネットワークの問題（例：サーバーに到達できない）

     * 原因2：無効なユーザー名やパスワードなどの認証の問題

     * 原因3：ネットワーク遅延が大きく、接続の作成が5秒のタイムアウトを超える

     * 原因4：並行クエリが多すぎて、プールに設定された最大接続数を超えている

   * 解決方法

     * エラー `Connection is not available, request timed out after 5000ms` のみが発生する場合は、原因3と4を確認してください：

       * ネットワーク遅延の増大やリソース枯渇がないか確認する。

       * プール内の最大接続数を増やす：

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```
* 接続タイムアウトを増加する:

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```
* `Connection is not available, request timed out after 5000ms` 以外に追加のエラーメッセージがある場合は、これらの追加エラーを確認してください：

       * ネットワークの問題（例：サーバーに到達できない）により接続エラーが発生する可能性があります。ネットワーク接続が安定していることを確認してください。

       * 認証の問題（例：無効なユーザー名またはパスワード）も接続エラーの原因となる可能性があります。設定内のデータベース認証情報を確認し、ユーザー名とパスワードが正しいことを確認してください。

       * 具体的なエラーメッセージに基づいて、ネットワーク、データベース、または認証に関連する問題を調査し、根本原因を特定してください。
