---
{
    "title": "MAP_FROM_ENTRIES",
    "language": "ja",
    "description": "二つのフィールドを持つ STRUCT 要素の配列から MAP を作成します"
}
---

## 説明

`MAP<K, V>` を、二つのフィールドを持つ `STRUCT` を要素とする配列から作成します。最初のフィールドをキー、次のフィールドを値として使用します。

:::note
この関数は Apache Doris 4.2 以降でサポートされます。
:::

## 構文

```sql
MAP_FROM_ENTRIES(<entries>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<entries>` | `ARRAY<STRUCT<K, V>>`。各 STRUCT には二つのフィールドが必要です。配列は `NULL` にでき、STRUCT 内の二つのフィールドも `NULL` にできますが、配列の STRUCT 要素自体は `NULL` にできません。`K` には MAP のキーでサポートされる型を指定します。 |

## 戻り値

`MAP<K, V>` を返します。

- `<entries>` が `NULL` の場合は `NULL` を返します。
- `NULL` でない STRUCT 内の `NULL` フィールドは、`NULL` キーまたは値として保持されます。
- 配列の STRUCT 要素自体が `NULL` の場合は、実行時エラーになります。
- 入力が STRUCT の配列でない場合、または STRUCT のフィールド数が二つでない場合は、解析エラーになります。
- `K` が MAP のキーでサポートされない型の場合は、解析エラーになります。
- 同じキーが複数回現れる場合は、最後に現れた値が保持されます。

## 例

```sql
SELECT map_from_entries(array(struct(1, 10), struct(2, 20))) AS result;
```

```text
+--------------+
| result       |
+--------------+
| {1:10, 2:20} |
+--------------+
```

```sql
SELECT map_from_entries(array(struct(1, 10), struct(1, 20))) AS result;
```

```text
+--------+
| result |
+--------+
| {1:20} |
+--------+
```

```sql
SELECT map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>));
```

```text
+------------------------------------------------------------+
| map_from_entries(CAST(NULL AS ARRAY<STRUCT<k:INT,v:INT>>)) |
+------------------------------------------------------------+
| NULL                                                       |
+------------------------------------------------------------+
```

```sql
SELECT map_from_entries(array(
    struct(CAST(NULL AS INT), 10),
    struct(2, CAST(NULL AS INT)))) AS result;
```

```text
+-------------------+
| result            |
+-------------------+
| {null:10, 2:null} |
+-------------------+
```

次の例は、配列に `NULL` の STRUCT 要素が含まれるため失敗します。

```sql
SELECT map_from_entries(array(CAST(NULL AS STRUCT<k:INT,v:INT>)));
```

```text
ERROR 1105 (HY000): Map entry of function map_from_entries cannot be null
```

次の例は、STRUCT に三つのフィールドがあるため、解析時に失敗します。

```sql
SELECT map_from_entries(array(struct(1, 2, 3)));
```

```text
ERROR 1105 (HY000): map_from_entries requires an array of structs with exactly two fields
```
