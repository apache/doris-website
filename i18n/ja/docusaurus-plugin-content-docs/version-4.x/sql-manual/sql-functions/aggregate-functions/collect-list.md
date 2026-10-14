---
{
    "title": "COLLECT_LIST",
    "language": "ja",
    "description": "列の NULL 以外の値を配列に集約する集約関数です。"
}
---

## 説明

列の NULL 以外の値を配列に集約する集約関数です。

## 別名

- GROUP_ARRAY

## 構文

```sql
COLLECT_LIST(<expr> [,<max_size>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 配列に格納する値を決める式。サポートされる型: Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、Timestamptz、IPV4、IPV6、String、Array、Map、Struct。 |
| `<max_size>` | 結果の配列の要素数を max_size 以下に制限する省略可能なパラメータ。サポートされる型: Integer。 |

## 戻り値

NULL 以外のすべての値を含む ARRAY 型の値を返します。グループに NULL 以外の値がない場合は、空の配列を返します。

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
