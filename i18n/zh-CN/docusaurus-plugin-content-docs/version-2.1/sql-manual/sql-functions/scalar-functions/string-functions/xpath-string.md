---
{
    "title": "XPATH_STRING",
    "language": "cn"
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

## 描述
> 从版本 2.1.10 开始支持

XPATH_STRING 函数用于解析 XML 字符串并返回第一个匹配 [XPath](https://www.w3.org/TR/xpath-10/) 表达式的 XML 节点。

## 语法

```sql
XPATH_STRING(<xml_string>, <xpath_expression>)
```

## 参数
| 参数 | 描述 |
| --------- | ----------------------------------------------|
| `<xml_string>` | 源字符串。类型：VARCHAR |
| `<xpath_expression>` | XPath 表达式。类型：VARCHAR |

## 返回值

返回 VARCHAR 类型，表示匹配 XPath 表达式的第一个 XML 节点的内容。

特殊情况：
- 如果 XML 或 XPath 格式不正确，函数会报错。

## 示例

1. 基本节点值提取
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

2. 嵌套元素提取
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

3. 使用属性
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

4. 使用位置谓词
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

5. 处理 CDATA 和注释
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
