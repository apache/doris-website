---
{
  "title": "COUNTEQUAL",
  "language": "ja",
  "description": "配列内で指定されたターゲット値と等しい要素の数を数える。"
}
---
## 関数

配列内で指定されたターゲット値と等しい要素の数をカウントします。

## 構文

- `COUNTEQUAL(arr, target)`

## パラメータ

- `arr`: `ARRAY<T>`、サポートされる要素の型には数値、boolean、文字列、datetime、IPが含まれます。
- `target`: `arr`の要素と同じ型。

## 戻り値

- `BIGINT`を返し、等しい要素のカウントを表します。

## 使用上の注意

- この関数では`NULL`は`NULL`と等しく、カウントされます。

## 例

- 基本
  - `COUNTEQUAL([1,2,3,2], 2)` -> `2`
  - `COUNTEQUAL(['a','b','a'], 'a')` -> `2`
  - `COUNTEQUAL([true,false,false], false)` -> `2`

- `NULL`は等しいとみなされ、カウントされます
  - `COUNTEQUAL([1,NULL,2,NULL], NULL)` -> `2`
  - `COUNTEQUAL([1,NULL,1], 1)` -> `2`
  - `COUNTEQUAL([1, 2], NULL)` -> `0`

- 配列が`NULL`の場合、`NULL`を返します
  - `COUNTEQUAL(NULL, 1)` -> `NULL`
