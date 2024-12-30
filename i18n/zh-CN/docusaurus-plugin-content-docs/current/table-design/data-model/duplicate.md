---
{
    "title": "明细模型",
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

在明细模型是 Doris 中默认建表的模型，可以使用明细模型保存每一条原始数据记录。在建表时指定的 Duplicate Key，以指明数据存储按照哪些列进行排序，可以用于优化常用查询。一般建议选择三列以下的列作为排序键，具体选择方式参考[排序键](../index/prefix-index)。明细模型有以下特点：

* 保留原始数据：明细模型保留了全量的原始数据，适合于存储与查询原始数据。对于后期希望做详细数据分析的应用场景，建议使用明细模型，避免数据丢失的风险；

* 不去重也不聚合：与聚合模型与主键模型不同，明细模型不会对数据进行去重与聚合操作。每次数据插入时，即使两条相同的数据，都会被完整保留；

* 灵活的数据查询：明细模型保留了全量的原始数据，可以从完整数据中提取细节，基于全量数据做任意维度的聚合操作，从而进行元数数据的审计及细粒度的分析。

## 使用场景

一般明细模型中的数据只进行追加，旧数据不会更新。明细模型一般用于需要全量原始数据的场景：

* 日志存储：用于存储各类的程序操作日志，如访问日志、错误日志等。每一条数据都需要被详细记录，方便后续的审计与分析；

* 用户行为数据：在分析用户行为时，如点击数据、用户访问轨迹等，需要保留用户的详细行为，方便后续构建用户画像及对行为路径进行详细分析；

* 交易数据：在某些存储交易行为或订单数据时，交易结束时一般不会发生数据变更。明细模型适合保留这一类交易信息，不遗漏任意一笔记录，方便对交易进行精确的对账。

## 建表说明

在建表时，可以通过 `DUPLICATE KEY` 关键字指定明细模型。明细表必须指定数据的 Key 列，用于在存储时对数据进行排序。下例的明细表中存储了日志信息，并针对于 `log_time`、`log_type` 及 `error_code` 三列进行了排序：

![columnar_storage](/images/table-desigin/columnar-storage.png)

```sql
CREATE TABLE IF NOT EXISTS example_tbl_duplicate
(
    log_time        DATETIME       NOT NULL,
    log_type        INT            NOT NULL,
    error_code      INT,
    error_msg       VARCHAR(1024),
    op_id           BIGINT,
    op_time         DATETIME
)
DUPLICATE KEY(log_time, log_type, error_code)
DISTRIBUTED BY HASH(log_type) BUCKETS 10;
```

## 数据插入与存储

在明细表中，数据不进行去重与聚合，插入数据即存储数据。明细模型中 Key 列指做为排序。

![columnar_storage](/images/table-desigin/duplicate-table-insert.png)

如在上例中，表中原有 4 行数据，在插入 2 行数据后，以追加（APPEND）的方式插入到表中，明细表存储共 6 行数据：

```sql
-- 4 rows raw data
INSERT INTO example_tbl_duplicate VALUES
('2024-11-01 00:00:00', 2, 2, 'timeout', 12, '2024-11-01 01:00:00'),
('2024-11-02 00:00:00', 1, 2, 'success', 13, '2024-11-02 01:00:00'),
('2024-11-03 00:00:00', 2, 2, 'unknown', 13, '2024-11-03 01:00:00'),
('2024-11-04 00:00:00', 2, 2, 'unknown', 12, '2024-11-04 01:00:00');

-- insert into 2 rows
INSERT INTO example_tbl_duplicate VALUES
('2024-11-01 00:00:00', 2, 2, 'timeout', 12, '2024-11-01 01:00:00'),
('2024-11-01 00:00:00', 2, 2, 'unknown', 13, '2024-11-01 01:00:00');

-- check the rows of table
SELECT * FROM example_tbl_duplicate;
+---------------------+----------+------------+-----------+-------+---------------------+
| log_time            | log_type | error_code | error_msg | op_id | op_time             |
+---------------------+----------+------------+-----------+-------+---------------------+
| 2024-11-02 00:00:00 |        1 |          2 | success   |    13 | 2024-11-02 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | timeout   |    12 | 2024-11-01 01:00:00 |
| 2024-11-03 00:00:00 |        2 |          2 | unknown   |    13 | 2024-11-03 01:00:00 |
| 2024-11-04 00:00:00 |        2 |          2 | unknown   |    12 | 2024-11-04 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | unknown   |    13 | 2024-11-01 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | timeout   |    12 | 2024-11-01 01:00:00 |
+---------------------+----------+------------+-----------+-------+---------------------+
```

