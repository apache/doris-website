---
{
    "title": "ARRAY_EXCEPT_ALL",
    "language": "ja",
    "description": "二つの配列の多重集合としての差を返します。取り除かれなかった重複要素と最初の配列の要素順序を保持します。"
}
---

## array_except_all

<version since="dev">

</version>

## 説明

`arr1` と `arr2` の多重集合としての差を返します。`arr2` の各要素は、`arr1` にある等しい要素を最大一つ取り除きます。残った要素は、重複を含めて元の順序を保持します。`NULL` 要素も比較され、出現回数に応じて取り除かれます。入力配列が `NULL` の場合は `NULL` を返します。

## 構文

```sql
ARRAY_EXCEPT_ALL(<arr1>, <arr2>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<arr1>` | 最初の配列。要素型はサポートされるスカラー型で、`<arr2>` の要素型と互換性がある必要があります。 |
| `<arr2>` | 二番目の配列。各要素は、`<arr1>` にある一致する要素を一つ取り除きます。要素型はサポートされるスカラー型で、`<arr1>` の要素型と互換性がある必要があります。 |

サポートされるスカラー要素型には、数値型、ブール型、文字列型、日付・時刻型、IPv4/IPv6 型、UUID 型があります。`ARRAY`、`MAP`、`STRUCT`、`JSON`、`VARIANT` などの複合要素型はサポートされません。

## 戻り値

`ARRAY<T>` を返します。この配列には、`<arr1>` に残った要素が元の順序で含まれます。いずれかの入力配列が `NULL` の場合は `NULL` を返します。要素が残らない場合は空の配列を返します。

## 使用例

多重集合としての差の基本例:

```sql
SELECT array_except_all([1, 1, 2, 3], [1, 3]);
```

```text
[1, 2]
```

要素は一つずつ取り除かれるため、取り除かれなかった重複要素は残ります:

```sql
SELECT array_except_all(['a', 'a', 'b'], ['a']);
```

```text
["a", "b"]
```

結果は最初の配列の要素順序を保持します:

```sql
SELECT array_except_all([3, 1, 3, 2], [3]);
```

```text
[1, 3, 2]
```

`NULL` 要素も多重集合としての差の計算に含まれます:

```sql
SELECT array_except_all(['a', NULL, 'a', NULL], [NULL]);
```

```text
["a", "a", null]
```

いずれかの入力配列が `NULL` の場合、結果は `NULL` です:

```sql
SELECT array_except_all(CAST(NULL AS ARRAY<INT>), [1]);
```

```text
NULL
```

二番目の配列が空の場合、最初の配列はそのまま返されます:

```sql
SELECT array_except_all([1, 1, 2], CAST([] AS ARRAY<INT>));
```

```text
[1, 1, 2]
```

`array_except` とは異なり、この関数は残った重複要素を保持します:

```sql
SELECT array_except([1, 1, 2], [1]), array_except_all([1, 1, 2], [1]);
```

```text
[2]    [1, 2]
```

複合要素型はサポートされません:

```sql
SELECT array_except_all([[1], [2]], [[1]]);
```

```text
ERROR 1105 (HY000): array_except_all does not support types
```

### キーワード

ARRAY, EXCEPT, MULTISET, ARRAY_EXCEPT_ALL
