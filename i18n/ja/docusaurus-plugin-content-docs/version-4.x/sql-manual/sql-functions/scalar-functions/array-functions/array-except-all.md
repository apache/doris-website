---
{
    "title": "ARRAY_EXCEPT_ALL",
    "language": "ja",
    "description": "二つの配列の多重集合の差を返し、残った重複要素と第一配列の要素順序を保持します。"
}
---

## array_except_all

<version since="4.1.0">

</version>

## 説明 {#description}

`arr1` と `arr2` の多重集合の差を返します。`arr2` の各要素は、`arr1` 内の等しい要素を最大一つ取り除きます。残った要素は、重複要素も含めて元の順序を保ちます。`NULL` 要素も出現回数に応じて比較・除去されます。入力配列のいずれかが `NULL` の場合、結果は `NULL` です。

## 構文 {#syntax}

```sql
ARRAY_EXCEPT_ALL(<arr1>, <arr2>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| -- | -- |
| `<arr1>` | 第一配列。要素型はサポート対象のスカラー型で、`<arr2>` の要素型と互換性が必要です。 |
| `<arr2>` | 第二配列。各要素は、`<arr1>` 内で一致する要素を一つ取り除きます。要素型はサポート対象のスカラー型で、`<arr1>` の要素型と互換性が必要です。 |

サポート対象のスカラー要素型には、数値型、真偽値型、文字列型、日付/時刻型、IPv4/IPv6 型が含まれます。`ARRAY`、`MAP`、`STRUCT`、`JSON`、`VARIANT` などの複合要素型はサポートされません。

## 戻り値 {#return-value}

`ARRAY<T>` を返します。これには `<arr1>` に残った要素が元の順序で格納されます。入力配列のいずれかが `NULL` の場合は `NULL` を返します。要素が残らない場合は空の配列を返します。

## 例 {#example}

多重集合の差の基本例：

```sql
SELECT array_except_all([1, 1, 2, 3], [1, 3]);
```

```text
[1, 2]
```

要素は一つずつ取り除かれるため、一致せずに残った重複要素は保持されます：

```sql
SELECT array_except_all(['a', 'a', 'b'], ['a']);
```

```text
["a", "b"]
```

結果では第一配列の要素順序が保持されます：

```sql
SELECT array_except_all([3, 1, 3, 2], [3]);
```

```text
[1, 3, 2]
```

`NULL` 要素も多重集合の差の計算対象です：

```sql
SELECT array_except_all(['a', NULL, 'a', NULL], [NULL]);
```

```text
["a", "a", null]
```

入力配列のいずれかが `NULL` の場合、結果は `NULL` です：

```sql
SELECT array_except_all(CAST(NULL AS ARRAY<INT>), [1]);
```

```text
NULL
```

第二配列が空の場合、第一配列はそのまま返されます：

```sql
SELECT array_except_all([1, 1, 2], CAST([] AS ARRAY<INT>));
```

```text
[1, 1, 2]
```

`array_except` とは異なり、この関数は残った重複要素を保持します：

```sql
SELECT array_except([1, 1, 2], [1]), array_except_all([1, 1, 2], [1]);
```

```text
[2]    [1, 2]
```

複合要素型はサポートされません：

```sql
SELECT array_except_all([[1], [2]], [[1]]);
```

```text
ERROR 1105 (HY000): array_except_all does not support types
```

### キーワード {#keywords}

ARRAY, EXCEPT, MULTISET, ARRAY_EXCEPT_ALL
