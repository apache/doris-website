---
{
    "title": "ST_LINEFROMTEXT",
    "language": "zh-CN"
}
---

## 描述

将一个 WKT（Well Known Text）转化为一个 Line 形式的内存表现形式

## 别名

- ST_LINESTRINGFROMTEXT

## 语法

```sql
ST_LINEFROMTEXT( <wkt>)
```

## 参数

| 参数  | 说明         |
|-----|------------|
| `<wkt>` | 符合 LINE 类型的 WKT 字符串，格式为：
"LINE (x1 y1, x2 y2)"
其中，(x1 y1), (x2 y2) 是线段的顶点坐标，坐标值为数值（整数或小数）。 |

## 返回值

返回 Line 类型的几何对象，该对象在内存中以 Doris 内部的空间数据格式存储，可直接作为参数传入其他空间函数（如 ST_LENGTH、ST_INTERSECTS 等）进行计算。

- 若输入的 WKT 字符串格式无效（如顶点数量不足 2 个、语法错误、坐标非数值等），返回 NULL。
- 若输入 <wkt> 为 NULL 或空字符串，返回 NULL。

## 举例


正常LINE类型

```sql
mysql> SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
+-----------------------------------------------------+
| ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)")) |
+-----------------------------------------------------+
| LINESTRING (1 1, 2 2)                               |
+-----------------------------------------------------+
```

无效 WKT（顶点数量不足）

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1)");
+-------------------------------------+
| ST_LineFromText("LINESTRING (1 1)") |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

无效 WKT（语法错误）

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1, 2 2");
+-----------------------------------------+
| ST_LineFromText("LINESTRING (1 1, 2 2") |
+-----------------------------------------+
| NULL                                    |
+-----------------------------------------+
```

无效WKT(顶点数量太多)

```sql
mysql> SELECT ST_LineFromText("LINESTRING (1 1,2 2,3 3)");
+---------------------------------------------------------------------------------+
| ST_LineFromText("LINESTRING (1 1,2 2,3 3)")                                     |
+---------------------------------------------------------------------------------+
|     ��_<���?'���Xޑ?݉+
                       ߑ?�����?(Qjm�ۡ?'���Xޡ?�3|ʏ��?lW<�`ª?��H�˪?       |
+---------------------------------------------------------------------------------+
```

输入 NULL

```sql
mysql> SELECT ST_LineFromText(NULL);
+-----------------------+
| ST_LineFromText(NULL) |
+-----------------------+
| NULL                  |
+-----------------------+
```
