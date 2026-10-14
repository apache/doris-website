---
{
    "title": "真偽値判定演算子",
    "language": "ja",
    "description": "この演算子は、TRUE、FALSE、NULL の判定にのみ使用します。NULL の概要については「Nulls」セクションを参照してください。"
}
---

## 説明

この演算子は、TRUE、FALSE、NULL の判定にのみ使用します。NULL の概要については「Nulls」セクションを参照してください。

## 演算子の概要

| 演算子 | 機能 | 例 |
| -------------------- | ------------------------------------------------------------ | ------------------------ |
| `x IS [NOT] TRUE` | x が TRUE かどうかを判定します。x が TRUE の場合は TRUE、それ以外の場合は FALSE を返します。 | `SELECT 1 IS NOT TRUE` |
| `x IS [NOT] FALSE` | x が FALSE かどうかを判定します。x が FALSE の場合は TRUE、それ以外の場合は FALSE を返します。 | `SELECT 1 IS NOT FALSE` |
| `x IS [NOT] NULL` | x が NULL かどうかを判定します。x が NULL の場合は TRUE、それ以外の場合は FALSE を返します。 | `SELECT 1 IS NOT NULL` |
