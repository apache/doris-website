---
{
    "title": "ST_X",
    "language": "zh-CN"
}
---

## ST_X
## 描述
## 语法

`DOUBLE ST_X(POINT point)`


当point是一个合法的POINT类型时，返回对应的X坐标值

## 举例

```
mysql> SELECT ST_X(ST_Point(24.7, 56.7));
+----------------------------+
| st_x(st_point(24.7, 56.7)) |
+----------------------------+
|                       24.7 |
+----------------------------+
```
### keywords
ST_X,ST,X
