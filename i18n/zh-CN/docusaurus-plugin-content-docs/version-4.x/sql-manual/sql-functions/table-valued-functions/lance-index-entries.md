---
{
    "title": "LANCE_INDEX_ENTRIES",
    "language": "zh-CN",
    "description": "lance_index_entries 表函数（table-valued function, TVF），用于列出 Filesystem Catalog 中 Lance 表最新快照记录的物理索引条目。"
}
---

## 描述

:::note
`lance_index_entries` 自 Apache Doris 4.1.5 起支持。
:::

`lance_index_entries` 表函数（TVF）列出 Lance 表最新快照中记录的物理索引条目，每个物理索引条目返回一行。它是对 `SHOW INDEX` 的补充：`SHOW INDEX` 以固定的 MySQL 风格结果集展示逻辑索引视图（索引名、被索引列、索引类型和属性），而物理索引条目的 UUID 和数据集版本无法放入该固定 Schema，只能通过本 TVF 获取。一个逻辑索引存在多个不同 UUID 的物理条目时，同一索引名会出现在多行中。

该 TVF 为只读，仅通过 `Dataset.getIndexes()` 读取索引元数据，不读取行数或统计信息。结果可以使用普通谓词过滤。结果按 `(IndexName, IndexUuid)` 排序。读取经过完整校验且为 all-or-error：空白或超长名称、缺失 UUID、非正 `DatasetVersion`、重复 UUID，或原始条目数超过 16,384，都会使整个查询失败，而不是返回截断后的部分结果。Lance 内部维护的保留系统索引（`__lance_frag_reuse` 和 `__lance_mem_wal`）会被校验但不会展示。

该 TVF 需要用户拥有该表的 `SHOW` 权限，且仅支持 Lance Filesystem Catalog。对于 REST Catalog，该 TVF 会被拒绝并返回错误 `lance_index_entries is not supported for Lance REST catalogs`。

## 语法

```sql
LANCE_INDEX_ENTRIES(
    "table" = "<table>"
  );
```

## 参数

`lance_index_entries` 表函数（TVF）接受一个 `"key"="value"` 参数对。

| 参数 | 描述 |
|---|---|
| `<table>` | 要查看的 Lance 表的完整三部分 `catalog.database.table` 名称。标识符支持反引号引用；多级 Lance Namespace 映射为包含 `.` 的数据库名时，需要使用反引号引用数据库部分，例如 `` lance_catalog.`doris.analytics`.items ``。 |

## 返回值

该 TVF 返回一个结果集，不返回标量 NULL。表中没有用户索引时返回零行；缺失或无效的 `table` 参数会报错。`table` 必须为非空字符串，不接受 SQL NULL。

该 TVF 返回以下固定列：

| 列 | 类型 | 说明 |
|---|---|---|
| `CatalogName` | STRING | Catalog 名。 |
| `DatabaseName` | STRING | 数据库名。 |
| `TableName` | STRING | 表名。 |
| `IndexName` | STRING | Lance 逻辑索引名。 |
| `IndexUuid` | STRING | 物理索引条目的 UUID。 |
| `DatasetVersion` | BIGINT | 物理索引条目上记录的数据集版本，即该条目写入时的数据集版本。同一逻辑索引的不同物理条目可能对应不同的数据集版本。恒大于等于 `1`。 |

## 示例

先按 [Lance Catalog](../../../lakehouse/catalogs/lance-catalog.mdx) 配置 Filesystem Catalog，并在外部 Lance 工具中创建数据集及索引。将示例名称替换为可访问的表；需要该表的 `SHOW` 权限。

- 查看 `lance_catalog` 中表 `vs_ivf_pq_f32` 的物理索引条目：

    ```sql
    select * from lance_index_entries("table" = "lance_catalog.default.vs_ivf_pq_f32");
    ```
    ```text
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    | CatalogName   | DatabaseName | TableName     | IndexName            | IndexUuid                            | DatasetVersion |
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    | lance_catalog | default      | vs_ivf_pq_f32 | embedding_ivf_pq_f32 | 3f9c2a1e-7b4d-4e6f-9a1c-2d5e8f0b3a47 | 12             |
    +---------------+--------------+---------------+----------------------+--------------------------------------+----------------+
    ```

    以上输出中的 `IndexUuid` 和 `DatasetVersion` 为示意值。

- 使用普通谓词过滤结果：

    ```sql
    select IndexName, IndexUuid
    from lance_index_entries("table" = "lance_catalog.default.vs_ivf_pq_f32")
    where DatasetVersion >= 12
    order by IndexName, IndexUuid;
    ```

    ```text
    IndexName             IndexUuid
    embedding_ivf_pq_f32  3f9c2a1e-7b4d-4e6f-9a1c-2d5e8f0b3a47
    ```

空的 `table` 参数会报错，错误信息包含：

```sql
SELECT * FROM lance_index_entries("table" = "");
```

```text
Missing required lance_index_entries property 'table'
```

## 相关说明

更多关于 Lance 索引查看的信息，包括 `SHOW INDEX` 提供的逻辑视图，请参阅 [Lance Catalog](../../../lakehouse/catalogs/lance-catalog.mdx)。
