---
{
    "title": "XPATH_STRING",
    "language": "en"
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
> after version 2.1.10

The XPATH_STRING function is used to parse the XML string and return the first XML node that matches the XPath expression.

## Syntax

```sql
XPATH_STRING(<xml_string>, <xpath_expression>)
```

## Parameters
| Parameter | Description                                   |
| --------- | ----------------------------------------------|
| `<xml_string>` | Source string. Type: VARCHAR             |
| `<xpath_expression>` | XPath expression. Type: VARCHAR    |

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
