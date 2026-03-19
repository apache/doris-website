---
{
  "title": "LakeSoul カタログ",
  "description": "Dorisは、PostgreSQLに格納されたメタデータを使用してLakeSoulTableデータへのアクセスと読み取りをサポートしています。",
  "language": "ja"
}
---
:::warning Note!
この機能は3.1.0以降非推奨です。使用に関するお問い合わせは、開発者にご連絡ください。
:::

DorisはPostgreSQLに保存されたメタデータを使用してLakeSoulTableデータへのアクセスと読み取りをサポートしています。

[DockerでApache Doris & LakeSoulを素早く体験](../best-practices/doris-lakesoul.md)

## 適用シナリオ

| シナリオ   | 説明                                               |
| ---------- | --------------------------------------------------------- |
| データ統合 | LakeSoulデータを読み取ってDoris内部tableに書き込む、またはDorisコンピューティングエンジンを使用してZeroETL操作を実行する。 |
| データライトバック | サポートされていません。                                       |

## カタログの設定

### 構文

```sql
CREATE CATALOG lakesoul_catalog PROPERTIES (
    'type' = 'lakesoul',
    {LakeSoulProperties},
    {CommonProperties}
);
```
* `{LakeSoulProperties}`

  | Property                  | デスクリプション                           | Example |
  | ------------------------- | ------------------------------------- | ------- |
  | `lakesoul.pg.username`    | PGソースデータベースのユーザー名   |         |
  | `lakesoul.pg.password`    | PGソースデータベースのパスワード   |         |
  | `lakesoul.pg.url`         | PGメタデータデータベースのJDBC URL | `jdbc:postgresql://127.0.0.1:5432/lakesoul_test?stringtype=unspecified` |

* `[CommonProperties]`

  CommonPropertiesセクションは、一般的なプロパティを設定するためのものです。「Common Properties」セクションの[データカタログ 概要](../catalog-overview.md)を参照してください。

LakeSoulデータがHDFS上に格納されている場合は、FEとBEの両方の`conf/`ディレクトリに`core-site.xml`、`hdfs-site.xml`、`hive-site.xml`を配置してください。`conf/`ディレクトリ内のHadoop設定ファイルが最初に読み込まれ、次に`HADOOP_CONF_DIR`環境変数で指定された設定ファイルが読み込まれます。

### サポートされているLakeSoulバージョン

現在サポートされているLakeSoulバージョンは2.6.2です。

### サポートされているLakeSoulフォーマット

- LakeSoul主キーTableおよび非主キーTableをサポートします。
- LakeSoul MOR（Merge-On-Read）Tableの読み込みをサポートします。

## カラム型マッピング

| LakeSoul タイプ                        | Doris タイプ    | Comment                                |
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
## Query 運用

### Basic Query

Catalogが設定されると、以下のようにCatalog内のTableデータをクエリできます：

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
