---
{
    "title": "データカタログの概要",
    "language": "ja",
    "description": "Apache Doris のデータカタログの概念と使い方を説明します。外部データカタログを作成して Hive、Iceberg、Paimon、PostgreSQL などのデータソースに接続し、複数のソースをまたぐ横断的なクエリ、データの取り込み、書き戻しを行えます。"
}
---

データカタログは、データソースの特性を記述します。

Doris では、Hive、Iceberg、Paimon、PostgreSQL など、異なるデータソースを参照する複数のデータカタログを作成できます。Doris はデータカタログを通じて、対応するデータソースからデータベース、テーブル、スキーマ、パーティション、データの保存場所を自動的に取得します。ユーザーは標準の SQL 文でこれらのデータカタログにアクセスしてデータを分析したり、複数のデータカタログにまたがるデータを結合してクエリしたりできます。

Doris のデータカタログには、次の種類があります。

| 種類 | 説明 |
| ---------------- | -------------------------------------------------------- |
| 内部カタログ | 名前が `internal` に固定された組み込みのデータカタログです。Doris の内部テーブルのデータを格納するために使用します。作成、変更、削除はできません。 |
| 外部カタログ | 内部カタログ以外のデータカタログです。ユーザーは外部データカタログを作成、変更、削除できます。 |

データカタログは主に以下の用途に利用できますが、対応する用途はデータカタログによって異なります。詳しくは各データカタログのドキュメントを参照してください。

| 用途 | 説明 |
| ---- | ------------------------------------------- |
| クエリの高速化 | Hive、Iceberg、Paimon などのレイクハウスデータに対するクエリを直接高速化します。 |
| データ統合 | ZeroETL 方式で異なるデータソースに直接アクセスして結果データを生成したり、異なるデータソース間でデータを容易に連携させたりします。 |
| データの書き戻し | Doris でデータを処理・変換し、外部データソースに書き戻します。 |

この記事では、[Iceberg Catalog](./catalogs/iceberg-catalog) を例に、データカタログの基本操作を説明します。各データカタログの詳細については、対応するデータカタログのドキュメントを参照してください。

## データカタログの作成 {#creating-a-data-catalog}

`CREATE CATALOG` 文を使用して Iceberg Catalog を作成します。

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

Doris で作成したデータカタログは、対応するデータソースのメタデータサービス（Hive Metastore など）とストレージサービス（HDFS/S3 など）にアクセスするための「プロキシ」として機能します。Doris が保存するのはデータカタログの接続プロパティなどの情報だけで、対応するデータソースの実際のメタデータやデータは保存しません。

### 共通プロパティ {#common-properties}

各データカタログ固有のプロパティに加えて、この節ではすべてのデータカタログに共通するプロパティ `{CommonProperties}` を説明します。

| プロパティ | 説明 | 例 |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `include_database_list` | 同期する複数のデータベースを `,` 区切りで指定します。デフォルトではすべてのデータベースを同期します。データベース名では大文字と小文字が区別されます。外部データソースに多数のデータベースがあるものの、アクセスが必要なものが少数の場合、このパラメータを使うと大量のメタデータの同期を避けられます。 | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list` | 同期対象から除外する複数のデータベースを `,` 区切りで指定します。デフォルトではフィルタリングされず、すべてのデータベースを同期します。データベース名では大文字と小文字が区別されます。上記と同じ状況で、アクセスが不要なデータベースを除外する場合に使用します。指定が競合する場合は、`exclude` が `include` より優先されます。 | `'exclude_database_list' = 'db1,db2'` |
| `include_table_list` | 同期する複数のテーブルを `db.tbl` 形式で、`,` 区切りで指定します。設定すると、データベース内のテーブルを一覧表示する際、リモートのメタデータサービスからテーブルの全一覧を取得せず、指定したテーブルだけを返します。外部データソースに多数のテーブルがあり、全一覧の取得がタイムアウトする可能性がある場合に使用します。 | `'include_table_list' = 'db1.tbl1,db1.tbl2,db2.tbl3'` |
| `lower_case_table_names` | カタログ単位でテーブル名の大文字と小文字の扱いを制御します。値とその意味については、後述の[テーブル名の大文字と小文字の区別](#table-name-case-sensitivity-lower_case_table_names)を参照してください。デフォルト値はグローバル変数 `lower_case_table_names` から継承されます。 | `'lower_case_table_names' = '1'` |
| `lower_case_database_names` | カタログ単位でデータベース名の大文字と小文字の扱いを制御します。値とその意味については、後述の[データベース名の大文字と小文字の区別](#database-name-case-sensitivity-lower_case_database_names)を参照してください。デフォルト値は `0`（大文字と小文字を区別）です。 | `'lower_case_database_names' = '2'` |

### テーブル一覧の指定 {#specifying-table-list}

この機能はバージョン 4.1.0 以降でサポートされています。

外部データソース（Hive Metastore など）に多数のテーブルがある場合、リモートのメタデータサービスからテーブルの全一覧を取得するには長い時間がかかり、タイムアウトすることもあります。`include_table_list` プロパティを設定すると、同期するテーブルを指定し、リモートから全一覧を取得せずに済みます。

`include_table_list` では `db.tbl` 形式を使用し、複数のテーブルをカンマ `,` で区切ります。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'include_table_list' = 'db1.table1,db1.table2,db2.table3'
);
```

設定後の動作は次のとおりです。

- `db1` 内のテーブルを一覧表示すると、リモートのメタデータサービスの全テーブル一覧 API を呼び出さず、`table1` と `table2` だけを返します。
- `db2` 内のテーブルを一覧表示すると、`table3` だけを返します。
- `include_table_list` に含まれないデータベース（`db3` など）については、引き続きリモートのメタデータサービスからテーブルの全一覧を取得します。
- `include_table_list` の形式が正しくない項目（`db.tbl` 形式ではない項目）は無視されます。

:::tip
このプロパティは `include_database_list` と組み合わせて使用できます。たとえば、まず `include_database_list` で必要なデータベースを絞り込み、次に `include_table_list` で必要なテーブルを指定します。
:::

### テーブル名の大文字と小文字の区別 {#table-name-case-sensitivity-lower_case_table_names}

この機能はバージョン 4.1.0 以降でサポートされています。

`lower_case_table_names` プロパティを使うと、カタログ単位でテーブル名の大文字と小文字の扱いを制御できます。このプロパティには次のモードがあります。

| 値 | モード | 説明 |
| -- | ---- | ---- |
| `0` | 大文字と小文字を区別（デフォルト） | テーブル名を元の大文字と小文字のまま保存し、比較します。テーブル名を参照する際は、リモートのメタデータでの表記と完全に一致させる必要があります。 |
| `1` | 小文字で保存 | Doris ではテーブル名を小文字で保存します。外部データソースのテーブルに一律に小文字の名前でアクセスしたい場合に適しています。 |
| `2` | 大文字と小文字を区別せずに比較 | テーブル名の比較では大文字と小文字を区別しませんが、表示時にはリモートのメタデータにある元の表記を維持します。外部データソースでテーブル名の大文字と小文字の使い方が統一されておらず、区別せずにテーブルへアクセスしたい場合に適しています。 |

このプロパティを設定しない場合、デフォルトではグローバル変数 `lower_case_table_names` の値を継承します。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_table_names' = '2'
);
```

:::caution
`lower_case_table_names` を `1` または `2` に設定した場合、リモートのメタデータに `MyTable` と `mytable` のように大文字と小文字だけが異なる名前のテーブルがあると、競合が発生する可能性があります。Doris はそのような競合を検出してエラーを報告します。
:::

### データベース名の大文字と小文字の区別 {#database-name-case-sensitivity-lower_case_database_names}

この機能はバージョン 4.1.0 以降でサポートされています。

`lower_case_database_names` プロパティを使うと、カタログ単位でデータベース名の大文字と小文字の扱いを制御できます。このプロパティには次のモードがあります。

| 値 | モード | 説明 |
| -- | ---- | ---- |
| `0` | 大文字と小文字を区別（デフォルト） | データベース名を元の大文字と小文字のまま保存し、比較します。データベース名を参照する際は、リモートのメタデータでの表記と完全に一致させる必要があります。 |
| `1` | 小文字で保存 | Doris ではデータベース名を小文字で保存します。外部データソースのデータベースに一律に小文字の名前でアクセスしたい場合に適しています。 |
| `2` | 大文字と小文字を区別せずに比較 | データベース名の比較では大文字と小文字を区別しませんが、表示時にはリモートのメタデータにある元の表記を維持します。外部データソースでデータベース名の大文字と小文字の使い方が統一されておらず、区別せずにデータベースへアクセスしたい場合に適しています。 |

デフォルト値は `0`（大文字と小文字を区別）です。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_database_names' = '2',
    'lower_case_table_names' = '2'
);
```

:::caution
`lower_case_database_names` を `1` または `2` に設定した場合、リモートのメタデータに `MyDB` と `mydb` のように大文字と小文字だけが異なる名前のデータベースがあると、競合が発生する可能性があります。Doris はそのような競合を検出してエラーを報告します。
:::

:::info
`lower_case_database_names` と `lower_case_table_names` は互いに影響を与えず、個別に設定できます。たとえば、データベース名は大文字と小文字を区別する設定（`0`）にし、テーブル名は区別しない設定（`2`）にできます。
:::

### カラム型のマッピング {#column-type-mapping}

ユーザーがデータカタログを作成すると、Doris はそのデータカタログのデータベース、テーブル、スキーマを自動的に同期します。データカタログごとのカラム型のマッピング規則については、対応するデータカタログのドキュメントを参照してください。

`UNION` や `INTERVAL` など、現在 Doris のカラム型にマッピングできない外部データ型は、カラム型が `UNSUPPORTED` にマッピングされます。`UNSUPPORTED` 型を含むクエリの動作を、以下の例に示します。

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

### Nullable プロパティ {#nullable-property}

Doris では現在、外部テーブルのカラムに対する Nullable プロパティのサポートに特別な制約があります。具体的な動作は次のとおりです。

| ソース側の型 | Doris での読み取り動作 | Doris での書き込み動作 |
| --- | --- | --- |
| Nullable | Nullable | NULL 値を書き込めます。 |
| Not Null | Nullable。つまり、引き続き NULL を許容するカラムとして読み取ります。 | NULL 値を書き込めます。つまり、NULL 値の厳密なチェックは行いません。ユーザー自身がデータの完全性と一貫性を確保する必要があります。 |

## データカタログの使用 {#using-data-catalogs}

### データカタログの表示 {#viewing-data-catalogs}

作成後は、`SHOW CATALOGS` コマンドでカタログを表示できます。

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

### データカタログの切り替え {#switching-data-catalogs}

Doris には、接続セッションのコンテキストを対象のデータカタログに切り替える `SWITCH` 文があります。これは、`USE` 文でデータベースを切り替える操作と似ています。

データカタログを切り替えた後は、`USE` 文で特定のデータベースに切り替えたり、`SHOW DATABASES` で現在のデータカタログ内のデータベースを表示したりできます。

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

`USE` 文に完全修飾名 `catalog_name.database_name` を指定すると、特定のデータカタログ内の特定のデータベースに直接切り替えることもできます。

```sql
USE iceberg_catalog.iceberg_db;
```

完全修飾名は、MySQL 接続プロトコルとの互換性を保つため、MySQL コマンドラインや JDBC 接続文字列でも使用できます。

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```

組み込みのデータカタログの名前は `internal` に固定されています。切り替え方法は外部データカタログと同じです。

### デフォルトのデータカタログ {#default-data-catalog}

ユーザープロパティ `default_init_catalog` を使用すると、特定のユーザーのデフォルトのデータカタログを設定できます。設定後、そのユーザーが Doris に接続すると、セッションは設定したデータカタログに自動的に切り替わります。

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```

注 1: MySQL コマンドラインまたは JDBC 接続文字列でデータカタログを明示的に指定した場合は、そちらが優先され、ユーザープロパティ `default_init_catalog` は適用されません。

注 2: ユーザープロパティ `default_init_catalog` で設定したデータカタログが存在しなくなった場合、セッションはデフォルトの `internal` データカタログに自動的に切り替わります。

注 3: この機能はバージョン 3.1.x 以降でサポートされています。

### 単純なクエリ {#simple-queries}

Doris がサポートする任意の SQL 文を使用して、外部データカタログのテーブルにクエリできます。

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```

### カタログをまたぐクエリ {#cross-catalog-queries}

Doris は、データカタログをまたぐ結合クエリをサポートしています。

ここでは、別の [MySQL Catalog](./catalogs/jdbc-mysql-catalog.md) を作成します。

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

### データの取り込み {#data-ingestion}

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

### データの書き戻し {#data-write-back}

Doris は、`INSERT` 文を使用して外部データソースにデータを直接書き戻すことをサポートしています。詳しくは、以下を参照してください。

* [Hive Catalog](./catalogs/hive-catalog.mdx)

* [Iceberg Catalog](./catalogs/iceberg-catalog.mdx)

* [JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## データカタログの更新 {#refreshing-data-catalogs}

Doris で作成したデータカタログは、対応するデータソースのメタデータサービスにアクセスするための「プロキシ」として機能します。Doris は一部のメタデータをキャッシュします。キャッシュによってメタデータへのアクセス性能が向上し、ネットワークを介した頻繁なリクエストを避けられます。一方、キャッシュを更新しないと最新のメタデータにはアクセスできません。そのため、Doris にはデータカタログを更新する方法が複数用意されています。

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```

Doris では、メタデータのキャッシュを無効にして、最新のメタデータにリアルタイムでアクセスすることもできます。

- Doris 4.1.x より前のバージョン: [メタデータキャッシュ](./meta-cache.md)を参照してください。
- Doris 4.1.x 以降: 各 Catalog のドキュメントにある「メタデータキャッシュ」の節を参照してください。
    - [Hive Catalog](./catalogs/hive-catalog.mdx#meta-cache)
    - [Iceberg Catalog](./catalogs/iceberg-catalog.mdx#meta-cache)
    - [Hudi Catalog](./catalogs/hudi-catalog.md#meta-cache)
    - [Paimon Catalog](./catalogs/paimon-catalog.mdx#meta-cache)
    - [MaxCompute Catalog](./catalogs/maxcompute-catalog.md#meta-cache)

## データカタログの変更 {#modifying-data-catalogs}

`ALTER CATALOG` を使用して、データカタログのプロパティまたは名前を変更できます。

```sql
-- Rename a catalog
ALTER CATALOG iceberg_catalog RENAME iceberg_catalog2;

-- Modify properties of a catalog
ALTER CATALOG iceberg_catalog SET PROPERTIES ('key1' = 'value1' [, 'key' = 'value2']);

-- Modify the comment of a catalog
ALTER CATALOG iceberg_catalog MODIFY COMMENT 'my iceberg catalog';
```

## データカタログの削除 {#dropping-data-catalogs}

`DROP CATALOG` を使用して、指定した外部データカタログを削除できます。

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```

Doris から外部データカタログを削除しても、実際のデータは削除されません。Doris に保存されたデータカタログのマッピングだけが削除されます。

## 権限管理 {#permission-management}

外部データカタログ内のデータベースとテーブルの権限管理は、内部テーブルの場合と同じです。詳しくは、[認証と認可](../admin-manual/auth/authentication-and-authorization.md)のドキュメントを参照してください。

## 外部テーブルのパーティション定義の検証（4.1.5 以降） {#external-table-partition-validation-since-415}

4.1.5 以降、外部テーブルの作成時には、パーティション定義を変換する前に Catalog のパーティションモデルを検証します。

| Catalog | サポートされる定義 | サポートされない定義 |
| --- | --- | --- |
| Hive | 既存のカラム名を使用する `PARTITION BY LIST` | RANGE、パーティション式、明示的なパーティション値 |
| Paimon / MaxCompute | カラム名で指定するパーティションキー | パーティション関数式と明示的なパーティション値 |
| Iceberg | サポート対象のカラムまたは変換を使用するパーティション定義 | Doris の内部テーブル構文による明示的なパーティション値 |

パーティション値を列挙する内部テーブルの定義を、外部テーブルに流用しないでください。たとえば、Hive は書き込まれたデータからパーティションを作成するため、事前に `VALUES IN (...)` を列挙する必要はありません。
