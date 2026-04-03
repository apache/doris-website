---
{
  "title": "ALTER TABLE PROPERTY",
  "language": "ja",
  "description": "このステートメントは、既存のテーブルのプロパティを変更するために使用されます。この操作は同期的です。"
}
---
:::caution
パーティション Attributesとtable Attributesの違い
- パーティション attributesは一般的にbucketsの数（buckets）、ストレージメディア（storage_medium）、レプリケーション数（replication_num）、ホット/コールドデータ分離ポリシー（storage_policy）に焦点を当てます。
  - 既存のpartitionsについては、ALTER TABLE {tableName} MODIFY PARTITION ({partitionName}) SET ({key}={value})を使用してそれらを変更できますが、bucketsの数（buckets）は変更できません。
  - 未作成のdynamic partitionsについては、ALTER TABLE {tableName} SET (dynamic_partition.{key} = {value})を使用してそれらのattributesを変更できます。
  - 未作成のauto partitionsについては、ALTER TABLE {tableName} SET ({key} = {value})を使用してそれらのattributesを変更できます。
  - ユーザーがpartition attributesを変更したい場合、既に作成されたpartitionsのattributesと、未作成のpartitionsのattributesの両方を変更する必要があります。
- 上記のattributes以外はすべてテーブルレベルです。
- 具体的なattributesについては、[create table attributes](../../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE)を参照してください
:::

## 説明

このステートメントは既存のテーブルのプロパティを変更するために使用されます。この操作は同期的で、コマンドの戻りは実行の完了を示します。

テーブルのプロパティを変更します。現在、bloom filterカラム、colocate_with属性、dynamic_partition属性、replication_numおよびdefault.replication_numの変更をサポートしています。

文法:

```sql
ALTER TABLE [database.]table alter_clause;
```
property の alter_clause は以下の変更方法をサポートします。

注意：

上記のスキーマ変更操作にマージして変更することも可能です。以下の例を参照してください

1. テーブルのbloom filterカラムを変更する

```sql
ALTER TABLE example_db.my_table SET ("bloom_filter_columns"="k1,k2,k3");
```
上記のスキーマ変更操作にも組み込むことができます（複数の句の構文が若干異なることに注意してください）

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
PROPERTIES ("bloom_filter_columns"="k1,k2,k3");
```
2. テーブルのColocateプロパティを変更する

```sql
ALTER TABLE example_db.my_table set ("colocate_with" = "t1");
```
3. テーブルのバケット化方式をHash DistributionからRandom Distributionに変更する

```sql
ALTER TABLE example_db.my_table set ("distribution_type" = "random");
```
4. テーブルの動的パーティション属性を変更する（動的パーティション属性のないテーブルに動的パーティション属性を追加することをサポート）

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "false");
```
動的パーティション属性を持たないテーブルに動的パーティション属性を追加する必要がある場合は、すべての動的パーティション属性を指定する必要があります
   （注意：パーティション化されていないテーブルへの動的パーティション属性の追加はサポートされていません）

```sql
ALTER TABLE example_db.my_table set (
  "dynamic_partition.enable" = "true", 
  "dynamic_partition.time_unit" = "DAY", 
  "dynamic_partition.end" = "3", 
  "dynamic_partition.prefix" = "p", 
  "dynamic_partition. buckets" = "32"
);
```
5. テーブルのin_memory属性を変更します。値は'false'のみ設定可能です

```sql
ALTER TABLE example_db.my_table set ("in_memory" = "false");
```
6. バッチ削除機能を有効化

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "BATCH_DELETE";
```
注意：

- ユニークテーブルのみサポート
- バッチ削除は古いテーブルでサポートされ、新しいテーブルは作成時に既にサポートされている

7. sequenceカラムの値に従ってインポート順序を保証する機能を有効にする

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES (
  "function_column.sequence_type" = "Date"
);
```
注意：

- 一意テーブルのみサポート
- sequence_typeはシーケンス列のタイプを指定するために使用され、integral型とtime型が可能です
- 新しくインポートされたデータの順序性のみサポートされます。履歴データは変更できません

8. テーブルのデフォルトバケット数を50に変更

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 50;
```
注意:

- RANGE パーティションと HASH ディストリビューションを持つ非コロケートテーブルのみサポート

9. テーブルコメントの変更

```sql
ALTER TABLE example_db.my_table MODIFY COMMENT "new comment";
```
10. カラムコメントを変更する

```sql
ALTER TABLE example_db.my_table MODIFY COLUMN k1 COMMENT "k1", MODIFY COLUMN k2 COMMENT "k2";
```
11. エンジンタイプの変更

MySQL タイプのみ ODBC タイプに変更できます。driver の値は odbc.init 設定内のドライバー名です。

```sql
ALTER TABLE example_db.mysql_table MODIFY ENGINE TO odbc PROPERTIES("driver" = "MySQL");
```
12. コピー数を変更する

```sql
ALTER TABLE example_db.mysql_table SET ("replication_num" = "2");
ALTER TABLE example_db.mysql_table SET ("default.replication_num" = "2");
ALTER TABLE example_db.mysql_table SET ("replication_allocation" = "tag.location.default: 1");
ALTER TABLE example_db.mysql_table SET ("default.replication_allocation" = "tag.location.default: 1");
```
注意:
1. defaultプレフィックス付きのプロパティは、変更されたテーブルのデフォルトレプリカ分散を示します。この変更は、テーブルの現在の実際のレプリカ分散を変更せず、パーティションテーブル上の新しく作成されるパーティションのレプリカ分散にのみ影響します。
2. 非パーティションテーブルの場合、defaultプレフィックスなしでレプリカ分散プロパティを変更すると、テーブルのデフォルトレプリカ分散と実際のレプリカ分散の両方が変更されます。つまり、変更後、`show create table`および`show partitions from tbl`ステートメントを通じて、レプリカ分散が変更されたことを確認できます。
3. パーティションテーブルの場合、テーブルの実際のレプリカ分散はパーティションレベルにあります。つまり、各パーティションは独自のレプリカ分散を持ち、`show partitions from tbl`ステートメントで確認できます。実際のレプリカ分散を変更したい場合は、`ALTER TABLE PARTITION`を参照してください。

13\. **[Experimental]** `light_schema_change`を有効にする

  light_schema_changeを有効にして作成されていないテーブルに対して、以下のステートメントを使用してそれを有効にできます。

```sql
ALTER TABLE example_db.mysql_table SET ("light_schema_change" = "true");
```
## 例

1. テーブルのbloom filterカラムを変更する

```sql
ALTER TABLE example_db.my_table SET ("bloom_filter_columns"="k1,k2,k3");
```
上記のスキーマ変更操作にも組み込むことができます（複数の句の構文が若干異なることに注意してください）

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
PROPERTIES ("bloom_filter_columns"="k1,k2,k3");
```
2. テーブルのColocateプロパティを変更する

```sql
ALTER TABLE example_db.my_table set ("colocate_with" = "t1");
```
3. テーブルのバケット化方式をHash DistributionからRandom Distributionに変更する

```sql
ALTER TABLE example_db.my_table set ("distribution_type" = "random");
```
4. テーブルの動的パーティション属性を変更する（動的パーティション属性を持たないテーブルに動的パーティション属性を追加することをサポート）

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "false");
```
動的パーティション属性を持たないテーブルに動的パーティション属性を追加する必要がある場合は、すべての動的パーティション属性を指定する必要があります
   (注意：非パーティションテーブルに対する動的パーティション属性の追加はサポートされていません)

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "true", "dynamic_partition.time_unit" = "DAY", "dynamic_partition.end" = "3", "dynamic_partition.prefix" = "p", "dynamic_partition. buckets" = "32");
```
5. テーブルのin_memory属性を変更する場合、値は'false'のみ設定可能

```sql
ALTER TABLE example_db.my_table set ("in_memory" = "false");
```
6. バッチ削除機能を有効にする

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "BATCH_DELETE";
```
7. sequence列の値に従ってインポート順序を保証する機能を有効にする

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date");
```
8. テーブルのデフォルトのバケット数を50に変更する

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 50;
```
9. テーブルコメントを変更する

```sql
ALTER TABLE example_db.my_table MODIFY COMMENT "new comment";
```
10. カラムコメントを変更する

```sql
ALTER TABLE example_db.my_table MODIFY COLUMN k1 COMMENT "k1", MODIFY COLUMN k2 COMMENT "k2";
```
11. エンジンタイプを変更する

```sql
ALTER TABLE example_db.mysql_table MODIFY ENGINE TO odbc PROPERTIES("driver" = "MySQL");
```
12. テーブルにコールドとホットの分離データ移行戦略を追加する

```sql
 ALTER TABLE create_table_not_have_policy set ("storage_policy" = "created_create_table_alter_policy");
```
注意: テーブルは、ストレージポリシーに関連付けられていない場合のみ正常に追加できます。テーブルは1つのストレージポリシーのみを持つことができます。

13. テーブルのパーティションにホットデータとコールドデータの移行戦略を追加する

```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="created_create_table_partition_alter_policy");
```
注意: テーブルのパーティションは、ストレージポリシーに関連付けられていない場合にのみ正常に追加できます。テーブルは1つのストレージポリシーのみを持つことができます。


## Keywords

```text
ALTER, TABLE, PROPERTY, ALTER TABLE
```
## ベストプラクティス
