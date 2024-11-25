---
{
"title": "工作负载分析与诊断",
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

集群的工作负载分析主要分成两个阶段：
- 第一个是运行时的工作负载分析，当集群可用性下降时，可以通过监控发现资源开销比较大的查询，并进行降级处理。
- 第二个是分析历史数据，比如审计日志表等，找出不合理的工作负载，并进行优化。

## 运行时的工作负载分析
当通过监控发现集群的可用性下降时，可以按照以下流程进行处理：
1. 先通过监控大致判断目前集群的瓶颈点，比如是内存用量过高，CPU用量过高，还是IO过高，如果都很高，那么可以考虑优先解决内存的问题。
2. 确定了集群瓶颈点之后，可以通过workload_group_resource_usage表来查看目前资源用量最高的Group，比如是内存瓶颈，那么可以先找出内存用量最高的N个Group。
3. 确定了资源用量最高的Group之后，首先可以尝试调低这个Group的查询并发，因为此时集群资源已经很紧张了，要避免持续有新的查询进来耗尽集群的资源。
4. 对当前Group的查询进行降级，根据瓶颈点的不同，可以有不同的处理方法：
- 如果是CPU瓶颈，那么可以尝试把这个Group的CPU修改为硬限，并将cpu_hard_limit设置为一个较低的值，主动让出CPU资源。
- 如果是IO瓶颈，可以通过read_bytes_per_second参数限制该Group的最大IO。
- 如果是内存瓶颈，可以通过设置该Group的内存为硬限，并调低memory_limit的值，来释放部分内存，需要注意的是这可能会导致当前Group大量查询失败。
5. 完成以上步骤后，通常集群的可用性会有所恢复。此时可以做更进一步的分析，也就是引起该Group资源用量升高的主要原因，
   是这个Group的整体查询并发升高导致的还是某些大查询导致的，如果是某些大查询导致的，那么可以通过快速杀死这些大查询的方式进行故障恢复。
6. 可以使用backend_active_tasks结合active_queries找出目前集群中资源用量比较异常的SQL，然后通过kill语句杀死这些SQL释放资源。

## 通过历史数据分析工作负载
目前Doris的审计日志表中留存了sql执行时的简要信息，可以用于找出历史上执行过的不合理的查询，然后做出一些调整，具体流程如下：
1. 查看监控确认集群历史的资源用量情况，找出集群的瓶颈点，比如是CPU，内存还是IO。
2. 确定了集群的瓶颈点后，可以通过审计日志表找出对应时段资源用量比较异常的SQL，异常SQL有两种定义方式
1. 用户对于集群中SQL资源的使用量有一定的预期，比如大部分延迟都是秒级，扫描行数在千万，那么当有扫描行数在亿级别十亿级别的SQL，就属于异常SQL，需要人工进行处理
2. 用户如果对于集群中SQL资源用量也没有预期，这个时候可以通过百分位函数计算资源用量的方式，找出资源用量比较异常的SQL。以CPU瓶颈为例，可以先计算历史时间段内查询CPU时间的tp50/tp75/tp99/tp999，以该值为正常值，对照当前集群相同时间段内查询CPU时间的百分位函数，比如历史时段的tp999为1min，但是当前集群相同时段CPU时间的tp50就已经是1min，说明当前时段内相比于历史出现了大量的CPU时间在1min以上的sql，那么CPU时间大于1min的SQL就可以定义为异常SQL。其他指标的异常值的查看也是同理。
3. 对资源用量异常的SQL进行优化，比如SQL改写，表结构优化，并行度调节等方式降低单SQL的资源用量。
4. 如果通过审计表发现SQL的资源用量都比较正常，那么可以通过监控和审计查看当时执行的SQL的数量相比于历史时期是否有增加，如果有的话，可以跟上游业务确认对应时间段上游的访问流量是否有增加，从而选择是进行集群扩容还是排队限流操作。