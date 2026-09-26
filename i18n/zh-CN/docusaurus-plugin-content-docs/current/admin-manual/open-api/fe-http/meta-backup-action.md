---
{
    "title": "Meta Backup Action",
    "language": "zh-CN",
    "description": "存算分离模式下备份 FE 元数据的 HTTP 接口：创建元数据同步点并导出 image 与 BDBJE 日志。",
    "keywords": [
        "Doris 元数据备份",
        "存算分离元数据",
        "sync_cloud_meta",
        "export_meta",
        "元数据同步点",
        "meta sync point",
        "BDBJE 备份",
        "FE image 导出",
        "FDB 备份",
        "cloud meta backup"
    ]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 存算分离元数据备份 / 灾备演练 / FE 与 FDB 一致性快照 -->

存算分离模式下，集群元数据分散在两处：FE 侧的 image 与 BDBJE 编辑日志，Meta Service 侧的 FoundationDB（FDB）。两者独立备份时时间点不一致，恢复后可能对不上。

该组接口用于解决这个问题：先在 FE 与 FDB 之间打一个**元数据同步点**（meta sync point），再基于该同步点导出 FE 元数据，使两侧备份可以对齐到同一时刻。

:::info 版本说明

该功能自 4.0.8 版本起支持，且**仅在存算分离模式下可用**。存算一体模式下调用会返回错误。

:::

## 接口一览

| 接口 | 方法 | 作用 |
| --- | --- | --- |
| `/rest/v2/manager/backup/sync_cloud_meta` | POST | 在 FE 与 FDB 之间创建元数据同步点，返回同步点对应的 journal id、committed version 与 versionstamp |
| `/rest/v2/manager/backup/export_meta` | POST | 将 FE 的 image、元信息文件与 BDBJE 日志导出到指定目录 |

## 前置条件

- 集群运行在存算分离模式（FE 配置 `deploy_mode = cloud`）。
- 调用账号具备 `ADMIN` 权限。
- 两个接口都只能在 **Master FE** 上执行。在非 Master FE 上调用时，默认返回 Master 的地址；如需自动跳转，请在 URL 中加上 `allow_redirect=true`。
- `export_meta` 要求 FE 配置 `edit_log_type = bdb`（默认值）。

## 创建元数据同步点

<!-- 知识类型: 操作步骤 -->

**目的**：在 Meta Service 上记录一个同步点，并把该同步点写入 FE 的编辑日志，作为 FE 与 FDB 备份对齐的锚点。

```shell
curl -u <user>:<passwd> -X POST \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/sync_cloud_meta"
```

**返回示例：**

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "journal_id": 1024,
        "committed_version": 20250811000000,
        "versionstamp": "0000000000000001"
    },
    "count": 0
}
```

**返回字段说明：**

| 字段 | 说明 |
| --- | --- |
| `journal_id` | 该同步点在 FE 编辑日志中的 journal id |
| `committed_version` | Meta Service 返回的已提交版本 |
| `versionstamp` | FDB 侧对应的版本戳，用于与 FDB 备份对齐 |

## 导出 FE 元数据

<!-- 知识类型: 操作步骤 -->

**目的**：把 FE 当前的 image 与 BDBJE 日志导出到本地目录，作为可用于恢复的 FE 元数据备份。

```shell
curl -u <user>:<passwd> -X POST \
    -H "Content-Type: application/json" \
    -d '{"target_dir": "/path/to/backup/dir"}' \
    "http://<fe_host>:<fe_http_port>/rest/v2/manager/backup/export_meta"
```

**请求体参数：**

| 参数 | 类型 | 是否必选 | 说明 |
| --- | --- | --- | --- |
| `target_dir` | String | 是 | 导出目标目录的绝对路径。目录不存在时会自动创建；**目录已存在时会先清空其中的全部内容** |

**返回示例：**

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "target_dir": "/path/to/backup/dir",
        "bdb_dir": "/path/to/backup/dir/bdb",
        "bdb_file_count": 12,
        "image_file": "image.1024",
        "image_version": 1024,
        "image_exported": true,
        "journal_upper_bound": 2048
    },
    "count": 0
}
```

**返回字段说明：**

| 字段 | 说明 |
| --- | --- |
| `target_dir` | 实际使用的导出目录绝对路径 |
| `bdb_dir` | BDBJE 日志文件的导出子目录 |
| `bdb_file_count` | 导出的 BDBJE 日志文件数量 |
| `image_file` | 导出的 image 文件名；无 image 时为 `null` |
| `image_version` | 导出的 image 版本号 |
| `image_exported` | 是否成功导出了 image 文件 |
| `journal_upper_bound` | 导出时 BDBJE 中最大的 journal id |

**导出目录结构：**

```text
<target_dir>/
├── image/
│   ├── image.<version>     # 最新的 image 文件
│   ├── MODE                # 部署模式文件
│   ├── ROLE                # FE 角色文件
│   └── VERSION             # 集群版本文件
└── bdb/
    └── *.jdb               # BDBJE 日志文件
```

导出过程中 FE 会持有 Checkpoint 读锁，避免 image 在拷贝期间被替换。image 与元信息文件优先使用硬链接，无法创建硬链接时退化为文件拷贝。

## 完整备份流程

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 定期元数据备份 / 灾备演练 -->

1. 调用 `sync_cloud_meta`，记录返回的 `versionstamp` 与 `committed_version`。
2. 依据 `versionstamp` 备份 FDB 侧的元数据。
3. 调用 `export_meta`，把 FE 元数据导出到备份目录。
4. 将 `versionstamp`、`committed_version` 与导出目录一并归档，恢复时用于校验两侧备份是否属于同一时间点。

## 常见问题

<!-- 知识类型: 故障排查 -->

| 现象 | 原因 | 处理方式 |
| --- | --- | --- |
| 返回 `only works on the cloud mode` | 集群不是存算分离模式 | 该接口仅支持存算分离模式 |
| 返回 `current fe is not master, master is <host>:<port>` | 请求发送到了非 Master FE | 改为请求 Master FE，或在 URL 中追加 `allow_redirect=true` |
| 返回 `target_dir is required` | 请求体缺少 `target_dir` | 在 JSON 请求体中提供 `target_dir` |
| 返回 `only bdb edit_log_type supports bdbje export` | FE 的 `edit_log_type` 不是 `bdb` | 该接口只支持 BDBJE 编辑日志 |
| 返回 `export failed: bdb min journal id ... is greater than image_version + 1` | BDBJE 中最早的 journal 已超出 image 覆盖范围，导出的备份无法连续回放 | 先触发一次 Checkpoint 生成较新的 image，再重新导出 |
| 返回 `target_dir exists but is not a directory` | `target_dir` 指向的是一个文件 | 换用目录路径 |
