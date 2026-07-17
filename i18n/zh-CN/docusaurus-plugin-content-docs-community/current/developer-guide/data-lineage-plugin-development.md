---
title: 数据血缘插件开发
language: zh-CN
description: 介绍如何基于 Apache Doris 4.0.6 源码逐步开发、编译、打包、部署和验证数据血缘插件，说明事件模型、目录路径、FE 配置、日志验证、可靠性处理和故障排查，并介绍对接 OpenMetadata、OpenLineage 等外部治理组件的扩展方式。
keywords:
    - Apache Doris
    - 数据血缘
    - LineagePlugin
    - LineagePluginFactory
    - ServiceLoader
    - 插件开发
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

<!-- 知识类型: 扩展开发 -->
<!-- 适用场景: 数据治理系统集成 / 内核扩展开发 -->

# 数据血缘插件开发

本文介绍如何为 Apache Doris 开发外部数据血缘插件。插件会在受支持的 DML 成功执行后接收 `LineageInfo` 事件，再将其转换并写入日志、消息系统或外部元数据治理平台。

> 适用版本：Apache Doris 社区开源版 4.0.6 及以后版本。插件必须针对 FE 实际部署的 Doris 社区版本或源码修订版本编译。

## 范围和生命周期

血缘框架是 FE 侧的 SPI。它不保存血缘数据、不提供查询 API，也不渲染血缘图。插件负责将 `LineageInfo` 中的内存 Java 对象转换为下游系统要求的格式和传输协议。

该框架仅为成功执行的 `INSERT INTO ... SELECT`、`INSERT OVERWRITE ... SELECT` 和 `CREATE TABLE AS SELECT` 生成事件。仅包含 `VALUES` 的写入和写入目标为 `__internal_schema` 的操作会被跳过。`SELECT`、`UPDATE`、`DELETE` 以及各类导入任务不在该框架的覆盖范围内。

![数据血缘采集架构：受支持的 DML 成功后，由 Nereids 分析并提取为 LineageInfo，经 FE 队列和插件投递到外部治理系统。](/images/data-lineage/lineage-architecture-zh-CN.svg)

`eventFilter()` 会在 DML 查询路径上、血缘提取前调用一次，也会在工作线程分发前再次调用。插件不需要接收事件时应返回 `false`。该方法会被查询线程和工作线程并发调用，因此必须线程安全。`exec()` 只由一个工作线程调用，但可能与 `eventFilter()` 并发执行。

FE 启动时先通过 ServiceLoader 发现 `LineagePluginFactory`，再调用 Factory 的 `create(context)` 创建插件，随后调用插件的 `initialize(context)`。`LineagePluginFactory` 默认会把 `create(context)` 委托给无参数的 `create()`，因此本文的最小示例只需实现 `create()`。`PluginContext` 包含 `plugin.name` 和 `plugin.path`；生产插件如需读取插件目录内的配置文件，可以覆盖 `initialize(context)`，根据 `plugin.path` 定位文件并完成资源初始化。

## 血缘事件模型

`LineageInfo` 包含目标表、目标输出列、源表、直接血缘、间接血缘和 `LineageContext`。

| 部分 | API | 含义 |
| --- | --- | --- |
| 目标 | `getTargetTable()`、`getTargetColumns()` | 写入的目标表和目标输出列。 |
| 源表 | `getTableLineageSet()` | 已分析逻辑计划中引用的表。 |
| 直接血缘 | `getDirectLineageMap()` | 每个输出 Slot 到源表达式的映射，类型为 `IDENTITY`、`TRANSFORMATION` 或 `AGGREGATION`。 |
| 数据集级间接血缘 | `getDatasetIndirectLineageMap()` | 影响整个结果集的表达式：`JOIN`、`FILTER`、`GROUP_BY` 和 `SORT`。 |
| 输出列级间接血缘 | `getOutputIndirectLineageMap()` | 仅影响特定输出列的依赖：`WINDOW` 和 `CONDITIONAL`。 |
| 查询上下文 | `getContext()` | Query ID、SQL 文本、用户、客户端 IP、会话库和 Catalog、执行状态、时间戳、耗时及已脱敏的外部 Catalog 属性。 |

直接血缘描述输出值的产生方式：纯源列引用为 `IDENTITY`，例如 `target.customer_id <- source.customer_id`；不包含聚合函数的计算、函数、窗口或条件表达式为 `TRANSFORMATION`，例如 `UPPER(source.region)`；包含聚合函数的表达式为 `AGGREGATION`，例如 `SUM(source.amount)`。间接血缘记录影响输出、但不直接成为输出值的表达式，例如 Join Key、`WHERE`/`HAVING` 条件、分组键和排序键。`WINDOW` 记录窗口的分区和排序输入，`CONDITIONAL` 记录 `CASE`、`IF` 或 `COALESCE` 对特定输出列的影响。

### 血缘事件模型示例

以下示例通过一个源表和一个目标表覆盖三类直接血缘、数据集级间接血缘以及输出列级间接血缘。示例需要当前用户具有创建数据库、创建表、写入和查询权限。

```sql
CREATE DATABASE IF NOT EXISTS lineage_demo;
USE lineage_demo;

CREATE TABLE lineage_source (
    region VARCHAR(32),
    amount DECIMAL(18, 2),
    status VARCHAR(16)
)
DUPLICATE KEY(region)
DISTRIBUTED BY HASH(region) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_target (
    region VARCHAR(32),
    total_amount DECIMAL(18, 2),
    region_seq BIGINT,
    region_group VARCHAR(16)
)
DUPLICATE KEY(region)
DISTRIBUTED BY HASH(region) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO lineage_source VALUES
    ('east', 100.00, 'PAID'),
    ('east', 30.00, 'CANCELLED'),
    ('west', 80.00, 'PAID');

INSERT INTO lineage_target
SELECT
    region,
    SUM(amount) AS total_amount,
    ROW_NUMBER() OVER (ORDER BY region) AS region_seq,
    CASE
        WHEN region = 'east' THEN 'CORE'
        ELSE 'OTHER'
    END AS region_group
FROM lineage_source
WHERE status = 'PAID'
GROUP BY region
ORDER BY SUM(amount) DESC;

SELECT region, total_amount, region_seq, region_group
FROM lineage_target
ORDER BY region;
```

查询结果如下：

```text
+--------+--------------+------------+--------------+
| region | total_amount | region_seq | region_group |
+--------+--------------+------------+--------------+
| east   |       100.00 |          1 | CORE         |
| west   |        80.00 |          2 | OTHER        |
+--------+--------------+------------+--------------+
```

仅包含 `VALUES` 的第一个 Insert 不会生成事件。`INSERT INTO lineage_target ... SELECT` 成功后生成的事件包含以下关键关系。

| 血缘层级 | 该示例中的内容 |
| --- | --- |
| 表级血缘 | `internal.lineage_demo.lineage_source` -> `internal.lineage_demo.lineage_target`。 |
| 列级直接血缘 | `region` 为 `IDENTITY`；`total_amount` 为 `AGGREGATION`；`region_seq` 和 `region_group` 为 `TRANSFORMATION`。 |
| 数据集级间接血缘 | `FILTER` 为 `status = 'PAID'`；`GROUP_BY` 为 `region`；`SORT` 为 `SUM(amount) DESC`。 |
| 输出列级间接血缘 | `region_seq` 的 `WINDOW` 依赖为 `region`；`region_group` 的 `CONDITIONAL` 依赖为 `region = 'east'`。 |
| 查询上下文 | 包含实际 Query ID、上述 Insert SQL、执行用户和客户端 IP；会话数据库为 `lineage_demo`，Internal Catalog 为 `internal`，执行状态为 `OK`。 |

该示例没有 Join，因此不会产生 `JOIN` 间接血缘。带 Join 的查询会把 Join 条件记录为数据集级 `JOIN` 依赖。

事件到达插件前，提取器会解析 CTE 生产者表达式，并展开 `UNION` 的各分支。插件仍应将 `Expression`、`SlotReference` 和 `TableIf` 视为 Doris 内部 Java 对象，在发送到 FE 外部前转换为稳定的名称或下游系统格式。

## 开发插件

本节以 `github.com/apache/doris` 官方社区开源仓库的 `4.0.6` 标签为例，在源码内新增一个 `example-lineage` Maven 子模块。插件收到事件后只写入 FE 日志，不启动 HTTP 服务，也不依赖外部治理平台。该实现用于演示完整的插件开发和加载流程；实际插件可以将 `LineageInfo` 转换为第三方系统需要的格式，调用 OpenMetadata 等元数据治理平台的接口，或发送符合 OpenLineage 规范的血缘事件。以下所有源码路径都相对于同一个 Doris 源码根目录。

### 第 1 步：准备 Doris 源码

从 Apache Doris 官方社区开源仓库检出与目标 FE 完全一致的公开版本，并用 `DORIS_SOURCE` 记录源码根目录：

```shell
git clone https://github.com/apache/doris.git
export DORIS_SOURCE="$(pwd)/doris"
cd "${DORIS_SOURCE}"
git checkout 4.0.6
```

后文中的 `$DORIS_SOURCE/fe_plugins/...` 都指向这个源码目录。不要用 FE 安装目录替代源码目录，也不要使用其他版本的 FE JAR 编译插件。

### 第 2 步：创建 Maven 模块

在 Doris 源码根目录执行：

```shell
cd "${DORIS_SOURCE}"
mkdir -p fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example
mkdir -p fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services
```

完成本节后，新增文件应形成以下结构：

```text
$DORIS_SOURCE/
└── fe_plugins/
    ├── pom.xml                                      # 已有文件，需要增加 lineage 模块
    └── lineage/
        ├── pom.xml
        └── example-lineage/
            ├── pom.xml
            └── src/main/
                ├── java/org/apache/doris/plugin/lineage/example/
                │   ├── ExampleLineagePluginFactory.java
                │   └── LoggingLineagePlugin.java
                └── resources/META-INF/services/
                    └── org.apache.doris.nereids.lineage.LineagePluginFactory
```

编辑已有文件 `$DORIS_SOURCE/fe_plugins/pom.xml`，在其 `<modules>` 中增加 `lineage`。保留原有模块，不要用下面片段覆盖整个文件：

```xml
<modules>
    <!-- 保留 fe_plugins/pom.xml 中已有的 module -->
    <module>lineage</module>
</modules>
```

创建 `$DORIS_SOURCE/fe_plugins/lineage/pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
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
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.apache.doris</groupId>
        <artifactId>fe-plugins</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>lineage</artifactId>
    <packaging>pom</packaging>
    <modules>
        <module>example-lineage</module>
    </modules>
</project>
```

创建 `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/pom.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
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
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.apache.doris</groupId>
        <artifactId>lineage</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>example-lineage</artifactId>
    <packaging>jar</packaging>
    <dependencies>
        <dependency>
            <groupId>org.apache.doris</groupId>
            <artifactId>fe-core</artifactId>
            <version>${doris.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.doris</groupId>
            <artifactId>fe-extension-spi</artifactId>
            <version>${doris.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <build>
        <finalName>example-lineage</finalName>
    </build>
</project>
```

所有依赖都使用 `provided`，因为这些 API 由 FE 提供。插件 JAR 中不能再次打入 Doris 或 Log4j 类。

### 第 3 步：实现 Factory

创建 `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/ExampleLineagePluginFactory.java`：

```java
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.doris.plugin.lineage.example;

import org.apache.doris.nereids.lineage.LineagePlugin;
import org.apache.doris.nereids.lineage.LineagePluginFactory;

/** Factory discovered by ServiceLoader at FE startup. */
public class ExampleLineagePluginFactory implements LineagePluginFactory {
    @Override
    public String name() {
        return "example-lineage";
    }

    @Override
    public LineagePlugin create() {
        return new LoggingLineagePlugin();
    }
}
```

`name()` 返回的 `example-lineage` 是插件的唯一标识，后续 `activate_lineage_plugin` 必须使用完全相同的名称。

### 第 4 步：实现日志插件

创建 `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/LoggingLineagePlugin.java`：

```java
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.doris.plugin.lineage.example;

import org.apache.doris.catalog.TableIf;
import org.apache.doris.nereids.lineage.LineageContext;
import org.apache.doris.nereids.lineage.LineageInfo;
import org.apache.doris.nereids.lineage.LineagePlugin;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Objects;
import java.util.stream.Collectors;

/** Minimal lineage plugin that writes one summary line for each event. */
public class LoggingLineagePlugin implements LineagePlugin {
    private static final Logger LOG = LogManager.getLogger(LoggingLineagePlugin.class);
    private static final String PLUGIN_NAME = "example-lineage";

    @Override
    public String name() {
        return PLUGIN_NAME;
    }

    @Override
    public boolean eventFilter() {
        return true;
    }

    @Override
    public boolean exec(LineageInfo lineageInfo) {
        if (lineageInfo == null) {
            return false;
        }

        LineageContext context = lineageInfo.getContext();
        LOG.info("LINEAGE_EVENT queryId={} command={} user={} clientIp={} "
                        + "catalog={} database={} state={} durationMs={} target={} sources={} "
                        + "direct={} datasetIndirect={} outputIndirect={}",
                value(context == null ? null : context.getQueryId()),
                command(context),
                value(context == null ? null : context.getUser()),
                value(context == null ? null : context.getClientIp()),
                value(context == null ? null : context.getCatalog()),
                value(context == null ? null : context.getDatabase()),
                value(context == null ? null : context.getState()),
                context == null ? -1L : context.getDurationMs(),
                tableName(lineageInfo.getTargetTable()),
                sourceTables(lineageInfo),
                lineageInfo.getDirectLineageMap(),
                lineageInfo.getDatasetIndirectLineageMap(),
                lineageInfo.getOutputIndirectLineageMap());
        return true;
    }

    private String sourceTables(LineageInfo lineageInfo) {
        if (lineageInfo.getTableLineageSet() == null) {
            return "[]";
        }
        return lineageInfo.getTableLineageSet().stream()
                .filter(Objects::nonNull)
                .map(TableIf::getNameWithFullQualifiers)
                .sorted()
                .collect(Collectors.joining(",", "[", "]"));
    }

    private String tableName(TableIf table) {
        return table == null ? "" : table.getNameWithFullQualifiers();
    }

    private String command(LineageContext context) {
        return context == null || context.getSourceCommand() == null
                ? "" : context.getSourceCommand().getSimpleName();
    }

    private String value(String value) {
        return value == null ? "" : value;
    }
}
```

该示例不打印原始 SQL、外部 Catalog 属性或认证信息。直接和间接血缘表达式仍可能包含 SQL 字面量，因此该实现只适合开发验证；生产插件应按自身安全规范对表达式脱敏、限制单条日志长度，并决定是否记录用户和客户端 IP。

### 第 5 步：注册 Factory

创建 `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory`，文件中只写一行 Factory 类名：

```text
org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory
```

每个外部插件目录只能暴露一个 `LineagePluginFactory`。Factory 名称还必须在所有已加载插件中保持唯一。

### 第 6 步：构建插件

首次在该源码目录中构建插件前，需要先准备 Doris 的源码编译环境。根据操作系统完成 [Linux 编译环境准备](/community/source-install/compilation-linux)或 [macOS 编译环境准备](/community/source-install/compilation-mac)，再执行一次 FE 构建。以下环境变量只关闭血缘插件编译不需要的 UI、Hive UDF 和 BE Java 扩展，不会跳过 FE：

```shell
cd "${DORIS_SOURCE}"
DISABLE_BUILD_UI=ON \
DISABLE_BE_JAVA_EXTENSIONS=ON \
DISABLE_BUILD_HIVE_UDF=ON \
./build.sh --fe
```

该步骤会生成 Thrift 和 Protobuf 源码并构建 FE。不能在全新检出的源码树中跳过该步骤直接执行下面的 Maven 命令；否则会因缺少 `org.apache.doris.thrift` 等生成类而编译失败。同一源码版本已成功执行过 `./build.sh --fe` 时不需要重复执行。

接着将插件依赖的 FE 模块安装到本地 Maven 仓库，再构建插件子模块：

```shell
cd "${DORIS_SOURCE}"
mvn -f fe/pom.xml install \
  -pl fe-common,fe-extension-spi,fe-extension-loader,fe-core \
  -DskipTests -Dcheckstyle.skip=true
mvn -f fe_plugins/pom.xml -pl lineage/example-lineage -am clean package \
  -DskipTests -Dcheckstyle.skip=true
```

构建成功后生成：

```text
$DORIS_SOURCE/fe_plugins/lineage/example-lineage/target/example-lineage.jar
```

检查 SPI 文件和 JAR 内容：

```shell
PLUGIN_JAR="${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar"
unzip -p "${PLUGIN_JAR}" \
  META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory
if jar tf "${PLUGIN_JAR}" | grep -qE '^org/apache/doris/(nereids|extension)/'; then
  echo "ERROR: Doris API classes must not be packaged in the plugin JAR" >&2
  exit 1
fi
```

第一条命令应输出 `org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory`。后续检查在未打入 Doris API 时不输出内容并返回 0。

### 第 7 步：部署和激活插件

`FE_HOME` 在本节表示单个 FE 的安装目录，其中包含 `bin/`、`conf/` 和 `lib/`，不是前面的 Doris 源码目录。`start_fe.sh` 会将该目录设置为 FE 进程的 `DORIS_HOME`。将 JAR 复制到每个 FE：

```shell
export FE_HOME=/opt/apache-doris/fe
mkdir -p "${FE_HOME}/plugins/lineage/example-lineage"
cp "${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar" \
  "${FE_HOME}/plugins/lineage/example-lineage/"
```

插件目录及 JAR 必须对运行 FE 的操作系统用户可读。

部署后的目录为：

```text
$FE_HOME/
└── plugins/
    └── lineage/
        └── example-lineage/
            └── example-lineage.jar
```

编辑每个 FE 的 `$FE_HOME/conf/fe.conf`：

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| 配置 | 类型和默认值 | 是否必填 | 作用 |
| --- | --- | --- | --- |
| `plugin_dir` | String；`$FE_HOME/plugins` | 否 | 插件根目录。血缘加载器扫描其 `lineage/` 直接子目录。使用默认目录时可以省略该配置。 |
| `activate_lineage_plugin` | String 数组；空 | 建议显式填写 | 需要实例化的 Factory 名称，以英文逗号分隔。空值会实例化全部已发现的 Factory。 |
| `lineage_event_queue_size` | 正整数；`50000` | 否 | 当前 FE 等待工作线程处理的最大事件数，超过后新事件将被丢弃。 |

这些参数作用于当前 FE 进程，只在启动时读取。所有可能执行 DML 的 FE 都需要部署并配置插件；修改配置或替换 JAR 后必须重启对应 FE，不支持通过 `ADMIN SET FRONTEND CONFIG` 动态生效。

## 验证插件

重启 FE 后，先确认插件加载成功。如果修改过 FE 日志目录，请将下面的 `FE_LOG` 替换为实际 `fe.log` 路径：

```shell
export FE_LOG="${FE_HOME}/log/fe.log"
grep 'Loaded lineage plugin: example-lineage' "${FE_LOG}" | tail -1
```

然后执行前文的[血缘事件模型示例](#血缘事件模型示例)，再查询最新事件：

```shell
grep 'LINEAGE_EVENT' "${FE_LOG}" | tail -1
```

日志应包含实际 Query ID、`InsertIntoTableCommand`、目标表 `lineage_target`、源表 `lineage_source`，以及 `direct`、`datasetIndirect` 和 `outputIndirect` 三部分。例如：

```text
LINEAGE_EVENT queryId=<query-id> command=InsertIntoTableCommand ...
target=internal.lineage_demo.lineage_target
sources=[internal.lineage_demo.lineage_source] direct={...}
datasetIndirect={...} outputIndirect={...}
```

实际日志是一行；上面为便于阅读进行了换行。`INSERT INTO lineage_source VALUES ...` 不生成事件，只有 `INSERT INTO lineage_target ... SELECT` 会产生该日志。

验证完成且不再需要示例数据时，可以执行：

```sql
DROP DATABASE lineage_demo;
```

## 可靠性和排障

| 情况 | 框架行为 | 插件建议 |
| --- | --- | --- |
| 队列已满 | 丢弃新事件并记录 warning，DML 结果不受影响。 | 保持 `exec()` 快速执行；在 FE 关键路径外批量或缓冲下游写入。 |
| `exec()` 抛出异常 | 工作线程记录异常后继续处理下一个插件或事件。 | 捕获可预期的下游异常，进行有界重试，并暴露监控指标。 |
| `exec()` 返回 `false` | 当前框架忽略返回值，不会重试、重新入队或改变 DML 状态。 | 插件必须自行记录失败并实现有界重试；不要依赖返回值触发恢复。 |
| 插件执行缓慢 | 单个工作线程串行分发事件，慢插件会延迟后续所有事件。 | 使用有界内部队列和独立发送线程池处理慢速下游。 |
| Factory 名称重复 | 保留第一个发现的 Factory，跳过重复项。 | 使用全局唯一的名称。 |
| 启动后替换 JAR | 加载器不监听目录变化，也不支持 reload 或 unload。 | 替换 JAR 或依赖后重启 FE。 |

### 根据 FE 日志定位问题

| 日志关键字 | 常见原因 | 处理方法 |
| --- | --- | --- |
| `Skip lineage plugin directory due to load failure` | 插件目录中没有 JAR、SPI 文件缺失、暴露了多个 Factory，或依赖加载失败。 | 检查插件目录和 JAR 内容，确认 SPI 文件中只有一个 Factory 类名，并检查异常堆栈中的 `stage` 和 `message`。 |
| `Skip lineage plugin not in activate_lineage_plugin` | Factory 已发现，但其 `name()` 不在激活列表中。 | 核对 Factory 名称和 `activate_lineage_plugin`，名称区分大小写。 |
| `Failed to create/initialize lineage plugin` | `create(context)` 或 `initialize(context)` 抛出异常。 | 根据异常堆栈检查初始化逻辑、配置文件和目录读取权限。 |
| `the lineage event queue is full` | 插件消费速度低于事件产生速度，当前 FE 的队列已满。 | 优先缩短 `exec()` 执行时间并排查下游阻塞，再评估是否增大 `lineage_event_queue_size`。 |

### 停用和回滚插件

停用插件时，先停止对应 FE，将插件目录移出 `plugin_dir/lineage/`，再从 `activate_lineage_plugin` 中移除 `example-lineage`，最后启动 FE。不要只清空 `activate_lineage_plugin` 而保留 JAR，因为空列表表示激活所有已发现的血缘插件。

```shell
mkdir -p "${FE_HOME}/plugins-disabled"
mv "${FE_HOME}/plugins/lineage/example-lineage" \
  "${FE_HOME}/plugins-disabled/"
```

启动 FE 后，确认日志中没有新的 `Loaded lineage plugin: example-lineage`。需要恢复时，将目录移回 `${FE_HOME}/plugins/lineage/`，恢复 `activate_lineage_plugin` 配置并再次重启 FE。

血缘投递采用尽力而为方式，不与 DML 事务绑定。DML 成功不代表事件已成功投递到外部治理系统。下游协议应以 Query ID 和目标表等信息构造幂等事件标识。
