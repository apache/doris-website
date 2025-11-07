---
{
    "title": "REPLACE",
    "language": "en"
}
---

## replace
### description
#### Syntax

`VARCHAR REPLACE (VARCHAR str, VARCHAR old, VARCHAR new)`

replace all old substring with new substring in str 

### example

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
