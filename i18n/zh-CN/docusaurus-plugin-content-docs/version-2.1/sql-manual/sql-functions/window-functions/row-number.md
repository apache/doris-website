---
{
    "title": "WINDOW_FUNCTION_ROW_NUMBER",
    "language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

ROW_NUMBER() 是一个窗口函数，用于为分区内的每一行分配一个唯一的序号。序号从 1 开始连续递增。与 RANK() 和 DENSE_RANK() 不同，ROW_NUMBER() 即使对于相同的值也会分配不同的序号，确保每行都有唯一的编号。

## 语法

```sql
ROW_NUMBER()
```

## 返回值

返回 BIGINT 类型的序号，从 1 开始连续递增。在每个分区内，序号都是唯一的。

## 举例

```sql
select x, y, row_number() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 3    |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    |
| 3   | 1   | 1    |
| 3   | 1   | 2    |
| 3   | 2   | 3    |
+-----+-----+------+
```
