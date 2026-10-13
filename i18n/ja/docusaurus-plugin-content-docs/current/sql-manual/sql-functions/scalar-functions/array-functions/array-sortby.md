---
{
    "title": "ARRAY_SORTBY",
    "language": "ja",
    "description": "keys 配列の順序に従って values 配列をソートします。"
}
---

## 機能

`values` 配列を `keys` 配列の順序に従ってソートします。
- たとえば、`keys` が `[3, 0, 2]`、`values` が `[5, 7, 8]` の場合、ソート後の `keys` は `[0, 2, 3]` となり、対応する `values` は `[7, 8, 5]` になります。

## 構文

- `ARRAY_SORTBY(values, keys)`
- `ARRAY_SORTBY(lambda, values)`
- `ARRAY_SORTBY(lambda, values)` は `ARRAY_SORTBY(values, ARRAY_MAP(lambda, values))` と同等です

## パラメータ

- `values`: `ARRAY<T>` 型のソート対象の値の配列。`T` は数値、真偽値、文字列、日時、IP、UUID などをサポートします。多次元配列もサポートしますが、ネストの深さにかかわらずすべての要素がサポート対象の型である必要があります。
- `keys`: `ARRAY<T>` 型で、`values` と同じ長さのキー配列。`T` は数値、真偽値、文字列、日時、IP、UUID などをサポートします。多次元配列もサポートしますが、ネストの深さにかかわらずすべての要素がサポート対象の型である必要があります。
- `lambda`: `lambda` 式を `values` に適用してソート用の `keys` 配列を生成します。

## 戻り値

- `ARRAY<T>` を返します。型は `values` と同じです。
- いずれかの行で `values` と `keys` の要素数が異なる場合はエラーになります。

## 使用上の注意

- 安定性: `values` は `keys` の昇順に並べ替えられます。同じキーを持つ要素間の相対的な順序は定義されていません。
- 高階形式では、`keys` を `ARRAY_MAP` で先に計算し、次に `values` を `keys` に従ってソートします。

## 使用例

- 基本例: `values` を `keys` の昇順にソートします。
  - `ARRAY_SORTBY([10,20,30], [3,1,2])` -> `[20,30,10]`
  - `ARRAY_SORTBY(['a','b','c'], [2,2,1])` -> `['c','a','b']`

- 高階形式: `keys` を `lambda` で計算してからソートします。
  - `ARRAY_SORTBY(x -> x + 1, [3,1,2])` -> `[1,2,3]` (`keys` は `[4,2,3]`)
  - `ARRAY_SORTBY(x -> x*2 <= 2, [1,2,3])` -> `[2,3,1]` (`keys` は `[true,false,false]`)

- `keys` または `values` が `NULL` の場合、`values` を変更せずに返します。
  - `array_sortby([10,20,30], NULL)` -> `[10, 20, 30]`
  - `array_sortby(NULL, [2,3])` -> `NULL`

- 多次元配列のソート: キーのソート規則は内側の要素の型に従います。
  - `ARRAY_SORTBY(x -> x[1], [[1,2],[0,1]])` -> `[[0, 1], [1, 2]]`



