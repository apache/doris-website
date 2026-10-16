---
{
    "title": "COUNTEQUAL",
    "language": "ja",
    "description": "配列内で指定した対象値と等しい要素の数を数えます。"
}
---

## 機能

配列内で指定した対象値と等しい要素の数を数えます。

## 構文

- `COUNTEQUAL(arr, target)`

## パラメータ

- `arr`: `ARRAY<T>`。数値、真偽値、文字列、日時、IP、UUID の要素型をサポートします。
- `target`: `arr` の要素と同じ型。

## 戻り値

- 等しい要素の数を表す `BIGINT` を返します。

## 使用上の注意

- この関数では `NULL` と `NULL` を等しいとみなし、数に含めます。

## 使用例

- 基本例
  - `COUNTEQUAL([1,2,3,2], 2)` -> `2`
  - `COUNTEQUAL(['a','b','a'], 'a')` -> `2`
  - `COUNTEQUAL([true,false,false], false)` -> `2`

- `NULL` 同士は等しいとみなされ、数に含まれます
  - `COUNTEQUAL([1,NULL,2,NULL], NULL)` -> `2`
  - `COUNTEQUAL([1,NULL,1], 1)` -> `2`
  - `COUNTEQUAL([1, 2], NULL)` -> `0`

- 配列が `NULL` の場合は `NULL` を返します
  - `COUNTEQUAL(NULL, 1)` -> `NULL`



