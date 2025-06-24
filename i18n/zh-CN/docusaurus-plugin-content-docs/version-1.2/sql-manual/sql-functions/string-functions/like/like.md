---
{
    "title": "LIKE",
    "language": "zh-CN"
}
---

## like
## 描述
## 语法

`BOOLEAN like(VARCHAR str, VARCHAR pattern)`

对字符串 str 进行模糊匹配，匹配上的则返回 true，没匹配上则返回 false。

like 匹配/模糊匹配，会与 % 和 _ 结合使用。

百分号 '%' 代表零个、一个或多个字符。

下划线 '_' 代表单个字符。

```
'a'      // 精准匹配，和 `=` 效果一致
'%a'     // 以a结尾的数据
'a%'     // 以a开头的数据
'%a%'    // 含有a的数据
'_a_'    // 三位且中间字符是 a的数据
'_a'     // 两位且结尾字符是 a的数据
'a_'     // 两位且开头字符是 a的数据
'a__b'  // 四位且以字符a开头、b结尾的数据
```
## 举例

```
// table test
+-------+
| k1    |
+-------+
| b     |
| bb    |
| bab   |
| a     |
+-------+

// 返回 k1 字符串中包含 a 的数据
mysql > select k1 from test where k1 like '%a%';
+-------+
| k1    |
+-------+
| a     |
| bab   |
+-------+

// 返回 k1 字符串中等于 a 的数据
mysql > select k1 from test where k1 like 'a';
+-------+
| k1    |
+-------+
| a     |
+-------+
```

### keywords
    LIKE
