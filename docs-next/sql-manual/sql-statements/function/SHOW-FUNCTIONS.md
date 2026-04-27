---
{
    "title": "SHOW FUNCTIONS",
    "language": "en",
    "description": "View all custom and system provided functions under the database."
}
---

## Description

View all custom and system provided functions under the database.

## Syntax

```sql
SHOW [ FULL ] [ BUILTIN ] FUNCTIONS [ { IN | FROM } <db> ]  [ LIKE '<function_pattern>' ]
```
## Varaint Syntax

```sql
SHOW GLOBAL [ FULL ] FUNCTIONS [ LIKE '<function_pattern>' ]
```

## Required Parameters

**1. `<function_pattern>`**

> Matching pattern rules used to filter function names

## Optional Parameters

**1. `FULL`**

> FULL is an optional parameter.
>
> This parameter indicates the detailed information about the function.

**2. `BUILTIN`**

> BUILTIN is an optional parameter.
>
> This parameter indicates that the functions provided by the system need to be displayed

**3. `<db>`**

> db is an optional parameter.
>
> This parameter indicates the query under the specified database

## Return Value

| Column | Description         |
| -- |------------|
| Signature | Function name and parameter type   |
| Return Type | The data type of the value returned by the function |
| Function Type | Type of function      |
| Intermediate Type | Intermediate result type     |
| Properties | Detailed properties of a function    |

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege  | Object   | Notes       |
|:--------------|:---------|:--------------|
| SHOW_PRIV    | Function | You need to have the show permission on this function |

## Examples

```sql
show full functions in testDb
```

```text
*************************** 1. row ***************************
Signature: my_add(INT,INT)
Return Type: INT
Function Type: Scalar
Intermediate Type: NULL
Properties: {"symbol":"_ZN9doris_udf6AddUdfEPNS_15FunctionContextERKNS_6IntValES4_","object_file":"http://host:port/libudfsample.so","md5":"cfe7a362d10f3aaf6c49974ee0f1f878"}
*************************** 2. row ***************************
Signature: my_count(BIGINT)
Return Type: BIGINT
Function Type: Aggregate
Intermediate Type: NULL
Properties: {"object_file":"http://host:port/libudasample.so","finalize_fn":"_ZN9doris_udf13CountFinalizeEPNS_15FunctionContextERKNS_9BigIntValE","init_fn":"_ZN9doris_udf9CountInitEPNS_15FunctionContextEPNS_9BigIntValE","merge_fn":"_ZN9doris_udf10CountMergeEPNS_15FunctionContextERKNS_9BigIntValEPS2_","md5":"37d185f80f95569e2676da3d5b5b9d2f","update_fn":"_ZN9doris_udf11CountUpdateEPNS_15FunctionContextERKNS_6IntValEPNS_9BigIntValE"}
*************************** 3. row ***************************
Signature: id_masking(BIGINT)
Return Type: VARCHAR
Function Type: Alias
Intermediate Type: NULL
Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```

```sql
show builtin functions in testDb like 'year%';
```

```text
+---------------+
| Function Name |
+---------------+
| year          |
| years_add     |
| years_diff    |
| years_sub     |
+---------------+
```

```sql
show global full functions
```

```text
*************************** 1. row ***************************
        Signature: decimal(ALL, INT, INT)
      Return Type: VARCHAR
    Function Type: Alias
Intermediate Type: NULL
       Properties: {"parameter":"col, precision, scale","origin_function":"CAST(`col` AS decimal(`precision`, `scale`))"}
*************************** 2. row ***************************
        Signature: id_masking(BIGINT)
      Return Type: VARCHAR
    Function Type: Alias
Intermediate Type: NULL
       Properties: {"parameter":"id","origin_function":"concat(left(`id`, 3), `****`, right(`id`, 4))"}
```

```sql
show global functions
```

```text
+---------------+
| Function Name |
+---------------+
| decimal       |
| id_masking    |
+---------------+
```
