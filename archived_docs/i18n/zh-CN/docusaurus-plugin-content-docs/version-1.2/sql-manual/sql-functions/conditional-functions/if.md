---
{
    "title": "IF",
    "language": "zh-CN"
}
---

## if
## 描述
## 语法

`if(boolean condition, type valueTrue, type valueFalseOrNull)`


如果表达式 condition 成立，返回结果 valueTrue；否则，返回结果 valueFalseOrNull
返回类型： valueTrue 表达式结果的类型


## 举例

```
mysql> select  user_id, if(user_id = 1, "true", "false") test_if from test;
+---------+---------+
| user_id | test_if |
+---------+---------+
| 1       | true    |
| 2       | false   |
+---------+---------+
```
### keywords
IF
