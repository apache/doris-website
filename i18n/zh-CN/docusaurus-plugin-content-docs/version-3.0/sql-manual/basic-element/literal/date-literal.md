---
{
    "title": "日期类型字面量",
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

和标准 SQL 一致，Doris 要求使用类型关键字和字符串来指定时间字面量。关键字和字符串之间的空格是可选的。例如：

```sql
DATE '2008-08-08'
TIMESTAMP'2008-08-08 20:08:08'
```

## 日期格式

### DATE 字面

- 使用 `-` 分隔的字符串，采用 `'YYYY-MM-DD'` 或 `'YY-MM-DD'`格式。Doris 也兼容 MySQL 的非标准分隔符格式，但是不推荐使用。
- 作为没有分隔符的字符串，采用 `'YYYYMMDD'` 或 `'YYMMDD'` 格式（前提是该字符串在日期上有意义）。

### DATEIME 字面量

- 使用 `-` 分隔的字符串，采用 `'YYYY-MM-DD hh:mm:ss'` 或 `'YY-MM-DD hh:mm:ss'`格式。Doris 也兼容 MySQL 的非标准分隔符格式，但是不推荐使用。日期和时间之间的分隔符可以是空格（` `）也可以是`T`。**不同于 MySQL 8.4 及更早的版本，Doris 不支持其他任何其他的时间和日期之间的分隔符。**
- 作为没有分隔符的字符串，采用 `'YYYYMMDDhhmmss'` 或 `'YYMMDDhhmmss'` 格式（前提是该字符串在日期上有意义）。

DATETIME 字面量可以包含一个最多达到微秒（6 位数字）精度的小数秒部分。小数部分应该始终用点号（`.`）与时间的其余部分分隔开；不识别其他的小数秒分隔符。

### 两位数年份

包含两位数年份值的日期是有歧义的，因为世纪是未知的。Doris 使用以下规则来解释两位数的年份值：

- 范围在 70-99 之间的年份值会被解释为 1970-1999 年。
- 范围在 00-69 之间的年份值会被解释为 2000-2069 年。

### 时区

DATE 和 DATETIME 字面量可以使用时区后缀。使用时区时，时区需要紧邻之前的日期或时间部分，之间不得有空格。例如：

```sql
TIMESTAMP '2008-08-08 20:08:08+08:00'
```

Doris 支持的时区格式有：

- 时区时间偏移量：格式为 `{+ | -}hh:mm`。如东八区为：`+08:00`
- 时区名。如上海时区为：`Asia/Shanghai`

### 错误值的处理

当遇到不能解析为合法日期字面量的值时，Doris 会直接报错。例如

```sql
SELECT date '071332'
```

会产生如下错误：

```sql
date/datetime literal [071332] is invalid
```