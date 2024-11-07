---
{
    "title": "Accelerating Query with Runtime Filter Tuning",
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

Join Runtime Filter (JRF) is an optimization technique that dynamically generates filters based on runtime data at Join nodes through Join conditions. 

This technique not only reduces the scale of Join Probe but also effectively decreases data IO and network transmission.

For detailed information on how to use Runtime Filter for query tuning, please refer to the section on [Runtime Filter Tuning](../../../query-acceleration/tuning/runtime-filter#tuning).
