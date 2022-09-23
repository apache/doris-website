Original Wei Zuo [SelectDB](javascript:void(0);) *2022-08-11 18:10* *Posted onBeijing*

**Guide**: Xiaomi Group first introduced Apache Doris in 2019. At present, Apache Doris has been widely used in dozens of businesses within Xiaomi, and a set of data ecology with Apache Doris as the core has been formed within Xiaomi. ****This article is transcribed from the Doris community online Meetup keynote speech, which aims to share the implementation and optimization practices of Apache Doris in Xiaomi data scenarios.**

**Business Background** 

Xiaomi Group first introduced Apache Doris in 2019 due to the needs of growing its analytics business. After three years of development, Apache Doris has been widely used in dozens of businesses within Xiaomi, such as advertising, new retail, growth analysis, data kanban, Tianxing Digital, Xiaomi Youpin, and user portraits. A data ecosystem with Apache Doris as the core has been formed. **At present, Apache Doris already has dozens of** clusters within Xiaomi , with the scale of **hundreds of** BE nodes in total, of which the largest scale of a single cluster reaches **nearly 100 nodes** , with **dozens of** streaming data import product lines, and the largest single table per day. Increment of **12 billion** , supporting **PB-level** storage, and a single cluster can support **more than 2W** multi-dimensional analysis queries per day.

**Architecture Evolution**

The original intention of Xiaomi to introduce Apache Doris is to solve the problems encountered in internal user behavior analysis. With the development of Xiaomi's Internet business, the need for each product line to use user behavior data to conduct business growth analysis is more and more urgent. Having each business product line build its own growth analysis system is not only expensive but also inefficient. Therefore, having a product can help them shield the underlying complex technical details, allowing relevant business personnel to focus on their own technical fields, which can greatly improve work efficiency. Based on this, Xiaomi Big Data and the cloud platform jointly developed the growth analysis system Growing Analytics (hereinafter referred to as GA), which aims to provide a flexible multi-dimensional real-time query and analysis platform, unify data access and query solutions, and help business lines to refine operation. (The content here is quoted from: [Xiaomi Growth Analysis Platform Practice Based on Apache Doris](https://mp.weixin.qq.com/s?__biz=MzUxMDQxMDMyNg==&mid=2247486817&idx=1&sn=99fbef15b4d6f6059c3affbc77517e6e&scene=21#wechat_redirect) )

Analysis, decision-making, and execution are an iterative process. After analyzing the user's behavior, make decisions on whether there is room for improvement in the marketing strategy and whether it is necessary to personalize the push to the user at the front end, so as to help Xiaomi achieve business continuity. increase. This process is an iterative process of user behavior **analysis-decision-optimization execution-re-analysis-re-decision-re-optimization execution .**

**Historical Architecture**

The growth analysis platform was established in mid-2018. At that time, based on factors such as development time, cost, and technology stack, Xiaomi reused various existing big data basic components (HDFS, Kudu, SparkSQL, etc.) A growth analysis query system for Lamda architecture. **The architecture of the first-generation version of the GA system is shown in the figure below, which includes the following aspects:**

* Data source: The data source is the front-end embedded point data and the user behavior data that may be obtained.
* Data access layer: After unified cleaning, the buried data is sent to the self-developed message queue Talos within Xiaomi, and the data is imported into the storage layer Kudu through Spark Streaming.
* Storage layer: Separate hot and cold data in the storage layer. Hot data is stored in Kudu, and cold data is stored in HDFS. At the same time, the storage layer is partitioned. When the partition unit is days, a part of the data will be cooled and stored on HDFS every night.
* Computation layer/query layer: In the query layer, SparkSQL is used to perform joint view query on the data on Kudu and HDFS, and finally the query result is displayed on the front-end page.

**Under the historical background at that time, the first-generation version of the growth analysis platform helped us solve a series of problems in the user operation process, but at the same time, there were two problems in the historical structure:**

**The first question:** Since the historical architecture is based on the combination of SparkSQL + Kudu + HDFS, too many dependent components lead to high operation and maintenance costs. The original design is that each component uses the resources of the public cluster, but in practice, it is found that in the process of executing the query job, the query performance is easily affected by other jobs in the public cluster, and it is easy to jitter, especially when reading the data of the HDFS public cluster, Sometimes slower.

**Second problem:** When querying through SparkSQL, the latency is relatively high. SparkSQL is a query engine designed based on a batch processing system. In the process of exchanging data shuffle between each stage, it still needs to drop the disk operation, and the delay to complete the SQL query is relatively high. In order to ensure that SQL queries are not affected by resources, we add machines to ensure query performance. However, in practice, it is found that the space for performance improvement is limited. This solution cannot fully utilize machine resources to achieve the purpose of efficient query. A certain waste of resources. **(The content here is quoted from: [Xiaomi Growth Analysis Platform Practice Based on Apache Doris ](https://mp.weixin.qq.com/s?__biz=MzUxMDQxMDMyNg==&mid=2247486817&idx=1&sn=99fbef15b4d6f6059c3affbc77517e6e&scene=21#wechat_redirect))**

In response to the above two problems, our goal is to seek an MPP database that integrates computing and storage to replace our current components of the storage computing layer. **After technical selection, we finally decided to use Apache Doris to replace the old-generation historical architecture.**

**New Architecture based on Apache Doris**

After the current architecture obtains the front-end embedded point data from the data source, it can directly query the result and display it on the front-end after entering Apache Doris through the data access layer.

**Reasons for choosing Doris:**

* Doris has excellent query performance and can meet business needs.
* Doris supports standard SQL, and the cost for users to use and learn is low.
* Doris does not depend on other external systems and is easy to operate and maintain.
* The Doris community has a high level of activity, which is conducive to the maintenance and upgrade of the subsequent system.

Comparison of performance between old and new architectures

We selected businesses with an average daily data volume of about 1 billion and performed performance tests in different scenarios, including 6 event analysis scenarios, 3 retention analysis scenarios, and 3 funnel analysis scenarios. **After comparison, the following conclusions are drawn:**

* In the event analysis scenario, the average query time is **reduced by 85%** .
* In the retention analysis and funnel analysis scenarios, the average query time is **reduced by 50% .**

**Applied Practice**

With the increase of access services and the growth of data scale, we have also encountered many problems and challenges. Below we will introduce **some practical experience accumulated in the process of using Apache Doris** .

**Data Import**

Xiaomi mainly uses Stream Load, Broker Load and a small amount of Insert to import Doris data. The data is generally sent to the Talos message queue first, and is divided into two parts: real-time data and offline data .

**Real-time data is written to Apache Doris:**

After some businesses process data through Flink, they will be written to Doris through the Flink Doris Connector component provided by the Doris community. The bottom layer depends on the Doris Stream Load data import method.

Some will import data into Doris through Stream Load encapsulated by Spark Streaming.

Offline data is written to **Apache Doris:**

The offline data part will be written to Hive first, and then the data will be imported into Doris through Xiaomi's data workshop. Users can submit Broker Load tasks directly in the data factory and import data directly into Doris, or import data into Doris through Spark SQL. The Spark SQL method relies on the Spark Doris Connector component provided by the Doris community, and the bottom layer also encapsulates the Doris Stream Load data import method.

**Data Query**

Users can query after importing data into Doris through the data factory. In Xiaomi, the query is made through the self-developed digital whale platform of Xiaomi. Users can query and visualize Doris through the digital whale platform, and realize user behavior analysis (to meet the behavior analysis requirements of business event analysis, retention analysis, funnel analysis, path analysis, etc., we have added corresponding UDF and UDAF for Doris) and User portrait analysis.

Although it is still necessary to import Hive data, the Doris community is also supporting the integration of lakes and warehouses. After realizing the integration of lakes and warehouses, we will consider directly querying the appearance of Hive and Iceberg through Doris. **It is worth mentioning that Doris version 1.1 has implemented the ability to query Iceberg appearances. **At the same time, in the upcoming **1.2 version** , it will also support Hudi appearance and add Multi Catalog, which can realize the synchronization of external table metadata, whether it is the performance of querying external table or the ease of use of accessing appearance. promote.

**Compaction Tuning**

The bottom layer of Doris adopts a similar LSM-Tree method to support fast data writing. Each data import will generate a new data version under the underlying Tablet, and each data version is a small data file. It is ordered within a single file, but unordered between different files.

In order to make the data orderly, there is a Compaction mechanism at the bottom of Doris, which asynchronously merges the underlying small data versions into large files. Untimely compaction will cause version accumulation, increase metadata pressure, and affect query performance. Since the Compaction task itself consumes more machine CPU, memory and disk resources, if the Compaction is opened too large, it will occupy too much machine resources and affect the query performance, and may also cause OOM.

**In response to the above problems, we start from the business side on the one hand, and guide users through the following aspects:**

* By guiding the business side to make reasonable optimization, set **reasonable partitions and buckets** for the table to avoid generating too many data fragments.
* Guide users to  **reduce the frequency of data import as much as possible ** **, ****increase the amount of single data import** , and reduce the pressure of Compaction.
* Guide users **to avoid excessive use of the Delete operation that generates a Delete version under the hood** . In Doris, Compaction is divided into Base Compaction and Cumulative Compaction. Cumulative Compaction will quickly merge a large number of newly imported minor versions. If a Delete operation is encountered during the execution process, it will terminate and merge all versions before the current Delete operation version. Since Cumulative Compaction cannot handle Delete version, the merged version will be put into Base Compaction together with the current version. When there are too many Delete versions, the step size of Cumulative Compaction will be shortened accordingly, and only a small number of files can be merged, so that Cumulative Compaction cannot play the effect of merging small files well.

**On the other hand, we start from the operation and maintenance side:**

* Configure different Compaction parameters for different business clusters. **Some businesses write data in real time and require a lot of queries, so we will make the Compaction larger to achieve the purpose of fast merging. The other part of the business only writes today's partitions, but only queries the previous partitions. In this case, we will appropriately make the Compaction smaller to prevent the Compaction from occupying too much memory or CPU resources. When the import volume decreases in the evening, the previously imported minor versions can be merged in time, which will not have a great impact on the query efficiency of the next day.
* Appropriately lower the Base Compaction task priority and increase the Cumulative Compaction priority. **According to the content mentioned above, Cumulative Compaction can quickly merge a large number of small files generated, while Base Compaction will take longer to execute due to the large size of the merged files, and read and write amplification will be more serious. So we want the Cumulative Compaction to be done first and quickly.
* Added version backlog alarm. **When we receive a version backlog alarm, dynamically increase the Compaction parameter to consume the backlog version as soon as possible.
* Supports manual triggering of Compaction tasks for data shards under specified tables and partitions. **Because the Compaction is not timely, some tables accumulate a lot of versions during query and need to be able to merge quickly. Therefore, we support increasing the Compaction priority for a single table or a partition under a single table.

At present, the Doris community has made a ** **series of optimizations for the above problems . In version 1.1, **the data compaction ability has been greatly enhanced, and the aggregation of new data can be quickly completed, avoiding -235 errors and banding caused by too many versions in sharded data. The query efficiency problem comes.**

**First** of all , in Doris 1.1 version, QuickCompaction is introduced, which increases the active-triggered Compaction check, and actively triggers the Compaction when the data version increases. At the same time, by improving the ability of shard meta information scanning, it can quickly discover shards with many data versions and trigger Compaction. Through active triggering and passive scanning, the real-time problem of data merging is completely solved.

**At** the same time , for the high-frequency small file Cumulative Compaction, the scheduling and isolation of Compaction tasks is implemented to prevent the heavyweight Base Compaction from affecting the merging of new data.

**Finally** , for the merging of small files, the strategy of merging small files is optimized, and the method of gradient merging is adopted. Each time the files participating in the merging belong to the same data magnitude, it prevents versions with large differences in size from merging, and gradually merges hierarchically. , reducing the number of times a single file is involved in merging, which can greatly save the CPU consumption of the system.

**In the test results of the new version 1.1 of the community, whether it is the efficiency of Compaction, the resource consumption of CPU, or the query jitter during high-frequency import, the effect has been greatly improved.**

**For details, please refer to:**[Apache Doris 1.1 Features Revealed: How Flink Real-Time Writes Combine High Throughput and Low Latency](http://mp.weixin.qq.com/s?__biz=Mzg3Njc2NDAwOA==&mid=2247500848&idx=1&sn=a667665ed4ccf4cf807a47be7c264f69&chksm=cf2fca37f85843219e2f74d856478d4aa24d381c1d6e7f9f6a64b65f3344ce8451ad91c5af97&scene=21#wechat_redirect)

**Monitor Alarm**

**The monitoring of Doris is mainly carried out through Prometheus and Grafana. The alarm for Doris is via Falcon.**

Xiaomi uses Minos internally for cluster deployment. Minos is a big data service process management tool developed and open sourced by Xiaomi. After the Doris cluster deployment is completed, it will be updated to the Qingzhou warehouse within Xiaomi. After the nodes in the Qingzhou data warehouse are registered with ZooKeeper, Prometheus will monitor the nodes registered with ZooKeeper, access the corresponding ports, and pull the corresponding metrics.

After that, Grafana will display the monitoring information on the panel. If the indicators exceed the preset alarm threshold, the Falcon alarm system will alarm in the alarm group, and at the same time, the alarm level will be higher or some warnings that cannot be responded to in time. , you can directly call the classmates on duty to report to the police by telephone.

In addition, Xiaomi internally has a Cloud-Doris daemon for each Doris cluster. The biggest function of Could - Doris is to detect the availability of Doris. For example, we send a select current timestamp();  query to Doris every minute  . If the query does not return within 20 seconds, we will judge that this probe is unavailable. Xiaomi guarantees the availability of each cluster internally. Through the above detection method, the Doris availability indicator can be output inside Xiaomi.

**Xiaomi's optmization practice for Apache Doris**

While applying Apache Doris to solve business problems, we also discovered some optimization items in Apache Doris. Therefore, after communicating with the community, we began to deeply participate in community development. While solving our own problems, we also timely fed back the important features developed to Apache Doris. Community, including Stream Load two-phase commit (2PC), single-copy data import, Compaction memory limit, etc.

************Stream Load Two-phase commit (2PC)************

**problems encountered**

During the process , some abnormal conditions may cause the following problems:

Repeated import of Flink data : Flink handles fault tolerance and implements EOS through the periodic checkpoint mechanism, and implements end-to-end EOS including external storage through primary key or two-phase commit. Before Doris-Flink-Connector 1.1, UNIQUE KEY tables implemented EOS through unique keys, and non-UNIQUE KEY tables did not support EOS

Partial import of Spark SQL data  **:** The process of finding data from Hive tables through SparkSQL and writing them to Doris tables requires the use of the Spark Doris Connector component, which writes the data queried in Hive into Doris through multiple Stream Load tasks. When an exception occurs, some data will be imported successfully and some data will fail.

**Stream Load two-phase commit design**

The above two problems can be solved by importing and supporting two-stage submission. After the first stage is completed, ensure that the data is not lost and the data is invisible. This can ensure that the submission will be successful when the second stage is initiated, and it can also ensure that when the second stage is initiated to cancel must be successful.

**Write transactions in Doris are divided into three steps:**

1. Start a transaction on FE with a status of Prepare;
2. data is written to BE;
3. When most replicas are successfully written, the transaction is committed, the status becomes Committed, and the FE issues the Publish Version task to the BE to make the data visible immediately.

After the introduction of the two-phase commit, the third step is changed to Pre Commit, and the Publish Version is completed in the second phase. After the first phase is completed (the transaction status is Pre Commit), the user can choose to abandon or commit the transaction in the second phase.

**Support for Flink Exactly-Once semantics**

Doris-Flink-Connector 1.1 implements EOS using two-stage Stream Load and supports Flink’s two-stage submission. Only when the global Checkpoint is completed, the second-stage submission of Sream Load will be initiated, otherwise, the second-stage submission will be initiated.

**Solve the partial import of SparkSQL data**

After Doris-Spark-Connector uses two-stage Stream Load, successful tasks will write data to Doris through the first stage of Stream Load (Pre Commit state, invisible). When the job fails, initiate the second stage cancellation of all Stream Loads. This ensures that there will be no problems with partial data import.

**Single-copy data import optimization**

**Single Copy Data Import Design**

Doris ensures high reliability of data and high availability of the system through a multi-copy mechanism. Write tasks can be divided into two categories: computing and storage according to the resources used: sorting, aggregation, encoding, compression, etc. use CPU and memory computing resources, the final file storage uses storage resources, and computing and storage when three copies are written The resource will occupy three copies.

Is it possible to write only one copy of the data in memory, and after the single copy is written and the storage file is generated, can the file be synchronized to the other two copies? The answer is feasible, so for the scenario of three-copy writing, we have made a single-copy writing design. **After the single copy data is sorted, aggregated, encoded and compressed in memory, the file is synchronized to the other two copies, which can save CPU and memory resources to a large extent.**

**Performance Comparison Test**

**Broker Load import 62G data performance comparison**

**Import time:** 33 minutes for three-copy import and 31 minutes for single-copy import.

**Memory usage:** The optimization effect on memory usage is very obvious. The memory usage of three-copy data import is three times that of single-copy import. Only one copy of memory needs to be written when importing a single copy, but three copies of memory need to be written when importing three copies, and the memory optimization has reached 3 times.

**CPU consumption comparison:** The CPU consumption of a three-copy import is almost three times that of a single-copy.

**Concurrent scene performance comparison**

In the test, data is imported to 100 tables concurrently, each table has 50 import tasks, and the total number of tasks is 5000. The data rows imported by a single Stream Load task are 2 million rows, or about 90M of data. In the test, 128 concurrency were opened, and **the ****single-copy import and the three-copy import were compared:**

**Import time:** 3-copy import took 67 minutes, then single-copy took 27 minutes to complete. The import efficiency is increased by more than two times.

**Memory usage:** Single-copy imports will be lower.

**CPU consumption comparison:** Since the import is already enabled, the CPU overhead is relatively high, but the throughput of single-copy import is significantly improved.

**Comapaction Memory Limit**

Previously, when Doris imported more than 2000 segments at a time on a single disk, Compaction had a memory OOM problem. For the business scenario of writing on the day but not checking the data of the day but querying the previous data, we will make the Compaction a little smaller to avoid taking up too much memory and causing the process to OOM.

Before Doris, each disk had a fixed thread to do the Compaction of the data stored on this disk, and there was no way to control it globally. Because we want to limit the memory usage on a single node, **we change the pattern to a producer-consumer pattern:**

The producer keeps producing tasks from all disks, and then submits the production tasks to the thread pool. We can well control the entry of the thread pool and reach the limit on Compaction. When merging, we will merge and sort the underlying small files, and then open up blocks for each file in the memory, so we can approximately think that the amount of memory occupied is related to the number of files, so that the number of files on a single node can be calculated at the same time. The number of files to be merged is limited to achieve the effect of controlling memory.

We have increased the limit on the number of files that can be merged in a single BE Compaction. If the number of files in the ongoing Compaction exceeds or equals the current limit, the subsequent submitted tasks need to wait. After the previous Compaction task is completed and the indicators are released, the later submitted tasks can be performed.

In this way, we limit the memory for some business scenarios, which is a good way to avoid the problem of OOM caused by occupying too much memory when the cluster load is high.

**Summarize**

Since Apache Doris launched its first business in 2019, **Apache Doris has served dozens of businesses within Xiaomi, with dozens of clusters, hundreds of nodes, and tens of thousands of online user analysis queries every day. , which undertakes most of the online analysis needs in scenarios including growth analysis and report query.**

At the same time, some of Xiaomi's optimization practices for Apache Doris listed above have already been released in Apache Doris version 1.0 or 1.1, and some PRs have been incorporated into the community master, which should be included in the new version 1.2 released soon. will meet you all.

With the rapid development of the community, more and more small partners have participated in the community construction, and the community activity has been greatly improved. **Apache Doris has become more and more mature, and has begun to move from a single computing and storage integrated analytical MPP database to a lake and warehouse integration. I believe that there will be more data analysis scenarios waiting to be explored and implemented in the future.**
