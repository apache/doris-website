---
{
  "title": "データカタログの概要",
  "language": "ja",
  "description": "Apache Doris Data Catalogの概念と使用方法について学習します。外部データカタログを作成してHive、Iceberg、Paimon、PostgreSQL、その他のデータソースに接続し、フェデレーテッドクロスソースクエリ、データ取り込み、書き戻しを実行します。"
}
---
Data Catalogはデータソースのプロパティを記述します。

Dorisでは、異なるデータソース（Hive、Iceberg、Paimon、PostgreSQLなど）を指す複数のdata catalogを作成できます。Dorisはdata catalogを通じて、対応するデータソースからデータベース、テーブル、スキーマ、パーティション、およびデータの場所を自動的に取得します。ユーザーは標準のSQL文を使用してこれらのdata catalogにアクセスしてデータ分析を行い、複数のdata catalog間のデータに対してjoinクエリを実行できます。

Dorisには2種類のdata catalogがあります：

| タイプ | 説明 |
| ---------------- | -------------------------------------------------------- |
| Internal Catalog | `internal`という固定名を持つ組み込みdata catalogで、Doris内部テーブルデータの保存に使用されます。作成、変更、削除はできません。 |
| External Catalog | 外部data catalogで、Internal Catalog以外のすべてのdata catalogを指します。ユーザーは外部data catalogを作成、変更、削除できます。 |

Data catalogは主に以下の3つのタイプのシナリオに適用されますが、異なるdata catalogには異なる適用シナリオがあります。詳細については、対応するdata catalogのドキュメントを参照してください。

| シナリオ | 説明 |
| ---- | ------------------------------------------- |
| Query Acceleration | Hive、Iceberg、Paimonなどのlakehouseデータに対するクエリを直接高速化します。 |
| Data Integration | ZeroETLアプローチで異なるデータソースに直接アクセスして結果データを生成するか、異なるデータソース間の便利なデータフローを実現します。 |
| Data Write-Back | Dorisを通じてデータを処理・変換し、外部データソースに書き戻します。 |

この記事では[Iceberg Catalog](./catalogs/iceberg-catalog)を例として、data catalogの基本操作を紹介します。異なるdata catalogの詳細な紹介については、対応するdata catalogのドキュメントを参照してください。

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
本質的に、Dorisで作成されたdata catalogは、対応するデータソースのメタデータサービス（Hive Metastoreなど）とストレージサービス（HDFS/S3など）にアクセスするための「プロキシ」として機能します。Dorisは、対応するデータソースの実際のメタデータやデータではなく、data catalogに関する接続プロパティやその他の情報のみを保存します。

### 共通プロパティ

各data catalogに固有のプロパティセットに加えて、このセクションでは、すべてのdata catalogで共有される共通プロパティ`{CommonProperties}`を紹介します。

| プロパティ | 説明 | 例 |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| `include_database_list` | 同期する複数のデータベースを`,`で区切って指定します。デフォルトでは、すべてのデータベースが同期されます。データベース名は大文字小文字を区別します。外部データソースに大量のデータベースがあるが、アクセスが必要なデータベースが少数の場合、このパラメータを使用して大量のメタデータの同期を回避できます。 | `'include_database_list' = 'db1,db2'` |
| `exclude_database_list` | 同期から除外する複数のデータベースを`,`で区切って指定します。デフォルトでは、フィルタリングは適用されず、すべてのデータベースが同期されます。データベース名は大文字小文字を区別します。上記と同じシナリオに適用されますが、アクセスが不要なデータベースを逆に除外する場合に使用します。競合がある場合、`exclude`が`include`より優先されます。 | `'exclude_database_list' = 'db1,db2'` |
| `include_table_list` | 同期するテーブルを`db.tbl`形式で複数指定し、`,`で区切ります。設定された場合、データベース下のテーブル一覧表示では、リモートメタデータサービスから完全なテーブルリストを取得するのではなく、指定されたテーブルのみが返されます。外部データソースに大量のテーブルがあり、完全なテーブルリストの取得がタイムアウトする可能性がある場合に適用されます。 | `'include_table_list' = 'db1.tbl1,db1.tbl2,db2.tbl3'` |
| `lower_case_table_names` | Catalogレベルのテーブル名の大文字小文字制御。値とその意味については、下記の[テーブル名の大文字小文字の区別](#table-name-case-sensitivity-lower_case_table_names)セクションを参照してください。デフォルト値はグローバル変数`lower_case_table_names`から継承されます。 | `'lower_case_table_names' = '1'` |
| `lower_case_database_names` | Catalogレベルのデータベース名の大文字小文字制御。値とその意味については、下記の[データベース名の大文字小文字の区別](#database-name-case-sensitivity-lower_case_database_names)セクションを参照してください。デフォルト値は`0`（大文字小文字を区別）です。 | `'lower_case_database_names' = '2'` |

### テーブルリストの指定

この機能はバージョン4.1.0以降でサポートされています。

外部データソース（Hive Metastoreなど）に大量のテーブルが含まれている場合、リモートメタデータサービスから完全なテーブルリストを取得するのに非常に時間がかかったり、タイムアウトしたりする可能性があります。`include_table_list`プロパティを設定することで、同期するテーブルを指定し、リモートからの完全なテーブルリスト取得を回避できます。

`include_table_list`は`db.tbl`形式を使用し、複数のテーブルはカンマ`,`で区切ります。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'include_table_list' = 'db1.table1,db1.table2,db2.table3'
);
```
設定後の動作:

- `db1`配下のテーブル一覧を表示する際、リモートメタデータサービスの完全なテーブル一覧APIを呼び出すことなく、`table1`と`table2`のみが返されます。
- `db2`配下のテーブル一覧を表示する際、`table3`のみが返されます。
- `include_table_list`に含まれていないデータベース（`db3`など）については、リモートメタデータサービスから完全なテーブル一覧が取得されます。
- `include_table_list`内の不正な形式のエントリ（`db.tbl`形式でないもの）は無視されます。

:::tip
このプロパティは`include_database_list`と組み合わせて使用できます。例えば、まず`include_database_list`を使用して必要なデータベースをフィルタリングし、その後`include_table_list`を使用して必要なテーブルをさらに指定します。
:::

### テーブル名の大文字小文字の区別

この機能はバージョン4.1.0以降でサポートされています。

`lower_case_table_names`プロパティを使用して、Catalogレベルでテーブル名の大文字小文字の扱いを制御できます。このプロパティは3つのモードをサポートしています：

| 値 | モード | 説明 |
| -- | ---- | ---- |
| `0` | 大文字小文字を区別（デフォルト） | テーブル名は元の大文字小文字で保存・比較されます。テーブル名を参照する際は、リモートメタデータ内の大文字小文字と完全に一致している必要があります。 |
| `1` | 小文字で保存 | テーブル名はDoris内で小文字で保存されます。外部データソースへのアクセスで統一的に小文字のテーブル名を使用したいシナリオに適しています。 |
| `2` | 大文字小文字を区別しない比較 | テーブル名は大文字小文字を区別しない方法で比較されますが、表示時はリモートメタデータからの元の大文字小文字が保持されます。外部データソースでテーブル名の大文字小文字が一貫していない場合に、大文字小文字を区別せずにテーブルにアクセスしたいシナリオに適しています。 |

このプロパティが設定されていない場合、デフォルトでグローバル変数`lower_case_table_names`の値を継承します。

```sql
CREATE CATALOG hive_catalog PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-host:9083',
    'lower_case_table_names' = '2'
);
```
:::caution
`lower_case_table_names`が`1`または`2`に設定されている場合、リモートメタデータに大文字小文字のみが異なる名前のテーブル（`MyTable`や`mytable`など）が存在すると、競合が発生する可能性があります。Dorisはそのような競合を検出してエラーを報告します。
:::

### データベース名の大文字小文字の区別

この機能はバージョン4.1.0以降でサポートされています。

`lower_case_database_names`プロパティを使用すると、Catalogレベルでデータベース名の大文字小文字の処理を制御できます。このプロパティは3つのモードをサポートしています：

| 値 | モード | 説明 |
| -- | ---- | ---- |
| `0` | 大文字小文字を区別（デフォルト） | データベース名は元の大文字小文字で保存され、比較されます。データベース名を参照する場合、リモートメタデータの大文字小文字と正確に一致する必要があります。 |
| `1` | 小文字で保存 | データベース名はDoris内で小文字で保存されます。外部データソースにアクセスする際に、統一的に小文字のデータベース名を使用したいシナリオに適しています。 |
| `2` | 大文字小文字を区別しない比較 | データベース名は大文字小文字を区別しない方法で比較されますが、表示時にはリモートメタデータからの元の大文字小文字が保持されます。外部データソースでデータベース名の大文字小文字が一貫していない場合に、大文字小文字を区別しない方法でデータベースにアクセスしたいシナリオに適しています。 |

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
`lower_case_database_names`が`1`または`2`に設定されている場合、大文字と小文字のみが異なる名前のデータベースがリモートメタデータに存在する場合（例：`MyDB`と`mydb`）、競合が発生する可能性があります。Dorisはこのような競合を検出し、エラーを報告します。
:::

:::info
`lower_case_database_names`と`lower_case_table_names`は互いに影響を与えることなく独立して設定できます。例えば、データベース名を大文字小文字を区別する（`0`）に設定しながら、テーブル名を大文字小文字を区別しない（`2`）に設定することができます。
:::

### 列型マッピング

ユーザーがデータカタログを作成した後、Dorisは自動的にデータカタログのデータベース、テーブル、スキーマを同期します。異なるデータカタログの列型マッピングルールについては、対応するデータカタログのドキュメントを参照してください。

現在Dorisの列型にマッピングできない外部データ型（`UNION`、`INTERVAL`など）については、Dorisは列型を`UNSUPPORTED`にマッピングします。`UNSUPPORTED`型を含むクエリについては、以下の例を参照してください：

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
### Nullable Property

Dorisは現在、外部テーブルカラムのNullableプロパティサポートに特別な制限があります。具体的な動作は以下の通りです：

| Source Type | Doris Read Behavior | Doris Write Behavior |
| --- | --- | --- |
| Nullable | Nullable | Null値の書き込みを許可 |
| Not Null | Nullable、つまりNULLを許可するカラムとして読み取られる | Null値の書き込みを許可、つまりNull値に対する厳密なチェックはありません。ユーザーは自身でデータの整合性と一貫性を確保する必要があります。 |

## Data Catalogsの使用

### Data Catalogsの表示

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
[SHOW CREATE CATALOG](../sql-manual/sql-statements/catalog/SHOW-CREATE-CATALOG)を使用してCREATE CATALOG文を表示できます。

### Data Catalogの切り替え

DorisはSWITCH文を提供し、接続セッションコンテキストを対応するdata catalogに切り替えます。これはUSE文を使用してデータベースを切り替えるのと似ています。

data catalogに切り替えた後、USE文を使用して特定のデータベースにさらに切り替えたり、SHOW DATABASESを使用して現在のdata catalog配下のデータベースを表示したりできます。

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
`USE`文を完全修飾名`catalog_name.database_name`と共に使用して、特定のデータカタログ配下の特定のデータベースに直接切り替えることも可能です：

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
ビルトインデータカタログは `internal` という固定名を持ちます。切り替え方法は外部データカタログと同じです。

### デフォルトデータカタログ

ユーザープロパティ `default_init_catalog` を使用して、特定のユーザーのデフォルトデータカタログを設定します。設定後、指定されたユーザーがDorisに接続すると、セッションは自動的に設定されたデータカタログに切り替わります。

```sql
SET PROPERTY default_init_catalog=hive_catalog;
```
注意1: MySQLコマンドラインまたはJDBC接続文字列でデータカタログが明示的に指定されている場合、指定されたものが優先され、`default_init_catalog`ユーザープロパティは効果を持ちません。

注意2: ユーザープロパティ`default_init_catalog`によって設定されたデータカタログが存在しなくなった場合、セッションは自動的にデフォルトの`internal`データカタログに切り替わります。

注意3: この機能はバージョン3.1.x以降で利用可能です。

### シンプルクエリ

Dorisでサポートされている任意のSQL文を使用して、外部データカタログ内のテーブルをクエリできます。

```sql
SELECT id, SUM(cost) FROM iceberg_db.table1
GROUP BY id ORDER BY id;
```
### Cross-Catalog クエリ

Doris はデータカタログ間でのjoinクエリをサポートしています。

ここでは別の [MySQL Catalog](./catalogs/jdbc-mysql-catalog.md) を作成します：

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
次に、SQLを使用してIcebergテーブルとMySQLテーブル間で結合クエリを実行します：

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
`CTAS (Create Table As Select)` ステートメントを使用して、外部データソースからDoris内部テーブルを作成し、データをインポートすることもできます：

```sql
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM iceberg_catalog.iceberg_db.table1;
```
### データライトバック

Dorisは`INSERT`文を使用して外部データソースに直接データを書き戻すことをサポートしています。詳細については以下を参照してください：

* [Hive Catalog](./catalogs/hive-catalog.mdx)

* [Iceberg Catalog](./catalogs/iceberg-catalog.mdx)

* [JDBC Catalog](./catalogs/jdbc-catalog-overview.md)

## データカタログの更新

Dorisで作成されたデータカタログは、対応するデータソースのメタデータサービスにアクセスするための「プロキシ」として機能します。Dorisは一部のメタデータをキャッシュします。キャッシュはメタデータアクセスのパフォーマンスを向上させ、頻繁なネットワーク間リクエストを回避できます。しかし、キャッシュには適時性の問題もあります。キャッシュが更新されないと、最新のメタデータにアクセスできません。そのため、Dorisはデータカタログを更新する複数の方法を提供しています。

```sql
-- Refresh catalog
REFRESH CATALOG catalog_name;

-- Refresh specified database
REFRESH DATABASE catalog_name.db_name;

-- Refresh specified table
REFRESH TABLE catalog_name.db_name.table_name;
```
Dorisは、最新のメタデータへのリアルタイムアクセスを可能にするため、メタデータキャッシュの無効化もサポートしています。

メタデータキャッシュの詳細情報と設定については、以下を参照してください: [Metadata Cache](./meta-cache.md)

## データカタログの変更

`ALTER CATALOG`を使用して、データカタログのプロパティまたは名前を変更できます:

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
DorisからExternal Data Catalogを削除しても、実際のデータは削除されません。Dorisに保存されているData Catalogマッピングが削除されるだけです。

## 権限管理

External Data Catalog内のデータベースとテーブルの権限管理は、内部テーブルと同じです。詳細については、[Authentication and Authorization](../admin-manual/auth/authentication-and-authorization.md)のドキュメントを参照してください。
