---
{
    "title": "ARRAY_REVERSE_SORT",
    "language": "ja",
    "description": "配列の要素を降順にソートします。"
}
---

## 機能

配列の要素を降順にソートします。

## 構文

- `ARRAY_REVERSE_SORT(arr)`

## パラメータ

- `arr`: `ARRAY<T>`。`T` は数値、真偽値、文字列、日時、IP、UUID などの型です。多次元配列もサポートしますが、ネストの深さにかかわらず、すべての配列要素がサポート対象の型である必要があります。

## 戻り値

- 入力と同じ型の `ARRAY<T>` を返します。
- 返される配列では、`NULL` 要素が末尾に配置されます。

## 使用上の注意

- 入力が `NULL` の場合は `NULL` を返し、空配列 `[]` の場合は空配列を返します。
- `ARRAY_REVERSE_SORT` は降順に、`ARRAY_SORT` は昇順にソートします。

## 使用例

- 基本例: `NULL` 要素は返される配列の末尾に配置されます
  - `ARRAY_REVERSE_SORT([1,2,3,null])` -> `[3,2,1,null]`

- 入力が `NULL` の場合は `NULL` を返し、空配列 `[]` の場合は空配列を返します。
  - `ARRAY_REVERSE_SORT(NULL)` -> `NULL`
  - `ARRAY_REVERSE_SORT([])` -> `[]`

- 多次元配列のソート
  - `ARRAY_REVERSE_SORT([[3, 4], [5, 6]])` -> `[[5, 6], [3, 4]]`
