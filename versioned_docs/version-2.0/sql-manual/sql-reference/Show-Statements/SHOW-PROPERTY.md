---
{
    "title": "SHOW-PROPERTY",
    "language": "en"
}
---

## SHOW-PROPERTY

### Description

This statement is used to view the attributes of the user

```
SHOW PROPERTY [FOR user] [LIKE key]
SHOW ALL PROPERTIES [LIKE key]
```

* `user`

    View the attributes of the specified user. If not specified, check the current user's.

* `LIKE`

    Fuzzy matching can be done by attribute name.

* `ALL`

  View the properties of all users (supported since version 2.0.3)

Return result description:

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

    Property name.

* `Value`

    Attribute value.


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

  username.

* `Properties`

  Key: value corresponding to each property of the user.

### Example

1. View the attributes of the jack user

    ```sql
    SHOW PROPERTY FOR'jack';
    ```

2. View the attribute of jack user connection limit

    ```sql
    SHOW PROPERTY FOR'jack' LIKE'%connection%';
    ```

3. View all users importing cluster related properties

   ```sql
   SHOW ALL PROPERTIES LIKE '%load_cluster%'
   ```

### Keywords

    SHOW, PROPERTY, ALL

### Best Practice
