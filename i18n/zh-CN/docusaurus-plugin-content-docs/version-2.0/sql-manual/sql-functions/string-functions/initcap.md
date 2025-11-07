---
{
    "title": "INITCAP",
    "language": "zh-CN"
}
---

## initcap
## 描述
## 语法

`VARCHAR initcap(VARCHAR str)`

将参数中包含的单词首字母大写，其余字母转为小写。单词是由非字母数字字符分隔的字母数字字符序列。

## 举例

```
mysql> select initcap('hello hello.,HELLO123HELlo');
+---------------------------------------+
| initcap('hello hello.,HELLO123HELlo') |
+---------------------------------------+
| Hello Hello.,Hello123hello            |
+---------------------------------------+
```
### keywords
    INITCAP
