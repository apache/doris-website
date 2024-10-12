---
{
    "title": "Release 2.0.15",
    "language": "en"
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

Thanks to our community users and developers, about 157 improvements and bug fixes have been made in Doris 2.0.15 version

- Quick Download: https://doris.apache.org/download

- GitHub: https://github.com/apache/doris/releases/tag/2.0.15 

## 1 Behavior Change

NA

## 2 New Features

- Restore now supports deleting redundant tablets and partition options. [#39028](https://github.com/apache/doris/pull/39028)

- Support JSON function `json_search`.[#40948](https://github.com/apache/doris/pull/40948)

## 3 Improvement and Optimizations

### Stability

- Add a FE configuration `abort_txn_after_lost_heartbeat_time_second` for transaction abort time. [#28662](https://github.com/apache/doris/pull/28662)

- Abort transactions after a BE loses heartbeat for over 1 minute instead of 5 seconds, to avoid overly sensitive transaction aborts. [#22781](https://github.com/apache/doris/pull/22781)

- Delay scheduling EOF tasks of routine load to avoid an excessive number of small transactions. [#39975](https://github.com/apache/doris/pull/39975)

- Prefer querying from online disk services to be more robust. [#39467](https://github.com/apache/doris/pull/39467)

- Skip checking newly inserted rows in non-strict mode partial updates if the row's delete sign is marked. [#40322](https://github.com/apache/doris/pull/40322)

- To prevent FE OOM, limit the number of tablets in backup tasks, with a default value of 300,000. [#39987](https://github.com/apache/doris/pull/39987)

### Performance

- Optimize slow column updates caused by concurrent column updates and compactions. [#38487](https://github.com/apache/doris/pull/38487)

- When a NullLiteral exists in a filter condition, it can now be folded into False and further converted to an EmptySet to reduce unnecessary data scanning and computation. [#38135](https://github.com/apache/doris/pull/38135)

- Improve performance of `ORDER BY` permutation. [#38985](https://github.com/apache/doris/pull/38985)

- Improve the performance of string processing in inverted indexes. [#37395](https://github.com/apache/doris/pull/37395)

### Optimizer and Statistics

- Added support for statements beginning with a semicolon. [#39399](https://github.com/apache/doris/pull/39399)

- Polish aggregate function signature matching. [#39352](https://github.com/apache/doris/pull/39352)

- Drop column statistics and trigger auto analysis after schema change. [#39101](https://github.com/apache/doris/pull/39101)

- Support dropping cached stats using `DROP CACHED STATS table_name`. [#39367](https://github.com/apache/doris/pull/39367)

### Multi Catalog and Others

- Optimize JDBC Catalog refresh to reduce the frequency of client creation. [#40261](https://github.com/apache/doris/pull/40261)

- Fix thread leaks in JDBC Catalog under certain conditions. [#39423](https://github.com/apache/doris/pull/39423)

- ARRAY MAP STRUCT types now support `REPLACE_IF_NOT_NULL`. [#38304](https://github.com/apache/doris/pull/38304)

- Retry delete jobs for failures that are not `DELETE_INVALID_XXX`. [#37834](https://github.com/apache/doris/pull/37834)

**Credits**

@924060929, @BePPPower, @BiteTheDDDDt, @CalvinKirs, @GoGoWen, @HappenLee, @Jibing-Li, @Johnnyssc, @LiBinfeng-01, @Mryange, @SWJTU-ZhangLei, @TangSiyang2001, @Toms1999, @Vallishp, @Yukang-Lian, @airborne12, @amorynan, @bobhan1, @cambyzju, @csun5285, @dataroaring, @eldenmoon, @englefly, @feiniaofeiafei, @hello-stephen, @htyoung, @hubgeter, @justfortaste, @liaoxin01, @liugddx, @liutang123, @luwei16, @mongo360, @morrySnow, @qidaye, @smallx, @sollhui, @starocean999, @w41ter, @xiaokang, @xzj7019, @yujun777, @zclllyybb, @zddr, @zhangstar333, @zhannngchen, @zy-kkk, @zzzxl1993