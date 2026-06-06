---
{
    "title": "JSON_OBJECT_FLATTEN",
    "language": "en",
    "description": "JSON_OBJECT_FLATTEN flattens a nested JSON object into a single-level object whose keys are dot-joined paths to each leaf value."
}
---

## Description

`JSON_OBJECT_FLATTEN` flattens a nested JSON object into a single-level JSON object whose keys are the dot-joined paths to each leaf value. It follows the NiFi FlattenJson "keep-arrays" semantics: only objects are recursively walked, while arrays, scalars, nulls, and empty objects are kept as opaque leaf values.

If the top-level input is not an object (for example, a scalar, an array, or `null`), it is returned unchanged.

## Syntax

```sql
JSON_OBJECT_FLATTEN(<json_value>)
```

## Parameters

**`<json_value>`** - The JSON value to flatten. Must be of JSON type.

## Return Value

Returns a JSON value:

- If the input is a nested JSON object, returns a single-level JSON object whose keys are the dot-joined paths to each leaf value.
- If the input is not an object (scalar, array, or null), returns the input unchanged.
- If the input is `NULL`, returns `NULL`.

## Examples

### Basic nested object flattening

```sql
SELECT json_object_flatten('{"a":{"b":2}}');
```

```text
+--------------------------------------+
| json_object_flatten('{"a":{"b":2}}') |
+--------------------------------------+
| {"a.b":2}                            |
+--------------------------------------+
```

### Deeply nested object

```sql
SELECT json_object_flatten('{"a":{"b":{"c":3}}}');
```

```text
+--------------------------------------------+
| json_object_flatten('{"a":{"b":{"c":3}}}') |
+--------------------------------------------+
| {"a.b.c":3}                                |
+--------------------------------------------+
```

### Already-flat object

```sql
SELECT json_object_flatten('{"a":1,"b":"hi"}');
```

```text
+-----------------------------------------+
| json_object_flatten('{"a":1,"b":"hi"}') |
+-----------------------------------------+
| {"a":1,"b":"hi"}                        |
+-----------------------------------------+
```

### Arrays preserved as opaque leaves

```sql
SELECT json_object_flatten('{"a":[{"b":1},{"b":2}]}');
```

```text
+------------------------------------------------+
| json_object_flatten('{"a":[{"b":1},{"b":2}]}') |
+------------------------------------------------+
| {"a":[{"b":1},{"b":2}]}                        |
+------------------------------------------------+
```

```sql
SELECT json_object_flatten('{"a":{"b":[1,2,3]}}');
```

```text
+--------------------------------------------+
| json_object_flatten('{"a":{"b":[1,2,3]}}') |
+--------------------------------------------+
| {"a.b":[1,2,3]}                            |
+--------------------------------------------+
```

### Top-level non-object values pass through unchanged

```sql
SELECT json_object_flatten('42');
```

```text
+---------------------------+
| json_object_flatten('42') |
+---------------------------+
| 42                        |
+---------------------------+
```

```sql
SELECT json_object_flatten('[1,2,{"x":3}]');
```

```text
+--------------------------------------+
| json_object_flatten('[1,2,{"x":3}]') |
+--------------------------------------+
| [1,2,{"x":3}]                        |
+--------------------------------------+
```

### NULL input

```sql
SELECT json_object_flatten(NULL);
```

```text
+---------------------------+
| json_object_flatten(NULL) |
+---------------------------+
| NULL                      |
+---------------------------+
```

### Mixed nested object with scalars, arrays, and sub-objects

```sql
SELECT json_object_flatten('{"x":{"s":1,"a":[1,2],"o":{"k":"v"}}}');
```

```text
+--------------------------------------------------------------+
| json_object_flatten('{"x":{"s":1,"a":[1,2],"o":{"k":"v"}}}') |
+--------------------------------------------------------------+
| {"x.s":1,"x.a":[1,2],"x.o.k":"v"}                            |
+--------------------------------------------------------------+
```
