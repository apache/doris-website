---
{
    "title": "MySQL Dump",
    "language": "zh-CN",
    "description": "使用 mysqldump 工具从 Apache Doris 导出表结构与数据，适用于开发、测试及小数据量迁移场景。",
    "keywords": [
        "mysqldump",
        "Doris 导出",
        "表结构导出",
        "数据导出",
        "no-tablespaces",
        "source 导入"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 开发测试 / 小数据量导出导入 / 表结构备份 -->

`mysqldump` 是 MySQL 官方提供的逻辑导出工具。Apache Doris 自 **0.15 版本**起兼容 `mysqldump`，可通过其导出表结构（DDL）或数据（DML），并在 Doris 中通过 `source` 命令重新导入。

### 适用场景

| 场景 | 是否推荐 | 说明 |
| --- | --- | --- |
| 开发测试环境数据搬迁 | 推荐 | 操作简单，工具通用 |
| 表结构备份与迁移 | 推荐 | 使用 `--no-data` 仅导出 DDL |
| 小数据量数据导出 | 推荐 | 几 MB 至百 MB 级别 |
| 生产环境大数据量导出 | **不推荐** | 性能与稳定性受限，建议使用 `EXPORT` 或 `OUTFILE` |

## 前置要求

- Doris 版本 ≥ 0.15
- 客户端环境已安装 `mysqldump`
- 具备目标库表的读取权限（FE MySQL 协议端口默认 `9030`）

## 使用示例

### 导出数据或表结构

以下示例统一连接 FE 的 `127.0.0.1:9030`，使用 `root` 账号，并必须携带 `--no-tablespaces` 参数（原因见下文「注意事项」）。

1. **导出指定表的结构与数据**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test --tables table1
    ```

2. **仅导出指定表的结构（不含数据）**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test --tables table1 --no-data
    ```

3. **导出多个数据库下的全部表**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --databases test1 test2
    ```

4. **导出全部数据库与表**

    ```shell
    mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
        --all-databases
    ```

更多参数请参考 [MySQL 官方 mysqldump 使用手册](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)。

### 将导出结果导入 Doris

`mysqldump` 的输出可重定向到 `.sql` 文件，再通过 Doris 客户端的 `source` 命令导入：

```shell
# 1. 导出至文件
mysqldump -h127.0.0.1 -P9030 -uroot --no-tablespaces \
    --databases test --tables table1 > table1.sql

# 2. 登录 Doris 后执行 source 导入
mysql -h127.0.0.1 -P9030 -uroot
```

```sql
source table1.sql;
```

## 注意事项

1. **必须添加 `--no-tablespaces` 参数**：Doris 不支持 MySQL 的 tablespace 概念，缺少该参数会导致导出失败。
2. **仅适用于开发测试或小数据量场景**：`mysqldump` 为单线程逻辑导出，大数据量下性能与稳定性均不理想，**请勿用于大数据量的生产环境**。生产环境的数据导出请使用以下方式：
    - [`EXPORT` 语句](../../sql-manual/sql-statements/data-modification/load-and-export/EXPORT.md)：异步导出至对象存储或 HDFS
    - [`SELECT INTO OUTFILE`](../../sql-manual/sql-statements/data-modification/load-and-export/OUTFILE.md)：同步导出查询结果到文件
