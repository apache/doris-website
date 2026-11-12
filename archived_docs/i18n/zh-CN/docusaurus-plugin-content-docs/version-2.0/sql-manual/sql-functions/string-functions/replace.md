---
{
    "title": "REPLACE",
    "language": "zh-CN"
}
---

## replace
## 描述
## 语法

`VARCHAR REPLACE (VARCHAR str, VARCHAR old, VARCHAR new)`

将str字符串中的old子串全部替换为new串

## 举例

```
mysql> select replace("http://www.baidu.com:9090", "9090", "");
+------------------------------------------------------+
| replace('http://www.baidu.com:9090', '9090', '') |
+------------------------------------------------------+
| http://www.baidu.com:                                |
+------------------------------------------------------+
```
### keywords
    REPLACE
