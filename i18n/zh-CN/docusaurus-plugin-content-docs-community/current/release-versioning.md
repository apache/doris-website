---
{
    "title": "版本规则",
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

## 版本号规则

Apache Doris 使用三位版本号（X.Y.Z）

- **主版本（X）**：代表重大功能发布或架构升级。主版本变通常以年级别为周期变更。

- **次版本（Y）**：代表重要功能的发版、性能优化或必要性的元数据与数据格式的变更。次版本变更通常以季度为周期更新。

- **补丁版本（Z）**：主要用于修复 Bug、性能优化以及功能更新。补丁版本更新周期短，通常每 2-4 周发布新版本。

## 版本升级和降级

- 主版本（X）和次版本（Y）的升级可能涉及元数据或数据格式的变更。Apache Doris 保证这些变更可以向前兼容（即可以从老版本升级到新版本），但不保证向后兼容（即不保证新版本可以降级到老版本）。因此，建议进行主版本或次版本升级前，做好数据备份。

- 补丁版本（Z）保证前后向兼容，支持新版本和老版本之间的升降级，无需担心数据兼容性问题。

## 如何选择版本

Apache Doris 团队主要维护最新的两位版本分支，通常标注为 Latest 和 Stable。

- **Latest 版本**：包含最新的功能、优化和问题修复，适合希望试用新功能、进行可行性验证（POC）、性能测试或测试环境预上线的用户使用。

- **Stable 版本**：持续包含对应分支的 Bug 修复，稳定性更高，建议生产环境使用此版本。

## CPU 型号与 Binary 版本

Apache Doris 提供三种不同的 Binary 以对应不同的 CPU 型号：

- x64(avx2)：适用于支持 avx2 指令的 x86_64 架构 CPU。

- x64(no avx2)：适用于不支持 avx2 指令的 x86_64 架构 CPU。

- ARM64：适用于 ARM 架构的 CPU。

:::tip 提示
可以通过 `cat /proc/cpuinfo |grep avx2` 命令查看 CPU 是否支持 avx2 指令。
:::