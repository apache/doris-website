 ---
{
    "title": "MONTHS_BETWEEN",
    "language": "cn"
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
> 从版本 2.1.10 开始支持

`MONTHS_BETWEEN` 函数计算两个日期之间的月份数（浮点数）。它接收两个日期参数和一个可选的布尔参数。

## 语法

```sql
MONTHS_BETWEEN(<enddate>, <startdate> [, <round_type>])
```

## 参数

| 参数         | 说明                                                |
|-------------------|------------------------------------------------------------|
| `<enddate>`   | 结束日期，表示差值计算中的较晚日期。支持 `DATE`（如 `YYYY-MM-DD`）或 `DATETIME`（如 `YYYY-MM-DD HH:MM:SS`）类型。     |
| `<startdate>` | 开始日期，表示差值计算中的较早日期。支持 `DATE`（如 `YYYY-MM-DD`）或 `DATETIME`（如 `YYYY-MM-DD HH:MM:SS`）类型。 |
| `<round_type>` | 是否将结果四舍五入到第八位小数。支持 `true` 或 `false`。默认为 `true`。 |

## 返回值

返回 `<enddate>` 减去 `<startdate>` 得到的月份数（浮点数）

结果 = (`<enddate>.year` - `<startdate>.year`) * 12 + `<enddate>.month` - `<startdate>.month` + (`<enddate>.day` - `<startdate>.day`) / 31.0

- 当 `<enddate>` 或 `<startdate>` 为 NULL，或两者都为 NULL 时，返回 NULL
- 当 `<round_type>` 为 `true` 时，结果四舍五入到第八位小数。

## 示例

```sql
select months_between('2020-12-26','2020-10-25'),months_between('2020-10-25 10:00:00','2020-12-26 11:00:00',false);
```

```text
+-------------------------------------------+-------------------------------------------------------------------+
| months_between('2020-12-26','2020-10-25') | months_between('2020-10-25 10:00:00','2020-12-26 11:00:00',false) |
+-------------------------------------------+-------------------------------------------------------------------+
|                                2.03225806 |                                                -2.032258064516129 |
+-------------------------------------------+-------------------------------------------------------------------+
```

**注意：**
当 `<enddate>` 和 `<startdate>` 都是各自月份的最后一天时，函数会进行特殊处理。它会返回完整的月份差值，而不考虑基于天数的分数部分。这确保了在比较一个月末与另一个月末时的一致性。

例如：
- `months_between('2024-01-31', '2024-02-29')` 将返回 `-1.0`，因为两个日期都是各自月份的最后一天（1月31日和2月29日），所以结果被视为完整的月份差值，不进行分数调整。
- `months_between('2024-01-29', '2024-02-29')` 也将返回 `-1.0`，因为月份中的日期相同。
- `months_between('2024-01-30', '2024-02-29')` 将返回 `-0.96774194`，因为月份中的日期不同且不是月末。 