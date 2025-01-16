---
{
    "title": "LAST_DAY",
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

返回输入日期所在月份的最后一天的日期。根据不同月份，返回日期的具体日期值为：

- 28 日：非闰年的二月
- 29 日：闰年的二月
- 30 日：四月、六月、九月、十一月
- 31 日：一月、三月、五月、七月、八月、十月、十二月

## 语法

```sql
DATE LAST_DAY(DATETIME date)
```

## 参数

| 参数 | 说明 |
| ---- | ---- |
| date | 输入的日期时间值，类型为 DATETIME 或 DATE |

## 返回值

返回类型为 DATE。

## 举例

```sql
SELECT LAST_DAY('2000-02-03');
```

```plaintext
+-----------------------------------------------+
| last_day(cast('2000-02-03' as DATETIMEV2(0))) |
+-----------------------------------------------+
| 2000-02-29                                    |
+-----------------------------------------------+
```

## 关键词

    LAST_DAY,DAYS