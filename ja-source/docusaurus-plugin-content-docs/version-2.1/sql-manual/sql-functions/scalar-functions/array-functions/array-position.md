---
{
  "title": "ARRAY_POSITION",
  "language": "ja",
  "description": "指定された配列内で値が最初に出現する位置/インデックスを返します。"
}
---
## description

指定された配列内で`value`が最初に出現する位置/インデックスを返します。

## Syntax

```sql
ARRAY_POSITION(<arr>, <value>)
```
## パラメータ

| Parameter | Description |
| --- | --- |
| `<arr>` | ARRAY配列 |
| `<value>` | 検索する要素 |

## 戻り値

配列内での値の位置（1から開始）。特殊なケース：
- 配列内に値が存在しない場合は0
- 配列がNULLの場合はNULL

## example

```sql
CREATE TABLE array_test (
                            id INT,
                            c_array ARRAY<INT>,
                            array_position INT
)
    duplicate key (id)
distributed by hash(id) buckets 1
properties(
  'replication_num' = '1'
);
INSERT INTO array_test (id, c_array, array_position) VALUES
                                                         (1, [1, 2, 3, 4, 5], 5),
                                                         (2, [6, 7, 8], 0),
                                                         (3, [], 0),
                                                         (4, NULL, NULL);
SELECT id,c_array,array_position(c_array, 5) FROM `array_test`;
```
```text
+------+-----------------+------------------------------+
| id   | c_array         | array_position(`c_array`, 5) |
+------+-----------------+------------------------------+
|    1 | [1, 2, 3, 4, 5] |                            5 |
|    2 | [6, 7, 8]       |                            0 |
|    3 | []              |                            0 |
|    4 | NULL            |                         NULL |
+------+-----------------+------------------------------+
```
```sql
select array_position([1, null], null);
```
```text
+--------------------------------------+
| array_position(ARRAY(1, NULL), NULL) |
+--------------------------------------+
|                                    2 |
+--------------------------------------+
```
