---
{
  "title": "ARRAY_REMOVE",
  "description": "配列から指定された値と等しい要素をすべて削除し、残りの要素の相対的な順序を保持します。",
  "language": "ja"
}
---
## ファンクション

指定された値と等しい全ての要素を配列から削除し、残りの要素の相対的な順序を保持します。

## Syntax

- `ARRAY_REMOVE(arr, target)`

## パラメータ

- `arr`: `ARRAY<T>`、数値、boolean、文字列、datetime、IPなどをサポート
- `target`: 配列要素と同じ型の値、削除対象の要素とのマッチに使用

## Return value

- 入力と同じ型の`ARRAY<T>`を返します。
- `arr`が`NULL`の場合、`NULL`を返します。

## Usage notes

- マッチングルール: 値が`target`と等しい要素のみが削除されます。`NULL`は`NULL`と等しいです。

## Examples

- 基本: 削除後、残りの要素は元の相対的な順序を保ちます。
  - `ARRAY_REMOVE([1,2,3], 1)` -> `[2,3]`
  - `ARRAY_REMOVE([1,2,3,null], 1)` -> `[2,3,null]`

- `target`が`NULL`の場合、`arr`内の`NULL`を削除します。
  - `ARRAY_REMOVE(['a','b','c',NULL], NULL)` -> `NULL`

- `arr`が`NULL`の場合、`NULL`を返します
  - `ARRAY_REMOVE(NULL, 2)` -> `NULL`

- マッチなし
  - `ARRAY_REMOVE([1,2,3], 258)` -> `[1,2,3]`
