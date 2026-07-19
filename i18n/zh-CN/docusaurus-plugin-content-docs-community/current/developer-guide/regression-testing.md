---
title: 回归测试框架
language: zh-CN
description: Apache Doris 回归测试框架介绍与测试用例编写指南，包含 Suite、Action、外部数据源 e2e 测试与 CI 集成。
keywords:
    - Apache Doris 回归测试
    - regression test
    - Suite Action
    - Groovy 测试用例
    - Doris 测试框架
    - run-regression-test.sh
    - Docker Compose 外部数据源
    - TeamCity 集成
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

<!-- 知识类型: 开发指南 / 测试框架 -->
<!-- 适用场景: 内核开发 / 提交 PR / 编写回归用例 -->

# 回归测试框架

本文面向需要为 Apache Doris 编写或运行回归测试的开发者，介绍测试框架的核心概念、目录结构、配置方式，以及内置 Action 与外部数据源 e2e 测试的使用方法。

## 内容导览

- [快速开始](#快速开始)：5 步跑通第一个用例
- [核心概念](#核心概念)：Suite / Group / Action 三个抽象
- [框架目录结构](#框架目录结构)：源码与数据文件的组织方式
- [默认配置文件](#默认配置文件)：`regression-conf.groovy` 关键项
- [编写测试用例](#编写测试用例)：sql / qt / test / explain / streamLoad 等 Action 示例
- [启动脚本用法](#启动脚本用法)：`run-regression-test.sh` 常用命令
- [`.out` 文件自动生成](#out-文件自动生成)：通过 `-genOut` / `-forceGenOut` 生成校验文件
- [Suite 插件机制](#suite-插件机制)：通过 Groovy 脚本扩展 Suite
- [CI/CD 集成](#cicd-集成)：TeamCity Service Message
- [外部数据源 e2e 测试](#外部数据源-e2e-测试)：MySQL / PostgreSQL / Hive / Iceberg / Hudi / Trino 等

---

## 快速开始

<!-- 知识类型: 操作步骤 -->

1. 预先安装好 Doris 集群（FE + BE）。
2. 修改 `${DORIS_HOME}/regression-test/conf/regression-conf.groovy`，设置 JDBC URL、用户名等连接信息。
3. 在 `regression-test/suites/<group>/` 下创建 Groovy 用例文件。
4. 如果用例包含 `qt` Action，需要在 `regression-test/data/<group>/` 下创建关联的 `.out` TSV 文件用于结果校验。
5. 运行测试：

    ```bash
    # 跑全部用例
    ${DORIS_HOME}/run-regression-test.sh

    # 跑指定用例
    ${DORIS_HOME}/run-regression-test.sh --run <suiteName>
    ```

更多启动方式见 [启动脚本用法](#启动脚本用法)。

---

## 核心概念

| 概念 | 含义 |
|------|------|
| `Suite` | 一个测试用例，目前用文件名作为 suite 名 |
| `Group` | 一个测试集，对应测试用例所属的目录 |
| `Action` | 框架封装好的具体测试行为，例如执行 SQL 的 `sql` Action、结果校验的 `test` Action、数据导入的 `streamLoad` Action 等 |

---

## 框架目录结构

开发时需要关注的重要文件 / 目录：

| 路径 | 用途 |
|------|------|
| `run-regression-test.sh` | 回归测试启动脚本 |
| `regression-conf.groovy` | 默认配置文件 |
| `data/` | 输入数据与 `.out` 校验文件 |
| `suites/` | 测试用例 |

完整目录树：

```text
./${DORIS_HOME}
    |-- run-regression-test.sh               回归测试启动脚本
    |-- regression-test
    |   |-- plugins                          插件目录
    |   |-- conf
    |   |   |-- logback.xml                  日志配置文件
    |   |   |-- regression-conf.groovy       默认配置文件
    |   |
    |   |-- framework                        回归测试框架源码
    |   |-- data                             用例的输入输出文件
    |   |   |-- demo                         demo 用例的输入输出文件
    |   |   |-- correctness                  正确性测试输入输出
    |   |   |-- performance                  性能测试输入输出
    |   |   |-- utils                        其他工具的输入输出
    |   |
    |   |-- suites                           回归测试用例
    |       |-- demo                         demo 用例
    |       |-- correctness                  正确性测试用例
    |       |-- performance                  性能测试用例
    |       |-- utils                        其他工具用例
    |
    |-- output
        |-- regression-test
            |-- log                          回归测试日志
```

---

## 默认配置文件

<!-- 知识类型: 配置参数 -->

测试前需要根据实际环境修改 JDBC 与 FE 配置。`regression-conf.groovy` 的核心字段如下：

```groovy
/* ============ 一般只需要关注下面这部分 ============ */
// 默认 DB，如果未创建，则会尝试创建这个 DB
defaultDb = "regression_test"

// JDBC 配置
jdbcUrl = "jdbc:mysql://127.0.0.1:9030/?"
jdbcUser = "root"
jdbcPassword = ""

// FE 地址配置，用于 stream load
feHttpAddress = "127.0.0.1:8030"
feHttpUser = "root"
feHttpPassword = ""

/* ============ 一般不需要修改下面的部分 ============ */

// DORIS_HOME 变量是通过 run-regression-test.sh 传入的
// 即 java -DDORIS_HOME=./

// 设置回归测试用例的目录
suitePath = "${DORIS_HOME}/regression-test/suites"
// 设置输入输出数据的目录
dataPath = "${DORIS_HOME}/regression-test/data"
// 设置插件的目录
pluginPath = "${DORIS_HOME}/regression-test/plugins"

// 默认会读所有的组，读多个组可以用半角逗号隔开，如："demo,performance"
// 一般不需要在配置文件中修改，而是通过 run-regression-test.sh --run -g 来动态指定和覆盖
testGroups = ""
// 默认会读所有的用例，同样可以使用 run-regression-test.sh --run -s 来动态指定和覆盖
testSuites = ""
// 默认会加载的用例目录，可以通过 run-regression-test.sh --run -d 来动态指定和覆盖
testDirectories = ""

// 排除这些组的用例，可通过 run-regression-test.sh --run -xg 来动态指定和覆盖
excludeGroups = ""
// 排除这些 suite，可通过 run-regression-test.sh --run -xs 来动态指定和覆盖
excludeSuites = ""
// 排除这些目录，可通过 run-regression-test.sh --run -xd 来动态指定和覆盖
excludeDirectories = ""

// 其他自定义配置
customConf1 = "test_custom_conf_value"
```

---

## 编写测试用例

<!-- 知识类型: 操作步骤 -->

1. 进入 `${DORIS_HOME}/regression-test` 目录。
2. 根据测试目的选择用例目录：正确性测试放在 `suites/correctness`，性能测试放在 `suites/performance`。
3. 新建一个 Groovy 用例文件，组合若干 Action 完成测试逻辑。

Action 是框架默认提供的测试行为，使用 DSL 定义。下面分别介绍常用 Action。

### sql action

`sql` Action 用于提交 SQL 并获取结果，如果查询失败会抛出异常。

参数：

| 参数 | 说明 |
|------|------|
| `String sql` | 输入的 SQL 字符串 |
| 返回 `List<List<Object>>` | 查询结果。如果是 DDL/DML，则返回一行一列，唯一的值是 updateRowCount |

下面的样例代码存放于 `${DORIS_HOME}/regression-test/suites/demo/sql_action.groovy`：

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

`qt` Action 用于提交 SQL，并使用对应的 `.out` TSV 文件来校验结果。

| 参数 | 说明 |
|------|------|
| `String sql` | 输入 SQL 字符串 |
| 返回 | void |

下面的样例代码存放于 `${DORIS_HOME}/regression-test/suites/demo/qt_action.groovy`：

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

`test` Action 可以使用更复杂的校验规则，比如验证行数、执行时间、是否抛出异常。

可用参数：

| 参数 | 说明 |
|------|------|
| `String sql` | 输入的 SQL 字符串 |
| `List<List<Object>> result` | 比较真实查询结果与 List 对象是否相等 |
| `Iterator<Object> resultIterator` | 比较真实查询结果与 Iterator 是否相等 |
| `String resultFile` | 文件 URI（本地相对路径或 http(s) 路径），用于比较查询结果。格式与 `.out` 类似，但没有块头和注释 |
| `String exception` | 校验抛出的异常是否包含某些字符串 |
| `long rowNum` | 验证结果行数 |
| `long time` | 验证执行时间小于该值，单位毫秒 |
| `Closure<List<List<Object>>, Throwable, Long, Long> check` | 自定义回调校验，可获取结果、异常、时间。存在回调时其他校验方式失效 |

下面的样例代码存放于 `${DORIS_HOME}/regression-test/suites/demo/test_action.groovy`：

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

`explain` Action 用来校验 `EXPLAIN` 返回的字符串是否包含某些字符串。

可用参数：

| 参数 | 说明 |
|------|------|
| `String sql` | 查询的 SQL，需要去掉 SQL 中的 `EXPLAIN` |
| `String contains` | 校验 explain 是否包含某些字符串，可多次调用同时校验多个 |
| `String notContains` | 校验 explain 是否不含某些字符串，可多次调用 |
| `Closure<String> check` | 自定义校验回调，可获取返回的字符串。存在校验函数时其他校验方式失效 |
| `Closure<String, Throwable, Long, Long> check` | 自定义校验回调，可额外获取异常和时间 |

下面的样例代码存放于 `${DORIS_HOME}/regression-test/suites/demo/explain_action.groovy`：

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

`streamLoad` Action 用于导入数据。

可用参数：

| 参数 | 说明 |
|------|------|
| `String db` | DB 名，默认值来自 `regression-conf.groovy` 的 `defaultDb` |
| `String table` | 表名 |
| `String file` | 要导入的文件路径，可以是 `data/` 目录下的相对路径，或 http URL |
| `Iterator<List<Object>> inputIterator` | 要导入的迭代器 |
| `String inputText` | 要导入的文本，较为少用 |
| `InputStream inputStream` | 要导入的字节流，较为少用 |
| `long time` | 验证执行时间小于该值，单位毫秒 |
| `void set(String key, String value)` | 设置 stream load HTTP 请求的 header，如 `label`、`columnSeparator` |
| `Closure<String, Throwable, Long, Long> check` | 自定义校验回调。存在回调时其他校验项会失效 |

下面的样例代码存放于 `${DORIS_HOME}/regression-test/suites/demo/streamLoad_action.groovy`：

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

### 其他 Action

`thread`、`lazyCheck`、`events`、`connect`、`selectUnionAll` 等 Action 的具体用法可在以下目录找到示例：

```text
${DORIS_HOME}/regression-test/suites/demo
```

---

## 启动脚本用法

<!-- 知识类型: 操作步骤 -->

```bash
# 查看脚本参数说明
./run-regression-test.sh h

# 查看框架参数说明
./run-regression-test.sh --run -h

# 测试所有用例
./run-regression-test.sh

# 删除测试框架编译结果和测试日志
./run-regression-test.sh --clean

# 测试 suiteName 为 sql_action 的用例，目前 suiteName 等于文件名前缀，例子对应的用例文件是 sql_action.groovy
./run-regression-test.sh --run sql_action

# 测试 suiteName 包含 'sql' 的用例，**注意需要用单引号括起来**
./run-regression-test.sh --run '*sql*'

# 测试 demo 和 performance group
./run-regression-test.sh --run -g 'demo,performance'

# 测试 demo group 下的 sql_action
./run-regression-test.sh --run -g demo -s sql_action

# 测试 demo 目录下的 sql_action
./run-regression-test.sh --run -d demo -s sql_action

# 测试 demo 目录下用例，排除 sql_action 用例
./run-regression-test.sh --run -d demo -xs sql_action

# 排除 demo 目录的用例
./run-regression-test.sh --run -xd demo

# 排除 demo group 的用例
./run-regression-test.sh --run -xg demo

# 自定义配置
./run-regression-test.sh --run -conf a=b

# 并发执行
./run-regression-test.sh --run -parallel 5 -suiteParallel 10 -actionParallel 20
```

---

## `.out` 文件自动生成

```bash
# 使用查询结果自动生成 sql_action 用例的 .out 文件，如果 .out 文件存在则忽略
./run-regression-test.sh --run sql_action -genOut

# 使用查询结果自动生成 sql_action 用例的 .out 文件，如果 .out 文件存在则覆盖
./run-regression-test.sh --run sql_action -forceGenOut
```

---

## Suite 插件机制

当需要扩展 Suite 类但又不便修改源码时，可以通过插件实现。默认插件目录为 `${DORIS_HOME}/regression-test/plugins`，可在其中通过 Groovy 脚本定义扩展方法。

以下 `plugin_example.groovy` 为 Suite 类增加了 `testPlugin` 函数用于打印日志：

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

注册后，普通用例即可调用该函数。以 `${DORIS_HOME}/regression-test/suites/demo/test_plugin.groovy` 为例：

```groovy
suite("test_plugin", "demo") {
    // register testPlugin function in ${DORIS_HOME}/regression-test/plugins/plugin_example.groovy
    def result = testPlugin("message from suite")
    assertEquals("OK", result)
}
```

---

## CI/CD 集成

### TeamCity

TeamCity 可以通过 stdout 识别 Service Message。使用 `--teamcity` 参数启动回归测试框架时，框架会在 stdout 打印 TeamCity Service Message，TeamCity 会自动读取这些事件日志，并在当前流水线中展示 `Tests`，包含测试用例及其日志。

启动命令示例如下，其中 `-Dteamcity.enableStdErr=false` 可以让错误日志也打印到 stdout，方便按时间顺序分析：

```bash
JAVA_OPTS="-Dteamcity.enableStdErr=${enableStdErr}" ./run-regression-test.sh --teamcity --run
```

---

## 外部数据源 e2e 测试

<!-- 知识类型: 操作步骤 -->
<!-- 适用场景: 外部数据源开发 / Catalog 调试 -->

Doris 支持对接多种外部数据源的查询。回归框架提供了通过 Docker Compose 搭建外部数据源的能力，用于 Doris 对接外部数据源的 e2e 测试。

### 0. 准备工作

启动 Docker 前，请先修改 `docker/thirdparties/custom_settings.env` 文件中的 `CONTAINER_UID` 变量，例如设置为 `doris-10002-18sda1-`。后续启动脚本会按这个前缀替换 docker compose 中的名称，保证多套容器环境的名称与网络不会冲突。

启动容器前，需要检查服务器或云主机的网络配置，确认 `/etc/hosts` 中是否配置了主机名（`hostname`）与主机 IP（`hostname -i`）的映射，形如：

```text
10.0.0.46    iZj6cbwlx5pl6y0681t6scZ    iZj6cbwlx5pl6y0681t6scZ
```

分别对应 IP 地址（`hostname -i` 输出，一般是 eth0 的 IP）、主机名（`hostname` 输出）、别名（同主机名）。

> **注意**：`run-thirdparties-docker.sh` 通过匹配 `eth[0-9]` 模式来探测主网卡。现代 Linux 发行版（systemd/udev）通常使用 `enp3s0`、`ens33`、`eno1` 等可预测命名，脚本无法识别。如果你的主机网卡名不符合 `eth[0-9]` 模式，启动前请手动在 `run-thirdparties-docker.sh` 中将 `eth_name` 变量设为实际的网卡名。

### 1. 启动 Container

Doris 目前支持 es、mysql、pg、hive、sqlserver、oracle、iceberg、hudi、trino 等数据源的 Docker compose。相关文件存放在 `docker/thirdparties/docker-compose` 目录下。

默认情况下，可以直接通过以下命令启动所有外部数据源的 Docker container（hive 和 hudi 需要下载预制数据文件，请参阅下面对应小节）：

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh
```

该命令需要 root 或 sudo 权限。命令返回成功代表所有 container 启动完成，可以通过 `docker ps -a` 查看。container 启动过程中，可以通过 `docker logs -f <container-name>` 查看日志。

停止所有 container：

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh --stop
```

启动或停止指定组件：

```bash
cd docker/thirdparties
# 启动 mysql
sh run-thirdparties-docker.sh -c mysql
# 启动 mysql,pg,iceberg
sh run-thirdparties-docker.sh -c mysql,pg,iceberg
# 停止 mysql,pg,iceberg
sh run-thirdparties-docker.sh -c mysql,pg,iceberg --stop
```

#### 1.1 MySQL

MySQL 相关的 Docker compose 文件存放在 `docker/thirdparties/docker-compose/mysql` 下：

- `mysql-5.7.yaml.tpl`：Docker compose 文件模板，无需修改。默认用户名密码为 `root` / `123456`。
- `mysql-5.7.env`：配置文件，可配置 MySQL container 对外暴露的端口，默认为 3316。
- `init/`：该目录下的 SQL 文件会在 container 创建后自动执行，默认会创建库、表并插入少量数据。
- `data/`：container 启动后挂载的本地数据目录，`run-thirdparties-docker.sh` 每次启动时会自动清空并重建。

#### 1.2 PostgreSQL

PostgreSQL 相关的 Docker compose 文件存放在 `docker/thirdparties/docker-compose/postgresql` 下：

- `postgresql-14.yaml.tpl`：Docker compose 文件模板，无需修改。默认用户名密码为 `postgres` / `123456`。
- `postgresql-14.env`：配置文件，可配置 PostgreSQL container 对外暴露的端口，默认为 5442。
- `init/`：该目录下的 SQL 文件会在 container 创建后自动执行，默认会创建库、表并插入少量数据。
- `data/`：container 启动后挂载的本地数据目录，`run-thirdparties-docker.sh` 每次启动时会自动清空并重建。

#### 1.3 Hive

Hive 相关的 Docker compose 文件存放在 `docker/thirdparties/docker-compose/hive` 下，支持 Hive2 和 Hive3：

- `hive-2x.yaml.tpl`、`hive-3x.yaml.tpl`：Docker compose 文件模板，无需修改。
- `hadoop-hive.env.tpl`、`hadoop-hive-2x.env.tpl`、`hadoop-hive-3x.env.tpl`：配置文件模板，无需修改。
- `hive-2x_settings.env`：Hive2 初始化配置脚本，`run-thirdparties-docker.sh` 启动时会自动调用。可修改 `FS_PORT`、`HMS_PORT`、`HS_PORT`、`PG_PORT` 四个对外端口，分别对应 `regression-conf.groovy` 中的 `hive2HdfsPort`、`hive2HmsPort`、`hive2ServerPort`、`hive2PgPort`。前两个为 hadoop 的 defaultFs 和 Hive metastore 端口，默认 8020、9083。
- `hive-3x_settings.env`：Hive3 初始化配置脚本，可修改 `FS_PORT`、`HMS_PORT`、`HS_PORT`、`PG_PORT`，分别对应 `hive3HdfsPort`、`hive3HmsPort`、`hive3ServerPort`、`hive3PgPort`。前两个默认 8320、9383。
- `scripts/` 目录会在 container 启动后挂载到 container 中，文件内容无需修改。但启动 container 之前，需要先下载预制文件：

    将 `https://doris-regression-hk.oss-cn-hongkong.aliyuncs.com/regression/datalake/pipeline_data/tpch1.db.tar.gz` 下载到 `scripts/` 目录并解压即可。

#### 1.4 Elasticsearch

包含 ES6、ES7、ES8 三个版本的 docker 镜像，存放在 `docker/thirdparties/docker-compose/elasticsearch/` 下：

- `es.yaml.tpl`：Docker compose 文件模板。包含 ES6、ES7、ES8 三个版本，无需修改。
- `es.env`：配置文件，需配置 ES 的端口号。
- `scripts/`：存放镜像启动后的初始化脚本。

#### 1.5 Oracle

提供 Oracle 11 镜像，存放在 `docker/thirdparties/docker-compose/oracle/` 下：

- `oracle-11.yaml.tpl`：Docker compose 文件模板，无需修改。
- `oracle-11.env`：配置 Oracle 对外端口，默认为 1521。

#### 1.6 SQLServer

提供 SQLServer 2022 镜像，存放在 `docker/thirdparties/docker-compose/sqlserver/` 下：

- `sqlserver.yaml.tpl`：Docker compose 文件模板，无需修改。
- `sqlserver.env`：配置 SQLServer 对外端口，默认为 1433。

#### 1.7 ClickHouse

提供 ClickHouse 22 镜像，存放在 `docker/thirdparties/docker-compose/clickhouse/` 下：

- `clickhouse.yaml.tpl`：Docker compose 文件模板，无需修改。
- `clickhouse.env`：配置 ClickHouse 对外端口，默认为 8123。

#### 1.8 Iceberg

提供 Iceberg + Spark + Minio 镜像组合，存放在 `docker/thirdparties/docker-compose/iceberg/` 下：

- `iceberg.yaml.tpl`：Docker compose 文件模板，无需修改。
- `entrypoint.sh.tpl`：镜像启动后的初始化脚本模板，无需修改。
- `spark-defaults.conf.tpl`：Spark 配置文件模板，无需修改。
- `iceberg.env`：对外端口配置文件，需根据实际情况修改各个端口避免冲突。

启动后，可以通过如下命令启动 spark-sql：

```bash
docker exec -it doris-xx-spark-iceberg spark-sql
```

其中 `doris-xx-spark-iceberg` 为 container 名称。

spark-sql Iceberg 操作示例：

```sql
create database db1;
show databases;
create table db1.test1(k1 bigint, k2 bigint, k3 string) partitioned by (k1);
insert into db1.test1 values(1,2,'abc');
select * from db1.test1;
quit;
```

也可以通过 spark-shell 访问：

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

更多使用方式可参阅 [Tabular 官方文档](https://tabular.io/blog/docker-spark-and-iceberg/)。

#### 1.9 Hudi

Hudi 相关的 Docker compose 文件存放在 `docker/thirdparties/docker-compose/hudi` 下：

- `hudi.yaml.tpl`：Docker compose 文件模板，无需修改。
- `hadoop.env`：配置文件模板，无需修改。
- `scripts/` 目录会在 container 启动后挂载到 container 中，文件内容无需修改。但启动 container 之前，需要先下载预制文件：

    将 `https://doris-build-hk-1308700295.cos.ap-hongkong.myqcloud.com/regression/load/hudi/hudi_docker_compose_attached_file.zip` 下载到 `scripts/` 目录并解压即可。

启动前，可以将以下配置添加到 `/etc/hosts`，以避免出现 `UnknownHostException` 错误：

```text
127.0.0.1 adhoc-1
127.0.0.1 adhoc-2
127.0.0.1 namenode
127.0.0.1 datanode1
127.0.0.1 hiveserver
127.0.0.1 hivemetastore
127.0.0.1 sparkmaster
```

启动后，可以通过如下命令启动 hive query：

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

也可以通过 spark-shell 访问：

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

更多使用方式可参阅 [Hudi 官方文档](https://hudi.apache.org/docs/docker_demo)。

#### 1.10 Trino

Trino 相关的 Docker compose 文件存放在 `docker/thirdparties/docker-compose/trino` 下。模板文件：

- `gen_env.sh.tpl`：用于生成 HDFS 相关端口号，无需修改。若出现端口冲突，可以修改端口号。
- `hive.properties.tpl`：用于配置 trino catalog 信息，无需修改。
- `trino_hive.env.tpl`：Hive 的环境配置信息，无需修改。
- `trino_hive.yaml.tpl`：Docker compose 文件，无需修改。

启动 Trino docker 后，会配置一套 Trino + hive catalog 环境，此时 Trino 拥有两个 catalog：

1. `hive`
2. `tpch`（trino docker 自带）

更多使用方式可参阅 [Trino 官方文档](https://trino.io/docs/current/installation/containers.html)。

### 2. 运行回归测试

外表相关的回归测试默认关闭，可以修改 `regression-test/conf/regression-conf.groovy` 中的配置开启，相关配置项举例如下：

| 配置项 | 说明 |
|--------|------|
| `enableJdbcTest` | 开启 JDBC 外表测试，需要启动 MySQL 和 PostgreSQL 的 container |
| `mysql_57_port` | MySQL 的对外端口，默认为 3316 |
| `pg_14_port` | PostgreSQL 的对外端口，默认为 5442 |
| `enableHiveTest` | 开启 Hive 外表测试，需要启动 Hive 的 container |
| `hive2HmsPort` | Hive2 metastore 的对外端口，默认为 9083 |
| `hive2HdfsPort` | Hive2 HDFS namenode 的对外端口，默认为 8020 |
| `enableEsTest` | 开启 ES 外表测试，需要启动 ES 的 container |
| `es_6_port` | ES6 的端口 |
| `es_7_port` | ES7 的端口 |
| `es_8_port` | ES8 的端口 |

---

## FAQ 与常见问题

<!-- 知识类型: 故障排查 -->

**Q: 启动 hudi container 时报 `UnknownHostException`？**

A: 启动前未在 `/etc/hosts` 中配置 `adhoc-1` / `adhoc-2` / `namenode` / `datanode1` / `hiveserver` / `hivemetastore` / `sparkmaster` 到 `127.0.0.1` 的映射。参考 [1.9 Hudi](#19-hudi) 添加。

**Q: 多套容器环境之间网络或容器名冲突？**

A: 修改 `docker/thirdparties/custom_settings.env` 的 `CONTAINER_UID` 为唯一前缀（例如 `doris-10002-18sda1-`），所有容器名和网络会基于该前缀重新生成。

**Q: 运行外表测试时报错连接失败？**

A: 确认 `regression-conf.groovy` 中对应的 `enableXxxTest` 为 `true`，对应端口与 docker compose 启动后的实际端口一致，并确认 container 状态正常（`docker ps -a`）。

**Q: 想看 `qt` Action 真实查询结果但 `.out` 文件还没有？**

A: 使用 `-genOut`（不覆盖已有文件）或 `-forceGenOut`（强制覆盖）参数运行，例如 `./run-regression-test.sh --run qt_action -genOut`。

**Q: 用例中如何避免 SQL 失败时整套测试中断？**

A: 使用 `try_sql(...)` 替代 `sql(...)`，失败时返回 `null` 而不抛异常。

