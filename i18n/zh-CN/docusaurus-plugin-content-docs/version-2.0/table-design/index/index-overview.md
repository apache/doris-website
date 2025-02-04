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

数据库索引是用于查询加速的，为了加速不同的查询场景，Apache Doris 支持了多种丰富的索引。


## 索引分类和原理

从加速的查询和原理来看，Apache Doris 的索引分为点查索引和跳数索引两大类。
- 点查索引：常用于加速点查，原理是通过索引定位到满足 WHERE 条件的有哪些行，直接读取那些行。点查索引在满足条件的行比较少时效果很好。Apache Doris 的点查索引包括前缀索引和倒排索引。
  - 前缀索引：Apache Doris 按照排序键以有序的方式存储数据，并每隔 1024 行数据创建一个稀疏前缀索引。索引中的 Key 是当前 1024 行中第一行中排序列的值。如果查询涉及已排序列，系统将找到相关 1024 行组的第一行并从那里开始扫描。
  - 倒排索引：对创建了倒排索引的列，建立每个值到对应行号集合的倒排表。对于等值查询，先从倒排表中查到行号集合，然后直接读取对应行的数据，而不用逐行扫描匹配数据，从而减少 I/O 加速查询。倒排索引还能加速范围过滤、文本关键词匹配，算法更加复杂但是基本原理类似。（备注：之前的 BITMAP 索引已经被更强的倒排索引取代）
- 跳数索引：常用于加速分析，原理是通过索引确定不满足 WHERE 条件的数据块，跳过这些不满足条件的数据块，只读取可能满足条件的数据块并再进行一次逐行过滤，最终得到满足条件的行。跳数索引在满足条件的行比较多时效果较好。Apache Doris 的跳数索引包括 ZoneMap 索引、BloomFilter 索引、NGram BloomFilter 索引。
  - ZoneMap 索引：自动维护每一列的统计信息，为每一个数据文件（Segment）和数据块（Page）记录最大值、最小值、是否有 NULL。对于等值查询、范围查询、IS NULL，可以通过最大值、最小值、是否有 NULL 来判断数据文件和数据块是否可以包含满足条件的数据，如果没有则跳过不读对应的文件或数据块减少 I/O 加速查询。
  - BloomFilter 索引：将索引对应列的可能取值存入 BloomFilter 数据结构中，它可以快速判断一个值是否在 BloomFilter 里面，并且 BloomFilter 存储空间占用很低。对于等值查询，如果判断这个值不在 BloomFilter 里面，就可以跳过对应的数据文件或者数据块减少 I/O 加速查询。
  - NGram BloomFilter 索引：用于加速文本 LIKE 查询，基本原理与 BloomFilter 索引类似，只是存入 BloomFilter 的不是原始文本的值，而是对文本进行 NGram 分词，每个词作为值存入 BloomFilter。对于 LIKE 查询，将 LIKE 的 pattern 也进行 NGram 分词，判断每个词是否在 BloomFilter 中，如果某个词不在则对应的数据文件或者数据块就不满足 LIKE 条件，可以跳过这部分数据减少 I/O 加速查询。

上述索引中，前缀索引和 ZoneMap 索引是 Apache Doris 自动维护的内建智能索引，无需用户管理，而倒排索引、BloomFilter 索引、NGram BloomFilter 索引则需要用户自己根据场景选择，手动创建、删除。


- 各种类型索引特点对比

| 类型    | 索引                   | 优点                                      | 局限                            |
|--------|------------------------|------------------------------------------|--------------------------------|
| 点查索引 | 前缀索引                | 内置索引，性能最好                          | 一个表只有一组前缀索引             |
| 点查索引 | 倒排索引                | 支持分词和关键词匹配，任意列可建索引，多条件组合，持续增加函数加速 | 索引存储空间较大，与原始数据相当  |
| 跳数索引 | ZoneMap 索引           | 内置索引，索引存储空间小                     | 支持的查询类型少，只支持等于、范围   |
| 跳数索引 | BloomFilter 索引       | 比 ZoneMap 更精细，索引空间中等              | 支持的查询类型少，只支持等于        |
| 跳数索引 | NGram BloomFilter 索引 | 支持 LIKE 加速，索引空间中等                 | 支持的查询类型少，只支持 LIKE 加速  |


- 索引加速的运算符和函数列表

| 运算符 / 函数             | 前缀索引 | 倒排索引  | ZoneMap 索引 | BloomFilter 索引 | NGram BloomFilter 索引 |
|-------------------------|---------|---------|--------------|-----------------|------------------------|
| =                       | YES     | YES     | YES          | YES             | NO                     |
| !=                      | YES     | YES     | NO           | NO              | NO                     |
| IN                      | YES     | YES     | YES          | YES             | NO                     |
| NOT IN                  | YES     | YES     | NO           | NO              | NO                     |
| >, >=, <, <=, BETWEEN   | YES     | YES     | YES          | NO              | NO                     |
| IS NULL                 | YES     | YES     | YES          | NO              | NO                     |
| IS NOT NULL             | YES     | YES     | NO           | NO              | NO                     |
| LIKE                    | NO      | NO      | NO           | NO              | YES                    |
| MATCH, MATCH_*          | NO      | YES     | NO           | NO              | NO                     |


## 索引设计指南

数据库表的索引设计和优化跟数据特点和查询很相关，需要根据实际场景测试和优化。虽然没有 "银弹"，Apache Doris 仍然不断努力降低用户使用索引的难度，用户可以根据下面的简单建议原则进行索引选择和测试。

1. 最频繁使用的过滤条件指定为 Key 自动建前缀索引，因为它的过滤效果最好，但是一个表只能有一个前缀索引，因此要用在最频繁的过滤条件上
2. 对非 Key 字段如有过滤加速需求，首选建倒排索引，因为它的适用面广，可以多条件组合，次选下面两种索引：
  - 有字符串 LIKE 匹配需求，再加一个 NGram BloomFilter 索引
  - 对索引存储空间很敏感，将倒排索引换成 BloomFilter 索引
3. 如果性能不及预期，通过 QueryProfile 分析索引过滤掉的数据量和消耗的时间，具体参考各个索引的详细文档
