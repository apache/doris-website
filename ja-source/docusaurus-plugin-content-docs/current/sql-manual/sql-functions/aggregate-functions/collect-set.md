---
{
  "title": "COLLECT_SET",
  "language": "ja",
  "description": "集約関数は、指定された列のすべての一意な値を集約し、重複する要素を削除して、set型の結果を返します。"
}
---
## 説明

集約関数は指定された列のすべての一意の値を集約し、重複する要素を削除して、セット型の結果を返します。

## エイリアス

- GROUP_UNIQ_ARRAY

## 構文

```sql
COLLECT_SET(<expr> [,<max_size>])
```
## パラメータ

| Parameter | Description |
| -- | -- |
| `<expr>` | 配列に配置される値を決定する式。サポートされる型: Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、Timestamptz、IPV4、IPV6、String、Array、Map、Struct。 |
| `<max_size>` | 結果配列のサイズをmax_size要素に制限するオプションパラメータ。サポートされる型: Integer。 |

## 戻り値

重複排除後のすべてのnull以外の値を含むARRAY型を返します。グループに有効なデータがない場合は、空の配列を返します。

## 例

```sql
-- setup
CREATE TABLE collect_set_test (
	k1 INT,
	k2 INT,
	k3 STRING
) DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO collect_set_test VALUES (1, 10, 'a'), (1, 20, 'b'), (1, 10, 'a'), (2, 100, 'x'), (2, 200, 'y'), (3, NULL, NULL);
```
```sql
select collect_set(k1),collect_set(k1,2) from collect_set_test;
```
```text
+-----------------+-------------------+
| collect_set(k1) | collect_set(k1,2) |
+-----------------+-------------------+
| [2, 1, 3]       | [2, 1]            |
+-----------------+-------------------+
```
```sql
select k1,collect_set(k2),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```
```text
+------+-----------------+-------------------+
| k1   | collect_set(k2) | collect_set(k3,1) |
+------+-----------------+-------------------+
|    1 | [20, 10]        | ["a"]             |
|    2 | [200, 100]      | ["x"]             |
|    3 | []              | []                |
+------+-----------------+-------------------+
```
