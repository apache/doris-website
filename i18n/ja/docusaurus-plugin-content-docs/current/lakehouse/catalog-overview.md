---
{
  "title": "データカタログ概要",
  "language": "ja",
  "description": "Apache Doris Data Catalogの概念と使用方法について学習します。外部データカタログを作成してHive、Iceberg、Paimon、PostgreSQL、その他のデータソースに接続し、フェデレーテッドクロスソースクエリ、データ取り込み、ライトバックを行います。"
}
---
Data Catalogは、データソースのプロパティを記述します。

Dorisでは、異なるデータソース（Hive、Iceberg、Paimon、PostgreSQLなど）を指す複数のdata catalogを作成できます。Dorisは、data catalogを通じて対応するデータソースからデータベース、テーブル、スキーマ、パーティション、およびデータの場所を自動的に取得します。ユーザーは標準のSQL文を使用してこれらのdata catalogにアクセスしてデータ分析を行い、複数のdata catalog間のデータで結合クエリを実行できます。

Dorisには2種類のdata catalogがあります：

| Type | Description |
| ---------------- | -------------------------------------------------------- |
| Internal Catalog | `internal`という固定名を持つ組み込みdata catalogで、Doris内部テーブルデータを格納するために使用されます。作成、変更、削除することはできません。 |
| External Catalog | 外部data catalogで、Internal Catalog以外のすべてのdata catalogを指します。ユーザーは外部data catalogを作成、変更、削除できます。 |

Data catalogは主に以下の3種類のシナリオに適用されますが、異なるdata catalogには異なる適用シナリオがあります。詳細については対応するdata catalogのドキュメントを参照してください。

| Scenario | Description |
| ---- | ------------------------------------------- |
| Query Acceleration | Hive、Iceberg、Paimonなどのlakehouseデータに対するクエリを直接高速化します。 |
| Data Integration | ZeroETLアプローチで異なるデータソースに直接アクセスして結果データを生成するか、異なるデータソース間の便利なデータフローを可能にします。 |
| Data Write-Back | Dorisを通じてデータを処理および変換し、外部データソースに書き戻します。 |

この記事では[Iceberg Catalog](./catalogs/iceberg-catalog)を例として、data catalogの基本操作を紹介します。異なるdata catalogの詳細については、対応するdata catalogのドキュメントを参照してください。

## Data Catalogの作成

`CREATE CATALOG`文を使用してIceberg Catalogを作成します。

```sql
CREATE CATALOG iceberg_catalog PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'hadoop',
    'warehouse' = 's3://bucket/dir/key',
    's3.endpoint' = 's3.us-east-1.amazonaws.com',
    's3.access_key' = 'ak',
    's3.secret_key' = 'sk'
);
```
基本的に、Dorisで作成されたdata catalogは、対応するデータソースのメタデータサービス（Hive Metastoreなど）およびストレージサービス（HDFS/S3など）にアクセスするための「プロキシ」として機能します。Dorisは、対応するデータソースの実際のメタデータやデータではなく、data catalogに関する接続プロパティおよびその他の情報のみを保存します。

### 共通プロパティ

各data catalogに固有のプロパティセットに加えて、このセクションでは、すべてのdata catalogで共有される共通プロパティ`{CommonProperties}`について説明します。

| Property | Description | Example |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `include_database_list` | 同期する複数のデータベースを`,`で区切って指定します。デフォルトでは、すべてのデータベースが同期されます。データベース名は大文字小文字を区別します。外部データソースに多数のデータベースがあるが、アクセスする必要があるのは少数のみの場合、このパラメータを使用して大量のメタデータの同期を回避できます。 | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list` | 同期から除外する複数のデータベースを`,`で区切って指定します。デフォルトでは、フィルタリングは適用されず、すべてのデータベースが同期されます。データベース名は大文字小文字を区別します。上記と同じシナリオに適用されますが、アクセスする必要がないデータベースを逆に除外します。競合する場合、`exclude`が`include`より優先されます。 | `'exclude_database_list' = 'db1,db2'` |
| `include_table_list` | 同期する複数のテーブルを`db.tbl`形式で`,`で区切って指定します。設定すると、データベース下のテーブル一覧は、リモートメタデータサービスから完全なテーブルリストを取得するのではなく、指定されたテーブルのみを返します。外部データソースに多数のテーブルがあり、完全なテーブルリストの取得がタイムアウトする可能性がある場合に適用されます。 | `'include_table_list' = 'db1.tbl1,db1.tbl2,db2.tbl3'` |
| `lower_case_table_names` | Catalogレベルのテーブル名の大文字小文字制御。値とその意味については、下記の[テーブル名の大文字小文字区別](#table-name-case-sensitivity-lower_case_table_names)セクションを参照してください。デフォルト値はグローバル変数`lower_case_table_names`から継承されます。 | `'lower_case_table_names' = '1'` |
| `lower_case_database_names` | Catalogレベルのデータベース名の大文字小文字制御。値とその意味については、下記の[データベース名の大文字小文字区別](#database-name-case-sensitivity-lower_case_database_names)セクションを参照してください。デフォルト値は`0`（大文字小文字を区別）です。 | `'lower_case_database_names' = '2'` |

### テーブルリストの指定

この機能はバージョン4.1.0以降でサポートされています。

外部データソース（Hive Metastoreなど）に多数のテーブルが含まれている場合、リモートメタデータサービスから完全なテーブルリストを取得するのは非常に時間がかかったり、タイムアウトしたりすることがあります。`include_table_list`プロパティを設定することで、同期するテーブルを指定し、リモートから完全なテーブルリストを取得することを回避できます。

`include_table_list`は`db.tbl`形式を使用し、複数のテーブルはカンマ`,`で区切ります。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'include_table_list' = 'db1.table1,db1.table2,db2.table3'
);
```
設定後の動作：

- `db1` 配下のテーブルをリストする際、リモートメタデータサービスの完全なテーブルリストAPIを呼び出すことなく、`table1` と `table2` のみが返されます。
- `db2` 配下のテーブルをリストする際、`table3` のみが返されます。
- `include_table_list` に含まれていないデータベース（`db3` など）については、リモートメタデータサービスから完全なテーブルリストが取得されます。
- `include_table_list` 内の不正な形式のエントリ（`db.tbl` 形式でないもの）は無視されます。

:::tip
このプロパティは `include_database_list` と組み合わせて使用できます。例えば、まず `include_database_list` を使用して必要なデータベースをフィルタリングし、次に `include_table_list` を使用して必要なテーブルをさらに指定します。
:::

### テーブル名の大文字小文字の区別

この機能はバージョン 4.1.0 以降でサポートされています。

`lower_case_table_names` プロパティを使用して、Catalogレベルでテーブル名の大文字小文字の処理を制御できます。このプロパティは3つのモードをサポートしています：

| 値 | モード | 説明 |
| -- | ---- | ---- |
| `0` | 大文字小文字を区別（デフォルト） | テーブル名は元の大文字小文字で保存・比較されます。テーブル名を参照する際は、リモートメタデータの大文字小文字と正確に一致する必要があります。 |
| `1` | 小文字で保存 | テーブル名はDoris内で小文字で保存されます。外部データソースへのアクセスに小文字のテーブル名を統一して使用したいシナリオに適しています。 |
| `2` | 大文字小文字を区別しない比較 | テーブル名は大文字小文字を区別しない方法で比較されますが、表示時はリモートメタデータの元の大文字小文字が保持されます。外部データソース内でテーブル名の大文字小文字が不統一で、大文字小文字を区別しない方法でテーブルにアクセスしたいシナリオに適しています。 |

このプロパティが設定されていない場合、デフォルトでグローバル変数 `lower_case_table_names` の値を継承します。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_table_names' = '2'
);
```
:::caution
`lower_case_table_names`が`1`または`2`に設定されている場合、リモートメタデータに大文字小文字のみが異なる名前のテーブルが存在すると（`MyTable`と`mytable`など）、競合が発生する可能性があります。Dorisはこのような競合を検出してエラーを報告します。
:::

### データベース名の大文字小文字の区別

この機能はバージョン4.1.0以降でサポートされています。

`lower_case_database_names`プロパティを使用すると、Catalogレベルでデータベース名の大文字小文字の処理を制御できます。このプロパティは3つのモードをサポートします：

| 値 | モード | 説明 |
| -- | ---- | ---- |
| `0` | 大文字小文字を区別（デフォルト） | データベース名は元の大文字小文字で保存・比較されます。データベース名を参照する際は、リモートメタデータの大文字小文字と正確に一致する必要があります。 |
| `1` | 小文字で保存 | データベース名はDoris内で小文字で保存されます。外部データソースへのアクセスに小文字のデータベース名を統一して使用したいシナリオに適しています。 |
| `2` | 大文字小文字を区別しない比較 | データベース名は大文字小文字を区別せずに比較されますが、表示時はリモートメタデータの元の大文字小文字が保持されます。外部データソースでデータベース名の大文字小文字が一貫していない場合に、大文字小文字を区別せずにデータベースにアクセスしたいシナリオに適しています。 |

デフォルト値は`0`（大文字小文字を区別）です。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_database_names' = '2',
    'lower_case_table_names' = '2'
);
```
:::caution
`lower_case_database_names`が`1`または`2`に設定されている場合、リモートメタデータに大文字小文字のみが異なる名前のデータベース（`MyDB`と`mydb`など）が存在すると、競合が発生する可能性があります。Dorisはそのような競合を検出し、エラーを報告します。
:::

:::info
`lower_case_database_names`と`lower_case_table_names`は互いに影響することなく独立して設定できます。例えば、データベース名を大文字小文字を区別する（`0`）に設定しながら、テーブル名を大文字小文字を区別しない（`2`）に設定することができます。
:::

### カラムタイプマッピング

ユーザーがデータカタログを作成した後、Dorisは自動的にデータカタログのデータベース、テーブル、スキーマを同期します。異なるデータカタログのカラムタイプマッピングルールについては、対応するデータカタログのドキュメントを参照してください。

`UNION`、`INTERVAL`などの現在Dorisカラムタイプにマップできない外部データタイプについては、Dorisはカラムタイプを`UNSUPPORTED`にマップします。`UNSUPPORTED`タイプを含むクエリについては、以下の例を参照してください：

同期されたテーブルスキーマが以下であると仮定します：

```text
k1 INT,
k2 INT,
k3 UNSUPPORTED,
k4 INT
```
クエリの動作は次のとおりです：

```sql
SELECT * FROM table;                -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT * EXCEPT(k3) FROM table;     -- Query OK.
SELECT k1, k3 FROM table;           -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT k1, k4 FROM table;           -- Query OK.
```
### Nullable プロパティ

Doris は現在、外部テーブルカラムの Nullable プロパティサポートに特別な制限があります。具体的な動作は以下の通りです：

| Source Type | Doris Read Behavior | Doris Write Behavior |
| --- | --- | --- |
| Nullable | Nullable | Null 値の書き込みを許可 |
| Not Null | Nullable、つまり NULL を許可するカラムとして読み込まれる | Null 値の書き込みを許可、つまり Null 値に対する厳密なチェックは行われない。ユーザーは自身でデータの整合性と一貫性を確保する必要がある。 |

## Data Catalog の使用

### Data Catalog の表示

作成後、`SHOW CATALOGS` コマンドを使用してカタログを表示できます：

```text
mysql> SHOW CATALOGS;
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
| CatalogId | CatalogName     | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
|     10024 | iceberg_catalog | hms      | yes       | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
|         0 | internal        | internal |           | NULL                    | NULL                | Doris internal catalog |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
```
[SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG)を使用してCREATE CATALOGステートメントを表示できます。

### Data Catalogの切り替え

Dorisは`SWITCH`ステートメントを提供しており、接続セッションのコンテキストを対応するdata catalogに切り替えることができます。これは`USE`ステートメントを使用してデータベースを切り替えることと似ています。

data catalogに切り替えた後、`USE`ステートメントを使用して特定のデータベースにさらに切り替えたり、`SHOW DATABASES`を使用して現在のdata catalog下のデータベースを表示したりできます。

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
また、`USE` ステートメントを完全修飾名 `catalog_name.database_name` と一緒に使用して、特定のデータカタログ下の特定のデータベースに直接切り替えることもできます：

```sql
USE iceberg_catalog.iceberg_db;
```
完全修飾名はMySQL command lineやJDBC接続文字列でも使用でき、MySQL接続プロトコルと互換性があります。

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```
ビルトインデータカタログは`internal`という固定名を持ちます。切り替え方法は外部データカタログと同じです。

### デフォルトデータカタログ

ユーザープロパティ`default_init_catalog`を使用して、特定のユーザーのデフォルトデータカタログを設定します。設定すると、指定されたユーザーがDorisに接続した際に、セッションは自動的に設定されたデータカタログに切り替わります。

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```
注意 1: MySQL コマンドラインまたは JDBC 接続文字列でデータカタログが明示的に指定されている場合、指定されたものが優先され、`default_init_catalog` ユーザープロパティは効果を持ちません。

注意 2: ユーザープロパティ `default_init_catalog` で設定されたデータカタログが存在しなくなった場合、セッションは自動的にデフォルトの `internal` データカタログに切り替わります。

注意 3: この機能はバージョン 3.1.x 以降で利用可能です。

### 簡単なクエリ

Doris でサポートされている任意の SQL 文を使用して、外部データカタログ内のテーブルをクエリできます。

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```
### Cross-Catalog クエリ

Doris はデータカタログ間での結合クエリをサポートしています。

ここで別の [MySQL Catalog](./catalogs/jdbc-mysql-catalog.md) を作成します：

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
その後、SQLを使用してIcebergテーブルとMySQLテーブル間の結合クエリを実行します：

```sql
SELECT * FROM
iceberg_catalog.iceberg_db.table1 tbl1 JOIN mysql_catalog.mysql_db.dim_table tbl2
ON tbl1.id = tbl2.id;
```
### データ取り込み

`INSERT`コマンドを使用して、データソースからDorisにデータをインポートできます。

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```
外部データソースからDoris内部テーブルを作成してデータをインポートするために、`CTAS (Create Table As Select)`文を使用することもできます。

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```
### データライトバック

Dorisは`INSERT`文を使用して外部データソースに直接データを書き戻すことをサポートしています。詳細については、以下を参照してください：

* [Hive Catalog](./catalogs/hive-catalog.mdx)

* [Iceberg Catalog](./catalogs/iceberg-catalog.mdx)

* [JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## データカタログの更新

Dorisで作成されたデータカタログは、対応するデータソースのメタデータサービスにアクセスするための「プロキシ」として機能します。Dorisは一部のメタデータをキャッシュします。キャッシュはメタデータアクセス性能を向上させ、頻繁なネットワーク間リクエストを回避できます。しかし、キャッシュには適時性の問題もあります。キャッシュが更新されない場合、最新のメタデータにアクセスできません。そのため、Dorisはデータカタログを更新する複数の方法を提供しています。

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```
Dorisはまた、最新のメタデータへのリアルタイムアクセスを可能にするため、メタデータキャッシュを無効にすることもサポートしています。

メタデータキャッシュの詳細情報と設定については、以下を参照してください：[Metadata Cache](./meta-cache.md)

## データカタログの変更

`ALTER CATALOG`を使用してデータカタログのプロパティや名前を変更できます：

```sql
-- Rename a catalog
ALTER CATALOG iceberg_catalog RENAME iceberg_catalog2;

-- Modify properties of a catalog
ALTER CATALOG iceberg_catalog SET PROPERTIES ('key1' = 'value1' [, 'key' = 'value2']); 

-- Modify the comment of a catalog
ALTER CATALOG iceberg_catalog MODIFY COMMENT 'my iceberg catalog';
```
## データカタログの削除

`DROP CATALOG`を使用して、指定した外部データカタログを削除できます。

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```
Dorisから外部データカタログを削除しても、実際のデータは削除されません。Dorisに保存されているデータカタログマッピングのみが削除されます。

## 権限管理

外部データカタログ内のデータベースとテーブルの権限管理は、内部テーブルと同様です。詳細については、[Authentication and Authorization](../admin-manual/auth/authentication-and-authorization.md)ドキュメントを参照してください。
