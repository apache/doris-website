---
{
    "title": "Cast to STRUCT Types",
    "language": "en"
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

#### Strict Mode

##### Rule Description

For each element in the STRUCT, a Cast from Other Type To Type is performed. The Cast is also in strict mode.

##### Examples

| Input STRUCT | Conversion Result | Comment |
| --- | --- | --- |
| {"a":"123","b":"456"} | Cast to STRUCT\<a:int, b:int\>: {"a":123, "b":456} | "123" and "456" can be converted to Int |
| {"a":"abc","b":"123"} | Error | "abc" cannot be converted to Int |
| {"a":null,"b":"123"} | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":123} | The Cast result of null is still null |
| {"name":"Mike","scores":[90,85,92]} | Cast to STRUCT\<name:string, scores:array<int>\>: {"name":"Mike", "scores":[90,85,92]} | STRUCT with array conversion |

#### Non-Strict Mode

##### Rule Description

For each element in the STRUCT, a Cast from Other Type To Type is performed. The Cast is also in non-strict mode.

##### Examples

| Input STRUCT | Conversion Result | Comment |
| --- | --- | --- |
| {"a":"123","b":"456"} | Cast to STRUCT\<a:int, b:int\>: {"a":123, "b":456} | "123" and "456" can be converted to Int |
| {"a":"abc","b":"123"} | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":123} | "abc" cannot be converted to Int, converted to null |
| {"a":null,"b":"123"} | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":123} | The Cast result of null is still null |
| {"name":"Mike","scores":["ninety",85,"ninety-two"]} | Cast to STRUCT\<name:string, scores:array<int>\>: {"name":"Mike", "scores":[null,85,null]} | Array elements that cannot be converted to int become null |
