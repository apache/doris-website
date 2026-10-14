---
{
    "title": "ALTER TABLE PARTITION",
    "language": "ja",
    "description": "このステートメントは、パーティションを持つテーブルの変更に使用します。"
}
---

## 説明

このステートメントは、パーティションを持つテーブルの変更に使用します。

この操作は同期的に実行され、コマンドが返った時点で処理は完了しています。

構文：

```sql
ALTER TABLE [database.]table alter_clause;
```

パーティションの alter_clause では、次の変更操作を使用できます。

1. パーティションを追加する

構文：

```sql
ADD PARTITION [IF NOT EXISTS] partition_name
partition_desc ["key"="value"]
[DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num]]
```

注意：

- partition_desc には、次の二つの記述形式があります。
  - VALUES LESS THAN [MAXVALUE|("value1", ...)]
  - VALUES [("value1", ...), ("value1", ...))
- パーティションの範囲は左端を含み、右端を含みません。右端の境界だけを指定した場合、左端の境界はシステムが自動的に決定します。
- バケット方式を指定しない場合、テーブル作成時のバケット方式とバケット数が自動的に使用されます。
- バケット方式を指定する場合、変更できるのはバケット数だけです。バケット方式やバケット列は変更できません。バケット方式を指定してバケット数を省略すると、テーブル作成時のバケット数ではなく、デフォルト値の `10` が使用されます。バケット数を変更する場合は、バケット方式も併せて指定する必要があります。
- ["key"="value"] の部分では、パーティションの一部の属性を設定できます。詳細は [CREATE TABLE](./CREATE-TABLE) を参照してください。
- テーブル作成時にパーティションを明示的に作成していない場合、ALTER によるパーティションの追加はサポートされません。
- リストパーティションを使用している場合、テーブルにデフォルトパーティションを追加できます。デフォルトパーティションには、既存のパーティションキーの条件を満たさないすべてのデータが格納されます。
  -  ALTER TABLE table_name ADD PARTITION partition_name

2. パーティションを削除する

構文：

```sql
DROP PARTITION [IF EXISTS] partition_name [FORCE]
```

 注意：

- パーティションテーブルには、少なくとも一つのパーティションを残す必要があります。
- DROP PARTITION の実行後、一定期間内であれば、RECOVER 文を使用して削除したパーティションを復元できます。詳細は、SQL マニュアルの「データベース管理」にある RECOVER 文を参照してください。
- DROP PARTITION FORCE を実行すると、システムはそのパーティションに未完了のトランザクションがあるかどうかを確認せず、パーティションを直接削除します。削除したパーティションは復元できないため、通常、この操作は推奨されません。

3. パーティションの属性を変更する

 構文：

```sql
MODIFY PARTITION p1|(p1[, p2, ...]) SET ("key" = "value", ...)
```

説明：

- 現在、次のパーティション属性の変更をサポートしています。
  - storage_medium
    -storage_cooldown_time
  - replication_num
  - in_memory
- 単一パーティションのテーブルでは、partition_name はテーブル名と同じです。

## 例

1. 既存のパーティションが [MIN, 2013-01-01) の場合に、デフォルトのバケット方式を使用して [2013-01-01, 2014-01-01) のパーティションを追加します。

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2014-01-01");
```

2. 新しいバケット数を指定してパーティションを追加します。

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
DISTRIBUTED BY HASH(k1) BUCKETS 20;
```

3. 新しいレプリカ数を指定してパーティションを追加します。

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
("replication_num"="1");
```

4. パーティションのレプリカ数を変更します。

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION p1 SET("replication_num"="1");
```

5. 指定した複数のパーティションをまとめて変更します。

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (p1, p2, p4) SET("replication_num"="1");
```

6. すべてのパーティションをまとめて変更します。

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (*) SET("storage_medium"="HDD");
```

7. パーティションを削除します。

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1;
```

8. 複数のパーティションをまとめて削除します。

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1,
DROP PARTITION p2,
DROP PARTITION p3;
```

9. 上下の境界を指定してパーティションを追加します。

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES [("2014-01-01"), ("2014-02-01"));
```

## キーワード

```text
ALTER, TABLE, PARTITION, ALTER TABLE
```

## ベストプラクティス
