---
{
    "title": "RIGHT",
    "language": "zh-CN"
}
---

## right
## 描述
## 语法

`VARCHAR right(VARCHAR str, INT len)`


它返回具有指定长度的字符串的右边部分, 长度的单位为utf8字符。此函数的另一个别名为[strright](./strright.md)。

## 举例

```
mysql> select right("Hello doris",5);
+-------------------------+
| right('Hello doris', 5) |
+-------------------------+
| doris                   |
+-------------------------+
```
### keywords
    RIGHT
