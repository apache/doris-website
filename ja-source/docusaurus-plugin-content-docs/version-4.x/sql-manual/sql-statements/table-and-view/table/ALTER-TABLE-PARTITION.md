---
{
  "title": "ALTER TABLE PARTITION",
  "description": "この文は、パーティションを持つtableを変更するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

この文は、パーティションを持つtableを変更するために使用されます。

この操作は同期的であり、コマンドの戻りは実行の完了を示します。

grammar:

```sql
ALTER TABLE [database.]table alter_clause;
```
partition の alter_clause は以下の変更方法をサポートしています

1. partition の追加

文法:

```sql
ADD PARTITION [IF NOT EXISTS] partition_name
partition_desc ["key"="value"]
[DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num]]
```
注意:

- partition_descは以下の2つの記述方法をサポートします
  - VALUES LESS THAN [MAXVALUE|("value1", ...)]
  - VALUES [("value1", ...), ("value1", ...))
- パーティションは左閉右開です。ユーザーが右境界のみを指定した場合、システムが自動的に左境界を決定します
- バケット方法が指定されていない場合、Table作成時に使用されたバケット方法とバケット数が自動的に使用されます
- バケット方法が指定されている場合、バケット数のみ変更可能で、バケット方法やバケット列は変更できません。バケット方法が指定されているがバケット数が指定されていない場合、Table作成時に指定された数値ではなく、デフォルト値`10`がバケット数として使用されます。バケット数を変更する場合は、バケット方法を同時に指定する必要があります。
- ["key"="value"]セクションでは、パーティションの属性を設定できます。[CREATE TABLE](./CREATE-TABLE)を参照してください
- Table作成時にユーザーが明示的にパーティションを作成していない場合、ALTERによるパーティション追加はサポートされません
- ユーザーがlist partitionを使用している場合、Tableにdefault partitionを追加できます。default partitionは、既存のパーティションキーの制約を満たさないすべてのデータを格納します。
  -  ALTER TABLE table_name ADD PARTITION partition_name

2. パーティションの削除

文法:

```sql
DROP PARTITION [IF EXISTS] partition_name [FORCE]
```
注意:

- パーティショニングを使用するTableには、少なくとも1つのパーティションを予約する必要があります。
- DROP PARTITIONを実行してから一定期間後、削除されたパーティションはRECOVER文を通じて復旧できます。詳細については、SQLマニュアル - データベース管理 - RECOVER文を参照してください
- DROP PARTITION FORCEを実行すると、システムはパーティション内に未完了のトランザクションがあるかどうかをチェックせず、パーティションが直接削除され、復旧できません。この操作は一般的に推奨されません

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

## Example

1. パーティションを追加、既存パーティション [MIN, 2013-01-01)、パーティション [2013-01-01, 2014-01-01) を追加、デフォルトのバケット方式を使用

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
3. パーティションを増加し、新しいレプリカ数を使用する

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
5. 指定されたパーティションをバッチ変更する

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
## Keywords

```text
ALTER, TABLE, PARTITION, ALTER TABLE
```
## ベストプラクティス
