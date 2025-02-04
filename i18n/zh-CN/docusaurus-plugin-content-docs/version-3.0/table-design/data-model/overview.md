---
{
    "title": "模型概述",
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

在 Doris 中建表时需要指定表模型，以定义数据存储与管理方式。在 Doris 中提供了明细模型、聚合模型以及主键模型三种表模型，可以应对不同的应用场景需求。不同的表模型具有相应的数据去重、聚合及更新机制。选择合适的表模型有助于实现业务目标，同时保证数据处理的灵活性和高效性。

## 表模型分类

在 Doris 中支持三种表模型：

* 明细模型（Duplicate Key Model）：允许指定的 Key 列重复，Doirs 存储层保留所有写入的数据，适用于必须保留所有原始数据记录的情况；

* 主键模型（Unique Key Model）：每一行的 Key 值唯一，可确保给定的 Key 列不会存在重复行，Doris 存储层对每个 key 只保留最新写入的数据，适用于数据更新的情况；

* 聚合模型（Aggregate Key Model）：可根据 Key 列聚合数据，Doris 存储层保留聚合后的数据，从而可以减少存储空间和提升查询性能；通常用于需要汇总或聚合信息（如总数或平均值）的情况。

在建表后，表模型的属性已经确认，无法修改。针对业务选择合适的模型至关重要：

* Aggregate 模型可以通过预聚合，极大地降低聚合查询时所需扫描的数据量和查询的计算量，非常适合有固定模式的报表类查询场景。但是该模型对 count(*) 查询很不友好。同时因为固定了 Value 列上的聚合方式，在进行其他类型的聚合查询时，需要考虑语意正确性。

* Unique 模型针对需要唯一主键约束的场景，可以保证主键唯一性约束。但是无法利用 ROLLUP 等预聚合带来的查询优势。对于聚合查询有较高性能需求的用户，推荐使用自 1.2 版本加入的写时合并实现。

* Duplicate 适合任意维度的 Ad-hoc 查询。虽然同样无法利用预聚合的特性，但是不受聚合模型的约束，可以发挥列存模型的优势（只读取相关列，而不需要读取所有 Key 列）。

* 如果有部分列更新的需求，请查阅文档[主键模型部分列更新](../../data-operate/update/update-of-aggregate-model)与[聚合模型部份列更新](../../data-operate/update/update-of-aggregate-model)获取相关使用建议。

## 排序键

在 Doris 中，数据以列的形式存储，一张表可以分为 key 列与 value 列。其中，key 列用于分组与排序，value 列用于参与聚合。Key 列可以是一个或多个字段，在建表时，按照各种表模型中，Aggregate Key、Unique Key 和 Duplicate Key 的列进行数据排序存储。

不同的表模型都需要在建表时指定 Key 列，分别有不同的意义：对于 Duplicate Key 模型，Key 列表示排序，没有唯一键的约束。在 Aggregate Key 与 Unique Key 模型中，会基于 Key 列进行聚合，Key 列既有排序的能力，又有唯一键的约束。

合理使用排序键可以带来以下收益：

* **加速查询性能**：排序键有助于减少数据扫描量。对于范围查询或过滤查询，可以利用排序键直接定位数据的位置。对于需要需要进行排序的查询，也可以利用排序键进行排序加速；

* **数据压缩优化**：数据按排序键有序存储会提高压缩的效率，相似的数据会聚集在一起，压缩率会大幅度提高，从而减小数据的存储空间。

* **减少去重成本**：当使用 `UNIQUE KEY` 表时，通过排序键，Doris 能更有效地进行去重操作，保证数据唯一性。

选择排序键时，可以遵循以下建议：

* Key 列必须在所有 Value 列之前。

* 尽量选择整型类型。因为整型类型的计算和查找效率远高于字符串。

* 对于不同长度的整型类型的选择原则，遵循够用即可。

* 对于 VARCHAR 和 STRING 类型的长度，遵循够用即可。

## 表模型能力对比

|           | 明细模型          | 主键模型 | 聚合模型 |
| --------- | ------------- | ---- | ---- |
| Key 列唯一约束 | 不支持，Key 列可以重复 | 支持   | 支持   |
| 同步物化视图    | 支持            | 支持   | 支持   |
| 异步物化视图    | 支持            | 支持   | 支持   |
| UPDATE 语句 | 不支持           | 支持   | 不支持  |
| DELETE 语句 | 部分支持          | 支持   | 不支持  |
| 导入时整行更新   | 不支持           | 支持   | 不支持  |
| 导入时部分列更新  | 不支持           | 支持   | 部分支持 |
