---
{
    "title": "CREATE SQL_BLOCK_RULE",
    "language": "en"
}
---

## Description

This statement is used to create an SQL block rule.

SQL_BLOCK_RULE can be used to restrict users from performing certain operations, such as avoiding scanning large amounts of data.

## Syntax

```sql
CREATE SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```

## Required Parameters

**1. `<rule_name>`**

> The name of the rule.

**2. `<property>`**

> The properties of the rule can be divided into three categories: SQL execution, scan limitation, and switch.
>
> The SQL execution and scan limitation categories are mutually exclusive, meaning that an SQL block rule can only restrict one of them.
>
>
> **SQL Execution Category**

> There are two types, representing regular expression matching and exact matching, respectively. Only one of them can be chosen.
>
> - sql: The matching rule (based on regular expression matching, special characters need to be escaped, for example, `select *` should be written as `select \\*`). When a user executes an SQL statement, the system will use the SQL set here as a regular expression to match the SQL submitted by the user. If it matches, the execution of the SQL will be blocked.
> - sqlHash: The MD5 hash value of the SQL. This is mainly used in conjunction with slow logs. Users do not need to calculate the hash value themselves. For example, if a slow log shows that a particular SQL is running slowly, you can copy the `SqlHash` from `fe.audit.log` and create an SQL_BLOCK_RULE to restrict the execution of this SQL.
>
> **Scan Limitation Category**
> When a user initiates a query, the query optimizer will calculate the number of partitions, tablets, and rows of data that need to be scanned for each table. The following properties can be used to limit these three numbers, either all at once or just some of them.
> - partition_num: The maximum number of partitions that a table will scan.
> - tablet_num: The maximum number of tablets that a table will scan.
> - cardinality: The number of rows of data that a table will scan.
>
> **Switch Category**
>
> - global: Whether the rule is effective for all users. The default is false. If it is not set to true, the rule needs to be applied to a specific user through the `set property` command.
> - enable: Whether the blocking rule is enabled. The default is true.

## Access Control Requirements

The user executing this SQL command must have at least the following permissions:

| Privilege    | Object | Notes |
| ------------ | ------ | ----- |
| ADMIN_PRIV | Global |       |

## Example

1. Create a rule that prevents all users from executing `select * from order_analysis`

   ```sql
   CREATE SQL_BLOCK_RULE test_rule 
   PROPERTIES(
   "sql"="select \\* from order_analysis",
   "global"="true",
   "enable"="true"
   );
   ```

   When we execute the SQL defined in the rule, it will return an exception error, as shown below:


   ```sql
   mysql> select * from order_analysis;
   ERROR 1064 (HY000): errCode = 2, detailMessage = sql match regex sql block rule: order_analysis_rule
   ```

2. Create a rule that prevents scanning more than 30 partitions of the same table and restricts the query data volume to no more than 10 billion rows


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

3. SQL matching is based on regular expressions. If you want to match more patterns of SQL, you need to write the corresponding regular expressions. For example, ignoring spaces in SQL and preventing queries on tables starting with "order", as shown below:


   ```sql
   CREATE SQL_BLOCK_RULE test_rule3
   PROPERTIES(
     "sql"="\\s*select\\s*\\*\\s*from order_\\w*\\s*",
     "global"="true",
     "enable"="true"
   );
   ```

4. Create a rule that is only applicable to specific users


   ```sql
   CREATE SQL_BLOCK_RULE test_rule4
   PROPERTIES(
       "sql"="select \\* from order_analysis",
       "global"="false",
       "enable"="true"
   );
   ```

   Apply the rule to user jack


   ```sql
   SET PROPERTY FOR 'jack' 'sql_block_rules' = 'test_rule4';
   ```

## Others

Common regular expressions are as follows:

TextCopy

```text
. : Matches any single character except the newline character `\n`.

* : Matches the preceding element zero or more times. For example, a* matches zero or more 'a's.

+ : Matches the preceding element one or more times. For example, a+ matches one or more 'a's.

? : Matches the preceding element zero or one time. For example, a? matches zero or one 'a'.

[] : Defines a character set. For example, [aeiou] matches any vowel.

[^] : When used in a character set, ^ indicates negation, matching characters not in the set. For example, [^0-9] matches any non-digit character.

() : Groups expressions, allowing quantifiers to be applied to them. For example, (ab)+ matches consecutive 'ab's.

| : Indicates logical OR. For example, a|b matches 'a' or 'b'.

^ : Matches the beginning of a string. For example, ^abc matches strings starting with 'abc'.

$ : Matches the end of a string. For example, xyz$ matches strings ending with 'xyz'.

\ : Escapes special characters, making them ordinary characters. For example, \\. matches the period character '.'.

\s : Matches any whitespace character, including spaces, tabs, newlines, etc.

\d : Matches any digit character, equivalent to [0-9].

\w : Matches any word character, including letters, digits, and underscores, equivalent to [a-zA-Z0-9_].
```