---
{
    "title": "XPATH_STRING",
    "language": "en",
    "description": "The XPATHSTRING function is used to parse the XML string and return the first XML node that matches the XPath expression."
}
---

## Description

The XPATH_STRING function is used to parse the XML string and return the first XML node that matches the [XPath](https://www.w3.org/TR/xpath-10/) expression.

:::tip
This function is supported since version 3.0.6.
:::

## Syntax

```sql
XPATH_STRING(<xml_string>, <xpath_expression>)
```

## Parameters
| Parameter | Description                                   |
| --------- | ----------------------------------------------|
| `<xml_string>` | Source string. Type: VARCHAR             |
| `<xpath_expression>` | [XPath](https://www.w3.org/TR/xpath-10/) expression. Type: VARCHAR    |

## Return Value

Returns VARCHAR type, representing the contents of the first XML node that matches the XPath expression.

Special cases:
- The function raises an error if xml or xpath are malformed.

## Examples

1. Basic node value extraction
```sql
SELECT xpath_string('<a>123</a>', '/a');
```
```text
+-----------------------------------+
| xpath_string('<a>123</a>', '/a')  |
+-----------------------------------+
| 123                               |
+-----------------------------------+
```

2. Nested element extraction
```sql
SELECT xpath_string('<a><b>123</b></a>', '/a/b');
```
```text
+--------------------------------------------+
| xpath_string('<a><b>123</b></a>', '/a/b')  |
+--------------------------------------------+
| 123                                        |
+--------------------------------------------+
```

3. Using attributes
```sql
SELECT xpath_string('<a><b id="1">123</b></a>', '//b[@id="1"]');
```
```text
+----------------------------------------------------------+
| xpath_string('<a><b id="1">123</b></a>', '//b[@id="1"]') |
+----------------------------------------------------------+
| 123                                                      |
+----------------------------------------------------------+
```

4. Using position predicates
```sql
SELECT xpath_string('<a><b>1</b><b>2</b></a>', '/a/b[2]');
```
```text
+----------------------------------------------------+
| xpath_string('<a><b>1</b><b>2</b></a>', '/a/b[2]') |
+----------------------------------------------------+
| 2                                                  |
+----------------------------------------------------+
```

5. Handling CDATA and comments
```sql
SELECT xpath_string('<a><![CDATA[123]]></a>', '/a'), xpath_string('<a><!-- comment -->123</a>', '/a');
```
```text
+-----------------------------------------------+---------------------------------------------------+
| xpath_string('<a><![CDATA[123]]></a>', '/a')  | xpath_string('<a><!-- comment -->123</a>', '/a')  |
+-----------------------------------------------+---------------------------------------------------+
| 123                                           | 123                                               |
+-----------------------------------------------+---------------------------------------------------+
```
