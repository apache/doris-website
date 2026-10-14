---
{
    "title": "NTILE",
    "language": "ja",
    "description": "NTILE() は、並べ替えたデータセットを指定した数のほぼ均等なバケットに分割するウィンドウ関数です。"
}
---

## 説明

NTILE() は、並べ替えたデータセットを指定した数のほぼ均等なバケットに分割するウィンドウ関数です。バケットには 1 から指定したバケット数まで順番に番号が付けられます。データを均等に分割できない場合、余った行は番号の小さいバケットから割り当てられるため、各バケットの行数の差は最大 1 行です。

## 構文

```sql
NTILE( <constant_value> )
```

## パラメータ

| パラメータ | 説明 |
| ---------- | ---- |
| constant_value | 必須。作成するバケットの数を指定します。正の整数である必要があります。

## 戻り値

1 から指定したバケット数までの BIGINT 型のバケット番号を返します。

## 使用上の注意

SQL 文に NTILE 関数の ORDER BY 句と結果の ORDER BY 句の両方が含まれる場合、これらの並べ替えは互いに独立しています。

- NTILE 関数の ORDER BY 句は、各行をどのバケットに割り当てるかを決定します。
- 結果の ORDER BY 句は、結果の表示順序を決定します。

## 例

<!-- setup-sql
CREATE TABLE student_scores (name VARCHAR(20), score INT) DISTRIBUTED BY HASH(name) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO student_scores VALUES ('Alice',98),('Bob',95),('Charlie',90),('David',85),('Eve',82),('Frank',78),('Grace',75),('Henry',70);
-->

```sql
SELECT 
    name,
    score,
    NTILE(4) OVER (ORDER BY score DESC) as quarter
FROM student_scores;
```

```text
+----------+-------+---------+
| name     | score | quarter |
+----------+-------+---------+
| Alice    | 98    | 1       |  -- Top 25% scores
| Bob      | 95    | 1       |
| Charlie  | 90    | 2       |  -- 25-50% scores
| David    | 85    | 2       |
| Eve      | 82    | 3       |  -- 50-75% scores
| Frank    | 78    | 3       |
| Grace    | 75    | 4       |  -- Bottom 25% scores
| Henry    | 70    | 4       |
+----------+-------+---------+
```
