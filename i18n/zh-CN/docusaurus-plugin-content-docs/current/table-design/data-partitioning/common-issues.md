---
{
    "title": "建表常见问题",
    "language": "zh-CN",
    "description": "Doris 建表常见问题排查指南：语法错误、Failed to create partition 超时、Too many open files、命令长时间无响应等场景的原因分析与解决方案。",
    "keywords": [
        "Doris 建表失败",
        "Failed to create partition",
        "Too many open files",
        "tablet_create_timeout_second",
        "建表超时",
        "建表语法错误"
    ]
}
---

<!-- 知识类型: 故障排查 -->
<!-- 适用场景: 建表失败排查 / 超时调优 -->

本文按用户在建表过程中可能遇到的典型场景进行组织，提供原因分析和解决方案。

## 场景一：建表语句出现语法错误

在较长的建表语句中出现语法错误时，可能会出现错误提示不全的现象。常见原因如下：

| 原因 | 排查与修正建议 |
| --- | --- |
| 语法结构错误 | 仔细阅读 `HELP CREATE TABLE;`，对照检查相关语法结构 |
| 使用了保留字 | 自定义名称遇到保留字时，需要用反引号 `` ` `` 引起来。建议所有自定义名称都使用反引号引起来 |
| 中文字符或全角字符 | 非 utf-8 编码的中文字符，或隐藏的全角字符（如全角空格、全角标点）会导致语法错误。建议使用带有"显示不可见字符"功能的文本编辑器进行检查 |

## 场景二：建表报错 `Failed to create partition [xxx]. Timeout`

Doris 建表是按照 Partition 粒度依次创建的，当某个 Partition 创建失败时，会报上述错误。

即使建表语句中没有显式定义 Partition，Doris 也会为该表创建一个不可更改的默认 Partition。因此当建表过程中出现问题时，同样会报 `Failed to create partition`。

通常该错误是由 BE 在创建数据分片（Tablet）时遇到了问题导致。

### 排查步骤

1. **定位失败的 Backend 与 Tablet**

    在 `fe.log` 中查找对应时间点的 `Failed to create partition` 日志。日志中会出现一系列类似 `{10001-10010}` 字样的数字对：

    - 第一个数字（`10001`）：Backend ID
    - 第二个数字（`10010`）：Tablet ID

    上述示例表示在 ID 为 `10001` 的 Backend 上，创建 ID 为 `10010` 的 Tablet 失败了。

2. **查看 BE 日志定位错误信息**

    前往对应 Backend 的 `be.INFO` 日志，查找对应时间段内 Tablet ID 相关的日志，即可找到具体错误信息。

3. **对照常见错误进行处理**

### 常见 Tablet 创建失败原因

| 错误现象 | 可能原因 | 处理建议 |
| --- | --- | --- |
| BE 没有收到相关 task（在 `be.INFO` 中找不到 Tablet ID 相关日志），或 BE 创建成功但汇报失败 | FE 与 BE 之间存在连通性问题 | 参阅 [安装与部署](../../install/deploy-manually/integrated-storage-compute-deploy-manually) 检查 FE 和 BE 之间的网络连通性 |
| 预分配内存失败 | 表中一行的字节长度超过了 100 KB | 调整表结构，缩减单行数据长度 |
| `Too many open files` | 打开的文件句柄数超过 Linux 系统限制 | 修改 Linux 系统的文件句柄数限制 |

### 调整建表超时时间

如果创建数据分片时仅是超时，可以通过 `fe.conf` 中的以下两个参数来延长超时时间：

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `tablet_create_timeout_second` | 1 秒 | 单个 Tablet 创建超时时间 |
| `max_create_table_timeout_second` | 60 秒 | 整个建表操作的最大超时时间 |

整体超时时间的计算公式为：

```text
min(tablet_create_timeout_second * replication_num, max_create_table_timeout_second)
```

具体参数说明可参阅 [FE 配置项](../../admin-manual/config/fe-config)。

## 场景三：建表命令长时间不返回结果

Doris 的建表命令是同步命令，其超时时间目前的设置较为简单：

```text
超时时间 = tablet num * replication num（秒）
```

对应的现象与建议如下：

- 如果创建较多的数据分片，并且其中有分片创建失败，则可能在等待较长超时之后才返回错误。
- 正常情况下，建表语句会在几秒或十几秒内返回。
- 如果超过一分钟仍未返回，建议直接取消该操作，前往 FE 或 BE 的日志查看相关错误。

## 更多帮助

关于数据划分的更多详细说明，可以通过以下方式查阅：

- 参阅 [CREATE TABLE](../../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE) 命令手册
