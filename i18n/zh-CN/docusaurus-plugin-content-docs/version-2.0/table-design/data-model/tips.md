---
{
    "title": "使用注意",
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

## 建表时列类型建议

1.  Key 列必须在所有 Value 列之前。

2.  尽量选择整型类型。因为整型类型的计算和查找效率远高于字符串。

3.  对于不同长度的整型类型的选择原则，遵循够用即可。

4.  对于 VARCHAR 和 STRING 类型的长度，遵循够用即可。

## 聚合模型的局限性

这里针对 Aggregate 模型，来介绍下聚合模型的局限性。

在聚合模型中，模型对外展现的，是最终聚合后的数据。也就是说，任何还未聚合的数据（比如说两个不同导入批次的数据），必须通过某种方式，以保证对外展示的一致性。举例说明。

假设表结构如下：

| ColumnName | Type     | AggregationType | Comment      |
| ---------- | -------- | --------------- | ------------ |
| user_id    | LARGEINT |                 | 用户 id       |
| date       | DATE     |                 | 数据灌入日期 |
| cost       | BIGINT   | SUM             | 用户总消费   |

假设存储引擎中有如下两个已经导入完成的批次的数据：

batch 1

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 50   |
| 10002   | 2017/11/21 | 39   |

batch 2

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 1    |
| 10001   | 2017/11/21 | 5    |
| 10003   | 2017/11/22 | 22   |

可以看到，用户 10001 分属在两个导入批次中的数据还没有聚合。但是为了保证用户只能查询到如下最终聚合后的数据：

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 51   |
| 10001   | 2017/11/21 | 5    |
| 10002   | 2017/11/21 | 39   |
| 10003   | 2017/11/22 | 22   |

我们在查询引擎中加入了聚合算子，来保证数据对外的一致性。

另外，在聚合列（Value）上，执行与聚合类型不一致的聚合类查询时，要注意语意。比如在如上示例中执行如下查询：

```Plain
SELECT MIN(cost) FROM table;
```

得到的结果是 5，而不是 1。

同时，这种一致性保证，在某些查询中，会极大地降低查询效率。

以最基本的 count(*) 查询为例：

```Plain
SELECT COUNT(*) FROM table;
```

在其他数据库中，这类查询都会很快地返回结果。因为在实现上，我们可以通过如“导入时对行进行计数，保存 count 的统计信息”，或者在查询时“仅扫描某一列数据，获得 count 值”的方式，只需很小的开销，即可获得查询结果。但是在 Doris 的聚合模型中，这种查询的开销非常大。

以刚才的数据为例：

batch 1

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 50   |
| 10002   | 2017/11/21 | 39   |

batch 2

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 1    |
| 10001   | 2017/11/21 | 5    |
| 10003   | 2017/11/22 | 22   |

因为最终的聚合结果为：

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017/11/20 | 51   |
| 10001   | 2017/11/21 | 5    |
| 10002   | 2017/11/21 | 39   |
| 10003   | 2017/11/22 | 22   |

所以，`select count(*) from table;` 的正确结果应该为 4。但如果只扫描 `user_id` 这一列，如果加上查询时聚合，最终得到的结果是 3（10001, 10002, 10003）。而如果不加查询时聚合，则得到的结果是 5（两批次一共 5 行数据）。可见这两个结果都是不对的。

为了得到正确的结果，必须同时读取 `user_id` 和 `date` 这两列的数据，再加上查询时聚合，才能返回 4 这个正确的结果。也就是说，在 count(\*\) 查询中，_Doris 必须扫描所有的 AGGREGATE KEY 列（这里就是`user_id` `date`），并且聚合后，才能得到语意正确的结果。_ 当聚合列非常多时，count(*) 查询需要扫描大量的数据。

因此，当业务上有频繁的 count(\*\) 查询时，建议用户通过增加一个值恒为 1 的，聚合类型为 SUM 的列来模拟 count(*)。如刚才的例子中的表结构，我们修改如下：

| ColumnName | Type   | AggregateType | Comment       |
| ---------- | ------ | ------------- | ------------- |
| user_id    | BIGINT |               | 用户 id        |
| date       | DATE   |               | 数据灌入日期  |
| cost       | BIGINT | SUM           | 用户总消费    |
| count      | BIGINT | SUM           | 用于计算 count |

增加一个 count 列，并且导入数据中，该列值恒为 1。则 `select count(*) from table;` 的结果等价于 `select sum(count) from table;`。而后者的查询效率将远高于前者。不过这种方式也有使用限制，就是用户需要自行保证，不会重复导入 AGGREGATE KEY 列都相同地行。否则，`select sum(count) from table;` 只能表述原始导入的行数，而不是 `select count(*) from table;` 的语义。

另一种方式，就是将如上的 `count` 列的聚合类型改为 REPLACE，且依然值恒为 1。那么 `select sum(count) from table;` 和 `select count(*) from table;` 的结果将是一致的。并且这种方式，没有导入重复行的限制。

## Unique 模型的写时合并实现

Unique 模型的写时合并实现没有聚合模型的局限性，还是以刚才的数据为例，写时合并为每次导入的 rowset 增加了对应的 delete bitmap，来标记哪些数据被覆盖。第一批数据导入后状态如下

batch 1

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 50   | FALSE      |
| 10002   | 2017/11/21 | 39   | FALSE      |

当第二批数据导入完成后，第一批数据中重复的行就会被标记为已删除，此时两批数据状态如下

batch 1

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 50   | TRUE       |
| 10002   | 2017/11/21 | 39   | FALSE      |

batch 2

| user_id | date       | cost | delete bit |
| ------- | ---------- | ---- | ---------- |
| 10001   | 2017/11/20 | 1    | FALSE      |
| 10001   | 2017/11/21 | 5    | FALSE      |
| 10003   | 2017/11/22 | 22   | FALSE      |

在查询时，所有在 delete bitmap 中被标记删除的数据都不会读出来，因此也无需进行做任何数据聚合，上述数据中有效地行数为 4 行，查询出的结果也应该是 4 行，也就可以采取开销最小的方式来获取结果，即前面提到的“仅扫描某一列数据，获得 count 值”的方式。

在测试环境中，count(*) 查询在 Unique 模型的写时合并实现上的性能，相比聚合模型有 10 倍以上的提升。

## Duplicate 模型

Duplicate 模型没有聚合模型的这个局限性。因为该模型不涉及聚合语意，在做 count(*) 查询时，任意选择一列查询，即可得到语意正确的结果。

## Key 列的不同意义

Duplicate、Aggregate、Unique 模型，都会在建表指定 Key 列，然而实际上是有所区别的：对于 Duplicate 模型，表的 Key 列，可以认为只是 "排序列"，并非起到唯一标识的作用。而 Aggregate、Unique 模型这种聚合类型的表，Key 列是兼顾 "排序列" 和 "唯一标识列"，是真正意义上的 "Key 列"。

## 模型选择建议

因为数据模型在建表时就已经确定，且无法修改。所以，选择一个合适的数据模型非常重要。

1.  Aggregate 模型可以通过预聚合，极大地降低聚合查询时所需扫描的数据量和查询的计算量，非常适合有固定模式的报表类查询场景。但是该模型对 count(*) 查询很不友好。同时因为固定了 Value 列上的聚合方式，在进行其他类型的聚合查询时，需要考虑语意正确性。

2.  Unique 模型针对需要唯一主键约束的场景，可以保证主键唯一性约束。但是无法利用 ROLLUP 等预聚合带来的查询优势。对于聚合查询有较高性能需求的用户，推荐使用自 1.2 版本加入的写时合并实现。

3.  Duplicate 适合任意维度的 Ad-hoc 查询。虽然同样无法利用预聚合的特性，但是不受聚合模型的约束，可以发挥列存模型的优势（只读取相关列，而不需要读取所有 Key 列）。

4. 如果有部分列更新的需求，请查阅文档[主键模型部分列更新](../../data-operate/update/update-of-unique-model) 与 [聚合模型部份列更新](../../data-operate/update/update-of-aggregate-model) 获取相关使用建议。