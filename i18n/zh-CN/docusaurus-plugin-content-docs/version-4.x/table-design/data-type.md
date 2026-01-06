---
{
    "title": "数据类型",
    "language": "zh-CN",
    "description": "Apache Doris 已支持的数据类型列表如下："
}
---

Apache Doris 已支持的数据类型列表如下：

### [数值类型](../sql-manual/basic-element/sql-data-types/data-type-overview#数值类型)


| 类型名         | 存储空间（字节）| 描述                                                     |
| -------------- | --------- | ------------------------------------------------------------ |
| [BOOLEAN](../sql-manual/basic-element/sql-data-types/numeric/BOOLEAN)        | 1         | 布尔值，0 代表 false，1 代表 true。                          |
| [TINYINT](../sql-manual/basic-element/sql-data-types/numeric/TINYINT)        | 1         | 有符号整数，范围 [-128, 127]。                               |
| [SMALLINT](../sql-manual/basic-element/sql-data-types/numeric/SMALLINT)       | 2         | 有符号整数，范围 [-32768, 32767]。                           |
| [INT](../sql-manual/basic-element/sql-data-types/numeric/INT)            | 4         | 有符号整数，范围 [-2147483648, 2147483647]                   |
| [BIGINT](../sql-manual/basic-element/sql-data-types/numeric/BIGINT)         | 8         | 有符号整数，范围 [-9223372036854775808, 9223372036854775807]。 |
| [LARGEINT](../sql-manual/basic-element/sql-data-types/numeric/LARGEINT)       | 16        | 有符号整数，范围 [-2^127 + 1 ~ 2^127 - 1]。                  |
| [FLOAT](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)          | 4         | 浮点数，范围 [-3.4*10^38 ~ 3.4*10^38]。                      |
| [DOUBLE](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)         | 8         | 浮点数，范围 [-1.79*10^308 ~ 1.79*10^308]。                  |
| [DECIMAL](../sql-manual/basic-element/sql-data-types/numeric/DECIMAL)        | 4/8/16/32    | 高精度定点数，格式：DECIMAL(P[,S])。其中，P 代表一共有多少个有效数字（precision），S 代表小数位有多少数字（scale）。有效数字 P 的范围是 [1, MAX_P]，`enable_decimal256`=false 时，MAX_P=38，`enable_decimal256`=true 时，MAX_P=76。小数位数字数量 S 的范围是 [0, P]。<br>`enable_decimal256` 的默认值是 false，设置为 true 可以获得更加精确的结果，但是会带来一些性能损失。<br>存储空间：<ul><li>0 < precision <= 9 时，占用 4 字节。<li>9 < precision <= 18 时，占用 8 字节。<li>16 < precision <= 38 时，占用 16 字节。<li>38 < precision <= 76 的场合，占用 32 字节。<ul>|

### [日期类型](../sql-manual/basic-element/sql-data-types/data-type-overview#日期类型)

| 类型名                | 存储空间（字节） | 描述                                                                                       |  
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------ |  
| [DATE](../sql-manual/basic-element/sql-data-types/date-time/DATE)         | 4               | 日期类型，目前的取值范围是 ['0000-01-01', '9999-12-31']，默认的打印形式是 'yyyy-MM-dd'。         |  
| [DATETIME](../sql-manual/basic-element/sql-data-types/date-time/DATETIME) | 8               | 日期时间类型，格式：DATETIME([P])。可选参数 P 表示时间精度，取值范围是 [0, 6]，即最多支持 6 位小数（微秒）。不设置时为 0。<br />取值范围是 ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]']。打印的形式是 'yyyy-MM-dd HH:mm:ss.SSSSSS'。 |

### [字符串类型](../sql-manual/basic-element/sql-data-types/data-type-overview#字符串类型)

| 类型名         | 存储空间（字节）| 描述                                                     |
| -------------- | --------- | ------------------------------------------------------------ |
| [CHAR](../sql-manual/basic-element/sql-data-types/string-type/CHAR)           | M         | 定长字符串，M 代表的是定长字符串的字节长度。M 的范围是 1-255。 |
| [VARCHAR](../sql-manual/basic-element/sql-data-types/string-type/VARCHAR)        | 不定长     | 变长字符串，M 代表的是变长字符串的字节长度。M 的范围是 1-65533。变长字符串是以 UTF-8 编码存储的，因此通常英文字符占 1 个字节，中文字符占 3 个字节。 |
| [STRING](../sql-manual/basic-element/sql-data-types/string-type/STRING)         | 不定长     | 变长字符串，默认支持 1048576 字节（1MB），可调大到 2147483643 字节（2GB）。可通过 BE 配置 string_type_length_soft_limit_bytes 调整。String 类型只能用在 Value 列，不能用在 Key 列和分区分桶列。 |

### [半结构类型](../sql-manual/basic-element/sql-data-types/data-type-overview#半结构化类型)
| 类型名         | 存储空间（字节）| 描述                                                     |
| -------------- | --------- | ------------------------------------------------------------ |
| [ARRAY](../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY)          | 不定长     | 由 T 类型元素组成的数组，不能作为 Key 列使用。目前支持在 Duplicate 和 Unique 模型的表中使用。 |
| [MAP](../sql-manual/basic-element/sql-data-types/semi-structured/MAP)            | 不定长     | 由 K, V 类型元素组成的 map，不能作为 Key 列使用。目前支持在 Duplicate 和 Unique 模型的表中使用。 |
| [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)         | 不定长	    | 由多个 Field 组成的结构体，也可被理解为多个列的集合。不能作为 Key 使用，目前 STRUCT 仅支持在 Duplicate 模型的表中使用。一个 Struct 中的 Field 的名字和数量固定，总是为 Nullable。|
| [JSON](../sql-manual/basic-element/sql-data-types/semi-structured/JSON)           | 不定长     | 二进制 JSON 类型，采用二进制 JSON 格式存储，通过 JSON 函数访问 JSON 内部字段。长度限制和配置方式与 String 相同 |
| [VARIANT](../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT)        | 不定长     | 动态可变数据类型，专为半结构化数据如 JSON 设计，可以存入任意 JSON，自动将 JSON 中的字段拆分成子列存储，提升存储效率和查询分析性能。长度限制和配置方式与 String 相同。Variant 类型只能用在 Value 列，不能用在 Key 列和分区分桶列。|

### [聚合类型](../sql-manual/basic-element/sql-data-types/data-type-overview#聚合类型)

| 类型名         | 存储空间（字节）| 描述                                                     |
| -------------- | --------- | ------------------------------------------------------------ |
| [HLL](../sql-manual/basic-element/sql-data-types/aggregate/HLL)            | 不定长     | HLL 是模糊去重，在数据量大的情况性能优于 Count Distinct。HLL 的误差通常在 1% 左右，有时会达到 2%。HLL 不能作为 Key 列使用，建表时配合聚合类型为 HLL_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。HLL 列只能通过配套的 hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash 进行查询或使用。|
| [BITMAP](../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)         | 不定长     | Bitmap 类型的列可以在 Aggregate 表、Unique 表或 Duplicate 表中使用。在 Unique 表或 Duplicate 表中使用时，其必须作为非 Key 列使用。在 Aggregate 表中使用时，其必须作为非 Key 列使用，且建表时配合的聚合类型为 BITMAP_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。BITMAP 列只能通过配套的 bitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64 等函数进行查询或使用。 |
| [QUANTILE_STATE](../sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE) | 不定长     | QUANTILE_STATE 是一种计算分位数近似值的类型，在导入时会对相同的 Key，不同 Value 进行预聚合，当 value 数量不超过 2048 时采用明细记录所有数据，当 Value 数量大于 2048 时采用 TDigest 算法，对数据进行聚合（聚类）保存聚类后的质心点。QUANTILE_STATE 不能作为 Key 列使用，建表时配合聚合类型为 QUANTILE_UNION。用户不需要指定长度和默认值。长度根据数据的聚合程度系统内控制。QUANTILE_STATE 列只能通过配套的 QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE 等函数进行查询或使用。 |
| [AGG_STATE](../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE)      | 不定长     | 聚合函数，只能配合 state/merge/union 函数组合器使用。AGG_STATE 不能作为 Key 列使用，建表时需要同时声明聚合函数的签名。用户不需要指定长度和默认值。实际存储的数据大小与函数实现有关。 |

### [IP 类型](../sql-manual/basic-element/sql-data-types/data-type-overview#ip-类型)
| 类型名         | 存储空间（字节）| 描述                                                     |
| -------------- | --------- | ------------------------------------------------------------ |
| [IPv4](../sql-manual/basic-element/sql-data-types/ip/IPV4)            |   4 字节  |  以 4 字节二进制存储 IPv4 地址，配合 ipv4_* 系列函数使用。         |
| [IPv6](../sql-manual/basic-element/sql-data-types/ip/IPV6)            |   16 字节  |  以 16 字节二进制存储 IPv6 地址，配合 ipv6_* 系列函数使用。      |

也可通过`SHOW DATA TYPES;`语句查看 Apache Doris 支持的所有数据类型。
