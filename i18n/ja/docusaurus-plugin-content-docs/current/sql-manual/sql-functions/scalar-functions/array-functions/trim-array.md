---
{
    "title": "TRIM_ARRAY 関数",
    "language": "ja",
    "description": "TRIM_ARRAY は残りの要素の順序と型を保ちながら、配列の末尾から指定した数の要素を削除します。"
}
---

## trim_array

<version since="dev">

</version>

## 説明

`<size>` 個の要素を `<arr>` の末尾から削除し、残りの要素の順序を保ちます。

## 構文

```sql
TRIM_ARRAY(<arr>, <size>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<arr>` | 入力 `ARRAY<T>`。`T` は数値、真偽値、文字列、日付時刻、IP、複合型にできます。 |
| `<size>` | 末尾から削除する要素数を指定する非負の `BIGINT`。`<arr>` の要素数を超えることはできません。 |

## 戻り値

`ARRAY<T>` を返します。これは `cardinality(<arr>) - <size>` 個の `<arr>` の先頭要素を含みます。

- `<size>` が `0` の場合は入力配列をそのまま返します。
- `<size>` が配列の要素数と等しい場合は空の配列を返します。
- どちらかの引数が `NULL` の場合は `NULL` を返します。
- 配列内の `NULL` 要素は保持されます。
- `<size>` が負、または配列の要素数を超える場合はエラーを返します。

## 使用例

末尾から二つの要素を削除する場合:

```sql
SELECT trim_array([1, 2, 3, 4], 2);
```

```text
[1, 2]
```

サイズがゼロの場合、配列は変わりません:

```sql
SELECT trim_array(['a', 'b', 'c'], 0);
```

```text
["a", "b", "c"]
```

すべての要素を削除する場合:

```sql
SELECT trim_array([1, 2, 3], 3);
```

```text
[]
```

`NULL` 要素とネストした配列もサポートします:

```sql
SELECT trim_array([[1, NULL], [2, 3], [4, 5]], 1);
```

```text
[[1, null], [2, 3]]
```

`NULL` 引数の場合は `NULL` を返します:

```sql
SELECT trim_array(CAST(NULL AS ARRAY<INT>), 0);
```

```text
NULL
```

配列の要素数を超えるサイズを指定するとエラーになります:

```sql
SELECT trim_array([1, 2, 3], 4);
```

```text
ERROR 1105 (HY000): size must not exceed array cardinality 3: 4
```

### キーワード

ARRAY, TRIM, TRIM_ARRAY
