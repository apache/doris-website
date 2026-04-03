---
{
  "title": "ALTER TABLE PARTITION",
  "language": "ja",
  "description": "このステートメントは、パーティションを持つテーブルを変更するために使用されます。"
}
---
## 説明

このステートメントは、パーティションを持つテーブルを変更するために使用されます。

この操作は同期的であり、コマンドの戻りは実行の完了を示します。

grammar:

```sql
ALTER TABLE [database.]table alter_clause;
```
partition の alter_clause は以下の変更方法をサポートします

1. partition の追加

文法:

```sql
ADD PARTITION [IF NOT EXISTS] partition_name
partition_desc ["key"="value"]
[DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num]]
```
注意:

- partition_descは以下の2つの記述方法をサポートしています
  - VALUES LESS THAN [MAXVALUE|("value1", ...)]
  - VALUES [("value1", ...), ("value1", ...))
- パーティションは左閉右開です。ユーザーが右境界のみを指定した場合、システムが自動的に左境界を決定します
- バケット化方式が指定されていない場合、テーブル作成時に使用されたバケット化方式とバケット数が自動的に使用されます
- バケット化方式が指定されている場合、バケット数のみ変更でき、バケット化方式やバケット化カラムは変更できません。バケット化方式が指定されているがバケット数が指定されていない場合、テーブル作成時に指定された数ではなく、デフォルト値`10`がバケット数として使用されます。バケット数を変更する場合は、バケット化方式を同時に指定する必要があります。
- ["key"="value"]セクションでは、パーティションのいくつかの属性を設定できます。[CREATE TABLE](./CREATE-TABLE)を参照してください
- ユーザーがテーブル作成時に明示的にパーティションを作成しなかった場合、ALTERによるパーティションの追加はサポートされていません
- ユーザーがリストパーティションを使用している場合、テーブルにデフォルトパーティションを追加できます。デフォルトパーティションは、以前のパーティションキーの制約を満たさないすべてのデータを格納します。
  -  ALTER TABLE table_name ADD PARTITION partition_name

2. パーティションの削除

構文:

```sql
DROP PARTITION [IF EXISTS] partition_name [FORCE]
```
注意事項：

- パーティショニングを使用するテーブルには、少なくとも1つのパーティションを予約する必要があります。
- DROP PARTITIONを実行した後、一定期間内であれば、削除されたパーティションはRECOVER文を通じて復旧できます。詳細については、SQLマニュアル - データベース管理 - RECOVER文を参照してください
- DROP PARTITION FORCEを実行した場合、システムはパーティション内に未完了のトランザクションがあるかどうかをチェックせず、パーティションが直接削除され復旧できなくなります。この操作は一般的に推奨されません

3. パーティションプロパティの変更

 文法：

```sql
MODIFY PARTITION p1|(p1[, p2, ...]) SET ("key" = "value", ...)
```
例:

- 現在、パーティションの以下のプロパティの変更をサポートしています:
  - storage_medium
    -storage_cooldown_time
  - replication_num
  - in_memory
- 単一パーティションテーブルの場合、partition_nameはテーブル名と同じです。

## 例

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
## キーワード

```text
ALTER, TABLE, PARTITION, ALTER TABLE
```
## ベストプラクティス
