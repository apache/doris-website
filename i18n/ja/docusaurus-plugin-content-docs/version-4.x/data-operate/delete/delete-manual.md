---
{
    "title": "DELETE 操作",
    "language": "ja",
    "description": "Apache Doris の DELETE 文のガイドです。条件に基づくテーブルまたはパーティションのデータ削除、USING 句による複数テーブルの結合削除、構文、パラメータ、制限事項、パフォーマンスの調整について説明します。",
    "keywords": [
        "Doris DELETE",
        "データ削除",
        "条件付き削除",
        "USING による複数テーブルの削除",
        "Unique Key の削除",
        "パーティションの削除",
        "delete_without_partition",
        "SHOW DELETE"
    ]
}
---

<!-- Knowledge type: Operation steps + Configuration parameters -->
<!-- Applicable scenarios: Data cleanup / Conditional delete / Multi-table joined delete -->

Apache Doris では、MySQL プロトコルを介して `DELETE` 文を実行し、条件に基づいて指定したテーブルまたはパーティションからデータを削除します。次の二つの形式を使用できます。

- **述語による削除**：単純な `WHERE` 述語の組み合わせに一致するデータを削除します。
- **複数テーブルの結合による削除（USING）**：主キーテーブル（Unique Key）で `USING` 句を使用し、他のテーブルと結合してデータを削除します。

## クイックナビゲーション {#quick-navigation}

| 用途 | 推奨する方法 | 対象のテーブルモデル |
|----------|----------------------|------------------------|
| 列の値を条件に削除する | [述語による削除](#delete-by-specifying-filter-predicates) | Duplicate / Aggregate / Unique |
| パーティションを指定して一括削除する | [述語による削除と PARTITION の指定](#delete-by-specifying-filter-predicates) | すべてのモデル |
| 複数テーブルの結合で削除対象を特定する | [USING 句による削除](#delete-with-the-using-clause) | Unique Key のみ |
| 削除履歴を表示する | [SHOW DELETE](#viewing-delete-history) | すべてのモデル |

## フィルター述語を指定して削除 {#delete-by-specifying-filter-predicates}

<!-- Knowledge type: Operation steps -->

### 構文 {#syntax}

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    WHERE column_name op { value | value_list } [ AND column_name op { value | value_list } ...];
```

### パラメータの説明 {#parameter-description}

**必須パラメータ**

| パラメータ | 説明 |
|-----------|-------------|
| `table_name` | データを削除する対象テーブル |
| `column_name` | `table_name` に属する列 |
| `op` | 論理比較演算子。使用可能な演算子：`=`、`>`、`<`、`>=`、`<=`、`!=`、`in`、`not in` |
| `value \| value_list` | 論理比較に使用する単一の値または値のリスト |

**任意パラメータ**

| パラメータ | 説明 |
|-----------|-------------|
| `PARTITION` / `PARTITIONS` | 削除を実行するパーティション名を指定します。指定したパーティションがテーブルに存在しない場合はエラーになります |
| `table_alias` | テーブルの別名 |

### 制限事項 {#limitations}

- **Aggregate Key テーブル**：条件に指定できるのは Key 列だけです。選択した Key 列が Rollup に存在しない場合、削除は実行できません。
- **パーティションテーブル**：パーティションを指定するか、Doris が条件からパーティションを推定できる必要があります。次の二つの場合はパーティションを推定できません。
    1. 条件にパーティション列が含まれていない場合。
    2. パーティション列の `op` が `not in` の場合。
- **Unique Key 以外のパーティションテーブル**：パーティションを指定せず、条件からも推定できない場合は、セッション変数 `delete_without_partition = true` を設定する必要があります。この場合、削除はすべてのパーティションに適用されます。

### 例 {#examples}

以下の例では、Unique Key テーブル `my_table` を使用します。このテーブルは `k1` でリストパーティション化され、パーティション `p1` と `p2` を持ちます。

```sql
CREATE TABLE my_table (
  k1 INT,
  status VARCHAR(32),
  dt DATE
)
UNIQUE KEY (k1)
PARTITION BY LIST (k1) (
  PARTITION p1 VALUES IN (1, 2, 3, 4, 5),
  PARTITION p2 VALUES IN (6, 7, 8, 9, 10)
)
DISTRIBUTED BY HASH (k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO my_table VALUES
  (1, 'active',   '2024-09-01'),
  (3, 'outdated', '2024-10-15'),
  (5, 'active',   '2024-10-20'),
  (6, 'outdated', '2024-10-05'),
  (8, 'outdated', '2024-10-25'),
  (10, 'active',  '2024-11-10');
```

**例 1：指定したパーティションで、列が固定値に等しいデータを削除する**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 = 3;
```

**例 2：指定したパーティションで、複合条件を満たすデータを削除する**

```sql
DELETE FROM my_table PARTITION p1
WHERE k1 >= 3 AND status = "outdated";
```

**例 3：時間範囲で絞り込み、複数のパーティションからデータを削除する**

```sql
DELETE FROM my_table PARTITIONS (p1, p2)
WHERE k1 >= 3 AND dt >= "2024-10-01" AND dt <= "2024-10-31";
```

## USING 句を使用した削除 {#delete-with-the-using-clause}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: Multi-table joined delete -->

削除対象のデータを複数のテーブルの結合によって正確に特定する必要がある場合は、`USING` 句を使用します。

### 構文 {#syntax-1}

```sql
DELETE FROM table_name [table_alias]
    [PARTITION partition_name | PARTITIONS (partition_name [, partition_name])]
    [USING additional_tables]
    WHERE condition;
```

### パラメータの説明 {#parameter-description-1}

**必須パラメータ**

| パラメータ | 説明 |
|-----------|-------------|
| `table_name` | データを削除する対象テーブル |
| `WHERE condition` | 削除する行を選択するための条件 |

**任意パラメータ**

| パラメータ | 説明 |
|-----------|-------------|
| `PARTITION` / `PARTITIONS` | 削除を実行するパーティション名を指定します。指定したパーティションがテーブルに存在しない場合はエラーになります |
| `table_alias` | テーブルの別名 |
| `USING additional_tables` | 結合に使用する他のテーブル |

### 制限事項 {#limitations-1}

- **Unique Key** モデルのテーブルでのみサポートされます。

### 例 {#example}

次の例では、`t1` から、`t2` と `t3` の結合結果に基づいてデータを削除します。

**ステップ 1：テーブルを作成する**

```sql
CREATE TABLE t1
    (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
UNIQUE KEY (id)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1', "function_column.sequence_col" = "c4");

CREATE TABLE t2
    (id INT, c1 BIGINT, c2 STRING, c3 DOUBLE, c4 DATE)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');

CREATE TABLE t3
    (id INT)
DISTRIBUTED BY HASH (id)
PROPERTIES('replication_num'='1');
```

**ステップ 2：テストデータを挿入する**

```sql
INSERT INTO t1 VALUES
    (1, 1, '1', 1.0, '2000-01-01'),
    (2, 2, '2', 2.0, '2000-01-02'),
    (3, 3, '3', 3.0, '2000-01-03');

INSERT INTO t2 VALUES
    (1, 10, '10', 10.0, '2000-01-10'),
    (2, 20, '20', 20.0, '2000-01-20'),
    (3, 30, '30', 30.0, '2000-01-30'),
    (4, 4, '4', 4.0, '2000-01-04'),
    (5, 5, '5', 5.0, '2000-01-05');

INSERT INTO t3 VALUES
    (1),
    (4),
    (5);
```

**ステップ 3：結合を使用して削除を実行する**

```sql
DELETE FROM t1
    USING t2 INNER JOIN t3 ON t2.id = t3.id
    WHERE t1.id = t2.id;
```

**期待される結果**：`id = 1` の行が `t1` から削除されます。

```sql
SELECT * FROM t1 ORDER BY id;
```

```text
+----+----+----+--------+------------+
| id | c1 | c2 | c3     | c4         |
+----+----+----+--------+------------+
| 2  | 2  | 2  |    2.0 | 2000-01-02 |
| 3  | 3  | 3  |    3.0 | 2000-01-03 |
+----+----+----+--------+------------+
```

## 関連する設定 {#related-configuration}

<!-- Knowledge type: Configuration parameters -->

| 設定項目 | スコープ | 説明 | デフォルト値 |
|---------------|-------|-------------|---------|
| `insert_timeout` | セッション | 削除は特殊なロードとして扱われ、この値によって実行時間が制限されます。`SET insert_timeout = xxx` で秒単位で調整します | - |
| `max_allowed_in_element_num_of_delete` | グローバル | `IN` 述語で使用できる要素数の上限 | 1024 |

## 削除履歴の表示 {#viewing-delete-history}

<!-- Knowledge type: Operation steps -->

完了した削除操作の記録を表示するには、`SHOW DELETE` 文を使用します。

**構文**

```sql
SHOW DELETE [FROM db_name];
```

**例**

```sql
mysql> SHOW DELETE FROM test_db;
+-----------+---------------+---------------------+-----------------+----------+
| TableName | PartitionName | CreateTime          | DeleteCondition | State    |
+-----------+---------------+---------------------+-----------------+----------+
| empty_tbl | p3            | 2020-04-15 23:09:35 | k1 EQ "1"       | FINISHED |
| test_tbl  | p4            | 2020-04-15 23:09:53 | k1 GT "80"      | FINISHED |
+-----------+---------------+---------------------+-----------------+----------+
2 rows in set (0.00 sec)
```

## パフォーマンスに関する推奨事項 {#performance-recommendations}

<!-- Knowledge type: Architecture decision -->

各テーブルモデルでの `DELETE` のパフォーマンス特性は次のとおりです。

| テーブルモデル | 実行速度 | クエリへの影響 | 推奨される用途 |
|-------------|-----------------|-------------------|------------------------|
| 明細テーブル（Duplicate Key） | 高速 | 短時間に大量の削除を実行するとクエリのパフォーマンスに影響します | 削除の頻度を抑えます |
| 集約テーブル（Aggregate Key） | 高速 | 短時間に大量の削除を実行するとクエリのパフォーマンスに影響します | 削除の頻度を抑えます |
| 主キーテーブル（Unique Key） | 広範囲の削除では低速（`INSERT INTO` に変換されます） | 短時間に大量の削除を実行しても、クエリのパフォーマンスへの影響は限定的です | 頻繁に削除する場合に適しています |

## よくある質問 {#faq}

**Q1：DELETE を実行すると、パーティションの指定が必要だというエラーが表示されます。どうすればよいですか？**

Unique Key 以外のパーティションテーブルでは、条件にパーティション列が含まれていない場合や `not in` を使用している場合、Doris はパーティションを推定できません。次のいずれかの方法を使用します。

- `PARTITION` を `DELETE` 文で明示的に指定します。
- または、セッション変数 `SET delete_without_partition = true` を設定して、すべてのパーティションに削除を適用します。

**Q2：集約テーブルの Key 以外の列を条件に削除できますか？**

いいえ。集約テーブルでは、削除条件に指定できるのは Key 列だけです。

**Q3：USING 句はどのテーブルモデルをサポートしていますか？**

削除対象としてサポートされるのは、**Unique Key** モデルのテーブルだけです。

**Q4：IN 述語の要素数が多すぎるというエラーが表示された場合、どうすればよいですか？**

`max_allowed_in_element_num_of_delete` 設定を調整し、使用可能な要素数の上限（デフォルトは 1024）を引き上げます。

**Q5：削除がタイムアウトした場合、どうすればよいですか？**

`SET insert_timeout = xxx` を使用し、タイムアウトを秒単位で延長します。

## 関連ドキュメント {#related-documents}

- [DELETE 構文マニュアル](../../sql-manual/sql-statements/data-modification/DML/DELETE)
