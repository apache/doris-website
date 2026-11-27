---
{
    "title": "FILE 类型转换",
    "language": "zh-CN",
    "description": "FILE 类型在 CAST 与 TRY_CAST 中的转换限制。"
}
---

# FILE 类型转换


`CAST` 和 `TRY_CAST` 不支持向 `FILE` 或从 `FILE` 进行转换，包括 `STRUCT`、`STRING`、`JSON`、`VARIANT`、`NULL` 以及向相同 `FILE` 类型的转换。该限制也适用于包含 `FILE` 的 `ARRAY`、`STRUCT` 和 `MAP` 类型。不支持的转换均会在分析阶段报错，`TRY_CAST` 同样如此。

如需将 `FILE` 值序列化为 `JSONB`，请使用 [TO_JSON](../../../sql-functions/scalar-functions/json-functions/to-json.md)。如需读取 `FILE` 值的元数据字段或内联二进制内容，请使用 [ELEMENT_AT](../../../sql-functions/scalar-functions/variant-functions/element-at.md)、[FL_GET_BINARY](../../../sql-functions/scalar-functions/fl-get-binary.md) 或 [EXPLODE_FILE](../../../sql-functions/table-functions/explode-file.md)。

## 限制示例

所有涉及 `FILE` 或嵌套 `FILE` 类型的 `CAST` 和 `TRY_CAST` 表达式均会在分析阶段报错：

```sql
SELECT CAST(NULL AS FILE);
SELECT TRY_CAST(NULL AS FILE);
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from origin type NULL to target type=FILE
```
