---
{
"title": "EXTRACT_URL_PARAMETER",
"language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE 
file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on 
an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

Returns the value of the `name` parameter in the URL, if it exists, or an empty string otherwise.

If there are multiple parameters with this name, the first one that occurs is returned.

This function works assuming that the parameter name is encoded in the URL exactly as it is in the passed parameter.

If you want to get other parts of the URL, you can use [parse_url](parse-url.md)

## Syntax

```sql
extract_url_parameter(VARCHAR url, VARCHAR name)
```

## Parameters

| Parameters | Description |
| -- |---------------|
| `url` | String of the url to return the parameter |
| `name` | Name of the parameter to return |

## Return Value

Parameter value of parameter name in url

## Example

```sql
SELECT extract_url_parameter ("http://doris.apache.org?k1=aa&k2=bb&test=cc#999", "k2")
```

```text
+--------------------------------------------------------------------------------+
| extract_url_parameter('http://doris.apache.org?k1=aa&k2=bb&test=cc#999', 'k2') |
+--------------------------------------------------------------------------------+
| bb                                                                             |
+--------------------------------------------------------------------------------+
```