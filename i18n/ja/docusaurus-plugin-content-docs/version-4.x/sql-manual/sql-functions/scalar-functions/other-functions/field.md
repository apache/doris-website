---
{
    "title": "FIELD",
    "language": "ja",
    "description": "値のリスト <param> [, ...] で <expr> が最初に現れる位置を返します。<expr> が見つからない場合は 0 を返します。"
}
---

## 説明

`<expr>` が値のリスト `<param> [, ...]` に最初に現れる位置を返します。  
`<expr>` が見つからない場合は `0` を返します。通常、`ORDER BY` で独自の並び順を指定するために使用します。

## 構文

```sql
FIELD(<expr>, <param> [, ...])
```

## パラメータ

| パラメータ | 説明 |
| --- | --- |
| `<expr>` | パラメータのリストから検索する値。 |
| `<param>` | `<expr>` と比較する値の列。 |

## 戻り値

- 1 から始まるインデックスで、`<expr>` が `<param>` の値のリスト内に現れる位置を返します。  
- `<expr>` が見つからない場合は `0` を返します。  
- `<expr>` が `NULL` の場合は `0` を返します。

## 例

```sql
-- setup
CREATE TABLE baseall (k1 INT, k7 VARCHAR(64))
DISTRIBUTED BY HASH(k1) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO baseall VALUES
    (1, 'wangjing04'),
    (2, 'wangyu14'),
    (3, 'yuanyuan06');

CREATE TABLE class_test (class_name VARCHAR(64))
DISTRIBUTED BY HASH(class_name) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO class_test VALUES
    ('Suzi'), ('Suzi'),
    ('Ben'), ('Ben'),
    ('Henry'), ('Henry'),
    (NULL);
```

```sql
SELECT FIELD(2, 3, 1, 2, 5);
```

```text
+----------------------+
| FIELD(2, 3, 1, 2, 5) |
+----------------------+
|                    3 |
+----------------------+
```

```sql
SELECT k1, k7 FROM baseall WHERE k1 IN (1,2,3) ORDER BY FIELD(k1, 2, 1, 3);
```

```text
+------+------------+
| k1   | k7         |
+------+------------+
|    2 | wangyu14   |
|    1 | wangjing04 |
|    3 | yuanyuan06 |
+------+------------+
```

文字列を独自の順序で並べます。`FIELD` はリストにない値に対して `0` を返し、これには `NULL` も含まれます。このため、デフォルトの昇順では `NULL` の行が先頭に並びます。

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry');
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```

降順では `NULL`（FIELD = 0）が最後に並びます。

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') DESC;
```

```text
+------------+
| class_name |
+------------+
| Henry      |
| Henry      |
| Ben        |
| Ben        |
| Suzi       |
| Suzi       |
| NULL       |
+------------+
```

`NULLS FIRST` / `NULLS LAST` を使用すると、並び順とは独立に `NULL` の位置を制御できます。

```sql
SELECT class_name FROM class_test ORDER BY FIELD(class_name, 'Suzi', 'Ben', 'Henry') NULLS FIRST;
```

```text
+------------+
| class_name |
+------------+
| NULL       |
| Suzi       |
| Suzi       |
| Ben        |
| Ben        |
| Henry      |
| Henry      |
+------------+
```