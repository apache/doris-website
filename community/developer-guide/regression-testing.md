---
title: Regression Testing Framework
language: en
description: Introduction to the Apache Doris regression testing framework and a guide to writing test cases, covering Suites, Actions, external data source e2e tests, and CI integration.
keywords:
    - Apache Doris regression testing
    - regression test
    - Suite Action
    - Groovy test case
    - Doris testing framework
    - run-regression-test.sh
    - Docker Compose external data source
    - TeamCity integration
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

<!-- Knowledge type: Developer guide / Testing framework -->
<!-- Applicable scenario: Kernel development / Submitting PRs / Writing regression cases -->

# Regression Testing Framework

This document is for developers who need to write or run regression tests for Apache Doris. It introduces the core concepts, directory layout, and configuration of the testing framework, along with the built-in Actions and the usage of external data source e2e tests.

## Contents

- [Quick Start](#quick-start): Run your first case in 5 steps
- [Core Concepts](#core-concepts): The three abstractions Suite / Group / Action
- [Framework Directory Structure](#framework-directory-structure): How source code and data files are organized
- [Default Configuration File](#default-configuration-file): Key fields in `regression-conf.groovy`
- [Writing Test Cases](#writing-test-cases): Examples of sql / qt / test / explain / streamLoad and other Actions
- [Launch Script Usage](#launch-script-usage): Common commands for `run-regression-test.sh`
- [Auto-Generating `.out` Files](#auto-generating-out-files): Generate validation files with `-genOut` / `-forceGenOut`
- [Suite Plugin Mechanism](#suite-plugin-mechanism): Extend Suite with Groovy scripts
- [CI/CD Integration](#cicd-integration): TeamCity Service Message
- [External Data Source e2e Tests](#external-data-source-e2e-tests): MySQL / PostgreSQL / Hive / Iceberg / Hudi / Trino, and more

---

## Quick Start

<!-- Knowledge type: Procedure -->

1. Install a Doris cluster (FE + BE) in advance.
2. Edit `${DORIS_HOME}/regression-test/conf/regression-conf.groovy` and set connection information such as the JDBC URL and username.
3. Create a Groovy test case file under `regression-test/suites/<group>/`.
4. If the case contains a `qt` Action, create the corresponding `.out` TSV file under `regression-test/data/<group>/` for result validation.
5. Run the tests:

    ```bash
    # Run all cases
    ${DORIS_HOME}/run-regression-test.sh

    # Run a specific case
    ${DORIS_HOME}/run-regression-test.sh --run <suiteName>
    ```

See [Launch Script Usage](#launch-script-usage) for more startup options.

---

## Core Concepts

| Concept | Meaning |
|------|------|
| `Suite` | A test case. The file name is currently used as the suite name. |
| `Group` | A test set, corresponding to the directory the test case belongs to. |
| `Action` | A specific testing behavior provided by the framework, such as the `sql` Action that executes SQL, the `test` Action that validates results, and the `streamLoad` Action that imports data. |

---

## Framework Directory Structure

Important files and directories to be aware of during development:

| Path | Purpose |
|------|------|
| `run-regression-test.sh` | Regression test launch script |
| `regression-conf.groovy` | Default configuration file |
| `data/` | Input data and `.out` validation files |
| `suites/` | Test cases |

Full directory tree:

```text
./${DORIS_HOME}
    |-- run-regression-test.sh               Regression test launch script
    |-- regression-test
    |   |-- plugins                          Plugins directory
    |   |-- conf
    |   |   |-- logback.xml                  Logging configuration file
    |   |   |-- regression-conf.groovy       Default configuration file
    |   |
    |   |-- framework                        Regression test framework source code
    |   |-- data                             Input and output files for cases
    |   |   |-- demo                         Input and output files for demo cases
    |   |   |-- correctness                  Input and output for correctness tests
    |   |   |-- performance                  Input and output for performance tests
    |   |   |-- utils                        Input and output for other utilities
    |   |
    |   |-- suites                           Regression test cases
    |       |-- demo                         Demo cases
    |       |-- correctness                  Correctness test cases
    |       |-- performance                  Performance test cases
    |       |-- utils                        Other utility cases
    |
    |-- output
        |-- regression-test
            |-- log                          Regression test logs
```

---

## Default Configuration File

<!-- Knowledge type: Configuration parameters -->

Before running tests, update the JDBC and FE configuration to match the actual environment. The core fields of `regression-conf.groovy` are as follows:

```groovy
/* ============ Generally, only the section below needs attention ============ */
// Default DB. If it has not been created, the framework attempts to create it.
defaultDb = "regression_test"

// JDBC configuration
jdbcUrl = "jdbc:mysql://127.0.0.1:9030/?"
jdbcUser = "root"
jdbcPassword = ""

// FE address configuration, used for stream load
feHttpAddress = "127.0.0.1:8030"
feHttpUser = "root"
feHttpPassword = ""

/* ============ The section below generally does not need to be modified ============ */

// The DORIS_HOME variable is passed in by run-regression-test.sh,
// that is, java -DDORIS_HOME=./

// Set the directory of regression test cases
suitePath = "${DORIS_HOME}/regression-test/suites"
// Set the directory of input and output data
dataPath = "${DORIS_HOME}/regression-test/data"
// Set the plugins directory
pluginPath = "${DORIS_HOME}/regression-test/plugins"

// By default, all groups are loaded. Multiple groups can be separated by half-width commas, for example: "demo,performance"
// Usually you do not need to modify this in the config file; instead, override it dynamically through run-regression-test.sh --run -g
testGroups = ""
// By default, all cases are loaded. You can also override this through run-regression-test.sh --run -s
testSuites = ""
// The case directories loaded by default. Override through run-regression-test.sh --run -d
testDirectories = ""

// Exclude cases in these groups. Override through run-regression-test.sh --run -xg
excludeGroups = ""
// Exclude these suites. Override through run-regression-test.sh --run -xs
excludeSuites = ""
// Exclude these directories. Override through run-regression-test.sh --run -xd
excludeDirectories = ""

// Other custom configuration
customConf1 = "test_custom_conf_value"
```

---

## Writing Test Cases

<!-- Knowledge type: Procedure -->

1. Go to the `${DORIS_HOME}/regression-test` directory.
2. Choose a case directory based on the testing purpose: place correctness tests under `suites/correctness` and performance tests under `suites/performance`.
3. Create a new Groovy case file and combine several Actions to implement the test logic.

Actions are testing behaviors provided by the framework, defined through a DSL. The common Actions are introduced below.

### sql action

The `sql` Action submits SQL and retrieves the result. It throws an exception if the query fails.

Parameters:

| Parameter | Description |
|------|------|
| `String sql` | The input SQL string |
| Returns `List<List<Object>>` | The query result. For DDL/DML, it returns one row and one column, whose only value is updateRowCount. |

The sample code below is located at `${DORIS_HOME}/regression-test/suites/demo/sql_action.groovy`:

```groovy
suite("sql_action", "demo") {
    // execute sql and ignore result
    sql "show databases"

    // execute sql and get result, outer List denote rows, inner List denote columns in a single row
    List<List<Object>> tables = sql "show tables"

    // assertXxx() will invoke junit5's Assertions.assertXxx() dynamically
    assertTrue(tables.size() >= 0) // test rowCount >= 0

    // syntax error
    try {
        sql "a b c d e"
        throw new IllegalStateException("Should be syntax error")
    } catch (java.sql.SQLException t) {
        assertTrue(true)
    }

    def testTable = "test_sql_action1"

    try {
        sql "DROP TABLE IF EXISTS ${testTable}"

        // multi-line sql
        def result1 = sql """
                        CREATE TABLE IF NOT EXISTS ${testTable} (
                            id int
                        )
                        DISTRIBUTED BY HASH(id) BUCKETS 1
                        PROPERTIES (
                          "replication_num" = "1"
                        )
                        """

        // DDL/DML return 1 row and 1 column, the only value is update row count
        assertTrue(result1.size() == 1)
        assertTrue(result1[0].size() == 1)
        assertTrue(result1[0][0] == 0, "Create table should update 0 rows")

        def result2 = sql "INSERT INTO test_sql_action1 values(1), (2), (3)"
        assertTrue(result2.size() == 1)
        assertTrue(result2[0].size() == 1)
        assertTrue(result2[0][0] == 3, "Insert should update 3 rows")
    } finally {
        /**
         * try_xxx(args) means:
         *
         * try {
         *    return xxx(args)
         * } catch (Throwable t) {
         *     // do nothing
         *     return null
         * }
         */
        try_sql("DROP TABLE IF EXISTS ${testTable}")

        // you can see the error sql will not throw exception and return
        try {
            def errorSqlResult = try_sql("a b c d e f g")
            assertTrue(errorSqlResult == null)
        } catch (Throwable t) {
            assertTrue(false, "Never catch exception")
        }
    }

    // order_sql(sqlStr) equals to sql(sqlStr, isOrder=true)
    // sort result by string dict
    def list = order_sql """
                select 2
                union all
                select 1
                union all
                select null
                union all
                select 15
                union all
                select 3
                """

    assertEquals(null, list[0][0])
    assertEquals(1, list[1][0])
    assertEquals(15, list[2][0])
    assertEquals(2, list[3][0])
    assertEquals(3, list[4][0])
}
```

### qt action

The `qt` Action submits SQL and validates the result against the corresponding `.out` TSV file.

| Parameter | Description |
|------|------|
| `String sql` | The input SQL string |
| Returns | void |

The sample code below is located at `${DORIS_HOME}/regression-test/suites/demo/qt_action.groovy`:

```groovy
suite("qt_action", "demo") {
    /**
     * qt_xxx sql equals to quickTest(xxx, sql) witch xxx is tag.
     * the result will be compare to the relate file: ${DORIS_HOME}/regression_test/data/qt_action.out.
     *
     * if you want to generate .out tsv file for real execute result. you can run with -genOut or -forceGenOut option.
     * e.g
     *   ${DORIS_HOME}/run-regression-test.sh --run qt_action -genOut
     *   ${DORIS_HOME}/run-regression-test.sh --run qt_action -forceGenOut
     */
    qt_select "select 1, 'beijing' union all select 2, 'shanghai'"

    qt_select2 "select 2"

    // order result by string dict then compare to .out file.
    // order_qt_xxx sql equals to quickTest(xxx, sql, true).
    order_qt_union_all  """
                select 2
                union all
                select 1
                union all
                select null
                union all
                select 15
                union all
                select 3
                """
}
```

### test action

The `test` Action supports more complex validation rules, such as checking row counts, execution time, and whether an exception is thrown.

Available parameters:

| Parameter | Description |
|------|------|
| `String sql` | The input SQL string |
| `List<List<Object>> result` | Compares the actual query result with a List object for equality |
| `Iterator<Object> resultIterator` | Compares the actual query result with an Iterator for equality |
| `String resultFile` | A file URI (a local relative path or an http(s) path) used to compare the query result. The format is similar to `.out` but without block headers and comments. |
| `String exception` | Validates that the thrown exception contains specific strings |
| `long rowNum` | Validates the row count of the result |
| `long time` | Validates that the execution time is less than this value, in milliseconds |
| `Closure<List<List<Object>>, Throwable, Long, Long> check` | A custom validation callback that receives the result, exception, and time. When the callback is present, other validation methods are disabled. |

The sample code below is located at `${DORIS_HOME}/regression-test/suites/demo/test_action.groovy`:

```groovy
suite("test_action", "demo") {
    test {
        sql "abcdefg"
        // check exception message contains
        exception "errCode = 2, detailMessage = Syntax error"
    }

    test {
        sql """
            select *
            from (
                select 1 id
                union all
                select 2
            ) a
            order by id"""

        // multi check condition

        // check return 2 rows
        rowNum 2
        // execute time must <= 5000 millisecond
        time 5000
        // check result, must be 2 rows and 1 column, the first row is 1, second is 2
        result(
            [[1], [2]]
        )
    }

    test {
        sql "a b c d e f g"

        // other check will not work because already declared a check callback
        exception "aaaaaaaaa"

        // callback
        check { result, exception, startTime, endTime ->
            // assertXxx() will invoke junit5's Assertions.assertXxx() dynamically
            assertTrue(exception != null)
        }
    }

    test {
        sql  """
                select 2
                union all
                select 1
                union all
                select null
                union all
                select 15
                union all
                select 3
                """

        check { result, ex, startTime, endTime ->
            // same as order_sql(sqlStr)
            result = sortRows(result)

            assertEquals(null, result[0][0])
            assertEquals(1, result[1][0])
            assertEquals(15, result[2][0])
            assertEquals(2, result[3][0])
            assertEquals(3, result[4][0])
        }
    }

    // execute sql and order query result, then compare to iterator
    def selectValues = [1, 2, 3, 4]
    test {
        order true
        sql selectUnionAll(selectValues)
        resultIterator(selectValues.iterator())
    }

    // compare to data/demo/test_action.csv
    test {
        order true
        sql selectUnionAll(selectValues)

        // you can set to http://xxx or https://xxx
        // and compare to http response body
        resultFile "test_action.csv"
    }
}
```

### explain action

The `explain` Action validates whether the string returned by `EXPLAIN` contains specific strings.

Available parameters:

| Parameter | Description |
|------|------|
| `String sql` | The SQL to query. Remove `EXPLAIN` from the SQL. |
| `String contains` | Validates that the explain output contains specific strings. Call multiple times to validate multiple strings at once. |
| `String notContains` | Validates that the explain output does not contain specific strings. Can be called multiple times. |
| `Closure<String> check` | A custom validation callback that receives the returned string. When the validation function is present, other validation methods are disabled. |
| `Closure<String, Throwable, Long, Long> check` | A custom validation callback that additionally receives the exception and time. |

The sample code below is located at `${DORIS_HOME}/regression-test/suites/demo/explain_action.groovy`:

```groovy
suite("explain_action", "demo") {
    explain {
        sql("select 100")

        // contains("OUTPUT EXPRS:<slot 0> 100\n") && contains("PARTITION: UNPARTITIONED\n")
        contains "OUTPUT EXPRS:<slot 0> 100\n"
        contains "PARTITION: UNPARTITIONED\n"
    }

    explain {
        sql("select 100")

        // contains(" 100\n") && !contains("abcdefg") && !("1234567")
        contains " 100\n"
        notContains "abcdefg"
        notContains "1234567"
    }

    explain {
        sql("select 100")
        // simple callback
        check { explainStr -> explainStr.contains("abcdefg") || explainStr.contains(" 100\n") }
    }

    explain {
        sql("a b c d e")
        // callback with exception and time
        check { explainStr, exception, startTime, endTime ->
            // assertXxx() will invoke junit5's Assertions.assertXxx() dynamically
            assertTrue(exception != null)
        }
    }
}
```

### streamLoad action

The `streamLoad` Action imports data.

Available parameters:

| Parameter | Description |
|------|------|
| `String db` | DB name. Defaults to `defaultDb` from `regression-conf.groovy`. |
| `String table` | Table name |
| `String file` | The path of the file to import. Can be a relative path under the `data/` directory, or an http URL. |
| `Iterator<List<Object>> inputIterator` | The iterator to import |
| `String inputText` | The text to import. Rarely used. |
| `InputStream inputStream` | The byte stream to import. Rarely used. |
| `long time` | Validates that the execution time is less than this value, in milliseconds |
| `void set(String key, String value)` | Sets the stream load HTTP request header, such as `label` or `columnSeparator` |
| `Closure<String, Throwable, Long, Long> check` | A custom validation callback. When the callback is present, other validation items are disabled. |

The sample code below is located at `${DORIS_HOME}/regression-test/suites/demo/streamLoad_action.groovy`:

```groovy
suite("streamLoad_action", "demo") {

    def tableName = "test_streamload_action1"

    sql """
            CREATE TABLE IF NOT EXISTS ${tableName} (
                id int,
                name varchar(255)
            )
            DISTRIBUTED BY HASH(id) BUCKETS 1
            PROPERTIES (
              "replication_num" = "1"
            )
        """

    streamLoad {
        // you can skip declare db, because a default db already specify in ${DORIS_HOME}/conf/regression-conf.groovy
        // db 'regression_test'
        table tableName

        // default label is UUID:
        // set 'label' UUID.randomUUID().toString()

        // default column_separator is specify in doris fe config, usually is '\t'.
        // this line change to ','
        set 'column_separator', ','

        // relate to ${DORIS_HOME}/regression-test/data/demo/streamload_input.csv.
        // also, you can stream load a http stream, e.g. http://xxx/some.csv
        file 'streamload_input.csv'

        time 10000 // limit inflight 10s

        // stream load action will check result, include Success status, and NumberTotalRows == NumberLoadedRows
    }


    // stream load 100 rows
    def rowCount = 100
    // range: [0, rowCount)
    // or rangeClosed: [0, rowCount]
    def rowIt = range(0, rowCount)
            .mapToObj({i -> [i, "a_" + i]}) // change Long to List<Long, String>
            .iterator()

    streamLoad {
        table tableName
        // also, you can upload a memory iterator
        inputIterator rowIt

        // if declared a check callback, the default check condition will ignore.
        // So you must check all condition
        check { result, exception, startTime, endTime ->
            if (exception != null) {
                throw exception
            }
            log.info("Stream load result: ${result}".toString())
            def json = parseJson(result)
            assertEquals("success", json.Status.toLowerCase())
            assertEquals(json.NumberTotalRows, json.NumberLoadedRows)
            assertTrue(json.NumberLoadedRows > 0 && json.LoadBytes > 0)
        }
    }
}
```

### Other Actions

Examples of the `thread`, `lazyCheck`, `events`, `connect`, and `selectUnionAll` Actions can be found in the following directory:

```text
${DORIS_HOME}/regression-test/suites/demo
```

---

## Launch Script Usage

<!-- Knowledge type: Procedure -->

```bash
# View the script parameter description
./run-regression-test.sh h

# View the framework parameter description
./run-regression-test.sh --run -h

# Run all cases
./run-regression-test.sh

# Delete the framework compilation results and test logs
./run-regression-test.sh --clean

# Run the case whose suiteName is sql_action. Currently the suiteName equals the file name prefix; this example corresponds to the case file sql_action.groovy
./run-regression-test.sh --run sql_action

# Run cases whose suiteName contains 'sql'. **Note that single quotes are required.**
./run-regression-test.sh --run '*sql*'

# Run the demo and performance groups
./run-regression-test.sh --run -g 'demo,performance'

# Run sql_action under the demo group
./run-regression-test.sh --run -g demo -s sql_action

# Run sql_action under the demo directory
./run-regression-test.sh --run -d demo -s sql_action

# Run cases under the demo directory, excluding sql_action
./run-regression-test.sh --run -d demo -xs sql_action

# Exclude cases under the demo directory
./run-regression-test.sh --run -xd demo

# Exclude cases under the demo group
./run-regression-test.sh --run -xg demo

# Custom configuration
./run-regression-test.sh --run -conf a=b

# Concurrent execution
./run-regression-test.sh --run -parallel 5 -suiteParallel 10 -actionParallel 20
```

---

## Auto-Generating `.out` Files

```bash
# Automatically generate the .out file for the sql_action case from the query result. Skip if the .out file already exists.
./run-regression-test.sh --run sql_action -genOut

# Automatically generate the .out file for the sql_action case from the query result. Overwrite if the .out file already exists.
./run-regression-test.sh --run sql_action -forceGenOut
```

---

## Suite Plugin Mechanism

When you need to extend the Suite class without modifying the source code, you can do so through plugins. The default plugin directory is `${DORIS_HOME}/regression-test/plugins`, where you can define extension methods through Groovy scripts.

The following `plugin_example.groovy` adds a `testPlugin` function to the Suite class to print logs:

```groovy
import org.apache.doris.regression.suite.Suite

// register `testPlugin` function to Suite,
// and invoke in ${DORIS_HOME}/regression-test/suites/demo/test_plugin.groovy
Suite.metaClass.testPlugin = { String info /* param */ ->

    // which suite invoke current function?
    Suite suite = delegate as Suite

    // function body
    suite.getLogger().info("Test plugin: suiteName: ${suite.name}, info: ${info}".toString())

    // optional return value
    return "OK"
}

logger.info("Added 'testPlugin' function to Suite")
```

Once registered, regular cases can call this function. Take `${DORIS_HOME}/regression-test/suites/demo/test_plugin.groovy` as an example:

```groovy
suite("test_plugin", "demo") {
    // register testPlugin function in ${DORIS_HOME}/regression-test/plugins/plugin_example.groovy
    def result = testPlugin("message from suite")
    assertEquals("OK", result)
}
```

---

## CI/CD Integration

### TeamCity

TeamCity can recognize Service Messages through stdout. When the regression test framework is started with the `--teamcity` parameter, the framework prints TeamCity Service Messages to stdout. TeamCity automatically reads these event logs and displays `Tests` in the current pipeline, including test cases and their logs.

A sample launch command is shown below. The `-Dteamcity.enableStdErr=false` setting makes error logs also print to stdout, which makes it easier to analyze them in chronological order:

```bash
JAVA_OPTS="-Dteamcity.enableStdErr=${enableStdErr}" ./run-regression-test.sh --teamcity --run
```

---

## External Data Source e2e Tests

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: External data source development / Catalog debugging -->

Doris supports querying multiple external data sources. The regression framework provides the capability to set up external data sources through Docker Compose, used for e2e testing of Doris integrating with external data sources.

### 0. Preparation

Before starting Docker, edit the `CONTAINER_UID` variable in `docker/thirdparties/custom_settings.env`, for example set it to `doris-10002-18sda1-`. The subsequent launch scripts replace the names in docker compose with this prefix, ensuring that the names and networks of multiple container environments do not conflict.

Before starting the containers, check the network configuration of the server or cloud host and confirm that `/etc/hosts` contains the mapping between the host name (`hostname`) and the host IP (`hostname -i`), such as:

```text
10.0.0.46    iZj6cbwlx5pl6y0681t6scZ    iZj6cbwlx5pl6y0681t6scZ
```

These correspond to the IP address (output of `hostname -i`, usually the IP of eth0), the host name (output of `hostname`), and the alias (the same as the host name), respectively.

> **Note**: `run-thirdparties-docker.sh` detects the primary network interface by scanning for names matching `eth[0-9]`. Modern Linux distributions using systemd/udev assign predictable names such as `enp3s0`, `ens33`, or `eno1`, which the script does not recognize. If your host uses such a name, the script will fail to detect an interface — manually set the `eth_name` variable inside `run-thirdparties-docker.sh` to your actual interface name before running it.

### 1. Start the Container

Doris currently supports Docker compose for data sources including es, mysql, pg, hive, sqlserver, oracle, iceberg, hudi, and trino. The related files are stored in the `docker/thirdparties/docker-compose` directory.

By default, you can start the Docker containers of all external data sources directly with the following command (hive and hudi require downloading prebuilt data files; see the corresponding sections below):

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh
```

This command requires root or sudo privileges. A successful return indicates that all containers have started, and you can check them with `docker ps -a`. During container startup, you can view logs with `docker logs -f <container-name>`.

Stop all containers:

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh --stop
```

Start or stop specific components:

```bash
cd docker/thirdparties
# Start mysql
sh run-thirdparties-docker.sh -c mysql
# Start mysql, pg, iceberg
sh run-thirdparties-docker.sh -c mysql,pg,iceberg
# Stop mysql, pg, iceberg
sh run-thirdparties-docker.sh -c mysql,pg,iceberg --stop
```

#### 1.1 MySQL

The MySQL-related Docker compose files are stored under `docker/thirdparties/docker-compose/mysql`:

- `mysql-5.7.yaml.tpl`: Docker compose file template. No modifications required. The default username and password are `root` / `123456`.
- `mysql-5.7.env`: Configuration file. Configures the port exposed by the MySQL container, which defaults to 3316.
- `init/`: SQL files in this directory run automatically after the container is created. By default, they create databases and tables and insert a small amount of data.
- `data/`: The local data directory mounted after the container starts. `run-thirdparties-docker.sh` clears and recreates it on every launch.

#### 1.2 PostgreSQL

The PostgreSQL-related Docker compose files are stored under `docker/thirdparties/docker-compose/postgresql`:

- `postgresql-14.yaml.tpl`: Docker compose file template. No modifications required. The default username and password are `postgres` / `123456`.
- `postgresql-14.env`: Configuration file. Configures the port exposed by the PostgreSQL container, which defaults to 5442.
- `init/`: SQL files in this directory run automatically after the container is created. By default, they create databases and tables and insert a small amount of data.
- `data/`: The local data directory mounted after the container starts. `run-thirdparties-docker.sh` clears and recreates it on every launch.

#### 1.3 Hive

The Hive-related Docker compose files are stored under `docker/thirdparties/docker-compose/hive`, supporting both Hive2 and Hive3:

- `hive-2x.yaml.tpl`, `hive-3x.yaml.tpl`: Docker compose file templates. No modifications required.
- `hadoop-hive.env.tpl`, `hadoop-hive-2x.env.tpl`, `hadoop-hive-3x.env.tpl`: Configuration file templates. No modifications required.
- `hive-2x_settings.env`: Hive2 initialization configuration script. `run-thirdparties-docker.sh` calls it automatically on startup. You can modify the four exposed ports `FS_PORT`, `HMS_PORT`, `HS_PORT`, and `PG_PORT`, which correspond to `hive2HdfsPort`, `hive2HmsPort`, `hive2ServerPort`, and `hive2PgPort` in `regression-conf.groovy`. The first two are the hadoop defaultFs and Hive metastore ports, defaulting to 8020 and 9083.
- `hive-3x_settings.env`: Hive3 initialization configuration script. You can modify `FS_PORT`, `HMS_PORT`, `HS_PORT`, and `PG_PORT`, which correspond to `hive3HdfsPort`, `hive3HmsPort`, `hive3ServerPort`, and `hive3PgPort`. The first two default to 8320 and 9383.
- The `scripts/` directory is mounted into the container after the container starts. The file contents do not need to be modified. Before starting the container, however, you must first download the prebuilt files:

    Download `https://doris-regression-hk.oss-cn-hongkong.aliyuncs.com/regression/datalake/pipeline_data/tpch1.db.tar.gz` into the `scripts/` directory and extract it.

#### 1.4 Elasticsearch

Includes Docker images for ES6, ES7, and ES8, stored under `docker/thirdparties/docker-compose/elasticsearch/`:

- `es.yaml.tpl`: Docker compose file template. Includes the ES6, ES7, and ES8 versions. No modifications required.
- `es.env`: Configuration file. You need to configure the ES port numbers.
- `scripts/`: Stores initialization scripts that run after the image starts.

#### 1.5 Oracle

Provides an Oracle 11 image, stored under `docker/thirdparties/docker-compose/oracle/`:

- `oracle-11.yaml.tpl`: Docker compose file template. No modifications required.
- `oracle-11.env`: Configures the Oracle exposed port, which defaults to 1521.

#### 1.6 SQLServer

Provides a SQLServer 2022 image, stored under `docker/thirdparties/docker-compose/sqlserver/`:

- `sqlserver.yaml.tpl`: Docker compose file template. No modifications required.
- `sqlserver.env`: Configures the SQLServer exposed port, which defaults to 1433.

#### 1.7 ClickHouse

Provides a ClickHouse 22 image, stored under `docker/thirdparties/docker-compose/clickhouse/`:

- `clickhouse.yaml.tpl`: Docker compose file template. No modifications required.
- `clickhouse.env`: Configures the ClickHouse exposed port, which defaults to 8123.

#### 1.8 Iceberg

Provides an Iceberg + Spark + Minio image combination, stored under `docker/thirdparties/docker-compose/iceberg/`:

- `iceberg.yaml.tpl`: Docker compose file template. No modifications required.
- `entrypoint.sh.tpl`: Initialization script template that runs after the image starts. No modifications required.
- `spark-defaults.conf.tpl`: Spark configuration file template. No modifications required.
- `iceberg.env`: Exposed port configuration file. Modify the ports as needed to avoid conflicts.

After startup, you can start spark-sql with the following command:

```bash
docker exec -it doris-xx-spark-iceberg spark-sql
```

Here, `doris-xx-spark-iceberg` is the container name.

Example spark-sql Iceberg operations:

```sql
create database db1;
show databases;
create table db1.test1(k1 bigint, k2 bigint, k3 string) partitioned by (k1);
insert into db1.test1 values(1,2,'abc');
select * from db1.test1;
quit;
```

You can also access it through spark-shell:

```scala
docker exec -it doris-xx-spark-iceberg spark-shell

spark.sql(s"create database db1")
spark.sql(s"show databases").show()
spark.sql(s"create table db1.test1(k1 bigint, k2 bigint, k3 string) partitioned by (k1)").show()
spark.sql(s"show tables from db1").show()
spark.sql(s"insert into db1.test1 values(1,2,'abc')").show()
spark.sql(s"select * from db1.test1").show()
:q
```

For more usage details, see the [Tabular official documentation](https://tabular.io/blog/docker-spark-and-iceberg/).

#### 1.9 Hudi

The Hudi-related Docker compose files are stored under `docker/thirdparties/docker-compose/hudi`:

- `hudi.yaml.tpl`: Docker compose file template. No modifications required.
- `hadoop.env`: Configuration file template. No modifications required.
- The `scripts/` directory is mounted into the container after the container starts. The file contents do not need to be modified. Before starting the container, however, you must first download the prebuilt files:

    Download `https://doris-build-hk-1308700295.cos.ap-hongkong.myqcloud.com/regression/load/hudi/hudi_docker_compose_attached_file.zip` into the `scripts/` directory and extract it.

Before starting, you can add the following configuration to `/etc/hosts` to avoid `UnknownHostException` errors:

```text
127.0.0.1 adhoc-1
127.0.0.1 adhoc-2
127.0.0.1 namenode
127.0.0.1 datanode1
127.0.0.1 hiveserver
127.0.0.1 hivemetastore
127.0.0.1 sparkmaster
```

After startup, you can start a hive query with the following command:

```bash
docker exec -it adhoc-2 /bin/bash

beeline -u jdbc:hive2://hiveserver:10000 \
--hiveconf hive.input.format=org.apache.hadoop.hive.ql.io.HiveInputFormat \
--hiveconf hive.stats.autogather=false

show tables;
show partitions stock_ticks_mor_rt;
select symbol, max(ts) from stock_ticks_cow group by symbol HAVING symbol = 'GOOG';
select symbol, max(ts) from stock_ticks_mor_ro group by symbol HAVING symbol = 'GOOG';
exit;
```

You can also access it through spark-shell:

```bash
docker exec -it adhoc-1 /bin/bash

$SPARK_INSTALL/bin/spark-shell \
  --jars /var/scripts/hudi_docker_compose_attached_file/jar/hoodie-hive-sync-bundle.jar \
  --master local[2] \
  --driver-class-path $HADOOP_CONF_DIR \
  --conf spark.sql.hive.convertMetastoreParquet=false \
  --deploy-mode client \
  --driver-memory 1G \
  --executor-memory 3G \
  --num-executors 1

spark.sql("show tables").show(100, false)
spark.sql("select symbol, max(ts) from stock_ticks_cow group by symbol HAVING symbol = 'GOOG'").show(100, false)
spark.sql("select `_hoodie_commit_time`, symbol, ts, volume, open, close  from stock_ticks_cow where  symbol = 'GOOG'").show(100, false)
spark.sql("select symbol, max(ts) from stock_ticks_mor_ro group by symbol HAVING symbol = 'GOOG'").show(100, false)
spark.sql("select symbol, max(ts) from stock_ticks_mor_rt group by symbol HAVING symbol = 'GOOG'").show(100, false)
spark.sql("select `_hoodie_commit_time`, symbol, ts, volume, open, close  from stock_ticks_mor_ro where  symbol = 'GOOG'").show(100, false)
:q
```

For more usage details, see the [Hudi official documentation](https://hudi.apache.org/docs/docker_demo).

#### 1.10 Trino

The Trino-related Docker compose files are stored under `docker/thirdparties/docker-compose/trino`. Template files:

- `gen_env.sh.tpl`: Generates HDFS-related port numbers. No modifications required. If port conflicts occur, the port numbers can be modified.
- `hive.properties.tpl`: Configures trino catalog information. No modifications required.
- `trino_hive.env.tpl`: Environment configuration for Hive. No modifications required.
- `trino_hive.yaml.tpl`: Docker compose file. No modifications required.

After starting the Trino docker, a Trino + hive catalog environment is configured. At this point Trino has two catalogs:

1. `hive`
2. `tpch` (bundled with the trino docker)

For more usage details, see the [Trino official documentation](https://trino.io/docs/current/installation/containers.html).

### 2. Run Regression Tests

External-table-related regression tests are disabled by default. You can enable them by editing the configuration in `regression-test/conf/regression-conf.groovy`. Example configuration items:

| Configuration item | Description |
|--------|------|
| `enableJdbcTest` | Enables the JDBC external table test. Requires starting the MySQL and PostgreSQL containers. |
| `mysql_57_port` | The MySQL exposed port, which defaults to 3316. |
| `pg_14_port` | The PostgreSQL exposed port, which defaults to 5442. |
| `enableHiveTest` | Enables the Hive external table test. Requires starting the Hive container. |
| `hive2HmsPort` | The Hive2 metastore exposed port, which defaults to 9083. |
| `hive2HdfsPort` | The Hive2 HDFS namenode exposed port, which defaults to 8020. |
| `enableEsTest` | Enables the ES external table test. Requires starting the ES container. |
| `es_6_port` | The ES6 port |
| `es_7_port` | The ES7 port |
| `es_8_port` | The ES8 port |

---

## FAQ

<!-- Knowledge type: Troubleshooting -->

**Q: `UnknownHostException` is reported when starting the hudi container.**

A: Before startup, the mappings `adhoc-1` / `adhoc-2` / `namenode` / `datanode1` / `hiveserver` / `hivemetastore` / `sparkmaster` to `127.0.0.1` were not configured in `/etc/hosts`. Refer to [1.9 Hudi](#19-hudi) to add them.

**Q: Network or container name conflicts between multiple container environments.**

A: Edit `CONTAINER_UID` in `docker/thirdparties/custom_settings.env` to a unique prefix (such as `doris-10002-18sda1-`). All container names and networks are regenerated based on this prefix.

**Q: Connection failure errors are reported when running external table tests.**

A: Confirm that the corresponding `enableXxxTest` in `regression-conf.groovy` is `true`, that the configured ports match the actual ports exposed by docker compose after startup, and that the container status is normal (`docker ps -a`).

**Q: How do I see the actual query result of a `qt` Action when the `.out` file does not yet exist?**

A: Run with the `-genOut` (does not overwrite existing files) or `-forceGenOut` (force overwrite) parameter, for example `./run-regression-test.sh --run qt_action -genOut`.

**Q: How do I prevent a SQL failure in a case from aborting the entire test suite?**

A: Use `try_sql(...)` instead of `sql(...)`. It returns `null` on failure instead of throwing an exception.
