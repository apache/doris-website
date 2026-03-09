---
{
  "title": "ARRAY_SHUFFLE",
  "language": "ja",
  "description": "配列内の要素の順序をランダムにシャッフルする。"
}
---
## Function

配列内の要素の順序をランダムにシャッフルします。

## Syntax

- `ARRAY_SHUFFLE(arr)`
- `ARRAY_SHUFFLE(arr, seed)`

## Parameters

- `arr`: `ARRAY<T>`
- `seed`: オプション、ランダムシード

## Return value

- 入力と同じ型の配列を返し、要素がランダムに並び替えられます。要素数と型は変更されません。

## Usage notes

- 入力 `arr` が `NULL` の場合、`NULL` を返します。
- `seed` を指定すると再現可能な結果が得られ、省略すると実行毎に異なる結果になる場合があります。
- `ARRAY_SHUFFLE` にはエイリアス `SHUFFLE` があり、これらは等価です。
- 

## Examples

- 基本的な使用法:
  - `ARRAY_SHUFFLE([1, 2, 3, 4])` -> 例: `[3, 1, 4, 2]` (ランダムな順序)
  - `ARRAY_SHUFFLE(['a', null, 'b'])` -> 例: `['b', 'a', null]`

- 固定シードを使用 (再現可能な結果):
  - `ARRAY_SHUFFLE([1, 2, 3, 4], 0)` -> 毎回同じ順序 (例: `[1, 3, 2, 4]`)
