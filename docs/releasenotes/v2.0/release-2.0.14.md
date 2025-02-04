---
{
    "title": "Release 2.0.14",
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

Thanks to our community users and developers, about 110 improvements and bug fixes have been made in Doris 2.0.14 version


## 1 New features

- Adds a REST interface to retrieve the most recent query profile: `curl http://user:password@127.0.0.1:8030/api/profile/text` [#38268](https://github.com/apache/doris/pull/38268)

## 2 Improvements

- Optimizes the primary key point query performance for MOW tables with sequence columns [#38287](https://github.com/apache/doris/pull/38287)

- Enhances the performance of inverted index queries with many conditions  [#35346](https://github.com/apache/doris/pull/35346)

- Automatically enables the   `support_phrase` option when creating a tokenized inverted index to accelerate  `match_phrase` phrase queries [#37949](https://github.com/apache/doris/pull/37949)

- Supports simplified SQL hints, for example: `SELECT /*+ query_timeout(3000) */ * FROM t;` [#37720](https://github.com/apache/doris/pull/37720)

- Automatically retries reading from object storage when encountering a   `429` error to improve stability [#35396](https://github.com/apache/doris/pull/35396)

- LEFT SEMI / ANTI JOIN terminates subsequent matching execution upon matching a qualifying data row to enhance performance. [#34703](https://github.com/apache/doris/pull/34703)

- Prevents coredump when returning illegal data to MySQL results. [#28069](https://github.com/apache/doris/pull/28069)

- Unifies the output of type names in lowercase to maintain compatibility with MySQL and be more friendly to BI tools. [#38521](https://github.com/apache/doris/pull/38521)


You can access the full list through the GitHub [link](https://github.com/apache/doris/compare/2.0.13...2.0.14) , with the key features and improvements highlighted below.

## Credits

Thanks all who contribute to this release:

@ByteYue, @CalvinKirs, @GoGoWen, @HappenLee, @Jibing-Li, @Lchangliang, @LiBinfeng-01, @Mryange, @XieJiann, @Yukang-Lian, @Yulei-Yang, @airborne12, @amorynan, @biohazard4321, @cambyzju, @csun5285, @eldenmoon, @englefly, @freemandealer, @hello-stephen, @hubgeter, @kaijchen, @liaoxin01, @luwei16, @morningman, @morrySnow, @mymeiyi, @qidaye, @sollhui, @starocean999, @w41ter, @wuwenchi, @xiaokang, @xy720, @yujun777, @zclllyybb, @zddr, @zhangstar333, @zhiqiang-hhhh, @zy-kkk, @zzzxl1993