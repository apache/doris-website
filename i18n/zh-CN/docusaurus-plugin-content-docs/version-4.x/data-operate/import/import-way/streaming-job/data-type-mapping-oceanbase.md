---
{
    "title": "OceanBase 数据类型映射",
    "language": "zh-CN",
    "sidebar_label": "数据类型映射",
    "description": "介绍 OceanBase CDC 自动建表同步中，MySQL 兼容类型如何映射为 Doris 列类型。"
}
---

<!-- 知识类型: 参考 / 数据类型映射 -->

OceanBase CDC 持续导入仅支持 MySQL 兼容模式，并复用 MySQL 的类型转换逻辑。下表展示自动建表时 OceanBase 列类型与 Doris 列类型之间的映射。

:::caution 实验性功能

OceanBase CDC 持续导入自 Doris 4.1.4 起作为实验性功能提供。

:::

## JDBC URL 参数归一化

创建 OceanBase Streaming Job 时，如果没有显式指定，Doris 会自动在 `jdbc_url` 中追加以下参数：

| 参数 | 注入值 | 影响 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` 按 `TINYINT` 读取（`1` / `0`），而不是按 `BOOLEAN` 读取（`true` / `false`）。 |
| `yearIsDateType` | `false` | `YEAR` 按整数年份读取，而不是按日期读取。 |
| `useUnicode` | `true` | 使用 Unicode 编码。 |
| `characterEncoding` | `utf-8` | 使用 UTF-8 字符集。 |

如果在 `jdbc_url` 中显式设置了上述参数，Doris 会保留用户配置的值。

## OceanBase 到 Doris

| OceanBase 类型（MySQL 兼容模式） | Doris 类型 | 备注 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | 默认取值为 `1` / `0`；可通过 `tinyInt1isBit=true` 改变 JDBC 读取行为。 |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | 按整数年份读取；零年（`0000`）保留为 `0`。 |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 超高精度回退为 `STRING`。 |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | 保留微秒精度（0–6）。 |
| `TIMESTAMP` | `DATETIME(s)` | 按 server 时区归一。 |
| `TIME` | `STRING` | 以字符串存储，如 `12:34:56.000000`。 |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64 编码字符串。 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64 编码字符串。 |
| `JSON` | `STRING` | 以 JSON 文本存储。 |
| `ENUM` | `STRING` | 解析为标签值。 |
| `SET` | `STRING` | 解析为逗号分隔的标签。 |
| 空间类型（`GEOMETRY`、`POINT` 等）及其他类型 | 不支持 | 含此类列的表自动建表会失败；可通过 `table.<table_name>.exclude_columns` 排除非主键列。 |

## 注意事项

- 类型映射以 OceanBase 通过 MySQL Connector/J 返回的元数据为准。
- 不支持的类型不会自动回退为任意 Doris 类型；创建正式作业前应先验证目标表结构。
- `TIMESTAMP` 会受源端时区和 JDBC URL 中 `serverTimezone` 的影响，跨时区部署时应显式设置并验证时间值。
- 主键列不能通过 `table.<table_name>.exclude_columns` 排除。

## 相关文档

- [OceanBase CDC 自动建表同步](./continuous-load-oceanbase-database.md)
- [OceanBase Schema Change 同步](./schema-change-oceanbase.md)
- [持续导入概览](./continuous-load-overview.md)
