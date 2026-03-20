---
{
  "title": "COVAR_SAMP",
  "description": "2つの数値変数間のサンプル共分散を計算します。",
  "language": "ja"
}
---
## 説明

2つの数値変数間の標本共分散を計算します。

## 構文

```sql
COVAR_SAMP(<expr1>, <expr2>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr1>` | 数値式または列 |
| `<expr2>` | 数値式または列 |

## Return Value

expr1とexpr2のサンプル共分散を返します。特別なケース：

- expr1またはexpr2の列がNULLの場合、その行のデータは最終結果にカウントされません。

## Example

```
select covar_samp(x,y) from baseall;
```
```text
+---------------------+
| covar_samp(x, y)    |
+---------------------+
| 0.89442719099991586 |
+---------------------+
```
