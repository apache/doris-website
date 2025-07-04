---
{
    "title": "SHOW-PROPERTY",
    "language": "zh-CN"
}
---

## SHOW-PROPERTY

### Name

SHOW PROPERTY

## 描述

该语句用于查看用户的属性

语法：

```sql
SHOW PROPERTY [FOR user] [LIKE key]
SHOW ALL PROPERTIES [LIKE key]
```

* `user`

   查看指定用户的属性。 如果未指定，请检查当前用户的。

* `LIKE`

   模糊匹配可以通过属性名来完成。

* `ALL` 

   查看所有用户的属性(从2.0.3版本开始支持)

返回结果说明：

```sql
mysql> show property like'%connection%';
+----------------------+-------+
| Key                  | Value |
+----------------------+-------+
| max_user_connections | 100   |
+----------------------+-------+
1 row in set (0.01 sec)
```

* `Key`

  属性名.

* `Value`

  属性值.


```sql
mysql> show all properties like "%connection%";
+-------------------+--------------------------------------+
| User              | Properties                           |
+-------------------+--------------------------------------+
| root              | {"max_user_connections": "100"}      |
| admin             | {"max_user_connections": "100"}      |
| default_cluster:a | {"max_user_connections": "1000"}     |
+-------------------+--------------------------------------+
```

* `User`

  用户名.

* `Properties`

  对应用户各个property的key:value.

## 举例

1. 查看 jack 用户的属性

   ```sql
   SHOW PROPERTY FOR 'jack'
   ```

2. 查看 jack 用户导入cluster相关属性

   ```sql
   SHOW PROPERTY FOR 'jack' LIKE '%load_cluster%'
   ```

3. 查看所有用户导入cluster相关属性

   ```sql
   SHOW ALL PROPERTIES LIKE '%load_cluster%'
   ```

### Keywords

    SHOW, PROPERTY, ALL

### Best Practice
