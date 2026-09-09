---
{
    "title": "ST_ISCLOSED",
    "language": "zh-CN",
    "description": "通过比较 LineString 的起点和终点，判断其是否闭合。"
}
---

## 描述

判断 `LINESTRING` 是否闭合。当 `LINESTRING` 的起点和终点完全相等时，该线为闭合线。此函数不使用距离容差。

## 语法

```sql
ST_ISCLOSED( <shape> )
```

## 参数

| 参数 | 说明 |
| :--- | :--- |
| `<shape>` | 输入的几何图形，类型为 GEOMETRY 或可以转换为 GEOMETRY 的 VARCHAR（WKT 格式）。 |

## 返回值

返回 BOOLEAN 值：

- 如果输入是有效的 `LINESTRING`，且其起点和终点完全相等，则返回 `true`。
- 如果输入是有效的 `LINESTRING`，且其起点和终点不同，则返回 `false`。
- 如果输入为 `NULL`、不是 `LINESTRING`，或无法解码为有效的几何图形，则返回 `NULL`。

在 SQL 输出中，`true` 显示为 `1`，`false` 显示为 `0`。

## 举例

**闭合的 LINESTRING**

```sql
SELECT ST_IsClosed(
    ST_GeometryFromText('LINESTRING(0 0, 1 1, 0 0)')
) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|         1 |
+-----------+
```

**未闭合的 LINESTRING**

```sql
SELECT ST_IsClosed(
    ST_GeometryFromText('LINESTRING(0 0, 1 1)')
) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|         0 |
+-----------+
```

**NULL 输入**

```sql
SELECT ST_IsClosed(NULL) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|      NULL |
+-----------+
```

**非 LINESTRING 输入**

```sql
SELECT ST_IsClosed(ST_Point(0, 0)) AS is_closed;
```

```text
+-----------+
| is_closed |
+-----------+
|      NULL |
+-----------+
```
