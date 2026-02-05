---
{
    "title": "Cast to STRUCT Types",
    "language": "en",
    "description": "STRUCT type is used to store and process structured data, which can contain fields of different types, each with a name and corresponding value."
}
---

STRUCT type is used to store and process structured data, which can contain fields of different types, each with a name and corresponding value. STRUCT can nest other complex types such as ARRAY, MAP, or other STRUCTs.

## Cast to STRUCT

### FROM String

#### Strict Mode

##### BNF Definition

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### Rule Description

1. The textual representation of a STRUCT must begin with a left brace `{` and end with a right brace `}`.
2. Empty STRUCTs are directly represented as `{}`.
3. Field-value pairs within the STRUCT are separated by commas `,`.
4. Each field-value pair consists of an optional field name, a colon `:`, and a value, in the order "fieldname:value" or simply "value".
5. Field-value pairs must either all use the "fieldname:value" format or all use the "value" format.
6. Field names and values can optionally be enclosed in matching single quotes (`'`) or double quotes (`"`). The content inside the quotes is treated as a single entity.
7. Whitespace is allowed before and after elements within the STRUCT.
8. During parsing, parts that match `<value-token>` continue to apply the parsing rules of the value type. If there are `<field-token>` parts, they must match the number and order of names defined in the STRUCT.
9. Elements can use "null" to represent a null value.

If the STRUCT format does not meet the requirements, an error is reported, for example:
1. The number of field-value pairs does not match the number defined in the STRUCT.
2. The order of field-values does not match the order defined in the STRUCT.
3. Some field-value pairs have field names while others do not (they must either all have field names or none have field names).

If a value in the STRUCT does not meet the requirements of the corresponding type, an error is reported.

##### Examples

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | Valid empty STRUCT |
| "  {}" | Error | Does not start with a brace, parsing fails |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | Valid STRUCT with field names |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Field names can be quoted or unquoted |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | No field names provided, parsing succeeds |
| '{a:1,3.1,c:100}' | Error | Mixed format with some having field names and others not |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: Error | Number of field-value pairs does not match defined count |
| '{b:1,a:1}' | Cast to STRUCT\<a:int, b:double\>: Error | Incorrect order of fields |
| '{"a":"abc","b":1}' | Cast to STRUCT\<a:int, b:int\>: Error | "abc" cannot be converted to int type |
| '{null,1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | Valid STRUCT with null value |
| '{"name":"John","age":25}' | Cast to STRUCT\<name:string, age:int\>: {"name":"John", "age":25} | STRUCT with string values |
| '{{"x":1,"y":2},3}' | Cast to STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":1,"y":2}, "z":3} | Nested STRUCT structure |

#### Non-Strict Mode

##### BNF Definition

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### Rule Description

1. The textual representation of a STRUCT must begin with a left brace `{` and end with a right brace `}`.
2. Empty STRUCTs are directly represented as `{}`.
3. Field-value pairs within the STRUCT are separated by commas `,`.
4. Each field-value pair consists of an optional field name, a colon `:`, and a value, in the order "fieldname:value" or simply "value".
5. Field-value pairs must either all use the "fieldname:value" format or all use the "value" format.
6. Field names and values can optionally be enclosed in matching single quotes (`'`) or double quotes (`"`). The content inside the quotes is treated as a single entity.
7. Whitespace is allowed before and after elements within the STRUCT.
8. During parsing, parts that match `<value-token>` continue to apply the parsing rules of the value type. If there are `<field-token>` parts, they must match the number and order of names defined in the STRUCT.
9. Elements can use "null" to represent a null value.

If the STRUCT format does not meet the requirements, NULL is returned, for example:
1. The number of field-value pairs does not match the number defined in the STRUCT.
2. The order of field-values does not match the order defined in the STRUCT.
3. Some field-value pairs have field names while others do not (they must either all have field names or none have field names).

If a value in the STRUCT does not meet the requirements of the corresponding type, the corresponding position is set to null.

##### Examples

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | Valid empty STRUCT |
| "  {}" | NULL | Does not start with a brace, parsing fails |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | Valid STRUCT with field names |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | Field names can be quoted or unquoted |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | No field names provided, parsing succeeds |
| '{a:1,3.1,c:100}' | NULL | Mixed format with some having field names and others not |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: NULL | Number of field-value pairs does not match defined count |
| '{b:1,a:1}' | Cast to STRUCT\<a:int, b:double\>: NULL | Incorrect order of fields |
| '{"a":"abc","b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | "abc" cannot be converted to int type, position set to null |
| '{null,1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | Valid STRUCT with null value |
| '{"name":"John","age":"twenty-five"}' | Cast to STRUCT\<name:string, age:int\>: {"name":"John", "age":null} | "twenty-five" cannot be converted to int type, position set to null |
| '{{"x":"one","y":2},3}' | Cast to STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":null,"y":2}, "z":3} | In nested STRUCT, failed conversion results in null |

### FROM STRUCT\<Other Type\>

When the source data is of STRUCT type and the target is also of STRUCT type, the following conditions must be met:

1. The source STRUCT and target STRUCT must have the same number of elements (fields)
2. Each element in the source STRUCT will be converted to the corresponding element type in the target STRUCT in sequence

If the above conditions are not met, such as when the number of elements doesn't match, the conversion will not be possible.

#### Strict Mode

##### Rule Description

For each element in the STRUCT, a Cast from Other Type To Type is performed. The Cast is also in strict mode.

##### Examples

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} Type: struct<a:tinyint,b:varchar(3)>

-- Normal CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- Fields count doesn't match
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- Element in STRUCT doesn't have a corresponding CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- CAST is based on the defined order, not field names
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- Element CAST fails, the whole CAST reports an error
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]parse number fail, string: 'abc'
```

#### Non-Strict Mode

##### Rule Description

For each element in the STRUCT, a Cast from Other Type To Type is performed. The Cast is also in non-strict mode.

##### Examples

```sql
-- Create a simple STRUCT type variable
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- Result: {"a":123,"b":"abc"} Type: struct<a:tinyint,b:varchar(3)>

-- Normal CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- Fields count doesn't match
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- Element in STRUCT doesn't have a corresponding CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- CAST is based on the defined order, not field names
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- Element CAST fails, the corresponding element is set to null
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+-----------------------+
| renamed_struct        |
+-----------------------+
| {"b":"123", "a":null} |
+-----------------------+
```
