---
{
    "title": "Object Identifier",
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

Each database object, such as tables, columns, and indexes, has a name. In SQL statements, these names are referred to as object identifiers. Identifiers can be quoted or unquoted. If an identifier contains special characters or reserved keywords, it must be quoted with backticks (`) each time it is referenced. For more details on reserved keywords, please refer to the [Reserved Keywords](../basic-elements/reserved-keywords.md) section.

## Object Identifier Restrictions

In Doris, object identifiers can be controlled by the variable `enable_unicode_name_support` to determine whether Unicode characters are supported. When Unicode character support is enabled, identifiers can use any language characters in Unicode. However, punctuation marks and other characters are not allowed.

In Doris, different objects have different restrictions on identifiers, and the specific restrictions for different objects are listed below.

## Description

Each database object, such as tables, columns, and indexes, has a name. In SQL statements, these names are referred to as object identifiers. Identifiers can be quoted or unquoted. If an identifier contains special characters or reserved keywords, it must be quoted with backticks (`) each time it is referenced. For more details on reserved keywords, please refer to the [Reserved Keywords](../basic-elements/reserved-keywords.md) section.

## Object Identifier Restrictions

In Doris, object identifiers can be controlled by the variable `enable_unicode_name_support` to determine whether Unicode characters are supported. When Unicode character support is enabled, identifiers can use any language characters in Unicode. However, punctuation marks and other characters are not allowed.

In Doris, different objects have different restrictions on identifiers, and the specific restrictions for different objects are listed below.

### Table Names

| Mode               | Identifier Restrictions                             |
| :----------------- | :------------------------------------- |
| Closed Unicode Mode | `^[a-zA-Z][a-zA-Z0-9-_]*$`             |
| Enabled Unicode Mode | `^[a-zA-Z\\p{L}][a-zA-Z0-9-_\\p{L}]*$` |

### Column Names

| Mode               | Identifier Restrictions                                                   |
| :----------------- | :----------------------------------------------------------- |
| Closed Unicode Mode | `^[_a-zA-Z@0-9\\s/][.a-zA-Z0-9_+-/?@#$%^&*\"\\s,:]{0,255}$` |
| Enabled Unicode Mode | `^[_a-zA-Z@0-9\\p{L}][.a-zA-Z0-9_+-/?@#$%^&*\\p{L}]{0,255}$` |

## OUTFILE Names

| Mode               | Identifier Restrictions                                   |
| :----------------- | :------------------------------------------- |
| Closed Unicode Mode | `^[_a-zA-Z][a-zA-Z0-9-_]{0,63}$`             |
| Enabled Unicode Mode | `^[_a-zA-Z\\p{L}][a-zA-Z0-9-_\\p{L}]{0,63}$` |

## User Names

| Mode               | Identifier Restrictions                              |
| :----------------- | :--------------------------------------- |
| Closed Unicode Mode | `^[a-zA-Z][a-zA-Z0-9.-_]*$`             |
| Enabled Unicode Mode | `^[a-zA-Z\\p{L}][a-zA-Z0-9.-_\\p{L}]*$` |

## LABEL Names

| Mode               | Identifier Restrictions                      |
| :----------------- | :------------------------------ |
| Closed Unicode Mode | `^[-_A-Za-z0-9:]{1,N}$`, where `N` is determined by the `label_regex_length` configuration in FE, with a default value of 128. |
| Enabled Unicode Mode | `^[-_A-Za-z0-9:\\p{L}]{1,N}$`, where `N` is determined by the `label_regex_length` configuration in FE, with a default value of 128. |

## Others

| Mode               | Identifier Restrictions                                  |
| :----------------- | :------------------------------------------ |
| Closed Unicode Mode | `^[a-zA-Z][a-zA-Z0-9-_]{0,63}$`             |
| Enabled Unicode Mode | `^[a-zA-Z\\p{L}][a-zA-Z0-9-_\\p{L}]{0,63}$` |