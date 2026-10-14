---
{
    "title": "JDBC Catalog",
    "language": "ja",
    "description": "JDBC Catalog は、標準の JDBC インターフェースを介して JDBC プロトコルと互換性のあるデータベースへの接続をサポートします。"
}
---

JDBC Catalog は、標準の JDBC インターフェースを介して JDBC プロトコルと互換性のあるデータベースへの接続をサポートします。

このドキュメントでは、JDBC Catalog の一般的な設定と使用方法を説明します。個々の JDBC データソースについては、それぞれのドキュメントを参照してください。

:::info 注意
Doris の JDBC Catalog 機能は、データの読み取りと処理を Java レイヤーに依存しているため、全体的な性能が JDK のバージョンに影響される場合があります。古いバージョンの JDK（JDK 8 など）では、一部の内部ライブラリの効率が低く、リソース消費量が増える可能性があります。より高い性能が必要な場合は、デフォルトで JDK 17 を使用してコンパイルされ、全体的な性能が向上している Doris 3.0 の使用を推奨します。
:::

## 適用シナリオ

JDBC Catalog は、データソースから少量のデータを Doris にインポートする場合や、JDBC データソース内の小さなテーブルに対して結合クエリを実行する場合など、データ統合にのみ適しています。JDBC Catalog では、データソース側のクエリを高速化したり、一度に大量のデータにアクセスしたりすることはできません。

## サポート対象のデータベース

Doris JDBC Catalog は、次のデータベースへの接続をサポートします。

| サポート対象のデータソース |
| ---------------------------------- |
| [ MySQL](./jdbc-mysql-catalog.md)      |
| [ PostgreSQL](./jdbc-pg-catalog.md) |
| [ Oracle](./jdbc-oracle-catalog.md)     |
| [ SQL Server](./jdbc-sqlserver-catalog.md) |
| [ IBM DB2](./jdbc-ibmdb2-catalog.md)    |
| [ ClickHouse](./jdbc-clickhouse-catalog.md) |
| [ SAP HANA](./jdbc-saphana-catalog.md)   |
| [ Oceanbase](./jdbc-oceanbase-catalog.md) |

未サポートの新しい JDBC データソースへの対応を開発するには、[開発者ガイド](https://doris.apache.org/community/developer-guide/data-source-extension/jdbc-catalog-developer-guide)を参照してください。

## Catalog の設定

### 構文

```sql
CREATE CATALOG [IF NOT EXISTS] catalog_name PROPERTIES (
    'type' = 'jdbc', -- required
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
      | `jdbc_url`       | データソースへの接続 URL               | `jdbc:mysql://host:3306`      |
      | `driver_url`     | JDBC ドライバーファイルのパス。ドライバーパッケージのセキュリティについては付録を参照してください。 | 次の三つの指定方法をサポートします。 |
      | `driver_class`   | JDBC ドライバーのクラス名            |                               |

      `driver_url` は、次の三つの方法で指定できます。
    
      1. ファイル名。例：`mysql-connector-j-8.3.0.jar`。Jar ファイルを、FE と BE のデプロイディレクトリにある `jdbc_drivers/` ディレクトリにあらかじめ配置する必要があります。システムはこのディレクトリを自動的に検索します。場所は `jdbc_drivers_dir` 設定を使用して、`fe.conf` と `be.conf` で変更することもできます。
      
      2. ローカルの絶対パス。例：`file:///path/to/mysql-connector-j-8.3.0.jar`。Jar ファイルを、すべての FE/BE ノードの指定されたパスにあらかじめ配置する必要があります。
      
      3. HTTP URL。例：`https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`。システムはこの HTTP アドレスからドライバーファイルをダウンロードします。認証のない HTTP サービスのみをサポートします。

  * オプションのプロパティ

      | パラメータ名                | デフォルト値 | 説明                                                                                                                                   |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | 外部データソースのデータベース名、テーブル名、カラム名を小文字で同期するかどうか                                        |
      | `meta_names_mapping`          |               | 外部データソースに `MY_TABLE` と `my_table` のように大文字と小文字だけが異なる名前がある場合、Catalog へのクエリ時に名前を区別できず、Doris はエラーを報告します。競合を解消するには `meta_names_mapping` パラメータを設定する必要があります。 |
      | `only_specified_database`     | false         | `jdbc_url` で指定されたデータベースのみを同期するかどうか（このデータベースは Doris のデータベースレベルに対応します）                       |
      | `connection_pool_min_size`    | 1             | コネクションプール内の接続数の最小値を定義します。プールの初期化に使用され、キープアライブが有効な場合に少なくともこの数のアクティブな接続を確保します。 |
      | `connection_pool_max_size`    | 30            | コネクションプール内の接続数の最大値を定義します。各 Catalog に対応する FE または BE ノードは、それぞれ最大でこの数の接続を保持できます。 |
      | `connection_pool_max_wait_time`| 5000         | プールに利用可能な接続がない場合に、クライアントが接続を待つ最大時間をミリ秒単位で定義します。                         |
      | `connection_pool_max_life_time`| 1800000      | プール内の接続の最大存続時間をミリ秒単位で設定します。この時間を超えた接続は再利用対象から外されます。また、この値の半分がプールの最小アイドル削除時間として使用され、この時間に達した接続は削除の対象になります。 |
      | `connection_pool_keep_alive`  | false         | BE ノードでのみ有効です。最小アイドル削除時間に達したものの、最大存続時間には達していない接続をアクティブな状態に保つかどうかを指定します。不要なリソース消費を抑えるため、デフォルトでは無効です。 |
        
* `[CommonProperties]`

  CommonProperties セクションは、共通プロパティの設定に使用します。[Catalog の概要](../catalog-overview.md)の「共通プロパティ」を参照してください。

## クエリ操作

### 基本的なクエリ

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

#### 述語プッシュダウン

JDBC Catalog がデータソースにアクセスする際は、BE ノードを一つ選び、JDBC Client を使用して生成した SQL クエリをデータソースに送信し、データを取得します。そのため、性能は生成された SQL がデータソース側でどれだけ効率的に実行されるかに依存します。Doris は述語条件をプッシュダウンし、生成する SQL に組み込もうとします。生成された SQL は `EXPLAIN SQL` ステートメントで確認できます。

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

#### 関数プッシュダウン

述語条件の意味や動作は、Doris と外部データソースで異なる場合があります。そのため、Doris は次のパラメータ変数を使用して、JDBC 外部テーブルのクエリにおける述語プッシュダウンを制限および制御します。

> 注意：現在、Doris が述語プッシュダウンをサポートするデータソースは MySQL、Clickhouse、Oracle のみです。今後、対応するデータソースを追加する予定です。

- `enable_jdbc_oracle_null_predicate_push_down`

    セッション変数です。デフォルトは `false` です。つまり、述語条件に `NULL` 値が含まれる場合、その述語は Oracle データソースにプッシュダウンされません。これは、Oracle 21 より前のバージョンでは `NULL` を演算子としてサポートしていないためです。

    このパラメータは 2.1.7 と 3.0.3 以降でサポートされます。

- `enable_jdbc_cast_predicate_push_down`

    セッション変数です。デフォルトは `false` です。つまり、述語条件に明示的または暗黙的な CAST がある場合、その述語は JDBC データソースにプッシュダウンされません。CAST の動作はデータベースによって異なるため、正確性を確保する目的で、デフォルトでは CAST をプッシュダウンしません。ただし、ユーザーが CAST の動作が一致することを確認できた場合は、このパラメータを `true` に設定すると、より多くの述語をプッシュダウンして性能を向上できます。

    このパラメータは 2.1.7 と 3.0.3 以降でサポートされます。

- 関数プッシュダウンのブラックリストとホワイトリスト

    同じシグネチャを持つ関数でも、Doris と外部データソースで意味が異なる場合があります。Doris には、関数プッシュダウン用のブラックリストとホワイトリストが事前定義されています。

    | データソース   | ブラックリスト | ホワイトリスト | 説明     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQL では FE 設定項目 `jdbc_mysql_unsupported_pushdown_functions` でブラックリストの項目を追加できます。例：`jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- 関数の書き換えルール

    Doris と外部データソースで動作は同じでも名前が異なる関数があります。Doris は関数のプッシュダウン時に、これらの関数の書き換えをサポートします。現在、次の書き換えルールが組み込まれています。

    | データソース   | Doris の関数 | 対象の関数 |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- カスタムの関数プッシュダウンと書き換えルール

    3.0.7 より後のバージョンでは、Doris はより柔軟な関数プッシュダウンと書き換えルールをサポートします。ユーザーは Catalog のプロパティで、その Catalog に対する関数プッシュダウンと書き換えルールを設定できます。

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```

    `function_rules` では、次のルールを指定できます。

    - `pushdown`

        関数プッシュダウンのルールを指定します。`supported` と `unsupported` の配列には、それぞれプッシュダウン可能な関数名と不可能な関数名を指定します。関数が両方の配列に存在する場合は、`supported` が優先されます。

        Doris はまずシステムで事前定義されたブラックリストとホワイトリストを適用し、その後にユーザー指定のブラックリストとホワイトリストを適用します。

    - `rewrite`

        関数の書き換えルールを定義します。上の例では、関数名 `to_date` が `date2` に書き換えられてプッシュダウンされます。

        注意：書き換えは、プッシュダウンが許可されている関数にのみ適用されます。

#### 行数の制限

クエリに `LIMIT` キーワードが含まれる場合、Doris は `LIMIT` 句をデータソースにプッシュダウンしてデータ転送量を減らします。`EXPLAIN` ステートメントを使用すると、生成された SQL に `LIMIT` 句が含まれるかどうかを確認できます。

## 書き込み操作

Doris は、JDBC プロトコルを介して対応するデータソースにデータを書き戻すことをサポートします。

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```

## ステートメントのパススルー

### 適用シナリオ

Doris は、ステートメントのパススルーによって、JDBC データソースで対応する DDL、DML、クエリステートメントを直接実行できます。この機能は、次のシナリオに適しています。

* 複雑なクエリの性能向上

  デフォルトでは、Doris のクエリオプティマイザーが元の SQL を解析し、一定のルールに基づいてデータソースに送信する SQL を生成します。生成される SQL は通常、単純な単一テーブルのクエリであり、集約や結合などの演算は含められません。たとえば、次のクエリを考えます。

  ```sql
  SELECT smallint_u, sum(int_u)
  FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;
  ```

  最終的に生成される SQL は次のとおりです。

  ```sql
  SELECT smallint_u, int_u 
  FROM all_types
  WHERE smallint_u > 10;
  ```

  この場合、集約処理は Doris 内で行われます。そのため、シナリオによっては大量のデータをネットワーク経由でデータソースから読み取る必要があり、クエリの効率が低下します。ステートメントのパススルーを使用すると、元の SQL をデータソースに直接渡し、データソース側の計算能力を使用して SQL を実行できるため、クエリ性能を向上できます。

* 一元管理

  ステートメントのパススルー機能では、クエリ SQL に加えて DDL および DML ステートメントも渡せます。これにより、ユーザーは Doris を介して、テーブルの作成や削除、テーブル構造の変更など、データソース上のデータベースやテーブルを直接操作できます。

### SQL クエリのパススルー

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog', 
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```

`QUERY` テーブル関数は、次の二つのパラメータを受け取ります。

* `catalog`：Catalog の名前。Catalog 名と一致している必要があります。
* `query`：実行するクエリステートメント。対応するデータソースの構文をそのまま使用して記述します。

### DDL と DML のパススルー

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```

`EXECUTE_STMT()` 関数は、次の二つのパラメータを受け取ります。

* 最初のパラメータ：Catalog の名前。現在は JDBC タイプの Catalog のみをサポートします。
* 二番目のパラメータ：実行する SQL ステートメント。現在は DDL と DML ステートメントのみをサポートし、対応するデータソースの構文で記述する必要があります。

### 使用上の制約

`CALL EXECUTE_STMT()` コマンドを使用すると、Doris はユーザーが記述した SQL ステートメントを、Catalog に関連付けられた JDBC データソースに直接送信して実行します。そのため、この操作には次の制約があります。

* SQL ステートメントは、対応するデータソースの構文に従う必要があります。Doris は構文や意味の検査を行いません。

* SQL ステートメント内で参照するテーブル名には、`db.tbl` のような完全修飾名を使用することを推奨します。データベースを指定しない場合は、JDBC Catalog の JDBC URL に含まれるデータベース名が使用されます。

* SQL ステートメントでは、JDBC データソース以外のデータベースやテーブル、および Doris のデータベースやテーブルを参照できません。ただし、JDBC データソース内にある、Doris JDBC Catalog に同期されていないテーブルは参照できます。

* DML ステートメントの実行時には、挿入、更新、削除された行数を取得できません。コマンドの成功または失敗のみを確認できます。

* Catalog に対する `LOAD` 権限を持つユーザーのみが、`CALL EXECUTE_STMT()` コマンドを実行できます。

* Catalog に対する `SELECT` 権限を持つユーザーのみが、`query()` テーブル関数を実行できます。

* Catalog の作成時に指定した JDBC ユーザーには、対応するステートメントをデータソースで実行するために必要な権限が必要です。

* `query()` テーブル関数が読み取る結果のデータ型は、クエリ対象の Catalog タイプがサポートするデータ型に従います。

## 付録

### 大文字と小文字の区別に関する設定


デフォルトでは、Doris のデータベース名とテーブル名では大文字と小文字が区別され、カラム名では区別されません。この動作は設定パラメータで変更できます。また、一部の JDBC データソースでは、データベース名、テーブル名、カラム名に関する大文字と小文字の区別のルールが Doris と異なる場合があります。この違いにより、JDBC Catalog を介して名前をマッピングする際に競合が発生することがあります。以下では、その解決方法を説明します。

#### 表示名とクエリ名

Doris では、オブジェクト名（ここではテーブル名を例とします）を**表示名**と**クエリ名**に分けて考えることができます。テーブル名の場合、**表示名**は `SHOW TABLES` の結果に表示される名前を指し、**クエリ名**は `SELECT` ステートメントで使用できる名前を指します。

たとえば、テーブルの実際の名前が `MyTable` の場合、このテーブルの**表示名**と**クエリ名**は、Frontend（FE）の `lower_case_table_names` パラメータの設定によって次のように異なります。

| 設定 | 説明 | 実際の名前 | 表示名 | クエリ名 |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | デフォルト設定。元の名前で保存および表示し、クエリでは大文字と小文字を区別します。 | `MyTable` | `MyTable` | クエリでは大文字と小文字を区別するため、`MyTable` を使用する必要があります。 |
| `lower_case_table_names=1` | 名前を小文字で保存および表示し、クエリでは大文字と小文字を区別しません。 | `MyTable` | `mytable` | クエリでは大文字と小文字を区別しません。たとえば、`MyTable` または `mytable` を使用できます。 |
| `lower_case_table_names=2` | 元の名前で保存および表示しますが、クエリでは大文字と小文字を区別しません。 | `MyTable` | `MyTable` | クエリでは大文字と小文字を区別しません。たとえば、`MyTable` または `mytable` を使用できます。 |

#### JDBC Catalog における名前の大文字と小文字の区別

Doris 自体で大文字と小文字の区別のルールを設定できるのは、**テーブル名**のみです。ただし、JDBC Catalog では**データベース名**と**カラム名**にも追加の処理が必要です。そのため、追加の Catalog プロパティ `lower_case_meta_names` が用意されており、`lower_case_table_names` と組み合わせて使用します。

| 設定 | 説明 |
| --- | --- |
| `lower_case_meta_names` | Catalog の作成時に `properties` で指定し、その Catalog にのみ適用されます。デフォルト値は `false` です。`true` に設定すると、Doris はすべてのデータベース名、テーブル名、カラム名を小文字に変換して保存および表示します。Doris でのクエリには小文字の名前を使用する必要があります。 |
| `lower_case_table_names` | `fe.conf` で設定する Frontend（FE）の設定項目で、クラスター全体に適用されます。デフォルト値は `0` です。 |

> 注意：`lower_case_meta_names = true` の場合、`lower_case_table_names` の設定は無視され、すべてのデータベース名、テーブル名、カラム名が小文字に変換されます。

`lower_case_meta_names`（true/false）と `lower_case_table_names`（0/1/2）の組み合わせごとに、**保存**時と**クエリ**時のデータベース名、テーブル名、カラム名の動作を次の表に示します（「元の表記」は外部データソースの大文字と小文字を保持すること、「小文字」は自動的に小文字へ変換すること、「任意の表記」はクエリで大文字と小文字を区別しないことを意味します）。

| `lower_case_table_names` & `lower_case_meta_names` | データベースの表示名 | テーブルの表示名 | カラムの表示名 | データベースのクエリ名 | テーブルのクエリ名 | カラムのクエリ名 |
| -------------------------------------------------- | --------------------- | ------------------ | ------------------- | ------------------- | ---------------- | ----------------- |
| `0 & false`                                       | 元の表記              | 元の表記           | 元の表記            | 元の表記            | 元の表記         | 任意の表記          |
| `0 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 小文字        | 任意の表記          |
| `1 & false`                                       | 元の表記              | 小文字          | 元の表記            | 元の表記            | 任意の表記         | 任意の表記          |
| `1 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の表記         | 任意の表記          |
| `2 & false`                                       | 元の表記              | 元の表記           | 元の表記            | 元の表記            | 任意の表記         | 任意の表記          |
| `2 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の表記         | 任意の表記          |

#### 大文字と小文字の競合チェック

JDBC Catalog を介して名前をマッピングする際に、名前の競合が発生することがあります。たとえば、データソースのカラム名で大文字と小文字が区別され、`ID` と `id` という二つのカラムがある場合です。`lower_case_meta_names = true` を設定すると、これらのカラムは小文字に変換された後に競合します。Doris は次のルールに従って競合をチェックします。

* Doris は、どのような場合でも**カラム名**の大文字と小文字による競合（たとえば、`id` と `ID` が同時に存在するかどうか）をチェックします。

* `lower_case_meta_names = true` の場合、Doris はデータベース名、テーブル名、カラム名の大文字と小文字による競合（たとえば、`DORIS` と `doris` が同時に存在するかどうか）をチェックします。

* `lower_case_meta_names = false` かつ `lower_case_table_names` が `1` または `2` の場合、Doris は**テーブル名**の競合（たとえば、`orders` と `ORDERS` が同時に存在するかどうか）をチェックします。

* `lower_case_table_names = 0` の場合、データベース名とテーブル名では大文字と小文字が区別され、追加の変換は必要ありません。

#### 大文字と小文字による競合の解決方法

競合が発生すると Doris はエラーを返します。競合は次の方法で解消する必要があります。

データベース、テーブル、カラムの名前が大文字と小文字だけ異なり（例：`DORIS` と `doris`）、Doris がそれらを適切に区別できない場合は、Catalog に `meta_names_mapping` を設定し、手動でマッピングを指定することで競合を解消できます。

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

ドライバーパッケージはユーザーが Doris クラスターにアップロードするため、一定のセキュリティリスクがあります。次の対策でセキュリティを強化できます。

1. Doris は `jdbc_drivers_dir` ディレクトリ内のすべてのドライバーパッケージを安全なものとみなし、パスのチェックを行いません。管理者は、このディレクトリ内のファイルを自ら管理し、安全性を確保する必要があります。

2. ローカルパスまたは HTTP パスでドライバーパッケージを指定した場合、Doris は次のチェックを行います。

   * 許可されるドライバーパッケージのパスは、FE 設定項目 `jdbc_driver_secure_path` で制御します。この設定には、セミコロンで区切って複数のパスを指定できます。設定されている場合、Doris は `driver_url` のパスのプレフィックスが `jdbc_driver_secure_path` に含まれるかを確認します。含まれない場合は作成を拒否します。

     例：

     `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"` と設定した場合、`file:///path/to/jdbc_drivers` または `http://path/to/jdbc_drivers` で始まるドライバーパッケージのパスのみが許可されます。

   * このパラメータのデフォルト値は `*` です。空の場合、または `*` に設定されている場合は、すべての Jar パッケージのパスが許可されます。

3. データディレクトリの作成時に、`checksum` パラメータを使用してドライバーパッケージのチェックサムを指定できます。ドライバーパッケージの読み込み後、Doris はチェックサムを検証し、検証に失敗すると作成を拒否します。

### コネクションプールのクリーンアップ

Doris では、各 FE ノードと BE ノードがコネクションプールを維持し、データソースへの接続を頻繁に開閉しないようにします。プール内の各接続を使用してデータソースに接続し、クエリを実行できます。タスクの完了後、接続は再利用のためにプールへ返されます。これにより性能が向上し、接続確立に伴うシステムのオーバーヘッドが減り、データソースの接続数の上限に達するのを防ぐことにも役立ちます。

コネクションプールのサイズは、さまざまなワークロードに対応できるよう、実際の必要に応じて調整できます。通常、キープアライブが有効な場合に少なくとも一つの接続をアクティブに保てるよう、プール内の最小接続数は 1 に設定します。過度のリソース消費を避けるため、最大接続数は適切な値に設定します。

BE 上で未使用のコネクションプールキャッシュが蓄積するのを防ぐため、BE の `jdbc_connection_pool_cache_clear_time_sec` パラメータでキャッシュのクリーンアップ間隔を指定できます。デフォルト値は 28,800 秒（8 時間）です。この時間内に使用されなかったコネクションプールキャッシュは、BE によって強制的にすべて削除されます。

### 認証情報の更新

JDBC Catalog を使用して外部データソースに接続する場合は、データベースの認証情報を慎重に更新する必要があります。

Doris は、クエリにすばやく応答できるよう、コネクションプールでアクティブな接続を維持します。ただし、認証情報の変更後も、コネクションプールが古い認証情報を使用して新しい接続を試み、失敗する場合があります。システムは一定数のアクティブな接続を維持しようとするため、この失敗が繰り返されます。データベースシステムによっては、失敗が頻発するとアカウントがロックされる可能性があります。

認証情報を変更する必要がある場合は、Doris JDBC Catalog の設定も同時に更新し、Doris クラスターを再起動することを推奨します。これにより、すべてのノードが最新の認証情報を使用するようになり、接続の失敗やアカウントのロックを防げます。

アカウントがロックされた場合のメッセージの例：

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
```

### コネクションプールのトラブルシューティング

1. HikariPool の接続タイムアウトエラー：`Connection is not available, request timed out after 5000ms`

   * 考えられる原因

     * 原因 1：ネットワークの問題（サーバーに到達できないなど）

     * 原因 2：ユーザー名やパスワードが無効であるなどの認証の問題

     * 原因 3：ネットワーク遅延が大きく、接続の作成に 5 秒のタイムアウトを超える時間がかかっている

     * 原因 4：同時実行クエリが多く、プールに設定された最大接続数を超えている

   * 解決方法

     * `Connection is not available, request timed out after 5000ms` というエラーだけが発生している場合は、原因 3 と 4 を確認してください。

       * ネットワーク遅延が大きくないか、またはリソースが枯渇していないかを確認します。

       * プール内の最大接続数を増やします。

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```

       * 接続のタイムアウト時間を延ばします。

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```

     * `Connection is not available, request timed out after 5000ms` 以外のエラーメッセージも表示される場合は、それらのエラーも確認してください。

       * ネットワークの問題（サーバーに到達できないなど）によって接続が失敗する場合があります。ネットワーク接続が安定していることを確認します。

       * 認証の問題（ユーザー名やパスワードが無効であるなど）によって接続が失敗する場合もあります。設定内のデータベース認証情報を確認し、ユーザー名とパスワードが正しいことを確かめます。

       * 個々のエラーメッセージをもとに、ネットワーク、データベース、認証に関連する問題を調査し、根本原因を特定します。
