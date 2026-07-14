---
{
    "title": "ORC | File Formats",
    "language": "zh-CN",
    "description": "本文档用于介绍 Doris 的 ORC 文件格式的读写支持情况。该文档适用于以下功能。",
    "sidebar_label": "ORC"
}
---

# ORC

本文档用于介绍 Doris 的 ORC 文件格式的读写支持情况。该文档适用于以下功能。

* Catalog 中对数据的读取、写入操作。

* Table Valued Function 中对数据的读取操作。

* Broker Load 中对数据的读取操作。

* Export 中对数据的写入操作。

* Outfile 中对数据的写入操作。

## 时间戳小数秒精度

ORC 时间戳可以保存纳秒，而 Doris `DATETIMEV2` 和 `TIMESTAMPTZ` 最高支持微秒。FileScannerV2 在 Catalog 扫描、表值函数和 Broker Load 中使用四舍五入规则，将 ORC 小数秒舍入到最接近的微秒：

| ORC 值 | Doris 值 |
|---|---|
| `2024-01-01 00:00:00.123456499` | `2024-01-01 00:00:00.123456` |
| `2024-01-01 00:00:00.123456500` | `2024-01-01 00:00:00.123457` |
| `2024-01-01 00:00:00.999999500` | `2024-01-01 00:00:01.000000` |

`DATETIMEV2` 和 `TIMESTAMPTZ` 映射均使用该规则，包括向下一秒进位。行解码、统计信息转换和谓词下推使用一致的边界。当 ORC 统计信息的精度不足以准确表示舍入边界时，Doris 会保守地扩大裁剪边界。如果 `!=` 等时间戳谓词无法安全表示，Doris 会跳过对应的搜索条件，并在解码后的数据行上计算谓词。这可能降低该谓词的裁剪效果，但可以避免错误跳过有效数据。

## 支持的压缩格式

* umcomressed

* snappy

* lz4

* zstd

* lzo

* zlib

## 相关参数

### 会话变量

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    控制 ORC Reader 是否启用延迟物化技术。默认为 true。

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    Doris 在读取 Hive 表 ORC 数据类型时，默认会根据 Hive 表的列名从 ORC 文件中找同名的列来读取数据。当该变量为 `false` 时，Doris 会根据 Hive 表中的列顺序从 Parquet 文件中读取数据，与列名无关。类似于 Hive 中的 `orc.force.positional.evolution` 变量。该参数只适用于顶层列名，对 Struct 内部无效。

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+) 

    在 ORC 文件中如果一个 Stripe 的字节大小小于 `orc_tiny_stripe_threshold`, 我们认为该 Stripe 为 Tiny Stripe。对于多个连续的 Tiny Stripe 我们会进行读取优化，即一次性读多个 Tiny Stripe 以减少 IO 次数。如果你不想使用该优化，可以将该值设置为 0。默认为 8M。

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+) 

    在使用 Tiny Stripe 读取优化的时候，会对多个 Tiny Stripe 合并成一次 IO，该参数用来控制每次 IO 请求的最大字节大小。你不应该将值设置的小于 `orc_tiny_stripe_threshold`。默认为 8M。

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+) 

    在使用 Tiny Stripe 读取优化的时候，由于需要读取的两个 Tiny Stripe 并不一定连续，当两个 Tiny Stripe 之间距离大于该参数时，我们不会将其合并成一次 IO。默认为 1M。

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    在 Tiny Stripe 优化中，如果 ORC 文件中的列较多，而查询中只使用其中的少数列，Tiny Stripe 优化会导致严重的读取放大。当实际读取的字节数占整个 sSripe 的比例大于该参数时，将使用 Tiny Stripe 读取优化。该参数的默认值为 0.4，最小值为 0。

* `check_orc_init_sargs_success` (3.1.0+)

    检查 ORC 谓词下推是否成功，用于调试。默认为 false。

### BE 配置项

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    ORC Reader 一次性读取的最大字节大小。默认 8 MB。

