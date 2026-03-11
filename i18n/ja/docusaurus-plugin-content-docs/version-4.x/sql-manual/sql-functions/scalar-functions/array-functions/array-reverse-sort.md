---
{
  "title": "ARRAY_REVERSE_SORT",
  "description": "配列要素を降順でソートします。",
  "language": "ja"
}
---
## ファンクション

配列要素を降順でソートします。

## Syntax

- `ARRAY_REVERSE_SORT(arr)`

## パラメータ

- `arr`: `ARRAY<T>`、ここで`T`は数値、boolean、文字列、datetime、IPなどが可能です。

## Return value

- 入力と同じ型の`ARRAY<T>`を返します。
- `NULL`要素は返される配列の末尾に配置されます。

## Usage notes

- 入力が`NULL`の場合は`NULL`を返し、入力が空配列`[]`の場合は空配列を返します。
- `ARRAY_REVERSE_SORT`は降順でソートし、`ARRAY_SORT`は昇順でソートします。

## Examples

- 基本: `NULL`要素は返される配列の末尾に配置されます
  - `ARRAY_REVERSE_SORT([1,2,3,null])` -> `[3,2,1,null]`

- 入力が`NULL`の場合は`NULL`を返し、入力が空配列`[]`の場合は空配列を返します。
  - `ARRAY_REVERSE_SORT(NULL)` -> `NULL`
  - `ARRAY_REVERSE_SORT([])` -> `[]`
