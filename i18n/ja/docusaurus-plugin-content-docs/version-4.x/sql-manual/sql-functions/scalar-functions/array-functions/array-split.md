---
{
  "title": "ARRAY_SPLIT",
  "description": "与えられたブール値フラグに従って、入力配列を複数のサブ配列に分割します。",
  "language": "ja"
}
---
## ファンクション

与えられたブール値フラグに従って、入力配列を複数のサブ配列に分割します。

- 分割ルール（左から右へ）：`arr=[a1,a2,...,an]`と`flags=[f1,f2,...,fn]`に対して、`fi==true`となるすべての位置で、`ai`と`a(i-1)`の間で分割します。
  - 例えば、`arr=[3, 4, 5]`と`flags=[false, true, false]`の場合、2番目のフラグがtrueなので、1番目と2番目の要素の間で分割し、結果として2つのサブ配列`[3]`と`[4,5]`になります。

## Syntax

- `ARRAY_SPLIT(arr, flags)`
- `ARRAY_SPLIT(lambda, arr0, ...)`
- `ARRAY_SPLIT(lambda, arr0, ...)`は`ARRAY_SPLIT(arr0, ARRAY_MAP(lambda, arr0, ...))`と同等です

## パラメータ

- `arr`: `ARRAY<T>`。
- `flags`: `ARRAY<BOOLEAN>`、その長さは`arr`と行ごとに一致する必要があります。`true`は現在の位置と次の要素の間で分割することを意味します。
- `arr0, ...`: 1つ以上の`ARRAY<T>`。
- `lambda`: `arr0, ...`に適用されて`flags`を生成する`lambda`式で、その後分割に使用されます。

## Return value

- `ARRAY<ARRAY<T>>`を返します。内部配列の要素は`arr`の要素と同じです。
- `arr`と`flags`の要素数が一致しない場合、エラーがスローされます。

## Usage notes

- `flags`の位置が`NULL`の場合、分割なしとして扱われます（`false`と同等）。
- `ARRAY_SPLIT`の分割ルール：`fi==true`となる各位置で、`ai`と`a(i-1)`の間で分割します。
- `ARRAY_REVERSE_SPLIT`の分割ルール：`fi==true`となる各位置で、`ai`と`a(i+1)`の間で分割します。

## Examples

- 基本的な分割：各`true`の位置で、左側の隣接要素から分割します。
  - `ARRAY_SPLIT([1,2,3,4,5], [false,true,false,true,false])` -> `[[1], [2, 3], [4, 5]]`
  - `ARRAY_SPLIT(['a','b','c'], [false,false,false])` -> `[['a','b','c']]`

- `flags`に`NULL`がある場合：`NULL`は`false`と同じように扱われます（分割なし）。
  - `ARRAY_SPLIT([1,NULL,3], [false,null,false])` -> `[[1,NULL,3]]`

- `lambda= x -> x-1`を`arr0=[1, 2, 3]`に適用すると`flags=[0,1,2]`が生成され、これは`flags=[false,true,true]`と同等です
  - `ARRAY_SPLIT(x->x-1, [1, 2, 3])`は`ARRAY_SPLIT([1, 2, 3], [false,true,true])`と同等 -> `[[1], [2], [3]]`

- `lambda= (x,y) -> x-y`を`arr0=[1, 2, 3]`と`arr1=[0,1,2]`に適用すると`flags=[true,true,true]`が生成されます
  - `ARRAY_SPLIT((x,y) -> x-y, [1, 2, 3], [0, 1, 2])`は`ARRAY_SPLIT([1, 2, 3], [true,true,true])`と同等 -> `[[1], [2], [3]]`
