---
{
    "title": "DROP-FUNCTION",
    "language": "zh-CN"
}
---

## DROP-FUNCTION

### Name

DROP FUNCTION

## 描述

删除一个自定义函数。函数的名字、参数类型完全一致才能够被删除

语法：

```sql
DROP [GLOBAL] FUNCTION function_name
    (arg_type [, ...])
```

参数说明：

- `function_name`: 要删除函数的名字
- `arg_type`: 要删除函数的参数列表

## 举例

1. 删除掉一个函数

   ```sql
   DROP FUNCTION my_add(INT, INT)
   ```
2. 删除掉一个全局函数

    ```sql
    DROP GLOBAL FUNCTION my_add(INT, INT)
    ```      

### Keywords

    DROP, FUNCTION

### Best Practice

