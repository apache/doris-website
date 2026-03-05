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
SHOW PROPERTY [FOR user] [LIKE key];
```

* `user`

    View the attributes of the specified user. If not specified, check the current user's.

* `LIKE`

    Fuzzy matching can be done by attribute name.

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

### Example

1. View the attributes of the jack user

    ```sql
    SHOW PROPERTY FOR'jack';
    ```

2. View the attribute of jack user connection limit

    ```sql
    SHOW PROPERTY FOR'jack' LIKE'%connection%';
    ```

### Keywords

    SHOW, PROPERTY

### Best Practice
