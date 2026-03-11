---
{
  "title": "データカタログ概要",
  "description": "データカタログは、データソースの属性を記述するために使用されます。",
  "language": "ja"
}
---
データカタログは、データソースの属性を記述するために使用されます。

Dorisでは、複数のcatalogを作成して異なるデータソース（Hive、Iceberg、MySQLなど）を指すことができます。Dorisはcatalogを通じて、対応するデータソースのデータベース、table、カラム、パーティション、データ位置などを自動的に取得します。ユーザーは標準SQLステートメントを通じてこれらのcatalogにアクセスしてデータ分析を行うことができ、複数のcatalogのデータに対してjoinクエリを実行することができます。

Dorisには2種類のcatalogがあります：

| タイプ                         | デスクリプション |
| ---------------- | -------------------------------------------------------- |
| 内部カタログ | `internal`という名前の組み込みcatalogで、Doris内部tableデータを保存するために使用されます。作成、変更、削除はできません。      |
| 外部カタログ | 外部カタログは、内部カタログ以外のすべてのcatalogを指します。ユーザーは外部カタログを作成、変更、削除することができます。 |

カタログは主に以下の3つのシナリオに適用されますが、異なるcatalogは異なるシナリオに適しています。詳細については、対応するcatalogのドキュメントを参照してください。

| シナリオ | デスクリプション      |
| ---- | ------------------------------------------- |
| クエリ加速 | Hive、Iceberg、Paimonなどのデータレイクに対する直接クエリ高速化。      |
| データ統合 | ZeroETLソリューション、異なるデータソースに直接アクセスして結果データを生成、または異なるデータソース間のデータフローを促進。 |
| データ書き戻し | Doris経由でデータ処理後、外部データソースへの書き戻し。                |

このドキュメントでは[Iceberg カタログ](./catalogs/iceberg-catalog.mdx)を例として、catalogの基本操作に焦点を当てます。異なるcatalogの詳細な説明については、対応するcatalogのドキュメントを参照してください。

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
本質的に、Dorisで作成されたカタログは、対応するデータソースのメタデータサービス（Hive Metastoreなど）やストレージサービス（HDFS/S3など）にアクセスするための「プロキシ」として機能します。Dorisはカタログの接続プロパティやその他の情報のみを保存し、対応するデータソースの実際のメタデータやデータは保存しません。

### 共通プロパティ

各カタログ固有のプロパティセットに加えて、すべてのカタログに共通するプロパティ `{CommonProperties}` を以下に示します。

| Property Name            | デスクリプション                                                                                                                          | Example                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `include_database_list`  | 指定したDatabaseのみの同期をサポートし、`,`で区切ります。デフォルトでは、すべてのDatabaseが同期されます。Database名は大文字小文字を区別します。外部データソースに多数のDatabaseがあるが、アクセスが必要なのは少数のみの場合に、大量のメタデータの同期を避けるためにこのパラメータを使用します。 | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list`  | 同期が不要な複数のDatabaseの指定をサポートし、`,`で区切ります。デフォルトではフィルタリングは適用されず、すべてのDatabaseが同期されます。Database名は大文字小文字を区別します。これは上記と同じシナリオで、アクセスが不要なデータベースを除外するために使用されます。競合がある場合、`exclude`が`include`よりも優先されます。 | `'exclude_database_list' = 'db1,db2'` |


### カラム型マッピング

ユーザーがカタログを作成すると、Dorisは自動的にカタログのデータベース、Table、およびカラムを同期します。異なるカタログのカラム型マッピングルールについては、対応するカタログのドキュメントを参照してください。

現在Dorisのカラム型にマッピングできない外部データ型（`UNION`、`INTERVAL`など）について、Dorisはそのカラム型を`UNSUPPORTED`にマッピングします。`UNSUPPORTED`型を含むクエリについては、以下の例を参照してください：

同期されたTableスキーマが以下であると仮定します：

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

Dorisは現在、外部TableカラムのNullable属性サポートに特別な制限があり、具体的な動作は以下の通りです：

| Source タイプ | Doris Read Behavior | Doris Write Behavior |
| ---   | ------------  | ------------ |
| Nullable | Nullable  | Null値の書き込みを許可 |
| Not Null | Nullable、つまり読み取り時にはNULLを許可するカラムとして扱われる | Null値の書き込みを許可、つまりNull値に対する厳密なチェックは行われない。ユーザーはデータの整合性と一貫性を自分で保証する必要がある。|

## Catalogの使用

### Catalogの表示

作成後、`SHOW CATALOGS`コマンドを使用してcatalogを表示できます：

```text
mysql> SHOW CATALOGS;
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
| CatalogId | CatalogName     | タイプ     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
|     10024 | iceberg_catalog | hms      | yes       | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
|         0 | internal        | internal |           | NULL                    | NULL                | Doris 内部カタログ |
+-----------+-----------------+----------+-----------+-------------------------+---------------------+------------------------+
```
SHOW CREATE CATALOGを使用してカタログを作成するステートメントを表示できます。

### カタログの切り替え

Dorisは`SWITCH`ステートメントを提供して、接続セッションコンテキストを対応するカタログに切り替えます。これは`USE`ステートメントを使用してデータベースを切り替えるのと似ています。

カタログに切り替えた後、`USE`ステートメントを使用して指定されたデータベースに継続して切り替えることができます。または、`SHOW DATABASES`を使用して現在のカタログ下のデータベースを表示できます。

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
完全修飾名 `catalog_name.database_name` を使用して `USE` ステートメントを使用することで、指定されたカタログ内の指定されたデータベースに直接切り替えることもできます：

```sql
USE iceberg_catalog.iceberg_db;
```
完全修飾名は、MySQLコマンドラインやJDBC接続文字列でも使用でき、MySQL接続プロトコルとの互換性を保つことができます。

```sql
# Command line tool
mysql -h host -P9030 -uroot -Diceberg_catalog.iceberg_db

# JDBC url
jdbc:mysql://host:9030/iceberg_catalog.iceberg_db
```
組み込みカタログの固定名は `internal` です。切り替え方法は外部カタログと同じです。

### デフォルトカタログ
ユーザー属性 `default_init_catalog` は、特定のユーザーのデフォルトカタログを設定するために使用されます。一度設定すると、指定されたユーザーがDorisに接続した際に、設定されたカタログに自動的に切り替わります。

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```
注意 1: MySQL コマンドラインまたは JDBC 接続文字列でカタログが明示的に指定されている場合、指定されたカタログが使用され、`default_init_catalog` ユーザー属性は効果を持ちません。
注意 2: ユーザー属性 `default_init_catalog` で設定されたカタログが存在しなくなった場合、自動的にデフォルトの `internal` カタログに切り替わります。
注意 3: この機能はバージョン v3.1.x から有効になります。

### シンプルクエリ

Doris でサポートされている任意の SQL 文を使用して、外部カタログ内のTableをクエリできます。

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```
### Cross-カタログ Query

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
その後、SQLを使用してIcebergTableとMySQLTable間でjoinクエリを実行します：

```sql
SELECT * FROM
iceberg_catalog.iceberg_db.table1 tbl1 JOIN mysql_catalog.mysql_db.dim_table tbl2
ON tbl1.id = tbl2.id;
```
### Data Import

`INSERT` コマンドを使用してデータソースからDorisにデータをインポートできます。

```sql
INSERT INTO internal.doris_db.tbl1
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```
外部データソースからDoris内部Tableを作成してデータをインポートするために、`CTAS (Create Table As Select)`文を使用することもできます：

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```
### データライトバック

Dorisは`INSERT`文を使用して外部データソースへのデータライトバックをサポートしています。詳細については以下を参照してください：

* [Hive カタログ](./catalogs/hive-catalog.mdx)
* [Iceberg カタログ](./catalogs/iceberg-catalog.mdx)
* [JDBC カタログ](./catalogs/jdbc-catalog-overview.md)

## Catalogの更新

Dorisで作成されたCatalogは、対応するデータソースのメタデータサービスにアクセスするための「プロキシ」として機能します。Dorisはアクセスパフォーマンスを向上させ、頻繁なネットワーク間リクエストを削減するために一部のメタデータをキャッシュします。ただし、キャッシュには有効期限があり、更新しないと最新のメタデータにアクセスできません。そのため、DorisはCatalogを更新するいくつかの方法を提供しています。

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```
Dorisはメタデータキャッシュを無効にして、最新のメタデータにリアルタイムでアクセスすることもサポートしています。

メタデータキャッシュの詳細情報と設定については、以下を参照してください：[Metadata Cache](./meta-cache.md)

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

`DROP CATALOG`文を使用して、指定された外部catalogを削除することができます。

```sql
DROP CATALOG [IF EXISTS] iceberg_catalog;
```
Dorisから外部カタログを削除しても、実際のデータは削除されません。Dorisに保存されているマッピング関係のみが削除されます。

## 許可 Management

外部カタログ内のデータベースとTableの権限管理は、内部Tableと同様です。詳細については、認証 and Authorizationのドキュメントを参照してください。
