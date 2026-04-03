---
{
  "title": "論理値テストオペレータ",
  "description": "この演算子は、TRUE、FALSE、またはNULLをチェックするためにのみ使用されます。NULLの概要については、「Nulls」セクションを参照してください。",
  "language": "ja"
}
---
## 説明

この演算子は TRUE、FALSE、または NULL をチェックするためにのみ使用されます。NULL の概要については、「Nulls」セクションを参照してください。

## 演算子の紹介

| 演算子 | 機能 | 例 |
| -------------------- | ------------------------------------------------------------ | ------------------------ |
| `x IS [NOT] TRUE` | x が TRUE かどうかをチェックします。x が TRUE の場合は TRUE を返し、そうでなければ FALSE を返します。 | `SELECT 1 IS NOT TRUE` |
| `x IS [NOT] FALSE` | x が FALSE かどうかをチェックします。x が FALSE の場合は TRUE を返し、そうでなければ FALSE を返します。 | `SELECT 1 IS NOT FALSE` |
| `x IS [NOT] NULL` | x が NULL かどうかをチェックします。x が NULL の場合は TRUE を返し、そうでなければ FALSE を返します。 | `SELECT 1 IS NOT NULL` |
