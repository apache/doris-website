---
{
    "title": "データカタログの概要",
    "language": "ja",
    "description": "Apache Doris のデータカタログの概念と使い方を説明します。外部データカタログを作成して Hive、Iceberg、Paimon、PostgreSQL などのデータソースに接続し、データソースをまたぐ連携クエリ、データの取り込み、書き戻しを行えます。"
}
---

データカタログは、データソースのプロパティを記述します。

Doris では、Hive、Iceberg、Paimon、PostgreSQL など、異なるデータソースを指す複数のデータカタログを作成できます。Doris はデータカタログを通じて、対応するデータソースからデータベース、テーブル、スキーマ、パーティション、データの格納場所を自動的に取得します。ユーザーは標準の SQL 文を使ってこれらのデータカタログにアクセスし、データを分析したり、複数のデータカタログにまたがるデータを結合してクエリしたりできます。

Doris のデータカタログには、次の二種類があります。

| 種類 | 説明 |
| ---------------- | -------------------------------------------------------- |
| 内部カタログ | Doris の内部テーブルのデータを格納する組み込みのデータカタログです。名前は `internal` に固定されています。作成、変更、削除はできません。 |
| 外部カタログ | 内部カタログ以外のデータカタログです。ユーザーは外部データカタログを作成、変更、削除できます。 |

データカタログは主に次の三つのシナリオで使用します。ただし、対応するシナリオはデータカタログごとに異なります。詳細は各データカタログのドキュメントを参照してください。

| シナリオ | 説明 |
| ---- | ------------------------------------------- |
| クエリの高速化 | Hive、Iceberg、Paimon などのレイクハウスデータに対するクエリを直接高速化します。 |
| データ統合 | ゼロ ETL の方法で異なるデータソースに直接アクセスして結果データを生成したり、異なるデータソース間でデータを容易に移動したりします。 |
| データの書き戻し | Doris でデータを処理・変換し、外部データソースに書き戻します。 |

この記事では、[Iceberg カタログ](./catalogs/iceberg-catalog)を例に、データカタログの基本操作を説明します。各データカタログの詳細は、それぞれのドキュメントを参照してください。

## データカタログの作成

`CREATE CATALOG` 文を使用して Iceberg カタログを作成します。

```sql
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 's3://bucket/dir/key',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```

Doris で作成したデータカタログは、対応するデータソースのメタデータサービス（Hive Metastore など）やストレージサービス（HDFS/S3 など）にアクセスするための「プロキシ」として機能します。Doris に保存されるのはデータカタログの接続プロパティなどの情報だけで、対応するデータソースの実際のメタデータやデータは保存されません。

### 共通プロパティ

各データカタログ固有のプロパティに加え、このセクションではすべてのデータカタログに共通するプロパティ `{CommonProperties}` を説明します。

| プロパティ | 説明 | 例 |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `include_database_list` | 同期する複数のデータベースを `,` で区切って指定します。デフォルトではすべてのデータベースが同期されます。データベース名は大文字と小文字が区別されます。外部データソースに多数のデータベースがあり、アクセスが必要なのは一部だけの場合、このパラメータを使うと大量のメタデータの同期を避けられます。 | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list` | 同期から除外する複数のデータベースを `,` で区切って指定します。デフォルトではフィルタリングされず、すべてのデータベースが同期されます。データベース名は大文字と小文字が区別されます。上記と同じシナリオで、アクセス不要なデータベースを除外する場合に使います。指定が競合した場合は `exclude` が `include` より優先されます。 | `'exclude_database_list' = 'db1,db2'` |
| `include_table_list` | 同期する複数のテーブルを `db.tbl` 形式で `,` 区切りで指定します。設定すると、データベース内のテーブル一覧を表示するとき、リモートのメタデータサービスからテーブルの全件一覧を取得せず、指定したテーブルだけを返します。外部データソースに多数のテーブルがあり、全件一覧の取得がタイムアウトする可能性がある場合に使います。 | `'include_table_list' = 'db1.tbl1,db1.tbl2,db2.tbl3'` |
| `lower_case_table_names` | カタログ単位でテーブル名の大文字・小文字の扱いを制御します。値と意味については、以下の[テーブル名の大文字・小文字の区別](#table-name-case-sensitivity-lower_case_table_names)を参照してください。デフォルト値はグローバル変数 `lower_case_table_names` から継承されます。 | `'lower_case_table_names' = '1'` |
| `lower_case_database_names` | カタログ単位でデータベース名の大文字・小文字の扱いを制御します。値と意味については、以下の[データベース名の大文字・小文字の区別](#database-name-case-sensitivity-lower_case_database_names)を参照してください。デフォルト値は `0`（大文字・小文字を区別）です。 | `'lower_case_database_names' = '2'` |

### テーブル一覧の指定

この機能はバージョン 4.1.0 以降でサポートされています。

外部データソース（Hive Metastore など）に多数のテーブルがある場合、リモートのメタデータサービスからテーブルの全件一覧を取得するには長い時間がかかり、タイムアウトすることもあります。`include_table_list` プロパティを設定すると、同期するテーブルを指定でき、リモートから全件一覧を取得せずに済みます。

`include_table_list` では `db.tbl` 形式を使用し、複数のテーブルをカンマ `,` で区切ります。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'include_table_list' = 'db1.table1,db1.table2,db2.table3'
);
```

設定後の動作は次のとおりです。

- `db1` 内のテーブルを一覧表示すると、リモートのメタデータサービスのテーブル全件一覧 API を呼び出さずに、`table1` と `table2` だけが返されます。
- `db2` 内のテーブルを一覧表示すると、`table3` だけが返されます。
- `include_table_list` に含まれないデータベース（`db3` など）については、引き続きリモートのメタデータサービスからテーブルの全件一覧が取得されます。
- `include_table_list` 内で形式が正しくないエントリ（`db.tbl` 形式でないもの）は無視されます。

:::tip
このプロパティは `include_database_list` と組み合わせて使用できます。たとえば、最初に `include_database_list` で必要なデータベースを絞り込み、次に `include_table_list` で必要なテーブルを指定します。
:::

### テーブル名の大文字・小文字の区別 {#table-name-case-sensitivity-lower_case_table_names}

この機能はバージョン 4.1.0 以降でサポートされています。

`lower_case_table_names` プロパティを使用すると、カタログ単位でテーブル名の大文字・小文字の扱いを制御できます。このプロパティには三つのモードがあります。

| 値 | モード | 説明 |
| -- | ---- | ---- |
| `0` | 大文字・小文字を区別（デフォルト） | テーブル名を元の大文字・小文字のまま保存して比較します。テーブル名を参照する際は、リモートのメタデータにある表記と完全に一致させる必要があります。 |
| `1` | 小文字で保存 | Doris ではテーブル名を小文字で保存します。外部データソースへのアクセスに小文字のテーブル名を統一して使用したい場合に適しています。 |
| `2` | 大文字・小文字を区別せずに比較 | テーブル名の比較では大文字・小文字を区別しませんが、表示時にはリモートのメタデータにある元の表記を維持します。外部データソースでテーブル名の大文字・小文字が統一されておらず、区別せずにテーブルへアクセスしたい場合に適しています。 |

このプロパティを設定しない場合、デフォルトでグローバル変数 `lower_case_table_names` の値を継承します。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_table_names' = '2'
);
```

:::caution
`lower_case_table_names` を `1` または `2` に設定した場合、リモートのメタデータに大文字・小文字だけが異なる名前のテーブル（`MyTable` と `mytable` など）があると、競合する可能性があります。Doris はそのような競合を検出し、エラーを報告します。
:::

### データベース名の大文字・小文字の区別 {#database-name-case-sensitivity-lower_case_database_names}

この機能はバージョン 4.1.0 以降でサポートされています。

`lower_case_database_names` プロパティを使用すると、カタログ単位でデータベース名の大文字・小文字の扱いを制御できます。このプロパティには三つのモードがあります。

| 値 | モード | 説明 |
| -- | ---- | ---- |
| `0` | 大文字・小文字を区別（デフォルト） | データベース名を元の大文字・小文字のまま保存して比較します。データベース名を参照する際は、リモートのメタデータにある表記と完全に一致させる必要があります。 |
| `1` | 小文字で保存 | Doris ではデータベース名を小文字で保存します。外部データソースへのアクセスに小文字のデータベース名を統一して使用したい場合に適しています。 |
| `2` | 大文字・小文字を区別せずに比較 | データベース名の比較では大文字・小文字を区別しませんが、表示時にはリモートのメタデータにある元の表記を維持します。外部データソースでデータベース名の大文字・小文字が統一されておらず、区別せずにデータベースへアクセスしたい場合に適しています。 |

デフォルト値は `0`（大文字・小文字を区別）です。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_database_names' = '2',
    'lower_case_table_names' = '2'
);
```

:::caution
`lower_case_database_names` を `1` または `2` に設定した場合、リモートのメタデータに大文字・小文字だけが異なる名前のデータベース（`MyDB` と `mydb` など）があると、競合する可能性があります。Doris はそのような競合を検出し、エラーを報告します。
:::

:::info
`lower_case_database_names` と `lower_case_table_names` は、それぞれ独立して設定でき、互いに影響しません。たとえば、データベース名では大文字・小文字を区別（`0`）し、テーブル名では区別しない（`2`）ように設定できます。
:::

### カラム型のマッピング

ユーザーがデータカタログを作成すると、Doris はそのカタログのデータベース、テーブル、スキーマを自動的に同期します。データカタログごとのカラム型のマッピング規則については、対応するデータカタログのドキュメントを参照してください。

`UNION` や `INTERVAL` など、現在 Doris のカラム型にマッピングできない外部データ型は、`UNSUPPORTED` にマッピングされます。`UNSUPPORTED` 型を含むクエリについては、次の例を参照してください。

同期されたテーブルのスキーマが次のとおりだとします。

```text
k1 INT,
k2 INT,
k3 UNSUPPORTED,
k4 INT
```

クエリの動作は次のとおりです。

```sql
SELECT * FROM table;                -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT * EXCEPT(k3) FROM table;     -- Query OK.
SELECT k1, k3 FROM table;           -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT k1, k4 FROM table;           -- Query OK.
```

### Nullable プロパティ

Doris では現在、外部テーブルのカラムの Nullable プロパティのサポートに特有の制限があります。具体的な動作は次のとおりです。

| ソース側の型 | Doris での読み取り時の動作 | Doris での書き込み時の動作 |
| --- | --- | --- |
| Nullable | Nullable | Null 値を書き込めます。 |
| Not Null | Nullable。つまり、NULL を許容するカラムとして読み取ります。 | Null 値を書き込めます。つまり、Null 値の厳密なチェックは行われません。データの整合性と一貫性はユーザー自身で確保する必要があります。 |

## データカタログの使用

### データカタログの表示

作成後、`SHOW CATALOGS` コマンドでカタログを表示できます。

```text
mysql> SHOW CATALOGS;
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
| CatalogId | CatalogName     | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
|     10024 | iceberg_catalog | iceberg  | yes       | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
|         0 | internal        | internal |           | NULL                    | NULL                | Doris internal catalog |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
```

[SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG) を使用すると、CREATE CATALOG 文を表示できます。

### データカタログの切り替え

Doris では、`SWITCH` 文で接続セッションのコンテキストを対応するデータカタログに切り替えられます。これは、`USE` 文でデータベースを切り替える操作と同様です。

データカタログに切り替えた後は、`USE` 文でさらに特定のデータベースに切り替えるか、`SHOW DATABASES` で現在のデータカタログ内のデータベースを表示できます。

```sql
SWITCH iceberg_catalog;

SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| test               |
| iceberg_db         |
+--------------------+

USE iceberg_db;
```

`USE` 文に完全修飾名 `catalog_name.database_name` を指定すると、特定のデータカタログ内の特定のデータベースへ直接切り替えることもできます。

```sql
USE iceberg_catalog.iceberg_db;
```

MySQL 接続プロトコルとの互換性のために、MySQL コマンドラインや JDBC 接続文字列でも完全修飾名を使用できます。

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```

組み込みのデータカタログの名前は `internal` に固定されています。切り替え方法は外部データカタログと同じです。

### デフォルトのデータカタログ

ユーザープロパティ `default_init_catalog` を使用すると、特定のユーザーのデフォルトのデータカタログを設定できます。設定後、指定したユーザーが Doris に接続すると、セッションは設定されたデータカタログに自動的に切り替わります。

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```

注 1: MySQL コマンドラインまたは JDBC 接続文字列でデータカタログを明示的に指定した場合は、その指定が優先され、ユーザープロパティ `default_init_catalog` は適用されません。

注 2: ユーザープロパティ `default_init_catalog` で設定したデータカタログが存在しなくなった場合、セッションはデフォルトの `internal` データカタログに自動的に切り替わります。

注 3: この機能はバージョン 3.1.x 以降でサポートされています。

### 基本的なクエリ

Doris がサポートする任意の SQL 文を使用して、外部データカタログ内のテーブルをクエリできます。

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```

### カタログをまたぐクエリ

Doris はデータカタログをまたぐ結合クエリをサポートします。

ここでは、別の [MySQL カタログ](./catalogs/jdbc-mysql-catalog.md)を作成します。

```sql
CREATE CATALOG mysql_catalog properties(
    'type' = 'jdbc',
    'user' = 'root',
    'password' = '123456',
    'jdbc_url' = 'jdbc:mysql://host:3306/mysql_db',
    'driver_url' = 'mysql-connector-java-8.0.25.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```

次に、SQL を使用して Iceberg テーブルと MySQL テーブルを結合してクエリします。

```sql
SELECT * FROM
iceberg_catalog.iceberg_db.table1 tbl1 JOIN mysql_catalog.mysql_db.dim_table tbl2
ON tbl1.id = tbl2.id;
```

### データの取り込み

`INSERT` コマンドを使用して、データソースから Doris にデータを取り込めます。

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

`CTAS (Create Table As Select)` 文を使用して、外部データソースから Doris の内部テーブルを作成し、データを取り込むこともできます。

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```

### データの書き戻し

Doris は `INSERT` 文を使用した外部データソースへの直接の書き戻しをサポートします。詳細は以下を参照してください。

* [Hive カタログ](./catalogs/hive-catalog.mdx)

* [Iceberg カタログ](./catalogs/iceberg-catalog.mdx)

* [JDBC カタログ](./catalogs/jdbc-catalog-overview.md)

## データカタログの更新

Doris で作成したデータカタログは、対応するデータソースのメタデータサービスにアクセスするための「プロキシ」として機能します。Doris は一部のメタデータをキャッシュします。キャッシュによってメタデータへのアクセス性能が向上し、ネットワークをまたぐ頻繁なリクエストを避けられます。ただし、キャッシュには鮮度の問題もあります。キャッシュを更新しないと、最新のメタデータにはアクセスできません。そのため、Doris はデータカタログを更新する方法を複数提供しています。

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```

Doris はメタデータのキャッシュを無効にして、最新のメタデータへリアルタイムでアクセスすることもサポートします。

- Doris 4.1.x より前: [メタデータキャッシュ](./meta-cache.md)を参照してください。
- Doris 4.1.x 以降: 各カタログのドキュメントにある「メタデータキャッシュ」のセクションを参照してください。
    - [Hive カタログ](./catalogs/hive-catalog.mdx#meta-cache)
    - [Iceberg カタログ](./catalogs/iceberg-catalog.mdx#meta-cache)
    - [Hudi カタログ](./catalogs/hudi-catalog.md#meta-cache)
    - [Paimon カタログ](./catalogs/paimon-catalog.mdx#meta-cache)
    - [MaxCompute カタログ](./catalogs/maxcompute-catalog.md#meta-cache)

## データカタログの変更

`ALTER CATALOG` を使用して、データカタログのプロパティや名前を変更できます。

```sql
-- Rename a catalog
ALTER CATALOG iceberg_catalog RENAME iceberg_catalog2;

-- Modify properties of a catalog
ALTER CATALOG iceberg_catalog SET PROPERTIES ('key1' = 'value1' [, 'key' = 'value2']); 

-- Modify the comment of a catalog
ALTER CATALOG iceberg_catalog MODIFY COMMENT 'my iceberg catalog';
```

## データカタログの削除

`DROP CATALOG` を使用して、指定した外部データカタログを削除できます。

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```

Doris から外部データカタログを削除しても、実際のデータは削除されません。Doris に保存されているデータカタログのマッピングだけが削除されます。

## 権限管理

外部データカタログ内のデータベースとテーブルの権限管理は、内部テーブルの場合と同じです。詳細は[認証と認可](../admin-manual/auth/authentication-and-authorization.md)のドキュメントを参照してください。
