---
{
    "title": "COLLECT_SET",
    "language": "ja",
    "description": "指定した列の NULL 以外の値を集約し、重複を除いた結果を配列として返す集約関数です。"
}
---

## 説明

指定した列の NULL 以外の値を集約し、重複を除いた結果を配列として返す集約関数です。

## 別名

- GROUP_UNIQ_ARRAY

## 構文

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 配列に格納する値を決める式。サポートされる型: Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Date、Datetime、Timestamptz、IPV4、IPV6、String、Array、Map、Struct。 |
| `<max_size>` | 結果の配列の要素数を max_size 以下に制限する省略可能なパラメータ。サポートされる型: Integer。 |

## 戻り値

重複を除いた NULL 以外のすべての値を含む ARRAY 型の値を返します。グループに有効なデータがない場合は、空の配列を返します。

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
