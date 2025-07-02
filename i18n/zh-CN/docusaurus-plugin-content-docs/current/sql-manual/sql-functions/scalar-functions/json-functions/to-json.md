---
{
    "title": "TO_JSON",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 描述

将 Doris 内部数据类型转换为 JSONB 类型。该函数允许将兼容的 Doris 数据类型转换为 JSON 表示形式，且不会丢失精度。

## 语法

```sql
TO_JSON(value)
```

## 参数

**value** - 要转换为 JSONB 类型的值。支持以下 Doris 数据类型：
- 数字类型：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL
- 布尔类型：BOOLEAN
- 字符串类型：STRING、VARCHAR
- 复杂类型：ARRAY、STRUCT

未列出的类型（如 DATE、DATETIME 等）不直接支持，必须先转换为支持的类型（通常是 STRING）。

## 返回值

返回 JSONB 类型的值。

当输入的 `value` 为 SQL NULL 时，函数返回 SQL NULL（不是 JSON null 值）。当 NULL 值出现在数组或结构体内部时，它们会被转换为 JSON null 值。

## 示例

### 基本标量值

```sql
SELECT to_json(1), to_json(3.14), to_json("12345");
```

```text
+------------+---------------+------------------+
| to_json(1) | to_json(3.14) | to_json("12345") |
+------------+---------------+------------------+
| 1          | 3.14          | "12345"          |
+------------+---------------+------------------+
```

### 数组转换

```sql
SELECT to_json(array(array(1,2,3),array(4,5,6)));
```

```text
+-------------------------------------------+
| to_json(array(array(1,2,3),array(4,5,6))) |
+-------------------------------------------+
| [[1,2,3],[4,5,6]]                         |
+-------------------------------------------+
```

```sql
SELECT to_json(array(12,34,null));
```

```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```

### 访问转换后 JSON 中的数组元素

```sql
SELECT json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]');
```

```text
+----------------------------------------------------------------------+
| json_extract(to_json(array(array(1,2,3),array(4,5,6))), '$.[1].[2]') |
+----------------------------------------------------------------------+
| 6                                                                    |
+----------------------------------------------------------------------+
```

### 结构体转换

```sql
SELECT to_json(struct(123,array(4,5,6),"789"));
```

```text
+------------------------------------------+
| to_json(struct(123,array(4,5,6),"789"))  |
+------------------------------------------+
| {"col1":123,"col2":[4,5,6],"col3":"789"} |
+------------------------------------------+
```

### 访问转换后 JSON 中的对象属性

```sql
SELECT json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2");
```

```text
+----------------------------------------------------------------+
| json_extract(to_json(struct(123,array(4,5,6),"789")),"$.col2") |
+----------------------------------------------------------------+
| [4,5,6]                                                        |
+----------------------------------------------------------------+
```

### 处理 NULL 值

```sql
-- SQL NULL 作为输入返回 SQL NULL
SELECT to_json(null);
```

```text
+---------------+
| to_json(null) |
+---------------+
| NULL          |
+---------------+
```

```sql
-- 数组内的 NULL 值转换为 JSON null 值
SELECT to_json(array(12,34,null));
```

```text
+----------------------------+
| to_json(array(12,34,null)) |
+----------------------------+
| [12,34,null]               |
+----------------------------+
```

### 不支持的 Doris 类型

```sql
SELECT to_json(makedate(2025,5));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(DATE)
```

```sql
-- 可以先转换成 string 再去执行 to_json
SELECT to_json(cast(makedate(2025,5) as string));
```

```text
+-------------------------------------------+
| to_json(cast(makedate(2025,5) as string)) |
+-------------------------------------------+
| "2025-01-05"                              |
+-------------------------------------------+
```

## 注意事项

1. 某些类型没有直接的 JSON 映射（如 DATE 类型）。对于这些类型，需要先将其转换为 STRING 类型，然后再使用 `TO_JSON`。

2. 使用 `TO_JSON` 将 Doris 内部类型转换为 JSONB 类型时不会出现精度损失，这与通过文本表示进行转换不同。

3. Doris 中的 JSONB 对象默认大小限制为 1,048,576 字节（1 MB），可通过 BE 配置 `string_type_length_soft_limit_bytes` 参数调整，最大可调整至 2,147,483,643 字节（约 2 GB）。

4. Doris JSON 类型的对象中，键的长度不能超过 255 个字节。



