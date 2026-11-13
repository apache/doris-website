---
{
    "title": "STRING",
    "language": "zh-CN",
    "description": "STRING"
}
---

## description

STRING
    

变长字符串，默认支持 10485760 字节（10 MiB），可调大到 2147483643 字节（2G），可通过 be 配置 `string_type_length_soft_limit_bytes`调整。STRING 类型只能用在 value 列，不能用在 key 列和分区、分桶列。
    

注意：变长字符串是以 UTF-8 编码存储的，因此通常英文字符占 1 个字节，中文字符占 3 个字节。

## keywords

STRING

### 类型别名与元数据显示

`STRING` 和 `TEXT` 定义的是同一种 Doris 类型。不同接口对该类型的显示名称不同：

| 接口 | `STRING` 列的显示名称 |
| --- | --- |
| `SHOW CREATE TABLE` 和 `DESC` | `text` |
| `information_schema.columns.DATA_TYPE` | `varchar`，用于兼容 MySQL |
| `information_schema.columns.COLUMN_TYPE` | `string` |

这些显示名称不会改变实际存储类型或长度限制。通过元数据区分 Doris `STRING` 列与有长度限制的 `VARCHAR` 列时，请查看 `COLUMN_TYPE`。
