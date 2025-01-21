---
{
    "title": "ST_LINEFROMTEXT,ST_LINESTRINGFROMTEXT",
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

Converts a WKT (Well Known Text) to a memory representation in the form of a Line

## Syntax

```sql
ST_LineFromText( <wkt>)
```

## Parameters

| Parameters  | Instructions         |
|-----|------------|
| `<wkt>` | A line segment consisting of two coordinates |

## Return Value

The memory form of a line segment.

## Examples

```sql
SELECT ST_AsText(ST_LineFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```