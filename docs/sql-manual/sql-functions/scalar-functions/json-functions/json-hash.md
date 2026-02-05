---
{
    "title": "JSON_HASH",
    "language": "en",
    "description": "JSONHASH calculates a hash value for a JSON object. This function accepts a JSON type parameter and returns a BIGINT hash value."
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

`JSON_HASH` calculates a hash value for a JSON object. This function accepts a JSON type parameter and returns a BIGINT hash value.

When calculating the hash value of a JSON object, the function sorts the keys of the JSON object before calculation, ensuring that JSON objects with identical content but different key orders produce the same hash value.

## Syntax

```sql
JSON_HASH(json_value)
```

## Alias

`JSONB_HASH`

## Parameters

**json_value** - The JSON value for which to calculate a hash value. Must be of JSON type.

## Return Value

Returns a BIGINT hash value.

When the input is NULL, the function returns NULL.

## Usage

Since the JSON standard specifies that key-value pairs in JSON objects are unordered, to ensure consistent identification of JSON objects with the same content across different systems, the `JSON_HASH` function sorts the key-value pairs before calculating the hash value, similar to calling the `SORT_JSON_OBJECT_KEYS` function.

Additionally, for duplicate keys in JSON objects, although Doris allows them to exist, the hash calculation only considers the first occurring key-value pair, which better matches real-world application scenarios.

## Examples

1. Basic hash calculation
```sql
SELECT json_hash(cast('123' as json));
```
```text
+--------------------------------+
| json_hash(cast('123' as json)) |
+--------------------------------+
|            5279066513252500087 |
+--------------------------------+
```

2. Verifying alias function
```sql
SELECT json_hash(cast('123' as json)), jsonb_hash(cast('123' as json));
```
```text
+--------------------------------+---------------------------------+
| json_hash(cast('123' as json)) | jsonb_hash(cast('123' as json)) |
+--------------------------------+---------------------------------+
|            5279066513252500087 |             5279066513252500087 |
+--------------------------------+---------------------------------+
```
As shown, `json_hash` and `jsonb_hash` functions produce identical hash values for the same input, confirming they are equivalent alias functions.

3. Key sorting verification
```sql
SELECT 
    json_hash(cast('{"a":123, "b":456}' as json)), 
    json_hash(cast('{"b":456, "a":123}' as json));
```
```text
+-----------------------------------------------+-----------------------------------------------+
| json_hash(cast('{"a":123, "b":456}' as json)) | json_hash(cast('{"b":456, "a":123}' as json)) |
+-----------------------------------------------+-----------------------------------------------+
|                             82454694884268544 |                             82454694884268544 |
+-----------------------------------------------+-----------------------------------------------+
```
The `json_hash` function generates the same hash value regardless of key order because it sorts the keys before calculating the hash value.

4. Handling duplicate keys
```sql
SELECT 
    json_hash(cast('{"a":123}' as json)), 
    json_hash(cast('{"a":456}' as json)), 
    json_hash(cast('{"a":123, "a":456}' as json));
```
```text
+--------------------------------------+--------------------------------------+-----------------------------------------------+
| json_hash(cast('{"a":123}' as json)) | json_hash(cast('{"a":456}' as json)) | json_hash(cast('{"a":123, "a":456}' as json)) |
+--------------------------------------+--------------------------------------+-----------------------------------------------+
|                 -7416836614234106918 |                 -3126362109586887012 |                          -7416836614234106918 |
+--------------------------------------+--------------------------------------+-----------------------------------------------+
```
When a JSON object contains duplicate keys (`{"a":123, "a":456}`), the `json_hash` function only considers the first key-value pair for hash calculation. As shown, the hash value of the JSON object with duplicate keys matches that of the object containing only the first key-value pair `{"a":123}`.

5. Different number type handling
```sql
SELECT 
    json_hash(to_json(cast('123' as int))), 
    json_hash(to_json(cast('123' as tinyint)));
```
```text
+----------------------------------------+--------------------------------------------+
| json_hash(to_json(cast('123' as int))) | json_hash(to_json(cast('123' as tinyint))) |
+----------------------------------------+--------------------------------------------+
|                    7882559133986259892 |                        5279066513252500087 |
+----------------------------------------+--------------------------------------------+
```
The same numeric value 123, when stored in JSON with different types (int and tinyint), produces different hash values. This is because Doris's JSON implementation preserves type information, and the hash calculation considers these type differences.

6. Using normalize_json_numbers_to_double for uniform type
```sql
SELECT 
    json_hash(normalize_json_numbers_to_double(to_json(cast('123' as int)))), 
    json_hash(normalize_json_numbers_to_double(to_json(cast('123' as tinyint))));
```
```text
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
| json_hash(normalize_json_numbers_to_double(to_json(cast('123' as int)))) | json_hash(normalize_json_numbers_to_double(to_json(cast('123' as tinyint)))) |
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
|                                                      4028523408277343359 |                                                          4028523408277343359 |
+--------------------------------------------------------------------------+------------------------------------------------------------------------------+
```
This example demonstrates how to solve the above issue: use the `normalize_json_numbers_to_double` function to first convert all numeric values to double precision floating-point type, then calculate the hash value. This ensures consistent hash values regardless of the original numeric type.

7. Handling NULL values
```sql
SELECT json_hash(null);
```
```text
+-----------------+
| json_hash(null) |
+-----------------+
|            NULL |
+-----------------+
```

## Notes

1. The `JSON_HASH` function has an alias `JSONB_HASH`, both functions have identical functionality.

2. This function sorts the keys of JSON objects before calculating hash values, similar to calling the `SORT_JSON_OBJECT_KEYS` function.

3. For duplicate keys in JSON objects, the function only considers the first occurring key-value pair for hash calculation.

4. Because Doris's JSON can store numbers in different types (int, tinyint, bigint, float, double, decimal), the same numeric value with different types may produce different hash values. If consistency is required, you can use the `NORMALIZE_JSON_NUMBERS_TO_DOUBLE` function to convert all numeric values to a uniform type before calculating hash values.

5. When JSON objects are created through text parsing (such as using `CAST` to convert a string to JSON), Doris automatically selects the appropriate numeric type for storage, so typically you don't need to worry about numeric type inconsistency issues.

6. Note that if you don't manually convert "123" to a JSON object using `cast/to_json`, but instead use text conversion (parsing JSON objects from strings), Doris will only store "123" as a tinyint type JSON object, and won't have a situation where "123" is stored as both int type and tinyint type.
