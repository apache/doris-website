---
{
    "title": "ARRAY_REVERSE_SORT",
    "language": "ja",
    "description": "配列の要素を降順に並べ替えます。"
}
---

## 機能

配列の要素を降順に並べ替えます。

## 構文

- `ARRAY_REVERSE_SORT(arr)`

## パラメータ

- `arr`: `ARRAY<T>`。`T` には数値、真偽値、文字列、日時、IP アドレスなどの型を指定できます。多次元配列にも対応していますが、配列のすべての要素は、ネストの深さにかかわらず、対応する型である必要があります。

## 戻り値

- 入力と同じ型の `ARRAY<T>` を返します。
- `NULL` 要素は、返される配列の末尾に配置されます。

## 使用上の注意

- 入力が `NULL` の場合は `NULL` を返し、空の配列 `[]` の場合は空の配列を返します。
- `ARRAY_REVERSE_SORT` は降順に並べ替えます。一方、`ARRAY_SORT` は昇順に並べ替えます。

## 例

- 基本的な例: `NULL` 要素は、返される配列の末尾に配置されます。
  - `ARRAY_REVERSE_SORT([1,2,3,null])` -> `[3,2,1,null]`

- 入力が `NULL` の場合は `NULL` を返し、空の配列 `[]` の場合は空の配列を返します。
  - `ARRAY_REVERSE_SORT(NULL)` -> `NULL`
  - `ARRAY_REVERSE_SORT([])` -> `[]`

- 多次元配列の並べ替え
  - `ARRAY_REVERSE_SORT([[3, 4], [5, 6]])` -> `[[5, 6], [3, 4]]`
