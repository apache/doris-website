---
{
    "title": "FORMAT_NUMBER",
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

## description

Returns a formatted string using a unit symbol, UNITS: "K", "M", "B", "T", "Q"

## Syntax
```sql
VARCHAR format_number(double val)
```

## Parameters  

| Parameter | Description |  
| -- | -- |  
| val | The value is to be calculated with unit |  

## Return Value  

The formatted string using a unit symbol. 

## example

```
mysql [(none)]>SELECT format_number(123456.0);
+-----------------------------------------+
| format_number(cast(123456.0 as DOUBLE)) |
+-----------------------------------------+
| 123K                                    |
+-----------------------------------------+
1 row in set (0.06 sec)

mysql [(none)]>SELECT format_number(1000000.00);
+-------------------------------------------+
| format_number(cast(1000000.00 as DOUBLE)) |
+-------------------------------------------+
| 1M                                        |
+-------------------------------------------+
1 row in set (0.03 sec)

mysql [(none)]>select format_number(-1000000000000000);
+--------------------------------------------------+
| format_number(cast(-1000000000000000 as DOUBLE)) |
+--------------------------------------------------+
| -1Q                                              |
+--------------------------------------------------+
1 row in set (0.06 sec)
```
### keywords
    format_number
