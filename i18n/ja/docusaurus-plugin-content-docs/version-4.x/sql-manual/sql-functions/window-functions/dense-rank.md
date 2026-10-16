---
{
    "title": "DENSE_RANK",
    "language": "ja",
    "description": "DENSERANK() は、グループ内の順位を計算するウィンドウ関数です。RANK() と異なり、DENSERANK() は順位を飛ばさずに連続した順位を返します。"
}
---

## 説明

DENSE_RANK() は、グループ内の順位を計算するウィンドウ関数です。RANK() と異なり、DENSE_RANK() は順位を飛ばさずに連続した順位を返します。順位は 1 から始まり、順に増加します。同じ値には同じ順位が付けられます。

## 構文

```sql
DENSE_RANK()
```

## 戻り値

1 から始まる BIGINT 型の順位を返します。

## 例

準備として `int_t` テーブルを作成し、例で使用する行を追加します。

```sql
CREATE TABLE int_t (x INT, y INT)
DISTRIBUTED BY HASH(x) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO int_t VALUES
    (1, 1), (1, 2), (1, 2),
    (2, 1), (2, 2), (2, 3),
    (3, 1), (3, 1), (3, 2);
```

```sql
select x, y, dense_rank() over(partition by x order by y) as rank from int_t;
```

パーティション内で同じ値には同じ順位が付けられ、順位は飛ばさずに連続します（これが `DENSE_RANK` と `RANK` の違いです）。

```text
+------+------+------+
| x    | y    | rank |
+------+------+------+
|    1 |    1 |    1 |
|    1 |    2 |    2 |
|    1 |    2 |    2 |
|    2 |    1 |    1 |
|    2 |    2 |    2 |
|    2 |    3 |    3 |
|    3 |    1 |    1 |
|    3 |    1 |    1 |
|    3 |    2 |    2 |
+------+------+------+
```
