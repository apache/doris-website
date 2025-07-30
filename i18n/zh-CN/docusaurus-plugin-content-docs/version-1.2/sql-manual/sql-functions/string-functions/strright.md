---
{
    "title": "STRRIGHT",
    "language": "zh-CN"
}
---

## strright
## 描述
## 语法

`VARCHAR strright(VARCHAR str, INT len)`


它返回具有指定长度的字符串的右边部分, 长度的单位为utf8字符。此函数的另一个别名为[right](./right.md)。

## 举例

```
mysql> select strright("Hello doris",5);
+-------------------------+
| strright('Hello doris', 5) |
+-------------------------+
| doris                   |
+-------------------------+
```
### keywords
    STRRIGHT
