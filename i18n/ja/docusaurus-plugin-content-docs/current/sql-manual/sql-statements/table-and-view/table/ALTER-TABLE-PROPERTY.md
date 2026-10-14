---
{
    "title": "ALTER TABLE PROPERTY",
    "language": "ja",
    "description": "このステートメントは、既存のテーブルのプロパティを変更するために使用します。操作は同期的に実行されます。",
}
---

:::caution
パーティション属性とテーブル属性の違い
- パーティション属性は主に、バケット数（buckets）、ストレージ媒体（storage_medium）、レプリカ数（replication_num）、ホットデータとコールドデータの分離ポリシー（storage_policy）に関するものです。
  - 既存のパーティションでは、ALTER TABLE {tableName} MODIFY PARTITION ({partitionName}) SET ({key}={value}) を使用して属性を変更できます。ただし、バケット数（buckets）は変更できません。
  - まだ作成されていない動的パーティションでは、ALTER TABLE {tableName} SET (dynamic_partition.{key} = {value}) を使用して属性を変更できます。
  - まだ作成されていない自動パーティションでは、ALTER TABLE {tableName} SET ({key} = {value}) を使用して属性を変更できます。
  - パーティション属性を変更する場合は、作成済みのパーティションの属性と、今後作成されるパーティションの属性の両方を変更する必要があります。
- 上記以外の属性は、すべてテーブルレベルの属性です。
- 各属性について詳しくは、[CREATE TABLE の属性](../../../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md#table-property-related-parameters)を参照してください。
:::

## 説明

このステートメントは、既存のテーブルのプロパティを変更するために使用します。この操作は同期的に実行され、コマンドが返った時点で実行は完了しています。

現在、テーブルの Bloom Filter 列、colocate_with 属性、dynamic_partition 属性、replication_num および default.replication_num を変更できます。

構文：

```sql
ALTER TABLE [database.]table alter_clause;
```

プロパティの alter_clause では、次の変更方法をサポートします。

注：

上記のスキーマ変更操作に組み込んで変更することもできます。以下の例を参照してください。

1. テーブルの Bloom Filter 列を変更する

```sql
ALTER TABLE example_db.my_table SET ("bloom_filter_columns"="k1,k2,k3");
```

上記のスキーマ変更操作に組み込むこともできます（複数の句を指定する場合は構文が少し異なります）。

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
PROPERTIES ("bloom_filter_columns"="k1,k2,k3");
```

2. テーブルの Colocate 属性を変更する

```sql
ALTER TABLE example_db.my_table set ("colocate_with" = "t1");
```

3. テーブルのバケット分散方式を Hash Distribution から Random Distribution に変更する

```sql
ALTER TABLE example_db.my_table set ("distribution_type" = "random");
```

4. テーブルの動的パーティション属性を変更する（動的パーティション属性がないテーブルへの追加もサポート）

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "false");
```

動的パーティション属性がないテーブルに追加する場合は、すべての動的パーティション属性を指定する必要があります。
   （注：パーティション分割されていないテーブルには、動的パーティション属性を追加できません。）

```sql
ALTER TABLE example_db.my_table set (
  "dynamic_partition.enable" = "true", 
  "dynamic_partition.time_unit" = "DAY", 
  "dynamic_partition.end" = "3", 
  "dynamic_partition.prefix" = "p", 
  "dynamic_partition. buckets" = "32"
);
```

5. テーブルの in_memory 属性を変更する。指定できる値は 'false' のみ

```sql
ALTER TABLE example_db.my_table set ("in_memory" = "false");
```

6. 一括削除機能を有効にする

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "BATCH_DELETE";
```

注：

- Unique Key テーブルのみをサポートします。
- 既存のテーブルでは一括削除を有効にできます。新しく作成するテーブルでは、作成時点で既にサポートされています。

7. シーケンス列の値に基づいてデータのインポート順序を保証する機能を有効にする

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES (
  "function_column.sequence_type" = "Date"
);
```

注：

- Unique Key テーブルのみをサポートします。
- sequence_type はシーケンス列の型を指定します。整数型と時間型を指定できます。
- 順序が保証されるのは、新しくインポートするデータのみです。履歴データは変更されません。

8. テーブルのデフォルトのバケット数を 50 に変更する

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 50;
```

注：

- パーティション分割されており、Colocate を使用しないテーブルのみをサポートします。詳しくは [ALTER TABLE DISTRIBUTION](./ALTER-TABLE-DISTRIBUTION) を参照してください。

9. テーブルのコメントを変更する

```sql
ALTER TABLE example_db.my_table MODIFY COMMENT "new comment";
```

10. 列のコメントを変更する

```sql
ALTER TABLE example_db.my_table MODIFY COLUMN k1 COMMENT "k1", MODIFY COLUMN k2 COMMENT "k2";
```

11. エンジンの種類を変更する

MySQL 型から ODBC 型への変更のみが可能です。driver の値は、odbc.init 設定内のドライバー名です。

```sql
ALTER TABLE example_db.mysql_table MODIFY ENGINE TO odbc PROPERTIES("driver" = "MySQL");
```

12. レプリカ数を変更する

```sql
ALTER TABLE example_db.mysql_table SET ("replication_num" = "2");
ALTER TABLE example_db.mysql_table SET ("default.replication_num" = "2");
ALTER TABLE example_db.mysql_table SET ("replication_allocation" = "tag.location.default: 1");
ALTER TABLE example_db.mysql_table SET ("default.replication_allocation" = "tag.location.default: 1");
```

注：
1. default プレフィックス付きのプロパティは、変更対象テーブルのデフォルトのレプリカ配置を示します。この変更では、テーブルの現在の実際のレプリカ配置は変更されず、パーティション分割されたテーブルで新しく作成されるパーティションのレプリカ配置にのみ影響します。
2. パーティション分割されていないテーブルで default プレフィックスのないレプリカ配置プロパティを変更すると、テーブルのデフォルトのレプリカ配置と実際のレプリカ配置の両方が変更されます。変更後は、`show create table` と `show partitions from tbl` でレプリカ配置が変更されたことを確認できます。
変更されました。
3. パーティション分割されたテーブルでは、実際のレプリカ配置はパーティションごとに設定され、`show partitions from tbl` で確認できます。実際のレプリカ配置を変更するには、`ALTER TABLE PARTITION` を参照してください。

13\. **[実験的機能]** `light_schema_change` を有効にする

  テーブル作成時に light_schema_change を有効にしなかった場合は、次のステートメントで有効にできます。

```sql
ALTER TABLE example_db.mysql_table SET ("light_schema_change" = "true");
```

## 例

1. テーブルの Bloom Filter 列を変更する

```sql
ALTER TABLE example_db.my_table SET ("bloom_filter_columns"="k1,k2,k3");
```

上記のスキーマ変更操作に組み込むこともできます（複数の句を指定する場合は構文が少し異なります）。

```sql
ALTER TABLE example_db.my_table
DROP COLUMN col2
PROPERTIES ("bloom_filter_columns"="k1,k2,k3");
```

2. テーブルの Colocate 属性を変更する

```sql
ALTER TABLE example_db.my_table set ("colocate_with" = "t1");
```

3. テーブルのバケット分散方式を Hash Distribution から Random Distribution に変更する

```sql
ALTER TABLE example_db.my_table set ("distribution_type" = "random");
```

4. テーブルの動的パーティション属性を変更する（動的パーティション属性がないテーブルへの追加もサポート）

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "false");
```

動的パーティション属性がないテーブルに追加する場合は、すべての動的パーティション属性を指定する必要があります。
   （注：パーティション分割されていないテーブルには、動的パーティション属性を追加できません。）

```sql
ALTER TABLE example_db.my_table set ("dynamic_partition.enable" = "true", "dynamic_partition.time_unit" = "DAY", "dynamic_partition.end" = "3", "dynamic_partition.prefix" = "p", "dynamic_partition. buckets" = "32");
```

5. テーブルの in_memory 属性を変更する。指定できる値は 'false' のみ

```sql
ALTER TABLE example_db.my_table set ("in_memory" = "false");
```

6. 一括削除機能を有効にする

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "BATCH_DELETE";
```

7. シーケンス列の値に基づいてデータのインポート順序を保証する機能を有効にする

```sql
ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date");
```

8. テーブルのデフォルトのバケット数を 50 に変更する

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 50;
```

9. テーブルのコメントを変更する

```sql
ALTER TABLE example_db.my_table MODIFY COMMENT "new comment";
```

10. 列のコメントを変更する

```sql
ALTER TABLE example_db.my_table MODIFY COLUMN k1 COMMENT "k1", MODIFY COLUMN k2 COMMENT "k2";
```

11. エンジンの種類を変更する

```sql
ALTER TABLE example_db.mysql_table MODIFY ENGINE TO odbc PROPERTIES("driver" = "MySQL");
```

12. テーブルにホットデータとコールドデータを分離するためのデータ移行ポリシーを追加する
```sql
 ALTER TABLE create_table_not_have_policy set ("storage_policy" = "created_create_table_alter_policy");
```
注：テーブルがストレージポリシーにまだ関連付けられていない場合にのみ、追加できます。一つのテーブルに設定できるストレージポリシーは一つだけです。

13. テーブルのパーティションにホットデータとコールドデータを分離するためのデータ移行ポリシーを追加する
```sql
ALTER TABLE create_table_partition MODIFY PARTITION (*) SET("storage_policy"="created_create_table_partition_alter_policy");
```
注：テーブルのパーティションがストレージポリシーにまだ関連付けられていない場合にのみ、追加できます。一つのテーブルに設定できるストレージポリシーは一つだけです。


## キーワード

```text
ALTER, TABLE, PROPERTY, ALTER TABLE
```

## ベストプラクティス
