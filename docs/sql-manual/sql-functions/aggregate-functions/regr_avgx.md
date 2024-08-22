---
{
    "title": "REGR_AVGX",
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

## REGR_AVGX
### Description
#### Syntax

`regr_avgx(y, x)`

Computes the average value of the independent variable x in a linear regression analysis.

### example

```sql
mysql> select regr_avgx(y, x) from t;
+--------------------+
| regr_avgx(y, x)    |
+--------------------+
| 10.872839868571429 |
+--------------------+
1 row in set (0.044 sec)
```

### keywords
REGR_AVGX
