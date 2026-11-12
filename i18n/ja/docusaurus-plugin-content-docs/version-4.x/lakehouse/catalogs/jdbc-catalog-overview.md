---
{
    "title": "JDBC Catalog",
    "language": "ja",
    "description": "JDBC Catalog は、標準の JDBC インターフェースを通じて、JDBC プロトコルと互換性のあるデータベースへの接続をサポートします。"
}
---

JDBC Catalog は、標準の JDBC インターフェースを通じて、JDBC プロトコルと互換性のあるデータベースへの接続をサポートします。

このドキュメントでは、JDBC Catalog の一般的な設定方法と使用方法を説明します。JDBC データソースごとの詳細については、それぞれのドキュメントを参照してください。

:::info 注意
Doris の JDBC Catalog 機能は、データの読み取りと処理を Java レイヤーに依存しているため、全体的なパフォーマンスは JDK のバージョンの影響を受けることがあります。古いバージョンの JDK（JDK 8 など）では、一部の内部ライブラリの効率が低く、リソース消費量が増える可能性があります。より高いパフォーマンスが必要な場合は、デフォルトで JDK 17 を使用してコンパイルされ、全体的なパフォーマンスが向上している Doris 3.0 の使用を推奨します。
:::

## 適用シナリオ {#applicable-scenarios}

JDBC Catalog は、データソースから少量のデータを Doris にインポートしたり、JDBC データソース内の小さなテーブルに対して結合クエリを実行したりするなど、データ統合にのみ適しています。JDBC Catalog を使用しても、データソース側のクエリを高速化したり、一度に大量のデータにアクセスしたりすることはできません。

## サポート対象のデータベース {#supported-databases}

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

まだサポートされていない新しい JDBC データソースへの対応を開発するには、[開発者ガイド](https://doris.apache.org/community/developer-guide/data-source-extension/jdbc-catalog-developer-guide)を参照してください。

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
      | `jdbc_url`       | データソースの接続 URL               | `jdbc:mysql://host:3306`      |
      | `driver_url`     | JDBC ドライバーファイルのパス。ドライバーパッケージのセキュリティについては、付録を参照してください。 | 以下の三つの指定方法に対応しています。 |
      | `driver_class`   | JDBC ドライバーのクラス名            |                               |

      `driver_url` は、次の三つの形式で指定できます。

      1. ファイル名。例：`mysql-connector-j-8.3.0.jar`。Jar ファイルは、FE と BE のデプロイディレクトリ内にある `jdbc_drivers/` ディレクトリに事前に配置する必要があります。システムはこのディレクトリを自動的に検索します。ディレクトリの場所は、`fe.conf` と `be.conf` の `jdbc_drivers_dir` 設定で変更することもできます。

      2. ローカルの絶対パス。例：`file:///path/to/mysql-connector-j-8.3.0.jar`。Jar ファイルは、すべての FE/BE ノードの指定したパスに事前に配置する必要があります。

      3. HTTP URL。例：`https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.3.0/mysql-connector-j-8.3.0.jar`。システムは、この HTTP アドレスからドライバーファイルをダウンロードします。認証を必要としない HTTP サービスのみをサポートします。

      4.1.5 以降、URI スキームのないドライバーの場所は、`[A-Za-z0-9._-]+.jar` に一致するファイル名でなければなりません。URL デコード後のパスに、親ディレクトリを表す `..` セグメントを含めることはできません。このチェックは、`ALTER CATALOG` と Iceberg および Paimon JDBC Catalog のドライバーの場所にも適用されます。既存の安全なドライバーディレクトリと許可リストのチェックも引き続き適用されます。

  * 任意のプロパティ

      | パラメータ名                | デフォルト値 | 説明                                                                                                                                   |
      | ----------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
      | `lower_case_meta_names`       | false         | 外部データソースのデータベース名、テーブル名、カラム名を小文字にして同期するかどうか                                        |
      | `meta_names_mapping`          |               | 外部データソースに `MY_TABLE` と `my_table` のような大文字と小文字だけが異なる名前がある場合、Catalog へのクエリ時に Doris は名前を区別できずエラーを報告します。競合を解決するには、`meta_names_mapping` パラメータを設定する必要があります。 |
      | `only_specified_database`     | false         | `jdbc_url` で指定されたデータベースのみを同期するかどうか（このデータベースは Doris のデータベース階層に対応します）                       |
      | `connection_pool_min_size`    | 1             | コネクションプールの最小接続数を定義します。プールの初期化に使用され、キープアライブが有効な場合は、少なくともこの数の接続がアクティブに保たれます。 |
      | `connection_pool_max_size`    | 30            | コネクションプールの最大接続数を定義します。各 Catalog に対応する各 FE または BE ノードは、最大でこの数の接続を保持できます。 |
      | `connection_pool_max_wait_time`| 5000         | プールに利用可能な接続がない場合に、クライアントが接続を待つ最大時間をミリ秒単位で定義します。                         |
      | `connection_pool_max_life_time`| 1800000      | プール内の接続がアクティブでいられる最大時間をミリ秒単位で設定します。この時間を超えた接続は回収されます。また、この値の半分がプールにおけるアイドル接続の最小削除時間として使用され、この時間に達した接続は削除対象になります。 |
      | `connection_pool_keep_alive`  | false         | BE ノードでのみ有効です。アイドル接続の最小削除時間に達しているものの、最大生存時間には達していない接続をアクティブに保つかどうかを指定します。不要なリソース消費を抑えるため、デフォルトでは無効です。 |

* `[CommonProperties]`

  CommonProperties セクションでは、共通プロパティを設定します。詳細については、[Catalog の概要](../catalog-overview.md)の**共通プロパティ**を参照してください。

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

JDBC Catalog がデータソースにアクセスする際は、BE ノードを選択し、JDBC Client を使用して生成した SQL クエリをデータソースに送信し、データを取得します。そのため、パフォーマンスは生成された SQL がデータソース側でどれだけ効率的に実行されるかに依存します。Doris は述語条件をプッシュダウンし、生成する SQL に組み込もうとします。生成された SQL は `EXPLAIN SQL` ステートメントで確認できます。

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

述語条件の意味や動作は、Doris と外部データソースで一致しない場合があります。そのため、Doris は次のパラメータ変数を使い、JDBC 外部テーブルへのクエリにおける述語のプッシュダウンを制限、制御します。

> 注意：現在、Doris が述語のプッシュダウンをサポートしているデータソースは MySQL、Clickhouse、Oracle のみです。今後、さらに多くのデータソースをサポートする予定です。

- `enable_jdbc_oracle_null_predicate_push_down`

    セッション変数です。デフォルトは `false` です。つまり、述語条件に `NULL` 値が含まれる場合、述語は Oracle データソースにプッシュダウンされません。これは、Oracle バージョン 21 より前では、演算子としての `NULL` がサポートされていないためです。

    このパラメータは 2.1.7 および 3.0.3 以降でサポートされています。

- `enable_jdbc_cast_predicate_push_down`

    セッション変数です。デフォルトは `false` です。つまり、述語条件に明示的または暗黙的な CAST がある場合、その述語は JDBC データソースにプッシュダウンされません。CAST の動作はデータベース間で異なるため、正確性を確保する目的でデフォルトではプッシュダウンしません。ただし、ユーザーは CAST の動作が一致するかどうかを手動で確認できます。一致する場合は、このパラメータを `true` に設定すると、より多くの述語をプッシュダウンしてパフォーマンスを向上できます。

    このパラメータは 2.1.7 および 3.0.3 以降でサポートされています。

- 関数のプッシュダウンに関するブラックリストとホワイトリスト

    同じシグネチャを持つ関数でも、Doris と外部データソースで意味が異なる場合があります。Doris では、関数のプッシュダウンに関するブラックリストとホワイトリストをあらかじめ定義しています。

    | データソース   | ブラックリスト | ホワイトリスト | 説明     |
    | ---------- | ----- | --- | --------- |
    | MySQL      | - `DATE_TRUNC`<br>- `MONEY_FORMAT`<br>- `NEGTIVE`  |  | MySQL では、FE の設定項目 `jdbc_mysql_unsupported_pushdown_functions` を使用して、ブラックリストに項目を追加することもできます。例：`jdbc_mysql_unsupported_pushdown_functions==func1,func2` |
    | Clickhouse | | - `FROM_UNIXTIME`<br>- `UNIX_TIMESTAMP` |       |
    | Oracle     |  | - `NVL`<br>- `IFNULL`   |          |

- 関数の書き換えルール

    Doris と外部データソースには、動作は一致していても名前が異なる関数があります。Doris は、関数のプッシュダウン時にこれらの関数を書き換えることができます。現在、次の書き換えルールが組み込まれています。

    | データソース   | Doris の関数 | 書き換え先の関数 |
    | ---------- | ----- | --- |
    | MySQL | nvl | ifnull |
    | MySQL | to_date | date |
    | Clickhouse | from_unixtime | FROM_UNIXTIME |
    | Clickhouse | unix_timestamp | toUnixTimestamp |
    | Oracle | ifnull | nvl |

- カスタムの関数プッシュダウンおよび書き換えルール

    3.0.7 より後のバージョンでは、Doris は関数のプッシュダウンと書き換えについて、より柔軟なルールをサポートします。ユーザーは Catalog のプロパティで、特定の Catalog に適用する関数のプッシュダウンと書き換えのルールを設定できます。

    ```sql
    create catalog jdbc properties (
    ...
    'function_rules' = '{"pushdown" : {"supported": ["to_date"], "unsupported" : ["abs"]}, "rewrite" : {"to_date" : "date2"}}'
    )
    ```

    `function_rules` では、次のルールを指定できます。

    - `pushdown`

        関数のプッシュダウンルールを指定します。`supported` 配列にはプッシュダウンできる関数名を、`unsupported` 配列にはプッシュダウンできない関数名を指定します。関数が両方の配列に含まれる場合は、`supported` が優先されます。

        Doris はまずシステムに定義済みのブラックリストとホワイトリストを適用し、その後、ユーザーが指定したブラックリストとホワイトリストを適用します。

    - `rewrite`

        関数の書き換えルールを定義します。上記の例では、関数名 `to_date` が `date2` に書き換えられ、プッシュダウンされます。

        注意：書き換えられるのは、プッシュダウンが許可された関数だけです。

#### 行数の制限 {#row-count-limitation}

クエリに `LIMIT` キーワードが含まれている場合、Doris は `LIMIT` 句をデータソースにプッシュダウンし、転送するデータ量を減らします。生成された SQL に `LIMIT` 句が含まれるかどうかは、`EXPLAIN` ステートメントで確認できます。

## 書き込み操作 {#write-operations}

Doris は、JDBC プロトコルを介して対応するデータソースにデータを書き戻すことをサポートします。

```sql
INSERT INTO mysql_table SELECT * FROM internal.doris_db.doris_tbl;
```

## ステートメントのパススルー {#statement-passthrough}

### 適用シナリオ {#applicable-scenarios-1}

Doris は、ステートメントのパススルーを使用して、対応する DDL、DML、クエリの各ステートメントを JDBC データソースで直接実行できます。この機能は、次のシナリオに適しています。

* 複雑なクエリのパフォーマンス向上

  デフォルトでは、Doris のクエリオプティマイザーが元の SQL を解析し、一定のルールに従ってデータソースに送信する SQL を生成します。生成される SQL は通常、単純な単一テーブルのクエリであり、集約や結合クエリなどの演算を含めることはできません。たとえば、次のクエリを考えます。

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

  この場合、集約処理は Doris 内で実行されます。そのため、状況によっては大量のデータをネットワーク経由でデータソースから読み取る必要があり、クエリ効率が低下します。ステートメントのパススルーを使用すると、元の SQL をデータソースに直接渡し、データソース自体の計算能力を使って SQL を実行できるため、クエリのパフォーマンスが向上します。

* 一元管理

  ステートメントのパススルー機能では、クエリ SQL に加えて DDL および DML ステートメントも渡せます。これにより、ユーザーはテーブルの作成や削除、テーブル構造の変更など、データソース上のデータベースやテーブルに対する操作を Doris から直接実行できます。

### SQL のパススルー {#passthrough-sql}

```sql
SELECT * FROM
QUERY(
  'catalog' = 'mysql_catalog',
  'query' = 'SELECT smallint_u, sum(int_u) FROM db.all_types WHERE smallint_u > 10 GROUP BY smallint_u;'
);
```

`QUERY` テーブル関数は、次の二つのパラメータを受け取ります。

* `catalog`：Catalog の名前。対象の Catalog 名と一致させる必要があります。
* `query`：実行するクエリステートメント。対応するデータソースの構文を使用して直接記述します。

### DDL と DML のパススルー {#passthrough-ddl-and-dml}

```sql
CALL EXECUTE_STMT("jdbc_catalog", "insert into db1.tbl1 values(1,2), (3, 4)");

CALL EXECUTE_STMT("jdbc_catalog", "delete from db1.tbl1 where k1 = 2");

CALL EXECUTE_STMT("jdbc_catalog", "create table dbl1.tbl2 (k1 int)");
```

`EXECUTE_STMT()` 関数は、次の二つのパラメータを受け取ります。

* 最初のパラメータ：Catalog の名前。現在サポートされているのは JDBC タイプの Catalog のみです。
* 二番目のパラメータ：実行する SQL ステートメント。現在サポートされているのは DDL と DML ステートメントのみであり、対応するデータソースの構文で記述する必要があります。

### 使用上の制限 {#usage-restrictions}

`CALL EXECUTE_STMT()` コマンドを使用すると、Doris はユーザーが記述した SQL ステートメントを、Catalog に関連付けられた JDBC データソースに直接送信して実行します。そのため、この操作には次の制限があります。

* SQL ステートメントは、対応するデータソースの構文に従う必要があります。Doris は構文チェックや意味チェックを行いません。

* SQL ステートメントで参照するテーブル名には、`db.tbl` のような完全修飾名を使用することを推奨します。データベースを指定しない場合は、JDBC Catalog の JDBC URL に含まれるデータベース名が使用されます。

* SQL ステートメントでは、JDBC データソースの外部にあるデータベースやテーブル、および Doris のデータベースやテーブルを参照できません。ただし、JDBC データソース内にあり、Doris JDBC Catalog と同期されていないテーブルは参照できます。

* DML ステートメントの実行時には、挿入、更新、削除された行数を取得できません。判定できるのはコマンドの成功または失敗のみです。

* Catalog に対する `LOAD` 権限を持つユーザーのみが、`CALL EXECUTE_STMT()` コマンドを実行できます。

* Catalog に対する `SELECT` 権限を持つユーザーのみが、`query()` テーブル関数を実行できます。

* Catalog 作成時に指定した JDBC ユーザーには、対応するステートメントを実行するために必要なデータソース側の権限が必要です。

* `query()` テーブル関数で読み取る結果のデータ型は、クエリ対象の Catalog タイプでサポートされるデータ型に従います。

## 付録 {#appendix}

### 大文字と小文字の区別に関する設定 {#case-sensitivity-settings}


デフォルトでは、Doris のデータベース名とテーブル名では大文字と小文字が区別されますが、カラム名では区別されません。この動作は設定パラメータで変更できます。また、一部の JDBC データソースでは、データベース名、テーブル名、カラム名の大文字と小文字を区別するルールが Doris と異なる場合があります。この違いにより、JDBC Catalog を介した名前のマッピング時に競合が生じることがあります。以下では、そのような問題の解決方法を説明します。

#### 表示名とクエリ名 {#display-name-and-query-name}

Doris では、オブジェクト名（ここではテーブル名を例にします）を**表示名**と**クエリ名**に分けて考えることができます。テーブル名の場合、**表示名**は `SHOW TABLES` の結果に表示される名前を指し、**クエリ名**は `SELECT` ステートメントで使用できる名前を指します。

たとえば、テーブルの実際の名前が `MyTable` の場合、このテーブルの**表示名**と**クエリ名**は、Frontend (FE) のパラメータ `lower_case_table_names` の設定によって異なります。

| 設定 | 説明 | 実際の名前 | 表示名 | クエリ名 |
| --- | --- | --- | --- | --- |
| `lower_case_table_names=0` | デフォルト設定です。元の名前を保存して表示し、クエリでは大文字と小文字を区別します。 | `MyTable` | `MyTable` | クエリでは大文字と小文字を区別するため、`MyTable` を使用する必要があります。 |
| `lower_case_table_names=1` | 名前を小文字で保存して表示し、クエリでは大文字と小文字を区別しません。 | `MyTable` | `mytable` | クエリでは大文字と小文字を区別しないため、たとえば `MyTable` または `mytable` を使用できます。 |
| `lower_case_table_names=2` | 元の名前を保存して表示しますが、クエリでは大文字と小文字を区別しません。 | `MyTable` | `MyTable` | クエリでは大文字と小文字を区別しないため、たとえば `MyTable` または `mytable` を使用できます。 |

#### JDBC Catalog における名前の大文字と小文字の区別に関するルール {#jdbc-catalog-name-case-sensitivity-rules}

Doris 自体で大文字と小文字の区別に関するルールを設定できるのは、**テーブル名**だけです。しかし、JDBC Catalog では**データベース名**と**カラム名**も扱う必要があります。そのため、追加の Catalog プロパティ `lower_case_meta_names` を `lower_case_table_names` と組み合わせて使用します。

| 設定 | 説明 |
| --- | --- |
| `lower_case_meta_names` | Catalog 作成時に `properties` で指定し、その Catalog にのみ適用されます。デフォルト値は `false` です。`true` に設定すると、Doris はすべてのデータベース名、テーブル名、カラム名を小文字に変換して保存、表示します。Doris でのクエリには小文字の名前を使用する必要があります。 |
| `lower_case_table_names` | `fe.conf` で設定する Frontend (FE) の設定項目で、クラスター全体に適用されます。デフォルト値は `0` です。 |

> 注意：`lower_case_meta_names = true` の場合、`lower_case_table_names` の設定は無視され、すべてのデータベース名、テーブル名、カラム名が小文字に変換されます。

`lower_case_meta_names`（true/false）と `lower_case_table_names`（0/1/2）の組み合わせごとに、データベース名、テーブル名、カラム名の**保存**時と**クエリ**時の動作を次の表に示します（「元の表記」は外部データソースでの大文字と小文字を維持すること、「小文字」は自動的に小文字へ変換すること、「任意の表記」はクエリで大文字と小文字を問わず使用できることを意味します）。

| `lower_case_table_names` & `lower_case_meta_names` | データベースの表示名 | テーブルの表示名 | カラムの表示名 | データベースのクエリ名 | テーブルのクエリ名 | カラムのクエリ名 |
| -------------------------------------------------- | --------------------- | ------------------ | ------------------- | ------------------- | ---------------- | ----------------- |
| `0 & false`                                       | 元の表記              | 元の表記           | 元の表記            | 元の表記            | 元の表記         | 任意の表記          |
| `0 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 小文字        | 任意の表記          |
| `1 & false`                                       | 元の表記              | 小文字          | 元の表記            | 元の表記            | 任意の表記         | 任意の表記          |
| `1 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の表記         | 任意の表記          |
| `2 & false`                                       | 元の表記              | 元の表記           | 元の表記            | 元の表記            | 任意の表記         | 任意の表記          |
| `2 & true`                                        | 小文字             | 小文字          | 小文字           | 小文字           | 任意の表記         | 任意の表記          |

#### 大文字と小文字による競合のチェック {#case-conflict-check}

JDBC Catalog を介して名前をマッピングする際、名前の競合が発生することがあります。たとえば、データソースのカラム名で大文字と小文字が区別され、`ID` と `id` という二つのカラムがある場合です。`lower_case_meta_names = true` を設定すると、これらのカラムは小文字に変換された後に競合します。Doris は次のルールに従って競合をチェックします。

* どのような場合でも、Doris は**カラム名**の大文字と小文字による競合をチェックします（例：`id` と `ID` が同時に存在するかどうか）。

* `lower_case_meta_names = true` の場合、Doris はデータベース名、テーブル名、カラム名について大文字と小文字による競合をチェックします（例：`DORIS` と `doris` が同時に存在するかどうか）。

* `lower_case_meta_names = false` で、`lower_case_table_names` が `1` または `2` に設定されている場合、Doris は**テーブル名**の競合をチェックします（例：`orders` と `ORDERS` が同時に存在するかどうか）。

* `lower_case_table_names = 0` の場合、データベース名とテーブル名では大文字と小文字が区別され、追加の変換は必要ありません。

#### 大文字と小文字による競合の解決方法 {#solutions-to-case-conflicts}

競合が発生すると Doris はエラーを出すため、次の方法で競合を解決する必要があります。

大文字と小文字だけが異なるデータベース、テーブル、カラム（例：`DORIS` と `doris`）を Doris が正しく区別できない場合は、Catalog の `meta_names_mapping` を設定して手動のマッピングを指定すると、競合を解決できます。

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

ドライバーパッケージはユーザーが Doris クラスターにアップロードするため、一定のセキュリティリスクがあります。ユーザーは次の対策でセキュリティを強化できます。

1. Doris は `jdbc_drivers_dir` ディレクトリ内のすべてのドライバーパッケージを安全と見なし、パスのチェックを行いません。管理者は、このディレクトリ内のファイルを自ら管理し、安全性を確保する必要があります。

2. ドライバーパッケージをローカルパスまたは HTTP パスで指定した場合、Doris は次のチェックを行います。

   * 許可されるドライバーパッケージのパスは、FE の設定項目 `jdbc_driver_secure_path` で制御します。この設定には、セミコロンで区切って複数のパスを指定できます。この設定が指定されている場合、Doris は `driver_url` のパスのプレフィックスが `jdbc_driver_secure_path` に含まれているかどうかをチェックします。含まれていなければ、作成は拒否されます。

     例：

     `jdbc_driver_secure_path = "file:///path/to/jdbc_drivers;http://path/to/jdbc_drivers"` を設定した場合、`file:///path/to/jdbc_drivers` または `http://path/to/jdbc_drivers` で始まるドライバーパッケージのパスのみが許可されます。

   * このパラメータのデフォルト値は `*` です。空の場合、または `*` に設定されている場合は、すべての Jar パッケージのパスが許可されます。

3. データディレクトリを作成する際は、`checksum` パラメータを使用してドライバーパッケージのチェックサムを指定できます。Doris はドライバーパッケージのロード後にチェックサムを検証し、検証に失敗した場合は作成を拒否します。

### コネクションプールのクリーンアップ {#connection-pool-cleanup}

Doris では、データソースへの接続を頻繁に開閉することを避けるため、各 FE ノードと BE ノードがコネクションプールを維持します。プール内の各接続を使用してデータソースに接続し、クエリを実行できます。タスクが完了すると接続は再利用のためにプールに戻されます。これにより、パフォーマンスが向上するだけでなく、接続の確立に伴うシステムの負荷が軽減され、データソースの接続数の上限に達することも防ぎやすくなります。

コネクションプールのサイズは、さまざまなワークロードに対応できるよう、実際のニーズに応じて調整できます。通常、キープアライブが有効なときに少なくとも一つの接続をアクティブに保つため、プールの最小接続数は 1 に設定します。リソースを過剰に消費しないよう、最大接続数は適切な値に設定してください。

BE 上に未使用のコネクションプールのキャッシュが蓄積するのを防ぐには、BE の `jdbc_connection_pool_cache_clear_time_sec` パラメータでキャッシュのクリーンアップ間隔を指定できます。デフォルト値は 28,800 秒（8 時間）で、この時間内に使用されなかったコネクションプールのキャッシュは、BE によってすべて強制的に消去されます。

### 認証情報の更新 {#credential-update}

JDBC Catalog を使用して外部データソースに接続する場合は、データベースの認証情報を慎重に更新することが重要です。

Doris はクエリに迅速に応答するため、コネクションプールを通じてアクティブな接続を維持します。しかし、認証情報を変更した後も、コネクションプールが古い認証情報で新しい接続を試み、失敗する可能性があります。システムは一定数のアクティブな接続を維持しようとするため、こうした失敗が繰り返され、一部のデータベースシステムでは頻繁な失敗によってアカウントがロックされる可能性があります。

認証情報を変更する必要がある場合は、Doris JDBC Catalog の設定も同時に更新し、Doris クラスターを再起動することを推奨します。これにより、すべてのノードで最新の認証情報が使用され、接続の失敗やアカウントのロックを防げます。

アカウントがロックされた場合には、次のようなエラーが発生します。

```text
MySQL: account is locked

Oracle: ORA-28000: the account is locked

SQL Server: Login is locked out
```

### コネクションプールのトラブルシューティング {#connection-pool-troubleshooting}

1. HikariPool の接続タイムアウトエラー：`Connection is not available, request timed out after 5000ms`

   * 考えられる原因

     * 原因一：ネットワークの問題（サーバーに到達できないなど）

     * 原因二：ユーザー名やパスワードが無効であるなどの認証の問題

     * 原因三：ネットワーク遅延が大きく、接続の作成が 5 秒のタイムアウトを超える

     * 原因四：同時実行クエリが多すぎて、プールに設定された最大接続数を超える

   * 解決方法

     * `Connection is not available, request timed out after 5000ms` というエラーのみが発生する場合は、原因三と原因四を確認してください。

       * ネットワーク遅延が大きくないか、リソースが不足していないか確認します。

       * プールの最大接続数を増やします。

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_size' = '100');
           ```

       * 接続のタイムアウト時間を延ばします。

           ```sql
           ALTER CATALOG catalog_name SET PROPERTIES ('connection_pool_max_wait_time' = '10000');
           ```

     * `Connection is not available, request timed out after 5000ms` 以外にもエラーメッセージがある場合は、追加のエラーを確認してください。

       * ネットワークの問題（サーバーに到達できないなど）が接続失敗の原因となることがあります。ネットワーク接続が安定していることを確認してください。

       * 認証の問題（ユーザー名やパスワードが無効であるなど）も接続失敗の原因となることがあります。設定内のデータベース認証情報を確認し、ユーザー名とパスワードが正しいことを確かめてください。

       * 具体的なエラーメッセージに基づいて、ネットワーク、データベース、認証に関する問題を調査し、根本原因を特定してください。
