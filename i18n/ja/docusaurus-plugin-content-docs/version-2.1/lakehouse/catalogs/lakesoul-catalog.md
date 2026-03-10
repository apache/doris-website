---
{
  "title": "LakeSoulカタログ",
  "language": "ja",
  "description": "DorisはPostgreSQLに保存されたメタデータを使用してLakeSoulテーブルデータへのアクセスと読み取りをサポートしています。"
}
---
:::warning 注意！
この機能は3.1.0以降非推奨です。使用に関するお問い合わせは、開発者にご連絡ください。
:::

DorisはPostgreSQLに保存されたメタデータを使用してLakeSoulテーブルデータにアクセスし、読み取ることをサポートしています。

[DockerでApache Doris & LakeSoulを素早く体験](../best-practices/doris-lakesoul.md)

## 適用シナリオ

| シナリオ   | 説明                                               |
| ---------- | ------------------------------------------------- |
| データ統合 | LakeSoulデータを読み取ってDoris内部テーブルに書き込み、またはDoris計算エンジンを使用してZeroETL操作を実行します。 |
| データライトバック | サポートされていません。                                       |

## Catalogの設定

### 構文

```sql
CREATE CATALOG lakesoul_catalog PROPERTIES (
    'type' = 'lakesoul',
    {LakeSoulProperties},
    {CommonProperties}
);
```
* `{LakeSoulProperties}`

  | プロパティ                | 説明                                   | 例      |
  | ------------------------- | ------------------------------------- | ------- |
  | `lakesoul.pg.username`    | PGソースデータベースのユーザー名        |         |
  | `lakesoul.pg.password`    | PGソースデータベースのパスワード        |         |
  | `lakesoul.pg.url`         | PGメタデータデータベースのJDBC URL      | `jdbc:postgresql://127.0.0.1:5432/lakesoul_test?stringtype=unspecified` |

* `[CommonProperties]`

  CommonPropertiesセクションは一般的なプロパティを入力するためのものです。「Common Properties」セクションの[Data Catalog Overview](../catalog-overview.md)を参照してください。

LakeSoulデータがHDFS上に保存されている場合、FEとBEの両方の`conf/`ディレクトリに`core-site.xml`、`hdfs-site.xml`、`hive-site.xml`を配置してください。`conf/`ディレクトリ内のHadoop設定ファイルが最初に読み取られ、次に`HADOOP_CONF_DIR`環境変数で指定された設定ファイルが読み取られます。

### サポートされるLakeSoulバージョン

現在サポートされているLakeSoulバージョンは2.6.2です。

### サポートされるLakeSoulフォーマット

- LakeSoul主キーテーブルと非主キーテーブルをサポートします。
- LakeSoul MOR (Merge-On-Read) テーブルの読み取りをサポートします。

## カラムタイプマッピング

| LakeSoul Type                        | Doris Type    | Comment                                |
| ---------------------------------- | ------------- | -------------------------------------- |
| boolean                            | boolean       |                                        |
| int8                            | tinyint       |                                        |
| int16                           | smallint      |                                        |
| int32                            | int           |                                        |
| int64                             | bigint        |                                        |
| float                              | float         |                                        |
| double                             | double        |                                        |
| decimal(P, S)                      | decimal(P, S) |                                        |
| string                            | string        |                                        |
| date                               | date          |                                        |
| timestamp(S)    						 | datetime(S)   | |
| list                              | array         |                                        |
| map                                | map           |                                        |
| row                                | struct        |                                        |
| other                              | UNSUPPORTED   |                                        |

## 例

```sql
CREATE CATALOG lakesoul PROPERTIES (
    'type' = 'lakesoul',
    'lakesoul.pg.username' = 'lakesoul_test',
    'lakesoul.pg.password' = 'lakesoul_test',
    'lakesoul.pg.url' = 'jdbc:postgresql://127.0.0.1:5432/lakesoul_test?stringtype=unspecified'
);
```
## Query操作

### 基本Query

Catalogが設定されると、以下のようにCatalog内のテーブルデータをqueryできます：

```sql
-- 1. switch to catalog, use database and query
SWITCH ls_ctl;
USE ls_db;
SELECT * FROM ls_tbl LIMIT 10;

-- 2. use lakesoul database directly
USE ls_ctl.ls_db;
SELECT * FROM ls_tbl LIMIT 10;

-- 3. use full qualified name to query
SELECT * FROM ls_ctl.ls_db.ls_tbl LIMIT 10;
```
