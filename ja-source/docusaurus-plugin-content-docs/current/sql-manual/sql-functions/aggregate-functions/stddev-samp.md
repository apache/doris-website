---
{
  "title": "STDDEV_SAMP",
  "language": "ja",
  "description": "expr式のサンプル標準偏差を返します"
}
---
## 説明

expr式のサンプル標準偏差を返します

## 構文

```sql
STDDEV_SAMP(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 標準偏差を計算する値。Double型をサポートします。 |

## 戻り値

expr式のサンプル標準偏差をDouble型として返します。
グループに有効なデータがない場合は、NULLを返します。

### 例

```sql
-- Create sample tables
CREATE TABLE score_table (
    student_id INT,
    score DOUBLE
) DISTRIBUTED BY HASH(student_id)
PROPERTIES (
    "replication_num" = "1"
);

-- Insert test data
INSERT INTO score_table VALUES
(1, 85),
(2, 90),
(3, 82),
(4, 88),
(5, 95);

-- Calculate the sample standard deviation of all students' scores
SELECT STDDEV_SAMP(score) as score_stddev
FROM score_table;
```
```text
+-------------------+
| score_stddev      |
+-------------------+
| 4.949747468305831 |
+-------------------+
```
