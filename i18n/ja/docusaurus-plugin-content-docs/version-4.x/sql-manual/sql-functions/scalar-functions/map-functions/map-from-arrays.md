---
{
    "title": "MAP_FROM_ARRAYS",
    "language": "ja",
    "description": "キー配列と値配列から MAP を作成します"
}
---

## 説明

キー配列と値配列から `MAP<K, V>` を作成します。同じ位置の要素がキーと値のペアになります。

:::note
この関数は Apache Doris 4.2 以降でサポートされます。
:::

## 構文

```sql
MAP_FROM_ARRAYS(<keys>, <values>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<keys>` | `ARRAY<K>`。`K` には MAP のキーでサポートされる型を指定します。配列とその要素には `NULL` を指定できます。 |
| `<values>` | `ARRAY<V>`。配列とその要素には `NULL` を指定できます。両方の配列が `NULL` でない場合、`<keys>` と要素数を一致させる必要があります。 |

## 戻り値

`MAP<K, V>` を返します。

- いずれかの入力配列が `NULL` の場合は `NULL` を返します。
- `NULL` 要素は、結果の `NULL` キーまたは値として保持されます。
- 両方の配列が `NULL` ではなく、要素数が異なる場合はエラーになります。いずれかの配列が `NULL` の場合、もう一方の配列の長さは確認されません。
- 同じキーが複数回現れる場合は、最後に現れた値が保持されます。
- 引数が配列でない場合、または `K` が MAP のキーでサポートされない型の場合は、解析エラーになります。

## 例

```sql
SELECT map_from_arrays([1, 2], [10, 20]) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_arrays([1, 1], [10, 20]) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_arrays(CAST(NULL AS ARRAY<INT>), [10]);
```

```text
+-------------------------------------------------+
| map_from_arrays(CAST(NULL AS ARRAY<INT>), [10]) |
+-------------------------------------------------+
| NULL                                            |
+-------------------------------------------------+
```

```sql
SELECT map_from_arrays(
    array(CAST(NULL AS INT), 2),
    array(10, CAST(NULL AS INT))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

```sql
SELECT map_from_arrays([1, 2], [10]);
```

```text
ERROR 1105 (HY000): The key and value array offsets of function map_from_arrays must be identical
```
