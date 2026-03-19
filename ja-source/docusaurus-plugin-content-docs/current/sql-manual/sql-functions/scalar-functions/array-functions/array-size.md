---
{
  "title": "ARRAY_SIZE",
  "language": "ja",
  "description": "配列内の要素数を返します。"
}
---
## 機能

配列内の要素数を返します。

## 構文

- `ARRAY_SIZE(arr)`

## パラメータ

- `arr`: `ARRAY<T>`

## 戻り値

- `arr`に含まれる要素数を返します。

## 使用上の注意

- 入力`arr`が`NULL`の場合、`NULL`を返します。

## 例

- 配列:
  - `ARRAY_SIZE([1, 2, 3])` -> `3`
  - `ARRAY_SIZE(['a', NULL, 'b'])` -> `3`

- 入力`arr`が`NULL`の場合、`NULL`を返します
  - `ARRAY_SIZE(NULL)` -> `NULL`
