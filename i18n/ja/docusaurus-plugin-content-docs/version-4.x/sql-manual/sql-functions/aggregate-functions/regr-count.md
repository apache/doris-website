---
{
    "title": "REGR_COUNT",
    "language": "ja",
    "description": "グループ内の NULL 以外の (y, x) ペアの数を返します。"
}
---

## 説明

グループ内の NULL 以外の `(y, x)` ペアの数を返します。`x` は独立変数、`y` は従属変数です。有効な NULL 以外のペアがない場合、関数は `0` を返します。

## 構文

```sql
REGR_COUNT(<y>, <x>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<y>` | 従属変数。Double 型をサポートします。 |
| `<x>` | 独立変数。Double 型をサポートします。 |

## 戻り値

NULL 以外の `(y, x)` ペアの数を表す BIGINT 型の値を返します。
グループ内に行がない場合、または有効な NULL 以外の `(y, x)` ペアがない場合、関数は `0` を返します。

## 使用例

```sql
CREATE TABLE test_regr (
  `id` int,
  `x` double,
  `y` double
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO test_regr VALUES
(1, 0, NULL),
(2, 1, 3),
(2, 2, 5),
(2, 3, 7),
(2, 4, 9),
(2, 5, NULL);
```

```sql
SELECT id, REGR_COUNT(y, x) FROM test_regr GROUP BY id ORDER BY id;
```

```text
+------+-------------------+
| id   | REGR_COUNT(y, x)  |
+------+-------------------+
|    1 |                 0 |
|    2 |                 4 |
+------+-------------------+
```

REGR_COUNT は NULL 以外の `(y, x)` ペアだけを数えるため、グループ 1 は `0` を返します。
