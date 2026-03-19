---
{
  "title": "COLLECT_LIST",
  "description": "集約関数で、列のすべての値を配列に集約するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

集約関数で、列のすべての値を配列に集約するために使用されます。

## Alias

- GROUP_ARRAY

## Syntax

```sql
COLLECT_LIST(<expr> [,<max_size>])
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 配列に配置される値を決定する式。サポートされる型: Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、IPV4、IPV6、String、Array、Map、Struct。 |
| `<max_size>` | 結果の配列サイズをmax_size個の要素に制限するオプションのパラメータ。サポートされる型: Integer。 |

## 戻り値

すべての非NULL値を含むARRAY型を返します。グループ内に有効なデータがない場合、空の配列を返します。

## 例

```sql
-- setup
CREATE TABLE collect_list_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_list_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 30, 'c'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```
```sql
select collect_list(k1),collect_list(k1,3) from collect_list_test;
```
```text
+--------------------+--------------------+
| collect_list(k1)   | collect_list(k1,3) |
+--------------------+--------------------+
| [1, 1, 1, 2, 2, 3] | [1, 1, 1]          |
+--------------------+--------------------+
```
```sql
select k1,collect_list(k2),collect_list(k3,1) from collect_list_test group by k1 order by k1;
```
```text
+------+------------------+--------------------+
| k1   | collect_list(k2) | collect_list(k3,1) |
+------+------------------+--------------------+
|    1 | [10, 20, 30]     | ["a"]              |
|    2 | [100, 200]       | ["x"]              |
|    3 | []               | []                 |
+------+------------------+--------------------+
```
