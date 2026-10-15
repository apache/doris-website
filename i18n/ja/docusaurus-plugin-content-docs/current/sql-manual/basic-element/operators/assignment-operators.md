---
{
    "title": "代入演算子",
    "language": "ja",
    "description": "代入演算子は、右辺の式の値を左辺の式に代入します。"
}
---

## 説明

代入演算子は、右辺の式の値を左辺の式に代入します。Doris では UPDATE 文の SET 部分と SET 文でのみ使用できます。詳しくは [UPDATE](../../sql-statements/data-modification/DML/UPDATE.md) 文と [SET](../../sql-statements/session/variable/SET-VARIABLE.md) 文を参照してください。

## 演算子

| 演算子 | 用途 | 例 |
|----------|---------|---------|
| <x> = <y> | <y> の結果を <x> に代入します。 | `SET enable_profile = true` |