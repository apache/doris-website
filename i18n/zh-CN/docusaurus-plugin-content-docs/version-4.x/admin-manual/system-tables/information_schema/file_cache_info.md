---
{
    "title": "file_cache_info",
    "language": "zh-CN",
    "description": "查看各个 BE 节点上的 File Cache 缓存块明细。该系统表从 Doris 4.1 开始支持。"
}
---

## 概述

`file_cache_info` 系统表展示所有存活 BE 节点上的 File Cache 缓存块明细。可以使用该表按照 Tablet、BE、缓存路径或缓存类型分析空间占用，排查缓存分布不均或缓存空间异常增长等问题。

:::tip 版本说明

该系统表从 Doris 4.1 开始支持，Doris 4.0.x 不支持该系统表。

:::

每一行表示一个缓存块。查询结果反映当前缓存状态；查询填充缓存或缓存淘汰发生时，结果可能随之变化。

:::caution 注意

查询该表会扫描所选 BE 节点上持久化的 File Cache 元数据。当缓存块数量较多时，查询会产生额外的 I/O。请避免频繁执行无过滤条件的查询；如果只需查看特定 BE 节点，请使用 `BE_ID` 过滤。

:::

## 所属数据库

`information_schema`

## 表信息

| 列名 | 类型 | 描述 |
|---|---|---|
| `HASH` | STRING | 缓存块所属远程文件的哈希值。 |
| `OFFSET` | BIGINT | 缓存块在远程文件中的起始偏移量，单位为字节。 |
| `TABLET_ID` | BIGINT | 缓存块关联的 Tablet ID。缓存块未关联 Tablet 时，该值为 `0`。 |
| `SIZE` | BIGINT | 缓存块大小，单位为字节。 |
| `TYPE` | STRING | 缓存类型。可能的值为 `normal`、`index`、`ttl` 和 `disposable`。 |
| `REMOTE_PATH` | STRING | 远程文件路径的预留字段，当前返回空字符串。 |
| `CACHE_PATH` | STRING | 缓存块所在 BE 节点的本地 File Cache 根目录。 |
| `BE_ID` | BIGINT | 保存该缓存块的 BE 节点 ID。 |

## 示例

### 查询指定 Tablet 的缓存明细

```sql
SELECT *
FROM information_schema.file_cache_info
WHERE TABLET_ID = 1761571031445;
```

```text
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
| HASH                             | OFFSET | TABLET_ID     | SIZE  | TYPE  | REMOTE_PATH | CACHE_PATH                   | BE_ID         |
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
| 468448215c52334ae5bee147259b1027 |      0 | 1761571031445 | 15120 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
| 71bb73d34cd8ffe280b16dd329df5ba1 |  15120 | 1761571031445 | 13117 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
| 77c6b69d1a7c4fe740a11bab5c1bbaa3 |  28237 | 1761571031445 | 12249 | index |             | /mnt/disk1/project/filecache | 1761571031251 |
+----------------------------------+--------+---------------+-------+-------+-------------+------------------------------+---------------+
```

### 汇总缓存空间占用

以下查询按照 BE 和缓存类型汇总指定 Tablet 占用的缓存空间：

```sql
SELECT BE_ID, TABLET_ID, TYPE, SUM(SIZE) AS CACHE_BYTES
FROM information_schema.file_cache_info
WHERE TABLET_ID = 1761571031445
GROUP BY BE_ID, TABLET_ID, TYPE
ORDER BY CACHE_BYTES DESC;
```

```text
+---------------+---------------+-------+-------------+
| BE_ID         | TABLET_ID     | TYPE  | CACHE_BYTES |
+---------------+---------------+-------+-------------+
| 1761571031251 | 1761571031445 | index |       40486 |
+---------------+---------------+-------+-------------+
```
