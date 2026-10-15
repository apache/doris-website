---
{
    "title": "ARRAY_SORTBY",
    "language": "ja",
    "description": "キー配列の順序に従って値配列を並べ替えます。"
}
---

## 機能

`values` 配列を `keys` 配列の順序に従って並べ替えます。
- 例えば、`keys` が `[3, 0, 2]`、`values` が `[5, 7, 8]` の場合、並べ替え後の `keys` は `[0, 2, 3]` になり、対応する `values` は `[7, 8, 5]` になります。

## 構文

- `ARRAY_SORTBY(values, keys)`
- `ARRAY_SORTBY(lambda, values)`
- `ARRAY_SORTBY(lambda, values)` は `ARRAY_SORTBY(values, ARRAY_MAP(lambda, values))` と同等です。

## パラメータ

- `values`: `ARRAY<T>`。並べ替える値の配列です。`T` は数値型、真偽値型、文字列型、日時型、IP 型などをサポートします。多次元配列もサポートしますが、配列内のすべての要素は、ネストの深さにかかわらず、サポート対象の型である必要があります。
- `keys`: `ARRAY<T>`。`values` と同じ長さのキー配列です。`T` は数値型、真偽値型、文字列型、日時型、IP 型などをサポートします。多次元配列もサポートしますが、配列内のすべての要素は、ネストの深さにかかわらず、サポート対象の型である必要があります。
- `lambda`: `lambda` 式です。`values` に適用し、並べ替えに使用する `keys` 配列を生成します。

## 戻り値

- `ARRAY<T>` を返します。型は `values` と同じです。
- いずれかの行で `values` と `keys` の要素数が異なる場合は、エラーが発生します。

## 使用上の注意

- 安定性: `values` は `keys` の昇順に従って並べ替えられます。同じキーを持つ値の相対的な順序は定義されていません。
- 高階関数形式では、`keys` をまず `ARRAY_MAP` で計算してから、`values` を `keys` に従って並べ替えます。

## 使用例

- 基本例: `values` を `keys` の昇順に従って並べ替えます。
  - `ARRAY_SORTBY([10,20,30], [3,1,2])` -> `[20,30,10]`
  - `ARRAY_SORTBY(['a','b','c'], [2,2,1])` -> `['c','a','b']`

- 高階関数形式: `keys` を `lambda` で計算してから並べ替えます。
  - `ARRAY_SORTBY(x -> x + 1, [3,1,2])` -> `[1,2,3]`（`keys` は `[4,2,3]`）
  - `ARRAY_SORTBY(x -> x*2 <= 2, [1,2,3])` -> `[2,3,1]`（`keys` は `[true,false,false]`）

- `keys` または `values` が `NULL` の場合、`values` をそのまま返します。
  - `array_sortby([10,20,30], NULL)` -> `[10, 20, 30]`
  - `array_sortby(NULL, [2,3])` -> `NULL`

- 多次元配列の並べ替え: キーの並べ替え規則は、内側の要素の型に従います。
  - `ARRAY_SORTBY(x -> x[1], [[1,2],[0,1]])` -> `[[0, 1], [1, 2]]`
