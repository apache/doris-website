---
title: 回帰テストフレームワーク
language: ja
description: Apache Doris の回帰テストフレームワークの概要と、Suite、Action、外部データソースの E2E テスト、CI 連携を含むテストケースの作成ガイド。
keywords:
    - Apache Doris の回帰テスト
    - 回帰テスト
    - Suite と Action
    - Groovy テストケース
    - Doris テストフレームワーク
    - run-regression-test.sh
    - Docker Compose の外部データソース
    - TeamCity 連携
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

# 回帰テストフレームワーク {#regression-testing-framework}

このドキュメントは、Apache Doris の回帰テストを作成または実行する開発者向けです。テストフレームワークの基本概念、ディレクトリ構成、設定に加え、組み込みの Action と外部データソースの E2E テストの使い方を説明します。

## 目次 {#contents}

- [クイックスタート](#quick-start): 5 つの手順で最初のテストケースを実行
- [基本概念](#core-concepts): Suite / Group / Action の三つの抽象概念
- [フレームワークのディレクトリ構成](#framework-directory-structure): ソースコードとデータファイルの配置
- [デフォルト設定ファイル](#default-configuration-file): `regression-conf.groovy` の主な項目
- [テストケースの作成](#writing-test-cases): sql / qt / test / explain / streamLoad などの Action の例
- [起動スクリプトの使い方](#launch-script-usage): `run-regression-test.sh` の主なコマンド
- [`.out` ファイルの自動生成](#auto-generating-out-files): `-genOut` / `-forceGenOut` による検証ファイルの生成
- [Suite プラグイン機構](#suite-plugin-mechanism): Groovy スクリプトによる Suite の拡張
- [CI/CD 連携](#cicd-integration): TeamCity Service Message
- [外部データソースの E2E テスト](#external-data-source-e2e-tests): MySQL / PostgreSQL / Hive / Iceberg / Hudi / Trino など

---

## クイックスタート {#quick-start}

<!-- Knowledge type: Procedure -->

1. Doris クラスター（FE + BE）を事前にインストールします。
2. `${DORIS_HOME}/regression-test/conf/regression-conf.groovy` を編集し、JDBC URL やユーザー名などの接続情報を設定します。
3. `regression-test/suites/<group>/` に Groovy のテストケースファイルを作成します。
4. テストケースに `qt` Action が含まれる場合は、結果の検証に使う対応する `.out` TSV ファイルを `regression-test/data/<group>/` に作成します。
5. テストを実行します。

    ```bash
    # Run all cases
    ${DORIS_HOME}/run-regression-test.sh

    # Run a specific case
    ${DORIS_HOME}/run-regression-test.sh --run <suiteName>
    ```

その他の起動オプションについては、[起動スクリプトの使い方](#launch-script-usage)を参照してください。

---

## 基本概念 {#core-concepts}

| 概念 | 意味 |
|------|------|
| `Suite` | テストケースです。現在はファイル名が Suite 名として使われます。 |
| `Group` | テストケースが属するディレクトリに対応するテストの集合です。 |
| `Action` | フレームワークが提供する個々のテスト操作です。SQL を実行する `sql` Action、結果を検証する `test` Action、データを取り込む `streamLoad` Action などがあります。 |

---

## フレームワークのディレクトリ構成 {#framework-directory-structure}

開発時に把握しておくべき主なファイルとディレクトリは次のとおりです。

| パス | 用途 |
|------|------|
| `run-regression-test.sh` | 回帰テストの起動スクリプト |
| `regression-conf.groovy` | デフォルト設定ファイル |
| `data/` | 入力データと検証用の `.out` ファイル |
| `suites/` | テストケース |

ディレクトリツリー全体を以下に示します。

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

## デフォルト設定ファイル {#default-configuration-file}

<!-- Knowledge type: Configuration parameters -->

テストを実行する前に、実際の環境に合わせて JDBC と FE の設定を更新します。`regression-conf.groovy` の主な項目は次のとおりです。

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

## テストケースの作成 {#writing-test-cases}

<!-- Knowledge type: Procedure -->

1. `${DORIS_HOME}/regression-test` ディレクトリに移動します。
2. テストの目的に応じてディレクトリを選びます。正確性のテストは `suites/correctness`、性能テストは `suites/performance` に配置します。
3. 新しい Groovy テストケースファイルを作成し、複数の Action を組み合わせてテストロジックを実装します。

Action は、DSL で定義するフレームワークのテスト操作です。以下に主な Action を紹介します。

### sql アクション {#sql-action}

`sql` Action は SQL を送信し、結果を取得します。クエリが失敗すると例外をスローします。

パラメーター:

| パラメーター | 説明 |
|------|------|
| `String sql` | 入力する SQL 文字列 |
| 戻り値 `List<List<Object>>` | クエリ結果です。DDL/DML では一行一列を返し、唯一の値は updateRowCount です。 |

以下のサンプルコードは `${DORIS_HOME}/regression-test/suites/demo/sql_action.groovy` にあります。

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

### qt アクション {#qt-action}

`qt` Action は SQL を送信し、結果を対応する `.out` TSV ファイルと照合します。

| パラメーター | 説明 |
|------|------|
| `String sql` | 入力する SQL 文字列 |
| 戻り値 | void |

以下のサンプルコードは `${DORIS_HOME}/regression-test/suites/demo/qt_action.groovy` にあります。

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

### test アクション {#test-action}

`test` Action では、行数、実行時間、例外の発生有無など、より複雑な検証ルールを指定できます。

指定可能なパラメーター:

| パラメーター | 説明 |
|------|------|
| `String sql` | 入力する SQL 文字列 |
| `List<List<Object>> result` | 実際のクエリ結果を List オブジェクトと比較し、一致するか検証します。 |
| `Iterator<Object> resultIterator` | 実際のクエリ結果を Iterator と比較し、一致するか検証します。 |
| `String resultFile` | クエリ結果との比較に使用するファイル URI（ローカルの相対パスまたは http(s) パス）です。形式は `.out` と似ていますが、ブロックヘッダーとコメントは含みません。 |
| `String exception` | スローされた例外に指定の文字列が含まれることを検証します。 |
| `long rowNum` | 結果の行数を検証します。 |
| `long time` | 実行時間が指定値未満であることを検証します。単位はミリ秒です。 |
| `Closure<List<List<Object>>, Throwable, Long, Long> check` | 結果、例外、時間を受け取るカスタム検証コールバックです。指定すると、ほかの検証方法は無効になります。 |

以下のサンプルコードは `${DORIS_HOME}/regression-test/suites/demo/test_action.groovy` にあります。

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

### explain アクション {#explain-action}

`explain` Action は、`EXPLAIN` が返す文字列に特定の文字列が含まれるかを検証します。

指定可能なパラメーター:

| パラメーター | 説明 |
|------|------|
| `String sql` | 調べる SQL です。SQL から `EXPLAIN` を取り除いて指定します。 |
| `String contains` | explain の出力に指定の文字列が含まれることを検証します。複数回呼び出して複数の文字列を検証できます。 |
| `String notContains` | explain の出力に指定の文字列が含まれないことを検証します。複数回呼び出せます。 |
| `Closure<String> check` | 返された文字列を受け取るカスタム検証コールバックです。指定すると、ほかの検証方法は無効になります。 |
| `Closure<String, Throwable, Long, Long> check` | 例外と時間も受け取るカスタム検証コールバックです。 |

以下のサンプルコードは `${DORIS_HOME}/regression-test/suites/demo/explain_action.groovy` にあります。

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

### streamLoad アクション {#streamload-action}

`streamLoad` Action はデータを取り込みます。

指定可能なパラメーター:

| パラメーター | 説明 |
|------|------|
| `String db` | DB 名です。デフォルトは `defaultDb`（`regression-conf.groovy` で定義）です。 |
| `String table` | テーブル名 |
| `String file` | 取り込むファイルのパスです。`data/` ディレクトリ以下の相対パス、または http URL を指定できます。 |
| `Iterator<List<Object>> inputIterator` | 取り込むデータのイテレーター |
| `String inputText` | 取り込むテキストです。使用頻度は低めです。 |
| `InputStream inputStream` | 取り込むバイトストリームです。使用頻度は低めです。 |
| `long time` | 実行時間が指定値未満であることを検証します。単位はミリ秒です。 |
| `void set(String key, String value)` | `label` や `columnSeparator` などの Stream Load HTTP リクエストヘッダーを設定します。 |
| `Closure<String, Throwable, Long, Long> check` | カスタム検証コールバックです。指定すると、ほかの検証項目は無効になります。 |

以下のサンプルコードは `${DORIS_HOME}/regression-test/suites/demo/streamLoad_action.groovy` にあります。

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

### その他の Action {#other-actions}

`thread`、`lazyCheck`、`events`、`connect`、`selectUnionAll` の各 Action の例は、次のディレクトリにあります。

```text
${DORIS_HOME}/regression-test/suites/demo
```

---

## 起動スクリプトの使い方 {#launch-script-usage}

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

## `.out` ファイルの自動生成 {#auto-generating-out-files}

```bash
# Automatically generate the .out file for the sql_action case from the query result. Skip if the .out file already exists.
./run-regression-test.sh --run sql_action -genOut

# Automatically generate the .out file for the sql_action case from the query result. Overwrite if the .out file already exists.
./run-regression-test.sh --run sql_action -forceGenOut
```

---

## Suite プラグイン機構 {#suite-plugin-mechanism}

ソースコードを変更せずに Suite クラスを拡張するには、プラグインを使用します。デフォルトのプラグインディレクトリは `${DORIS_HOME}/regression-test/plugins` です。ここに Groovy スクリプトで拡張メソッドを定義できます。

次の `plugin_example.groovy` は Suite クラスに `testPlugin` 関数を追加し、ログを出力します。

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

登録後は、通常のテストケースからこの関数を呼び出せます。`${DORIS_HOME}/regression-test/suites/demo/test_plugin.groovy` を例に示します。

```groovy
suite("test_plugin", "demo") {
    // register testPlugin function in ${DORIS_HOME}/regression-test/plugins/plugin_example.groovy
    def result = testPlugin("message from suite")
    assertEquals("OK", result)
}
```

---

## CI/CD 連携 {#cicd-integration}

### TeamCity {#teamcity}

TeamCity は標準出力から Service Message を認識できます。回帰テストフレームワークを `--teamcity` パラメーターで起動すると、フレームワークは TeamCity Service Message を標準出力に出力します。TeamCity はこれらのイベントログを自動的に読み取り、テストケースとログを含む `Tests` を現在のパイプラインに表示します。

以下に起動コマンドの例を示します。`-Dteamcity.enableStdErr=false` を設定すると、エラーログも標準出力に出力されるため、時系列順に分析しやすくなります。

```bash
JAVA_OPTS="-Dteamcity.enableStdErr=${enableStdErr}" ./run-regression-test.sh --teamcity --run
```

---

## 外部データソースの E2E テスト {#external-data-source-e2e-tests}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: External data source development / Catalog debugging -->

Doris は複数の外部データソースへのクエリをサポートします。回帰テストフレームワークでは Docker Compose を使って外部データソースを構築し、Doris と外部データソースの連携を E2E テストできます。

### 0. 準備 {#0-preparation}

Docker を起動する前に、`CONTAINER_UID` 変数を `docker/thirdparties/custom_settings.env` で編集します。たとえば `doris-10002-18sda1-` に設定します。後続の起動スクリプトは Docker Compose 内の名前をこのプレフィックスに置き換え、複数のコンテナー環境で名前とネットワークが衝突しないようにします。

コンテナーを起動する前に、サーバーまたはクラウドホストのネットワーク設定を確認し、`/etc/hosts` にホスト名（`hostname`）とホスト IP（`hostname -i`）の対応が記載されていることを確認します。例:

```text
10.0.0.46    iZj6cbwlx5pl6y0681t6scZ    iZj6cbwlx5pl6y0681t6scZ
```

これらは順に、IP アドレス（`hostname -i` の出力で、通常は eth0 の IP）、ホスト名（`hostname` の出力）、エイリアス（ホスト名と同じ）に対応します。

> **注意**: `run-thirdparties-docker.sh` は、`eth[0-9]` に一致する名前を探して主なネットワークインターフェースを検出します。systemd/udev を使う新しい Linux ディストリビューションでは、`enp3s0`、`ens33`、`eno1` などの予測可能な名前が割り当てられますが、このスクリプトはそれらを認識しません。ホストでそのような名前を使っている場合、インターフェースの検出に失敗します。実行前に `eth_name` 変数を `run-thirdparties-docker.sh` 内で実際のインターフェース名に手動で設定してください。

### 1. コンテナーの起動 {#1-start-the-container}

Doris は現在、es、mysql、pg、hive、sqlserver、oracle、iceberg、hudi、trino などのデータソース向け Docker Compose をサポートしています。関連ファイルは `docker/thirdparties/docker-compose` ディレクトリにあります。

デフォルトでは、次のコマンドで全外部データソースの Docker コンテナーを起動できます（hive と hudi ではビルド済みデータファイルのダウンロードが必要です。以下の該当セクションを参照してください）。

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh
```

このコマンドには root または sudo 権限が必要です。正常に終了したら、すべてのコンテナーが起動しています。`docker ps -a` で確認できます。コンテナーの起動中は `docker logs -f <container-name>` でログを確認できます。

すべてのコンテナーを停止するには、次を実行します。

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh --stop
```

特定のコンポーネントを起動または停止するには、次を実行します。

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

MySQL 関連の Docker Compose ファイルは `docker/thirdparties/docker-compose/mysql` にあります。

- `mysql-5.7.yaml.tpl`: Docker Compose ファイルのテンプレートです。変更は不要です。デフォルトのユーザー名とパスワードは `root` / `123456` です。
- `mysql-5.7.env`: MySQL コンテナーが公開するポートを設定するファイルです。デフォルトは 3316 です。
- `init/`: このディレクトリの SQL ファイルは、コンテナーの作成後に自動実行されます。デフォルトではデータベースとテーブルを作成し、少量のデータを挿入します。
- `data/`: コンテナーの起動後にマウントされるローカルデータディレクトリです。`run-thirdparties-docker.sh` は起動するたびにこのディレクトリを消去して再作成します。

#### 1.2 PostgreSQL {#12-postgresql}

PostgreSQL 関連の Docker Compose ファイルは `docker/thirdparties/docker-compose/postgresql` にあります。

- `postgresql-14.yaml.tpl`: Docker Compose ファイルのテンプレートです。変更は不要です。デフォルトのユーザー名とパスワードは `postgres` / `123456` です。
- `postgresql-14.env`: PostgreSQL コンテナーが公開するポートを設定するファイルです。デフォルトは 5442 です。
- `init/`: このディレクトリの SQL ファイルは、コンテナーの作成後に自動実行されます。デフォルトではデータベースとテーブルを作成し、少量のデータを挿入します。
- `data/`: コンテナーの起動後にマウントされるローカルデータディレクトリです。`run-thirdparties-docker.sh` は起動するたびにこのディレクトリを消去して再作成します。

#### 1.3 Hive {#13-hive}

Hive 関連の Docker Compose ファイルは `docker/thirdparties/docker-compose/hive` にあり、Hive2 と Hive3 の両方をサポートします。

- `hive-2x.yaml.tpl`、`hive-3x.yaml.tpl`: Docker Compose ファイルのテンプレートです。変更は不要です。
- `hadoop-hive.env.tpl`、`hadoop-hive-2x.env.tpl`、`hadoop-hive-3x.env.tpl`: 設定ファイルのテンプレートです。変更は不要です。
- `hive-2x_settings.env`: Hive2 の初期化設定スクリプトです。起動時に `run-thirdparties-docker.sh` が自動的に呼び出します。公開する四つのポート `FS_PORT`、`HMS_PORT`、`HS_PORT`、`PG_PORT` を変更できます。これらは順に `hive2HdfsPort`、`hive2HmsPort`、`hive2ServerPort`、`hive2PgPort`（`regression-conf.groovy` 内）に対応します。最初の二つは Hadoop の defaultFs と Hive メタストアのポートで、デフォルトは 8020 と 9083 です。
- `hive-3x_settings.env`: Hive3 の初期化設定スクリプトです。`FS_PORT`、`HMS_PORT`、`HS_PORT`、`PG_PORT` を変更できます。これらは `hive3HdfsPort`、`hive3HmsPort`、`hive3ServerPort`、`hive3PgPort` に対応します。最初の二つのデフォルトは 8320 と 9383 です。
- `scripts/` ディレクトリはコンテナーの起動後にマウントされます。ファイルの内容を変更する必要はありません。ただし、コンテナーを起動する前に、ビルド済みファイルをダウンロードする必要があります。

    `https://doris-regression-hk.oss-cn-hongkong.aliyuncs.com/regression/datalake/pipeline_data/tpch1.db.tar.gz` を `scripts/` ディレクトリにダウンロードし、展開します。

#### 1.4 Elasticsearch {#14-elasticsearch}

ES6、ES7、ES8 の Docker イメージが `docker/thirdparties/docker-compose/elasticsearch/` にあります。

- `es.yaml.tpl`: Docker Compose ファイルのテンプレートです。ES6、ES7、ES8 の各バージョンを含みます。変更は不要です。
- `es.env`: 設定ファイルです。ES のポート番号を設定する必要があります。
- `scripts/`: イメージの起動後に実行される初期化スクリプトを格納します。

#### 1.5 Oracle {#15-oracle}

Oracle 11 のイメージが `docker/thirdparties/docker-compose/oracle/` にあります。

- `oracle-11.yaml.tpl`: Docker Compose ファイルのテンプレートです。変更は不要です。
- `oracle-11.env`: Oracle が公開するポートを設定します。デフォルトは 1521 です。

#### 1.6 SQLServer {#16-sqlserver}

SQLServer 2022 のイメージが `docker/thirdparties/docker-compose/sqlserver/` にあります。

- `sqlserver.yaml.tpl`: Docker Compose ファイルのテンプレートです。変更は不要です。
- `sqlserver.env`: SQLServer が公開するポートを設定します。デフォルトは 1433 です。

#### 1.7 ClickHouse {#17-clickhouse}

ClickHouse 22 のイメージが `docker/thirdparties/docker-compose/clickhouse/` にあります。

- `clickhouse.yaml.tpl`: Docker Compose ファイルのテンプレートです。変更は不要です。
- `clickhouse.env`: ClickHouse が公開するポートを設定します。デフォルトは 8123 です。

#### 1.8 Iceberg {#18-iceberg}

Iceberg + Spark + Minio のイメージの組み合わせが `docker/thirdparties/docker-compose/iceberg/` にあります。

- `iceberg.yaml.tpl`: Docker Compose ファイルのテンプレートです。変更は不要です。
- `entrypoint.sh.tpl`: イメージの起動後に実行される初期化スクリプトのテンプレートです。変更は不要です。
- `spark-defaults.conf.tpl`: Spark 設定ファイルのテンプレートです。変更は不要です。
- `iceberg.env`: 公開ポートの設定ファイルです。必要に応じてポートを変更し、競合を避けます。

起動後、次のコマンドで spark-sql を開始できます。

```bash
docker exec -it doris-xx-spark-iceberg spark-sql
```

ここで、`doris-xx-spark-iceberg` はコンテナー名です。

Iceberg に対する spark-sql 操作の例:

```sql
create database db1;
show databases;
create table db1.test1(k1 bigint, k2 bigint, k3 string) partitioned by (k1);
insert into db1.test1 values(1,2,'abc');
select * from db1.test1;
quit;
```

spark-shell からアクセスすることもできます。

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

詳しい使い方については、[Tabular の公式ドキュメント](https://tabular.io/blog/docker-spark-and-iceberg/)を参照してください。

#### 1.9 Hudi {#19-hudi}

Hudi 関連の Docker Compose ファイルは `docker/thirdparties/docker-compose/hudi` にあります。

- `hudi.yaml.tpl`: Docker Compose ファイルのテンプレートです。変更は不要です。
- `hadoop.env`: 設定ファイルのテンプレートです。変更は不要です。
- `scripts/` ディレクトリはコンテナーの起動後にマウントされます。ファイルの内容を変更する必要はありません。ただし、コンテナーを起動する前に、ビルド済みファイルをダウンロードする必要があります。

    `https://doris-build-hk-1308700295.cos.ap-hongkong.myqcloud.com/regression/load/hudi/hudi_docker_compose_attached_file.zip` を `scripts/` ディレクトリにダウンロードし、展開します。

起動前に、次の設定を `/etc/hosts` に追加すると、`UnknownHostException` エラーを回避できます。

```text
127.0.0.1 adhoc-1
127.0.0.1 adhoc-2
127.0.0.1 namenode
127.0.0.1 datanode1
127.0.0.1 hiveserver
127.0.0.1 hivemetastore
127.0.0.1 sparkmaster
```

起動後、次のコマンドで Hive クエリを実行できます。

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

spark-shell からアクセスすることもできます。

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

詳しい使い方については、[Hudi の公式ドキュメント](https://hudi.apache.org/docs/docker_demo)を参照してください。

#### 1.10 Trino {#110-trino}

Trino 関連の Docker Compose ファイルは `docker/thirdparties/docker-compose/trino` にあります。テンプレートファイルは次のとおりです。

- `gen_env.sh.tpl`: HDFS 関連のポート番号を生成します。変更は不要です。ポートが競合する場合は、ポート番号を変更できます。
- `hive.properties.tpl`: Trino カタログの情報を設定します。変更は不要です。
- `trino_hive.env.tpl`: Hive の環境設定です。変更は不要です。
- `trino_hive.yaml.tpl`: Docker Compose ファイルです。変更は不要です。

Trino の Docker コンテナーを起動すると、Trino + Hive カタログ環境が構成されます。この時点で Trino には次の二つのカタログがあります。

1. `hive`
2. `tpch`（Trino の Docker コンテナーに同梱）

詳しい使い方については、[Trino の公式ドキュメント](https://trino.io/docs/current/installation/containers.html)を参照してください。

### 2. 回帰テストの実行 {#2-run-regression-tests}

外部テーブル関連の回帰テストは、デフォルトでは無効です。`regression-test/conf/regression-conf.groovy` の設定を編集して有効にできます。設定項目の例:

| 設定項目 | 説明 |
|--------|------|
| `enableJdbcTest` | JDBC 外部テーブルのテストを有効にします。MySQL と PostgreSQL のコンテナーを起動する必要があります。 |
| `mysql_57_port` | MySQL が公開するポートです。デフォルトは 3316 です。 |
| `pg_14_port` | PostgreSQL が公開するポートです。デフォルトは 5442 です。 |
| `enableHiveTest` | Hive 外部テーブルのテストを有効にします。Hive コンテナーを起動する必要があります。 |
| `hive2HmsPort` | Hive2 メタストアが公開するポートです。デフォルトは 9083 です。 |
| `hive2HdfsPort` | Hive2 HDFS namenode が公開するポートです。デフォルトは 8020 です。 |
| `enableEsTest` | ES 外部テーブルのテストを有効にします。ES コンテナーを起動する必要があります。 |
| `es_6_port` | ES6 のポート |
| `es_7_port` | ES7 のポート |
| `es_8_port` | ES8 のポート |

---

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->

**Q: Hudi コンテナーの起動時に `UnknownHostException` が報告されます。**

A: 起動前に、`adhoc-1` / `adhoc-2` / `namenode` / `datanode1` / `hiveserver` / `hivemetastore` / `sparkmaster` と `127.0.0.1` の対応が `/etc/hosts` に設定されていません。[1.9 Hudi](#19-hudi)を参照して追加してください。

**Q: 複数のコンテナー環境間でネットワーク名またはコンテナー名が衝突します。**

A: `CONTAINER_UID` を `docker/thirdparties/custom_settings.env` で一意のプレフィックス（`doris-10002-18sda1-` など）に変更してください。すべてのコンテナー名とネットワーク名が、このプレフィックスに基づいて再生成されます。

**Q: 外部テーブルのテスト実行時に接続失敗のエラーが報告されます。**

A: 対応する `enableXxxTest` が `regression-conf.groovy` で `true` になっていること、設定したポートが起動後に Docker Compose が実際に公開しているポートと一致すること、コンテナーの状態が正常であること（`docker ps -a`）を確認してください。

**Q: `qt` Action の `.out` ファイルがまだない場合、実際のクエリ結果を確認するにはどうすればよいですか？**

A: `-genOut`（既存ファイルは上書きしない）または `-forceGenOut`（強制的に上書きする）パラメーターを指定して実行します。例: `./run-regression-test.sh --run qt_action -genOut`

**Q: テストケースで SQL が失敗しても、テストスイート全体を中断させないようにするにはどうすればよいですか？**

A: `try_sql(...)` を `sql(...)` の代わりに使用します。失敗時は例外をスローせずに `null` を返します。
