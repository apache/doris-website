---
{
  "title": "比較演算子",
  "description": "比較条件は、一つの式を別の式と比較します。比較の結果は、TRUE、FALSE、またはUNKNOWNになります。",
  "language": "ja"
}
---
## デスクリプション

比較条件は、ある式を別の式と比較します。比較の結果は、TRUE、FALSE、またはUNKNOWNになります。

## Operator Introduction

| Operator | ファンクション | Example |
| ------------------- | ----------------------------------------------------------- | ------------------- |
| `=` | 等価比較。比較の一方がUNKNOWNの場合、結果はUNKNOWNになります。 | `SELECT 1 = 1` |
| `<=>` | NULL安全等価比較。等価比較とは異なり、NULL安全等価はNULLを比較可能な値として扱います。両方がNULLの場合はTRUEを返します。一方のみがNULLの場合はFALSEを返します。この演算子はUNKNOWNを返すことはありません。 | `SELECT NULL <=> NULL` |
| `!=` `<>` | 不等価比較 | `SELECT 1 != 1` |
| `<` `>` | より大きい・より小さい比較 | `SELECT 1 > 1` |
| `<=` `>=` | 以上・以下比較 | `SELECT 1 >= 1` |
| `<x> BETWEEN <y> AND <z>` | `<x> >= <y> and <x> <= <z>`と等価。`<y>`以上かつ`<z>`以下 | `SELECT 1 BETWEEN 0 AND 2` |
