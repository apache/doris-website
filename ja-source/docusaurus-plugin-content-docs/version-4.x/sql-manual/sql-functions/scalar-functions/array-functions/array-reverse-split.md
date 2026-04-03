---
{
  "title": "ARRAY_REVERSE_SPLIT",
  "description": "与えられたブール値フラグに従って、入力配列を複数のサブ配列に分割します。",
  "language": "ja"
}
---
## ファンクション

与えられたboolean flagsに従って、入力配列を複数のサブ配列に分割します。

- 分割ルール（左から右へ）: `arr=[a1,a2,...,an]` と `flags=[f1,f2,...,fn]` に対して、`fi==true` となる各位置で `ai` と `a(i+1)` の間を分割します。
  - 例えば、`arr=[3, 4, 5]` と `flags=[false, true, false]` の場合、2番目のflagがtrueなので、2番目と3番目の要素の間で分割し、結果として2つのサブ配列 `[3, 4]` と `[5]` になります。

## Syntax

- `ARRAY_REVERSE_SPLIT(arr, flags)`
- `ARRAY_REVERSE_SPLIT(lamda, arr0, ...)`
- `ARRAY_REVERSE_SPLIT(lambda, arr0, ...)` は `ARRAY_REVERSE_SPLIT(arr0, ARRAY_MAP(lambda, arr0, ...))` と等価です

## パラメータ

- `arr`: `ARRAY<T>`。
- `flags`: `ARRAY<BOOLEAN>`。長さは `arr` と行ごとに一致する必要があります。`true` は現在位置と次の要素の間で分割することを意味します。
- `arr0, ...`: 1つ以上の `ARRAY<T>`。
- `lambda`: `arr0, ...` に適用されて `flags` を生成する `lambda` 式。生成されたflagsが分割に使用されます。

## Return value

- `ARRAY<ARRAY<T>>` を返します。内部配列の要素は `arr` の要素と同じです。
- `arr` と `flags` の要素数が一致しない場合、エラーが発生します。

## Usage notes

- `flags` 内の位置が `NULL` の場合、分割しない（`false` と等価）として扱われます。
- `ARRAY_REVERSE_SPLIT` の分割ルール: `fi==true` となる各位置で、`ai` と `a(i+1)` の間を分割します。
- `ARRAY_SPLIT` の分割ルール: `fi==true` となる各位置で、`ai` と `a(i-1)` の間を分割します。

## Examples

- 基本的な分割: 各 `true` 位置で、右隣から分割します。
  - `ARRAY_REVERSE_SPLIT([1,2,3,4,5], [false,true,false,true,false])` -> `[[1,2], [3,4], [5]]`
  - `ARRAY_REVERSE_SPLIT(['a','b','c'], [false,false,false])` -> `[['a','b','c']]`

- `flags` に `NULL` がある場合: `NULL` は `false` と同様に扱われます（分割しない）。
  - `ARRAY_REVERSE_SPLIT([1,NULL,3], [false,null,false])` -> `[[1,[NULL,3]]`

- `lambda= x -> x-1` を `arr=[1, 2, 3]` に適用すると `flags=[0,1,2]` が生成され、`flags=[false,true,true]` と等価です
  - `ARRAY_REVERSE_SPLIT(x->x-1, [1, 2, 3])` は `ARRAY_REVERSE_SPLIT([1, 2, 3], [false,true,true])` と等価 -> `[[1, 2], [3]]`

- `lambda= (x,y) -> x-y` を `arr=[1, 2, 3]` と `arr1=[0,1,2]` に適用すると `flags=[true,true,true]` が生成されます
  - `ARRAY_REVERSE_SPLIT((x,y) -> x-y, [1, 2, 3], [0, 1, 2])` は `ARRAY_REVERSE_SPLIT([1, 2, 3], [true,true,true])` と等価 -> `[[1], [2], [3]]`
