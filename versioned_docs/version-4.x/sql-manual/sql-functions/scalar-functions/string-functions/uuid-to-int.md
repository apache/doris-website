---
{
    "title": "UUID_TO_INT",
    "language": "en",
    "description": "The UUIDTOINT function converts a UUID string to its INT128 integer representation."
}
---

## Description

The UUID_TO_INT function converts a UUID string to its INT128 integer representation. This is useful for scenarios where UUIDs need to be stored as integers in the database.

## Syntax

```sql
UUID_TO_INT(<uuid>)
```

## Parameters

| Parameter | Description |
| -------- | ----------------------------------------- |
| `<uuid>` | UUID string to convert. Type: VARCHAR |

## Return Value

Returns INT128 type, the integer representation of the UUID.

Special cases:
- If parameter is NULL, returns NULL
- If UUID format is invalid, returns NULL

## Examples

1. Basic usage: UUID to integer
```sql
SELECT uuid_to_int('6ce4766f-6783-4b30-b357-bba1c7600348');
```
```text
+-----------------------------------------------------+
| uuid_to_int('6ce4766f-6783-4b30-b357-bba1c7600348') |
+-----------------------------------------------------+
| 95721955514869408091759290071393952876              |
+-----------------------------------------------------+
```

2. NULL value handling
```sql
SELECT uuid_to_int(NULL);
```
```text
+-------------------+
| uuid_to_int(NULL) |
+-------------------+
| NULL              |
+-------------------+
```

3. Using with UUID()
```sql
SELECT uuid_to_int(UUID());
```
```text
+----------------------------------------+
| uuid_to_int(UUID())                    |
+----------------------------------------+
| 65543688548341017423158579845706592446 |
+----------------------------------------+
```

4. Batch conversion
```sql
SELECT uuid, uuid_to_int(uuid) AS uuid_int
FROM (SELECT '6ce4766f-6783-4b30-b357-bba1c7600348' AS uuid) t;
```
```text
+--------------------------------------+--------------------------------------+
| uuid                                 | uuid_int                             |
+--------------------------------------+--------------------------------------+
| 6ce4766f-6783-4b30-b357-bba1c7600348 | 95721955514869408091759290071393952876|
+--------------------------------------+--------------------------------------+
```

5. Uppercase UUID conversion

```sql
SELECT uuid_to_int('6CE4766F-6783-4B30-B357-BBA1C7600348');
```

```text
+-----------------------------------------------------+
| uuid_to_int('6CE4766F-6783-4B30-B357-BBA1C7600348') |
+-----------------------------------------------------+
| 95721955514869408091759290071393952876              |
+-----------------------------------------------------+
```

6. Invalid UUID format

```sql
SELECT uuid_to_int('invalid-uuid-format');
```

```text
+------------------------------------+
| uuid_to_int('invalid-uuid-format') |
+------------------------------------+
| NULL                               |
+------------------------------------+
```

### Keywords

    UUID_TO_INT
