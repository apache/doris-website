---
{
    "title": "DROP-USER",
    "language": "en"
}
---

## DROP-USER

### Name

DROP USER

### Description

Delete a user

```sql
  DROP USER 'user_identity'

     `user_identity`:
    
         user@'host'
         user@['domain']
```

  Delete the specified user identitiy.

### Example

1. Delete user jack@'192.%'

    ```sql
    DROP USER 'jack'@'192.%'
    ```

### Keywords

    DROP, USER

### Best Practice

