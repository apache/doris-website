---
{
    "title": "存算分离集群升级指南（滚动升级）",
    "sidebar_label": "滚动升级指南",
    "language": "zh-CN",
    "description": "介绍如何对 Doris 存算分离集群进行滚动升级，涵盖 MetaService、Recycler、BE、FE 的升级顺序与操作步骤。",
    "keywords": ["Doris 升级", "存算分离升级", "滚动升级", "MetaService 升级", "BE 升级", "FE 升级"]
}
---

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 集群升级 / 版本迁移 -->

Doris 存算分离集群支持**滚动升级**，无需全量停机，可最大程度降低对上层应用的影响。本文介绍存算分离模式下的完整升级流程，包括升级前置检查、各组件升级步骤及常见问题解答。

若需升级存算一体模式的集群，请参考[集群升级](../admin-manual/cluster-management/upgrade)。

## 版本说明

<!-- 知识类型: 配置参数 -->

Doris 使用三位数版本号（如 `3.0.3`），可通过以下 SQL 查看当前版本：

```sql
MySQL [(none)]> select @@version_comment;
+----------------------------------------------------------+
| @@version_comment                                        |
+----------------------------------------------------------+
| Doris version doris-3.0.3-rc03-43f06a5e26 (Cloud Mode)  |
+----------------------------------------------------------+
```

版本号说明如下：

| 位置 | 含义 | 示例 |
|------|------|------|
| 第一位 | 大版本号 | `3` |
| 第二位 | 中版本号 | `0` |
| 第三位 | 小版本号 | `3` |
| 第四位（可选）| 紧急 Bug 修复版本，表示该小版本存在重大缺陷 | `2.0.2.1` |

版本后缀 `Cloud Mode` 表示以存算分离模式启动；存算一体模式启动时无此后缀。

**模式切换限制：** 存算分离模式与存算一体模式之间**不支持相互切换**。

**版本降级限制：** 支持低版本升级到高版本，以及小版本降级；**中版本和大版本不支持降级**。

## 升级前置条件

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 部署前检查 / 环境验收 -->

升级前，请确认以下所有条件均已满足：

1. **确认部署模式**：确保当前集群以存算分离模式运行（版本号带有 `Cloud Mode` 后缀）。
2. **配置导数重试**：确保导数任务具备重试机制，防止升级期间节点重启导致任务失败。
3. **检查组件状态**：检查 MetaService、Recycler、FE、BE 各组件均运行正常、无异常日志。
4. **备份 FE 元数据**：备份 Master FE 的元数据目录（默认为 FE 目录下的 `doris-meta`）。若该目录为空，请在 `conf/fe.conf` 中查找 `meta_dir` 配置项确认实际路径。
5. **下载安装包**：从 [Doris 官方网站](https://doris.apache.org/download) 下载目标版本安装包，并校验 SHA-512 摘要，确保包的完整性。

## 升级流程概览

<!-- 知识类型: 操作步骤 -->

按以下顺序依次升级各组件：

1. 升级 MetaService
2. 升级 Recycler（仅限单独部署时）
3. 升级 BE
4. 升级 FE
    1. 先升级 Observer 角色的 FE
    2. 再升级其他非 Master 角色的 FE
    3. 最后升级 Master 角色的 FE

## 升级步骤

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 集群升级 / 版本迁移 -->

### 第一步：升级 MetaService

本步骤对每个 MetaService 实例执行以下操作。涉及环境变量说明：

| 变量 | 含义 |
|------|------|
| `${MS_HOME}` | MetaService 的工作目录 |
| `${MS_PACKAGE_DIR}` | 新版 MetaService 安装包所在目录 |

**1. 停止当前 MetaService**

```shell
cd ${MS_HOME}
sh bin/stop.sh
```

**2. 备份现有二进制文件**

```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 部署新版安装包**

```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```

**4. 启动新版 MetaService**

```shell
sh ${MS_HOME}/bin/start.sh --daemon
```

**5. 验证升级结果**

确认 MetaService 进程正常运行，并在 `${MS_HOME}/log/doris_cloud.out` 日志中看到新版本号。

---

### 第二步：升级 Recycler（如有）

:::caution
若未单独部署 Recycler 组件，可跳过本步骤。
:::

本步骤对每个 Recycler 实例执行以下操作。MetaService 与 Recycler 使用相同的安装包。涉及环境变量说明：

| 变量 | 含义 |
|------|------|
| `${RECYCLER_HOME}` | Recycler 的工作目录 |
| `${MS_PACKAGE_DIR}` | 新版安装包所在目录（与 MetaService 共用） |

**1. 停止当前 Recycler**

```shell
cd ${RECYCLER_HOME}
sh bin/stop.sh
```

**2. 备份现有二进制文件**

```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 部署新版安装包**

```shell
cp ${MS_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```

**4. 启动新版 Recycler**

```shell
sh ${RECYCLER_HOME}/bin/start.sh --recycler --daemon
```

**5. 验证升级结果**

确认 Recycler 进程正常运行，并在 `${RECYCLER_HOME}/log/doris_cloud.out` 日志中看到新版本号。

---

### 第三步：升级 BE

:::tip
升级 BE 前，请先确认所有 MetaService 和 Recycler（如有）实例均已升级完成。
:::

本步骤对每个 BE 实例执行以下操作。涉及环境变量说明：

| 变量 | 含义 |
|------|------|
| `${BE_HOME}` | BE 的工作目录 |
| `${BE_PACKAGE_DIR}` | 新版 BE 安装包所在目录 |

**1. 停止当前 BE**

```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```

**2. 备份现有二进制文件**

```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 部署新版安装包**

```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```

**4. 启动新版 BE**

```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```

**5. 验证升级结果**

执行以下 SQL 确认 BE 版本和运行状态：

```sql
show backends;
```

---

### 第四步：升级 FE

:::tip
升级 FE 前，请先确认所有 BE 实例均已升级完成。
:::

FE 节点必须按以下顺序逐一升级：**Observer → 非 Master → Master**。

本步骤对每个 FE 实例执行以下操作。涉及环境变量说明：

| 变量 | 含义 |
|------|------|
| `${FE_HOME}` | FE 的工作目录 |
| `${FE_PACKAGE_DIR}` | 新版 FE 安装包所在目录 |

**1. 停止当前 FE**

```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```

**2. 备份现有二进制文件**

```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

**3. 部署新版安装包**

```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```

**4. 启动新版 FE**

```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```

**5. 验证升级结果**

执行以下 SQL 确认 FE 版本和运行状态：

```sql
show frontends;
```

## 常见问题

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 故障排查 -->

**Q1：存算一体模式升级前需要关闭副本均衡功能，存算分离模式也需要吗？**

不需要。存算分离模式下，Doris 数据存储在 HDFS 或对象存储（S3）上，不存在副本均衡需求，因此无需执行该操作。

**Q2：既然有独立的 MetaService 提供元数据服务，为什么 FE 仍需备份元数据？**

目前元数据由 MetaService 和 FE 共同保存，各自负责不同部分。为保障升级安全，建议在升级前同时备份 FE 的元数据目录。
