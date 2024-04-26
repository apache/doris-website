---
{
    "title": "索引概述",
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

索引用于帮助快速过滤或查找数据。目前 Doris 主要支持两类索引，内建智能索引和用户创建的二级索引。

## 内建智能索引

-   排序键与前缀索引：Apache Doris 按照排序键以有序的方式存储数据。它为每 1024 行数据创建一个前缀索引。索引中的 Key 是当前 1024 行中第一行中排序列的值。如果查询涉及已排序列，系统将找到相关 1024 行组的第一行并从那里开始扫描。

-   ZoneMap 索引：其中 ZoneMap 索引是在列存格式上，对每一列自动维护的索引信息，包括 Min/Max值等。这种索引对用户透明。这些是段和页面级别的索引。Page 内每列的最大值和最小值将被记录，Segment 内的每一列的最大值和最小值也会被记录。因此，在等价查询和范围查询中，系统可以借助这种 Min/Max 索引来缩小过滤范围。

## 用户创建的二级索引

-   布隆过滤器索引（BloomFilter Index）

-   N-Gram 索引（N-Gram BloomFilter Index）

-   位图索引（Bitmap Index）

-   倒排索引（Inverted Index）