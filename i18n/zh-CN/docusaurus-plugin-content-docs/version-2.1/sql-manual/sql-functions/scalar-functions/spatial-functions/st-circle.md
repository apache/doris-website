---
{
    "title": "ST_CIRCLE",
    "language": "zh-CN",
    "description": "将一个 WKT（Well Known Text）转化为地球球面上的一个圆。"
}
---

## 描述

将一个 WKT（Well Known Text）转化为地球球面上的一个圆。

## 语法

```sql
ST_CIRCLE( <center_lng>, <center_lat>, <radius>)
```
## 参数

| 参数 | 说明 |
| -- | -- |
| `<center_lng>` | 圆心的经度 |
| `<center_lat>` | 圆心的纬度 |
| `<radius>` | 圆的半径 |

- radius 单位是米，最大支持 9999999

## 返回值

根据圆的基本信息得到的球面上的一个圆

## 举例

```sql
SELECT ST_AsText(ST_Circle(111, 64, 10000));
```

```text
+--------------------------------------------+
| st_astext(st_circle(111.0, 64.0, 10000.0)) |
+--------------------------------------------+
| CIRCLE ((111 64), 10000)                   |
+--------------------------------------------+
```

