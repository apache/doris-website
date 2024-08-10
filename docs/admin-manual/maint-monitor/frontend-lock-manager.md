---
{
  "title": "FE Lock Management",
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

# FE (Frontend) Lock Management

## Deadlock Detection

The FE Lock Management module offers deadlock detection, a feature designed to automatically identify deadlocks. By default, 
this feature is disabled but can be enabled via configuration settings. When enabled, deadlock detection will periodically check for deadlocks, with a default interval of 5 minutes. You can adjust this interval by setting the `deadlock_detection_interval_minute` parameter.

The results of deadlock detection will be logged, and if any deadlocks are detected, corresponding warning logs will be generated. 
To check for deadlocks, search the logs for the keyword `Deadlocks detected`.
### Configuration Parameters

The following are the deadlock detection-related parameters in the `fe.conf` configuration file:

| Parameter Name                               | Description         | Default Value   |
|------------------------------------|--------------|-------|
| enable_deadlock_detection          | 	Enables deadlock detection   | false |
| deadlock_detection_interval_minute | Deadlock detection interval (in minutes) | 5     |

## Slow Lock Detection
The FE Lock Management module also includes slow lock detection. This feature monitors all locks related to databases, tables, and transactions. If a lock is held for longer than a specified threshold (10 seconds by default), a corresponding warning log will be generated.
To check for slow locks, search the logs for the keyword `Lock held for`.
### Configuration Parameters
The following are the slow lock detection-related parameters in the `fe.conf` configuration file:

| Parameter Name                               | Description         | Default Value   |
| --- | --- | --- |
| max_lock_hold_threshold_seconds | Threshold for slow lock warnings (in seconds) | 10 |

