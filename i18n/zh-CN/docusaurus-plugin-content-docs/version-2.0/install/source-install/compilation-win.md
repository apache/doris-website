---
{
"title": "Windows 平台上编译",
"language": "zh-CN"
}
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

本文介绍如何在 Windows 平台上编译源码，借助 Windows 的 WSL 功能，可以通过在 Windows 上启动 Linux 系统来编译 Doris。

## 环境要求

1.  必须运行 Windows 10 版本 2004 及更高版本（内部版本 19041 及更高版本）或 Windows 11 才能使用。

## 编译步骤

### 安装 WSL2

可参考微软官方 [WSL 安装文档](https://learn.microsoft.com/zh-cn/windows/wsl/install)，不在此赘述。

### 编译 Doris

通过使用 WSL2 启动的 Linux 子系统，选择任意 Doris 在 Linux 上的编译方式即可。

-   [使用 LDB Toolchain 编译](../../install/source-install/compilation-with-ldb-toolchain) 

-   [使用 Docker 开发镜像编译（推荐）](../../install/source-install/compilation-with-docker) 

## 注意事项

默认 WSL2 的发行版数据存储盘符为 C 盘，如有需要提前切换存储盘符，以防止系统盘符占满。