---
{
    "title": "CLEAN LABEL",
    "language": "zh-CN",
    "description": "用于手动清理历史导入作业的 Label。清理后，Label 可以重复使用。 常用于一些程序设置的自动导入任务，重复执行时，设置导入固定字符串的 label， 在每次导入任务发起前，先执行清理该 label 的语句。"
}
---

## 描述

用于手动清理历史导入作业的 Label。清理后，Label 可以重复使用。
常用于一些程序设置的自动导入任务，重复执行时，设置导入固定字符串的 label，
在每次导入任务发起前，先执行清理该 label 的语句。

## 语法  

```sql
CLEAN LABEL [ <label> ] FROM <db_name>;
```

## 必选参数

**1. `<db_name>`**  
  label 归属库名。

## 可选参数

**1. `<label>`**    
	要清理的 label。如果省略，默认为当前数据库所有的 label。  

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象          | 说明           |
|:-----------|:------------|:-------------|
| ALTER_PRIV | 库（Database） | 需要对数据库的修改权限。 |


## 示例

- 清理 db1 中，Label 为 label1 的导入作业。

	```sql
	CLEAN LABEL label1 FROM db1;
	```

- 清理 db1 中所有历史 Label。

	```sql
	CLEAN LABEL FROM db1;
	```


