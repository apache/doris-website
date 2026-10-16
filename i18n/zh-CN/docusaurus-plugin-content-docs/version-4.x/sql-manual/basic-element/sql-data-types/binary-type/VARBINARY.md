---
{
    "title": "VARBINARY",
    "language": "zh-CN",
    "description": "VARBINARY(M)"
}
---

## description

VARBINARY(M)

变长二进制字节序列，M 表示最大长度（单位：字节）。
与 VARCHAR 不同，保留原始字节序列，不按字符集或排序规则解释，适合存放任意二进制数据（如文件片段、哈希值、加密/压缩数据等），最大长度为2,147,483,647。

当前暂不支持 VARBINARY 列出现在创建的物化视图中，以及在 Group By key、Join Key、和比较谓词。

- 版本与限制：自 4.0 起支持；当前不支持在 Doris 表中作为列类型进行建表和存储，可通过 Catalog 将外部库的 BINARY/VARBINARY 字段映射为 Doris 中的 VARBINARY 以供查询。

## 4.1.5 起的外部类型与限制

自 4.1.5 版本起，Catalog 的外部二进制类型固定保留为 `VARBINARY`，`enable.mapping.varbinary=false` 不再改回 `STRING`。Iceberg `fixed(N)` 保留为 `VARBINARY(N)`，UUID 保留为 `VARBINARY(16)`，包括查询经过 Block 序列化和数据交换的场景。文件 TVF 的 `enable_mapping_varbinary` 是独立选项，仍默认 `false`，需要时显式开启。

Hive Text 二进制字段使用 Hive 兼容的 Base64 编解码。涉及十六进制表示的转换要求 `0x` 前缀以及偶数个合法十六进制数字，否则返回 `Invalid VARBINARY hex representation`。

上述支持不开放 Doris 内表的原生二进制列存储。当前不支持 VARBINARY 作为 Hash Join / Group By 键，也不支持比较谓词、`IN` / `NOT IN` 以及 `collect_set` 等未实现二进制语义的操作；4.1.5 会明确拒绝这些用法。

## keywords

VARBINARY
