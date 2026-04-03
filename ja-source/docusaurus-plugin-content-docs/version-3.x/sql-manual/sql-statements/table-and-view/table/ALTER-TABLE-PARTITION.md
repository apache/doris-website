---
{
  "title": "ALTER TABLE PARTITION",
  "description": "この文は、パーティションを持つtableを変更するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、パーティションを持つtableを変更するために使用されます。

この操作は同期的であり、コマンドの戻りは実行の完了を示します。

grammar:

```sql
ALTER TABLE [database.]table alter_clause;
```
partition の alter_clause は以下の変更方法をサポートしています

1. partition の追加

文法：

```sql
ADD PARTITION [IF NOT EXISTS] partition_name
partition_desc ["key"="value"]
[DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num]]
```
注意事項：

- partition_descは以下の2つの記述方法をサポートしています
  - VALUES LESS THAN [MAXVALUE|("value1", ...)]
  - VALUES [("value1", ...), ("value1", ...))
- パーティションは左閉右開です。ユーザーが右境界のみを指定した場合、システムが自動的に左境界を決定します
- バケッティング方法が指定されていない場合、Table作成時に使用されたバケッティング方法とバケット数が自動的に使用されます
- バケッティング方法が指定されている場合、バケット数のみ変更可能で、バケッティング方法やバケッティング列は変更できません。バケッティング方法が指定されているがバケット数が指定されていない場合、Table作成時に指定された数ではなく、デフォルト値`10`がバケット数として使用されます。バケット数を変更する場合、バケッティング方法を同時に指定する必要があります。
- ["key"="value"]セクションでは、パーティションの属性を設定できます。[CREATE TABLE](./CREATE-TABLE)を参照してください
- Table作成時にユーザーが明示的にパーティションを作成しなかった場合、ALTERによるパーティション追加はサポートされません
- ユーザーがリストパーティションを使用している場合、Tableにデフォルトパーティションを追加できます。デフォルトパーティションは、既存のパーティションキーの制約を満たさないすべてのデータを格納します。
  -  ALTER TABLE table_name ADD PARTITION partition_name

2. パーティションの削除

文法：

```sql
DROP PARTITION [IF EXISTS] partition_name [FORCE]
```
注意事項:

- パーティショニングを使用するTableでは、少なくとも1つのパーティションを予約する必要があります。
- DROP PARTITIONを実行してからしばらくの間、削除されたパーティションはRECOVER文を通じて回復できます。詳細については、SQL Manual - Database Management - RECOVER Statementを参照してください。
- DROP PARTITION FORCEを実行すると、システムはパーティション内に未完了のトランザクションがあるかどうかを確認せず、パーティションが直接削除されて回復できなくなるため、この操作は一般的に推奨されません。

3. パーティションプロパティの変更

文法:

```sql
MODIFY PARTITION p1|(p1[, p2, ...]) SET ("key" = "value", ...)
```
説明:

- 現在、パーティションの以下のプロパティの変更をサポートしています:
  - storage_medium
    -storage_cooldown_time
  - replication_num
  - in_memory
- 単一パーティションTableの場合、partition_nameはTable名と同じです。

## 例

1. パーティションを追加する。既存のパーティション[MIN, 2013-01-01)に、パーティション[2013-01-01, 2014-01-01)を追加し、デフォルトのバケット方式を使用する

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2014-01-01");
```
2. パーティションを増加し、新しいバケット数を使用する

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
DISTRIBUTED BY HASH(k1) BUCKETS 20;
```
3. パーティションを増加させ、新しいレプリカ数を使用する

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
("replication_num"="1");
```
4. パーティションレプリカ数の変更

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION p1 SET("replication_num"="1");
```
5. 指定されたパーティションを一括変更する

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (p1, p2, p4) SET("replication_num"="1");
```
6. 全パーティションの一括変更

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (*) SET("storage_medium"="HDD");
```
7. パーティションの削除

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1;
```
8. パーティションの一括削除

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1,
DROP PARTITION p2,
DROP PARTITION p3;
```
9. 上限と下限を指定してパーティションを追加する

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES [("2014-01-01"), ("2014-02-01"));
```
## キーワード

```text
ALTER, TABLE, PARTITION, ALTER TABLE
```
## ベストプラクティス
