---
{
    "title": "日期类型概览",
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

### 描述

日期类型包括 DATE、TIME 和 DATETIME，DATE 类型只存储日期精确到天，DATETIME 类型存储日期和时间，可以精确到微秒。TIME 类型只存储时间，且**暂时不支持建表存储，只能在查询过程中使用**。

对日期类型进行计算，或将其转换为数字，请使用类似 [TIME_TO_SEC](../../sql-functions/date-time-functions/time-to-sec), [DATE_DIFF](../../sql-functions/date-time-functions/datediff), [UNIX_TIMESTAMP](../../sql-functions/date-time-functions/unix-timestamp) 等函数，直接将其 CAST 为数字类型的结果不受保证。在未来的版本中，此类 CAST 行为将会被禁止。

更多信息参考 [DATE](./DATE)、[TIME](./TIME) 和 [DATETIME](./DATETIME) 文档。