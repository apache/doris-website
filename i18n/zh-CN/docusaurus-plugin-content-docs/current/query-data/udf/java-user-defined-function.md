---
{
    "title": "Java UDF, UDAF, UDWF, UDTF",
    "language": "zh-CN",
    "description": "如何在 Apache Doris 中使用 Java 编写 UDF、UDAF、UDWF、UDTF 自定义函数，包含类型映射、注册语法、最佳实践与示例。",
    "keywords": [
        "Doris Java UDF",
        "Java UDAF",
        "Java UDWF",
        "Java UDTF",
        "自定义函数",
        "User Defined Function",
        "Hive UDF 迁移",
        "CREATE FUNCTION",
        "Lateral View",
        "static_load",
        "expiration_time"
    ]
}
---

<!-- 知识类型: 能力定义 / 操作步骤 -->
<!-- 适用场景: 使用 Java 扩展 Doris SQL 能力，迁移 Hive UDF -->

## 概述

Java UDF 为用户提供使用 Java 编写自定义函数的接口，方便用户通过 Java 语言实现 SQL 中无法直接表达的业务逻辑。Apache Doris 支持使用 Java 编写 UDF、UDAF、UDWF 与 UDTF 四类自定义函数。下文如无特殊说明，使用 UDF 统称所有用户自定义函数。

四类自定义函数的定义与典型代表如下：

| 类型 | 全称 | 行为说明 | 典型函数示例 | 起始支持版本 |
| --- | --- | --- | --- | --- |
| UDF | Scalar Function（标量函数） | 每输入一行，输出一行结果 | ABS、LENGTH | 全版本支持 |
| UDAF | Aggregate Function（聚合函数） | 多行输入聚合后，输出一行结果 | MIN、MAX、COUNT | 全版本支持 |
| UDWF | Window Function（窗口函数） | 在窗口范围（一行或多行）内为每行返回一个值 | ROW_NUMBER、RANK、DENSE_RANK | 全版本支持 |
| UDTF | Table Function（表函数） | 每输入一行，输出一行或多行；需结合 Lateral View 使用，可实现行转列 | EXPLODE、EXPLODE_SPLIT | Doris 3.0 起 |

对于已经在 Hive 上积累了大量自定义函数的用户，Java UDF 可以直接迁移至 Doris，无需重写。

## 适用场景

- 业务需要在 SQL 中执行 Doris 内置函数无法覆盖的标量计算、聚合统计或行展开逻辑。
- 已有 Hive Java UDF 资产，需要平滑迁移至 Doris。
- 自定义函数中需要加载较大资源文件（如词典、模型），或希望复用全局连接池等单例资源。

## 数据类型映射

下表列出了 Doris 数据类型与 Java UDF 入参/返回值类型之间的对应关系：

| Doris 数据类型 | Java UDF 参数类型 |
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
| `array<Type>` | `ArrayList<Type>`、`List<Type>`（支持嵌套） |
| `map<Type1,Type2>` | `HashMap<Type1,Type2>`、`Map<Type1,Type2>`（支持嵌套） |
| `struct<Type...>` | `ArrayList<Object>`（从 3.0.0 版本开始支持）、`List<Type>` |
| VarBinary | `byte[]`、`Byte[]`（从 4.0 版本开始支持 VarBinary 类型，优先建议使用 `byte[]`，可减少一层额外转换） |

:::tip 提示
`array`、`map`、`struct` 类型可以嵌套其它类型。例如，Doris 中的 `array<array<int>>` 对应的 Java UDF 参数类型为 `ArrayList<ArrayList<Integer>>`，其他类型依此类推。`List<Type>` 与 `Map<Type1,Type2>` 形式的支持从 3.1.0 版本开始。
:::

:::caution 注意
在创建函数时，请务必使用 `string` 类型，而不是 `varchar`，否则可能导致函数执行失败。
:::

## 使用限制

<!-- 知识类型: 限制说明 -->

1. 不支持复杂数据类型 HLL 与 Bitmap。
2. 允许用户自行指定 JVM 最大堆大小，对应配置项为 `be.conf` 中 `JAVA_OPTS` 的 `-Xmx` 部分；默认 1024 MB。如果聚合数据量较大，建议适当调大，以提升性能并降低内存溢出风险。
3. 由于 JVM 加载同名类的限制，不要同时使用多个同名类作为 UDF 实现。如需更新某个同名类的 UDF，需要重启 BE 重新加载 classpath。
4. 同名函数的处理规则：

    - 用户可以创建与内置函数签名完全相同的自定义函数。默认情况下，系统会优先匹配内置函数。
    - 如果在调用时显式指定了 `database`（即 `db.function()`），则会被强制识别为用户自定义函数。
    - 在 3.0.7 版本中新增了会话变量 `prefer_udf_over_builtin`。当其设置为 `true` 时，会优先匹配用户自定义函数，便于用户从其他系统迁移到 Doris 时，在不改变函数名称的前提下保持原有系统的函数行为。

## 快速上手

本节介绍如何开发并注册 Java UDF。在 `samples/doris-demo/java-udf-demo/` 目录下提供了示例代码供参考，也可以查看 GitHub 上的 [demo](https://github.com/apache/doris/tree/master/samples/doris-demo/java-udf-demo)。

UDF 的使用方式与普通函数一致，唯一的区别在于：

- 内置函数的作用域是全局的；
- UDF 的作用域是 DB 内部。

因此，如果当前会话位于某个数据库内部，直接使用 UDF 名字会在当前 DB 中查找对应的 UDF；否则需要显式指定 UDF 所在的数据库名字，例如 `dbName.funcName`。

为便于演示，后续示例统一在 `test_table` 上进行测试。建表语句如下：

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

### Java UDF 示例

使用 Java 编写 UDF 时，主入口必须为 `evaluate` 函数，这一点与 Hive 等其他引擎保持一致。下例编写一个 `AddOne` UDF，对整型输入执行加一操作。

1. 编写 Java 代码并打包生成 JAR 包：

    ```java
    public class AddOne extends UDF {
        public Integer evaluate(Integer value) {
            return value == null ? null : value + 1;
        }
    }
    ```

2. 在 Doris 中注册 Java UDF 函数。更多语法可参阅 [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)。

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
        "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
        "symbol"="org.apache.doris.udf.AddOne",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

:::caution Note
使用 `file://` 时，Doris 会在 `CREATE FUNCTION` 阶段从 FE 节点读取 JAR 文件并计算 checksum，在执行阶段从 BE 节点读取 JAR 文件。因此，同一个 JAR 文件必须以相同绝对路径存在于所有 FE 和 BE 节点，并且文件内容必须完全一致。如果文件只存在于 BE 节点，`CREATE FUNCTION` 会失败；如果 FE 和 BE 上的文件内容不一致，执行时会因 checksum 不匹配失败。
:::

3. 调用 UDF。使用 UDF 必须拥有对应数据库的 `SELECT` 权限。如需查看注册成功的 UDF，可使用 [SHOW FUNCTIONS](../../sql-manual/sql-statements/function/SHOW-FUNCTIONS) 命令。

    ```sql
    select id,java_udf_add_one(id) from test_table;
    +------+----------------------+
    | id   | java_udf_add_one(id) |
    +------+----------------------+
    |    1 |                    2 |
    |    6 |                    7 |
    +------+----------------------+
    ```

4. 当不再需要某个 UDF 函数时，可以使用 [DROP FUNCTION](../../sql-manual/sql-statements/function/DROP-FUNCTION) 命令删除。

如果定义的 UDF 中需要加载较大的资源文件，或希望定义全局 static 变量，可参考下文「最佳实践」一节。

### Java UDAF 示例

使用 Java 编写 UDAF 时，需要实现一组规定的函数（标记为 required）以及一个内部类 `State`。下面通过两个示例进行说明。

1. 编写对应的 Java UDAF 代码并打包生成 JAR 包。

<details>
<summary>示例 1：SimpleDemo 实现一个类似 sum 的简单聚合函数，输入参数为 INT，输出参数为 INT</summary>

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
<summary>示例 2：MedianUDAF 实现计算中位数的功能，输入类型为 (DOUBLE, INT)，输出类型为 DOUBLE</summary>

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

2. 在 Doris 中注册 Java UDAF 函数。更多语法可参阅 [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)。

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. 调用 Java UDAF。可分组聚合，也可对全部结果进行聚合：

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

### Java UDWF 示例

Java UDWF 的代码结构与 Java UDAF 完全一致，只需额外实现 `reset` 接口，将所有 `state` 状态置为初始值即可：

```java
void reset(State state)
```

1. 编写并打包 Java UDWF 代码（同上）。

2. 在 Doris 中注册 Java UDWF 函数，注册方式与 Java UDAF 一致。更多语法可参阅 [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)。

    ```sql
    CREATE AGGREGATE FUNCTION simple_demo_window(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. 调用 Java UDWF，可在指定窗口范围内计算结果。更多语法请参考[窗口函数](../window-function.md)：

    ```sql
    select id, simple_demo_window(id) over(partition by id order by d1 rows between 1 preceding and 1 following) as res from test_table;
    +------+------+
    | id   | res  |
    +------+------+
    |    1 |    1 |
    |    6 |    6 |
    +------+------+
    ```

### Java UDTF 示例

:::tip
UDTF 自 Doris 3.0 版本开始支持。
:::

UDTF 与 UDF 一样需要用户实现 `evaluate` 方法，但 UDTF 的返回值必须是 Array 类型。

1. 编写对应的 Java UDTF 代码并打包生成 JAR 包：

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

2. 在 Doris 中注册 Java UDTF 函数。注册时会同时生成两个 UDTF：函数名后带 `_outer` 后缀的版本针对结果为 0 行的场景做了特殊处理，详情可参考 [OUTER 组合器](../../sql-manual/sql-functions/table-functions/explode-numbers)。更多语法可参阅 [CREATE FUNCTION](../../sql-manual/sql-statements/function/CREATE-FUNCTION)。

    ```sql
    CREATE TABLES FUNCTION java_utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udtf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. 调用 Java UDTF。在 Doris 中使用 UDTF 需要结合 [Lateral View](../lateral-view.md)，以实现行转列效果：

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

## 最佳实践：Static 变量加载

<!-- 知识类型: 最佳实践 -->
<!-- 适用场景: UDF 加载大资源文件 / 复用连接池等单例资源 -->

在 Doris 中执行一个 UDF 函数（例如 `select udf(col) from table`）时，每个并发 Instance 会加载一次 `udf.jar` 包，并在该 Instance 结束时卸载。

由此带来两个常见问题：

- 当 `udf.jar` 文件中需要加载几百 MB 的资源文件时，并发会使内存占用急剧增大，容易触发 OOM。
- 想使用连接池等需要在 `static` 区域只初始化一次的对象时，按当前并发模型无法实现。

下面提供两个解决方案。其中方案二需要 Doris 版本在 branch-3.0 及以上。

### 方案 1：拆分资源 JAR 包

将资源加载相关的代码拆分出来，单独生成一个 JAR 包，让其他业务 JAR 引用该资源 JAR。

假设代码已被拆分为 `DictLibrary`（资源类）和 `FunctionUdf`（业务类）两个文件。

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

操作步骤如下：

1. 单独编译 `DictLibrary` 文件，生成独立的资源 JAR 包 `DictLibrary.jar`：

    ```shell
    javac   ./DictLibrary.java
    jar -cf ./DictLibrary.jar ./DictLibrary.class
    ```

2. 编译 `FunctionUdf` 文件，引用上一步的资源包作为依赖，得到 UDF 业务包 `FunctionUdf.jar`：

    ```shell
    javac -cp ./DictLibrary.jar  ./FunctionUdf.java
    jar  -cvf ./FunctionUdf.jar  ./FunctionUdf.class
    ```

3. 为了让资源 JAR 包被所有并发共享，需让其被 JVM 直接加载。将其放入指定路径 `be/custom_lib` 下，BE 服务重启后即可随 JVM 启动一并加载，随服务停止而释放。

4. 最后使用 `CREATE FUNCTION` 语句创建 UDF 函数，每次实例卸载时仅卸载 `FunctionUdf.jar`：

    ```sql
    CREATE FUNCTION java_udf_dict(string) RETURNS string PROPERTIES (
        "file"="file:///pathTo/FunctionUdf.jar",
        "symbol"="org.apache.doris.udf.FunctionUdf",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

### 方案 2：BE 全局缓存 JAR 包

BE 全局缓存 JAR 包，并支持自定义过期淘汰时间。在 `CREATE FUNCTION` 时增加以下两个属性字段：

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `static_load` | 是否使用静态 cache 加载方式 | `false` |
| `expiration_time` | JAR 包过期时间，单位为分钟 | `360` |

工作机制如下：

- 启用静态 cache 加载方式后，第一次调用该 UDF 时，初始化完成后会将该 UDF 实例缓存起来。
- 后续调用该 UDF 时，先在 cache 中查找；若未命中，再执行相关初始化操作。
- 后台有线程定期检查，如果在配置的过期淘汰时间内一直未被调用，则会从 cache 中清理掉。
- 如果在过期前被再次调用，则会自动更新缓存时间点。

示例代码如下：

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

可以看到执行结果一直在递增，说明加载的 JAR 包没有被卸载后又重新加载（否则变量会被重新初始化为 0）：

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
