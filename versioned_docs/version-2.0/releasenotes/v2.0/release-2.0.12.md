---
{
    "title": "Release 2.0.12",
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

Thanks to our community developers and users for their contributions. Doris version 2.0.12 will bring 99 improvements and bug fixes.

**Quick Download:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## Behavior changes

- No longer set the default table comment to the table type. Instead, set it to be empty by default, for example, change COMMENT 'OLAP' to COMMENT ' '.  This new behavior is more friendly for BI software that relies on table comments. [#35855](https://github.com/apache/doris/pull/35855)

- Change the type of the `@@autocommit` variable from `BOOLEAN` to `BIGINT` to prevent errors from certain MySQL clients (such as .NET MySQL.Data). [#33282](https://github.com/apache/doris/pull/33282)


## Improvements

- Remove the `disable_nested_complex_type` parameter and allow the creation of nested `ARRAY`, `MAP`, and `STRUCT` types by default. [#36255](https://github.com/apache/doris/pull/36255)

- The HMS catalog supports the `SHOW CREATE DATABASE` command. [#28145](https://github.com/apache/doris/pull/28145)

- Add more inverted index metrics to the query profile. [#36545](https://github.com/apache/doris/pull/36545)

- Cross-Cluster Replication (CCR) supports inverted indices. [#31743](https://github.com/apache/doris/pull/31743)

You can access the full list through the GitHub [link](https://github.com/apache/doris/compare/2.0.11...2.0.12) , with the key features and improvements highlighted below.



## Credits

Thanks all who contribute to this release:

@airborne12, D14@amorynan, D14@BiteTheDDDDt, D14@cambyzju, D14@caoliang-web, D14@dataroaring, D14@eldenmoon, D14@feiniaofeiafei, D14@felixwluo, D14@gavinchou, D14@HappenLee, D14@hello-stephen, D14@jacktengg, D14@Jibing-Li, D14@Johnnyssc, D14@liaoxin01, D14@LiBinfeng-01, D14@luwei16, D14@mongo360, D14@morningman, D14@morrySnow, D14@mrhhsg, D14@Mryange, D14@mymeiyi, D14@qidaye, D14@qzsee, D14@starocean999, D14@w41ter, D14@wangbo, D14@wsjz, D14@wuwenchi, D14@xiaokang, D14@XuPengfei-1020, D14@xy720, D14@yongjinhou, D14@yujun777, D14@Yukang-Lian, D14@Yulei-Yang, D14@zclllyybb, D14@zddr, D14@zhannngchen, D14@zhiqiang-hhhh, D14@zy-kkk, D14@zzzxl1993