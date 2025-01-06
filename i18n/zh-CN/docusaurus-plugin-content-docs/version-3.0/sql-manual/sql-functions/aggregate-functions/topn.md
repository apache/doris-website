---
{
    "title": "TOPN",
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



## 语法

`topn(expr, INT top_num[, INT space_expand_rate])`

该 topn 函数使用 Space-Saving 算法计算 expr 中的 top_num 个频繁项，结果为频繁项及其出现次数，该结果为近似值

space_expand_rate 参数是可选项，该值用来设置 Space-Saving 算法中使用的 counter 个数
```
counter numbers = top_num * space_expand_rate
```
space_expand_rate 的值越大，结果越准确，默认值为 50

## 举例
```
MySQL [test]> select topn(keyword,10) from keyword_table where date>= '2020-06-01' and date <= '2020-06-19' ;
+------------------------------------------------------------------------------------------------------------+
| topn(`keyword`, 10)                                                                                        |
+------------------------------------------------------------------------------------------------------------+
| a:157, b:138, c:133, d:133, e:131, f:127, g:124, h:122, i:117, k:117                                       |
+------------------------------------------------------------------------------------------------------------+

MySQL [test]> select date,topn(keyword,10,100) from keyword_table where date>= '2020-06-17' and date <= '2020-06-19' group by date;
+------------+-----------------------------------------------------------------------------------------------+
| date       | topn(`keyword`, 10, 100)                                                                      |
+------------+-----------------------------------------------------------------------------------------------+
| 2020-06-19 | a:11, b:8, c:8, d:7, e:7, f:7, g:7, h:7, i:7, j:7                                             |
| 2020-06-18 | a:10, b:8, c:7, f:7, g:7, i:7, k:7, l:7, m:6, d:6                                             |
| 2020-06-17 | a:9, b:8, c:8, j:8, d:7, e:7, f:7, h:7, i:7, k:7                                              |
+------------+-----------------------------------------------------------------------------------------------+
```


