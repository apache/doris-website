---
{
    "title": "FILE 类型转换",
    "language": "zh-CN",
    "description": "FILE 类型转换限制及 NULL 处理规则。"
}
---

# FILE 类型转换

CAST 和 TRY_CAST 不支持 FILE 与其他类型之间的转换，包括 STRUCT、STRING、JSON 和 VARIANT。该限制也适用于包含 FILE 的 ARRAY、STRUCT 和 MAP 类型。不支持的转换会在分析阶段报错，TRY_CAST 同样如此。

使用 [TO_FILE](../../../sql-functions/scalar-functions/to-file.md) 或 [LIST_FILES](../../../sql-functions/table-valued-functions/list-file.md) 获取 FILE 值。使用 [TO_JSON](../../../sql-functions/scalar-functions/json-functions/to-json.md) 将 FILE 序列化为 JSON。

## NULL 与相同类型转换

SQL NULL 可以转换为 FILE。将值转换为其原有类型的操作也继续支持。

```sql
SELECT CAST(NULL AS FILE) AS f;
```

```text
f
NULL
```
