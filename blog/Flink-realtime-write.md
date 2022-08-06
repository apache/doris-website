---
{
    'title': "How Flink's real-time writes to Apache Doris ensure both high throughput and low latency",
    'summary': "With the increasing demand for real-time analysis, the timeliness of data is becoming more and more important to the refined operation of enterprises. With the massive data, real-time data warehouse plays an irreplaceable role in effectively digging out valuable information, quickly obtaining data feedback, helping companies make faster decisions and better product iterations.",
    'date': '2022-07-29',
    'author': 'Apache Doris',
    'tags': ['Tech Sharing'],
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



With the increasing demand for real-time analysis, the timeliness of data is becoming more and more important to the refined operation of enterprises. With the massive data, real-time data warehouse plays an irreplaceable role in effectively digging out valuable information, quickly obtaining data feedback, helping companies make faster decisions and better product iterations.

In this situation, Apache Doris stands out as a real-time MPP analytic database, which is high performance and easy to use, and supports various data import methods. Combined with Apache Flink, users can quickly import unstructured data from Kafka and CDC(Change Data Capture) from upstream database like MySQL. Apache Doris also provides sub-second analytic query capabilities, which can effectively satisfy the needs of several real-time scenarios: multi-dimensional analysis, dashboard and data serving etc.
# Challange

Usually, there are many challenges to ensure high end-to-end concurrency and low latency for real-time data warehouses , such as:

- How to ensure end-to-end data sync in second-level ?

- How to quickly ensure data visibility ?

- How to solve the problem of small files writing under high concurrency situation?

- How to ensure end-to-end Exactly-Once?

Within the challenges above , we conducted an in-depth research on the business scenarios of users using Flink and Doris to build real-time data warehouses . After grasping the pain points of users, we made targeted optimizations in Doris version 1.1 and greatly improved the user experience  and improved the stability. The resource consumption of Doris has also been greatly optimized.

# Optimization

### Streamming Write

The initial practice of Flink Doris Connector is to cache the data into the memory batch after receiving data.The method of data writing is saving batches, and using parameters such as `batch.size` and `batch.interval` to control the timing of Stream Load writing at the same time.

It usually runs stably when the parameters are reasonable. Whatever the parameters are unreasonable, it would cause frequent Stream Load and compaction untimely, resulting in excessive version errors ( -235 ). On the other hand, when there is too much data, in order to reduce the writing frequency of Stream Load , the setting of `batch.size` too large may also cause OOM.

**To solve this problem, we introduce streaming write:**

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/otliigutb8p9l1y6qyp6.png)
- After the Flink task starts, the Stream Load Http request will be asynchronously initiated.

- When the data is received, it will be continuously transmitted to Doris through the Chunked transfer encoding of Http.

- Http request will end at Checkpoint and complete the Stream Load writing . The next Stream Load request will be asynchronously initiated at the same time.

- The data will continue to be received and the follow-up process is the same as above.

The pressure on the memory of the batch is avoided since the Chunked mechanism is used to transmit data. And the timing of writing is bound to the Checkpoint, which makes the timing of Stream Load controllable, and provides a basis for the following Exactly-Once semantics.

### Exactly-Once

Exactly-Once means that data will not be reprocessed or lost, even machine or application failure. Flink supports the End-to-End's Exactly-Once scenario a long time ago, mainly through the two-phase commit protocol to realize the Exactly-Once semantics of the Sink operator.

On the basis of Flink's two-stage submission, with the help of Doris 1.0's Stream Load two-stage submission,Flink Doris Connector implements Exactly Once semantics. The specific principles are as follows:

- When the Flink task is started, it will initiate a Stream Load PreCommit request. At this time, a transaction will be opened first, and data will be continuously sent to Doris through the Chunked mechanism of Http.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ole5tqi91jibzdg9vqep.png)

- Http request will be completed when the data writing ends at Checkpoint , and set the transaction status to preCommitted. The data has been written to BE and is invisible to the user at this time.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/jiieu1eff6smunkr85s5.png)

- A Commit request will be initiated after the Checkpoint, and the transaction status will be set to Committed. The data will become visible to the user after request.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/eaona8eslljmkpaa9324.png)

- After the Flink application ends unexpectedly and restarts from Checkpoint, if the last transaction was in the preCommitted state, a rollback request will be initiated and the transaction state will be set to Aborted.

Based on the above , Flink Doris Connector can be used to realize real-time data storage without loss or weight.

### Second- Level Data Synchronization

End-to-end second-level data sync and real-time visibility of data in high concurrent write scenarios require Doris to have the following capabilities:

- **Transaction Processing Capability**

Flink real-time writing interacts with Doris in the form of Stream Load 2pc, which requires Doris to have the corresponding transaction processing capabilities to ensure the basic ACID characteristics, and support Flink's second-level data sync in high concurrency scenarios.

- **Rapid Aggregation Capability of Data Versions**

One import in Doris will generate one data version. In a high concurrent write scenario, an inevitable impact is that there are too many data versions, and the amount of data imported in a single time will not be too large. The continuous high-concurrency small file writing scenario extremely tests the real-time ability and Doris' data merging performance, which is not friendly to Doris, and in turn affects the performance of the query. Doris has greatly enhanced the data compaction capability in version 1.1, which can quickly complete the aggregation of new data, avoiding -235 errors and query efficiency problems which are caused by too many versions of sharded data.

First of all, in Doris 1.1 version, QuickCompaction was introduced, which can actively triggered Compaction when the data version increased. At the same time, by improving the ability to scan fragment meta information, fragments that need to be compacted can be quickly discovered and trigger Compaction. Through active triggering and passive scanning, the real-time problem of data merging is completely solved.

For high-frequency small file Cumulative Compaction, the scheduling and isolation of Compaction tasks is implemented to prevent the heavyweight Base Compaction from affecting the merging of new data.

Finally, the strategy of merging small files is optimized by adopting gradient merge method. Each time the files participating in the merging belong to the same data magnitude,which can prevent versions with large differences in size from merging, and gradually merges hierarchically, reducing the number of times a single file is involved in merging, which can greatly save the CPU consumption of the system.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ez5qdcpgwjw60g9aacqd.png)

Doris version 1.1 has made targeted optimizations for scenarios such as high concurrent import, second-level data sync, and real-time data visibility, which greatly increases the ease of use and stability of the Flink system and Doris system, saves the overall resources of the cluster.

# Effect

### General Flink High Concurrency Scenarios

In the general scenario of the survey, Flink is used to synchronize unstructured data in upstream Kafka. The data is written to Doris in real time by the Flink Doris Connector after ETL.

The customer scenario is extremely strict here. The upstream maintains a high frequency of 10w per second, and the data needs to be able to complete the upstream and downstream sync within 5s to achieve second-level data visibility. Flink is configured with 20 concurrency, and the Checkpoint interval is 5s. The performance of Doris version 1.1 is quite excellent.

Specifically reflected in the following aspects:

- **Compaction Real-Time**

Data can be merged quickly, the number of tablet data versions is kept below 50, and the compaction score is stable. Compared with the previous -235 problem in high concurrent import scenario, the compaction efficiency is improved more than 10 times.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/d6enyv1zj68o7myjypnl.png)

-  **CPU Resource Consumption**

Doris version 1.1 has optimized the strategy for compaction of small files. In high-concurrency import scenarios, CPU resource consumption is reduced by 25%.

- **QPS Query Delay is Stable**

By reducing the CPU usage and the number of data versions, the overall order of data has been improved, and the delay of SQL queries will be reduced.

### Second-Level Data Synchronization Scenario (Extreme High Pressure)

In single bet and single tablet with 30 concurrent limit stream load pressure test on the client side, data in real-time <1s, the comparison before and after compaction score optimization as below:

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/r01hn8hv6arzbdclknis.png)
# Recommendations

### Real-Time Data Visualization Scenario

For strict latency requirements scenarios, such as second-level data synchronization, usually mean that a single import file is small, and it is recommended to reduce `cumulative_size_based_promotion_min_size_mbytes `. The default unit is 64 MB, and you can set it to 8 MB manually, which can greatly improve the compaction real-time performance. 

### High Concurrency Scenario

For high concurrent writing scenarios, you can reduce the frequency of Stream Load by increasing the checkpoint interval. For example, setting checkpoint to 5-10s can not only increase the throughput of Flink tasks, but also reduce the generation of small files and avoid causing compaction more pressure.

In addition, for scenarios that do not require high real-time data, such as minute-level data sync, the checkpoint interval can be increased, such as 5-10 minutes. And the Flink Doris connector can still ensure the integrity of data through the two-stage submission and checkpoint mechanism.

# Future planning

-  **Real-time Schema Change**

When accessing data in real time through Flink CDC, the upstream business table will perform the schema change operation, it has to modify the schema manually in Doris and Flink tasks. In the end, the data of the new schema can be synchronized after restart the task . 

This way requires human intervention, which will bring a great operation burden to users. In subsequent versions, real-time schema changes will support CDC scenarios, and the upstream schema changes will be synchronized to the downstream in real-time, which will comprehensively improve the efficiency of schema changes.

-  **Doris Multi-table Writting**

At present, the Doris Sink operator only supports synchronizing a single table, so for the entire database, it still has to divide the flow manually at the Flink level and write to multiple Doris Sinks, which will increase the difficulty of developers. In subsequent versions, we will support a single Doris Sink to synchronize multiple tables, which greatly simplifies the user's operation.

-  **Adaptive Compaction Parameter Tuning**

At present, the compaction strategy has many parameters, which can play a good role in most general scenarios, but these strategies still can't play an efficient role in some special scenarios. We will continue to optimize in subsequent versions, carry out adaptive compaction tuning for different scenarios, and keep improving data merging efficiency and real-time performance in various scenarios.

-  **Single-Copy Compaction**

The current compaction strategy is that each BE is carried out separately. In subsequent versions, we will implement single-copy compaction, and realize compaction tasks by cloning snapshots, reduce system load while reducing about 2/3 compaction tasks of the cluster, leaving more system resources to the user side.
