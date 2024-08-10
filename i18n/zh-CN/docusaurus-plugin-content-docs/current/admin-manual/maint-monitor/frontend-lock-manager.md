---
{
  "title": "FE 锁管理",
  "language": "zh-CN"
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

# FE（Frontend） 锁管理

## 死锁检测

FE 锁管理模块提供了死锁检测功能，用于自动检测死锁，该功能默认关闭，可以通过配置参数开启。
如果开启死锁检测功能，则会周期性地检测死锁，默认周期为 5 分钟， 我们也可以设置 `deadlock_detection_interval_minute`
参数，来调整检测周期。

我们会再日志中输出死锁检测的结果，如果检测到死锁，则会输出对应的告警日志。可以搜索关键字 `Deadlocks detected` 来查看是否存在死锁。

### 配置参数

fe.conf 配置文件中的死锁检测相关参数如下：

| 参数名                                | 参数说明         | 默认值   |
|------------------------------------|--------------|-------|
| enable_deadlock_detection          | 是否开启死锁检测功能   | false |
| deadlock_detection_interval_minute | 死锁检测周期，单位为分钟 | 5     |

## 慢锁检测

FE 锁管理模块提供了慢锁检测功能，我们会监控所有 DB、Table、Transaction 相关的锁，如果锁的持有时间超过一定阈值（默认为 10
秒），则会输出对应告警日志。
我们可以搜索日志关键字 `Lock held for` 来查看是否存在慢锁。

### 配置参数

fe.conf 配置文件中的慢锁检测相关参数如下：

| 参数名 | 参数说明 | 默认值 |
| --- | --- | --- |
| max_lock_hold_threshold_seconds | 慢锁告警阈值，单位为秒 | 10 |

