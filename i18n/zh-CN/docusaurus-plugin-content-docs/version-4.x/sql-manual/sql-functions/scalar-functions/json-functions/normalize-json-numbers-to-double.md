---
{
    "title": "NORMALIZE_JSON_NUMBERS_TO_DOUBLE",
    "language": "zh-CN",
    "description": "NORMALIZEJSONNUMBERSTODOUBLE 函数用于将 JSON 中的所有数值类型转换为双精度浮点数（double）类型。 该函数接受一个 JSON 值作为输入，并返回一个新的 JSON 值，其中所有数值类型都被转换为双精度浮点数。"
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

`NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 函数用于将 JSON 中的所有数值类型转换为双精度浮点数（double）类型。
该函数接受一个 JSON 值作为输入，并返回一个新的 JSON 值，其中所有数值类型都被转换为双精度浮点数。


## 语法

```sql
NORMALIZE_JSON_NUMBERS_TO_DOUBLE(json_value)
```

## 别名

`NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`

## 参数

**json_value** - 需要处理的 JSON 值。必须是 JSON 类型。

## 返回值

返回一个新的 JSON 值，其中所有数值类型都被转换为双精度浮点数（double）类型。

当输入为 NULL 时，函数返回 NULL。


## 用途

由于 JSON 标准并没有规定 Number 的底层类型，而大多数系统中 Number 类型的实现基于 IEEE 754-2008 二进制 64 位（双精度）浮点数（如 C++ 中的 double 类型）。
Doris 为了保证数据准确性，对 Number 类型进行了更精细的扩展。支持了 Int128、DECIMAL 等更精确的类型。
但是这样可能会和其他系统存在差异。

例如对于这样的 JSON 字符串：
```text
'{"abc": 18446744073709551616}'
```

在一些使用 Double 作为 JSON 的 Number 底层类型的系统，例如 MySQL，会得到这样的结果：
```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc": 1.8446744073709552e19}                |
+-----------------------------------------------+
```

但是因为 Doris 的 JSON 的 Number 有精度更高的类型，所以会得到：
```text
+-----------------------------------------------+
| cast('{"abc": 18446744073709551616}' as json) |
+-----------------------------------------------+
| {"abc":18446744073709551616}                  |
+-----------------------------------------------+
```

为了和其他系统兼容，可以使用 `NORMALIZE_JSON_NUMBERS_TO_DOUBLE`：
```text
+---------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"abc": 18446744073709551616}' as json)) |
+---------------------------------------------------------------------------------+
| {"abc":1.8446744073709552e+19}                                                  |
+---------------------------------------------------------------------------------+
```


## 示例

### 基本数值转换

```sql
SELECT normalize_json_numbers_to_double(cast('{"b":1234567890123456789,"b":456,"a":789}' as json));
```

```text
+---------------------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"b":1234567890123456789,"b":456,"a":789}' as json)) |
+---------------------------------------------------------------------------------------------+
| {"b":1.2345678901234568e+18,"b":456,"a":789}                                                |
+---------------------------------------------------------------------------------------------+
```

### 处理嵌套 JSON

```sql
SELECT normalize_json_numbers_to_double(cast('{"object":{"int":123,"bigint":1234567890123456789},"array":[123,456,789]}' as json));
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| normalize_json_numbers_to_double(cast('{"object":{"int":123,"bigint":1234567890123456789},"array":[123,456,789]}' as json)) |
+-----------------------------------------------------------------------------------------------------------------------------+
| {"object":{"int":123,"bigint":1.2345678901234568e+18},"array":[123,456,789]}                                                |
+-----------------------------------------------------------------------------------------------------------------------------+
```

### 处理 NULL 值

```sql
SELECT normalize_json_numbers_to_double(null);
```

```text
+----------------------------------------+
| normalize_json_numbers_to_double(null) |
+----------------------------------------+
| NULL                                   |
+----------------------------------------+
```

## 注意事项

1. `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` 函数有一个别名 `NORMALIZE_JSONB_NUMBERS_TO_DOUBLE`，两者功能完全相同。

2. 此函数将 JSON 中的所有数值类型（包括整数、浮点数、DECIMAL）都转换为双精度浮点数表示形式。

3. 对于特别大的整数，转换为双精度浮点数可能会导致精度损失，如示例中的 1234567890123456789 被转换为 1.2345678901234568e+18。

4. 此函数不会改变 JSON 的结构，只会修改其中的数值表示形式。
