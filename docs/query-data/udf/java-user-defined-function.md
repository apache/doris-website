---
{
"title": "Java UDF、UDAF、UDTF",
"language": "en"
}
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


## Overview
Java UDF provides a Java interface for users to implement user-defined functions (UDFs) conveniently using the Java programming language.
Doris supports the use of Java to develop UDFs, UDAFs, and UDTFs. Unless otherwise specified, "UDF" in the following text refers to all types of user-defined functions.

1. Java UDF: A Java UDF is a commonly used scalar function, where each input row produces a corresponding output row. Common examples include ABS and LENGTH. Notably, Hive UDFs can be directly migrated to Doris, which is convenient for users.

2. Java UDAF: A Java UDAF is a user-defined aggregate function that aggregates multiple input rows into a single output row. Common examples include MIN, MAX, and COUNT.

3. Java UDTF: A Java UDTF is a user-defined table function, where a single input row can generate one or multiple output rows. In Doris, UDTFs must be used with Lateral View to achieve row-to-column transformations. Common examples include EXPLODE and EXPLODE_SPLIT.

## Type Correspondence

| Type                  | UDF Argument Type            |
|-----------------------|------------------------------|
| Bool                  | Boolean                      |
| TinyInt               | Byte                         |
| SmallInt              | Short                        |
| Int                   | Integer                      |
| BigInt                | Long                         |
| LargeInt              | BigInteger                   |
| Float                 | Float                        |
| Double                | Double                       |
| Date                  | LocalDate                    |
| Datetime              | LocalDateTime                |
| String                | String                       |
| Decimal               | BigDecimal                   |
| `array<Type>`         | `ArrayList<Type>`            |
| `map<Type1,Type2>`    | `HashMap<Type1,Type2>`       |
| `struct<Type...>`     | `ArrayList<Object>` (from version 3.0.0) |

:::tip
`array/map/struct` types can be nested with other types. For instance, Doris: `array<array<int>>` corresponds to JAVA UDF Argument Type: `ArrayList<ArrayList<Integer>>`. Other types follow the same pattern.
:::

:::caution Warning
When creating functions, avoid using `varchar` in place of `string`, as this may cause the function to fail.
:::


## Usage Notes

1. Complex data types (HLL, Bitmap) are not supported.

2. Users are currently allowed to specify the maximum JVM heap size. The configuration item is the `-Xmx` part of `JAVA_OPTS` in `be.conf`. The default is 1024m. If you need to aggregate data, it is recommended to increase this value to enhance performance and reduce the risk of memory overflow.

3. Due to issues with JVM loading classes with the same name, do not use multiple classes with the same name as UDF implementations simultaneously. If you want to update a UDF with a class of the same name, you need to restart BE to reload the classpath.


## Getting Started
This section mainly introduces how to develop a Java UDF. Examples are provided in `samples/doris-demo/java-udf-demo/` for reference. Click [here](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo) to view details.

The usage of UDFs is identical to standard functions, with the primary distinction being that built-in functions have a global scope, while UDFs are scoped within the DB.

When the session is linked within the database, directly using the UDF name will search for the corresponding UDF within the current DB. Otherwise, users must explicitly specify the UDF's database name, for example, `dbName.funcName`.

In the following sections, examples will use the table `test_table`. The corresponding table creation script is as follows:

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


### Introduction to Java-UDF Example
When writing a UDF in Java, the main entry point must be the `evaluate` function. This is consistent with other engines like Hive. In this example, we write an `AddOne` UDF to perform an increment operation on integer inputs.

1. Write the corresponding Java code and package it into a JAR file.

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```

2. Register and create the Java-UDF function in Doris. For more details on the syntax, refer to [CREATE FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FUNCTION.md).

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
        "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
        "symbol"="org.apache.doris.udf.AddOne",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. To utilize UDFs, users must possess the `SELECT` privilege for the corresponding database. And to verify the successful registration of the UDF, you can use the [SHOW FUNCTIONS](../../sql-manual/sql-statements/Show-Statements/SHOW-FUNCTIONS.md) command.

    ``` sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```

4. If a UDF is no longer needed, it can be dropped using the following command, as detailed in [DROP FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-FUNCTION).

Additionally, if your UDF requires loading large resource files or defining global static variables, you can refer to the method for loading static variables described later in this document.

### Introduction to Java-UDAF Example

When writing a `UDAF` using Java, there are some functions that must be implemented (marked as required) along with an internal class State. The following example will illustrate how to implement them.

1. Write the corresponding Java UDAF code and package it into a JAR file.

    <details><summary> Example 1: SimpleDemo will implement a simple function similar to sum, where the input parameter is INT and the output parameter is INT.</summary> 

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
        public void serialize(State state, DataOutputStream out) throws Exception {
            /* serialize some data into buffer */
            out.writeInt(state.sum);
        }

        /*required*/
        public void deserialize(State state, DataInputStream in) throws Exception {
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


    <details><summary> Example 2: MedianUDAF is a function that calculates the median. The input types are (DOUBLE, INT), and the output type is DOUBLE. </summary>

    ```java
    package org.apache.doris.udf.demo;  
    
    import java.io.DataInputStream;  
    import java.io.DataOutputStream;
    import java.io.IOException;
    import java.math.BigDecimal;  
    import java.util.Arrays;  
    import java.util.logging.Logger;  

    /* UDAF to calculate the median */  
    public class MedianUDAF {  
        Logger log = Logger.getLogger("MedianUDAF");  

        // State storage  
        public static class State {  
            // Precision of the return result  
            int scale = 0;  
            // Whether it is the first time to execute the add method for a certain aggregation condition under a certain tablet  
            boolean isFirst = true;  
            // Data storage  
            public StringBuilder stringBuilder;  
        }  

        // Initialize the state  
        public State create() {  
            State state = new State();  
            // Pre-initialize based on the amount of data that needs to be aggregated under each aggregation condition of each tablet to increase performance  
            state.stringBuilder = new StringBuilder(1000);  
            return state;  
        }  

        // Process each data under respective aggregation conditions for each tablet  
        public void add(State state, Double val, int scale) {  
            if (val != null && state.isFirst) {  
                state.stringBuilder.append(scale).append(",").append(val).append(",");  
                state.isFirst = false;  
            } else if (val != null) {  
                state.stringBuilder.append(val).append(",");  
            }  
        }  

        // Data needs to be output for aggregation after processing  
        public void serialize(State state, DataOutputStream out) throws IOException {  
            // Currently, only DataOutputStream is provided. If serialization of objects is required, methods such as concatenating strings, converting to JSON, or serializing into byte arrays can be considered  
            // If the State object needs to be serialized, it may be necessary to implement a serialization interface for the State inner class  
            // Ultimately, everything needs to be transmitted via DataOutputStream  
            out.writeUTF(state.stringBuilder.toString());  
        }  

        // Obtain the output data from the data processing execution unit  
        public void deserialize(State state, DataInputStream in) throws IOException {  
            String string = in.readUTF();  
            state.scale = Integer.parseInt(String.valueOf(string.charAt(0)));  
            StringBuilder stringBuilder = new StringBuilder(string.substring(2));  
            state.stringBuilder = stringBuilder;   
        }  

        // The aggregation execution unit merges the processing results of data under certain aggregation conditions for a given key. The state1 parameter is the initialized instance during the first merge of each key  
        public void merge(State state1, State state2) {  
            state1.scale = state2.scale;  
            state1.stringBuilder.append(state2.stringBuilder.toString());  
        }  

        // Output the final result after merging the data for each key  
        public Double getValue(State state) {  
            String[] strings = state.stringBuilder.toString().split(",");  
            double[] doubles = new double[strings.length];  
            for (int i = 0; i < strings.length - 1; i++) {  
                doubles[i] = Double.parseDouble(strings[i + 1]);  
            }  

            Arrays.sort(doubles);  
            double n = doubles.length;  
            if (n == 0) {  
                return 0.0;  
            }  
            double index = (n - 1) / 2.0;  

            int low = (int) Math.floor(index);  
            int high = (int) Math.ceil(index);  

            double value = low == high ? (doubles[low] + doubles[high]) / 2 : doubles[high];  

            BigDecimal decimal = new BigDecimal(value);  
            return decimal.setScale(state.scale, BigDecimal.ROUND_HALF_UP).doubleValue();  
        }  

        // Executed after each execution unit completes  
        public void destroy(State state) {  
        }  
    }
    ```
</details>

2. Register and create the Java-UDAF function in Doris. For more syntax details, please refer to [CREATE FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FUNCTION.md).

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. When using Java-UDAF, you can perform aggregation either by grouping or by aggregating all results:

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

### Introduction to Java-UDTF Example

:::tip
UDTF is supported starting from Doris version 3.0.
:::

1. Similar to UDFs, UDTFs require users to implement an `evaluate` method. However, the return value of a UDTF must be of the Array type.

    ```JAVA
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

2. Register and create the Java-UDTF function in Doris. Two UDTF functions will be registered. Table functions in Doris may exhibit different behaviors due to the `_outer` suffix. For more details, refer to [OUTER combinator](../../sql-manual/sql-functions/table-functions/explode-numbers-outer.md).
For more syntax details, please refer to [CREATE FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FUNCTION.md).

    ```sql
    CREATE TABLES FUNCTION java-utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. When using Java-UDTF, in Doris, UDTFs must be used with [`Lateral View`](../lateral-view.md) to achieve the row-to-column transformation effect:

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

## Best Practices

*Loading static variables*

Currently, in Doris, executing a UDF function, e.g., `select udf(col) from table`, will load the udf.jar package for each concurrent instance, and unload the udf.jar package when the instance finish. 

If the udf.jar file needs to load a file of several hundred MBs, the memory usage will increase sharply due to concurrency, potentially leading to OOM (Out of Memory).

Alternatively, if you want to use a connection pool, this approach will not allow you to initialize it only once in the static area.

Here are two solutions, with the second solution requiring Doris version branch-3.0 or above.

*Solution 1:*

The solution is to split the resource loading code, generate a separate jar package, and have other packages directly reference this resource jar package.

Assume the files have been split into `DictLibrary` and `FunctionUdfAR`.

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

1. Compile the DictLibrary file separately to generate an independent jar package, resulting in a resource file DictLibrary.jar:

    ```shell
    javac ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

2. Then compile the FunctionUdf file, directly referencing the resource package from the previous step, resulting in the FunctionUdf.jar package:

    ```shell
    javac -cp ./DictLibrary.jar ./FunctionUdf.java
    jar -cvf ./FunctionUdf.jar ./FunctionUdf.class
    ```

3. After the above two steps, you will get two jar packages. To allow the resource jar package to be referenced by all concurrent instances, place it in the deployment path `be/custom_lib`. After the restarting, it will be loaded with the JVM startup. As a result, the resources will be loaded when the service starts and released when the service stops.

4. Finally, use the `create function` statement to create a UDF function

   ```sql
   CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
    "file"="file:///pathTo/FunctionUdf.jar",
    "symbol"="org.apache.doris.udf.FunctionUdf",
    "always_nullable"="true",
    "type"="JAVA_UDF"
   );
   ```

*Solution 2:*

The BE (Backend) globally caches the JAR file and customizes the expiration and eviction time. When creating a function, two additional properties are added:

static_load: This defines whether to use the static cache loading method.
expiration_time: This defines the expiration time of the JAR file, in minutes.
If the static cache loading method is used, the UDF instance will be cached after the first call and initialization. On subsequent calls to the UDF, the system will first search in the cache. If not found, the initialization process will be triggered.

Additionally, a background thread regularly checks the cache. If the function has not been called within the configured expiration time, it will be evicted from the cache. If the function is called, the cache timestamp will be automatically updated.

```sql
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

As we can see, the result keeps incrementing, which proves that the loaded JAR file is not being unloaded and reloaded. Instead, the variables are being re-initialized to 0.

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