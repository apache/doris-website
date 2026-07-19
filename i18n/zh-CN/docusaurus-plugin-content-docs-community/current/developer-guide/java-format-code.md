---
title: Java 代码格式化规范
language: zh-CN
description: Apache Doris Java 代码格式化规范：Import 顺序、Checkstyle 与 IDE 配置。
keywords:
    - Apache Doris
    - Java 代码格式化
    - Checkstyle
    - IDEA
    - VS Code
    - Import Order
    - formatter-check
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

# Java 代码格式化规范

<!-- 知识类型: 代码规范 -->
<!-- 适用场景: FE 开发 / Pull Request 提交 -->

Apache Doris 的 Java 部分代码（主要为 FE 模块）通常由 IDE 自动完成格式化。本文档列举通用的格式规则，并给出在不同 IDE 中的对应配置方式。CI 流程会通过 `formatter-check` 校验代码格式。

## Import Order 规则

<!-- 知识类型: 代码规范 -->

Import 语句必须按以下分组顺序排列，每组之间用一个空行分隔：

```text
org.apache.doris
<blank line>
third party package
<blank line>
standard java package
<blank line>
```

附加规则：

| 规则 | 说明 |
|------|------|
| 禁止 `import *` | 必须显式导入每一个类 |
| 禁止 `import static` | 不允许使用静态导入 |

## 编译时 Checkstyle 检查

使用 `maven` 编译时默认会执行 `Checkstyle` 检查，会略微降低编译速度。如需跳过检查，可使用以下命令：

```bash
mvn clean install -DskipTests -Dcheckstyle.skip
```

CI 中的 `formatter-check` 会强制进行代码格式检测，本地跳过仅用于开发调试，提交 PR 前请确保格式合规。

## Checkstyle 插件配置

### IDEA 配置 Checkstyle

1. 在设置中安装 `Checkstyle-IDEA` 插件。
2. 进入 `Tools -> Checkstyle` 的 `Configuration File`，点击 `Use a local Checkstyle file`。
3. 选择项目根目录下的 `fe/check/checkstyle/checkstyle.xml` 文件。
4. 确认 `Checkstyle` 的版本为 9.3 及以上（推荐使用最新版本）。

![](/images/idea-checkstyle-version.png)

配置完成后，即可使用 `Checkstyle-IDEA` 插件对代码进行 Checkstyle 检测：

![](/images/idea-checkstyle-plugin-cn.png)

### VS Code 配置 Checkstyle

1. 安装 `Checkstyle for Java` 插件。
2. 按照 [Java Linting 官方文档](https://code.visualstudio.com/docs/java/java-linting) 中的说明和动图完成配置。

## IDEA 代码格式化

### 自动格式化配置

推荐使用 IDEA 的自动格式化功能：

1. 进入 `Preferences -> Editor -> Code Style -> Java`。
2. 点击配置图标的 `Import Scheme`，选择 `IntelliJ IDEA code style XML`。
3. 选择项目根目录下的 `build-support/IntelliJ-code-format.xml` 文件。

### Rearrange Code 排序

Checkstyle 会按照 [Class and Interface Declarations](https://www.oracle.com/java/technologies/javase/codeconventions-fileorganization.html#1852) 检测代码声明的顺序。

导入上面的 `build-support/IntelliJ-code-format.xml` 后，使用 `Code/Rearrange Code` 即可自动完成排序：

![](/images/idea-rearrange-code.png)

## 自动移除未使用的 Import

| 操作目的 | 操作方式 |
|---------|---------|
| 仅删除未使用的导入 | 默认快捷键 `CTRL + ALT + O` |
| 保存时自动移除并 Reorder | 勾选 `Preferences -> Editor -> General -> Auto Import -> Optimize Imports on the Fly` |

## FAQ

**Q：CI 报 `formatter-check` 失败该如何排查？**

请在本地使用 IDEA 或 Checkstyle 插件运行检查，确保 Import 顺序、命名规范、声明顺序均符合 `fe/check/checkstyle/checkstyle.xml` 的要求后再次提交。

**Q：本地跳过 Checkstyle 后是否会影响 PR 合入？**

会。CI 仍然会执行 `formatter-check`，本地使用 `-Dcheckstyle.skip` 仅用于加快开发编译速度，最终代码必须通过 Checkstyle。
