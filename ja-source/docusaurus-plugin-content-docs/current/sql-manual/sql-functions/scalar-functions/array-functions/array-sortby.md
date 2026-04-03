---
{
  "title": "ARRAY_SORTBY",
  "language": "ja",
  "description": "keys配列の順序に従ってvalues配列をソートする。"
}
---
## 機能

`keys`配列の順序に従って`values`配列をソートします。
- 例えば、`keys`が`[3, 0, 2]`で`values`が`[5, 7, 8]`の場合、ソート後に`keys`は`[0, 2, 3]`になり、対応する`values`は`[7, 8, 5]`になります。

## 構文

- `ARRAY_SORTBY(values, keys)`
- `ARRAY_SORTBY(lambda, values)`
- `ARRAY_SORTBY(lambda, values)`は`ARRAY_SORTBY(values, ARRAY_MAP(lambda, values))`と等価です

## パラメータ

- `values`: `ARRAY<T>`、ソートする値配列。`T`は数値、boolean、文字列、datetime、IPなどをサポートします。多次元配列もサポートされますが、すべての配列要素（どれだけ深くネストされていても）はサポートされる型である必要があります。
- `keys`: `ARRAY<T>`、`values`と同じ長さのキー配列。`T`は数値、boolean、文字列、datetime、IPなどをサポートします。多次元配列もサポートされますが、すべての配列要素（どれだけ深くネストされていても）はサポートされる型である必要があります。
- `lambda`: ソートに使用される`keys`配列を生成するために`values`に適用される`lambda`式。

## 戻り値

- `values`と同じ型の`ARRAY<T>`を返します。
- 任意の行で`values`と`keys`の要素数が異なる場合はエラーがスローされます。

## 使用上の注意

- 安定性: `values`は`keys`の昇順で並び替えられます。等しいキー間の相対順序は未定義です。
- 高階呼び出しでは、`keys`は最初に`ARRAY_MAP`によって計算され、その後`values`が`keys`によってソートされます。

## 例

- 基本: `keys`の昇順で`values`をソートします。
  - `ARRAY_SORTBY([10,20,30], [3,1,2])` -> `[20,30,10]`
  - `ARRAY_SORTBY(['a','b','c'], [2,2,1])` -> `['c','a','b']`

- 高階: `lambda`によって`keys`を計算してからソートします。
  - `ARRAY_SORTBY(x -> x + 1, [3,1,2])` -> `[1,2,3]`（`keys`は`[4,2,3]`）
  - `ARRAY_SORTBY(x -> x*2 <= 2, [1,2,3])` -> `[1,2,3]`（`keys`は`[true,false,false]`）

- `keys`または`values`が`NULL`の場合、`values`をそのまま返します。
  - `array_sortby([10,20,30], NULL)` -> `[10, 20, 30]`
  - `array_sortby(NULL, [2,3])` -> `NULL`

- 多次元配列のソート: キーのソートルールは内部要素の型に従います。
  - `ARRAY_SORTBY(x -> x[1], [[1,2],[0,1]])` -> `[[0, 1], [1, 2]]`
