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

| 参数 | 说明 |
|-----|------|
| value | 要转换为 JSONB 类型的值。可以是与 JSON 映射兼容的任何类型。 |

## 返回值

返回 JSONB 类型的值。

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

### 不支持的 Doris 类型

```sql
SELECT to_json(makedate(2025,5));
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = Can not find the compatibility function signature: to_json(DATE)
```

## 注意事项

1. `TO_JSON` 支持转换有 JSONB 类型映射的 Doris 数据类型：
   - 数字类型（TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE、DECIMAL）
   - 布尔类型
   - 字符串类型
   - 数组类型
   - 结构体类型

2. 某些类型没有直接的 JSON 映射（如 DATE 类型）。对于这些类型，需要先将其转换为 STRING 类型，然后再使用 `TO_JSON`。

3. 使用 `TO_JSON` 将 Doris 内部类型转换为 JSONB 类型时不会出现精度损失，这与通过文本表示进行转换不同。

4. to_json(null) 的结果是一个 SQL 的 NULL，而不是一个 JSONB 的 null。



