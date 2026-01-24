---
{
    "title": "MYSQL LOAD",
    "language": "zh-CN",
    "description": "使用 MySql 客户端将本地数据文件导入到 Doris 中。MySQL Load 是一种同步导入方式，执行导入后即返回导入结果。可以通过 LOAD DATA 语句的返回结果判断导入是否成功。MySQL Load 可以保证一批导入任务的原子性，要么全部导入成功，要么全部导入失败。"
}
---

## 描述

使用 MySql 客户端将本地数据文件导入到 Doris 中。MySQL Load 是一种同步导入方式，执行导入后即返回导入结果。可以通过 LOAD DATA 语句的返回结果判断导入是否成功。MySQL Load 可以保证一批导入任务的原子性，要么全部导入成功，要么全部导入失败。

## 语法

```sql
LOAD DATA
[ LOCAL ]
INFILE "<file_name>"
INTO TABLE "<tbl_name>"
[ PARTITION (<partition_name> [, ... ]) ]
[ COLUMNS TERMINATED BY "<column_separator>" ]
[ LINES TERMINATED BY "<line_delimiter>" ]
[ IGNORE <number> {LINES | ROWS} ]
[ (<col_name_or_user_var> [, ... ] ) ]
[ SET (col_name={<expr> | DEFAULT} [, col_name={<expr> | DEFAULT}] ...) ]
[ PROPERTIES ("<key>" = "<value>" [ , ... ]) ]
```

## 必选参数

**1. `<file_name>`**

> 填写本地文件路径，可以是相对路径，也可以是绝对路径。目前只支持单个文件，不支持多个文件。

**2. `<tbl_name>`**

> 表名可以指定数据库名，如案例所示。也可以省略，则会使用当前用户所在的数据库。

## 可选参数

**1. `LOCAL`**

> 指定`LOCAL`表示读取客户端文件。不指定表示读取 FE 服务端本地文件。导入 FE 本地文件的功能默认是关闭的，需要在 FE 节点上设置`mysql_load_server_secure_path`来指定安全路径，才能打开该功能。

**2. `<partition_name>`**

> 支持指定多个分区导入，多个分区逗号隔开。

**3. `<column_separator>`**

> 指定列分隔符。

**4. `<line_delimiter>`**

> 指定行分隔符。

**5. `IGNORE <number> { LINES | ROWS }`**

> 用户跳过 CSV 的表头，可以跳过任意行数。该语法也可以用`IGNORE num ROWS`代替。

**6. `<col_name_or_user_var>`**

> 列映射语法，具体参数详见[导入的数据转换](../../../../data-operate/import/import-way/mysql-load-manual.md) 的列映射章节。

**7.  `properties ("<key>"="<value>",...)`**  


| 参数               | 参数说明                                                 |
| ---------------------- | ------------------------------------------------------------ |
| max_filter_ratio   | 最大容忍可过滤（数据不规范等原因）的数据比例，默认零容忍。   |
| timeout            | 指定导入的超时时间，单位秒。默认是 600 秒。可设置范围为 1 秒 ~ 259200 秒。 |
| strict_mode        | 用户指定此次导入是否开启严格模式，默认为关闭。               |
| timezone           | 指定本次导入所使用的时区，默认为东八区。该参数会影响所有导入涉及的和时区有关的函数结果。 |
| exec_mem_limit     | 导入内存限制，默认为 2GB，单位为字节。                       |
| trim_double_quotes | 布尔类型，默认值为 false，为 true 时表示裁剪掉导入文件每个字段最外层的双引号。 |
| enclose            | 包围符。当 csv 数据字段中含有行分隔符或列分隔符时，为防止意外截断，可指定单字节字符作为包围符起到保护作用。例如列分隔符为","，包围符为"'"，数据为"a,'b,c'"，则"b,c"会被解析为一个字段。注意：当 enclose 设置为`"`时，trim_double_quotes 一定要设置为 true。 |
| escape             | 转义符。用于转义在 csv 字段中出现的与包围符相同的字符。例如数据为"a,'b,'c'"，包围符为"'"，希望"b,'c"被作为一个字段解析，则需要指定单字节转义符，例如""，然后将数据修改为"a,'b,'c'"。 | 

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV        | 表（Table）    | 对指定的库表的导入权限 |

## 注意事项

- MySQL Load 以语法`LOAD DATA`开头，无须指定 LABEL

## 举例

1. 将客户端本地文件'testData'中的数据导入到数据库'testDb'中'testTbl'的表。指定超时时间为 100 秒

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```

2. 将服务端本地文件'/root/testData'(需设置 FE 配置`mysql_load_server_secure_path`为`/root`) 中的数据导入到数据库'testDb'中'testTbl'的表。指定超时时间为 100 秒

    ```sql
    LOAD DATA
    INFILE '/root/testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("timeout"="100")
    ```

3. 将客户端本地文件'testData'中的数据导入到数据库'testDb'中'testTbl'的表，允许 20% 的错误率

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("max_filter_ratio"="0.2")
    ```

4. 将客户端本地文件'testData'中的数据导入到数据库'testDb'中'testTbl'的表，允许 20% 的错误率，并且指定文件的列名

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    (k2, k1, v1)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```

5. 将本地文件'testData'中的数据导入到数据库'testDb'中'testTbl'的表中的 p1, p2 分区，允许 20% 的错误率。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    PROPERTIES ("max_filter_ratio"="0.2")
    ```

6. 将本地行分隔符为`0102`,列分隔符为`0304`的 CSV 文件'testData'中的数据导入到数据库'testDb'中'testTbl'的表中。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    COLUMNS TERMINATED BY '0304'
    LINES TERMINATED BY '0102'
    ```

7. 将本地文件'testData'中的数据导入到数据库'testDb'中'testTbl'的表中的 p1, p2 分区，并跳过前面 3 行。

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PARTITION (p1, p2)
    IGNORE 1 LINES
    ```

8. 导入数据进行严格模式过滤，并设置时区为 Africa/Abidjan

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("strict_mode"="true", "timezone"="Africa/Abidjan")
    ```

9. 导入数据进行限制导入内存为 10GB, 并在 10 分钟超时

    ```sql
    LOAD DATA LOCAL
    INFILE 'testData'
    INTO TABLE testDb.testTbl
    PROPERTIES ("exec_mem_limit"="10737418240", "timeout"="600")
    ```