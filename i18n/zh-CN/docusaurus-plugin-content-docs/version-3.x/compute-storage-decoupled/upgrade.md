---
{
    "title": "升级",
    "language": "zh-CN",
    "description": "本指南提供了使用存储计算解耦（即，存算分离）架构升级 Doris 的分步说明。升级请使用本章节中推荐的步骤进行集群升级，Doris 集群升级可使用滚动升级的方式进行升级，无需集群节点全部停机升级，极大程度上降低对上层应用的影响。"
}
---

## 概述

本指南提供了使用存储计算解耦（即，存算分离）架构升级 Doris 的分步说明。升级请使用本章节中推荐的步骤进行集群升级，Doris 集群升级可使用**滚动升级**的方式进行升级，无需集群节点全部停机升级，极大程度上降低对上层应用的影响。

## Doris 版本说明

Doris 使用三位数的版本号格式，可以使用如下 SQL 进行查看版本：

```sql
MySQL [(none)]> select @@version_comment;
+--------------------------------------------------------+
| @@version_comment                                      |
+--------------------------------------------------------+
| Doris version doris-3.0.3-rc03-43f06a5e26 (Cloud Mode) |
+--------------------------------------------------------+
```

> 其中`3.0.3`的第一个数字表示大版本号，第二个数字表示中版本号，第三个数字表示小版本号，在某些情况下，版本号会变成 4 位，如`2.0.2.1`，此时的最后一位数字表示这是一个紧急修复 bug 的版本，这通常意味着这个小版本有一些重大的 bug。
>
> Doris 从`3.0.0`版本开始支持存算分离模式部署，当以这种模式部署后，版本号后面会有 Cloud Mode 后缀，以存算一体模式启动的话，则没有这个后缀。

Doris 以存算分离模式部署之后，不支持切换成存算一体模式。同样的，存算一体模式的 Doris 也不支持切换成存算分离模式。

Doris 原则上支持从低版本升级到高版本，以及小版本降级，对于中版本或大版本，则不支持降级。

## 升级步骤

### 升级说明

1. 确保你的 Doris 是以存算分离模式启动的，如果你不清楚当前的 Doris 是什么部署方式，可以参考[上一小节](#doris-版本说明)的说明。
   对于存算一体模式的 Doris，升级步骤可参考[集群升级](../admin-manual/cluster-management/upgrade)。
2. 确保你的 Doris 导数任务具备重试机制，以避免升级过程中，因节点重启而导致的导数任务失败。
3. 在升级之前，我们建议你检查一下各个 Doris 组件（MetaService、Recycler、Frontend、Backend）的状态正常并且无异常日志，以免升级过程中受到影响。

### 升级流程概览

1. 元数据备份
2. 升级 MetaService
3. 升级 Recycler（如有）
4. 升级 BE
5. 升级 FE
   1. 先升级 Observer 角色的 FE
   2. 再升级其他非 Master 角色的 FE
   3. 最后升级 Master 角色的 FE

### 升级前置工作

1. 备份 Master FE 的元数据目录，元数据目录通常是 FE 目录下 doris-meta 目录，如果此目录为空，那么可能是修改了目录的位置，你可以到 FE 的配置文件（conf/fe.conf）中搜索`meta_dir`配置项。
2. 从 Doris 官方网站[下载](/download)安装包，建议校验 SHA-512 码，保证下载到到安装包与 Doris 官方提供的是一致的。

### 升级流程

#### 1. 升级 MetaService

假设以下环境变量：
- `${MS_HOME}`：MetaService 的工作目录。
- `${MS_PACKAGE_DIR}`：包含新 MetaService 包的目录。

按照以下步骤升级每个 MetaService 实例。

1.1. 停止当前 MetaService：
```shell
cd ${MS_HOME}
sh bin/stop.sh
```

1.2. 备份现有 MetaService 二进制文件：
```shell
mv ${MS_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${MS_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

1.3. 部署新包：
```shell
cp ${MS_PACKAGE_DIR}/bin ${MS_HOME}/bin
cp ${MS_PACKAGE_DIR}/lib ${MS_HOME}/lib
```

1.4. 启动新的 MetaService：
```shell
sh ${MS_HOME}/bin/start.sh --daemon
```

1.5. 检查新 MetaService 的状态：

确保新 MetaService 正在运行，并且在 `${MS_HOME}/log/doris_cloud.out` 中有新的版本号。

#### 2. 升级 Recycler（如有）

:::caution
如果你没有单独部署 Recycler 组件，那么可以跳过这一步。
:::

假设以下环境变量：
- `${RECYCLER_HOME}`：Recycler 的工作目录
- `${MS_PACKAGE_DIR}`：包含新 MetaService 包的目录，MetaService 和 Recycler 使用相同的包。

按照以下步骤升级每个 Recycler 实例。

2.1. 停止当前 Recycler：
```shell
cd ${RECYCLER_HOME}
sh bin/stop.sh
```

2.2. 备份现有 Recycler 二进制文件：
```shell
mv ${RECYCLER_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${RECYCLER_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

2.3. 部署新包：
```shell
cp ${RECYCLER_PACKAGE_DIR}/bin ${RECYCLER_HOME}/bin
cp ${RECYCLER_PACKAGE_DIR}/lib ${RECYCLER_HOME}/lib
```

2.4. 启动新的 Recycler：
```shell
sh ${RECYCLER_HOME}/bin/start.sh --recycler --daemon
```

2.5. 检查新 Recycler 的状态：

确保新 Recycler 正在运行，并且在 `${RECYCLER_HOME}/log/doris_cloud.out` 中有新的版本号。

#### 3. 升级 BE

验证所有 MetaService 和 Recycler（如果单独安装）实例已升级。

假设以下环境变量：
- `${BE_HOME}`：BE 的工作目录。
- `${BE_PACKAGE_DIR}`：包含新 BE 包的目录。

按照以下步骤升级每个 BE 实例。

3.1. 停止当前 BE：
```shell
cd ${BE_HOME}
sh bin/stop_be.sh
```

3.2. 备份现有 BE 二进制文件：
```shell
mv ${BE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${BE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

3.3. 部署新包：
```shell
cp ${BE_PACKAGE_DIR}/bin ${BE_HOME}/bin
cp ${BE_PACKAGE_DIR}/lib ${BE_HOME}/lib
```

3.4. 启动新的 BE：
```shell
sh ${BE_HOME}/bin/start_be.sh --daemon
```

3.5. 检查新 BE 的状态：

确认新的 BE 是否正在运行，并且使用新版本正常运行。可以使用以下 SQL 获取状态和版本。

```sql
show backends;
```

#### 4. 升级 FE

验证所有 BE 实例已升级。

假设以下环境变量：
- `${FE_HOME}`：FE 的工作目录。
- `${FE_PACKAGE_DIR}`：包含新 FE 包的目录。

按以下顺序升级 Frontend（FE）实例：
1. 观察者 FE 节点
2. 非主 FE 节点
3. 主 FE 节点

按照以下步骤升级每个 Frontend（FE）节点。

4.1. 停止当前 FE：
```shell
cd ${FE_HOME}
sh bin/stop_fe.sh
```

4.2. 备份现有 FE 二进制文件：
```shell
mv ${FE_HOME}/bin bin_backup_$(date +%Y%m%d_%H%M%S)
mv ${FE_HOME}/lib lib_backup_$(date +%Y%m%d_%H%M%S)
```

4.3. 部署新包：
```shell
cp ${FE_PACKAGE_DIR}/bin ${FE_HOME}/bin
cp ${FE_PACKAGE_DIR}/lib ${FE_HOME}/lib
```

4.4. 启动新的 FE：
```shell
sh ${FE_HOME}/bin/start_fe.sh --daemon
```

4.5. 检查新 FE 的状态：

确认新的 FE 是否正在运行，并且使用新版本正常运行。可以使用以下 SQL 获取状态和版本。

```sql
show frontends;
```

## FAQ

1. 存算一体模式的 Doris 的升级前需要关闭副本均衡功能，存算分离模式下的集群需要吗？

不需要。因为存算分离模式下，Doris 的数据存放在 HDFS 或 S3 服务上，因此不存在副本均衡的需求。

2. 有了独立的 MetaService 提供元数据服务，为什么 FE 还需要备份元数据？

因为目前 MetaService 保存了一部分元数据，FE 也保存了一部分元数据，为了稳妥起见，我们建议备份 FE 的元数据。
