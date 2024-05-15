---
{
"title": "Java UDF",
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

:::tip
Java UDF is supported starting from Doris version 1.2.
:::

## Introduction to Java UDF

Java UDF provides users with a Java interface for writing UDFs, making it convenient for users to execute custom functions using the Java language.

Doris supports writing UDFs, UDAFs, and UDTFs using JAVA. Unless otherwise specified, UDF is used as a general term for all user-defined functions in the following text.

## Creating UDF

The implemented jar package can be placed locally or stored on a remote server for download via HTTP, but each FE and BE node must be able to access the jar package.

Otherwise, an error message `Couldn't open file ......` will be returned.

For more syntax help, refer to [CREATE FUNCTION](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FUNCTION.md).

### UDF

```sql
CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
    "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
    "symbol"="org.apache.doris.udf.AddOne",
    "always_nullable"="true",
    "type"="JAVA_UDF"
);
```

### UDAF

```sql
CREATE AGGREGATE FUNCTION middle_quantiles(DOUBLE,INT) RETURNS DOUBLE PROPERTIES (
    "file"="file:///pathTo/java-udaf.jar",
    "symbol"="org.apache.doris.udf.demo.MiddleNumberUDAF",
    "always_nullable"="true",
    "type"="JAVA_UDF"
);
```

### UDTF

:::tip
UDTF is supported starting from Doris version 3.0.
:::

```sql
CREATE TABLES FUNCTION java-utdf(string, string) RETURNS array<string> PROPERTIES (
    "file"="file:///pathTo/java-udaf.jar",
    "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
    "always_nullable"="true",
    "type"="JAVA_UDF"
);
```

## Using UDF

To utilize UDFs, users must possess the `SELECT` privilege for the corresponding database.

The usage of UDFs is identical to standard functions, with the primary distinction being that built-in functions have a global scope, while UDFs are scoped within the DB.

When the session is linked within the database, directly using the UDF name will search for the corresponding UDF within the current DB. Otherwise, users must explicitly specify the UDF's database name, for example, `dbName.funcName`.

## Dropping UDF

If a UDF is no longer needed, it can be dropped using the following command, as detailed in [DROP FUNCTION](../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-FUNCTION.md).

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

## Writing UDF

This section mainly introduces how to develop a Java UDF. Examples are provided in `samples/doris-demo/java-udf-demo/` for reference. Click [here](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo) to view them.

When writing a UDF in Java, the main entry point must be the `evaluate` function. This is consistent with other engines like Hive. In this example, we write an `AddOne` UDF to perform an increment operation on integer inputs.

It is worth mentioning that this example not only supports Java UDFs in Doris but is also a UDF supported by Hive. This means that Hive UDFs can be directly migrated to Doris.

Additionally, if the UDF being defined needs to load large resource files or if you want to define global static variables, you can refer to the static variable loading method described at the bottom of the document.

### UDF

```java
public class AddOne extends UDF {
    public Integer evaluate(Integer value) {
        return value == null ? null : value + 1;
    }
}
```

### UDAF

When writing a UDAF using Java code, there are some required functions (marked as required) and an inner class State that must be implemented. Below is a specific example to illustrate.

#### Example 1

The following SimpleDemo will implement a simple function similar to sum, with the input parameter being INT and the output parameter being INT.

```java
package org.apache.doris.udf.demo;

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
    public void serialize(State state, DataOutputStream out)  {
        /* serialize some data into buffer */
        try {
            out.writeInt(state.sum);
        } catch (Exception e) {
            /* Do not throw exceptions */
            log.info(e.getMessage());
        }
    }

    /*required*/
    public void deserialize(State state, DataInputStream in)  {
        /* deserialize get data from buffer before you put */
        int val = 0;
        try {
            val = in.readInt();
        } catch (Exception e) {
            /* Do not throw exceptions */
            log.info(e.getMessage());
        }
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

#### Example 2

```java
package org.apache.doris.udf.demo;


import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.logging.Logger;

/*UDAF 计算中位数*/
public class MedianUDAF {
    Logger log = Logger.getLogger("MedianUDAF");

    //状态存储
    public static class State {
        //返回结果的精度
        int scale = 0;
        //是否是某一个 tablet 下的某个聚合条件下的数据第一次执行 add 方法
        boolean isFirst = true;
        //数据存储
        public StringBuilder stringBuilder;
    }

    //状态初始化
    public State create() {
        State state = new State();
        //根据每个 tablet 下的聚合条件需要聚合的数据量大小，预先初始化，增加性能
        state.stringBuilder = new StringBuilder(1000);
        return state;
    }


    //处理执行单位处理各自 tablet 下的各自聚合条件下的每个数据
    public void add(State state, Double val, int scale) {
        try {
            if (val != null && state.isFirst) {
                state.stringBuilder.append(scale).append(",").append(val).append(",");
                state.isFirst = false;
            } else if (val != null) {
                state.stringBuilder.append(val).append(",");
            }
        } catch (Exception e) {
            //如果不能保证一定不会异常，建议每个方法都最大化捕获异常，因为目前不支持处理 java 抛出的异常
            log.info("获取数据异常：" + e.getMessage());
        }
    }

    //处理数据完需要输出等待聚合
    public void serialize(State state, DataOutputStream out) {
        try {
            //目前暂时只提供 DataOutputStream，如果需要序列化对象可以考虑拼接字符串，转换 json，序列化成字节数组等方式
            //如果要序列化 State 对象，可能需要自己将 State 内部类实现序列化接口
            //最终都是要通过 DataOutputStream 传输
            out.writeUTF(state.stringBuilder.toString());
        } catch (Exception e) {
            log.info("序列化异常：" + e.getMessage());
        }
    }

    //获取处理数据执行单位输出的数据
    public void deserialize(State state, DataInputStream in) {
        try {
            String string = in.readUTF();
            state.scale = Integer.parseInt(String.valueOf(string.charAt(0)));
            StringBuilder stringBuilder = new StringBuilder(string.substring(2));
            state.stringBuilder = stringBuilder;
        } catch (Exception e) {
            log.info("反序列化异常：" + e.getMessage());
        }
    }

    //聚合执行单位按照聚合条件合并某一个键下数据的处理结果 ,每个键第一次合并时，state1 参数是初始化的实例
    public void merge(State state1, State state2) {
        try {
            state1.scale = state2.scale;
            state1.stringBuilder.append(state2.stringBuilder.toString());
        } catch (Exception e) {
            log.info("合并结果异常：" + e.getMessage());
        }
    }

    //对每个键合并后的数据进行并输出最终结果
    public Double getValue(State state) {
        try {
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
        } catch (Exception e) {
            log.info("计算异常：" + e.getMessage());
        }
        return 0.0;
    }

    //每个执行单位执行完都会执行
    public void destroy(State state) {
    }

}

```

### UDTF

Similar to UDFs, UDTFs require users to implement an `evaluate` method. However, the return value of a UDTF must be of the Array type.

Additionally, table functions in Doris may exhibit different behaviors due to the `_outer` suffix. For more details, refer to [OUTER combinator](../sql-manual/sql-functions/table-functions/explode-numbers-outer.md).

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

## Best Practices

## Loading static variables

Currently, in Doris, executing a UDF function, e.g., `select udf(col) from table`, will load the udf.jar package for each concurrent instance, and unload the udf.jar package when the instance ends. If the udf.jar file needs to load a file of several hundred MBs, the memory usage will increase sharply due to concurrency, potentially leading to OOM (Out of Memory).

The solution is to split the resource loading code, generate a separate jar package, and have other packages directly reference this resource jar package.

Assume the files have been split into DictLibrary and FunctionUdf.

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

3. After the above two steps, you will get two jar packages. To allow the resource jar package to be referenced by all concurrent instances, place it in the BE deployment path `be/lib/java_extensions/java-udf`. After restarting BE, it will be loaded with the JVM startup.

4. Finally, use the `create function` statement to create a UDF function, with the file path pointing to the FunctionUdf.jar package. This way, the resource package will be loaded and released with the BE startup and shutdown. The FunctionUdf.jar will be loaded and released with the SQL execution cycle.

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

## Usage Notes

1. Complex data types (HLL, Bitmap) are not supported.

2. Users are currently allowed to specify the maximum JVM heap size. The configuration item is the `-Xmx` part of `JAVA_OPTS` in `be.conf`. The default is 1024m. If you need to aggregate data, it is recommended to increase this value to enhance performance and reduce the risk of memory overflow.

3. For Char type UDFs, use the String type when creating the function.

4. Due to issues with JVM loading classes with the same name, do not use multiple classes with the same name as UDF implementations simultaneously. If you want to update a UDF with a class of the same name, you need to restart BE to reload the classpath.
