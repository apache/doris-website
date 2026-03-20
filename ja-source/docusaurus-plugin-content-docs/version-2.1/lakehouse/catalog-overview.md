---
{
  "title": "データカタログ概要",
  "language": "ja",
  "description": "データカタログは、データソースの属性を記述するために使用されます。"
}
---
Data カタログはデータソースの属性を記述するために使用されます。

Dorisでは、異なるデータソース（Hive、Iceberg、MySQLなど）を指すために複数のcatalogを作成できます。Dorisはcatalogを通じて、対応するデータソースのデータベース、テーブル、カラム、パーティション、データの場所などを自動的に取得します。ユーザーは標準SQLステートメントを通じてこれらのcatalogにアクセスしてデータ分析を行い、複数のcatalogのデータに対してjoinクエリを実行できます。

Dorisには2種類のcatalogがあります：

| タイプ                         | 詳細 |
| ---------------- | -------------------------------------------------------- |
| Internal カタログ | 組み込みのcatalogで、`internal`という名前が付けられ、Doris内部テーブルデータの保存に使用されます。作成、変更、削除はできません。      |
| External カタログ | External catalogはInternal カタログ以外のすべてのcatalogを指します。ユーザーはexternal catalogの作成、変更、削除ができます。 |

カタログは主に以下の3つのシナリオに適用されますが、異なるcatalogは異なるシナリオに適しています。詳細については、対応するcatalogのドキュメントを参照してください。

| シナリオ | 詳細      |
| ---- | ------------------------------------------- |
| クエリ加速 | Hive、Iceberg、Paimonなどのデータレイクに対する直接クエリ加速。      |
| Data 統合 | ZeroETLソリューション、異なるデータソースに直接アクセスして結果データを生成、または異なるデータソース間のデータフローを促進。 |
| データ書き戻し | Dorisを介したデータ処理後、外部データソースへの書き戻し。                |

本ドキュメントでは[Iceberg カタログ](./catalogs/iceberg-catalog.mdx)を例として、catalogの基本操作に焦点を当てます。異なるcatalogの詳細な説明については、対応するcatalogのドキュメントを参照してください。

## カタログの作成

`CREATE CATALOG`ステートメントを使用してIceberg カタログを作成します。

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
基本的に、Dorisで作成されたcatalogは、対応するデータソースのメタデータサービス（Hive Metastoreなど）およびストレージサービス（HDFS/S3など）にアクセスするための「プロキシ」として機能します。Dorisはcatalogの接続プロパティなどの情報のみを保存し、対応するデータソースの実際のメタデータやデータは保存しません。

### 共通プロパティ

各catalogに固有のプロパティセットに加えて、すべてのcatalog `{CommonProperties}`に共通するプロパティを以下に示します。

| プロパティ名            | 説明                                                                                                                          | 例                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `include_database_list`  | 指定したDatabaseのみの同期をサポートし、`,`で区切ります。デフォルトでは、すべてのDatabaseが同期されます。Database名は大文字小文字を区別します。外部データソースに多くのDatabaseが存在するが、アクセスが必要なのは少数の場合に、大量のメタデータの同期を避けるためにこのパラメータを使用します。 | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list`  | 同期する必要のない複数のDatabaseの指定をサポートし、`,`で区切ります。デフォルトではフィルタリングは適用されず、すべてのDatabaseが同期されます。Database名は大文字小文字を区別します。これは上記と同じシナリオで使用され、アクセスする必要のないdatabaseを除外するために使用されます。競合がある場合、`exclude`は`include`よりも優先されます。 | `'exclude_database_list' = 'db1,db2'` |


### カラムタイプマッピング

ユーザーがcatalogを作成すると、Dorisは自動的にcatalogのデータベース、テーブル、およびカラムを同期します。異なるcatalogのカラムタイプマッピングルールについては、対応するcatalogのドキュメントを参照してください。

現在Dorisカラムタイプにマッピングできない外部データタイプ（`UNION`、`INTERVAL`など）については、Dorisはカラムタイプを`UNSUPPORTED`にマッピングします。`UNSUPPORTED`タイプを含むクエリについては、以下の例を参照してください：

同期されたテーブルスキーマが以下であると仮定します：

```text
k1 INT,
k2 INT,
k3 UNSUPPORTED,
k4 INT
```
クエリの動作は以下の通りです：

```sql
SELECT * FROM table;                -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT * EXCEPT(k3) FROM table;     -- Query OK.
SELECT k1, k3 FROM table;           -- Error: Unsupported type 'UNSUPPORTED_TYPE' in 'k3'
SELECT k1, k4 FROM table;           -- Query OK.
```
### Nullable属性

Dorisは現在、外部テーブルカラムのNullable属性サポートに特別な制限があり、具体的な動作は以下の通りです：

| ソースタイプ | Doris読み取り動作 | Doris書き込み動作 |
| ---   | ------------  | ------------ |
| Nullable | Nullable  | Null値の書き込みを許可 |
| Not Null | Nullable、つまり読み取り時にNULLを許可するカラムとして扱われる | Null値の書き込みを許可、つまりNull値の厳密なチェックは行わない。ユーザーは自分でデータの整合性と一貫性を確保する必要がある。|

## Catalogの使用

### Catalogの表示

作成後、`SHOW CATALOGS`コマンドを使用してcatalogを表示できます：

```text
mysql> SHOW CATALOGS;
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
| CatalogId | CatalogName     | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
|     10024 | iceberg_catalog | hms      | yes       | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
|         0 | internal        | internal |           | NULL                    | NULL                | Doris internal catalog |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
```
[SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG)を使用してカタログを作成するステートメントを表示できます。

### カタログの切り替え

Dorisは接続セッションのコンテキストを対応するカタログに切り替えるために`SWITCH`ステートメントを提供しています。これは`USE`ステートメントを使用してデータベースを切り替えるのと同様です。

カタログに切り替えた後、`USE`ステートメントを使用して指定されたデータベースへの切り替えを続行するか、`SHOW DATABASES`を使用して現在のカタログ下のデータベースを表示できます。

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
`USE`文を完全修飾名`catalog_name.database_name`と共に使用して、指定されたカタログ内の指定されたデータベースに直接切り替えることもできます：

```sql
USE iceberg_catalog.iceberg_db;
```
完全修飾名はMySQLコマンドラインやJDBC接続文字列でも使用でき、MySQL接続プロトコルと互換性があります。

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```
ビルトインカタログの固定名は `internal` です。切り替え方法は外部カタログと同じです。

### デフォルトカタログ
ユーザー属性 `default_init_catalog` は、特定のユーザーのデフォルトカタログを設定するために使用されます。設定すると、指定されたユーザーがDorisに接続した際に、設定されたカタログに自動的に切り替わります。

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```
注意 1: catalogがMySQL command lineまたはJDBC connection stringsで明示的に指定されている場合、指定されたcatalogが使用され、`default_init_catalog`ユーザー属性は効力を持ちません。
注意 2: ユーザー属性`default_init_catalog`によって設定されたcatalogが存在しなくなった場合、自動的にデフォルトの`internal` catalogに切り替わります。
注意 3: この機能はバージョンv3.1.x以降で有効になります。

### Simple Query

Dorisでサポートされている任意のSQL文を使用して、external catalogsのテーブルをクエリできます。

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```
### Cross-Catalog Query

Dorisは異なるカタログ間でのjoinクエリをサポートしています。

ここで、別のMySQL Catalogを作成してみましょう：

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
### データインポート

`INSERT`コマンドを使用してデータソースからDorisにデータをインポートできます。

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```
外部データソースから内部Dorisテーブルを作成してデータをインポートするために、`CTAS (Create Table As Select)`文を使用することもできます：

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```
### データライトバック

Dorisは`INSERT`文を使用して外部データソースへのデータ書き戻しをサポートしています。詳細については以下を参照してください：

* [Hive Catalog](./catalogs/hive-catalog.mdx)
* [Iceberg Catalog](./catalogs/iceberg-catalog.mdx)
* [JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## Catalogの更新

Dorisで作成されたCatalogは、対応するデータソースのメタデータサービスにアクセスするための「プロキシ」として機能します。Dorisはアクセス性能を向上させ、頻繁なネットワーク間リクエストを削減するために一部のメタデータをキャッシュします。ただし、キャッシュには有効期限があり、更新しなければ最新のメタデータにアクセスできません。そのため、DorisはCatalogを更新するためのいくつかの方法を提供しています。

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```
Dorisはまた、最新のメタデータにリアルタイムでアクセスするために、メタデータキャッシングを無効にすることもサポートしています。

メタデータキャッシングの詳細情報と設定については、以下を参照してください：[Metadata Cache](./meta-cache.md)

## Catalogの変更

`ALTER CATALOG`文を使用して、catalogのプロパティや名前を変更できます：

```sql
-- Rename a catalog
ALTER CATALOG iceberg_catalog RENAME iceberg_catalog2;

-- Modify properties of a catalog
ALTER CATALOG iceberg_catalog SET PROPERTIES ('key1' = 'value1' [, 'key' = 'value2']); 

-- Modify the comment of a catalog
ALTER CATALOG iceberg_catalog MODIFY COMMENT 'my iceberg catalog';
```
## Catalogの削除

`DROP CATALOG`文を使用して、指定した外部catalogを削除できます。

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```
DorisからExternal Catalogを削除しても実際のデータは削除されません。Dorisに保存されているマッピング関係のみが削除されます。

## 権限管理

External Catalog内のデータベースとテーブルの権限管理は、内部テーブルと同じです。詳細については、[Authentication and Authorization](../admin-manual/auth/authentication-and-authorization.md)ドキュメントを参照してください。
