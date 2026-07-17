---
title: Data Lineage Plugin Development
language: en
description: Build, package, deploy, and verify an Apache Doris data lineage plugin that logs lineage events or forwards them to an external governance system.
keywords:
    - Apache Doris
    - data lineage
    - LineagePlugin
    - LineagePluginFactory
    - ServiceLoader
    - plugin development
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

<!-- Knowledge type: Extension development -->
<!-- Applicable scenario: Data governance integration / Kernel extension development -->

# Data Lineage Plugin Development

This document describes how to develop an external data lineage plugin for Apache Doris. The plugin receives a `LineageInfo` event after a supported DML statement succeeds, then converts the event and writes it to logs, a messaging system, or an external metadata governance platform.

> Applicable version: Apache Doris community edition 4.0.6 and later. Compile the plugin against the exact Doris community release or source revision deployed on the FE.

## Scope and lifecycle

The lineage framework is an FE-side SPI. It does not store lineage data, provide a query API, or render a lineage graph. A plugin converts the in-memory Java objects in `LineageInfo` to the format and transport protocol required by its downstream system.

The framework generates events only for successful `INSERT INTO ... SELECT`, `INSERT OVERWRITE ... SELECT`, and `CREATE TABLE AS SELECT` statements. `VALUES`-only writes and writes whose target is `__internal_schema` are skipped. `SELECT`, `UPDATE`, `DELETE`, and load jobs are outside the scope of this framework.

![Data lineage collection architecture: successful supported DML statements are analyzed by Nereids, extracted into LineageInfo, queued in FE, and delivered by a plugin to an external governance system.](/images/data-lineage/lineage-architecture.svg)

`eventFilter()` is called once before lineage extraction on the DML query path and again before worker dispatch. Return `false` when the plugin should not receive events. The method is called concurrently from query threads and the worker thread, so it must be thread-safe. `exec()` is called by one worker thread, but can run concurrently with `eventFilter()`.

At FE startup, ServiceLoader first discovers each `LineagePluginFactory`. FE then calls the Factory's `create(context)` method and calls `initialize(context)` on the returned plugin. The default `LineagePluginFactory.create(context)` implementation delegates to the no-argument `create()`, so the minimal example in this guide implements only `create()`. `PluginContext` contains `plugin.name` and `plugin.path`. A production plugin that reads a configuration file from its plugin directory can override `initialize(context)`, locate the file through `plugin.path`, and initialize its resources there.

## Lineage event model

`LineageInfo` contains a target table, target output columns, source tables, direct lineage, indirect lineage, and a `LineageContext`.

| Part | API | Meaning |
| --- | --- | --- |
| Target | `getTargetTable()`, `getTargetColumns()` | The target table and output columns of the write. |
| Source tables | `getTableLineageSet()` | Tables referenced by the analyzed logical plan. |
| Direct lineage | `getDirectLineageMap()` | A map from each output Slot to source expressions, classified as `IDENTITY`, `TRANSFORMATION`, or `AGGREGATION`. |
| Dataset indirect lineage | `getDatasetIndirectLineageMap()` | Expressions that affect the complete result set: `JOIN`, `FILTER`, `GROUP_BY`, and `SORT`. |
| Output indirect lineage | `getOutputIndirectLineageMap()` | Dependencies that affect a specific output column: `WINDOW` and `CONDITIONAL`. |
| Query context | `getContext()` | Query ID, SQL text, user, client IP, session database and catalog, execution state, timestamp, duration, and sanitized external catalog properties. |

Direct lineage describes how an output value is produced. A plain source-column reference is `IDENTITY`, for example `target.customer_id <- source.customer_id`. A calculation, function, window expression, or conditional expression without an aggregate function is `TRANSFORMATION`, for example `UPPER(source.region)`. An expression that contains an aggregate function is `AGGREGATION`, for example `SUM(source.amount)`. Indirect lineage records expressions that affect the output without directly becoming an output value, including Join keys, `WHERE` and `HAVING` predicates, grouping keys, and sorting keys. `WINDOW` records window partitioning and ordering inputs. `CONDITIONAL` records the effect of `CASE`, `IF`, or `COALESCE` on a specific output column.

### Lineage event model example

The following example uses one source table and one target table to cover all three direct-lineage types, dataset indirect lineage, and output indirect lineage. The current user must have privileges to create a database and tables, write data, and query data.

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

The query returns:

```text
+--------+--------------+------------+--------------+
| region | total_amount | region_seq | region_group |
+--------+--------------+------------+--------------+
| east   |       100.00 |          1 | CORE         |
| west   |        80.00 |          2 | OTHER        |
+--------+--------------+------------+--------------+
```

The first, `VALUES`-only Insert does not generate an event. After `INSERT INTO lineage_target ... SELECT` succeeds, its event contains these key relationships:

| Lineage level | Content in this example |
| --- | --- |
| Table lineage | `internal.lineage_demo.lineage_source` -> `internal.lineage_demo.lineage_target`. |
| Direct column lineage | `region` is `IDENTITY`; `total_amount` is `AGGREGATION`; `region_seq` and `region_group` are `TRANSFORMATION`. |
| Dataset indirect lineage | `FILTER` is `status = 'PAID'`; `GROUP_BY` is `region`; `SORT` is `SUM(amount) DESC`. |
| Output indirect lineage | The `WINDOW` dependency of `region_seq` is `region`; the `CONDITIONAL` dependency of `region_group` is `region = 'east'`. |
| Query context | Contains the actual Query ID, the Insert SQL above, execution user, and client IP. The session database is `lineage_demo`, the Internal Catalog is `internal`, and the execution state is `OK`. |

This example has no Join and therefore no dataset-level `JOIN` dependency. A query with a Join records the Join condition as a dataset-level `JOIN` dependency.

Before the event reaches the plugin, the extractor resolves CTE producer expressions and expands `UNION` branches. A plugin should still treat `Expression`, `SlotReference`, and `TableIf` as Doris internal Java objects and convert them to stable names or a downstream schema before sending them outside FE.

## Develop a plugin

This section uses the public `4.0.6` tag from the official `github.com/apache/doris` community repository and adds an `example-lineage` Maven submodule inside the source tree. The plugin writes each event only to the FE log. It does not start an HTTP service or depend on an external governance platform. This implementation demonstrates the complete plugin development and loading flow. A production plugin can convert `LineageInfo` to a third-party schema, call an API exposed by a metadata platform such as OpenMetadata, or emit lineage events that conform to the OpenLineage specification. All source paths below are relative to the same Doris source root.

### Step 1: Prepare the Doris source

Check out the public release that exactly matches the target FE, and record the source root in `DORIS_SOURCE`:

```shell
git clone https://github.com/apache/doris.git
export DORIS_SOURCE="$(pwd)/doris"
cd "${DORIS_SOURCE}"
git checkout 4.0.6
```

Every subsequent `$DORIS_SOURCE/fe_plugins/...` path refers to this source directory. Do not replace it with the FE installation directory, and do not compile against FE JARs from another version.

### Step 2: Create the Maven modules

Run the following commands from the Doris source root:

```shell
cd "${DORIS_SOURCE}"
mkdir -p fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example
mkdir -p fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services
```

After this section, the new files have the following layout:

```text
$DORIS_SOURCE/
└── fe_plugins/
    ├── pom.xml                                      # Existing file; add the lineage module
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

Edit the existing `$DORIS_SOURCE/fe_plugins/pom.xml` and add `lineage` to its `<modules>`. Keep all existing modules; do not replace the complete file with this fragment:

```xml
<modules>
    <!-- Keep the modules already present in fe_plugins/pom.xml -->
    <module>lineage</module>
</modules>
```

Create `$DORIS_SOURCE/fe_plugins/lineage/pom.xml`:

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

Create `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/pom.xml`:

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

All dependencies use `provided` because FE supplies these APIs. Do not package Doris or Log4j classes in the plugin JAR.

### Step 3: Implement the Factory

Create `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/ExampleLineagePluginFactory.java`:

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

The `example-lineage` value returned by `name()` is the unique plugin identifier. The later `activate_lineage_plugin` setting must use exactly the same value.

### Step 4: Implement the logging plugin

Create `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/LoggingLineagePlugin.java`:

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

This example does not log the original SQL, external catalog properties, or authentication information. Direct and indirect lineage expressions can still contain SQL literals, so use this implementation only for development validation. A production plugin should sanitize expressions according to its security policy, limit the length of each log entry, and decide whether to record user and client IP values.

### Step 5: Register the Factory

Create `$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory`. The file contains only the fully qualified Factory class name:

```text
org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory
```

Each external plugin directory can expose only one `LineagePluginFactory`. Factory names must also be unique across all loaded plugins.

### Step 6: Build the plugin

Before the first plugin build in this source directory, prepare the Doris source build environment for [Linux](/community/source-install/compilation-linux) or [macOS](/community/source-install/compilation-mac), then build FE once. The following environment variables disable only the UI, Hive UDF, and BE Java extensions that the lineage plugin build does not require. They do not skip FE:

```shell
cd "${DORIS_SOURCE}"
DISABLE_BUILD_UI=ON \
DISABLE_BE_JAVA_EXTENSIONS=ON \
DISABLE_BUILD_HIVE_UDF=ON \
./build.sh --fe
```

This step generates the Thrift and Protobuf sources and builds FE. Do not skip it and run the Maven command below directly in a newly checked-out source tree; compilation fails because generated classes such as `org.apache.doris.thrift` are missing. You do not need to repeat it after `./build.sh --fe` has already succeeded for the same source version.

Next, install the FE modules required by the plugin into the local Maven repository, then build the plugin submodule:

```shell
cd "${DORIS_SOURCE}"
mvn -f fe/pom.xml install \
  -pl fe-common,fe-extension-spi,fe-extension-loader,fe-core \
  -DskipTests -Dcheckstyle.skip=true
mvn -f fe_plugins/pom.xml -pl lineage/example-lineage -am clean package \
  -DskipTests -Dcheckstyle.skip=true
```

A successful build creates:

```text
$DORIS_SOURCE/fe_plugins/lineage/example-lineage/target/example-lineage.jar
```

Inspect the SPI file and JAR contents:

```shell
PLUGIN_JAR="${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar"
unzip -p "${PLUGIN_JAR}" \
  META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory
if jar tf "${PLUGIN_JAR}" | grep -qE '^org/apache/doris/(nereids|extension)/'; then
  echo "ERROR: Doris API classes must not be packaged in the plugin JAR" >&2
  exit 1
fi
```

The first command must print `org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory`. The subsequent check prints nothing and returns zero when the JAR does not contain Doris API classes.

### Step 7: Deploy and activate the plugin

In this section, `FE_HOME` denotes one FE installation directory containing `bin/`, `conf/`, and `lib/`, not the Doris source directory. `start_fe.sh` sets this directory as the FE process's `DORIS_HOME`. Copy the JAR to every FE:

```shell
export FE_HOME=/opt/apache-doris/fe
mkdir -p "${FE_HOME}/plugins/lineage/example-lineage"
cp "${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar" \
  "${FE_HOME}/plugins/lineage/example-lineage/"
```

The operating-system user that runs FE must be able to read the plugin directory and JAR.

The deployed layout is:

```text
$FE_HOME/
└── plugins/
    └── lineage/
        └── example-lineage/
            └── example-lineage.jar
```

Edit `$FE_HOME/conf/fe.conf` on every FE:

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| Configuration | Type and default | Required | Effect |
| --- | --- | --- | --- |
| `plugin_dir` | String; `$FE_HOME/plugins` | No | Plugin root directory. The lineage loader scans its direct children under `lineage/`. Omit this setting when using the default directory. |
| `activate_lineage_plugin` | String array; empty | Explicit configuration recommended | Comma-separated Factory names to instantiate. An empty value instantiates every discovered Factory. |
| `lineage_event_queue_size` | Positive integer; `50000` | No | Maximum events waiting for the worker on the current FE. New events are discarded when the queue is full. |

These settings apply to the current FE process and are read only at startup. Deploy and configure the plugin on every FE that can execute DML. Restart the corresponding FE after changing a setting or replacing the JAR. The settings cannot be changed dynamically through `ADMIN SET FRONTEND CONFIG`.

## Verify the plugin

After restarting FE, first confirm that the plugin loaded. If the FE log directory was customized, replace `FE_LOG` with the actual `fe.log` path:

```shell
export FE_LOG="${FE_HOME}/log/fe.log"
grep 'Loaded lineage plugin: example-lineage' "${FE_LOG}" | tail -1
```

Run the preceding [lineage event model example](#lineage-event-model-example), then query the latest event:

```shell
grep 'LINEAGE_EVENT' "${FE_LOG}" | tail -1
```

The log must contain the actual Query ID, `InsertIntoTableCommand`, target table `lineage_target`, source table `lineage_source`, and the `direct`, `datasetIndirect`, and `outputIndirect` sections. For example:

```text
LINEAGE_EVENT queryId=<query-id> command=InsertIntoTableCommand ...
target=internal.lineage_demo.lineage_target
sources=[internal.lineage_demo.lineage_source] direct={...}
datasetIndirect={...} outputIndirect={...}
```

The actual log is one line; it is wrapped above for readability. `INSERT INTO lineage_source VALUES ...` does not generate an event. Only `INSERT INTO lineage_target ... SELECT` produces this log entry.

When validation is complete and the example data is no longer needed, run:

```sql
DROP DATABASE lineage_demo;
```

## Reliability and troubleshooting

| Condition | Framework behavior | Plugin recommendation |
| --- | --- | --- |
| Queue is full | The new event is discarded and a warning is logged. The DML result is unaffected. | Keep `exec()` fast; batch or buffer downstream writes outside the FE critical path. |
| `exec()` throws | The worker logs the exception and continues with the next plugin or event. | Catch expected downstream failures, add bounded retries, and expose metrics. |
| `exec()` returns `false` | The current framework ignores the return value. It does not retry, requeue the event, or change the DML state. | Record the failure and implement bounded retries inside the plugin. Do not rely on the return value for recovery. |
| Plugin is slow | One worker dispatches events serially. A slow plugin delays every following event. | Use a bounded internal queue and a separate sender pool for a slow downstream system. |
| Duplicate Factory name | The first discovered Factory is retained and the duplicate is skipped. | Use a globally unique name. |
| JAR changes after startup | The loader does not watch, reload, or unload plugin directories. | Restart FE after replacing JARs or dependencies. |

### Diagnose problems from FE logs

| Log keyword | Common cause | Action |
| --- | --- | --- |
| `Skip lineage plugin directory due to load failure` | The plugin directory has no JAR, the SPI file is missing, the directory exposes multiple factories, or dependency loading failed. | Inspect the directory and JAR, confirm that the SPI file contains one Factory class name, and inspect `stage` and `message` in the exception. |
| `Skip lineage plugin not in activate_lineage_plugin` | The Factory was discovered, but its `name()` is not in the activation list. | Compare the Factory name with `activate_lineage_plugin`. Names are case-sensitive. |
| `Failed to create/initialize lineage plugin` | `create(context)` or `initialize(context)` threw an exception. | Inspect the stack trace, initialization logic, configuration files, and directory permissions. |
| `the lineage event queue is full` | The plugin consumes events more slowly than they are produced, and the current FE queue is full. | First shorten `exec()` processing time and investigate downstream blocking, then evaluate whether to increase `lineage_event_queue_size`. |

### Disable and roll back the plugin

To disable the plugin, stop the corresponding FE, move the plugin directory out of `plugin_dir/lineage/`, remove `example-lineage` from `activate_lineage_plugin`, and start FE. Do not only clear `activate_lineage_plugin` while leaving the JAR in place, because an empty list activates every discovered lineage plugin.

```shell
mkdir -p "${FE_HOME}/plugins-disabled"
mv "${FE_HOME}/plugins/lineage/example-lineage" \
  "${FE_HOME}/plugins-disabled/"
```

After FE starts, confirm that no new `Loaded lineage plugin: example-lineage` entry appears. To restore the plugin, move the directory back under `${FE_HOME}/plugins/lineage/`, restore `activate_lineage_plugin`, and restart FE again.

Lineage delivery is best effort and is not transactional with the DML. A successful DML does not guarantee delivery to an external governance system. Use the Query ID and target table to construct idempotent downstream event identifiers.
