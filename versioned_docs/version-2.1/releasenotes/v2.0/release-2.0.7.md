---
{
    "title": "Release 2.0.7",
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

  

Thanks to our community users and developers, about 80 improvements and bug fixes have been made in Doris 2.0.7 version.

**Quick Download:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 1 Behavior change

- `round` function defaults to rounding normally as MySQL, eg. round(5/2) return 3 instead of 2.
  
  - https://github.com/apache/doris/pull/31583

- `round` datetime with scale from string literal as MySQL, eg. round '2023-10-12 14:31:49.666' to '2023-10-12 14:31:50' .

  - https://github.com/apache/doris/pull/27965 


## 2 New features
- Support make miss slot as null alias when converting outer join to anti join to speed up query

  - https://github.com/apache/doris/pull/31854

- Enable proxy protocol to support IP transparency for Nginx and HAProxy.

  - https://github.com/apache/doris/pull/32338


## 3 Improvement and optimizations

- Add DEFAULT_ENCRYPTION column in `information_schema` table and add `processlist` table for better compatibility for BI tools

- Automatically test connectivity by default when creating a JDBC Catalog.

- Enhance auto resume to keep routine load stable

- Use lowercase by default for Chinese tokenizer in inverted index

- Add error msg if exceeded maximum default value in repeat function

- Skip hidden file and dir in Hive table

- Reduce file meta cache size and disable cache for some cases to avoid OOM

- Reduce jvm heap memory consumed by profiles of BrokerLoadJob

- Remove sort which is under table sink to speed up query like `INSERT INTO t1 SELECT * FROM t2 ORDER BY k`.

See the complete list of improvements and bug fixes on [github](https://github.com/apache/doris/compare/2.0.6...2.0.7) .


## 4 Credits

Thanks all who contribute to this release:

924060929,airborne12,amorynan,ByteYue,dataroaring,deardeng,feiniaofeiafei,felixwluo,freemandealer,gavinchou,hello-stephen,HHoflittlefish777,jacktengg,jackwener,jeffreys-cat,Jibing-Li,KassieZ,LiBinfeng-01,luwei16,morningman,mrhhsg,Mryange,nextdreamblue,platoneko,qidaye,rohitrs1983,seawinde,shuke987,starocean999,SWJTU-ZhangLei,w41ter,wsjz,wuwenchi,xiaokang,XieJiann,XuJianxu,yujun777,Yulei-Yang,zhangstar333,zhiqiang-hhhh,zy-kkk,zzzxl1993