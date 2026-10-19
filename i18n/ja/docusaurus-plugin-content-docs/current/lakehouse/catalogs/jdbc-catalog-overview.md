---
{
    "title": "JDBC Catalog",
    "language": "ja",
    "description": "JDBC Catalog は、標準の JDBC インターフェースを通じて、JDBC プロトコルと互換性のあるデータベースへの接続をサポートします。"
}
---

JDBC Catalog は、標準の JDBC インターフェースを通じて、JDBC プロトコルと互換性のあるデータベースへの接続をサポートします。

このドキュメントでは、JDBC Catalog の一般的な設定と使用方法を説明します。JDBC データソースごとの詳細については、それぞれのドキュメントを参照してください。

:::info 注記
Doris の JDBC Catalog 機能は、データの読み取りと処理に Java レイヤーを使用するため、全体的な性能は JDK のバージョンに影響されることがあります。古いバージョンの JDK（JDK 8 など）に含まれる一部の内部ライブラリは効率が低く、リソース消費量が増える可能性があります。より高い性能が必要な場合は、標準で JDK 17 を使用してコンパイルされ、全体的な性能が向上している Doris 3.0 の使用を推奨します。
:::

## 適用シナリオ {#applicable-scenarios}

JDBC Catalog は、データソースから少量のデータを Doris にインポートする場合や、JDBC データソース内の小さなテーブルに対して結合クエリを実行する場合など、データ統合にのみ適しています。JDBC Catalog では、データソース上のクエリを高速化したり、一度に大量のデータにアクセスしたりすることはできません。

## サポート対象のデータベース {#supported-databases}

Doris JDBC Catalog は、以下のデータベースへの接続をサポートします。

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

現在サポートされていない新しい JDBC データソースへの対応を開発するには、[開発者ガイド](https://doris.apache.org/community/developer-guide/data-source-extension/jdbc-catalog-developer-guide)を参照してください。

## Catalog の設定 {#configuring-catalog}

### 構文 {#syntax}

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
      | `driver_url`     | JDBC ドライバーファイルのパス。ドライバーパッケージのセキュリティについては付録を参照してください。 | 以下の3つの指定方法をサポートします。 |
      | `driver_class`   | JDBC ドライバーのクラス名            |                               |

      `driver_url` は、次の3つの形式をサポートします。

      1. ファイル名。例: `mysql-connector-j-8.3.0.jar`。Jar ファイルは、FE と BE のデプロイディレクトリ配下にある `jdbc_drivers/` ディレクトリに、あらかじめ配置する必要があります。システムはこのディレクトリを自動的に検索します。場所は `fe.conf` と `be.conf` の `jdbc_drivers_dir` 設定で変更することもできます。

      2. ローカルの絶対パス。例: `file:///path/to/mysql-connector-j-8.3.0.jar`。Jar ファイルは、すべての FE/BE ノードの指定したパスに、あらかじめ配置する必要があります。

      3. HTTP URL。例: `https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`。システムはこの HTTP アドレスからドライバーファイルをダウンロードします。認証を必要としない HTTP サービスのみサポートします。

      4.1.5 以降では、URI スキームを含まないドライバーの場所は、`[A-Za-z0-9._-]+.jar` に一致するファイル名である必要があります。URL デコード後のパスに、親ディレクトリを示す `..` セグメントを含めることはできません。このチェックは、`ALTER CATALOG` と、Iceberg および Paimon JDBC Catalog のドライバーの場所にも適用されます。既存の安全なドライバーディレクトリと許可リストのチェックも引き続き適用されます。

  * オプションのプロパティ

      | パラメータ名                | デフォルト値 | 説明                                                                                                                                   |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | 外部データソースのデータベース名、テーブル名、カラム名を小文字で同期するかどうか                                        |
      | `meta_names_mapping`          |               | 外部データソースに `MY_TABLE` と `my_table` のように大文字と小文字だけが異なる名前がある場合、Catalog のクエリ時に曖昧さによるエラーが発生します。競合を解決するには、`meta_names_mapping` パラメータを設定する必要があります。 |
      | `only_specified_database`     | false         | `jdbc_url` で指定したデータベースのみを同期するかどうか（このデータベースは Doris のデータベースレベルに対応します）                       |
      | `connection_pool_min_size`    | 1             | 接続プールの最小接続数を定義します。プールの初期化に使用され、キープアライブが有効な場合に少なくともこの数のアクティブな接続を確保します。 |
      | `connection_pool_max_size`    | 30            | 接続プールの最大接続数を定義します。各 Catalog に対応する FE または BE ノードは、それぞれ最大でこの数の接続を保持できます。 |
      | `connection_pool_max_wait_time`| 5000         | プールに利用可能な接続がない場合、クライアントが接続を待つ最大時間をミリ秒単位で定義します。                         |
      | `connection_pool_max_life_time`| 1800000      | プール内の接続の最大有効期間をミリ秒単位で設定します。この時間を超えた接続は再利用のために回収されます。また、この値の半分がプールの最小アイドル破棄時間として使用され、この時間に達した接続は破棄の対象になります。 |
      | `connection_pool_keep_alive`  | false         | BE ノードでのみ有効です。最小アイドル破棄時間に達したものの、最大有効期間には達していない接続をアクティブな状態に保つかどうかを指定します。不要なリソース消費を抑えるため、デフォルトでは無効です。 |

* `[CommonProperties]`

  CommonProperties セクションは、共通プロパティの設定に使用します。[Catalog の概要](../catalog-overview.md)の**共通プロパティ**のセクションを参照してください。

## クエリ操作 {#query-operations}

### 基本的なクエリ {#basic-query}

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

### クエリの最適化 {#query-optimization}

#### 述語のプッシュダウン {#predicate-pushdown}

JDBC Catalog がデータソースにアクセスする際は、BE ノードを選択し、JDBC Client を使用して生成した SQL クエリをデータソースに送信し、データを取得します。そのため、性能は生成された SQL がデータソース側でどれだけ効率よく実行されるかによって決まります。Doris は述語条件をプッシュダウンし、生成する SQL に組み込もうとします。生成された SQL は `EXPLAIN SQL` 文で確認できます。

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

#### 関数のプッシュダウン {#function-pushdown}

述語条件は、Doris と外部データソースで意味や動作が異なる場合があります。そのため、Doris は以下のパラメータ変数を使用して、JDBC 外部テーブルのクエリにおける述語のプッシュダウンを制限、制御します。

> 注記: 現在、Doris が述語のプッシュダウンをサポートしているデータソースは MySQL、Clickhouse、Oracle のみです。今後、対応するデータソースを増やす予定です。

- `enable_jdbc_oracle_null_predicate_push_down`

    セッション変数です。デフォルトは `false` です。つまり、述語条件に `NULL` 値が含まれる場合、その述語は Oracle データソースにプッシュダウンされません。これは、Oracle のバージョン 21 より前では、演算子としての `NULL` がサポートされていないためです。

    このパラメータは 2.1.7 と 3.0.3 以降でサポートされています。

- `enable_jdbc_cast_predicate_push_down`

    セッション変数です。デフォルトは `false` です。つまり、述語条件に明示的または暗黙的な CAST が含まれる場合、その述語は JDBC データソースにプッシュダウンされません。CAST の動作はデータベースによって異なるため、正確性を確保する目的で、デフォルトではプッシュダウンしません。ただし、ユーザーが CAST の動作に一貫性があることを手動で確認できた場合は、このパラメータを `true` に設定することで、より多くの述語をプッシュダウンし、性能を向上させることができます。

    このパラメータは 2.1.7 と 3.0.3 以降でサポートされています。

- 関数プッシュダウンのブラックリストとホワイトリスト

    シグネチャが同じ関数でも、Doris と外部データソースでは意味が異なる場合があります。Doris には、関数プッシュダウン用のブラックリストとホワイトリストがあらかじめ定義されています。

    | データソース   | ブラックリスト | ホワイトリスト | 説明     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQL では、FE の設定項目 `jdbc_mysql_unsupported_pushdown_functions` によってブラックリストの項目を追加することもできます。例: `jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- 関数の書き換えルール

    Doris と外部データソースには、動作は同じでも名前が異なる関数があります。Doris は、関数のプッシュダウン時にこれらの関数を書き換えることをサポートしています。現在、以下の書き換えルールが組み込まれています。

    | データソース   | Doris の関数 | 変換先の関数 |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- カスタムの関数プッシュダウンと書き換えルール

    Doris は 3.0.7 より後のバージョンで、より柔軟な関数プッシュダウンと書き換えルールをサポートします。ユーザーは、Catalog のプロパティで特定の Catalog に対する関数プッシュダウンと書き換えのルールを設定できます。

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```

    `function_rules` では、以下のルールを指定できます。

    - `pushdown`

        関数のプッシュダウンルールを指定します。`supported` 配列と `unsupported` 配列には、それぞれプッシュダウンできる関数名とできない関数名を指定します。関数が両方の配列に含まれる場合は、`supported` が優先されます。

        Doris はまずシステムにあらかじめ定義されたブラックリストとホワイトリストを適用し、その後でユーザーが指定したブラックリストとホワイトリストを適用します。

    - `rewrite`

        関数の書き換えルールを定義します。上記の例では、関数名 `to_date` は `date2` に書き換えられてプッシュダウンされます。

        注記: 書き換えられるのは、プッシュダウンが許可された関数のみです。

#### 行数の制限 {#row-count-limitation}

クエリに `LIMIT` キーワードが含まれる場合、Doris は `LIMIT` 句をデータソースにプッシュダウンして、データ転送量を削減します。生成された SQL に `LIMIT` 句が含まれるかどうかは、`EXPLAIN` 文で確認できます。

## 書き込み操作 {#write-operations}

Doris は、JDBC プロトコルを介して、対応するデータソースにデータを書き戻すことをサポートしています。

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```

## ステートメントのパススルー {#statement-passthrough}

### 適用シナリオ {#applicable-scenarios-1}

Doris は、ステートメントのパススルーを通じて、JDBC データソース内で対応する DDL、DML、クエリ文を直接実行できます。この機能は、以下のシナリオに適しています。

* 複雑なクエリの性能向上

  デフォルトでは、Doris のクエリオプティマイザーが元の SQL を解析し、一定のルールに基づいてデータソースに送信する SQL を生成します。生成される SQL は通常、単純な単一テーブルのクエリであり、集約や結合クエリなどの演算子を含めることはできません。たとえば、次のクエリを考えます。

  ```sql
  SELECT smallint_u, sum(int_u)
  FROM all_types WHERE smallint_u > 10 GROUP BY smallint_u;
  ```

  最終的に生成される SQL は次のようになります。

  ```sql
  SELECT smallint_u, int_u
  FROM all_types
  WHERE smallint_u > 10;
  ```

  この場合、集約処理は Doris 内で実行されます。そのため、シナリオによっては、ネットワーク経由でデータソースから大量のデータを読み取る必要があり、クエリ効率が低下します。ステートメントのパススルーを使用すると、元の SQL をデータソースに直接渡し、データソース自体の計算能力を使って SQL を実行できるため、クエリ性能が向上します。

* 一元管理

  ステートメントのパススルー機能では、クエリ SQL に加えて DDL 文と DML 文も渡せます。これにより、ユーザーは、テーブルの作成や削除、テーブル構造の変更など、データソース上のデータベースとテーブルに対する操作を Doris から直接実行できます。

### SQL のパススルー {#passthrough-sql}

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog',
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```

`QUERY` テーブル関数は、次の2つのパラメータを取ります。

* `catalog`: Catalog の名前。対象の Catalog 名と一致する必要があります。
* `query`: 実行するクエリ文。対応するデータソースの構文で直接記述します。

### DDL と DML のパススルー {#passthrough-ddl-and-dml}

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```

`EXECUTE_STMT()` 関数は、次の2つのパラメータを取ります。

* 最初のパラメータ: Catalog の名前。現在は JDBC タイプの Catalog のみサポートしています。
* 次のパラメータ: 実行する SQL 文。現在は DDL 文と DML 文のみサポートしており、対応するデータソースの構文で記述する必要があります。

### 使用上の制限 {#usage-restrictions}

`CALL EXECUTE_STMT()` コマンドを使用すると、Doris はユーザーが記述した SQL 文を、Catalog に関連付けられた JDBC データソースに直接送信して実行します。そのため、この操作には以下の制限があります。

* SQL 文は、対応するデータソースの構文に従う必要があります。Doris は構文チェックや意味チェックを行いません。

* SQL 文で参照するテーブル名には、`db.tbl` のような完全修飾名を使用することを推奨します。データベースを指定しない場合は、JDBC Catalog の JDBC URL に含まれるデータベース名が使用されます。

* SQL 文から、JDBC データソース外のデータベースやテーブル、Doris のデータベースやテーブルを参照することはできません。ただし、Doris JDBC Catalog に同期されていない JDBC データソース内のテーブルは参照できます。

* DML 文の実行時、挿入、更新、削除された行数は取得できません。コマンドの成功または失敗のみを確認できます。

* Catalog に対する `LOAD` 権限を持つユーザーのみが、`CALL EXECUTE_STMT()` コマンドを実行できます。

* Catalog に対する `SELECT` 権限を持つユーザーのみが、`query()` テーブル関数を実行できます。

* Catalog の作成時に指定した JDBC ユーザーには、対応する文を実行するために必要なデータソース側の権限が必要です。

* `query()` テーブル関数が読み取る結果のデータ型は、クエリ対象の Catalog タイプがサポートするデータ型と一致します。

## 付録 {#appendix}

### 大文字と小文字の区別に関する設定 {#case-sensitivity-settings}


デフォルトでは、Doris のデータベース名とテーブル名では大文字と小文字が区別されますが、カラム名では区別されません。この動作は設定パラメータで変更できます。また、一部の JDBC データソースでは、データベース名、テーブル名、カラム名の大文字と小文字の区別に関するルールが Doris と異なる場合があります。この違いにより、JDBC Catalog を介した名前のマッピング時に競合が発生することがあります。以下では、そのような問題の解決方法を説明します。

#### 表示名とクエリ名 {#display-name-and-query-name}

Doris では、オブジェクト名（ここではテーブル名を例にします）を**表示名**と**クエリ名**に分けて考えることができます。テーブル名の場合、**表示名**は `SHOW TABLES` の結果に表示される名前、**クエリ名**は `SELECT` 文で使用できる名前です。

たとえば、テーブルの実際の名前が `MyTable` の場合、このテーブルの**表示名**と**クエリ名**は、Frontend（FE）のパラメータ `lower_case_table_names` の設定によって異なります。

| 設定 | 説明 | 実際の名前 | 表示名 | クエリ名 |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | デフォルト設定。元の名前で保存・表示され、クエリでは大文字と小文字が区別されます。 | `MyTable` | `MyTable` | クエリでは大文字と小文字が区別されるため、`MyTable` を使用する必要があります。 |
| `lower_case_table_names=1` | 名前は小文字で保存・表示され、クエリでは大文字と小文字が区別されません。 | `MyTable` | `mytable` | クエリでは大文字と小文字が区別されず、`MyTable` または `mytable` などを使用できます。 |
| `lower_case_table_names=2` | 元の名前で保存・表示されますが、クエリでは大文字と小文字が区別されません。 | `MyTable` | `MyTable` | クエリでは大文字と小文字が区別されず、`MyTable` または `mytable` などを使用できます。 |

#### JDBC Catalog における名前の大文字と小文字の区別に関するルール {#jdbc-catalog-name-case-sensitivity-rules}

Doris 自体で大文字と小文字の区別に関するルールを設定できるのは、**テーブル名**についてのみです。ただし、JDBC Catalog では**データベース名**と**カラム名**も追加で扱う必要があります。そのため、Catalog の追加プロパティ `lower_case_meta_names` を `lower_case_table_names` と組み合わせて使用します。

| 設定 | 説明 |
| --- | --- |
| `lower_case_meta_names` | Catalog の作成時に `properties` で指定し、その Catalog にのみ適用されます。デフォルト値は `false` です。`true` に設定すると、Doris はすべてのデータベース名、テーブル名、カラム名を小文字に変換して保存・表示します。Doris でクエリを実行する際は、小文字の名前を使用する必要があります。 |
| `lower_case_table_names` | `fe.conf` で設定する Frontend（FE）の設定項目で、クラスター全体に適用されます。デフォルト値は `0` です。 |

> 注記: `lower_case_meta_names = true` の場合、`lower_case_table_names` の設定は無視され、すべてのデータベース名、テーブル名、カラム名が小文字に変換されます。

`lower_case_meta_names`（true/false）と `lower_case_table_names`（0/1/2）の組み合わせに応じた、データベース名、テーブル名、カラム名の**保存**時と**クエリ**時の動作を以下の表に示します（「元の表記」は外部データソースでの大文字と小文字を維持すること、「小文字」は自動的に小文字に変換すること、「大文字・小文字を問わない」はクエリで任意の大文字・小文字を使用できることを意味します）。

| `lower_case_table_names` & `lower_case_meta_names` | データベースの表示名 | テーブルの表示名 | カラムの表示名 | データベースのクエリ名 | テーブルのクエリ名 | カラムのクエリ名 |
| -------------------------------------------------- | --------------------- | ------------------ | ------------------- | ------------------- | ---------------- | ----------------- |
| `0 & false`                                       | 元の表記              | 元の表記           | 元の表記            | 元の表記            | 元の表記         | 大文字・小文字を問わない          |
| `0 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 小文字        | 大文字・小文字を問わない          |
| `1 & false`                                       | 元の表記              | 小文字          | 元の表記            | 元の表記            | 大文字・小文字を問わない         | 大文字・小文字を問わない          |
| `1 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 大文字・小文字を問わない         | 大文字・小文字を問わない          |
| `2 & false`                                       | 元の表記              | 元の表記           | 元の表記            | 元の表記            | 大文字・小文字を問わない         | 大文字・小文字を問わない          |
| `2 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 大文字・小文字を問わない         | 大文字・小文字を問わない          |

#### 大文字と小文字による競合のチェック {#case-conflict-check}

JDBC Catalog を介して名前をマッピングする際、名前の競合が発生することがあります。たとえば、データソースのカラム名で大文字と小文字が区別され、`ID` と `id` というカラムが両方存在するとします。`lower_case_meta_names = true` を設定すると、小文字への変換後にこの2つのカラムが競合します。Doris は、以下のルールに従って競合をチェックします。

* どのような場合でも、Doris は**カラム名**の大文字と小文字による競合をチェックします（例: `id` と `ID` が同時に存在するかどうか）。

* `lower_case_meta_names = true` の場合、Doris はデータベース名、テーブル名、カラム名の大文字と小文字による競合をチェックします（例: `DORIS` と `doris` が同時に存在するかどうか）。

* `lower_case_meta_names = false` で、`lower_case_table_names` が `1` または `2` に設定されている場合、Doris は**テーブル名**の競合をチェックします（例: `orders` と `ORDERS` が同時に存在するかどうか）。

* `lower_case_table_names = 0` の場合、データベース名とテーブル名では大文字と小文字が区別されるため、追加の変換は必要ありません。

#### 大文字と小文字による競合の解決方法 {#solutions-to-case-conflicts}

競合が発生すると Doris はエラーを出すため、以下の方法で競合を解決する必要があります。

データベース、テーブル、カラムの名前が大文字と小文字だけ異なるために（例: `DORIS` と `doris`）、Doris がそれらを正しく区別できない場合は、Catalog の `meta_names_mapping` を設定して手動でマッピングを指定することで、競合を解決できます。

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

### ドライバーパッケージのセキュリティ {#driver-package-security}

ドライバーパッケージはユーザーが Doris クラスターにアップロードするため、一定のセキュリティリスクがあります。ユーザーは以下の対策でセキュリティを強化できます。

1. Doris は `jdbc_drivers_dir` ディレクトリ内のすべてのドライバーパッケージを安全と見なし、パスのチェックを行いません。管理者は、このディレクトリ内のファイルを自ら管理し、安全性を確保する必要があります。

2. ローカルパスまたは HTTP パスでドライバーパッケージを指定した場合、Doris は以下のチェックを行います。

   * 許可されるドライバーパッケージのパスは、FE の設定項目 `jdbc_driver_secure_path` で制御します。この設定には、セミコロンで区切って複数のパスを含めることができます。この設定が指定されている場合、Doris は `driver_url` のパスのプレフィックスが `jdbc_driver_secure_path` に含まれているかどうかを確認します。含まれていない場合、作成は拒否されます。

     例:

     `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"` を設定した場合、`file:///path/to/jdbc_drivers` または `http://path/to/jdbc_drivers` で始まるドライバーパッケージのパスのみが許可されます。

   * このパラメータのデフォルトは `*` です。空の場合、または `*` に設定されている場合、すべての Jar パッケージのパスが許可されます。

3. データディレクトリの作成時には、`checksum` パラメータでドライバーパッケージのチェックサムを指定できます。Doris はドライバーパッケージの読み込み後にチェックサムを検証し、検証に失敗した場合は作成を拒否します。

### 接続プールのクリーンアップ {#connection-pool-cleanup}

Doris では、個々のデータソース接続を頻繁に開閉することを避けるため、各 FE ノードと BE ノードが接続プールを維持します。プール内の各接続を使用してデータソースに接続し、クエリを実行できます。タスクが完了すると、接続は再利用のためにプールへ返されます。これにより性能が向上するだけでなく、接続確立に伴うシステムのオーバーヘッドが減り、データソースの接続数の上限に達することも防ぎやすくなります。

接続プールのサイズは、実際のニーズに応じて調整し、さまざまなワークロードに対応できます。通常、キープアライブ機構が有効な場合に少なくとも接続を維持できるよう、プールの最小接続数を 1 に設定します。最大接続数は、過剰なリソース消費を避けられる妥当な値に設定します。

BE 上で未使用の接続プールキャッシュが蓄積するのを防ぐには、BE の `jdbc_connection_pool_cache_clear_time_sec` パラメータでキャッシュのクリーンアップ間隔を指定します。デフォルト値は 28,800 秒（8 時間）で、この時間内に使用されなかった接続プールキャッシュは、BE によってすべて強制的に削除されます。

### 認証情報の更新 {#credential-update}

JDBC Catalog を使用して外部データソースに接続する場合は、データベースの認証情報を慎重に更新することが重要です。

Doris はクエリにすばやく応答できるよう、接続プールを通じてアクティブな接続を維持します。しかし、認証情報の変更後も、接続プールが古い認証情報で新たな接続を試み、失敗する場合があります。システムは一定数のアクティブな接続を維持しようとするため、この誤った試行が繰り返されます。データベースシステムによっては、失敗が頻発するとアカウントがロックされる可能性があります。

認証情報を変更する必要がある場合は、Doris JDBC Catalog の設定も同時に更新し、Doris クラスターを再起動することを推奨します。これにより、すべてのノードが最新の認証情報を使用し、接続失敗やアカウントのロックを防げます。

発生する可能性があるアカウントのロックには、次のようなものがあります。

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
```

### 接続プールのトラブルシューティング {#connection-pool-troubleshooting}

1. HikariPool の接続タイムアウトエラー: `Connection is not available, request timed out after 5000ms`

   * 考えられる原因

     * 原因 1: ネットワークの問題（サーバーに到達できないなど）

     * 原因 2: ユーザー名やパスワードが無効であるなど、認証の問題

     * 原因 3: ネットワーク遅延が大きく、接続の作成に5秒のタイムアウト時間を超えてかかる

     * 原因 4: 同時実行クエリが多すぎて、プールに設定された最大接続数を超えている

   * 解決方法

     * `Connection is not available, request timed out after 5000ms` エラーだけが発生する場合は、原因 3 と 4 を確認してください。

       * ネットワーク遅延が大きいか、リソースが枯渇していないかを確認します。

       * プールの最大接続数を増やします。

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```

       * 接続タイムアウト時間を延ばします。

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```

     * `Connection is not available, request timed out after 5000ms` に加えて別のエラーメッセージがある場合は、そのエラーも確認してください。

       * ネットワークの問題（サーバーに到達できないなど）が接続失敗の原因になることがあります。ネットワーク接続が安定していることを確認します。

       * 認証の問題（ユーザー名やパスワードが無効であるなど）も接続失敗の原因になることがあります。設定内のデータベース認証情報を確認し、ユーザー名とパスワードが正しいことを確かめます。

       * 具体的なエラーメッセージに基づいて、ネットワーク、データベース、認証に関連する問題を調査し、根本原因を特定します。
