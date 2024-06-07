---
{
    "title": "Release 2.0.11",
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

Thanks to our community users and developers, about 123 improvements and bug fixes have been made in Doris 2.0.11 version.

**Quick Download:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)

## 1 Behavior change

Since the inverted index is now mature and stable, it can replace the old BITMAP INDEX. Therefore, any newly created `BITMAP INDEX` will automatically switch to an `INVERTED INDEX`, while existing `BITMAP INDEX` will remain unchanged. This entire switching process is transparent to the user, with no changes to writing or querying. Additionally, users can disable this automatic switch by setting the FE configuration `enable_create_bitmap_index_as_inverted_index` to false. [#35528](https://github.com/apache/doris/pull/35528)


## 2 Improvement and optimizations

- Add Trino JDBC Catalog type mapping for JSON and TIME

- FE exit when failed to transfer to (non) master to prevent unknown state and too many logs

- Write audit log while doing drop stats table.

- Ignore min/max column stats if table is partially analyzed to avoid inefficient query plan

- Support minus operation for set like `set1 - set2`

- Improve perfmance of LIKE and REGEXP clause with concat (col, pattern_str), eg. `col1 LIKE concat('%', col2, '%')`

- Add query options for short circuit queries for upgrade compatibility

See the complete list of improvements and bug fixes on [github](https://github.com/apache/doris/compare/2.0.10...2.0.11) .

## Credits

Thanks all who contribute to this release:

@AshinGau, @BePPPower, @BiteTheDDDDt, @ByteYue, @CalvinKirs, @cambyzju, @csun5285, @dataroaring, @eldenmoon, @englefly, @feiniaofeiafei, @Gabriel39, @GoGoWen, @HHoflittlefish777, @hubgeter, @jacktengg, @jackwener, @jeffreys-cat, @Jibing-Li, @kaka11chen, @kobe6th, @LiBinfeng-01, @mongo360, @morningman, @morrySnow, @mrhhsg, @Mryange, @nextdreamblue, @qidaye, @sjyango, @starocean999, @SWJTU-ZhangLei, @w41ter, @wangbo, @wsjz, @wuwenchi, @xiaokang, @XieJiann, @xy720, @yujun777, @Yukang-Lian, @Yulei-Yang, @zclllyybb, @zddr, @zhangstar333, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993