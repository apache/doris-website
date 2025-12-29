---
{
    "title": "INITCAP",
    "language": "en",
    "description": "Capitalizes the first letter of the word contained in the parameter and converts the rest of the letters to lowercase."
}
---

## Description

Capitalizes the first letter of the word contained in the parameter and converts the rest of the letters to lowercase. A word is a sequence of alphanumeric characters separated by non-alphanumeric characters.

## Syntax

```sql
INITCAP ( <str> )
```

## Parameters

| Parameter | Description |
|-----------|-----------|
| `<str>`   | The string to be converted |

## Return Value

The result of capitalizing the first letter of the word in the parameter `<str>` and lowering the rest of the letters.

## Example    

```sql
SELECT INITCAP('hello hello.,HELLO123HELlo')
```

```text
+---------------------------------------+
| initcap('hello hello.,HELLO123HELlo') |
+---------------------------------------+
| Hello Hello.,hello123hello            |
+---------------------------------------+
```