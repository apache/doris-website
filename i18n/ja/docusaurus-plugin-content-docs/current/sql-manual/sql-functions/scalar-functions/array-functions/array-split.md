---
{
    "title": "ARRAY_SPLIT",
    "language": "ja",
    "description": "指定した真偽値フラグに従って、入力配列を複数の部分配列に分割します。"
}
---

## 機能

指定した真偽値フラグに従って、入力配列を複数の部分配列に分割します。

- 分割規則 (左から右): `arr=[a1,a2,...,an]` と `flags=[f1,f2,...,fn]` について、`fi==true` の各位置で `ai` と `a(i-1)` の間を分割します。
  - たとえば `arr=[3, 4, 5]` と `flags=[false, true, false]` では、二番目のフラグが true なので、最初と二番目の要素の間で分割し、部分配列 `[3]` と `[4,5]` を得ます。

## 構文

- `ARRAY_SPLIT(arr, flags)`
- `ARRAY_SPLIT(lambda, arr0, ...)`
- `ARRAY_SPLIT(lambda, arr0, ...)` は `ARRAY_SPLIT(arr0, ARRAY_MAP(lambda, arr0, ...))` と同等です

## パラメータ

- `arr`: `ARRAY<T>`.
- `flags`: `ARRAY<BOOLEAN>`。各行で長さが `arr` と一致する必要があります。`true` は現在位置と次の要素の間で分割することを示します。
- `arr0, ...`: 一つ以上の `ARRAY<T>`。
- `lambda`: `lambda` 式を `arr0, ...` に適用して分割用の `flags` を生成します。

## 戻り値

- `ARRAY<ARRAY<T>>` を返します。内側の配列の要素は `arr` の要素と同じです。
- `arr` と `flags` の要素数が一致しない場合はエラーになります。

## 使用上の注意

- `flags` の要素が `NULL` の場合、分割しないものとして扱います (`false` と同等)。
- `ARRAY_SPLIT` の分割規則: `fi==true` の各位置で `ai` と `a(i-1)` の間を分割します。
- `ARRAY_REVERSE_SPLIT` の分割規則: `fi==true` の各位置で `ai` と `a(i+1)` の間を分割します。

## 使用例

- 基本的な分割: `true` の各位置で左隣の要素との間を分割します。
  - `ARRAY_SPLIT([1,2,3,4,5], [false,true,false,true,false])` -> `[[1], [2, 3], [4, 5]]`
  - `ARRAY_SPLIT(['a','b','c'], [false,false,false])` -> `[['a','b','c']]`

- `NULL` が `flags` に含まれる場合: `NULL` は `false` と同様に扱い、分割しません。
  - `ARRAY_SPLIT([1,NULL,3], [false,null,false])` -> `[[1, NULL, 3]]`

- `lambda= x -> x-1` を `arr0=[1, 2, 3]` に適用すると `flags=[0,1,2]` となり、`flags=[false,true,true]` と同等です。
  - `ARRAY_SPLIT(x->x-1, [1, 2, 3])` は `ARRAY_SPLIT([1, 2, 3], [false,true,true])` と同等です -> `[[1], [2], [3]]`

- `lambda= (x,y) -> x-y` を `arr0=[1, 2, 3]` と `arr1=[0,1,2]` に適用すると `flags=[true,true,true]` になります。
  - `ARRAY_SPLIT((x,y) -> x-y, [1, 2, 3], [0, 1, 2])` は `ARRAY_SPLIT([1, 2, 3], [true,true,true])` と同等です -> `[[1], [2], [3]]`

