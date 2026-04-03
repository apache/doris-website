---
{
  "title": "ARRAY_REVERSE_SORT",
  "language": "ja",
  "description": "配列要素を降順でソートする。"
}
---
## Function

配列要素を降順でソートします。

## Syntax

- `ARRAY_REVERSE_SORT(arr)`

## Parameters

- `arr`: `ARRAY<T>`、`T`は数値、boolean、文字列、datetime、IPなどが可能です。多次元配列もサポートされていますが、すべての配列要素（どれだけ深くネストされていても）はサポートされている型である必要があります。

## Return value

- 入力と同じ型の`ARRAY<T>`を返します。
- `NULL`要素は返される配列の末尾に配置されます。

## Usage notes

- 入力が`NULL`の場合、`NULL`を返します。入力が空の配列`[]`の場合、空の配列を返します。
- `ARRAY_REVERSE_SORT`は降順でソートし、`ARRAY_SORT`は昇順でソートします。

## Examples

- 基本: `NULL`要素は返される配列の末尾に配置されます
  - `ARRAY_REVERSE_SORT([1,2,3,null])` -> `[3,2,1,null]`

- 入力が`NULL`の場合、`NULL`を返します。入力が空の配列`[]`の場合、空の配列を返します。
  - `ARRAY_REVERSE_SORT(NULL)` -> `NULL`
  - `ARRAY_REVERSE_SORT([])` -> `[]`

- 多次元配列のソート
  - `ARRAY_REVERSE_SORT([[3, 4], [5, 6]])` -> `[[5, 6], [3, 4]]`
