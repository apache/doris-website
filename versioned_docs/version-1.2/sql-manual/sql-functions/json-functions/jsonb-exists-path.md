---
{
    "title": "JSONB_EXISTS_PATH",
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

## jsonb_exists_path

### description

It is used to judge whether the field specified by json_path exists in the JSONB data. If it exists, it returns TRUE, and if it does not exist, it returns FALSE

#### Syntax

```sql
BOOLEAN jsonb_exists_path(JSONB j, VARCHAR json_path)
```

### example

Refer to [jsonb tutorial](../../sql-reference/Data-Types/JSONB.md)

### keywords

jsonb_exists_path

