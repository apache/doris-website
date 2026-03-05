---
{
    "title": "CREATE SQL_BLOCK_RULE",
    "language": "zh-CN",
    "description": "该语句用于创建 SQL 阻止规则"
}
---

## 描述

该语句用于创建 SQL 阻止规则

SQL_BLOCK_RULE 可用于限制用户执行某些操作，比如避免扫描大量数据等

## 语法

```sql
CREATE SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```

## 必选参数

**1. `<rule_name>`**

> 规则的名字

**2. `<property>`**

> 规则的属性，可以分为三类：执行 SQL 类，扫描限制类和开关类。
>
> 执行 SQL 类和扫描限制类是互斥的，也就是说一个 SQL_BLOCK_RULE 只能限制其中一种。
>
> **执行 SQL 类：**
>
>包含两种，分别代表正则匹配和精准匹配，两种只能选择其中一个。
>
> - sql：匹配规则 (基于正则匹配，特殊字符需要转译，如`select *`使用`select \\*`)，用户在执行 sql 时，系统会把这里设置的 sql 作为正则对用户提交的 sql 进行匹配，如果能匹配上，会阻止 sql 的运行。
>
> - sqlHash: sql 的 md5 摘要值，这里主要是配合慢日志来使用，用户无需自己计算摘要值，例如慢日志中发现某个 sql 执行的很慢，可以在`fe.audit.log`复制`SqlHash`，创建 SQL_BLOCK_RULE 限制这个 sql 运行。
>
> **扫描限制类**
>
> 用户发起查询的时候，查询优化器会计算出每张表需要扫描的 partition 数，tablet 数 和扫描的数据行数。以下属性分别对这三个数字进行限制，可以同时设置，也可以只限制部分
> 
> - partition_num: 一个表将扫描的最大 partition 数量
> - tablet_num: 一个表将扫描的最大 tablet 数量
> - cardinality: 一个表将扫描的数据行数
>
> **开关类**
>
> - global：是否全局 (所有用户) 生效，默认为 false。不设置为 true 的话，需要通过 set property 对某个用户生效
> - enable：是否开启阻止规则，默认为 true

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象 | 说明 |
| :---------------- | :------------- | :------------ |
| ADMIN_PRIV      | 全局           |               |

## 示例

1. 创建不允许所有用户执行 `select * from order_analysis`的规则

    ```sql
    CREATE SQL_BLOCK_RULE test_rule 
    PROPERTIES(
    "sql"="select \\* from order_analysis",
    "global"="true",
    "enable"="true"
    );
    ```

   当我们去执行刚才定义在规则里的 sql 时就会返回异常错误，示例如下：

    ```sql
    mysql> select * from order_analysis;
    ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: order_analysis_rule
    ```

2. 创建不允许对同一个表扫描的分区数量超过 30 并且查询的数据量不能超过 100 亿行

    ```sql
    CREATE SQL_BLOCK_RULE test_rule2 
    PROPERTIES
    (
        "partition_num" = "30",
        "cardinality" = "10000000000",
        "global" = "true",
        "enable" = "true"
    );
    ```
3. SQL 的匹配是基于正则的，如果想匹配更多模式的 SQL 需要写相应的正则，比如忽略 SQL 中空格，还有 order 开头的表都不能查询，示例如下：
   
    ```sql
    CREATE SQL_BLOCK_RULE test_rule3
    PROPERTIES(
      "sql"="\\s*select\\s*\\*\\s*from order_\\w*\\s*",
      "global"="true",
      "enable"="true"
    );
    ```

4. 创建只针对部分用户的规则
    
    ```sql
      CREATE SQL_BLOCK_RULE test_rule4
      PROPERTIES(
        "sql"="select \\* from order_analysis",
        "global"="false",
        "enable"="true"
      );
    ```

    将规则作用于用户 jack

    ```sql
    SET PROPERTY FOR 'jack' 'sql_block_rules' = 'test_rule4';
    ```

## 其它

常用正则表达式如下：

```text
. ：匹配任何单个字符，除了换行符 `\n`。

* ：匹配前面的元素零次或多次。例如，a* 匹配零个或多个 'a'。

+ ：匹配前面的元素一次或多次。例如，a+ 匹配一个或多个 'a'。

? ：匹配前面的元素零次或一次。例如，a? 匹配零个或一个 'a'。

[] ：用于定义字符集合。例如，[aeiou] 匹配任何一个元音字母。

[^] ：在字符集合中使用 ^ 表示否定，匹配不在集合内的字符。例如，[^0-9] 匹配任何非数字字符。

() ：用于分组表达式，可以对其应用量词。例如，(ab)+ 匹配连续的 'ab'。

| ：用于表示或逻辑。例如，a|b 匹配 'a' 或 'b'。

^ ：匹配字符串的开头。例如，^abc 匹配以 'abc' 开头的字符串。

$ ：匹配字符串的结尾。例如，xyz$ 匹配以 'xyz' 结尾的字符串。

\ ：用于转义特殊字符，使其变成普通字符。例如，\\. 匹配句点字符 '.'。

\s：匹配任何空白字符，包括空格、制表符、换行符等。

\d：匹配任何数字字符，相当于 [0-9]。

\w：匹配任何单词字符，包括字母、数字和下划线，相当于 [a-zA-Z0-9_]。
```