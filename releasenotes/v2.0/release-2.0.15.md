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
                                                                                                                                                   
## 1 New features 

- Adds a REST interface to retrieve the most recent query profile: `curl http://user:password@127.0.0.1:8030/api/profile/text`.[#38268](https://github.com/apache/doris/pull/38268)
                                                                                                                                                               
## 2 Improvements 
                                                                                                                           
- Optimizes the primary key point query performance for MOW tables with sequence columns.[#38287](https://github.com/apache/doris/pull/38287)

- Enhances the performance of inverted index queries with many conditions. [#35346](https://github.com/apache/doris/pull/35346)
                                                                                                                 
- Automatically enables the `support_phrase` option when creating a tokenized inverted index to accelerate `match_phrase` phrase queries.[#37949](https://github.com/apache/doris/pull/37949)

- Supports simplified SQL hints, for example: `SELECT /*+ query_timeout(3000) */ * FROM t;`. [#37720](https://github.com/apache/doris/pull/37720)

- Automatically retries reading from object storage when encountering a `429` error to improve stability.[#35396](https://github.com/apache/doris/pull/35396)

- LEFT SEMI / ANTI JOIN terminates subsequent matching execution upon matching a qualifying data row to enhance performance. [#34703](https://github.com/apache/doris/pull/34703)

- Prevents coredump when returning illegal data to MySQL results. [#28069](https://github.com/apache/doris/pull/28069) 

- Unifies the output of type names in lowercase to maintain compatibility with MySQL and be more friendly to BI tools. [38521](https://github.com/apache/doris/pull/38521) 
                                                                                                                                                               
## Credits 
   
Thanks all who contribute to this release:  

@924060929, @BePPPower, @BiteTheDDDDt, @CalvinKirs, @GoGoWen, @HappenLee, @Jibing-Li, @Johnnyssc,@LiBinfeng-01,@Mryange, @SWJTU-ZhangLei,@TangSiyang2001, @Toms1999, @Vallishp, @Yukang-Lian, @airborne12, @amorynan, @bobhan1, @cambyzju, @csun5285, @dataroaring, @eldenmoon, @englefly, @feiniaofeiafei,@hello-stephen, @htyoung, @hubgeter, @justfortaste, @liaoxin01, @liugddx, @liutang123, @luwei16, @mongo360,@morrySnow, @qidaye, @smallx, @sollhui, @starocean999, @w41ter, @xiaokang, @xzj7019, @yujun777, @zclllyybb, @zddr, @zhangstar333,@zhannngchen, @zy-kkk, @zzzxl1993