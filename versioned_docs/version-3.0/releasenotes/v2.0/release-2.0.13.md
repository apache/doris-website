---
{
    "title": "Release 2.0.13",
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

Thanks to our community users and developers, about 112 improvements and bug fixes have been made in Doris 2.0.13 version

[Quick Download](https://doris.apache.org/download/)

## Behavior changes

SQL input is treated as multiple statements only when the `CLIENT_MULTI_STATEMENTS` setting is enabled on the client side, enhancing compatibility with MySQL. [#36759](https://github.com/apache/doris/pull/36759)

## New features

- A new BE configuration `allow_zero_date` has been added, allowing dates with all zeros. When set to `false`, `0000-00-00` is parsed as `NULL`, and when set to `true`, it is parsed as `0000-01-01`. The default value is `false` to maintain consistency with previous behavior. [#34961](https://github.com/apache/doris/pull/34961)

- `LogicalWindow` and `LogicalPartitionTopN` support multi-field predicate pushdown to improve performance. [#36828](https://github.com/apache/doris/pull/36828)

- The ES Catalog now maps ES `nested` or `object` types to Doris `JSON` types. [#37101](https://github.com/apache/doris/pull/37101)

## Improvements

- Queries with `LIMIT` end reading data earlier to reduce resource consumption and improve performance. [#36535](https://github.com/apache/doris/pull/36535)

- Special JSON data with empty keys is now supported. [#36762](https://github.com/apache/doris/pull/36762)

- Stability and usability of routine load have been improved, including load balancing, automatic recovery, exception handling, and more user-friendly error messages. [#36450](https://github.com/apache/doris/pull/36450) [#35376](https://github.com/apache/doris/pull/35376) [#35266](https://github.com/apache/doris/pull/35266) [ #33372](https://github.com/apache/doris/pull/33372) [#32282](https://github.com/apache/doris/pull/32282) [#32046](https://github.com/apache/doris/pull/32046) [#32021](https://github.com/apache/doris/pull/32021) [#31846](https://github.com/apache/doris/pull/31846) [#31273](https://github.com/apache/doris/pull/31273)

- BE load balancing selection of hard disk strategy and speed optimization. [#36826](https://github.com/apache/doris/pull/36826) [#36795](https://github.com/apache/doris/pull/36795) [#36509](https://github.com/apache/doris/pull/36509)

- Stability and usability of the JDBC catalog have been improved, including encryption, thread pool connection count configuration, and more user-friendly error messages. [#36940](https://github.com/apache/doris/pull/36940) [#36720](https://github.com/apache/doris/pull/36720) [#30880](https://github.com/apache/doris/pull/30880) [#35692](https://github.com/apache/doris/pull/35692)

You can access the full list through the GitHub [link](https://github.com/apache/doris/compare/2.0.12...2.0.13) , with the key features and improvements highlighted below.

## Credits

Thanks to all who contributed to this release:

@Gabriel39, @Jibing-Li, @Johnnyssc, @Lchangliang, @LiBinfeng-01, @SWJTU-ZhangLei, @Thearas, @Yukang-Lian, @Yulei-Yang, @airborne12, @amorynan, @bobhan1, @cambyzju, @csun5285, @dataroaring, @deardeng, @eldenmoon, @englefly, @feiniaofeiafei, @hello-stephen, @jacktengg, @kaijchen, @liutang123, @luwei16, @morningman, @morrySnow, @mrhhsg, @mymeiyi, @platoneko, @qidaye, @sollhui, @starocean999, @w41ter, @xiaokang, @xy720, @yujun777, @zclllyybb, @zddr