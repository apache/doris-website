---
{
    "title": "MONTHNAME",
    "language": "zh-CN"
}
---

## 描述

返回日期对应的英文月份名称。返回值为完整的英文月份名称（January 到 December）。

## 语法

```sql
MONTHNAME(<date>)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| `<date>` | 输入的日期时间值，类型可以是 DATE、DATETIME 或 DATETIMEV2 |

## 返回值

返回类型为 VARCHAR，表示月份的英文名称：
- 返回值范围：January, February, March, April, May, June, July, August, September, October, November, December
- 如果输入为 NULL，返回 NULL
- 返回值首字母大写，其余字母小写

## 举例

```sql
SELECT MONTHNAME('2008-02-03 00:00:00');
```

```text
+---------------------------------------------------------+
| monthname(cast('2008-02-03 00:00:00' as DATETIMEV2(0))) |
+---------------------------------------------------------+
| February                                                |
+---------------------------------------------------------+
```
