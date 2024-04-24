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

# Java UDF

<version since="1.2.0">

Java UDF 为用户提供 UDF 编写的 Java 接口，以方便用户使用 Java 语言进行自定义函数的执行。相比于 Native 的 UDF 实现，Java UDF 有如下优势和限制：
1. 优势
* 兼容性：使用 Java UDF 可以兼容不同的 Doris 版本，所以在进行 Doris 版本升级时，Java UDF 不需要进行额外的迁移操作。与此同时，Java UDF 同样遵循了和 Hive/Spark 等引擎同样的编程规范，使得用户可以直接将 Hive/Spark 的 UDF jar 包迁移至 Doris 使用。
* 安全：Java UDF 执行失败或崩溃仅会导致 JVM 报错，而不会导致 Doris 进程崩溃。
* 灵活：Java UDF 中用户通过把第三方依赖打进用户 jar 包，而不需要额外处理引入的三方库。

2. 使用限制
* 性能：相比于 Native UDF，Java UDF 会带来额外的 JNI 开销，不过通过批式执行的方式，我们已经尽可能的将 JNI 开销降到最低。
* 向量化引擎：Java UDF 当前只支持向量化引擎。

</version>

### 类型对应关系

|Type|UDF Argument Type|
|----|---------|
|Bool|Boolean|
|TinyInt|Byte|
|SmallInt|Short|
|Int|Integer|
|BigInt|Long|
|LargeInt|BigInteger|
|Float|Float|
|Double|Double|
|Date|LocalDate|
|Datetime|LocalDateTime|
|String|String|
|Decimal|BigDecimal|
|```array<Type>```|```ArrayList<Type>```|
|```map<Type1,Type2>```|```HashMap<Type1,Type2>```|

* array/map类型可以嵌套其它类型，例如Doris: ```array<array<int>>```对应 JAVA UDF Argument Type: ```ArrayList<ArrayList<Integer>>```, 其他依此类推

:::caution Warning
在创建函数的时候，不要使用 `varchar` 代替 `string`，否则函数可能执行失败。
:::

## 编写 UDF 函数

本小节主要介绍如何开发一个 Java UDF。在 `samples/doris-demo/java-udf-demo/` 下提供了示例，可供参考，查看点击[这里](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo)

使用 Java 代码编写 UDF，UDF 的主入口必须为 `evaluate` 函数。这一点与 Hive 等其他引擎保持一致。在本示例中，我们编写了 `AddOne` UDF 来完成对整型输入进行加一的操作。
值得一提的是，本例不只是 Doris 支持的 Java UDF，同时还是 Hive 支持的 UDF，也就是说，对于用户来讲，Hive UDF 是可以直接迁移至 Doris 的。

## 创建 UDF

```JAVA
public class AddOne extends UDF {
    public Integer evaluate(Integer value) {
        return value == null ? null : value + 1;
    }
}
```

```sql
CREATE FUNCTION 
name ([,...])
[RETURNS] rettype
PROPERTIES (["key"="value"][,...])	
```
说明：

1. PROPERTIES 中`symbol`表示的是包含 UDF 类的类名，这个参数是必须设定的。
2. PROPERTIES 中`file`表示的包含用户 UDF 的 jar 包，这个参数是必须设定的。
3. PROPERTIES 中`type`表示的 UDF 调用类型，默认为 Native，使用 Java UDF 时传 JAVA_UDF。
4. PROPERTIES 中`always_nullable`表示的 UDF 返回结果中是否有可能出现 NULL 值，是可选参数，默认值为 true。
5. name: 一个 function 是要归属于某个 DB 的，name 的形式为`dbName`.`funcName`。当`dbName`没有明确指定的时候，就是使用当前 session 所在的 db 作为`dbName`。

示例：
```sql
CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
    "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
    "symbol"="org.apache.doris.udf.AddOne",
    "always_nullable"="true",
    "type"="JAVA_UDF"
);
```
* "file"="http://IP:port/udf-code.jar", 当在多机环境时，也可以使用 http 的方式下载 jar 包
* "always_nullable"可选属性，如果在计算中对出现的 NULL 值有特殊处理，确定结果中不会返回 NULL，可以设为 false，这样在整个查询计算过程中性能可能更好些。
* 如果你是**本地路径**方式，这里数据库驱动依赖的 jar 包，**FE、BE 节点都要放置**

## 编写 UDAF 函数


在使用 Java 代码编写 UDAF 时，有一些必须实现的函数 (标记 required) 和一个内部类 State，下面将以一个具体的实例来说明
下面的 SimpleDemo 将实现一个类似的 sum 的简单函数，输入参数 INT，输出参数是 INT
```JAVA
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

```sql
CREATE AGGREGATE FUNCTION simple_sum(INT) RETURNS INT PROPERTIES (
    "file"="file:///pathTo/java-udaf.jar",
    "symbol"="org.apache.doris.udf.demo.SimpleDemo",
    "always_nullable"="true",
    "type"="JAVA_UDF"
);
```

```JAVA
package org.apache.doris.udf.demo;


import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.logging.Logger;

/*UDAF计算中位数*/
public class MedianUDAF {
    Logger log = Logger.getLogger("MedianUDAF");

    //状态存储
    public static class State {
        //返回结果的精度
        int scale = 0;
        //是否是某一个tablet下的某个聚合条件下的数据第一次执行add方法
        boolean isFirst = true;
        //数据存储
        public StringBuilder stringBuilder;
    }

    //状态初始化
    public State create() {
        State state = new State();
        //根据每个tablet下的聚合条件需要聚合的数据量大小，预先初始化，增加性能
        state.stringBuilder = new StringBuilder(1000);
        return state;
    }


    //处理执行单位处理各自tablet下的各自聚合条件下的每个数据
    public void add(State state, Double val, int scale) {
        try {
            if (val != null && state.isFirst) {
                state.stringBuilder.append(scale).append(",").append(val).append(",");
                state.isFirst = false;
            } else if (val != null) {
                state.stringBuilder.append(val).append(",");
            }
        } catch (Exception e) {
            //如果不能保证一定不会异常，建议每个方法都最大化捕获异常，因为目前不支持处理java抛出的异常
            log.info("获取数据异常: " + e.getMessage());
        }
    }

    //处理数据完需要输出等待聚合
    public void serialize(State state, DataOutputStream out) {
        try {
            //目前暂时只提供DataOutputStream,如果需要序列化对象可以考虑拼接字符串,转换json,序列化成字节数组等方式
            //如果要序列化State对象，可能需要自己将State内部类实现序列化接口
            //最终都是要通过DataOutputStream传输
            out.writeUTF(state.stringBuilder.toString());
        } catch (Exception e) {
            log.info("序列化异常: " + e.getMessage());
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
            log.info("反序列化异常: " + e.getMessage());
        }
    }

    //聚合执行单位按照聚合条件合并某一个键下数据的处理结果 ,每个键第一次合并时,state1参数是初始化的实例
    public void merge(State state1, State state2) {
        try {
            state1.scale = state2.scale;
            state1.stringBuilder.append(state2.stringBuilder.toString());
        } catch (Exception e) {
            log.info("合并结果异常: " + e.getMessage());
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

```sql
CREATE AGGREGATE FUNCTION middle_quantiles(DOUBLE,INT) RETURNS DOUBLE PROPERTIES (
    "file"="file:///pathTo/java-udaf.jar",
    "symbol"="org.apache.doris.udf.demo.MiddleNumberUDAF",
    "always_nullable"="true",
    "type"="JAVA_UDF"
);
```


:::tip 提示
该功能从 Doris 2.1 开始支持
:::

## 编写 UDTF 函数

UDTF 和 UDF 函数一样，需要用户自主实现一个 `evaluate` 方法，但是 UDTF 函数的返回值必须是 Array 类型。
另外 Doris 中表函数会因为 _outer 后缀有不同的表现，可查看[OUTER 组合器](../sql-manual/sql-functions/table-functions/explode-numbers-outer)

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

```sql
CREATE TABLES FUNCTION java-utdf(string, string) RETURNS array<string> PROPERTIES (
    "file"="file:///pathTo/java-udaf.jar",
    "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
    "always_nullable"="true",
    "type"="JAVA_UDF"
);
```



* 实现的 jar 包可以放在本地也可以存放在远程服务端通过 http 下载，但必须让每个 BE 节点都能获取到 jar 包;
否则将会返回错误状态信息"Couldn't open file ......".




## 使用 UDF

用户使用 UDF 必须拥有对应数据库的 `SELECT` 权限。

UDF 的使用与普通的函数方式一致，唯一的区别在于，内置函数的作用域是全局的，而 UDF 的作用域是 DB 内部。当链接 session 位于数据内部时，直接使用 UDF 名字会在当前 DB 内部查找对应的 UDF。否则用户需要显示的指定 UDF 的数据库名字，例如 `dbName`.`funcName`。

## 删除 UDF

当你不再需要 UDF 函数时，你可以通过下述命令来删除一个 UDF 函数，可以参考 `DROP FUNCTION`。

## 示例
在`samples/doris-demo/java-udf-demo/` 目录中提供了具体示例。具体使用方法见每个目录下的`README.md`，查看点击[这里](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo)

## 使用须知
1. 不支持复杂数据类型（HLL，Bitmap）。
2. 当前允许用户自己指定 JVM 最大堆大小，配置项是 be.conf 中的 JAVA_OPTS 的 -Xmx 部分。默认 1024m，如果需要聚合数据，建议调大一些，增加性能，减少内存溢出风险。
3. char 类型的 udf 在 create function 时需要使用 String 类型。
4. 由于 jvm 加载同名类的问题，不要同时使用多个同名类作为 udf 实现，如果想更新某个同名类的 udf，需要重启 be 重新加载 classpath。

