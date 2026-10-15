---
{
    "title": "ROW_NUMBER",
    "language": "ja",
    "description": "ROWNUMBER() は、パーティション内の各行に一意の連番を割り当てるウィンドウ関数です。"
}
---

## 説明

ROW_NUMBER() は、パーティション内の各行に一意の連番を割り当てるウィンドウ関数です。番号は 1 から始まり、連続して増加します。RANK() や DENSE_RANK() とは異なり、同じ値の行にも異なる番号を割り当てるため、各行に一意の番号が付きます。

## 構文

```sql
ROW_NUMBER()
```

## 戻り値

1 から始まり、連続して増加する BIGINT 型の連番を返します。番号は各パーティション内で一意です。

## 例

<!-- setup-sql
CREATE TABLE int_t (x INT, y INT) DISTRIBUTED BY HASH(x) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO int_t VALUES (1,1),(1,2),(1,2),(2,1),(2,2),(2,3),(3,1),(3,1),(3,2);
-->

```sql
select x, y, row_number() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 3    |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    |
| 3   | 1   | 1    |
| 3   | 1   | 2    |
| 3   | 2   | 3    |
+-----+-----+------+
```
