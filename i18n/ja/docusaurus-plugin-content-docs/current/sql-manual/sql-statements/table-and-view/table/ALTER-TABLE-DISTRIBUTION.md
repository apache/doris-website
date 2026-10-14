---
{
    "title": "ALTER TABLE DISTRIBUTION",
    "language": "ja",
    "description": "この文は、パーティションテーブルのデフォルトの分散バケット設定を変更するために使用します。"
}
---

## 説明

この文は、パーティションテーブルのデフォルトの分散バケット設定を変更するために使用します。この操作は同期的に実行され、コマンドが返った時点で処理は完了しています。

この文で変更されるのは、**新しく作成されるパーティション**のデフォルトのバケット数だけです。既存のパーティションのバケット数は変わりません。

構文:

```sql
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(column1[, column2, ...]) BUCKETS { num | AUTO };
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS { num | AUTO };
```

注意:

- `num`: 新しいパーティションの固定バケット数を指定する正の整数です。
- `AUTO`: データ量とクラスターの構成に基づいて、新しいパーティションのバケット数をシステムが自動的に決定します。
- 分散方式（HASH または RANDOM）と分散カラムは、元のテーブル定義と同じでなければなりません。変更できるのはバケット数だけです。
- この文を使用できるのは、**パーティションテーブル**（RANGE または LIST パーティション）だけです。パーティション分割されていないテーブルには使用できません。
- **Colocate** テーブルでは、この文はサポートされていません。
- 固定バケット数と `AUTO` は相互に切り替えられ、変更を繰り返し実行することもできます。

### AUTO PARTITION との関係

[AUTO PARTITION](../../../../table-design/data-partitioning/auto-partitioning) を使用するテーブルでは、`ALTER TABLE MODIFY DISTRIBUTION` の実行後にデータの挿入によって自動作成される新しいパーティションに、新しいバケット設定が適用されます。変更前に自動作成されたパーティションは変わりません。

たとえば、AUTO PARTITION テーブルで元々 `BUCKETS 5` を使用しており、これを `BUCKETS 8` に変更した場合、それ以降の INSERT によって新しい自動パーティションが作成されると、そのパーティションには 8 個のバケットが割り当てられます。さらに `BUCKETS AUTO` に変更すると、新しく自動作成されるパーティションのバケット数はシステムによって自動的に決定されます。

### 動的パーティションとの関係

[動的パーティション](../../../../table-design/data-partitioning/dynamic-partitioning) を使用するテーブルでは、`ALTER TABLE MODIFY DISTRIBUTION` の実行後に動的パーティションスケジューラーによって自動作成される新しいパーティションに、新しいバケット設定が適用されます。既存の動的パーティションは変わりません。

動的パーティションテーブルでは、`dynamic_partition.buckets` プロパティも使用できます。両方が設定されている場合、動的に作成されるパーティションには `dynamic_partition.buckets` プロパティが優先されます。動的パーティションでテーブルレベルのデフォルトのバケット数（`MODIFY DISTRIBUTION` で設定した値）を使用するには、`dynamic_partition.buckets` が明示的に設定されていないことを確認するか、`ALTER TABLE ... SET ("dynamic_partition.buckets" = "...")` で適宜更新してください。

## 例

1. HASH 分散の RANGE パーティションテーブルのデフォルトのバケット数を元の値から 10 に変更する

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

この後に追加されるパーティションでは、バケット数が 10 になります:

```sql
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 will have 10 buckets; existing partitions remain unchanged
```

2. 固定バケット数から AUTO に切り替える

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
```

この後に作成されるパーティションのバケット数は、システムによって自動的に決定されます。

3. AUTO から固定バケット数に戻す

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 3;
```

4. LIST パーティションテーブルのデフォルトのバケット数を変更する

```sql
ALTER TABLE example_db.my_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;
```

5. RANDOM 分散のテーブルのデフォルトのバケット数を変更する

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 12;
```

6. RANDOM 分散のテーブルを AUTO バケット数に切り替える

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS AUTO;
```

7. AUTO PARTITION テーブル（RANGE）のデフォルトのバケット数を変更する

```sql
-- Original table uses AUTO PARTITION BY RANGE with BUCKETS 5
ALTER TABLE example_db.my_auto_range_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;

-- New auto-created partitions from subsequent INSERT will use 8 buckets
INSERT INTO example_db.my_auto_range_table VALUES ('2024-01-03', 3);
```

8. AUTO PARTITION テーブル（LIST）のデフォルトのバケット数を変更する

```sql
-- Original table uses AUTO PARTITION BY LIST with BUCKETS 4
ALTER TABLE example_db.my_auto_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 7;

-- New auto-created partitions from subsequent INSERT will use 7 buckets
INSERT INTO example_db.my_auto_list_table VALUES ('ccc', 3);
```

9. AUTO PARTITION テーブルを AUTO バケット数から固定バケット数に切り替え、再び AUTO に戻す

```sql
-- Table originally created with BUCKETS AUTO
ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 5;
-- New partitions will use 5 buckets

ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
-- New partitions will return to system-determined bucket count
```

10. 変更を続けて複数回実行する

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 4;
ALTER TABLE example_db.my_table ADD PARTITION p2 VALUES LESS THAN ('20');
-- p2 has 4 buckets

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 has system-determined bucket count

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 6;
ALTER TABLE example_db.my_table ADD PARTITION p4 VALUES LESS THAN ('40');
-- p4 has 6 buckets
```

11. エラーになるケース

Colocate テーブルはサポートされていません:

```sql
-- This will fail with: "Cannot change default bucket number of colocate table"
ALTER TABLE example_db.my_colocate_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

パーティション分割されていないテーブルはサポートされていません:

```sql
-- This will fail with: "Only support change partitioned table's distribution"
ALTER TABLE example_db.my_unpartitioned_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

分散方式は変更できません:

```sql
-- Original table uses HASH distribution; changing to RANDOM will fail
-- Error: "Cannot change distribution type"
ALTER TABLE example_db.my_hash_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 10;
```

分散カラムは変更できません:

```sql
-- Original table uses HASH(k1); changing to HASH(k2) will fail
-- Error: "Cannot assign hash distribution with different distribution cols"
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k2) BUCKETS 10;
```

## キーワード

```text
ALTER, TABLE, DISTRIBUTION, MODIFY DISTRIBUTION, BUCKETS, ALTER TABLE
```
