---
{
    "title": "STRLEFT",
    "language": "zh-CN"
}
---

## strleft
## 描述
## 语法

`VARCHAR strleft(VARCHAR str, INT len)`


它返回具有指定长度的字符串的左边部分，长度的单位为utf8字符，此函数的另一个别名为[left](./left.md)。

## 举例

```
mysql> select strleft("Hello doris",5);
+------------------------+
| strleft('Hello doris', 5) |
+------------------------+
| Hello                  |
+------------------------+
```
### keywords
    STRLEFT
