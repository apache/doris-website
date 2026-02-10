---
{
    "title": "LEFT",
    "language": "zh-CN"
}
---

## left
## 描述
## 语法

`VARCHAR left(VARCHAR str, INT len)`


它返回具有指定长度的字符串的左边部分，长度的单位为utf8字符，此函数的另一个别名为[strleft](./strleft.md)。

## 举例

```
mysql> select left("Hello doris",5);
+------------------------+
| left('Hello doris', 5) |
+------------------------+
| Hello                  |
+------------------------+
```
### keywords
    LEFT
