---
{
  "title": "代入演算子",
  "description": "代入演算子の機能は、演算子の右辺の式を左辺の式に代入することです。",
  "language": "ja"
}
---
## 説明

代入演算子の機能は、演算子の右辺の式を左辺の式に代入することです。Dorisでは、代入演算子はUPDATE文のSET部分とSET文でのみ使用できます。詳細については、[UPDATE](../../sql-statements/data-modification/DML/UPDATE.md)文と[SET](../../sql-statements/session/variable/SET-VARIABLE.md)文を参照してください。

## 演算子

| 演算子 | 目的 | 例 |
|----------|---------|---------|
| <x> = <y> | <y>の結果を<x>に代入する。 | `SET enable_profile = true` |
