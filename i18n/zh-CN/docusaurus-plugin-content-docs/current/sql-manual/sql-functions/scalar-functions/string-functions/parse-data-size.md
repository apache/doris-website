---
{
    "title": "PARSE_DATA_SIZE",
    "language": "zh-CN",
    "description": "PARSEDATASIZE 函数用于解析带存储单位的字符串（如 1.5GB），将其转换为以字节为单位的数值。"
}
---

## 描述

PARSE_DATA_SIZE 函数用于解析带存储单位的字符串（如 "1.5GB"），将其转换为以字节为单位的数值。

## 语法

```sql
PARSE_DATA_SIZE(<str>)
```

## 参数

| 参数 | 说明 |
| -------- | ----------------------------------------- |
| `<str>` | 带单位的数据大小字符串（如 "100MB", "2.5GB"）。类型：VARCHAR |

## 返回值

返回 BIGINT 类型，表示转换为字节后的数值。

特殊情况：
- 支持的单位（不区分大小写）：B, kB, MB, GB, TB, PB, EB, ZB, YB
- 单位采用 1024 进制（如 1kB = 1024B）
- 支持小数（如 "2.5MB"）
- 如果参数格式不合法，返回错误
- 如果参数为 NULL，返回 NULL

**支持的单位对照表：**

| 单位 | 名称 | 字节数 |
|------|------|--------|
| B    | Bytes      | 1          |
| kB   | Kilobytes  | 1024       |
| MB   | Megabytes  | 1024²      |
| GB   | Gigabytes  | 1024³      |
| TB   | Terabytes  | 1024⁴      |
| PB   | Petabytes  | 1024⁵      |
| EB   | Exabytes   | 1024⁶      |

## 示例

1. 基本用法：解析字节
```sql
SELECT parse_data_size('1024B');
```
```text
+--------------------------+
| parse_data_size('1024B') |
+--------------------------+
| 1024                     |
+--------------------------+
```

2. 解析千字节
```sql
SELECT parse_data_size('1kB');
```
```text
+------------------------+
| parse_data_size('1kB') |
+------------------------+
| 1024                   |
+------------------------+
```

3. 解析带小数的兆字节
```sql
SELECT parse_data_size('2.5MB');
```
```text
+--------------------------+
| parse_data_size('2.5MB') |
+--------------------------+
| 2621440                  |
+--------------------------+
```

4. 解析吉字节
```sql
SELECT parse_data_size('1GB');
```
```text
+------------------------+
| parse_data_size('1GB') |
+------------------------+
| 1073741824             |
+------------------------+
```

5. 解析太字节
```sql
SELECT parse_data_size('1TB');
```
```text
+------------------------+
| parse_data_size('1TB') |
+------------------------+
| 1099511627776          |
+------------------------+
```

6. 不支持的单位，报错
```sql
SELECT parse_data_size('1iB');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.3)[INVALID_ARGUMENT]Invalid Input argument "1iB" of function parse_data_size
```

7. 输入 NULL
```sql
SELECT parse_data_size(NUll);
```
```text
+-----------------------+
| parse_data_size(NUll) |
+-----------------------+
| NULL                  |
+-----------------------+
```

### Keywords

    PARSE_DATA_SIZE