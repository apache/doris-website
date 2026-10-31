---
{
    "title": "ST_Y",
    "language": "zh-CN"
}
---

## ST_Y
## 描述
## 语法

`DOUBLE ST_Y(POINT point)`


当 point 是一个合法的 POINT 类型时，返回对应的 Y 坐标值

## 举例

```
mysql> SELECT ST_Y(ST_Point(24.7, 56.7));
+----------------------------+
| ST_Y(ST_Point(24.7, 56.7)) |
+----------------------------+
| 56.7                       |
+----------------------------+
```
### keywords
ST_Y,ST,Y
