---
{
    "title": "PLAN REPLAYER DUMP",
    "language": "zh-CN",
    "description": "PLAN REPLAYER DUMP 是 Doris 用户用来生成执行规划诊断文件的工具。用于捕捉查询优化器的状态和输入数据，方便调试和分析查询优化问题。其输出为对应诊断文件的 http 地址。"
}
---

## 描述

PLAN REPLAYER DUMP 是 Doris 用户用来生成执行规划诊断文件的工具。用于捕捉查询优化器的状态和输入数据，方便调试和分析查询优化问题。其输出为对应诊断文件的 http 地址。


## 语法


```sql
PLAN REPLAYER DUMP <query>
```

## 必选参数

`<query>`

- 指的是对应的 DML 里面的 query 语句
- 如果不是 query 语句则会报 parse 错误
- 有关更多详细信息，请参阅[SELECT](https://doris.apache.org/zh-CN/docs/sql-manual/sql-statements/Data-Manipulation-Statements/Manipulation/SELECT/)语法

## 权限控制


执行此 SQL 命令的用户必须至少具有以下权限：


| 权限（Privilege） | 对象（Object）            | 说明（Notes）                                                |
| :---------------- | :------------------------ | :----------------------------------------------------------- |
| SELECT_PRIV       | 表（Table）, 视图（View） | 当执行 <query_sql_statement> 时，需要拥有被查询的表，视图或物化视图的 SELECT_PRIV 权限 |


## 示例


### 基础示例


```sql
create database test_replayer;
use database test_replayer;
create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
plan replayer dump select * from t1;
```

执行结果示例：


```sql
+-------------------------------------------------------------------------------+
| Plan Replayer dump url                                                        |
| Plan Replayer dump url |
+-------------------------------------------------------------------------------+
| http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec |
+-------------------------------------------------------------------------------+
```

可以使用 curl 或者 wget 获取对应的文件，例如：


```sql
wget http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```

当需要权限的时候可以把用户名和密码包含在


```sql
wget --header="Authorization: Basic $(echo -n 'root:' | base64)" http://127.0.0.1:8030/api/minidump?query_id=6e7441f741e94afd-ad3ba69429ad18ec
```
```

