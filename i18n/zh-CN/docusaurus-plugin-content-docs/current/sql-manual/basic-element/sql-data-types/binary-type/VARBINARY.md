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
与 VARCHAR 不同，按字节序存储与比较，不涉及字符集或排序规则，适合存放任意二进制数据（如文件片段、哈希值、加密/压缩数据等），最大长度为2,147,483,647。

当前暂不支持 VARBINARY 列出现在创建的物化视图中，以及在 Group By key、Join Key、和比较谓词。

- 版本与限制：自 4.0 起支持；当前不支持在 Doris 表中作为列类型进行建表和存储，可通过 Catalog 将外部库的 BINARY/VARBINARY 字段映射为 Doris 中的 VARBINARY 以供查询。

## keywords

VARBINARY
