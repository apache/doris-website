---
{
    "title": "MAP_AGG",
    "language": "ja",
    "description": "MAP_AGG 関数は、複数行のデータに含まれるキーと値のペアから MAP を構築します。"
}
---

## 説明

MAP_AGG 関数は、複数行のデータに含まれるキーと値のペアから MAP を構築します。

キーが重複する場合、`MAP_AGG` は集約処理で最初に処理された値を保持し、すでに存在するキーに対する後続の値を無視します。部分集約の状態をマージする際も、マージ先の状態にすでに存在する値が保持されます。

「最初に処理された」とは、挿入順ではなく処理順を指します。スキャン、並列実行、および部分集約の状態をマージする順序によって保持される値が変わるため、重複キーに対して選ばれる値がクエリ間で同じになるとは限りません。外側の `ORDER BY` は結果の行をソートするだけで、重複キーに対してどの値が保持されるかは決めません。

## 構文

```sql
MAP_AGG(<expr1>, <expr2>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr1>` | キーとして使用する式。サポートされる型は Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、TimestampNs、Timestamptz、String、UUID です。 |
| `<expr2>` | 値として使用する式。サポートされる型は Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、TimestampNs、Timestamptz、String、UUID です。 |

## 戻り値

MAP 型の値を返します。グループ内に有効なデータがない場合は、空の MAP を返します。

## 使用例

```sql
-- setup
CREATE TABLE nation (
    n_nationkey INT,
    n_name STRING,
    n_regionkey INT
) DISTRIBUTED BY HASH(n_nationkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO nation VALUES
    (0, 'ALGERIA', 0),
    (1, 'ARGENTINA', 1),
    (2, 'BRAZIL', 1),
    (3, 'CANADA', 1);
```

```sql
select `n_regionkey`, map_agg(`n_nationkey`, `n_name`) from `nation` group by `n_regionkey`;
```

```text
+-------------+-----------------------------------------+
| n_regionkey | map_agg(`n_nationkey`, `n_name`)        |
+-------------+-----------------------------------------+
|           0 | {0:"ALGERIA"}                           |
|           1 | {1:"ARGENTINA", 2:"BRAZIL", 3:"CANADA"} |
+-------------+-----------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation`;
```

```text
+------------------------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5)                 |
+------------------------------------------------------+
| {"ALGERIA":0, "ARGENTINA":1, "BRAZIL":2, "CANADA":3} |
+------------------------------------------------------+
```

```sql
select map_agg(`n_name`, `n_nationkey` % 5) from `nation` where n_nationkey is null;
```

```text
+--------------------------------------+
| map_agg(`n_name`, `n_nationkey` % 5) |
+--------------------------------------+
| {}                                   |
+--------------------------------------+
```

次のクエリには重複するキーが含まれるため、結果に含まれるキーと値のペアは単一です。最初に処理される値に応じて、結果は `{1:"a"}` または `{1:"b"}` になります。以下に出力例を示します。

```sql
SELECT MAP_AGG(k, v) AS result
FROM (
    SELECT 1 AS k, 'a' AS v
    UNION ALL
    SELECT 1 AS k, 'b' AS v
) AS input;
```

```text
+---------+
| result  |
+---------+
| {1:"a"} |
+---------+
```
