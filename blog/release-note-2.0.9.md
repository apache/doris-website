---
{
    'title': 'Apache Doris version 2.0.9 has been released',
    'description': 'Thanks to our community users and developers, about 68 improvements and bug fixes have been made in Doris 2.0.9 version.',
    'date': '2024-04-23',
    'author': 'Apache Doris',
    'tags': ['Release Notes'],
    "image": '/images/2.0.9.png'
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



Thanks to our community users and developers, about 68 improvements and bug fixes have been made in Doris 2.0.9 version.

- **Quick Download** : [https://doris.apache.org/download/](https://doris.apache.org/download/)

- **GitHub** : [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)


## 1 Behavior change

NA

## 2 New features

- Support predicate apprear both on key and value mv column

- Support mv with `bitmap_union(bitmap_from_array())`

- Add a FE config to force replicate allocation for OLAP tables in the cluster

- Support date literal support timezone in new optimizer Nereids

- Support slop in fulltext search `match_phrase` to specify word distence

- Show index id in `SHOW PROC INDEXES`

## 3 Improvement and optimizations

- Sdd a secondary argument in `first_value` / `last_value` to ignore NULL values

- the offset params in `LEAD`/ `LAG` function could use 0

- Adjust priority of materialized view match rule

- TopN opt reads only limit number of records for better performance

- Add profile for delete_bitmap get_agg function

- Refine the Meta cache to get better performance

- Add FE config `autobucket_max_buckets`

See the complete list of improvements and bug fixes on [GitHub](https://github.com/apache/doris/compare/2.0.8...2.0.9) .
