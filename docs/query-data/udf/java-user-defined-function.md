---
{
    "title": "Java UDF, UDAF, UDWF, UDTF",
    "language": "en",
    "description": "How to write UDF, UDAF, UDWF, and UDTF custom functions in Apache Doris using Java, including type mapping, registration syntax, best practices, and examples.",
    "keywords": [
        "Doris Java UDF",
        "Java UDAF",
        "Java UDWF",
        "Java UDTF",
        "custom function",
        "User Defined Function",
        "Hive UDF migration",
        "CREATE FUNCTION",
        "Lateral View",
        "static_load",
        "expiration_time"
    ]
}
---

<!-- Knowledge type: Capability definition / Operational steps -->
<!-- Applicable scenario: Extend Doris SQL capabilities with Java, migrate Hive UDFs -->

## Overview

Java UDF provides users with an interface to write custom functions in Java, making it convenient to implement business logic in Java that cannot be expressed directly in SQL. Apache Doris supports four types of custom functions written in Java: UDF, UDAF, UDWF, and UDTF. Unless otherwise specified, the term UDF is used below to refer to all user-defined functions.

The definitions and typical examples of the four types of custom functions are as follows:

| Type | Full Name | Behavior | Typical Function Examples | First Supported Version |
| --- | --- | --- | --- | --- |
| UDF | Scalar Function | Outputs one row of result for each input row | ABS, LENGTH | All versions |
| UDAF | Aggregate Function | Aggregates multiple input rows and outputs one row of result | MIN, MAX, COUNT | All versions |
| UDWF | Window Function | Returns a value for each row within a window range (one or more rows) | ROW_NUMBER, RANK, DENSE_RANK | All versions |
| UDTF | Table Function | Outputs one or more rows for each input row; must be used with Lateral View, can implement row-to-column conversion | EXPLODE, EXPLODE_SPLIT | Doris 3.0 and later |

For users who have already accumulated a large number of custom functions on Hive, Java UDFs can be migrated directly to Doris without rewriting.

## Applicable Scenarios

- Business requires scalar computation, aggregation, or row-expansion logic in SQL that the built-in Doris functions cannot cover.
- Existing Hive Java UDF assets need to be migrated smoothly to Doris.
- Custom functions need to load large resource files (such as dictionaries or models), or want to reuse singleton resources such as a global connection pool.

## Data Type Mapping

The following table lists the correspondence between Doris data types and Java UDF input/return types:

| Doris Data Type | Java UDF Parameter Type |
| --- | --- |
| Bool | Boolean |
| TinyInt | Byte |
| SmallInt | Short |
| Int | Integer |
| BigInt | Long |
| LargeInt | BigInteger |
| Float | Float |
| Double | Double |
| Date | LocalDate |
| Datetime | LocalDateTime |
| IPV4 / IPV6 | InetAddress |
| String | String |
| Decimal | BigDecimal |
| `array<Type>` | `ArrayList<Type>`, `List<Type>` (nesting supported) |
| `map<Type1,Type2>` | `HashMap<Type1,Type2>`, `Map<Type1,Type2>` (nesting supported) |
| `struct<Type...>` | `ArrayList<Object>` (supported since 3.0.0), `List<Type>` |
| VarBinary | `byte[]`, `Byte[]` (the VarBinary type is supported since 4.0; `byte[]` is recommended as it avoids one extra layer of conversion) |

:::tip Tip
The `array`, `map`, and `struct` types can nest other types. For example, the Java UDF parameter type corresponding to `array<array<int>>` in Doris is `ArrayList<ArrayList<Integer>>`, and other types follow the same pattern. Support for the `List<Type>` and `Map<Type1,Type2>` forms starts from version 3.1.0.
:::

:::caution Note
When creating a function, always use the `string` type instead of `varchar`, otherwise the function may fail to execute.
:::

## Usage Limitations

<!-- Knowledge type: Limitation -->

1. The complex data types HLL and Bitmap are not supported.
2. Users can specify the JVM maximum heap size by themselves through the `-Xmx` part of `JAVA_OPTS` in `be.conf`; the default is 1024 MB. If the volume of aggregated data is large, increase this value appropriately to improve performance and reduce the risk of out-of-memory errors.
3. Due to the JVM restriction on loading classes with the same name, do not use multiple classes with the same name as UDF implementations at the same time. To update a UDF that uses the same class name, restart the BE so that the classpath is reloaded.
4. Rules for handling functions with the same name:

    - Users can create custom functions whose signatures are identical to those of built-in functions. By default, the system matches built-in functions first.
    - If `database` is explicitly specified at call time (for example, `db.function()`), the call is forced to be identified as a user-defined function.
    - The session variable `prefer_udf_over_builtin` was added in version 3.0.7. When it is set to `true`, user-defined functions are matched first, which helps users preserve the original function behavior of other systems when migrating to Doris without changing function names.

## Quick Start

This section describes how to develop and register Java UDFs. Sample code is provided in the `samples/doris-demo/java-udf-demo/` directory for reference, and you can also view the [demo](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo) on GitHub.

UDFs are used in the same way as ordinary functions, with one difference:

- The scope of built-in functions is global.
- The scope of UDFs is within a database (DB).

Therefore, if the current session is inside a database, using the UDF name directly looks up the corresponding UDF in the current DB; otherwise, the database name where the UDF resides must be specified explicitly, for example `dbName.funcName`.

For convenience, the following examples are all tested on `test_table`. The CREATE TABLE statement is as follows:

```sql
CREATE TABLE `test_table` (
    id int NULL,
    d1 double NULL,
    str string NULL
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
"replication_num" = "1");

insert into test_table values (1, 111.11, "a,b,c");
insert into test_table values (6, 666.66, "d,e");
```

### Java UDF Example

When writing a UDF in Java, the main entry point must be the `evaluate` function, which is consistent with other engines such as Hive. The following example writes an `AddOne` UDF that adds one to an integer input.

1. Write the Java code and package it into a JAR file:

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```

2. Register the Java UDF in Doris. For more syntax, see [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION).

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
        "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
        "symbol"="org.apache.doris.udf.AddOne",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. Call the UDF. Calling a UDF requires the `SELECT` privilege on the corresponding database. To view registered UDFs, use the [SHOW FUNCTIONS](../../sql-manual/sql-statements/function/SHOW-FUNCTIONS) command.

    ```sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```

4. When a UDF is no longer needed, use the [DROP FUNCTION](../../sql-manual/sql-statements/function/DROP-FUNCTION) command to delete it.

If the UDF needs to load large resource files, or you want to define global static variables, see the "Best Practices" section below.

### Java UDAF Example

When writing a UDAF in Java, you need to implement a set of required functions (marked as required) and an inner class `State`. The following two examples illustrate this.

1. Write the corresponding Java UDAF code and package it into a JAR file.

<details>
<summary>Example 1: SimpleDemo implements a simple aggregate function similar to sum, with INT as the input parameter and INT as the output parameter</summary>

```java
package org.apache.doris.udf;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.logging.Logger;

public class SimpleDemo  {

Logger log = Logger.getLogger("SimpleDemo");

//Need an inner class to store data
/*required*/
public static class State {
    /*some variables if you need */
    public int sum = 0;
}

/*required*/
public State create() {
    /* here could do some init work if needed */
    return new State();
}

/*required*/
public void destroy(State state) {
    /* here could do some destroy work if needed */
}

/*Not Required*/
public void reset(State state) {
    /*if you want this udaf function can work with window function.*/
    /*Must impl this, it will be reset to init state after calculate every window frame*/
    state.sum = 0;
}

/*required*/
//first argument is State, then other types your input
public void add(State state, Integer val) throws Exception {
    /* here doing update work when input data*/
    if (val != null) {
        state.sum += val;
    }
}

/*required*/
public void serialize(State state, DataOutputStream out) throws IOException {
    /* serialize some data into buffer */
    out.writeInt(state.sum);
}

/*required*/
public void deserialize(State state, DataInputStream in) throws IOException {
    /* deserialize get data from buffer before you put */
    int val = in.readInt();
    state.sum = val;
}

/*required*/
public void merge(State state, State rhs) throws Exception {
    /* merge data from state */
    state.sum += rhs.sum;
}

/*required*/
//return Type you defined
public Integer getValue(State state) throws Exception {
    /* return finally result */
    return state.sum;
}
}
```

</details>

<details>
<summary>Example 2: MedianUDAF implements the calculation of the median, with input type (DOUBLE, INT) and output type DOUBLE</summary>

```java
package org.apache.doris.udf.demo;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.logging.Logger;

/*UDAF that calculates the median*/
public class MedianUDAF {
Logger log = Logger.getLogger("MedianUDAF");

// State storage
public static class State {
    // Precision of the returned result
    int scale = 0;
    // Whether this is the first time the add method is executed for the data under a certain aggregation condition of a tablet
    boolean isFirst = true;
    // Data storage
    public StringBuilder stringBuilder;
}

// State initialization
public State create() {
    State state = new State();
    // Pre-initialize the buffer based on the volume of data to be aggregated under each aggregation condition of each tablet, to improve performance
    state.stringBuilder = new StringBuilder(1000);
    return state;
}


// The execution unit processes each piece of data under each aggregation condition of each tablet
public void add(State state, Double val, int scale) throws IOException {
    if (val != null && state.isFirst) {
        state.stringBuilder.append(scale).append(",").append(val).append(",");
        state.isFirst = false;
    } else if (val != null) {
        state.stringBuilder.append(val).append(",");
    }
}

// Output data after processing, waiting for aggregation
public void serialize(State state, DataOutputStream out) throws IOException {
    // Currently only DataOutputStream is provided. To serialize an object, consider concatenating strings, converting to JSON, or serializing into a byte array.
    // To serialize the State object, you may need to implement the Serializable interface on the State inner class yourself.
    // Ultimately, everything must be transmitted via DataOutputStream.
    out.writeUTF(state.stringBuilder.toString());
}

// Get the data output by the data-processing execution unit
public void deserialize(State state, DataInputStream in) throws IOException {
    String string = in.readUTF();
    state.scale = Integer.parseInt(String.valueOf(string.charAt(0)));
    StringBuilder stringBuilder = new StringBuilder(string.substring(2));
    state.stringBuilder = stringBuilder;
}

// The aggregation execution unit merges the processing results of data under a certain key according to the aggregation condition. The first time each key is merged, the state1 parameter is the initialized instance.
public void merge(State state1, State state2) throws IOException {
    state1.scale = state2.scale;
    state1.stringBuilder.append(state2.stringBuilder.toString());
}

// Process the merged data for each key and output the final result
public Double getValue(State state) throws IOException {
    String[] strings = state.stringBuilder.toString().split(",");
    double[] doubles = new double[strings.length + 1];
    doubles = Arrays.stream(strings).mapToDouble(Double::parseDouble).toArray();

    Arrays.sort(doubles);
    double n = doubles.length - 1;
    double index = n * 0.5;

    int low = (int) Math.floor(index);
    int high = (int) Math.ceil(index);

    double value = low == high ? (doubles[low] + doubles[high]) * 0.5 : doubles[high];

    BigDecimal decimal = new BigDecimal(value);
    return decimal.setScale(state.scale, BigDecimal.ROUND_HALF_UP).doubleValue();
}

// Executed after each execution unit finishes
public void destroy(State state) {
}

}
```

</details>

2. Register the Java UDAF in Doris. For more syntax, see [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION).

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. Call the Java UDAF. You can aggregate by group, or aggregate over all results:

    ```sql
    select simple_demo(id) from test_table group by id;
    +-----------------+
    | simple_demo(id) |
    +-----------------+
    |               1 |
    |               6 |
    +-----------------+
    ```

    ```sql
    select simple_demo(id) from test_table;
    +-----------------+
    | simple_demo(id) |
    +-----------------+
    |               7 |
    +-----------------+
    ```

### Java UDWF Example

The code structure of a Java UDWF is exactly the same as that of a Java UDAF; you only need to additionally implement the `reset` interface to reset all `state` to the initial value:

```java
void reset(State state)
```

1. Write and package the Java UDWF code (same as above).

2. Register the Java UDWF in Doris. The registration is the same as for a Java UDAF. For more syntax, see [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION).

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo_window(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. Call the Java UDWF to compute results within a specified window range. For more syntax, see [Window Functions](../window-function.md):

    ```sql
    select id, simple_demo_window(id) over(partition by id order by d1 rows between 1 preceding and 1 following) as res from test_table;
    +------+------+
    | id   | res  |
    +------+------+
    |    1 |    1 |
    |    6 |    6 |
    +------+------+
    ```

### Java UDTF Example

:::tip
UDTF is supported starting from Doris 3.0.
:::

Like UDF, UDTF requires you to implement the `evaluate` method, but the return value of a UDTF must be of Array type.

1. Write the corresponding Java UDTF code and package it into a JAR file:

    ```java
    public class UDTFStringTest {
        public ArrayList<String> evaluate(String value, String separator) {
            if (value == null || separator == null) {
                return null;
            } else {
                return new ArrayList<>(Arrays.asList(value.split(separator)));
            }
        }
    }
    ```

2. Register the Java UDTF in Doris. Registration creates two UDTFs at the same time: the version with the `_outer` suffix appended to the function name handles the case where the result has zero rows specially. For details, see the [OUTER combinator](../../sql-manual/sql-functions/table-functions/explode-numbers). For more syntax, see [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION).

    ```sql
    CREATE TABLES FUNCTION java_utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udtf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. Call the Java UDTF. Using a UDTF in Doris requires combining it with [Lateral View](../lateral-view.md) to achieve the row-to-column effect:

    ```sql
    select id, str, e1 from test_table lateral view java_utdf(str,',') tmp as e1;
    +------+-------+------+
    | id   | str   | e1   |
    +------+-------+------+
    |    1 | a,b,c | a    |
    |    1 | a,b,c | b    |
    |    1 | a,b,c | c    |
    |    6 | d,e   | d    |
    |    6 | d,e   | e    |
    +------+-------+------+
    ```

## Best Practice: Loading Static Variables

<!-- Knowledge type: Best practice -->
<!-- Applicable scenario: UDFs that load large resource files / reuse singleton resources such as connection pools -->

When a UDF is executed in Doris (for example, `select udf(col) from table`), each concurrent Instance loads the `udf.jar` package once and unloads it when the Instance ends.

This causes two common problems:

- When the `udf.jar` file needs to load several hundred MB of resource files, concurrency causes memory usage to grow rapidly, which easily triggers OOM.
- When you want to use objects such as a connection pool that need to be initialized only once in a `static` block, this is impossible under the current concurrency model.

Two solutions are provided below. Solution 2 requires Doris version branch-3.0 or later.

### Solution 1: Split Out a Resource JAR

Split the resource-loading code into a separate JAR, and have other business JARs reference this resource JAR.

Suppose the code has been split into two files: `DictLibrary` (resource class) and `FunctionUdf` (business class).

```java
public class DictLibrary {
    private static HashMap<String, String> res = new HashMap<>();

    static {
        // suppose we built this dictionary from a certain local file.
        res.put("key1", "value1");
        res.put("key2", "value2");
        res.put("key3", "value3");
        res.put("0", "value4");
        res.put("1", "value5");
        res.put("2", "value6");
    }

    public static String evaluate(String key) {
        if (key == null) {
            return null;
        }
        return res.get(key);
    }
}
```

```java
public class FunctionUdf {
    public String evaluate(String key) {
        String value = DictLibrary.evaluate(key);
        return value;
    }
}
```

The steps are as follows:

1. Compile the `DictLibrary` file separately to generate a standalone resource JAR `DictLibrary.jar`:

    ```shell
    javac   ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

2. Compile the `FunctionUdf` file, referencing the resource package from the previous step as a dependency, to obtain the UDF business package `FunctionUdf.jar`:

    ```shell
    javac -cp ./DictLibrary.jar  ./FunctionUdf.java
    jar  -cvf ./FunctionUdf.jar  ./FunctionUdf.class
    ```

3. To make the resource JAR shared by all concurrent Instances, have it loaded directly by the JVM. Place it in the specified path `be/custom_lib`. After the BE service restarts, it is loaded together with the JVM startup and is released when the service stops.

4. Finally, use the `CREATE FUNCTION` statement to create the UDF. Each time an instance is unloaded, only `FunctionUdf.jar` is unloaded:

    ```sql
    CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
        "file"="file:///pathTo/FunctionUdf.jar",
        "symbol"="org.apache.doris.udf.FunctionUdf",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

### Solution 2: BE Global JAR Cache

The BE caches JARs globally and supports a customizable expiration time. Add the following two property fields when running `CREATE FUNCTION`:

| Property | Description | Default Value |
| --- | --- | --- |
| `static_load` | Whether to use the static cache loading method | `false` |
| `expiration_time` | JAR expiration time, in minutes | `360` |

How it works:

- After static cache loading is enabled, the UDF instance is cached after initialization completes on the first call.
- On subsequent calls to the UDF, the cache is checked first; if there is a miss, the relevant initialization is executed.
- A background thread checks periodically. If the UDF has not been called within the configured expiration time, it is cleared from the cache.
- If the UDF is called again before expiration, the cache timestamp is automatically refreshed.

Example code:

```java
public class Print extends UDF {
    static Integer val = 0;
    public Integer evaluate() {
        val = val + 1;
        return val;
    }
}
```

```sql
CREATE FUNCTION print_12() RETURNS int 
PROPERTIES (
    "file" = "file:///path/to/java-udf-demo-jar-with-dependencies.jar",
    "symbol" = "org.apache.doris.udf.Print", 
    "always_nullable"="true",
    "type" = "JAVA_UDF",
    "static_load" = "true", // default value is false
    "expiration_time" = "60" // default value is 360 minutes
);
```

The execution result keeps incrementing, which shows that the loaded JAR is not unloaded and reloaded (otherwise, the variable would be reinitialized to 0):

```sql
mysql [test_query_qa]>select print_12();
+------------+
| print_12() |
+------------+
|          1 |
+------------+
1 row in set (0.40 sec)

mysql [test_query_qa]>select print_12();
+------------+
| print_12() |
+------------+
|          2 |
+------------+
1 row in set (0.03 sec)

mysql [test_query_qa]>select print_12();
+------------+
| print_12() |
+------------+
|          3 |
+------------+
1 row in set (0.04 sec)
```
