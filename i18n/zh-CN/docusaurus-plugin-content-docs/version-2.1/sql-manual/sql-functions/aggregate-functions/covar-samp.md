---
{
"title": "COVAR_SAMP",
"language": "zh-CN"
}
---

## 描述

计算两个数值型变量之间的样本协方差

## 语法

```sql
COVAR_SAMP(<expr1>, <expr2>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 数值型表达式或列 |
| `<expr2>` | 数值型表达式或列 |

## 返回值

返回 expr1 和 expr2 的样本协方差，特殊情况：

- 如果 expr1 或者 expr2 某一列为 NULL 时，该行数据不会被统计到最终结果中。

## 举例

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
