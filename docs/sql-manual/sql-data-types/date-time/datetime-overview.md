---
{
    "title": "Overview",
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

### Description

Date types include DATE, TIME and DATETIME, DATE type only stores the date accurate to the day, DATETIME type stores the date and time, which can be accurate to microseconds. TIME type only stores the time, and **does not support the construction of the table storage for the time being, can only be used in the query process**.

Do calculation for datetime types or converting them to numeric types, please use functions like [TIME_TO_SEC](../../sql-functions/date-time-functions/time-to-sec), [DATE_DIFF](../../sql-functions/date-time-functions/datediff), [UNIX_TIMESTAMP](../../sql-functions/date-time-functions/unix-timestamp) . The result of directly converting them as numeric types as not guaranteed.

For more information refer to [DATE](./DATE), [TIME](./TIME) and [DATETIME](./DATETIME) documents.