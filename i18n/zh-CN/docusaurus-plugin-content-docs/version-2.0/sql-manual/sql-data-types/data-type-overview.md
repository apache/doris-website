---
{
    "title": "数据类型概览",
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



## 数值类型

包括以下 4 种：

**1. BOOLEAN 类型：** 

两种取值，0 代表 false，1 代表 true。更多信息参考 [BOOLEAN 文档](../../sql-manual/sql-data-types/numeric/BOOLEAN.md)。

**2. 整数类型：** 

都是有符号整数，xxINT 的差异是占用字节数和表示范围

- TINYINT 占 1 字节，范围 [-128, 127], 更多信息参考 [TINYINT 文档](../../sql-manual/sql-data-types/numeric/TINYINT.md)。

- SMALLINT 占 2 字节，范围 [-32768, 32767], 更多信息参考 [SMALLINT 文档](../../sql-manual/sql-data-types/numeric/SMALLINT.md)。

- INT 占 4 字节，范围 [-2147483648, 2147483647], 更多信息参考 [INT 文档](../../sql-manual/sql-data-types/numeric/INT.md)。

- BIGINT 占 8 字节，范围 [-9223372036854775808, 9223372036854775807], 更多信息参考 [BIGINT 文档](../../sql-manual/sql-data-types/numeric/BIGINT.md)。

- LARGEINT 占 16 字节，范围 [-2^127, 2^127 - 1], 更多信息参考 [LARGEINT 文档](../../sql-manual/sql-data-types/numeric/LARGEINT.md)。

**3. 浮点数类型：** 

不精确的浮点数类型 FLOAT 和 DOUBLE，和常见编程语言中的 float 和 double 对应。更多信息参考 [FLOAT](../../sql-manual/sql-data-types/numeric/FLOAT.md)、[DOUBLE](../../sql-manual/sql-data-types/numeric/DOUBLE.md) 文档。

**4. 定点数类型：** 

精确的定点数类型 DECIMAL，用于金融等精度要求严格准确的场景。更多信息参考 [DECIMAL](../../sql-manual/sql-data-types/numeric/DECIMAL.md) 文档。


## 日期类型

日期类型包括 DATE、TIME 和 DATETIME，DATE 类型只存储日期精确到天，DATETIME 类型存储日期和时间，可以精确到微秒。TIME 类型只存储时间，且**暂时不支持建表存储，只能在查询过程中使用**。

对日期类型进行计算，或将其转换为数字，请使用类似 [TIME_TO_SEC](../../sql-functions/date-time-functions/time-to-sec), [DATE_DIFF](../../sql-functions/date-time-functions/datediff), [UNIX_TIMESTAMP](../../sql-functions/date-time-functions/unix-timestamp) 等函数，直接将其 CAST 为数字类型的结果不受保证。在未来的版本中，此类 CAST 行为将会被禁止。

更多信息参考 [DATE](../../sql-manual/sql-data-types/date-time/DATE)、[TIME](../../sql-manual/sql-data-types/date-time/TIME) 和 [DATETIME](../../sql-manual/sql-data-types/date-time/DATETIME) 文档。


## 字符串类型

字符串类型支持定长和不定长，总共有以下 3 种：

1. [CHAR(M)](../../sql-manual/sql-data-types/string/CHAR.md)：定长字符串，固定长度 M 字节，M 的范围是 [1, 255]。

2. [VARCHAR(M)](../../sql-manual/sql-data-types/string/VARCHAR.md)：不定长字符串，M 是最大长度，M 的范围是 [1, 65533]。

3. [STRING](../../sql-manual/sql-data-types/string/STRING.md)：不定长字符串，默认最长 1048576 字节（1MB），可调大到 2147483643 字节（2GB），BE 配置 string_type_length_soft_limit_bytes。

## 半结构化类型

针对 JSON 半结构化数据，支持 3 类不同场景的半结构化数据类型：

1. 支持嵌套的固定 schema，适合分析的数据类型 **[ARRAY](../../sql-manual/sql-data-types/semi-structured/ARRAY.md)、 [MAP](../../sql-manual/sql-data-types/semi-structured/MAP.md) [STRUCT](../../sql-manual/sql-data-types/semi-structured/STRUCT.md)**：常用于用户行为和画像分析，湖仓一体查询数据湖中 Parquet 等格式的数据等场景。由于 schema 相对固定，没有动态 schema 推断的开销，写入和分析性能很高。

2. 支持嵌套的不固定 schema，适合分析的数据类型 **[VARIANT](../../sql-manual/sql-data-types/semi-structured/VARIANT.md)**：常用于 Log, Trace, IoT 等分析场景，schema 灵活可以写入任何合法的 JSON 数据，并自动展开成子列采用列式存储，存储压缩率高，聚合 过滤 排序等分析性能很好。

3. 支持嵌套的不固定 schema，适合点查的数据类型 **[JSON](../../sql-manual/sql-data-types/semi-structured/JSON.md)**：常用于高并发点查场景，schema 灵活可以写入任何合法的 JSON 数据，采用二进制格式存储，提取字段的性能比普通 JSON String 快 2 倍以上。

## 聚合类型

聚合类型存储聚合的结果或者中间状态，用于加速聚合查询，包括下面几种：

1. [BITMAP](../../sql-manual/sql-data-types/aggregate/BITMAP.md)：用于精确去重，如 UV 统计，人群圈选等场景。配合 bitmap_union、bitmap_union_count、bitmap_hash、bitmap_hash64 等 BITMAP 函数使用。

2. [HLL](../../sql-manual/sql-data-types/aggregate/HLL.md)：用于近似去重，性能优于 COUNT DISTINCT。配合  hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash 等 HLL 函数使用。

3. [QUANTILE_STATE](../../sql-manual/sql-data-types/aggregate/QUANTILE_STATE.md)：用于分位数近似计算，性能优于 PERCENTILE。配合 QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE 等函数使用。

4. [AGG_STATE](../../sql-manual/sql-data-types/aggregate/AGG_STATE.md)：用于聚合计算加速，配合 state/merge/union 聚合函数组合器使用。


## IP 类型

IP 类型以二进制形式存储 IP 地址，比用字符串存储更省空间查询速度更快，支持 2 种类型：

1. [IPv4](../../sql-manual/sql-data-types/ip/IPV4.md)：以 4 字节二进制存储 IPv4 地址，配合 ipv4_* 系列函数使用。

2. [IPv6](../../sql-manual/sql-data-types/ip/IPV6.md)：以 16 字节二进制存储 IPv6 地址，配合 ipv6_* 系列函数使用。
