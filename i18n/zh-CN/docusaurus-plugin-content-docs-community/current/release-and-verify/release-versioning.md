---
title: Apache Doris 版本规则与版本选择
language: zh-CN
description: Apache Doris 版本号规则（主/次/补丁）、升降级兼容性策略与 CPU Binary 选择说明。
keywords:
    - Apache Doris 版本号
    - Doris 版本规则
    - Doris 升级降级
    - Latest Stable 版本
    - x64 avx2 ARM64
    - Doris Binary 选择
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

# Apache Doris 版本规则与版本选择

<!-- 知识类型: 规则规范 -->
<!-- 适用场景: 版本选择 / 升降级评估 / 部署前检查 -->

本文说明 Apache Doris 的版本号语义、升降级兼容性策略，以及如何根据 CPU 架构选择合适的 Binary。

## 版本号规则

Apache Doris 使用三位版本号 `X.Y.Z`，每一位的含义、典型变更内容和发布周期如下：

| 位次 | 名称 | 含义 | 发布周期 |
| --- | --- | --- | --- |
| X | 主版本（Major） | 重大功能发布或架构升级 | 年级别 |
| Y | 次版本（Minor） | 重要功能、性能优化，或必要的元数据/数据格式变更 | 季度级别 |
| Z | 补丁版本（Patch） | Bug 修复、性能优化以及小型功能更新 | 通常每 2-4 周一次 |

## 版本升级和降级

<!-- 知识类型: 规则规范 -->

| 升级类型 | 前向兼容（旧→新） | 后向兼容（新→旧） | 建议 |
| --- | --- | --- | --- |
| 主版本（X） | 兼容 | 不保证 | 升级前做好数据备份 |
| 次版本（Y） | 兼容 | 不保证 | 升级前做好数据备份 |
| 补丁版本（Z） | 兼容 | 兼容 | 可直接升降级，无数据兼容性顾虑 |

主版本（X）和次版本（Y）的升级可能涉及元数据或数据格式变更。Apache Doris 保证这些变更可以向前兼容（即从老版本升级到新版本），但不保证向后兼容（即不保证新版本可以降级到老版本）。补丁版本（Z）则同时支持升级与降级。

## 如何选择版本

Apache Doris 团队主要维护最新的两位版本分支，分别标注为 **Latest** 和 **Stable**：

| 标签 | 包含内容 | 适用场景 |
| --- | --- | --- |
| Latest | 最新功能、优化与问题修复 | 试用新功能、POC 验证、性能测试、预上线 |
| Stable | 持续的 Bug 修复，稳定性更高 | 生产环境 |

## CPU 型号与 Binary 版本

<!-- 知识类型: 硬件要求 -->
<!-- 适用场景: 部署前检查 / 环境验收 -->

Apache Doris 针对不同的 CPU 架构和指令集提供三种 Binary：

| Binary 名称 | 适用 CPU | 说明 |
| --- | --- | --- |
| x64(avx2) | 支持 AVX2 指令的 x86_64 CPU | 默认推荐，性能最佳 |
| x64(no avx2) | 不支持 AVX2 指令的 x86_64 CPU | 较老的 x86_64 处理器使用 |
| ARM64 | ARM 架构 CPU | 适用于 ARM 服务器（如鲲鹏、Graviton） |

:::tip 提示
可以通过以下命令查看 CPU 是否支持 AVX2 指令：

```bash
cat /proc/cpuinfo | grep avx2
```

若有输出则表示支持 AVX2，可选择 `x64(avx2)` Binary。
:::

## FAQ

**Q：从 2.0.x 可以直接降级回 1.2.x 吗？**

不可以。跨主版本/次版本的降级不保证元数据与数据格式兼容，建议在主/次版本升级前做完整备份。

**Q：补丁版本是否可以跳跃升级（如 2.0.1 直接升到 2.0.5）？**

可以。补丁版本之间保持前后向兼容，可以直接跳跃升降级。

**Q：如何确认我应该选择 Latest 还是 Stable？**

生产环境优先选择 Stable；评测、试验新特性请选择 Latest。
