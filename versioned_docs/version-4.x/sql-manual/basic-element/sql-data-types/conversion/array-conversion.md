---
{
    "title": "Cast to ARRAY Types",
    "language": "en",
    "description": "ARRAY type is used to store and process array data, which can contain various basic element types such as integers, strings, etc.,"
}
---

ARRAY type is used to store and process array data, which can contain various basic element types such as integers, strings, etc., and can also nest other complex types.

## Cast to ARRAY

### FROM String

:::caution Behavior Change
Before version 4.0, parsing would fail for empty strings between delimiters, for example "[,,]" would return NULL.
Starting from version 4.0, "[,,]" will return [null, null, null] in non-strict mode and report an error in strict mode.
:::


#### Strict Mode

##### BNF Definition

```xml
<array>          ::= "[" <array-content>? "]" | <empty-array> 

<empty-array> ::= "[]"

<array-content>  ::=  <data-token>(<collection-delim> <data-token>)*

<data-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*

<collection-delim>  ::= "," 
```

##### Rule Description

1. The textual representation of an array must begin with a left bracket `[` and end with a right bracket `]`.
2. Empty arrays are directly represented as `[]`.
3. Elements within the array are separated by commas.
4. Whitespace is allowed before and after elements within the array.
5. Array elements can be enclosed in matching single quotes (`'`) or double quotes (`"`).
6. Elements can use "null" to represent a null value.
7. During parsing, parts that match `<data-token>` continue to apply the parsing rules of the target type T.

If the above rules are not met, or if the elements do not meet the requirements of the corresponding type, an error is reported.

##### Examples

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| '[]' | [] | Valid empty array |
| '  []' | Error | Array does not start with a bracket, parsing fails |
| '[ ]' | Error | Array has one element, a string of spaces; space string fails to parse as int |
| "[     123,       123]" | Cast to Array\<int\>: [123, 123] | Valid array |
| '[  "  123  "   ,    "456   "]' | Cast to Array\<int\>: [123, 456] | Valid array |
| '[    123     ,    "456"   ]' | Cast to Array\<int\>: [123, 456] | Valid array |
| '[ [] ]' | Cast to Array\<Array\<int\>\>: [[]] | The first array's internal element is ' [] ', which becomes a valid array after trimming |
| '[ null ,123]' | Cast to Array\<int\>: [null, 123] | Valid array containing null |
| '[ "null" ,123]' | Error | String "null" cannot be converted to int type |

Note: Ensure that elements between commas contain valid content, otherwise parsing will fail.

#### Non-Strict Mode

##### BNF Definition

```xml
<array>          ::= "[" <array-content>? "]" | <empty-array> 

<empty-array> ::= "[]"

<array-content>  ::=  <data-token>(<collection-delim> <data-token>)*

<data-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*

<collection-delim>  ::= "," 
```

##### Rule Description

1. The textual representation of an array must begin with a left bracket `[` and end with a right bracket `]`.
2. Empty arrays are directly represented as `[]`.
3. Elements within the array are separated by commas.
4. Whitespace is allowed before and after elements within the array.
5. Array elements can be enclosed in matching single quotes (`'`) or double quotes (`"`).
6. Elements can use "null" to represent a null value.
7. During parsing, parts that match `<data-token>` continue to apply the parsing rules of the target type T.

If the array format does not meet the BNF format above, NULL is returned.
If elements do not meet the requirements of the corresponding type, the corresponding element position is set to null.

##### Examples

| Input String | Conversion Result | Comment |
| --- | --- | --- |
| '[]' | [] | Valid empty array |
| '  []' | NULL | Array does not start with a bracket, parsing fails |
| '[ ]' | [null] | Array has one element, a string of spaces; space string fails to parse as int |
| "[     123,       123]" | Cast to Array\<int\>: [123, 123] | Valid array |
| '[  "  123  "   ,    "456   "]' | Cast to Array\<int\>: [123, 456] | Valid array |
| '[    123     ,    "456"   ]' | Cast to Array\<int\>: [123, 456] | Valid array |
| '[ [] ]' | Cast to Array\<Array\<int\>\>: [[]] | The first array's internal element is ' [] ', which becomes a valid array after trimming |
| '[ null ,123]' | Cast to Array\<int\>: [null, 123] | Valid array containing null |
| '[ "null" ,123]' | Cast to Array\<int\>: [null, 123] | String "null" cannot be converted to int type, converted to null |

### FROM Array\<Other Type\>

#### Strict Mode

##### Rule Description

For each element in the Array, a Cast from Other Type To Type is performed. The Cast is also in strict mode.

##### Examples

| Input Array | Conversion Result | Comment |
| --- | --- | --- |
| ["123", "456"] | Cast to Array\<int\>: [123, 456] | "123" and "456" can be converted to Int |
| ["abc", "123"] | Error | "abc" cannot be converted to Int |
| [null, "123"] | Cast to Array\<int\>: [null, 123] | The Cast result of null is still null |

#### Non-Strict Mode

##### Rule Description

For each element in the Array, a Cast from Other Type To Type is performed. The Cast is also in non-strict mode.

##### Examples

| Input Array | Conversion Result | Comment |
| --- | --- | --- |
| ["123", "456"] | Cast to Array\<int\>: [123, 456] | "123" and "456" can be converted to Int |
| ["abc", "123"] | Cast to Array\<int\>: [null, 123] | "abc" cannot be converted to Int, converted to null |
| [null, "123"] | Cast to Array\<int\>: [null, 123] | The Cast result of null is still null |
