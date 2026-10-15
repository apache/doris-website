---
{
    "title": "一時パーティション",
    "language": "ja",
    "description": "Apache Doris の一時パーティションのガイド。パーティションデータのアトミックな上書き、バケット数の変更、パーティションの統合や分割を、ダウンタイムなしでデータを切り替えながら行う方法を説明します。",
    "keywords": [
        "Doris の一時パーティション",
        "一時パーティション",
        "アトミックな上書き",
        "REPLACE PARTITION",
        "バケット数の変更",
        "パーティションの統合",
        "パーティションの分割"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenarios: Atomic data overwrite / Partition structure adjustment / Bucket count change -->

**一時パーティション**は、Doris のパーティション分割されたテーブルで、通常のパーティションから独立して存在するパーティションです。通常のクエリでは参照されず、専用の構文で明示的に指定する必要があります。主に、オンラインでの読み書きに影響を与えずに、データのアトミックな切り替えやパーティション構成の調整を行うために使用します。

## 利用シーン

| 利用シーン | 説明 | 主な機能 |
| --- | --- | --- |
| アトミックな上書き | 「古いデータを削除してから新しいデータをロードする」間にデータが存在しない期間を生じさせずに、パーティションのデータを書き換える | `REPLACE PARTITION` によるアトミックな置換 |
| バケット数の変更 | 既存のパーティションのバケット数が適切でない場合に調整する | 一時パーティションに新しいバケット数を指定してから置換する |
| パーティションの統合・分割 | 複数のパーティションを一つに統合するか、大きなパーティションを複数に分割して、パーティションの粒度を調整する | `INSERT INTO` でデータを再配置してから置換する |

> ヒント：**パーティション分割されていないテーブル**をアトミックに上書きする方法は、[テーブルの置換に関するドキュメント](../../data-operate/delete/atomicity-replace)を参照してください。

## 主な制約

一時パーティションは通常のパーティションと同じテーブルスキーマを共有しますが、次の点で独立しています。

- 一時パーティションの**パーティション列**は通常のパーティションと同じであり、変更できません。
- すべての**一時パーティション**の範囲は、互いに重複してはいけません。
- 一時パーティションと**通常のパーティション**の範囲は、**重複してもかまいません**。
- 一時パーティションには、通常のパーティションや別の一時パーティションと同じ名前を付けられません。

## 操作の流れ

一般的な操作は、次の四つのステップで構成されます。

1. 一時パーティションを**追加**する（範囲、列挙値、バケット数を指定）
2. 一時パーティションにデータを**ロード**する（`INSERT INTO`、Stream Load、Broker Load、Routine Load）
3. 通常のパーティションを**置換**する（`REPLACE PARTITION` によるアトミックな操作）
4. （任意）不要になった一時パーティションを**削除**する

---

## 一時パーティションの追加

`ALTER TABLE ADD TEMPORARY PARTITION` 文で一時パーティションを作成します。Range パーティションと List パーティションの両方に対応し、レプリカ数とバケット分割ルールを個別に指定できます。

```sql
-- Range partition: LESS THAN form
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01");

-- Range partition: fixed-interval form
ALTER TABLE tbl2 ADD TEMPORARY PARTITION tp1 VALUES [("2020-01-01"), ("2020-02-01"));

-- Range partition: custom replica count and bucketing
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;

-- List partition: single-column enumeration
ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai");

-- List partition: multi-column enumeration
ALTER TABLE tbl4 ADD TEMPORARY PARTITION tp1 VALUES IN ((1, "Beijing"), (1, "Shanghai"));

-- List partition: custom replica count and bucketing
ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;
```

## 一時パーティションへのデータのロード

一時パーティションを指定する構文は、ロード方法によって若干異なります。

```sql
-- INSERT INTO
INSERT INTO tbl TEMPORARY PARTITION(tp1, tp2, ...) SELECT ...;
```

```bash
# Stream Load
curl --location-trusted -u root: \
     -H "label:123" \
     -H "temporary_partitions: tp1, tp2, ..." \
     -T testData \
     http://host:port/api/testDb/testTbl/_stream_load
```

```sql
-- Broker Load
LOAD LABEL example_db.label1
(
    DATA INFILE("hdfs://hdfs_host:hdfs_port/user/palo/data/input/file")
    INTO TABLE my_table
    TEMPORARY PARTITION (tp1, tp2, ...)
    ...
)
WITH BROKER hdfs ("username"="hdfs_user", "password"="hdfs_password");

-- Routine Load
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
TEMPORARY PARTITIONS(tp1, tp2, ...),
WHERE k1 > 100
PROPERTIES (...)
FROM KAFKA (...);
```

## 一時パーティションのクエリ

通常の SQL クエリでは、一時パーティションは参照されません。`TEMPORARY PARTITION` キーワードを使って明示的に指定する必要があります。

```sql
SELECT ... FROM
    tbl1 TEMPORARY PARTITION(tp1, tp2, ...)
JOIN
    tbl2 TEMPORARY PARTITION(tp1, tp2, ...)
ON ...
WHERE ...;
```

## 通常のパーティションの置換

`ALTER TABLE REPLACE PARTITION` を使用して、通常のパーティションを一時パーティションでアトミックに置換します。

```sql
-- Equal-count replacement
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);

-- Many-to-many replacement
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2, tp3);

-- Replace with explicit parameters
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2)
PROPERTIES (
    "strict_range" = "false",
    "use_temp_partition_name" = "true"
);
```

### 置換パラメータ

| パラメータ | デフォルト値 | 説明 |
| --- | --- | --- |
| `strict_range` | `true` | 置換前後のパーティションの範囲や列挙値に求める一致条件を制御します（詳細は後述） |
| `use_temp_partition_name` | `false` | 置換後の通常のパーティションの命名方法を制御します |

#### `strict_range`

- **Range パーティション**：
    - `true`：置換対象の通常のパーティションの**範囲の和集合**が、置換に使う一時パーティションの範囲の和集合と**完全に一致**する必要があります。
    - `false`：置換後の新しい通常のパーティション同士が重複しなければ十分です。
- **List パーティション**：常に `true` です。置換対象の通常のパーティションの**列挙値の和集合**が、置換に使う一時パーティションの列挙値の和集合と完全に一致する必要があります。

**例 1：範囲の和集合が一致する場合（置換可能）**

```sql
-- Ranges (=> union) of partitions p1, p2, p3 to be replaced:
[10, 20), [20, 30), [40, 50) => [10, 30), [40, 50)

-- Ranges (=> union) of replacement partitions tp1, tp2:
[10, 30), [40, 45), [45, 50) => [10, 30), [40, 50)

-- The unions are equal, so tp1 and tp2 can replace p1, p2, and p3.
```

**例 2：範囲の和集合が異なる場合（strict_range の設定によって異なる）**

```sql
-- Range (=> union) of partition p1 to be replaced:
[10, 50) => [10, 50)

-- Ranges (=> union) of replacement partitions tp1, tp2:
[10, 30), [40, 50) => [10, 30), [40, 50)

-- strict_range = true: replacement is rejected.
-- strict_range = false: if the resulting [10, 30) and [40, 50) do not overlap with other formal partitions, the replacement is allowed.
```

**例 3：List パーティションの単一列の列挙値の和集合が一致する場合**

```sql
-- Enumerated values (=> union) of partitions p1, p2 to be replaced:
(1, 2, 3), (4, 5, 6) => (1, 2, 3, 4, 5, 6)

-- Enumerated values (=> union) of replacement partitions tp1, tp2, tp3:
(1, 2, 3), (4), (5, 6) => (1, 2, 3, 4, 5, 6)

-- The unions are equal, so tp1, tp2, and tp3 can replace p1 and p2.
```

**例 4：List パーティションの複数列の列挙値の和集合が一致する場合**

```sql
-- Enumerated values (=> union) of partitions p1, p2, p3 to be replaced:
(("1","beijing"), ("1", "shanghai")),
(("2","beijing"), ("2", "shanghai")),
(("3","beijing"), ("3", "shanghai"))
=> (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- Enumerated values (=> union) of replacement partitions tp1, tp2:
(("1","beijing"), ("1", "shanghai")),
(("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))
=> (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- The unions are equal, so tp1 and tp2 can replace p1, p2, and p3.
```

#### `use_temp_partition_name`

置換後の通常のパーティションの命名方法を制御します。

| 条件 | `use_temp_partition_name = false`（デフォルト） | `use_temp_partition_name = true` |
| --- | --- | --- |
| 置換対象と置換に使うパーティションの数が同じ | 元の通常のパーティション名を維持します（データとプロパティのみ置換します） | 一時パーティション名を新しい通常のパーティション名として使用します |
| 置換対象と置換に使うパーティションの数が異なる | このパラメータは効果がなく、一時パーティション名が使用されます | 一時パーティション名を使用します |

**例 1：パーティション数が同じ場合の置換**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);
```

- `use_temp_partition_name = false`（デフォルト）：置換後もパーティション名は `p1` のままですが、データとプロパティは `tp1` のものになります。
- `use_temp_partition_name = true`：置換後のパーティション名は `tp1` になり、`p1` は存在しなくなります。

**例 2：パーティション数が異なる場合の置換**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1);
```

- 置換対象のパーティション数（2）と置換に使うパーティション数（1）が異なるため、`use_temp_partition_name` は効果がありません。
- 置換後のパーティション名は `tp1` になり、元の `p1` と `p2` は存在しなくなります。

:::tip 置換時の注意事項
置換が成功すると、**置換された通常のパーティションは削除され、復元できません**。置換を実行する前に、一時パーティションのデータが正しいことを必ず確認してください。
:::

## 一時パーティションの削除

`ALTER TABLE DROP TEMPORARY PARTITION` を使用して、不要になった一時パーティションを削除します。

```sql
ALTER TABLE tbl1 DROP TEMPORARY PARTITION tp1;
```

> 注意：一時パーティションを削除した後は、**`RECOVER` コマンドで復元できません**。

---

## その他の操作との関係

### DROP 操作

| 操作 | 一時パーティションへの影響 | 復元可能か |
| --- | --- | --- |
| `DROP DATABASE` / `DROP TABLE` | データベースまたはテーブル内の一時パーティションも削除されます | データベースまたはテーブル自体は保存期間内に `RECOVER` で復元できますが、**一時パーティションは復元されません** |
| `ALTER ... DROP PARTITION`（通常のパーティション） | 一時パーティションには影響しません | 通常のパーティションは保存期間内に `RECOVER` で復元できます |
| `ALTER ... DROP TEMPORARY PARTITION` | 指定した一時パーティションを削除します | **復元できません** |

### TRUNCATE 操作

| 操作 | 影響 |
| --- | --- |
| `TRUNCATE TABLE` | テーブルの一時パーティションは**削除され、復元できません** |
| `TRUNCATE TABLE ... PARTITION`（通常のパーティションを TRUNCATE） | 一時パーティションには影響しません |
| 一時パーティションに対する `TRUNCATE` | **対応していません** |

### ALTER 操作

- テーブルに一時パーティションが存在する間は、**スキーマ変更、ロールアップなどの変更操作を実行できません**。
- テーブルで変更操作が進行している間は、**一時パーティションを追加できません**。

---

## よくある質問（FAQ）

**Q1：通常の `SELECT` クエリで一時パーティションは参照されますか？**

いいえ。一時パーティションは、`TEMPORARY PARTITION(...)` 句で明示的に指定した場合にのみ参照できます。通常のクエリ、レポート、ビューは、一時パーティションのデータを読み取りません。

**Q2：一時パーティションのレプリカ数とバケット数は、通常のパーティションと一致させる必要がありますか？**

いいえ。一時パーティションの主な利点の一つは、新しいパーティションに異なる `replication_num` と `BUCKETS` を指定し、`REPLACE PARTITION` でアトミックに切り替えられることです。

**Q3：データが存在しない期間を生じさせずに、パーティションデータを書き換えるにはどうすればよいですか？**

次の順序で実行します。
1. `ALTER TABLE ... ADD TEMPORARY PARTITION` を実行して一時パーティションを作成します。
2. `INSERT INTO` またはロードジョブを使用して、一時パーティションに新しいデータを書き込みます。
3. 一時パーティションのデータが正しいことを確認します。
4. `ALTER TABLE ... REPLACE PARTITION ... WITH TEMPORARY PARTITION ...` を実行して、アトミックに置換します。

この処理中、通常のパーティションは外部から引き続き読み取れます。

**Q4：置換に失敗した場合や、データが正しくない場合はどうなりますか？**

置換前であれば、データは一時パーティションに残り、通常のパーティションには影響しません。データに問題が見つかった場合は、`ALTER TABLE ... DROP TEMPORARY PARTITION` を実行して一時パーティションを削除し、再度ロードしてください。**置換が成功した後は、元の通常のパーティションのデータを復元できません。**

**Q5：一つのテーブルに複数の一時パーティションを同時に追加できますか？**

はい。一時パーティション同士で範囲や列挙値が重複せず、名前が一意であれば、必要な数だけ追加できます。

## よくあるエラー

| エラー・症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| 一時パーティションの追加に失敗する：パーティションがすでに存在する | 既存の通常のパーティションまたは一時パーティションと名前が重複している | 一時パーティションの名前を変更する |
| 一時パーティションの追加に失敗する：範囲が重複している | 既存の一時パーティションと範囲または列挙値が重複している | 範囲を調整するか、重複する一時パーティションを先に削除する |
| 置換に失敗する：`strict_range` のチェックに失敗する | Range パーティションの範囲の和集合が一致しない | 和集合を一致させるか、`strict_range = false` を明示的に設定する |
| 置換に失敗する：List パーティションの列挙値が一致しない | List パーティションでは `strict_range` が常に `true` になる | 一時パーティションの列挙値の和集合が、通常のパーティションのものと完全に一致するように調整する |
| スキーマ変更を実行できない | テーブルに一時パーティションが存在する | 先にすべての一時パーティションを削除するか、置換する |
| 一時パーティションを誤って削除した | `RECOVER` は一時パーティションの復元に対応していない | パーティションを再作成し、データを再度ロードする |

## 関連ドキュメント

- [パーティション分割されていないテーブルのアトミックな上書き：テーブルの置換](../../data-operate/delete/atomicity-replace)
