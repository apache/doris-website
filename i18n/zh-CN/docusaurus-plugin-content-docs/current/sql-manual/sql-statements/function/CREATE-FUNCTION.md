---
{
    "title": "CREATE FUNCTION",
    "language": "zh-CN",
    "description": "此语句用于创建一个自定义函数。"
}
---

## 描述

此语句用于创建一个自定义函数。

## 语法

```sql
CREATE [ GLOBAL ] 
    [{AGGREGATE | TABLES | ALIAS }] FUNCTION <function_name>
    (<arg_type> [, ...])
    [ RETURNS <ret_type> ]
    [ INTERMEDIATE <inter_type> ]
    [ WITH PARAMETER(<param> [,...]) AS <origin_function> ]
    [ PROPERTIES ("<key>" = "<value>" [, ...]) ]
```

## 必选参数

**1. `<function_name>`**

> 如果 `function_name` 中包含了数据库名字，比如：`db1.my_func`，那么这个自定义函数会创建在对应的数据库中，否则这个函数将会创建在当前会话所在的数据库。新函数的名字与参数不能够与当前命名空间中已存在的函数完全相同，否则会创建失败。

**2. `<arg_type>`**

> 函数的输入参数类型。变长参数时可以使用`, ...`来表示，如果是变长类型，那么变长部分参数的类型与最后一个非变长参数类型一致。

**3. `<ret_type>`**

> 函数的返回参数类型，对创建新的函数来说，是必填项。如果是给已有函数取别名则可不用填写该参数。

## 可选参数

**1. `GLOBAL`**

> 如果有此项，表示的是创建的函数是全局范围内生效。

**2. `AGGREGATE`**

> 如果有此项，表示的是创建的函数是一个聚合函数。

**3. `TABLES`**

> 如果有此项，表示的是创建的函数是一个表函数。

**4. `ALIAS`**

> 如果有此项，表示的是创建的函数是一个别名函数。

> 如果没有选择上述代表函数的参数，则表示创建的函数是一个标量函数

**5. `<inter_type>`**

> 用于表示聚合函数中间阶段的数据类型。

**6. `<param>`**

> 用于表示别名函数的参数，至少包含一个。

**7. `<origin_function>`**

> 用于表示别名函数对应的原始函数。

**8. `<properties>`**

> - `file`: 表示的包含用户 UDF 的 jar 包，当在多机环境时，也可以使用 http 的方式下载 jar 包。这个参数是必须设定的。
> - `symbol`: 表示的是包含 UDF 类的类名。这个参数是必须设定的
> - `type`: 表示的 UDF 调用类型，默认为 Native，使用 Java UDF 时传 JAVA_UDF。
> - `always_nullable`：表示的 UDF 返回结果中是否有可能出现 NULL 值，是可选参数，默认值为 true。
> - `volatility`：表示标量 Java UDF 或标量 Python UDF 的易变性，可选参数，默认值为 `volatile`。可选值为 `immutable`、`stable`、`volatile`。`immutable` 表示相同输入在不同语句中始终产生相同输出，且实现不依赖当前时间、随机数或外部可变状态。`stable` 表示相同输入在单条语句内产生相同结果，但不同语句之间结果可能变化，典型例子有 `now()` 和 `current_timestamp()`。`volatile` 表示每次调用的结果都可能变化，典型例子有 `uuid()` 和 `random()`。正确标记后，优化器可以更安全地处理查询改写；错误标记可能导致错误的查询结果。UDAF、UDTF、RPC 和别名函数不支持该属性。

## 权限控制

执行此命令需要用户拥有 `ADMIN_PRIV` 权限。

## 示例

1. 创建一个自定义 UDF 函数，更多详细信息可以查看[JAVA-UDF](../../../query-data/udf/java-user-defined-function)

    ```sql
    CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
       "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
       "symbol"="org.apache.doris.udf.AddOne",
       "always_nullable"="true",
       "type"="JAVA_UDF",
       "volatility"="immutable"
   );
   ```

2. 创建一个自定义 UDAF 函数。`volatility` 属性不支持 UDAF。

    ```sql
    CREATE AGGREGATE FUNCTION simple_sum(INT) RETURNS INT PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.demo.SimpleDemo",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

3. 创建一个自定义 UDTF 函数。`volatility` 属性不支持 UDTF。

    ```sql
    CREATE TABLES FUNCTION java-utdf(string, string) RETURNS array<string> PROPERTIES (
        "file"="file:///pathTo/java-udaf.jar",
        "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
        "always_nullable"="true",
        "type"="JAVA_UDF"
    );
    ```

4. 创建一个自定义别名函数，更多信息可以查看[别名函数](../../../query-data/udf/alias-function)

    ```sql
    CREATE ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
    ```

5. 创建一个全局自定义别名函数

    ```sql
    CREATE GLOBAL ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
    ```

6. 创建一个 volatile Python UDF。像 `uuid.uuid4()` 这类依赖随机数的函数，应保持 `volatility` 的默认值 `volatile`，不要错误标记为 `immutable`。

    ```sql
    CREATE TABLE cte_uuid_seed (id INT) ENGINE=OLAP DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ("replication_num" = "1");
    INSERT INTO cte_uuid_seed VALUES (1),(2),(3);

    DROP FUNCTION IF EXISTS py_uuid_token(INT);
    CREATE FUNCTION py_uuid_token(INT)
    RETURNS STRING
    PROPERTIES (
        "type" = "PYTHON_UDF",
        "symbol" = "py_uuid_token_impl",
        "always_nullable" = "false",
        "runtime_version" = "3.12.11",
        "volatility" = "volatile"
    )
    AS $$
    import uuid
    def py_uuid_token_impl(x):
        return f"{x}-{uuid.uuid4()}"
    $$;

    SET enable_cte_materialize = true;
    SET inline_cte_referenced_threshold = 10;

    WITH cte AS (SELECT id, py_uuid_token(id) AS token FROM cte_uuid_seed)
    SELECT id, COUNT(DISTINCT token) AS distinct_tokens
    FROM (SELECT id, token FROM cte UNION ALL SELECT id, token FROM cte) u
    GROUP BY id ORDER BY id;
    ```

    正确结果：

    ```text
    +------+-----------------+
    | id   | distinct_tokens |
    +------+-----------------+
    |    1 |               1 |
    |    2 |               1 |
    |    3 |               1 |
    +------+-----------------+
    ```

    对于上述函数，不应写成下面这样：

    ```sql
    DROP FUNCTION IF EXISTS py_uuid_token(INT);
    CREATE FUNCTION py_uuid_token(INT)
    RETURNS STRING
    PROPERTIES (
        "type" = "PYTHON_UDF",
        "symbol" = "py_uuid_token_impl",
        "always_nullable" = "false",
        "runtime_version" = "3.12.11",
        "volatility" = "immutable"
    )
    AS $$
    import uuid
    def py_uuid_token_impl(x):
        return f"{x}-{uuid.uuid4()}"
    $$;
    ```

    重新执行同一条查询：

    ```sql
    WITH cte AS (SELECT id, py_uuid_token(id) AS token FROM cte_uuid_seed)
    SELECT id, COUNT(DISTINCT token) AS distinct_tokens
    FROM (SELECT id, token FROM cte UNION ALL SELECT id, token FROM cte) u
    GROUP BY id ORDER BY id;
    ```

    错误结果：

    ```text
    +------+-----------------+
    | id   | distinct_tokens |
    +------+-----------------+
    |    1 |               2 |
    |    2 |               2 |
    |    3 |               2 |
    +------+-----------------+
    ```

    错误原因：
    `py_uuid_token` 是 volatile 函数，`uuid.uuid4()` 每次调用都会生成新值。如果错误地将它标记为 `volatility = immutable`，优化器可能会把重复引用视为可安全改写，并选择在 `UNION ALL` 两侧分别执行 UDF 的计划。这样同一个 `id` 会生成两个不同的 `token`，`COUNT(DISTINCT token)` 就会从 `1` 变成 `2`。
