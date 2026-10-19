---
title: 회귀 테스트 프레임워크
language: ko
description: Apache Doris 회귀 테스트 프레임워크를 소개하고 테스트 케이스 작성 방법을 안내합니다. Suite, Action, 외부 데이터 소스 e2e 테스트, CI 통합을 다룹니다.
keywords:
    - Apache Doris 회귀 테스트
    - 회귀 테스트
    - Suite Action
    - Groovy 테스트 케이스
    - Doris 테스트 프레임워크
    - run-regression-test.sh
    - Docker Compose 외부 데이터 소스
    - TeamCity 통합
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

# 회귀 테스트 프레임워크 {#regression-testing-framework}

이 문서는 Apache Doris의 회귀 테스트를 작성하거나 실행해야 하는 개발자를 위한 문서입니다. 테스트 프레임워크의 핵심 개념, 디렉터리 구조, 설정과 함께 기본 제공 Action 및 외부 데이터 소스 e2e 테스트 사용 방법을 소개합니다.

## 목차 {#contents}

- [빠른 시작](#quick-start): 5단계로 첫 번째 테스트 케이스 실행하기
- [핵심 개념](#core-concepts): 세 가지 추상화인 Suite / Group / Action
- [프레임워크 디렉터리 구조](#framework-directory-structure): 소스 코드와 데이터 파일의 구성
- [기본 설정 파일](#default-configuration-file): `regression-conf.groovy`의 주요 필드
- [테스트 케이스 작성](#writing-test-cases): sql / qt / test / explain / streamLoad 등의 Action 예제
- [실행 스크립트 사용법](#launch-script-usage): `run-regression-test.sh`의 주요 명령어
- [`.out` 파일 자동 생성](#auto-generating-out-files): `-genOut` / `-forceGenOut`으로 검증 파일 생성하기
- [Suite 플러그인 메커니즘](#suite-plugin-mechanism): Groovy 스크립트로 Suite 확장하기
- [CI/CD 통합](#cicd-integration): TeamCity Service Message
- [외부 데이터 소스 e2e 테스트](#external-data-source-e2e-tests): MySQL / PostgreSQL / Hive / Iceberg / Hudi / Trino 등

---

## 빠른 시작 {#quick-start}

<!-- Knowledge type: Procedure -->

1. Doris 클러스터(FE + BE)를 미리 설치합니다.
2. `${DORIS_HOME}/regression-test/conf/regression-conf.groovy`를 편집하여 JDBC URL, 사용자 이름 등의 연결 정보를 설정합니다.
3. `regression-test/suites/<group>/` 아래에 Groovy 테스트 케이스 파일을 생성합니다.
4. 테스트 케이스에 `qt` Action이 포함되어 있다면 결과 검증을 위해 `regression-test/data/<group>/` 아래에 해당하는 `.out` TSV 파일을 생성합니다.
5. 테스트를 실행합니다.

    ```bash
    # Run all cases
    ${DORIS_HOME}/run-regression-test.sh

    # Run a specific case
    ${DORIS_HOME}/run-regression-test.sh --run <suiteName>
    ```

추가 실행 옵션은 [실행 스크립트 사용법](#launch-script-usage)을 참조하세요.

---

## 핵심 개념 {#core-concepts}

| 개념 | 의미 |
|------|------|
| `Suite` | 테스트 케이스입니다. 현재는 파일 이름을 Suite 이름으로 사용합니다. |
| `Group` | 테스트 케이스가 속한 디렉터리에 해당하는 테스트 집합입니다. |
| `Action` | 프레임워크가 제공하는 개별 테스트 동작입니다. SQL을 실행하는 `sql` Action, 결과를 검증하는 `test` Action, 데이터를 적재하는 `streamLoad` Action 등이 있습니다. |

---

## 프레임워크 디렉터리 구조 {#framework-directory-structure}

개발 중 알아 두어야 할 주요 파일과 디렉터리는 다음과 같습니다.

| 경로 | 용도 |
|------|------|
| `run-regression-test.sh` | 회귀 테스트 실행 스크립트 |
| `regression-conf.groovy` | 기본 설정 파일 |
| `data/` | 입력 데이터 및 `.out` 검증 파일 |
| `suites/` | 테스트 케이스 |

전체 디렉터리 구조:

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

## 기본 설정 파일 {#default-configuration-file}

<!-- Knowledge type: Configuration parameters -->

테스트를 실행하기 전에 실제 환경에 맞게 JDBC 및 FE 설정을 수정합니다. `regression-conf.groovy`의 핵심 필드는 다음과 같습니다.

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

## 테스트 케이스 작성 {#writing-test-cases}

<!-- Knowledge type: Procedure -->

1. `${DORIS_HOME}/regression-test` 디렉터리로 이동합니다.
2. 테스트 목적에 따라 테스트 케이스 디렉터리를 선택합니다. 정확성 테스트는 `suites/correctness` 아래에, 성능 테스트는 `suites/performance` 아래에 배치합니다.
3. 새 Groovy 테스트 케이스 파일을 생성하고 여러 Action을 조합하여 테스트 로직을 구현합니다.

Action은 DSL을 통해 정의되는, 프레임워크가 제공하는 테스트 동작입니다. 자주 사용하는 Action을 아래에서 소개합니다.

### sql 액션 {#sql-action}

`sql` Action은 SQL을 제출하고 결과를 가져옵니다. 쿼리가 실패하면 예외를 발생시킵니다.

매개변수:

| 매개변수 | 설명 |
|------|------|
| `String sql` | 입력 SQL 문자열 |
| 반환값 `List<List<Object>>` | 쿼리 결과입니다. DDL/DML의 경우 행 하나와 열 하나를 반환하며, 유일한 값은 updateRowCount입니다. |

아래 예제 코드는 `${DORIS_HOME}/regression-test/suites/demo/sql_action.groovy`에 있습니다.

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

### qt 액션 {#qt-action}

`qt` Action은 SQL을 제출하고 해당하는 `.out` TSV 파일과 결과를 비교하여 검증합니다.

| 매개변수 | 설명 |
|------|------|
| `String sql` | 입력 SQL 문자열 |
| 반환값 | void |

아래 예제 코드는 `${DORIS_HOME}/regression-test/suites/demo/qt_action.groovy`에 있습니다.

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

### test 액션 {#test-action}

`test` Action은 행 수, 실행 시간, 예외 발생 여부 확인과 같은 더 복잡한 검증 규칙을 지원합니다.

사용 가능한 매개변수:

| 매개변수 | 설명 |
|------|------|
| `String sql` | 입력 SQL 문자열 |
| `List<List<Object>> result` | 실제 쿼리 결과가 List 객체와 같은지 비교합니다. |
| `Iterator<Object> resultIterator` | 실제 쿼리 결과가 Iterator와 같은지 비교합니다. |
| `String resultFile` | 쿼리 결과와 비교할 파일의 URI입니다. 로컬 상대 경로나 http(s) 경로를 사용할 수 있습니다. 형식은 `.out`과 비슷하지만 블록 헤더와 주석은 없습니다. |
| `String exception` | 발생한 예외에 지정한 문자열이 포함되어 있는지 검증합니다. |
| `long rowNum` | 결과의 행 수를 검증합니다. |
| `long time` | 실행 시간이 이 값보다 작은지 검증합니다. 단위는 밀리초입니다. |
| `Closure<List<List<Object>>, Throwable, Long, Long> check` | 결과, 예외, 시간을 받는 사용자 정의 검증 콜백입니다. 콜백이 있으면 다른 검증 방식은 비활성화됩니다. |

아래 예제 코드는 `${DORIS_HOME}/regression-test/suites/demo/test_action.groovy`에 있습니다.

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

### explain 액션 {#explain-action}

`explain` Action은 `EXPLAIN`이 반환한 문자열에 지정한 문자열이 포함되어 있는지 검증합니다.

사용 가능한 매개변수:

| 매개변수 | 설명 |
|------|------|
| `String sql` | 쿼리할 SQL입니다. SQL에서 `EXPLAIN`을 제거합니다. |
| `String contains` | 실행 계획 출력에 지정한 문자열이 포함되어 있는지 검증합니다. 여러 번 호출하여 여러 문자열을 한 번에 검증할 수 있습니다. |
| `String notContains` | 실행 계획 출력에 지정한 문자열이 포함되어 있지 않은지 검증합니다. 여러 번 호출할 수 있습니다. |
| `Closure<String> check` | 반환된 문자열을 받는 사용자 정의 검증 콜백입니다. 검증 함수가 있으면 다른 검증 방식은 비활성화됩니다. |
| `Closure<String, Throwable, Long, Long> check` | 예외와 시간도 추가로 받는 사용자 정의 검증 콜백입니다. |

아래 예제 코드는 `${DORIS_HOME}/regression-test/suites/demo/explain_action.groovy`에 있습니다.

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

### streamLoad 액션 {#streamload-action}

`streamLoad` Action은 데이터를 적재합니다.

사용 가능한 매개변수:

| 매개변수 | 설명 |
|------|------|
| `String db` | 데이터베이스 이름입니다. 기본값은 `defaultDb`이며, `regression-conf.groovy`에서 가져옵니다. |
| `String table` | 테이블 이름 |
| `String file` | 적재할 파일의 경로입니다. `data/` 디렉터리 아래의 상대 경로나 http URL을 사용할 수 있습니다. |
| `Iterator<List<Object>> inputIterator` | 적재할 Iterator |
| `String inputText` | 적재할 텍스트입니다. 자주 사용하지 않습니다. |
| `InputStream inputStream` | 적재할 바이트 스트림입니다. 자주 사용하지 않습니다. |
| `long time` | 실행 시간이 이 값보다 작은지 검증합니다. 단위는 밀리초입니다. |
| `void set(String key, String value)` | `label`, `columnSeparator`와 같은 Stream Load HTTP 요청 헤더를 설정합니다. |
| `Closure<String, Throwable, Long, Long> check` | 사용자 정의 검증 콜백입니다. 콜백이 있으면 다른 검증 항목은 비활성화됩니다. |

아래 예제 코드는 `${DORIS_HOME}/regression-test/suites/demo/streamLoad_action.groovy`에 있습니다.

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

### 기타 액션 {#other-actions}

`thread`, `lazyCheck`, `events`, `connect`, `selectUnionAll` Action의 예제는 다음 디렉터리에서 확인할 수 있습니다.

```text
${DORIS_HOME}/regression-test/suites/demo
```

---

## 실행 스크립트 사용법 {#launch-script-usage}

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

## `.out` 파일 자동 생성 {#auto-generating-out-files}

```bash
# Automatically generate the .out file for the sql_action case from the query result. Skip if the .out file already exists.
./run-regression-test.sh --run sql_action -genOut

# Automatically generate the .out file for the sql_action case from the query result. Overwrite if the .out file already exists.
./run-regression-test.sh --run sql_action -forceGenOut
```

---

## Suite 플러그인 메커니즘 {#suite-plugin-mechanism}

소스 코드를 수정하지 않고 Suite 클래스를 확장해야 할 때는 플러그인을 사용할 수 있습니다. 기본 플러그인 디렉터리는 `${DORIS_HOME}/regression-test/plugins`이며, 이 디렉터리에서 Groovy 스크립트로 확장 메서드를 정의할 수 있습니다.

다음 `plugin_example.groovy`는 Suite 클래스에 `testPlugin` 함수를 추가하여 로그를 출력합니다.

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

등록한 후에는 일반 테스트 케이스에서 이 함수를 호출할 수 있습니다. `${DORIS_HOME}/regression-test/suites/demo/test_plugin.groovy`를 예로 들면 다음과 같습니다.

```groovy
suite("test_plugin", "demo") {
    // register testPlugin function in ${DORIS_HOME}/regression-test/plugins/plugin_example.groovy
    def result = testPlugin("message from suite")
    assertEquals("OK", result)
}
```

---

## CI/CD 통합 {#cicd-integration}

### TeamCity {#teamcity}

TeamCity는 stdout을 통해 Service Message를 인식할 수 있습니다. `--teamcity` 매개변수로 회귀 테스트 프레임워크를 시작하면 프레임워크가 TeamCity Service Message를 stdout에 출력합니다. TeamCity는 이러한 이벤트 로그를 자동으로 읽어 현재 파이프라인에 `Tests`를 표시하며, 여기에는 테스트 케이스와 해당 로그가 포함됩니다.

실행 명령어 예제는 다음과 같습니다. `-Dteamcity.enableStdErr=false`를 설정하면 오류 로그도 stdout에 출력되므로 시간순으로 분석하기가 쉬워집니다.

```bash
JAVA_OPTS="-Dteamcity.enableStdErr=${enableStdErr}" ./run-regression-test.sh --teamcity --run
```

---

## 외부 데이터 소스 e2e 테스트 {#external-data-source-e2e-tests}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: External data source development / Catalog debugging -->

Doris는 여러 외부 데이터 소스에 대한 쿼리를 지원합니다. 회귀 테스트 프레임워크는 Docker Compose를 통해 외부 데이터 소스를 구성하는 기능을 제공하며, 이를 사용하여 Doris와 외부 데이터 소스의 연동을 e2e 테스트할 수 있습니다.

### 0. 준비 {#0-preparation}

Docker를 시작하기 전에 `CONTAINER_UID` 변수를 `docker/thirdparties/custom_settings.env`에서 수정합니다. 예를 들어 `doris-10002-18sda1-`로 설정합니다. 이후 실행 스크립트는 docker compose의 이름에 이 접두사를 적용하여 여러 컨테이너 환경의 이름과 네트워크가 충돌하지 않도록 합니다.

컨테이너를 시작하기 전에 서버 또는 클라우드 호스트의 네트워크 설정을 확인하고, `/etc/hosts`에 호스트 이름(`hostname`)과 호스트 IP(`hostname -i`) 간의 매핑이 포함되어 있는지 확인합니다. 예시는 다음과 같습니다.

```text
10.0.0.46    iZj6cbwlx5pl6y0681t6scZ    iZj6cbwlx5pl6y0681t6scZ
```

각 항목은 순서대로 IP 주소(`hostname -i`의 출력으로, 일반적으로 eth0의 IP), 호스트 이름(`hostname`의 출력), 별칭(호스트 이름과 동일)에 해당합니다.

> **참고**: `run-thirdparties-docker.sh`는 `eth[0-9]`와 일치하는 이름을 검색하여 기본 네트워크 인터페이스를 감지합니다. systemd/udev를 사용하는 최신 Linux 배포판은 `enp3s0`, `ens33`, `eno1`과 같은 예측 가능한 이름을 할당하지만, 스크립트는 이러한 이름을 인식하지 못합니다. 호스트에서 이러한 이름을 사용하면 스크립트가 인터페이스를 감지하지 못합니다. 실행하기 전에 `eth_name` 변수를 `run-thirdparties-docker.sh` 안에서 실제 인터페이스 이름으로 직접 설정하세요.

### 1. 컨테이너 시작 {#1-start-the-container}

Doris는 현재 es, mysql, pg, hive, sqlserver, oracle, iceberg, hudi, trino 등의 데이터 소스에 대해 Docker compose를 지원합니다. 관련 파일은 `docker/thirdparties/docker-compose` 디렉터리에 저장되어 있습니다.

기본적으로 다음 명령어로 모든 외부 데이터 소스의 Docker 컨테이너를 바로 시작할 수 있습니다. hive와 hudi는 미리 준비된 데이터 파일을 다운로드해야 합니다. 아래의 해당 절을 참조하세요.

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh
```

이 명령어를 실행하려면 root 또는 sudo 권한이 필요합니다. 정상적으로 반환되면 모든 컨테이너가 시작된 것이며, `docker ps -a`로 확인할 수 있습니다. 컨테이너가 시작되는 동안 `docker logs -f <container-name>`으로 로그를 확인할 수 있습니다.

모든 컨테이너 중지:

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh --stop
```

특정 컴포넌트 시작 또는 중지:

```bash
cd docker/thirdparties
# Start mysql
sh run-thirdparties-docker.sh -c mysql
# Start mysql, pg, iceberg
sh run-thirdparties-docker.sh -c mysql,pg,iceberg
# Stop mysql, pg, iceberg
sh run-thirdparties-docker.sh -c mysql,pg,iceberg --stop
```

#### 1.1 MySQL {#11-mysql}

MySQL 관련 Docker compose 파일은 `docker/thirdparties/docker-compose/mysql` 아래에 저장되어 있습니다.

- `mysql-5.7.yaml.tpl`: Docker compose 파일 템플릿입니다. 수정할 필요가 없습니다. 기본 사용자 이름과 비밀번호는 `root` / `123456`입니다.
- `mysql-5.7.env`: 설정 파일입니다. MySQL 컨테이너가 외부에 노출하는 포트를 설정하며, 기본값은 3316입니다.
- `init/`: 이 디렉터리의 SQL 파일은 컨테이너 생성 후 자동으로 실행됩니다. 기본적으로 데이터베이스와 테이블을 생성하고 소량의 데이터를 삽입합니다.
- `data/`: 컨테이너 시작 후 마운트되는 로컬 데이터 디렉터리입니다. `run-thirdparties-docker.sh`가 실행될 때마다 이 디렉터리를 비우고 다시 생성합니다.

#### 1.2 PostgreSQL {#12-postgresql}

PostgreSQL 관련 Docker compose 파일은 `docker/thirdparties/docker-compose/postgresql` 아래에 저장되어 있습니다.

- `postgresql-14.yaml.tpl`: Docker compose 파일 템플릿입니다. 수정할 필요가 없습니다. 기본 사용자 이름과 비밀번호는 `postgres` / `123456`입니다.
- `postgresql-14.env`: 설정 파일입니다. PostgreSQL 컨테이너가 외부에 노출하는 포트를 설정하며, 기본값은 5442입니다.
- `init/`: 이 디렉터리의 SQL 파일은 컨테이너 생성 후 자동으로 실행됩니다. 기본적으로 데이터베이스와 테이블을 생성하고 소량의 데이터를 삽입합니다.
- `data/`: 컨테이너 시작 후 마운트되는 로컬 데이터 디렉터리입니다. `run-thirdparties-docker.sh`가 실행될 때마다 이 디렉터리를 비우고 다시 생성합니다.

#### 1.3 Hive {#13-hive}

Hive 관련 Docker compose 파일은 `docker/thirdparties/docker-compose/hive` 아래에 저장되어 있으며, Hive2와 Hive3를 모두 지원합니다.

- `hive-2x.yaml.tpl`, `hive-3x.yaml.tpl`: Docker compose 파일 템플릿입니다. 수정할 필요가 없습니다.
- `hadoop-hive.env.tpl`, `hadoop-hive-2x.env.tpl`, `hadoop-hive-3x.env.tpl`: 설정 파일 템플릿입니다. 수정할 필요가 없습니다.
- `hive-2x_settings.env`: Hive2 초기화 설정 스크립트입니다. 시작 시 `run-thirdparties-docker.sh`가 자동으로 호출합니다. 외부에 노출하는 네 개의 포트 `FS_PORT`, `HMS_PORT`, `HS_PORT`, `PG_PORT`를 수정할 수 있으며, 각각 `hive2HdfsPort`, `hive2HmsPort`, `hive2ServerPort`, `hive2PgPort`에 대응합니다. 이 항목들은 `regression-conf.groovy`에 있습니다. 앞의 두 포트는 hadoop defaultFs와 Hive metastore 포트이며, 기본값은 각각 8020과 9083입니다.
- `hive-3x_settings.env`: Hive3 초기화 설정 스크립트입니다. `FS_PORT`, `HMS_PORT`, `HS_PORT`, `PG_PORT`를 수정할 수 있으며, 각각 `hive3HdfsPort`, `hive3HmsPort`, `hive3ServerPort`, `hive3PgPort`에 대응합니다. 앞의 두 포트의 기본값은 각각 8320과 9383입니다.
- `scripts/` 디렉터리는 컨테이너 시작 후 컨테이너에 마운트됩니다. 파일 내용을 수정할 필요는 없습니다. 다만 컨테이너를 시작하기 전에 미리 준비된 파일을 먼저 다운로드해야 합니다.

    `https://doris-regression-hk.oss-cn-hongkong.aliyuncs.com/regression/datalake/pipeline_data/tpch1.db.tar.gz`를 `scripts/` 디렉터리에 다운로드하고 압축을 해제합니다.

#### 1.4 Elasticsearch {#14-elasticsearch}

ES6, ES7, ES8용 Docker 이미지가 포함되어 있으며, `docker/thirdparties/docker-compose/elasticsearch/` 아래에 저장되어 있습니다.

- `es.yaml.tpl`: Docker compose 파일 템플릿입니다. ES6, ES7, ES8 버전이 포함되어 있습니다. 수정할 필요가 없습니다.
- `es.env`: 설정 파일입니다. ES 포트 번호를 설정해야 합니다.
- `scripts/`: 이미지 시작 후 실행되는 초기화 스크립트를 저장합니다.

#### 1.5 Oracle {#15-oracle}

Oracle 11 이미지를 제공하며, `docker/thirdparties/docker-compose/oracle/` 아래에 저장되어 있습니다.

- `oracle-11.yaml.tpl`: Docker compose 파일 템플릿입니다. 수정할 필요가 없습니다.
- `oracle-11.env`: Oracle이 외부에 노출하는 포트를 설정하며, 기본값은 1521입니다.

#### 1.6 SQLServer {#16-sqlserver}

SQLServer 2022 이미지를 제공하며, `docker/thirdparties/docker-compose/sqlserver/` 아래에 저장되어 있습니다.

- `sqlserver.yaml.tpl`: Docker compose 파일 템플릿입니다. 수정할 필요가 없습니다.
- `sqlserver.env`: SQLServer가 외부에 노출하는 포트를 설정하며, 기본값은 1433입니다.

#### 1.7 ClickHouse {#17-clickhouse}

ClickHouse 22 이미지를 제공하며, `docker/thirdparties/docker-compose/clickhouse/` 아래에 저장되어 있습니다.

- `clickhouse.yaml.tpl`: Docker compose 파일 템플릿입니다. 수정할 필요가 없습니다.
- `clickhouse.env`: ClickHouse가 외부에 노출하는 포트를 설정하며, 기본값은 8123입니다.

#### 1.8 Iceberg {#18-iceberg}

Iceberg + Spark + Minio 이미지 조합을 제공하며, `docker/thirdparties/docker-compose/iceberg/` 아래에 저장되어 있습니다.

- `iceberg.yaml.tpl`: Docker compose 파일 템플릿입니다. 수정할 필요가 없습니다.
- `entrypoint.sh.tpl`: 이미지 시작 후 실행되는 초기화 스크립트 템플릿입니다. 수정할 필요가 없습니다.
- `spark-defaults.conf.tpl`: Spark 설정 파일 템플릿입니다. 수정할 필요가 없습니다.
- `iceberg.env`: 외부 노출 포트 설정 파일입니다. 충돌을 방지하도록 필요에 따라 포트를 수정합니다.

시작 후 다음 명령어로 spark-sql을 실행할 수 있습니다.

```bash
docker exec -it doris-xx-spark-iceberg spark-sql
```

여기서 `doris-xx-spark-iceberg`는 컨테이너 이름입니다.

spark-sql을 사용한 Iceberg 작업 예제:

```sql
create database db1;
show databases;
create table db1.test1(k1 bigint, k2 bigint, k3 string) partitioned by (k1);
insert into db1.test1 values(1,2,'abc');
select * from db1.test1;
quit;
```

spark-shell을 통해서도 접근할 수 있습니다.

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

자세한 사용법은 [Tabular 공식 문서](https://tabular.io/blog/docker-spark-and-iceberg/)를 참조하세요.

#### 1.9 Hudi {#19-hudi}

Hudi 관련 Docker compose 파일은 `docker/thirdparties/docker-compose/hudi` 아래에 저장되어 있습니다.

- `hudi.yaml.tpl`: Docker compose 파일 템플릿입니다. 수정할 필요가 없습니다.
- `hadoop.env`: 설정 파일 템플릿입니다. 수정할 필요가 없습니다.
- `scripts/` 디렉터리는 컨테이너 시작 후 컨테이너에 마운트됩니다. 파일 내용을 수정할 필요는 없습니다. 다만 컨테이너를 시작하기 전에 미리 준비된 파일을 먼저 다운로드해야 합니다.

    `https://doris-build-hk-1308700295.cos.ap-hongkong.myqcloud.com/regression/load/hudi/hudi_docker_compose_attached_file.zip`을 `scripts/` 디렉터리에 다운로드하고 압축을 해제합니다.

시작 전에 다음 설정을 `/etc/hosts`에 추가하면 `UnknownHostException` 오류를 방지할 수 있습니다.

```text
127.0.0.1 adhoc-1
127.0.0.1 adhoc-2
127.0.0.1 namenode
127.0.0.1 datanode1
127.0.0.1 hiveserver
127.0.0.1 hivemetastore
127.0.0.1 sparkmaster
```

시작 후 다음 명령어로 hive 쿼리를 실행할 수 있습니다.

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

spark-shell을 통해서도 접근할 수 있습니다.

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

자세한 사용법은 [Hudi 공식 문서](https://hudi.apache.org/docs/docker_demo)를 참조하세요.

#### 1.10 Trino {#110-trino}

Trino 관련 Docker compose 파일은 `docker/thirdparties/docker-compose/trino` 아래에 저장되어 있습니다. 템플릿 파일은 다음과 같습니다.

- `gen_env.sh.tpl`: HDFS 관련 포트 번호를 생성합니다. 수정할 필요가 없습니다. 포트 충돌이 발생하면 포트 번호를 수정할 수 있습니다.
- `hive.properties.tpl`: trino Catalog 정보를 설정합니다. 수정할 필요가 없습니다.
- `trino_hive.env.tpl`: Hive 환경 설정입니다. 수정할 필요가 없습니다.
- `trino_hive.yaml.tpl`: Docker compose 파일입니다. 수정할 필요가 없습니다.

Trino docker를 시작하면 Trino + hive Catalog 환경이 구성됩니다. 이때 Trino에는 두 개의 Catalog가 있습니다.

1. `hive`
2. `tpch` (trino docker에 기본 포함)

자세한 사용법은 [Trino 공식 문서](https://trino.io/docs/current/installation/containers.html)를 참조하세요.

### 2. 회귀 테스트 실행 {#2-run-regression-tests}

외부 테이블 관련 회귀 테스트는 기본적으로 비활성화되어 있습니다. `regression-test/conf/regression-conf.groovy`의 설정을 편집하여 활성화할 수 있습니다. 설정 항목 예시는 다음과 같습니다.

| 설정 항목 | 설명 |
|--------|------|
| `enableJdbcTest` | JDBC 외부 테이블 테스트를 활성화합니다. MySQL 및 PostgreSQL 컨테이너를 시작해야 합니다. |
| `mysql_57_port` | MySQL이 외부에 노출하는 포트이며, 기본값은 3316입니다. |
| `pg_14_port` | PostgreSQL이 외부에 노출하는 포트이며, 기본값은 5442입니다. |
| `enableHiveTest` | Hive 외부 테이블 테스트를 활성화합니다. Hive 컨테이너를 시작해야 합니다. |
| `hive2HmsPort` | Hive2 metastore가 외부에 노출하는 포트이며, 기본값은 9083입니다. |
| `hive2HdfsPort` | Hive2 HDFS namenode가 외부에 노출하는 포트이며, 기본값은 8020입니다. |
| `enableEsTest` | ES 외부 테이블 테스트를 활성화합니다. ES 컨테이너를 시작해야 합니다. |
| `es_6_port` | ES6 포트 |
| `es_7_port` | ES7 포트 |
| `es_8_port` | ES8 포트 |

---

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Troubleshooting -->

**질문: hudi 컨테이너를 시작할 때 `UnknownHostException`이 발생합니다.**

답변: 시작 전에 `adhoc-1` / `adhoc-2` / `namenode` / `datanode1` / `hiveserver` / `hivemetastore` / `sparkmaster`를 `127.0.0.1`에 매핑하는 설정을 `/etc/hosts`에 추가하지 않았기 때문입니다. [1.9 Hudi](#19-hudi)를 참조하여 추가하세요.

**질문: 여러 컨테이너 환경 간에 네트워크 또는 컨테이너 이름이 충돌합니다.**

답변: `CONTAINER_UID`를 `docker/thirdparties/custom_settings.env`에서 고유한 접두사(예: `doris-10002-18sda1-`)로 수정하세요. 모든 컨테이너 이름과 네트워크는 이 접두사를 기준으로 다시 생성됩니다.

**질문: 외부 테이블 테스트를 실행할 때 연결 실패 오류가 발생합니다.**

답변: 해당하는 `enableXxxTest`가 `regression-conf.groovy`에서 `true`로 설정되어 있는지, 설정된 포트가 시작 후 docker compose에서 실제로 노출하는 포트와 일치하는지, 컨테이너 상태가 정상인지(`docker ps -a`) 확인하세요.

**질문: `.out` 파일이 아직 없을 때 `qt` Action의 실제 쿼리 결과를 어떻게 확인하나요?**

답변: `-genOut`(기존 파일을 덮어쓰지 않음) 또는 `-forceGenOut`(강제로 덮어씀) 매개변수를 사용하여 실행하세요. 예: `./run-regression-test.sh --run qt_action -genOut`.

**질문: 테스트 케이스에서 SQL이 실패해도 전체 테스트 Suite가 중단되지 않게 하려면 어떻게 하나요?**

답변: `try_sql(...)`을 `sql(...)` 대신 사용하세요. 실패하면 예외를 발생시키는 대신 `null`을 반환합니다.
