---
{
"title": "Java UDF",
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


## Java UDF 介绍

Java UDF 为用户提供 UDF 编写的 Java 接口，以方便用户使用 Java 语言进行自定义函数的执行。

Doris 支持使用 JAVA 编写 UDF、UDAF 和 UDTF。下文如无特殊说明，使用 UDF 统称所有用户自定义函数。

## 创建 UDF

实现的 jar 包可以放在本地也可以存放在远程服务端通过 HTTP 下载，但必须让每个 FE 和 BE 节点都能获取到 jar 包。

否则将会返回错误状态信息 `Couldn't open file ......`。

更多语法帮助可参阅 [CREATE FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-FUNCTION).

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
    "type"="JAVA_UDAF"
);
```

### UDTF

:::tip
UDTF 自 Doris 3.0 版本开始支持
:::

```sql
CREATE TABLES FUNCTION java-utdf(string, string) RETURNS array<string> PROPERTIES (
    "file"="file:///pathTo/java-udaf.jar",
    "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
    "always_nullable"="true",
    "type"="JAVA_UDF"
);
```

## 使用 UDF

用户使用 UDF 必须拥有对应数据库的 `SELECT` 权限。

UDF 的使用与普通的函数方式一致，唯一的区别在于，内置函数的作用域是全局的，而 UDF 的作用域是 DB 内部。

当链接 Session 位于数据内部时，直接使用 UDF 名字会在当前 DB 内部查找对应的 UDF。否则用户需要显示的指定 UDF 的数据库名字，例如 `dbName.funcName`。

## 删除 UDF

当你不再需要 UDF 函数时，你可以通过下述命令来删除一个 UDF 函数，可以参考 [DROP FUNCTION](../../sql-manual/sql-statements/Data-Definition-Statements/Drop/DROP-FUNCTION.md)

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

## UDF 的编写

本小节主要介绍如何开发一个 Java UDF。在 `samples/doris-demo/java-udf-demo/` 下提供示例，可点击查看[参考示例](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo)

使用 Java 代码编写 UDF，UDF 的主入口必须为 `evaluate` 函数。这一点与 Hive 等其他引擎保持一致。在本示例中，我们编写了 `AddOne` UDF 来完成对整型输入进行加一的操作。

值得一提的是，本例不只是 Doris 支持的 Java UDF，同时还是 Hive 支持的 UDF，也就是说，对于用户来讲，Hive UDF 是可以直接迁移至 Doris 的。

另外，如果定义的 UDF 中需要加载很大的资源文件，或者希望可以定义全局的 Static 变量，可以参照文档下方的 Static 变量加载方式。


### UDF

```java
public class AddOne extends UDF {
    public Integer evaluate(Integer value) {
        return value == null ? null : value + 1;
    }
}
```

### UDAF

在使用 Java 代码编写 UDAF 时，有一些必须实现的函数 (标记 `required`) 和一个内部类 State，下面将以一个具体的实例来说明。

**示例 1**

下面的 SimpleDemo 将实现一个类似的 SUM 的简单函数，输入参数 INT，输出参数是 INT。

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

**示例 2**

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

## 最佳实践

### Static 变量加载

当前在 Doris 中，执行一个 UDF 函数，例如 `select udf(col) from table`, 每一个并发 Instance 会加载一次 udf.jar 包，在该 instance 结束时卸载掉 udf.jar 包。

所以当 udf.jar 文件中需要加载一个几百 MB 的文件时，会因为并发的原因，使得占据的内存急剧增大，容易 OOM。

解决方法是可以将资源加载代码拆分开，单独生成一个 jar 包文件，其他包直接引用该资源 jar 包。 

假设已经拆分为了 DictLibrary 和 FunctionUdf 两个文件。

1. 单独编译 DictLibrary 文件，使其生成一个独立的 jar 包，这样可以得到一个资源文件 DictLibrary.jar: 

    ```shell
    javac   ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

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

2. 编译 FunctionUdf 文件，可以直接引用上一步的到的资源包，这样可以得到 UDF 的 FunctionUdf.jar 包。

    ```shell
    javac -cp ./DictLibrary.jar  ./FunctionUdf.java
    jar  -cvf ./FunctionUdf.jar  ./FunctionUdf.class
    ```

3. 经过上面两步之后，会得到两个 jar 包，由于想让资源 jar 包被所有的并发引用，所以需要将它放到指定路径 `fe/custom_lib` 和 `be/custom_lib` 下面，服务重启之后就可以随着 JVM 的启动加载进来。

4. 最后利用 `CREATE FUNCTION` 语句创建一个 UDF 函数

   ```sql
   CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
    "symbol"="org.apache.doris.udf.FunctionUdf",
    "always_nullable"="true",
    "type"="JAVA_UDF"
   );
   ```

使用该加载方式时，FunctionUdf.jar 和 DictLibrary.jar 都在 FE 和 BE 的 custom_lib 路径下，因此都会随着服务启动而加载，停止而释放，不再需要指定 File 的路径。

也可以使用 file:/// 方式自定义 FunctionUdf.jar 的路径，但是 DictLibrary.jar 只能放在 custom_lib 下。

## 使用须知

1. 不支持复杂数据类型（HLL，Bitmap）。

2. 当前允许用户自己指定 JVM 最大堆大小，配置项是 be.conf 中的 `JAVA_OPTS` 的 -Xmx 部分。默认 1024m，如果需要聚合数据，建议调大一些，增加性能，减少内存溢出风险。

3. Char 类型的 UDF 在 `CREATE FUNCTION` 时需要使用 String 类型。

4. 由于 JVM 加载同名类的问题，不要同时使用多个同名类作为 UDF 实现，如果想更新某个同名类的 UDF，需要重启 BE 重新加载 Classpath。

