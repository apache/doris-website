---
{
    "title": "IF",
    "language": "en"
}
---

## if
### description
#### Syntax

`if(boolean condition, type valueTrue, type valueFalseOrNull)`


Returns valueTrue when condition is true, returns valueFalseOrNull otherwise. 

The return type is the type of the result of the valueTrue/valueFalseOrNull expression

### example

```
mysql> select  user_id, if(user_id = 1, "true", "false") test_if from test;
+---------+---------+
| user_id | test_if |
+---------+---------+
| 1       | true    |
| 2       | false   |
+---------+---------+
```
### keywords
IF
