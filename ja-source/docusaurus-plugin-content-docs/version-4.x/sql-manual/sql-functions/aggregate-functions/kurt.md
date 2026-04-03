---
{
  "title": "KURT,KURT_POP,KURTOSIS",
  "description": "KURTOSIS関数はデータの尖度を計算します。使用される公式は次の通りです：4次中心モーメント / (分散の2乗) - 3。",
  "language": "ja"
}
---
## 説明

KURTOSIS関数はデータの[kurtosis](https://en.wikipedia.org/wiki/Kurtosis)を計算します。使用される公式は、4次中心モーメント / (分散の2乗) - 3です。

## エイリアス

KURT_POP, KURTOSIS

## 構文

```sql
KURTOSIS(<expr>)
KURT_POP(<expr>)
KURT(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 計算する式、Double型がサポートされています。 |

## Return Value

DOUBLE値を返します。
分散がゼロの場合、NULLを返します。
グループに有効なデータがない場合、NULLを返します。

## Example

```sql
-- setup
create table statistic_test(
    tag int,
    val1 double,
    val2 double
) distributed by hash(tag) buckets 1
properties ("replication_num"="1");
insert into statistic_test values
    (1, -10, -10),
    (2, -20, null),
    (3, 100, null),
    (4, 100, null),
    (5, 1000, 1000);
```
```sql
select kurt(val1), kurt(val2) from statistic_test;
```
```text
+---------------------+------------+
| kurt(val1)          | kurt(val2) |
+---------------------+------------+
| 0.16212458373485106 |         -2 |
+---------------------+------------+
```
```sql
select kurt(val1), kurt(val2) from statistic_test group by tag;
```
```text
+------------+------------+
| kurt(val1) | kurt(val2) |
+------------+------------+
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
|       NULL |       NULL |
+------------+------------+
```
