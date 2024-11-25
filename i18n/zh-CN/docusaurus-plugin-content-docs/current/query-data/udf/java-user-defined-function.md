---
{
"title": "Java UDF、UDAF、UDTF",
"language": "zh-CN"
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

## 概述
Java UDF 为用户提供 UDF 编写的 Java 接口，以方便用户使用 Java 语言进行自定义函数的执行。
Doris 支持使用 JAVA 编写 UDF、UDAF 和 UDTF。下文如无特殊说明，使用 UDF 统称所有用户自定义函数。
1. Java UDF  是较为常见的自定义标量函数(Scalar Function)，即每输入一行数据，就会有一行对应的结果输出，较为常见的有ABS，LENGTH等。值得一提的是对于用户来讲，Hive UDF 是可以直接迁移至 Doris 的。
2. Java UDAF 即为自定义的聚合函数(Aggregate Function)，即在输入多行数据进行聚合后，仅输出一行对应的结果，较为常见的有MIN，MAX，COUNT等。
3. JAVA UDTF 即为自定义的表函数(Table Function)，即每输一行数据，可以产生一行或多行的结果，在 Doris 中需要结合Lateral View 使用可以达到行转列的效果，较为常见的有EXPLODE，EXPLODE_SPLIT等。

## 类型对应关系

| Doris 数据类型   | Java UDF 参数类型                          |
| ---------------- | ------------------------------------------ |
| Bool             | Boolean                                    |
| TinyInt          | Byte                                       |
| SmallInt         | Short                                      |
| Int              | Integer                                    |
| BigInt           | Long                                       |
| LargeInt         | BigInteger                                 |
| Float            | Float                                      |
| Double           | Double                                     |
| Date             | LocalDate                                  |
| Datetime         | LocalDateTime                              |
| String           | String                                     |
| Decimal          | BigDecimal                                 |
| `array<Type>`      | `ArrayList<Type>`（支持嵌套）                  |
| `map<Type1,Type2>` | `HashMap<Type1,Type2>`（支持嵌套）             |
| `struct<Type...>`  | `ArrayList<Object>`（从 3.0.0 版本开始支持） |


:::tip 提示
`array`、`map`、`struct` 类型可以嵌套其它类型。例如，Doris 中的 `array<array<int>>` 对应 Java UDF 参数类型为 `ArrayList<ArrayList<Integer>>`，其他类型依此类推。
:::

:::caution 注意
在创建函数时，请务必使用 `string` 类型而不是 `varchar`，否则可能会导致函数执行失败。
:::

## 使用限制

1. 不支持复杂数据类型（HLL，Bitmap）。
2. 当前允许用户自己指定JVM最大堆大小，配置项是 be.conf 中的 `JAVA_OPTS` 的 -Xmx 部分。默认 1024m，如果需要聚合数据，建议调大一些，增加性能，减少内存溢出风险。
3. 由于 jvm 加载同名类的问题，不要同时使用多个同名类作为 udf 实现，如果想更新某个同名类的 udf，需要重启 be 重新加载 classpath。


## 快速上手
本小节主要介绍如何开发一个 Java UDF。在 `samples/doris-demo/java-udf-demo/` 下提供了示例，可供参考，查看点击[这里](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo)

UDF 的使用与普通的函数方式一致，唯一的区别在于，内置函数的作用域是全局的，而 UDF 的作用域是 DB 内部。
所以如果当前链接 session 位于数据库DB 内部时，直接使用 UDF 名字会在当前 DB 内部查找对应的 UDF。否则用户需要显示的指定 UDF 的数据库名字，例如 `dbName.funcName`。

接下来的章节介绍实例，均会在`test_table` 上做测试，对应建表如下:

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

### Java-UDF 实例介绍

使用 Java 代码编写 UDF，UDF 的主入口必须为 `evaluate` 函数。这一点与 Hive 等其他引擎保持一致。在本示例中，我们编写了 `AddOne` UDF 来完成对整型输入进行加一的操作。

1. 首先编写对应的Java 代码，打包生成JAR 包。

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```

2. 在Doris 中注册创建 Java-UDF 函数。 更多语法帮助可参阅 [CREATE FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FUNCTION.md).

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
        "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
        "symbol"="org.apache.doris.udf.AddOne",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. 用户使用 UDF 必须拥有对应数据库的 `SELECT` 权限。
    如果想查看注册成功的对应UDF 函数，可以使用[SHOW FUNCTIONS](../../sql-manual/sql-statements/Show-Statements/SHOW-FUNCTIONS.md) 命令。

    ``` sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```

4. 当不再需要 UDF 函数时，可以通过下述命令来删除一个 UDF 函数，可以参考 [DROP FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-FUNCTION.md)

另外，如果定义的 UDF 中需要加载很大的资源文件，或者希望可以定义全局的 static 变量，可以参照文档下方的 static 变量加载方式。

### Java-UDAF 实例介绍

在使用 Java 代码编写 UDAF 时，有一些必须实现的函数 (标记 required) 和一个内部类 State，下面将以具体的实例来说明。

1. 首先编写对应的Java UDAF 代码，打包生成JAR 包。

    <details><summary> 示例1: SimpleDemo 将实现一个类似的 sum 的简单函数，输入参数 INT，输出参数是 INT</summary> 

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


    <details><summary> 示例2: MedianUDAF是一个计算中位数的功能，输入类型为(DOUBLE, INT), 输出为DOUBLE </summary>

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
        public void add(State state, Double val, int scale) throws IOException {
            if (val != null && state.isFirst) {
                state.stringBuilder.append(scale).append(",").append(val).append(",");
                state.isFirst = false;
            } else if (val != null) {
                state.stringBuilder.append(val).append(",");
            }
        }

        //处理数据完需要输出等待聚合
        public void serialize(State state, DataOutputStream out) throws IOException {
            //目前暂时只提供 DataOutputStream，如果需要序列化对象可以考虑拼接字符串，转换 json，序列化成字节数组等方式
            //如果要序列化 State 对象，可能需要自己将 State 内部类实现序列化接口
            //最终都是要通过 DataOutputStream 传输
            out.writeUTF(state.stringBuilder.toString());
        }

        //获取处理数据执行单位输出的数据
        public void deserialize(State state, DataInputStream in) throws IOException {
            String string = in.readUTF();
            state.scale = Integer.parseInt(String.valueOf(string.charAt(0)));
            StringBuilder stringBuilder = new StringBuilder(string.substring(2));
            state.stringBuilder = stringBuilder;
        }

        //聚合执行单位按照聚合条件合并某一个键下数据的处理结果 ,每个键第一次合并时，state1 参数是初始化的实例
        public void merge(State state1, State state2) throws IOException {
            state1.scale = state2.scale;
            state1.stringBuilder.append(state2.stringBuilder.toString());
        }

        //对每个键合并后的数据进行并输出最终结果
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

        //每个执行单位执行完都会执行
        public void destroy(State state) {
        }

    }
    ```
</details>


2. 在Doris 中注册创建 Java-UADF 函数。 更多语法帮助可参阅 [CREATE FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FUNCTION.md).

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. 使用 Java-UDAF, 可以分组聚合或者聚合全部结果:

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

### Java-UDTF 实例介绍
:::tip
UDTF 自 Doris 3.0 版本开始支持
:::

1. 首先编写对应的Java UDTF 代码，打包生成JAR 包。
UDTF 和 UDF 函数一样，需要用户自主实现一个 `evaluate` 方法， 但是 UDTF 函数的返回值必须是 Array 类型。

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

2. 在Doris 中注册创建 Java-UDTF 函数。 此时会注册两个UTDF 函数，另外一个是在函数名后面加上`_outer`后缀， 其中带后缀`_outer` 的是针对结果为0行时的特殊处理，具体可查看[OUTER 组合器](../../sql-manual/sql-functions/table-functions/explode-numbers-outer.md)。 
更多语法帮助可参阅 [CREATE FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FUNCTION.md).

    ```sql
    CREATE TABLES FUNCTION java-utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. 使用 Java-UDTF, 在Doris 中使用UDTF 需要结合 [Lateral View](../lateral-view.md), 实现行转列的效果 :

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

## 最佳实践

*Static 变量加载*

当前在 Doris 中，执行一个 UDF 函数，例如 `select udf(col) from table`, 每一个并发 Instance 会加载一次 udf.jar 包，在该 Instance 结束时卸载掉 udf.jar 包。

所以当 udf.jar 文件中需要加载一个几百 MB 的文件时，会因为并发的原因，使得占据的内存急剧增大，容易 OOM。
或者想使用一个连接池时，这样无法做到仅在static 区域初始化一次。

这里提供两个解决方案，其中方案二需要Doris 版本在branch-3.0 以上才行。

*解决方案1:*

是可以将资源加载代码拆分开，单独生成一个 JAR 包文件，然后其他包直接引用该资源 JAR 包。 

假设已经将代码拆分为了 DictLibrary 和 FunctionUdf 两个文件。

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

1. 单独编译 DictLibrary 文件，使其生成一个独立的 JAR 包，这样可以得到一个资源文件包 DictLibrary.jar: 

    ```shell
    javac   ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

2. 编译 FunctionUdf 文件，需要引用上一步的到的资源包最为库使用，这样打包后可以得到 UDF 的 FunctionUdf.jar 包。

    ```shell
    javac -cp ./DictLibrary.jar  ./FunctionUdf.java
    jar  -cvf ./FunctionUdf.jar  ./FunctionUdf.class
    ```

3. 由于想让资源 JAR 包被所有的并发引用，所以想让它被JVM 直接加载，可以将它放到指定路径 `be/custom_lib` 下面，BE 服务重启之后就可以随着 JVM 的启动加载进来，因此都会随着服务启动而加载，停止而释放。

4. 最后利用 `CREATE FUNCTION` 语句创建一个 UDF 函数， 这样每次卸载仅是FunctionUdf.jar。

   ```sql
   CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
    "file"="file:///pathTo/FunctionUdf.jar",
    "symbol"="org.apache.doris.udf.FunctionUdf",
    "always_nullable"="true",
    "type"="JAVA_UDF"
   );
   ```

*解决方案2:* 

BE 全局缓存 JAR 包，自定义过期淘汰时间，在create function 时增加两个属性字段，其中
static_load: 用于定义是否使用静态cache 加载的方式。

expiration_time: 用于定义 JAR 包的过期时间，单位为分钟。

若使用静态cache 加载方式，则在第一次调用该UDF 函数时，在初始化之后会将该UDF 的实例缓存起来，在下次调用该UDF 时，首先会在cache 中进行查找，如果没有找到，则会进行相关初始化操作。

并且后台有线程定期检查，如果在配置的过期淘汰时间内，一直没有被调用过，则会从缓存cache 中清理掉。如果被调用时，则会自动更新缓存时间点。

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
可以看到结果是一直在递增的，证明加载的 JAR 包没有被卸载后又加载，导致重新初始化变量为 0.
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
