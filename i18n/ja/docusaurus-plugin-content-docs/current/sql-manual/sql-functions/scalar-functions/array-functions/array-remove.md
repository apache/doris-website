---
{
    "title": "ARRAY_REMOVE",
    "language": "ja",
    "description": "配列から指定した値と等しい要素をすべて削除し、残りの要素の相対的な順序を維持します。"
}
---

## 機能

配列から指定した値と等しい要素をすべて削除し、残りの要素の相対的な順序を維持します。

## 構文

- `ARRAY_REMOVE(arr, target)`

## パラメータ

- `arr`: `ARRAY<T>`。数値、真偽値、文字列、日時、IP、UUID などをサポートします。
- `target`: 配列の要素と同じ型の値。削除する要素との照合に使用します。

## 戻り値

- 入力と同じ型の `ARRAY<T>` を返します。
- `arr` が `NULL` の場合は `NULL` を返します。

## 使用上の注意

- 照合規則: 値が `target` と等しい要素だけを削除します。`NULL` は `NULL` と等しいものとして扱います。

## 使用例

- 基本的な使用例: 削除後も、残りの要素は元の相対的な順序を維持します。
  - `ARRAY_REMOVE([1,2,3], 1)` -> `[2,3]`
  - `ARRAY_REMOVE([1,2,3,null], 1)` -> `[2,3,null]`

- `target` が `NULL` の場合、`NULL` を `arr` から削除します。
  - `ARRAY_REMOVE(['a','b','c',NULL], NULL)` -> `NULL`

- `arr` が `NULL` の場合は `NULL` を返します。
  - `ARRAY_REMOVE(NULL, 2)` -> `NULL`

- 一致する要素がない場合
  - `ARRAY_REMOVE([1,2,3], 258)` -> `[1,2,3]`
