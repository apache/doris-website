---
title: Windows 平台编译 Apache Doris（WSL2）
language: zh-CN
description: 在 Windows 上通过 WSL2 编译 Apache Doris 的步骤。
keywords:
    - Windows 编译
    - WSL2
    - WSL
    - Apache Doris
    - 源码编译
    - Linux 子系统
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: Windows 开发机 / WSL2 编译 -->

本文介绍如何在 Windows 平台上编译 Apache Doris 源码。Doris 本身不直接支持在 Windows 上原生编译，但可以借助 WSL2（Windows Subsystem for Linux 2）在 Windows 上运行 Linux 子系统，再使用 Linux 编译流程完成构建。

:::tip
目前 Windows + WSL2 方式还不支持存算分离模式的编译部署。
:::

## 适用人群与优缺点

| 维度 | 说明 |
| ---- | ---- |
| 适用人群 | 开发机为 Windows、但需要编译并调试 Doris 的开发者 |
| 优点 | 无需双系统或额外 Linux 服务器，本地即可完成编译 |
| 缺点 | 需要 Windows 10 2004+ 或 Windows 11，并占用一定磁盘空间 |

## 1. 环境要求

<!-- 知识类型: 硬件要求 -->

| 项目 | 要求 |
| ---- | ---- |
| Windows 版本 | Windows 10 2004（内部版本 19041）及以上，或 Windows 11 |
| WSL 版本 | WSL2（推荐 Ubuntu 22.04 或 Ubuntu 24.04 发行版） |
| 磁盘空间 | 建议至少 50 GB 可用空间（用于源码、三方库与编译产物） |

## 2. 编译步骤

### 2.1 安装 WSL2

参考微软官方文档 [WSL 安装指南](https://learn.microsoft.com/zh-cn/windows/wsl/install)，在 PowerShell 中执行：

```powershell
wsl --install
```

完成安装后重启系统，并按引导初始化 Linux 子系统（设置用户名与密码）。

### 2.2 在 WSL2 中编译 Doris

进入 WSL2 启动的 Linux 子系统，选择以下任一编译方式：

- [使用 LDB Toolchain 编译（推荐）](./compilation-with-ldb-toolchain)
- [使用 Docker 镜像编译（推荐）](./compilation-with-docker)
- [Linux 平台直接编译](./compilation-linux)

## 3. 注意事项

- **存储盘符**：WSL2 发行版的数据默认存储在 C 盘。如果 C 盘空间紧张，建议在安装前将 WSL2 数据迁移到其他盘符，避免系统盘被占满。可参考 [WSL 导出与导入](https://learn.microsoft.com/zh-cn/windows/wsl/basic-commands#export-a-distribution-to-a-tar-file) 命令迁移。
- **资源限制**：WSL2 默认会占用宿主机内存。若编译过程频繁因内存不足被 kill，可在 `%UserProfile%\.wslconfig` 中提高 `memory`、`processors` 上限。
- **文件系统**：源码建议放在 WSL2 自带的 ext4 文件系统（如 `~/doris`）而不是挂载的 `/mnt/c/...`，避免跨文件系统访问导致编译速度极慢。

## FAQ

### Q1: WSL2 安装失败提示「需要更新 Windows」？

将 Windows 升级到 10 2004（内部版本 19041）及以上，或直接使用 Windows 11。

### Q2: WSL2 编译速度极慢？

确认源码位于 WSL2 内部文件系统（如 `~/doris`），不要使用 `/mnt/c/...` 路径，跨文件系统访问会显著拖慢编译。

### Q3: WSL2 内存占满主机？

在 `%UserProfile%\.wslconfig` 中限制 WSL2 资源用量：

```ini
[wsl2]
memory=12GB
processors=8
```

修改后执行 `wsl --shutdown` 重启 WSL2 生效。

## 相关文档

- [使用 LDB Toolchain 编译](./compilation-with-ldb-toolchain)
- [使用 Docker 镜像编译](./compilation-with-docker)
- [Linux 平台直接编译](./compilation-linux)
