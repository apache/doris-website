---
{
    "title": "Cast to MAP Types",
    "language": "en",
    "description": "MAP type is used to store and process key-value pair data, which can contain various basic types of keys and values,"
}
---

MAP type is used to store and process key-value pair data, which can contain various basic types of keys and values, and can also nest other complex types.

## Cast to MAP

### FROM String

:::caution Behavior Change
Before version 4.0, some strings that didn't meet the MAP format might be converted normally (for example, '{1:1,2}').
Starting from version 4.0, strings that don't meet the MAP format will report an error in strict mode and return NULL in non-strict mode.
:::

#### Strict Mode

##### BNF Definition

```xml
<map>          ::= "{" <map-content>? "}" | <empty-map> 

<empty-map>    ::= "{}"

<map-content>  ::=  <key-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <key-token> <map_key_delimiter> <value-token>)*

<key-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*
<value-token>  ::= <key-token>

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### Rule Description

1. The textual representation of a MAP must begin with a left brace `{` and end with a right brace `}`.
2. Empty MAPs are directly represented as `{}`.
3. Key-value pairs within the MAP are separated by commas `,`.
4. Each key-value pair consists of a key, a colon `:`, and a value, in the order "key:value".
5. Keys and values can optionally be enclosed in matching single quotes (`'`) or double quotes (`"`). The content inside the quotes is treated as a single entity.
6. Whitespace is allowed before and after elements within the MAP.
7. During parsing, parts that match `<key-token>` continue to apply the parsing rules of type K; parts that match `<value-token>` continue to apply the parsing rules of type V. These applied BNF rules and parsing logic are still considered part of the current MAP<K, V>'s BNF and parsing logic, with corresponding error handling and result transfer to the current MAP<K, V>'s behavior and results.
8. Elements can use "null" to represent a null value.

If the MAP format is not met, or if the key/value in key-value pairs does not meet the format of the corresponding type, an error is reported.

##### Examples

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | Valid empty MAP |
| "  {}" | Error | Does not start with a brace, parsing fails |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | Valid MAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | Valid MAP containing null value |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | Valid MAP with whitespace |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | Valid MAP using quotes |
| '{   "123":"abc"  }' | Error | "abc" cannot be converted to int type |
| '{ 1:2 ,34, 5:6}' | Error | Does not meet MAP format |

#### Non-Strict Mode

##### BNF Definition

```xml
<map>          ::= "{" <map-content>? "}" | <empty-map> 

<empty-map>    ::= "{}"

<map-content>  ::=  <key-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <key-token> <map_key_delimiter> <value-token>)*

<key-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*
<value-token>  ::= <key-token>

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### Rule Description

1. The textual representation of a MAP must begin with a left brace `{` and end with a right brace `}`.
2. Empty MAPs are directly represented as `{}`.
3. Key-value pairs within the MAP are separated by commas `,`.
4. Each key-value pair consists of a key, a colon `:`, and a value, in the order "key:value".
5. Keys and values can optionally be enclosed in matching single quotes (`'`) or double quotes (`"`). The content inside the quotes is treated as a single entity.
6. Whitespace is allowed before and after elements within the MAP.
7. During parsing, parts that match `<key-token>` continue to apply the parsing rules of type K; parts that match `<value-token>` continue to apply the parsing rules of type V. These applied BNF rules and parsing logic are still considered part of the current MAP<K, V>'s BNF and parsing logic, with corresponding error handling and result transfer to the current MAP<K, V>'s behavior and results.
8. Elements can use "null" to represent a null value.

If the MAP format does not meet the BNF format above, NULL is returned.
If key/value in key-value pairs does not meet the format of the corresponding type, the corresponding position is set to null.

##### Examples

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| "{}" | {} | Valid empty MAP |
| "  {}" | NULL | Does not start with a brace, parsing fails |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | Valid MAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | Valid MAP containing null value |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | Valid MAP with whitespace |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | Valid MAP using quotes |
| '{   "123":"abc"  }' | Cast to MAP\<int,int\>: {123:null} | "abc" cannot be converted to int type, converted to null |
| '{ 1:2 ,34, 5:6}' | NULL | Does not meet MAP format |

### FROM MAP\<Other Type\>

#### Strict Mode

##### Rule Description

For each element in the MAP, a Cast from Other Type To Type is performed. The Cast is also in strict mode.

##### Examples

| Input MAP | Conversion Result | Comment |
| --- | --- | --- |
| {"123":"456"} | Cast to MAP\<int,int\>: {123:456} | "123" and "456" can be converted to Int |
| {"abc":"123"} | Error | "abc" cannot be converted to Int |
| {"123":null} | Cast to MAP\<int,int\>: {123:null} | The Cast result of null is still null |

#### Non-Strict Mode

##### Rule Description

For each element in the MAP, a Cast from Other Type To Type is performed. The Cast is also in non-strict mode.

##### Examples

| Input MAP | Conversion Result | Comment |
| --- | --- | --- |
| {"123":"456"} | Cast to MAP\<int,int\>: {123:456} | "123" and "456" can be converted to Int |
| {"abc":"123"} | Cast to MAP\<int,int\>: {null:123} | "abc" cannot be converted to Int, converted to null |
| {"123":null} | Cast to MAP\<int,int\>: {123:null} | The Cast result of null is still null |
