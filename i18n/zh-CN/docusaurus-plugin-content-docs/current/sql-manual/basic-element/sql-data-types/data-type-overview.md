---
{
    "title": "数据类型概览",
    "language": "zh-CN",
    "description": "包括以下 4 种："
}
---

## 数值类型

包括以下 4 种：

**1. BOOLEAN 类型：** 

两种取值，0 代表 false，1 代表 true。更多信息参考 [BOOLEAN 文档](../../basic-element/sql-data-types/numeric/BOOLEAN.md)。

**2. 整数类型：** 

都是有符号整数，xxINT 的差异是占用字节数和表示范围

- TINYINT 占 1 字节，范围 [-128, 127], 更多信息参考 [TINYINT 文档](../../basic-element/sql-data-types/numeric/TINYINT.md)。

- SMALLINT 占 2 字节，范围 [-32768, 32767], 更多信息参考 [SMALLINT 文档](../../basic-element/sql-data-types/numeric/SMALLINT.md)。

- INT 占 4 字节，范围 [-2147483648, 2147483647], 更多信息参考 [INT 文档](../../basic-element/sql-data-types/numeric/INT.md)。

- BIGINT 占 8 字节，范围 [-9223372036854775808, 9223372036854775807], 更多信息参考 [BIGINT 文档](../../basic-element/sql-data-types/numeric/BIGINT.md)。

- LARGEINT 占 16 字节，范围 [-2^127, 2^127 - 1], 更多信息参考 [LARGEINT 文档](../../basic-element/sql-data-types/numeric/LARGEINT.md)。

**3. 浮点数类型：** 

不精确的浮点数类型 FLOAT 和 DOUBLE，和常见编程语言中的 float 和 double 对应。更多信息参考 [FLOAT](../../basic-element/sql-data-types/numeric/FLOATING-POINT.md)、[DOUBLE](../../basic-element/sql-data-types/numeric/FLOATING-POINT.md) 文档。

**4. 定点数类型：** 

精确的定点数类型 DECIMAL，用于金融等精度要求严格准确的场景。更多信息参考 [DECIMAL](../../basic-element/sql-data-types/numeric/DECIMAL.md) 文档。


## 日期类型

日期类型包括 DATE、TIME、DATETIME 和 TIMESTAMPTZ，DATE 类型只存储日期精确到天，DATETIME 类型存储日期和时间，可以精确到微秒。TIME 类型只存储时间，且**暂时不支持建表存储，只能在查询过程中使用**。TIMESTAMPTZ 是带时区信息的日期时间类型，存储时转换为 UTC 时间，查询时根据会话时区自动转换显示。

对日期类型进行计算，或将其转换为数字，请使用类似 [TIME_TO_SEC](../../sql-functions/scalar-functions/date-time-functions/time-to-sec), [DATE_DIFF](../../sql-functions/scalar-functions/date-time-functions/datediff), [UNIX_TIMESTAMP](../../sql-functions/scalar-functions/date-time-functions/unix-timestamp) 等函数，直接将其 CAST 为数字类型的结果不受保证。在未来的版本中，此类 CAST 行为将会被禁止。

更多信息参考 [DATE](../../basic-element/sql-data-types/date-time/DATE)、[TIME](../../basic-element/sql-data-types/date-time/TIME)、[DATETIME](../../basic-element/sql-data-types/date-time/DATETIME) 和 [TIMESTAMPTZ](../../basic-element/sql-data-types/date-time/TIMESTAMPTZ) 文档。


## 字符串类型

字符串类型支持定长和不定长，总共有以下 3 种：

1. [CHAR(M)](./string-type/CHAR)：定长字符串，固定长度 M 字节，M 的范围是 [1, 255]。

2. [VARCHAR(M)](./string-type/VARCHAR)：不定长字符串，M 是最大长度，M 的范围是 [1, 65533]。

3. [STRING](./string-type/STRING)：不定长字符串，默认最长 1048576 字节（1MB），可调大到 2147483643 字节（2GB），BE 配置 string_type_length_soft_limit_bytes。


## 二进制类型

1. [VARBINARY](./binary-type/VARBINARY)：变长二进制字节序列，M 为最大长度（单位：字节）。与 VARCHAR 类似，但按字节序存储与比较，不涉及字符集或排序规则，适合存储任意二进制数据（如文件片段、加密数据、压缩数据等）。自 4.0 起支持，当前不支持建表和存储，可以结合Catalog 映射其他数据库的BINARY到DORIS中使用。

## 半结构化类型

针对 JSON 半结构化数据，支持 3 类不同场景的半结构化数据类型：

1. 支持嵌套的固定 schema，适合分析的数据类型 **[ARRAY](../../basic-element/sql-data-types/semi-structured/ARRAY.md)、 [MAP](../../basic-element/sql-data-types/semi-structured/MAP.md) [STRUCT](../../basic-element/sql-data-types/semi-structured/STRUCT.md)**：常用于用户行为和画像分析，湖仓一体查询数据湖中 Parquet 等格式的数据等场景。由于 schema 相对固定，没有动态 schema 推断的开销，写入和分析性能很高。

2. 支持嵌套的不固定 schema，适合分析的数据类型 **[VARIANT](../../basic-element/sql-data-types/semi-structured/VARIANT.md)**：常用于 Log, Trace, IoT 等分析场景，schema 灵活可以写入任何合法的 JSON 数据，并自动展开成子列采用列式存储，存储压缩率高，聚合 过滤 排序等分析性能很好。

3. 支持嵌套的不固定 schema，适合点查的数据类型 **[JSON](../../basic-element/sql-data-types/semi-structured/JSON.md)**：常用于高并发点查场景，schema 灵活可以写入任何合法的 JSON 数据，采用二进制格式存储，提取字段的性能比普通 JSON String 快 2 倍以上。

## 聚合类型

聚合类型存储聚合的结果或者中间状态，用于加速聚合查询，包括下面几种：

1. [BITMAP](../../basic-element/sql-data-types/aggregate/BITMAP.md)：用于精确去重，如 UV 统计，人群圈选等场景。配合 bitmap_union、bitmap_union_count、bitmap_hash、bitmap_hash64 等 BITMAP 函数使用。

2. [HLL](../../basic-element/sql-data-types/aggregate/HLL.md)：用于近似去重，性能优于 COUNT DISTINCT。配合  hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash 等 HLL 函数使用。

3. [QUANTILE_STATE](../../basic-element/sql-data-types/aggregate/QUANTILE-STATE.md)：用于分位数近似计算，性能优于 PERCENTILE。配合 QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE 等函数使用。

4. [AGG_STATE](../../basic-element/sql-data-types/aggregate/AGG-STATE.md)：用于聚合计算加速，配合 state/merge/union 聚合函数组合器使用。


## IP 类型

IP 类型以二进制形式存储 IP 地址，比用字符串存储更省空间查询速度更快，支持 2 种类型：

1. [IPv4](../../basic-element/sql-data-types/ip/IPV4.md)：以 4 字节二进制存储 IPv4 地址，配合 ipv4_* 系列函数使用。

2. [IPv6](../../basic-element/sql-data-types/ip/IPV6.md)：以 16 字节二进制存储 IPv6 地址，配合 ipv6_* 系列函数使用。
