---
{
  "title": "Boolean テスト演算子",
  "description": "この演算子は、TRUE、FALSE、またはNULLをチェックするためにのみ使用されます。NULLの概要については、「Nulls」セクションを参照してください。",
  "language": "ja"
}
---
## 説明

この演算子は、TRUE、FALSE、またはNULLをチェックするために専用で使用されます。NULLの紹介については、「Nulls」セクションを参照してください。

## 演算子の紹介

| 演算子 | 機能 | 例 |
| -------------------- | ------------------------------------------------------------ | ------------------------ |
| `x IS [NOT] TRUE` | xがTRUEかどうかをチェックします。xがTRUEの場合はTRUEを返し、そうでなければFALSEを返します。 | `SELECT 1 IS NOT TRUE` |
| `x IS [NOT] FALSE` | xがFALSEかどうかをチェックします。xがFALSEの場合はTRUEを返し、そうでなければFALSEを返します。 | `SELECT 1 IS NOT FALSE` |
| `x IS [NOT] NULL` | xがNULLかどうかをチェックします。xがNULLの場合はTRUEを返し、そうでなければFALSEを返します。 | `SELECT 1 IS NOT NULL` |
