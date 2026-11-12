---
title: Фреймворк регрессионного тестирования
language: ru
description: Введение во фреймворк регрессионного тестирования Apache Doris и руководство по написанию тестовых сценариев, охватывающее Suite, Action, тесты e2e внешних источников данных и интеграцию с CI.
keywords:
    - регрессионное тестирование Apache Doris
    - регрессионный тест
    - Suite Action
    - тестовый сценарий на Groovy
    - фреймворк тестирования Doris
    - run-regression-test.sh
    - внешние источники данных Docker Compose
    - интеграция с TeamCity
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

# Фреймворк регрессионного тестирования {#regression-testing-framework}

Этот документ предназначен для разработчиков, которым нужно писать или запускать регрессионные тесты Apache Doris. В нём описаны основные понятия, структура каталогов и конфигурация фреймворка тестирования, а также встроенные действия Action и использование тестов e2e внешних источников данных.

## Содержание {#contents}

- [Быстрый старт](#quick-start): запуск первого тестового сценария за 5 шагов
- [Основные понятия](#core-concepts): три абстракции Suite / Group / Action
- [Структура каталогов фреймворка](#framework-directory-structure): организация исходного кода и файлов данных
- [Файл конфигурации по умолчанию](#default-configuration-file): основные поля в `regression-conf.groovy`
- [Написание тестовых сценариев](#writing-test-cases): примеры действий sql / qt / test / explain / streamLoad и других
- [Использование скрипта запуска](#launch-script-usage): распространённые команды для `run-regression-test.sh`
- [Автоматическое создание файлов `.out`](#auto-generating-out-files): создание файлов для проверки результатов с помощью `-genOut` / `-forceGenOut`
- [Механизм плагинов Suite](#suite-plugin-mechanism): расширение Suite с помощью скриптов на Groovy
- [Интеграция с CI/CD](#cicd-integration): служебные сообщения TeamCity Service Message
- [Тесты e2e внешних источников данных](#external-data-source-e2e-tests): MySQL / PostgreSQL / Hive / Iceberg / Hudi / Trino и другие

---

## Быстрый старт {#quick-start}

<!-- Knowledge type: Procedure -->

1. Заранее установите кластер Doris (FE + BE).
2. Отредактируйте `${DORIS_HOME}/regression-test/conf/regression-conf.groovy` и укажите параметры подключения, такие как URL JDBC и имя пользователя.
3. Создайте файл тестового сценария на Groovy в каталоге `regression-test/suites/<group>/`.
4. Если сценарий содержит действие `qt`, создайте соответствующий TSV-файл `.out` в каталоге `regression-test/data/<group>/` для проверки результатов.
5. Запустите тесты:

    ```bash
    # Run all cases
    ${DORIS_HOME}/run-regression-test.sh

    # Run a specific case
    ${DORIS_HOME}/run-regression-test.sh --run <suiteName>
    ```

Дополнительные параметры запуска приведены в разделе [Использование скрипта запуска](#launch-script-usage).

---

## Основные понятия {#core-concepts}

| Понятие | Значение |
|------|------|
| `Suite` | Тестовый сценарий. В настоящее время в качестве имени Suite используется имя файла. |
| `Group` | Группа тестов, соответствующая каталогу, к которому относится тестовый сценарий. |
| `Action` | Конкретное действие при тестировании, предоставляемое фреймворком, например `sql` для выполнения SQL, `test` для проверки результатов и `streamLoad` для загрузки данных. |

---

## Структура каталогов фреймворка {#framework-directory-structure}

Основные файлы и каталоги, которые нужно знать при разработке:

| Путь | Назначение |
|------|------|
| `run-regression-test.sh` | Скрипт запуска регрессионных тестов |
| `regression-conf.groovy` | Файл конфигурации по умолчанию |
| `data/` | Входные данные и файлы `.out` для проверки результатов |
| `suites/` | Тестовые сценарии |

Полное дерево каталогов:

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

## Файл конфигурации по умолчанию {#default-configuration-file}

<!-- Knowledge type: Configuration parameters -->

Перед запуском тестов приведите настройки JDBC и FE в соответствие с фактическим окружением. Основные поля `regression-conf.groovy`:

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

## Написание тестовых сценариев {#writing-test-cases}

<!-- Knowledge type: Procedure -->

1. Перейдите в каталог `${DORIS_HOME}/regression-test`.
2. Выберите каталог для сценария в зависимости от цели тестирования: тесты корректности размещайте в `suites/correctness`, а тесты производительности в `suites/performance`.
3. Создайте новый файл сценария на Groovy и объедините несколько действий Action для реализации логики теста.

Действия Action предоставляют операции тестирования, определяемые с помощью DSL. Ниже описаны распространённые действия.

### Действие sql {#sql-action}

Действие `sql` отправляет SQL и получает результат. При ошибке выполнения запроса оно выбрасывает исключение.

Параметры:

| Параметр | Описание |
|------|------|
| `String sql` | Входная строка SQL |
| Возвращает `List<List<Object>>` | Результат запроса. Для DDL/DML возвращает одну строку и один столбец с единственным значением updateRowCount. |

Следующий пример кода находится в файле `${DORIS_HOME}/regression-test/suites/demo/sql_action.groovy`:

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

### Действие qt {#qt-action}

Действие `qt` отправляет SQL и сверяет результат с соответствующим TSV-файлом `.out`.

| Параметр | Описание |
|------|------|
| `String sql` | Входная строка SQL |
| Возвращаемое значение | void |

Следующий пример кода находится в файле `${DORIS_HOME}/regression-test/suites/demo/qt_action.groovy`:

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

### Действие test {#test-action}

Действие `test` поддерживает более сложные правила проверки, например проверку количества строк, времени выполнения и наличия исключения.

Доступные параметры:

| Параметр | Описание |
|------|------|
| `String sql` | Входная строка SQL |
| `List<List<Object>> result` | Сравнивает фактический результат запроса с объектом List на равенство |
| `Iterator<Object> resultIterator` | Сравнивает фактический результат запроса с Iterator на равенство |
| `String resultFile` | URI файла (локальный относительный путь или путь http(s)), используемого для сравнения с результатом запроса. Формат аналогичен `.out`, но без заголовков блоков и комментариев. |
| `String exception` | Проверяет, что выброшенное исключение содержит указанные строки |
| `long rowNum` | Проверяет количество строк результата |
| `long time` | Проверяет, что время выполнения меньше указанного значения в миллисекундах |
| `Closure<List<List<Object>>, Throwable, Long, Long> check` | Пользовательская функция обратного вызова для проверки, получающая результат, исключение и время. Если она задана, остальные методы проверки отключаются. |

Следующий пример кода находится в файле `${DORIS_HOME}/regression-test/suites/demo/test_action.groovy`:

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

### Действие explain {#explain-action}

Действие `explain` проверяет, содержит ли строка, возвращаемая `EXPLAIN`, указанные строки.

Доступные параметры:

| Параметр | Описание |
|------|------|
| `String sql` | SQL-запрос. Удалите `EXPLAIN` из SQL. |
| `String contains` | Проверяет, что вывод explain содержит указанные строки. Вызывайте несколько раз, чтобы проверить сразу несколько строк. |
| `String notContains` | Проверяет, что вывод explain не содержит указанных строк. Можно вызывать несколько раз. |
| `Closure<String> check` | Пользовательская функция обратного вызова для проверки, получающая возвращённую строку. Если функция проверки задана, остальные методы проверки отключаются. |
| `Closure<String, Throwable, Long, Long> check` | Пользовательская функция обратного вызова для проверки, дополнительно получающая исключение и время. |

Следующий пример кода находится в файле `${DORIS_HOME}/regression-test/suites/demo/explain_action.groovy`:

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

### Действие streamLoad {#streamload-action}

Действие `streamLoad` загружает данные.

Доступные параметры:

| Параметр | Описание |
|------|------|
| `String db` | Имя базы данных. По умолчанию используется `defaultDb` из `regression-conf.groovy`. |
| `String table` | Имя таблицы |
| `String file` | Путь к файлу для загрузки. Может быть относительным путём в каталоге `data/` или URL с протоколом http. |
| `Iterator<List<Object>> inputIterator` | Итератор для загрузки |
| `String inputText` | Текст для загрузки. Используется редко. |
| `InputStream inputStream` | Поток байтов для загрузки. Используется редко. |
| `long time` | Проверяет, что время выполнения меньше указанного значения в миллисекундах |
| `void set(String key, String value)` | Задаёт заголовок HTTP-запроса Stream Load, например `label` или `columnSeparator` |
| `Closure<String, Throwable, Long, Long> check` | Пользовательская функция обратного вызова для проверки. Если она задана, остальные проверки отключаются. |

Следующий пример кода находится в файле `${DORIS_HOME}/regression-test/suites/demo/streamLoad_action.groovy`:

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

### Другие действия {#other-actions}

Примеры действий `thread`, `lazyCheck`, `events`, `connect` и `selectUnionAll` находятся в следующем каталоге:

```text
${DORIS_HOME}/regression-test/suites/demo
```

---

## Использование скрипта запуска {#launch-script-usage}

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

## Автоматическое создание файлов `.out` {#auto-generating-out-files}

```bash
# Automatically generate the .out file for the sql_action case from the query result. Skip if the .out file already exists.
./run-regression-test.sh --run sql_action -genOut

# Automatically generate the .out file for the sql_action case from the query result. Overwrite if the .out file already exists.
./run-regression-test.sh --run sql_action -forceGenOut
```

---

## Механизм плагинов Suite {#suite-plugin-mechanism}

Если нужно расширить класс Suite без изменения исходного кода, это можно сделать с помощью плагинов. По умолчанию плагины размещаются в каталоге `${DORIS_HOME}/regression-test/plugins`, где можно определять методы расширения с помощью скриптов на Groovy.

Следующий файл `plugin_example.groovy` добавляет в класс Suite функцию `testPlugin` для записи в журнал:

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

После регистрации эту функцию можно вызывать из обычных тестовых сценариев. Например, в `${DORIS_HOME}/regression-test/suites/demo/test_plugin.groovy`:

```groovy
suite("test_plugin", "demo") {
    // register testPlugin function in ${DORIS_HOME}/regression-test/plugins/plugin_example.groovy
    def result = testPlugin("message from suite")
    assertEquals("OK", result)
}
```

---

## Интеграция с CI/CD {#cicd-integration}

### TeamCity {#teamcity}

TeamCity распознаёт служебные сообщения Service Messages в stdout. При запуске фреймворка регрессионного тестирования с параметром `--teamcity` фреймворк выводит сообщения TeamCity Service Messages в stdout. TeamCity автоматически считывает этот журнал событий и отображает `Tests` в текущем конвейере, включая тестовые сценарии и их журналы.

Ниже приведён пример команды запуска. Настройка `-Dteamcity.enableStdErr=false` направляет журналы ошибок также в stdout, что упрощает их анализ в хронологическом порядке:

```bash
JAVA_OPTS="-Dteamcity.enableStdErr=${enableStdErr}" ./run-regression-test.sh --teamcity --run
```

---

## Тесты e2e внешних источников данных {#external-data-source-e2e-tests}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: External data source development / Catalog debugging -->

Doris поддерживает запросы к различным внешним источникам данных. Фреймворк регрессионного тестирования позволяет разворачивать внешние источники данных с помощью Docker Compose для тестирования e2e интеграции Doris с этими источниками.

### 0. Подготовка {#0-preparation}

Перед запуском Docker измените переменную `CONTAINER_UID` в `docker/thirdparties/custom_settings.env`, например задайте ей значение `doris-10002-18sda1-`. Скрипты запуска используют этот префикс при замене имён в docker compose, чтобы имена и сети нескольких контейнерных окружений не конфликтовали.

Перед запуском контейнеров проверьте сетевые настройки сервера или облачного хоста и убедитесь, что `/etc/hosts` содержит сопоставление имени хоста (`hostname`) с его IP-адресом (`hostname -i`), например:

```text
10.0.0.46    iZj6cbwlx5pl6y0681t6scZ    iZj6cbwlx5pl6y0681t6scZ
```

Здесь последовательно указаны IP-адрес (вывод `hostname -i`, обычно IP-адрес eth0), имя хоста (вывод `hostname`) и псевдоним (совпадает с именем хоста).

> **Примечание**: `run-thirdparties-docker.sh` определяет основной сетевой интерфейс, перебирая имена, соответствующие шаблону `eth[0-9]`. Современные дистрибутивы Linux с systemd/udev назначают предсказуемые имена, такие как `enp3s0`, `ens33` или `eno1`, которые скрипт не распознаёт. Если на вашем хосте используется такое имя, скрипт не сможет обнаружить интерфейс. Перед запуском вручную задайте переменной `eth_name` внутри `run-thirdparties-docker.sh` фактическое имя интерфейса.

### 1. Запуск контейнера {#1-start-the-container}

В настоящее время Doris поддерживает Docker compose для таких источников данных, как es, mysql, pg, hive, sqlserver, oracle, iceberg, hudi и trino. Соответствующие файлы находятся в каталоге `docker/thirdparties/docker-compose`.

По умолчанию контейнеры Docker всех внешних источников данных можно запустить следующей командой (для hive и hudi требуется скачать заранее подготовленные файлы данных; см. соответствующие разделы ниже):

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh
```

Для выполнения этой команды требуются права root или sudo. Успешное завершение означает, что все контейнеры запущены; проверить их можно командой `docker ps -a`. Во время запуска контейнеров журналы можно просматривать с помощью `docker logs -f <container-name>`.

Остановить все контейнеры:

```bash
cd docker/thirdparties && sh run-thirdparties-docker.sh --stop
```

Запустить или остановить отдельные компоненты:

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

Файлы Docker compose для MySQL находятся в каталоге `docker/thirdparties/docker-compose/mysql`:

- `mysql-5.7.yaml.tpl`: шаблон файла Docker compose. Изменения не требуются. Имя пользователя и пароль по умолчанию: `root` / `123456`.
- `mysql-5.7.env`: файл конфигурации. Задаёт публикуемый порт контейнера MySQL, по умолчанию 3316.
- `init/`: SQL-файлы в этом каталоге выполняются автоматически после создания контейнера. По умолчанию они создают базы данных и таблицы и вставляют небольшой объём данных.
- `data/`: локальный каталог данных, монтируемый после запуска контейнера. Скрипт `run-thirdparties-docker.sh` очищает и создаёт его заново при каждом запуске.

#### 1.2 PostgreSQL {#12-postgresql}

Файлы Docker compose для PostgreSQL находятся в каталоге `docker/thirdparties/docker-compose/postgresql`:

- `postgresql-14.yaml.tpl`: шаблон файла Docker compose. Изменения не требуются. Имя пользователя и пароль по умолчанию: `postgres` / `123456`.
- `postgresql-14.env`: файл конфигурации. Задаёт публикуемый порт контейнера PostgreSQL, по умолчанию 5442.
- `init/`: SQL-файлы в этом каталоге выполняются автоматически после создания контейнера. По умолчанию они создают базы данных и таблицы и вставляют небольшой объём данных.
- `data/`: локальный каталог данных, монтируемый после запуска контейнера. Скрипт `run-thirdparties-docker.sh` очищает и создаёт его заново при каждом запуске.

#### 1.3 Hive {#13-hive}

Файлы Docker compose для Hive находятся в каталоге `docker/thirdparties/docker-compose/hive` и поддерживают как Hive2, так и Hive3:

- `hive-2x.yaml.tpl`, `hive-3x.yaml.tpl`: шаблоны файлов Docker compose. Изменения не требуются.
- `hadoop-hive.env.tpl`, `hadoop-hive-2x.env.tpl`, `hadoop-hive-3x.env.tpl`: шаблоны файлов конфигурации. Изменения не требуются.
- `hive-2x_settings.env`: скрипт настройки инициализации Hive2. Скрипт `run-thirdparties-docker.sh` автоматически вызывает его при запуске. Можно изменить четыре публикуемых порта `FS_PORT`, `HMS_PORT`, `HS_PORT` и `PG_PORT`, соответствующие `hive2HdfsPort`, `hive2HmsPort`, `hive2ServerPort` и `hive2PgPort` в `regression-conf.groovy`. Первые два являются портами hadoop defaultFs и Hive metastore; их значения по умолчанию: 8020 и 9083.
- `hive-3x_settings.env`: скрипт настройки инициализации Hive3. Можно изменить `FS_PORT`, `HMS_PORT`, `HS_PORT` и `PG_PORT`, соответствующие `hive3HdfsPort`, `hive3HmsPort`, `hive3ServerPort` и `hive3PgPort`. Значения первых двух по умолчанию: 8320 и 9383.
- Каталог `scripts/` монтируется в контейнер после его запуска. Содержимое файлов изменять не нужно. Однако перед запуском контейнера необходимо скачать заранее подготовленные файлы:

    Скачайте `https://doris-regression-hk.oss-cn-hongkong.aliyuncs.com/regression/datalake/pipeline_data/tpch1.db.tar.gz` в каталог `scripts/` и распакуйте архив.

#### 1.4 Elasticsearch {#14-elasticsearch}

Включает образы Docker для ES6, ES7 и ES8, расположенные в каталоге `docker/thirdparties/docker-compose/elasticsearch/`:

- `es.yaml.tpl`: шаблон файла Docker compose. Включает версии ES6, ES7 и ES8. Изменения не требуются.
- `es.env`: файл конфигурации. Необходимо настроить номера портов ES.
- `scripts/`: содержит скрипты инициализации, выполняемые после запуска образа.

#### 1.5 Oracle {#15-oracle}

Предоставляет образ Oracle 11, расположенный в каталоге `docker/thirdparties/docker-compose/oracle/`:

- `oracle-11.yaml.tpl`: шаблон файла Docker compose. Изменения не требуются.
- `oracle-11.env`: задаёт публикуемый порт Oracle, по умолчанию 1521.

#### 1.6 SQLServer {#16-sqlserver}

Предоставляет образ SQLServer 2022, расположенный в каталоге `docker/thirdparties/docker-compose/sqlserver/`:

- `sqlserver.yaml.tpl`: шаблон файла Docker compose. Изменения не требуются.
- `sqlserver.env`: задаёт публикуемый порт SQLServer, по умолчанию 1433.

#### 1.7 ClickHouse {#17-clickhouse}

Предоставляет образ ClickHouse 22, расположенный в каталоге `docker/thirdparties/docker-compose/clickhouse/`:

- `clickhouse.yaml.tpl`: шаблон файла Docker compose. Изменения не требуются.
- `clickhouse.env`: задаёт публикуемый порт ClickHouse, по умолчанию 8123.

#### 1.8 Iceberg {#18-iceberg}

Предоставляет набор образов Iceberg + Spark + Minio, расположенный в каталоге `docker/thirdparties/docker-compose/iceberg/`:

- `iceberg.yaml.tpl`: шаблон файла Docker compose. Изменения не требуются.
- `entrypoint.sh.tpl`: шаблон скрипта инициализации, выполняемого после запуска образа. Изменения не требуются.
- `spark-defaults.conf.tpl`: шаблон файла конфигурации Spark. Изменения не требуются.
- `iceberg.env`: файл конфигурации публикуемых портов. При необходимости измените порты, чтобы избежать конфликтов.

После запуска можно запустить spark-sql следующей командой:

```bash
docker exec -it doris-xx-spark-iceberg spark-sql
```

Здесь `doris-xx-spark-iceberg` является именем контейнера.

Примеры операций с Iceberg через spark-sql:

```sql
create database db1;
show databases;
create table db1.test1(k1 bigint, k2 bigint, k3 string) partitioned by (k1);
insert into db1.test1 values(1,2,'abc');
select * from db1.test1;
quit;
```

Также можно использовать spark-shell:

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

Подробнее об использовании см. в [официальной документации Tabular](https://tabular.io/blog/docker-spark-and-iceberg/).

#### 1.9 Hudi {#19-hudi}

Файлы Docker compose для Hudi находятся в каталоге `docker/thirdparties/docker-compose/hudi`:

- `hudi.yaml.tpl`: шаблон файла Docker compose. Изменения не требуются.
- `hadoop.env`: шаблон файла конфигурации. Изменения не требуются.
- Каталог `scripts/` монтируется в контейнер после его запуска. Содержимое файлов изменять не нужно. Однако перед запуском контейнера необходимо скачать заранее подготовленные файлы:

    Скачайте `https://doris-build-hk-1308700295.cos.ap-hongkong.myqcloud.com/regression/load/hudi/hudi_docker_compose_attached_file.zip` в каталог `scripts/` и распакуйте архив.

Перед запуском можно добавить следующие записи в `/etc/hosts`, чтобы избежать ошибок `UnknownHostException`:

```text
127.0.0.1 adhoc-1
127.0.0.1 adhoc-2
127.0.0.1 namenode
127.0.0.1 datanode1
127.0.0.1 hiveserver
127.0.0.1 hivemetastore
127.0.0.1 sparkmaster
```

После запуска можно выполнить запросы hive следующей командой:

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

Также можно использовать spark-shell:

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

Подробнее об использовании см. в [официальной документации Hudi](https://hudi.apache.org/docs/docker_demo).

#### 1.10 Trino {#110-trino}

Файлы Docker compose для Trino находятся в каталоге `docker/thirdparties/docker-compose/trino`. Файлы шаблонов:

- `gen_env.sh.tpl`: генерирует номера портов для HDFS. Изменения не требуются. При возникновении конфликтов портов их номера можно изменить.
- `hive.properties.tpl`: задаёт параметры Catalog для trino. Изменения не требуются.
- `trino_hive.env.tpl`: конфигурация окружения для Hive. Изменения не требуются.
- `trino_hive.yaml.tpl`: файл Docker compose. Изменения не требуются.

После запуска контейнера Docker с Trino настраивается окружение Trino + hive Catalog. На этом этапе в Trino есть два Catalog:

1. `hive`
2. `tpch` (входит в состав контейнера Docker с trino)

Подробнее об использовании см. в [официальной документации Trino](https://trino.io/docs/current/installation/containers.html).

### 2. Запуск регрессионных тестов {#2-run-regression-tests}

Регрессионные тесты внешних таблиц по умолчанию отключены. Их можно включить, изменив настройки в `regression-test/conf/regression-conf.groovy`. Примеры параметров конфигурации:

| Параметр конфигурации | Описание |
|--------|------|
| `enableJdbcTest` | Включает тест внешней таблицы JDBC. Требует запуска контейнеров MySQL и PostgreSQL. |
| `mysql_57_port` | Публикуемый порт MySQL, по умолчанию 3316. |
| `pg_14_port` | Публикуемый порт PostgreSQL, по умолчанию 5442. |
| `enableHiveTest` | Включает тест внешней таблицы Hive. Требует запуска контейнера Hive. |
| `hive2HmsPort` | Публикуемый порт Hive2 metastore, по умолчанию 9083. |
| `hive2HdfsPort` | Публикуемый порт namenode HDFS в Hive2, по умолчанию 8020. |
| `enableEsTest` | Включает тест внешней таблицы ES. Требует запуска контейнера ES. |
| `es_6_port` | Порт ES6 |
| `es_7_port` | Порт ES7 |
| `es_8_port` | Порт ES8 |

---

## Часто задаваемые вопросы {#faq}

<!-- Knowledge type: Troubleshooting -->

**Вопрос: при запуске контейнера hudi возникает ошибка `UnknownHostException`.**

Ответ: перед запуском сопоставления `adhoc-1` / `adhoc-2` / `namenode` / `datanode1` / `hiveserver` / `hivemetastore` / `sparkmaster` с `127.0.0.1` не были настроены в `/etc/hosts`. Добавьте их, как описано в разделе [1.9 Hudi](#19-hudi).

**Вопрос: между несколькими контейнерными окружениями возникают конфликты сетей или имён контейнеров.**

Ответ: задайте для `CONTAINER_UID` в `docker/thirdparties/custom_settings.env` уникальный префикс (например, `doris-10002-18sda1-`). Все имена контейнеров и сети будут созданы заново на основе этого префикса.

**Вопрос: при выполнении тестов внешних таблиц возникают ошибки подключения.**

Ответ: убедитесь, что соответствующий параметр `enableXxxTest` в `regression-conf.groovy` имеет значение `true`, настроенные порты совпадают с фактическими портами, опубликованными docker compose после запуска, а контейнеры работают нормально (`docker ps -a`).

**Вопрос: как увидеть фактический результат запроса действия `qt`, если файл `.out` ещё не существует?**

Ответ: запустите с параметром `-genOut` (не перезаписывает существующие файлы) или `-forceGenOut` (принудительная перезапись), например `./run-regression-test.sh --run qt_action -genOut`.

**Вопрос: как сделать так, чтобы ошибка SQL в сценарии не прерывала весь набор тестов?**

Ответ: используйте `try_sql(...)` вместо `sql(...)`. При ошибке он возвращает `null`, а не выбрасывает исключение.
