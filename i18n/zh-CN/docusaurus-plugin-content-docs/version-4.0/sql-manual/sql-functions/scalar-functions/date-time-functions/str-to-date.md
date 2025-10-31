---
{
    "title": "STR_TO_DATE",
    "language": "zh-CN"
}
---

## 描述

函数将输入的日期时间字符串根据指定的格式转换为 DATETIME 类型的值。

该函数与 mysql 中的 [str_to_date 函数](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-functions.html#function_str-to-date) 行为一致

## 语法

```sql
STR_TO_DATE(<datetime_str>, <format>)
```

## 参数

| 参数               | 说明                                                           |
|------------------|--------------------------------------------------------------|
| `<datetime_str>` | 必填，输入的日期时间字符串，表示要转换的日期或时间。输入支持的格式可以查看 [datetime 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/datetime-conversion), [date 的转换](../../../../../current/sql-manual/basic-element/sql-data-types/conversion/date-conversion)                                    |
| `<format>`       | 必填，指定的日期时间格式字符串，如 `%Y-%m-%d %H:%i:%s` 等，具体格式参数详见[DATE_FORMAT](./date-format#参数)文档 |

除此之外，`<format>` 额外支持以下若干代用格式，并按照正规 format 格式解读：

|代用输入|解读为|
|-|-|
|`yyyyMMdd`|`%Y%m%d`|
|`yyyy-MM-dd`|`%Y-%m-%d`|
|`yyyy-MM-dd HH:mm:ss`|`%Y-%m-%d %H:%i:%s`|

## 返回值
返回一个 DATETIME 类型值，表示转换后的日期时间。

日期时间匹配方式，用两根指针指向两字符串起始位置
1. 当遇格式字符串到 % 符号时，会根据 % 下一个字母匹配时间字符对应的时间部分，若不匹配（如 %Y 匹配日期时间部分却为 10:10:10 或者 % 不支持解析的字符如 %*），则返回错误，匹配成功则移动到下一个字符解析。
2. 任意时刻两串中的任一个遇到空格字符，直接跳过解析下一个字符
3. 当遇到普通字母的匹配，则查看两字符串现在指针所指向的字符是否相等，不相等则返回错误，相等则解析下一个字符
4. 当任日期指针指向字符串末尾时，若日期时间只包含日期部分，则格式字符串会检查是否包含匹配时间部分的字符（如 %H），若包含，则会设置时间部分为 00:00:00。
5. 当格式字符串指向末尾时，匹配结束。
6. 最后检查匹配时间部分是否合法（如月份必须在 [1，12] 区间内），如果不合法，则返回错误，合法则返回解析出的日期时间


- 若任一参数为 NULL，返回 NULL；
- 若 `<format>` 为空字符串，返回错误；
- 匹配失败，返回错误

## 举例

```sql
-- 使用标准格式符解析
SELECT STR_TO_DATE('2025-01-23 12:34:56', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 使用代用格式解析
SELECT STR_TO_DATE('2025-01-23 12:34:56', 'yyyy-MM-dd HH:mm:ss') AS result;
+---------------------+
| result              |
+---------------------+
| 2025-01-23 12:34:56 |
+---------------------+

-- 仅日期字符串（时间默认 00:00:00）
SELECT STR_TO_DATE('20230713', 'yyyyMMdd') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-07-13 00:00:00 |
+---------------------+

-- 解析带星期和周数的字符串
SELECT STR_TO_DATE('200442 Monday', '%X%V %W') AS result;
+------------+
| result     |
+------------+
| 2004-10-18 |
+------------+

-- 解析简写月名和12小时制时间
SELECT STR_TO_DATE('Oct 5 2023 3:45:00 PM', '%b %d %Y %h:%i:%s %p') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-10-05 15:45:00 |
+---------------------+

-- 格式与字符串不匹配（返回错误）
SELECT STR_TO_DATE('2023/01/01', '%Y-%m-%d') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation str_to_date of 2023/01/01 is invalid

-- 字符串包含多余字符（自动忽略）
SELECT STR_TO_DATE('2023-01-01 10:00:00 (GMT)', '%Y-%m-%d %H:%i:%s') AS result;
+---------------------+
| result              |
+---------------------+
| 2023-01-01 10:00:00 |
+---------------------+

-- 解析微秒（保留精度）
SELECT STR_TO_DATE('2023-07-13 12:34:56.789', '%Y-%m-%d %H:%i:%s.%f') AS result;
+----------------------------+
| result                     |
+----------------------------+
| 2023-07-13 12:34:56.789000 |
+----------------------------+

-- 任一参数为 NULL（返回 NULL）
SELECT STR_TO_DATE(NULL, '%Y-%m-%d'), STR_TO_DATE('2023-01-01', NULL) AS result;
+--------------------------------+--------+
| str_to_date(NULL, '%Y-%m-%d')  | result |
+--------------------------------+--------+
| NULL                           | NULL   |
+--------------------------------+--------+

-- 格式为空字符串（返回错误））
SELECT STR_TO_DATE('2023-01-01', '') AS result;
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Operation str_to_date of 2023-01-01 is invalid
```