---
{
    'title': 'Application practice of Apache Doris in WeLab real-time big data platform',
    'summary': "WeLab's real-time big data platform is a comprehensive big data platform that includes real-time data collection, storage, integration, mining, analysis and visualization. It has the characteristics of management automation, processization, standardization, and intelligence, and can support more lightweight, flexible, low-threshold and rapid iteration big data applications.",
    'date': '2022-09-17',
    'author': 'Apache Doris',
    'tags': ['Best Practice'],
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

# Application practice of Apache Doris in WeLab real-time big data platform

## 1 Overview
WeLab is a leading fintech company in the industry. We provide partners with financial intelligence solutions in the form of customized services to help partners realize financial technology innovation. WeLab has an original risk management technology, which can efficiently integrate and analyze mobile big data, grade users' risks, and output decisions efficiently. In order to achieve second-level decision-making, we have high requirements for real-time, accuracy and security of data processing. It is against this background that the Apache Doris database was introduced into our big data platform, and eventually became one of the important cornerstones of our big data platform.

WeLab's real-time big data platform is a comprehensive big data platform that includes real-time data collection, storage, integration, mining, analysis and visualization. It has the characteristics of management automation, processization, standardization, and intelligence, and can support more lightweight, flexible, low-threshold and rapid iteration big data applications.

<img src="https://pic3.zhimg.com/80/v2-c58ddede19fd6fdb0a9b4d5c9921ff0e_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1280" data-rawheight="687" class="origin_image zh-lightbox-thumb lazy" width="1280" data-original="https://pic3.zhimg.com/v2-c58ddede19fd6fdb0a9b4d5c9921ff0e_r.jpg" data-actualsrc="https://pic3.zhimg.com/v2-c58ddede19fd6fdb0a9b4d5c9921ff0e_b.jpg" data-lazy-status="ok">

In this big data platform system, Apache Doris mainly supports two important scenarios: real-time self-service BI reports and user operation analysis.

## 2 Real-time self-service BI reports
In the early stage of the construction of the big data platform, we completely relied on the Hadoop technology ecosystem and provided analysis services using offline computing. However, the Hadoop technology stack does not support real-time well enough, and the development of reports based on the Hadoop technology stack is expensive and not flexible enough.

On the other hand, in this period, the output of the report is provided in the traditional BI mode, but the traditional BI deployment and development cycle is long, and the overall architecture design needs to be carried out, and each module needs to be technically developed. In this mode, the development of new requirements is also very time-consuming, and the IT department has a heavy burden. Judging from the output of this big data analysis, operators cannot analyze users' behavior paths through data in real time, so they cannot quickly make corresponding countermeasures in products and businesses.

In order to solve the above two problems, on the one hand, we hope to introduce a technical solution that can perform real-time data analysis, and on the other hand, we hope to replace traditional BI with self-service BI. Self-service BI is more flexible and easier to use than traditional BI, and business analysts with non-IT backgrounds can also use it conveniently, which can better meet users' data analysis needs.

Our upgrade work started by investigating various MPP execution engines on the market. We have investigated three MPP execution engines, Kudu+Impala, Greenplum and Apache Doris. The specific results are as follows.

<table data-draft-node="block" data-draft-type="table" data-size="normal" data-row-style="normal"><tbody><tr><td>Product</td><td>Advantage</td><td>Disadvantage</td></tr><tr><td>Kudu+Impala</td><td>Support update & standard SQL</td><td>It consumes a lot of memory resources. Although Kudu's import performance is good, as the amount of data increases, the memory usage will increase, and the frequency of import failures will increase, which will ultimately affect the stability of the query service. Relying on the Hadoop ecosystem leads to high operation and maintenance costs.</td></tr><tr><td>Greenplum</td><td>Under the same resources, the performance is better than Kudu+Impala</td><td>The copy import method does not perform well in the case of multiple concurrency, and the batch update operation performance is not ideal, which cannot meet the real-time requirements of the big data platform. Cannot support high concurrent queries.</td></tr><tr><td>Doris</td><td>Independent of Hadoop ecosystem, linear scalability, high availability, high query performance, and high data import speed</td><td>-</td></tr></tbody></table>

After a comprehensive comparative analysis, we finally gave up Kudu+Impala and Greenplum and decided to use Doris as the underlying storage of the real-time big data platform.

### 2.1 Data table design
Using Doris's multiple data models, our event table and dimension table designs are as follows.

<img src="https://pic1.zhimg.com/80/v2-9d58166a1be56c6f01abd03c31370d6c_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1248" data-rawheight="748" class="origin_image zh-lightbox-thumb lazy" width="1248" data-original="https://pic1.zhimg.com/v2-9d58166a1be56c6f01abd03c31370d6c_r.jpg" data-actualsrc="https://pic1.zhimg.com/v2-9d58166a1be56c6f01abd03c31370d6c_b.jpg" data-lazy-status="ok">

Event table: Duplicate model. The Duplicate model has no primary key, and the data can be repeated according to the specified field.

Bitmap_uv table: Aggregate model. Aggregation models need to specify aggregation fields.

Dimension table: Uniq model. Set the key, which is unique. Overwrite data operations are available.

The above design is very simple, which is different from the design concept of multi-level tables in traditional data warehouses. Through such a lightweight design, once the business side has analysis requirements, it only needs to operate and configure it on the interface of the data bus, and synchronize the table data of the business side to doris. Then you can easily get the relevant results of the report through self-service analysis.

### 2.2 Create tables and queries

The following is an example of creating an event table.

<img src="https://pic4.zhimg.com/80/v2-c7eadb80099ff8ae14b0d0ed087531a3_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1328" data-rawheight="1334" class="origin_image zh-lightbox-thumb lazy" width="1328" data-original="https://pic4.zhimg.com/v2-c7eadb80099ff8ae14b0d0ed087531a3_r.jpg" data-actualsrc="https://pic4.zhimg.com/v2-c7eadb80099ff8ae14b0d0ed087531a3_b.jpg" data-lazy-status="ok">

Through the self-service BI interface, you only need to drag and drop to convert it into the underlying SQL. The following is an example of low-level SQL generated by self-service BI.

<img src="https://pic1.zhimg.com/80/v2-5d35405332570543015a26a1c7395c48_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1008" data-rawheight="1058" class="origin_image zh-lightbox-thumb lazy" width="1008" data-original="https://pic1.zhimg.com/v2-5d35405332570543015a26a1c7395c48_r.jpg" data-actualsrc="https://pic1.zhimg.com/v2-5d35405332570543015a26a1c7395c48_b.jpg" data-lazy-status="ok">


### 2.3 Practical experience

In the process of building the above real-time report based on Doris, we have summarized some Doris experience.

```
(1) Partitioning and bucketing. In Doris, partitioning is performed by the keyword Partitiion, and bucketing is performed by the keyword Distributed. The keywords for partitioning and bucketing must be defined in the key of the table building model first. Partitioning and bucketing can well optimize the query performance of large tables. However, what field to choose as the partition bucketing field needs to be considered. If in a SQL, if there is no hit partition field or bucket field in the condition, then the query performance may be greatly reduced. Another point to mention is that Doris supports the dynamic partition function well, which is very friendly to developers. The Kudu partition can only be done manually.

(2) Prefix index. The first fields of the above table building script are event_name, event_time, user_id. That's because these fields are often used as conditional fields for queries, and this way of building tables is conducive to the effect of prefix indexes. In the three data models of Aggregate, Uniq and Duplicate. The underlying data storage is sorted and stored according to the columns specified in the AGGREGATE KEY, UNIQ KEY and DUPLICATE KEY in the respective table creation statements.

(3) The number of concurrency. If you find that the SQL query performance is not good in practice, and observe that the CPU utilization of the machine is not high, you can try to adjust the number of buckets and the number of concurrency. Number of concurrency = (number of buckets * number of partitions) / number of machines, set the "parallel_fragment_exec_instance_num" parameter accordingly.

(4) Colocate Join. Doris supports a variety of distributed Join methods, not only Broadcast Join, Shuffle Join, but also Colocate Join. Compared with Shuffle Join and Broadcast Join, Colocate Join has higher performance without data network transmission during query. In the specific implementation of Doris, Colocate Join can have higher concurrency granularity than Shuffle Join, and can also significantly improve the performance of Join. For details, please refer to (https://blog.bcmeng.com/post/doris-colocate-join.html#why-colocate-join).
```

### 2.4 Performance test
The following are the results of our performance test on Doris in combination with our own scenarios.

#### 2.4.1 Create event table 5000W and user table 4000W for associated query

<img src="https://pic3.zhimg.com/80/v2-9de03144ef518fa14dbb7050d626762a_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="813" data-rawheight="266" class="origin_image zh-lightbox-thumb lazy" width="813" data-original="https://pic3.zhimg.com/v2-9de03144ef518fa14dbb7050d626762a_r.jpg" data-actualsrc="https://pic3.zhimg.com/v2-9de03144ef518fa14dbb7050d626762a_b.jpg" data-lazy-status="ok">

#### 2.4.2 Tuning parameters, tc_use_memory_min=21474836480, chunk_reserved_bytes_limit=21474836480
Remove the order by of sql.

<img src="https://pic2.zhimg.com/80/v2-c32830b76b7ee8223c88cbf98535d0a5_1440w.png" data-caption="" data-size="normal" data-rawwidth="814" data-rawheight="119" class="origin_image zh-lightbox-thumb lazy" width="814" data-original="https://pic2.zhimg.com/v2-c32830b76b7ee8223c88cbf98535d0a5_r.jpg" data-actualsrc="https://pic2.zhimg.com/v2-c32830b76b7ee8223c88cbf98535d0a5_b.png" data-lazy-status="ok">

#### 2.4.3 Collocate Join

<img src="https://pic3.zhimg.com/80/v2-a0f3743f52a3b0dfb4a633fc4d733706_1440w.png" data-caption="" data-size="normal" data-rawwidth="810" data-rawheight="119" class="origin_image zh-lightbox-thumb lazy" width="810" data-original="https://pic3.zhimg.com/v2-a0f3743f52a3b0dfb4a633fc4d733706_r.jpg" data-actualsrc="https://pic3.zhimg.com/v2-a0f3743f52a3b0dfb4a633fc4d733706_b.png" data-lazy-status="ok">

#### 2.4.4 Lift machine configuration, 8C->16C

<img src="https://pic1.zhimg.com/80/v2-a7c0e424c5c1f1017bc31df50ab708e8_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="813" data-rawheight="288" class="origin_image zh-lightbox-thumb lazy" width="813" data-original="https://pic1.zhimg.com/v2-a7c0e424c5c1f1017bc31df50ab708e8_r.jpg" data-actualsrc="https://pic1.zhimg.com/v2-a7c0e424c5c1f1017bc31df50ab708e8_b.jpg" data-lazy-status="ok">

The above verifications improve the performance of SQL queries by changing SQL syntax, adjusting relevant parameters, using Collocate Join, matching prefix indexes, and even improving machine configuration. The subsequent tests are to perform stress testing on the query while concurrently importing. From the test results, the query ability of the Doris engine is very good.

### 2.5 Report Display
Based on Doris' excellent query ability, the construction of our self-service BI system has become very easy. The figure below is a screenshot of the self-service BI analysis system that WeLab finally implemented. Through this analysis system, business personnel can see the data analysis results they want in just a few minutes. Whether in terms of development costs, maintenance costs, or business benefits brought by rapid analysis, real-time self-service BI reports are of great value to the business.

<img src="https://pic3.zhimg.com/80/v2-9abaf5b3d212555bef1dde6e88bc748a_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1280" data-rawheight="679" class="origin_image zh-lightbox-thumb lazy" width="1280" data-original="https://pic3.zhimg.com/v2-9abaf5b3d212555bef1dde6e88bc748a_r.jpg" data-actualsrc="https://pic3.zhimg.com/v2-9abaf5b3d212555bef1dde6e88bc748a_b.jpg" data-lazy-status="ok">

## 3 Online User Operation
As we all know, the high cost of customer acquisition is a major problem that plagues various Internet financial APPs today. At present, the best way to deal with this problem is to effectively analyze user behavior, explore the key behaviors of different users, and gain insight into the growth points behind the indicators. And track user behavior through events, retention, funnels, user portraits and other related models, use data to guide product improvement directions, and quickly verify.

<img src="https://pic4.zhimg.com/80/v2-01f13dfd434a85225aa3a5891e8ad7af_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1280" data-rawheight="686" class="origin_image zh-lightbox-thumb lazy" width="1280" data-original="https://pic4.zhimg.com/v2-01f13dfd434a85225aa3a5891e8ad7af_r.jpg" data-actualsrc="https://pic4.zhimg.com/v2-01f13dfd434a85225aa3a5891e8ad7af_b.jpg" data-lazy-status="ok">

In user behavior analysis, the establishment and calculation of user behavior conversion models (such as funnel, retention rate, etc.) are the most critical and complex. The WeLab real-time big data platform has gone through several stages in calculating the user behavior transformation model: the offline computing stage, the Hbase stage and the current Doris stage.

### 3.1 Offline computing stage
As mentioned above, in the early stage of the construction of the big data platform, we completely calculated the user behavior model through the ecology of the Hadoop big data technology. At that time, we stored the data on HDFS, and then used MR to calculate the conversion result of user behavior, so as to realize the funnel, retention and other conversion models.

The biggest problem with this method is that the timeliness is very poor. Generally, it is a "T+1" delivery method. For operators, they cannot quickly observe the user's use of the product, which reduces the efficiency of product optimization.

### 3.2 Hbase stage

In order to increase the timeliness of user behavior conversion, we refer to a large number of materials, including the "Tens of billions of user behavior data every day, how does Meituan Dianping achieve second-level conversion analysis?" shared by Meituan. (https://tech.meituan.com/2018/03/20/user-funnel-analysis-design-build.html). Through the investigation of various cases, we found that using bitmap to calculate the analysis model related to user conversion is a better solution. But at that time, we did not investigate the big data storage that supports the bitmap structure, so we constructed a pseudo-bitmap data structure based on hbase and its unique structure.

This method requires special processing of HBase's Rowkey. It needs to combine four elements of table name, field, value, and time to form a Rowkey, and then store it in bytes through a sequence. In this way, any dimension can be defined as a label, and the user ID can be stored as a column. The interface can realize the optional field selection, and the value is used as a condition to filter the user. However, hbase itself does not support the intersection operation of bitmap, so the data must be loaded into the java memory first, converted into the RoaringLongBitmap model, and finally, various user conversion calculations can be performed.

But this method encountered a lot of performance problems in the later stage. As the amount of Scan Rowkeys increases, more and more columns are created by value. Finally, the performance must be optimized by optimizing the number of columns. Every time a query is made, a large amount of data needs to be loaded into the memory first and then bit operations are performed, which consumes a lot of memory resources.

### 3.3 Doris stage

In order to solve the performance problem of the Hbse solution, we continue to investigate the open source big data storage system that supports the Bitmap data structure. Coincidentally, while we were looking for a new MPP execution engine, we found that Apache Doris supports the bitmap structure. Through research, and referring to the article shared by Meituan engineers "Apache Doris Bitmap-Based Accurate Deduplication and User Behavior Analysis" (https://blog.bcmeng.com/post/doris-bitmap.html#a-store-about- bitmap-count-distinct), we have refactored the user conversion analysis function of the platform.

Specifically, our work is divided into several steps: table building, data import, data format conversion, and SQL query.

#### 3.3.1 Create table

Our table structure refers to the design of Hbase Rowkey, retaining the main elements such as table, field, value, time and so on. The table creation script is as follows:

<img src="https://pic4.zhimg.com/80/v2-1a8e2b33ca2ad1977a98f835f429aaab_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1328" data-rawheight="1140" class="origin_image zh-lightbox-thumb lazy" width="1328" data-original="https://pic4.zhimg.com/v2-1a8e2b33ca2ad1977a98f835f429aaab_r.jpg" data-actualsrc="https://pic4.zhimg.com/v2-1a8e2b33ca2ad1977a98f835f429aaab_b.jpg" data-lazy-status="ok">

#### 3.3.2 Data Import
Doris supports a variety of data import methods (for details, please refer to Doris's official documentation). In our scenario, we use the Stream Load method. Because the design of our data warehouse is to first store data from various upstream business layers, including relational databases, logs, MQ and other data sources, subscribe to the data bus uniformly, process, clean, and then write to the data workshop. The specified big data store. The principle of Stream Load is to import data through http, which can be well adapted to the unified write storage interface of Data Workshop.

<img src="https://pic4.zhimg.com/80/v2-ac7a33651a746d9cafb8204bd2515a9b_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1280" data-rawheight="659" class="origin_image zh-lightbox-thumb lazy" width="1280" data-original="https://pic4.zhimg.com/v2-ac7a33651a746d9cafb8204bd2515a9b_r.jpg" data-actualsrc="https://pic4.zhimg.com/v2-ac7a33651a746d9cafb8204bd2515a9b_b.jpg" data-lazy-status="ok">

The performance of Stream Load is excellent and meets the real-time requirements of our big data platform. The following are the application layer import performance test results we did on Doris.

<img src="https://pic4.zhimg.com/80/v2-4b5e8ac0097597ed8642d787ddb2322b_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="1126" data-rawheight="968" class="origin_image zh-lightbox-thumb lazy" width="1126" data-original="https://pic4.zhimg.com/v2-4b5e8ac0097597ed8642d787ddb2322b_r.jpg" data-actualsrc="https://pic4.zhimg.com/v2-4b5e8ac0097597ed8642d787ddb2322b_b.jpg" data-lazy-status="ok">

It can be seen from the test results that the import performance of Stream Load is affected by several factors, including the amount of data imported each time, the number of concurrent import tasks, and the machine configuration. In order to maximize the import performance, it is necessary to adjust these factors according to the actual situation.

However, for our platform, there are some disadvantages to caching data in memory and then calling Stream Load. For example, data will be accumulated in java memory before being written to Doris. Then, when the number of tasks increases and the batches become larger, the overall memory consumption will become larger and larger, which may lead to OOM. Therefore, it is recommended that before using it online,

Simulate the data volume of a production environment, conduct performance tests, and obtain performance indicators as a reference.

#### 3.3.3 Data Conversion
The imported data is stored in rows. For example, a row of data in the event table contains fields such as the user's name, country, age, and gender, and the corresponding values of these fields can become a label. During data conversion, different columns in each row of data need to be converted into the information in the corresponding bitmap structure, and then imported into the corresponding Doris table.

#### 3.3.4 SQL query
Finally, through sql query, the intersection operation of bitmap can be completed at the bottom of the data storage. The following is an example of our intersection operation.

<img src="https://pic2.zhimg.com/80/v2-5985ad75ff29b7884ad9c60aef186d55_1440w.jpg" data-caption="" data-size="normal" data-rawwidth="502" data-rawheight="518" class="origin_image zh-lightbox-thumb lazy" width="502" data-original="https://pic2.zhimg.com/v2-5985ad75ff29b7884ad9c60aef186d55_r.jpg" data-actualsrc="https://pic2.zhimg.com/v2-5985ad75ff29b7884ad9c60aef186d55_b.jpg" data-lazy-status="ok">

The bitmap query performance of the Doris engine is superior, and the results are basically in seconds. In terms of functionality, bitmap still has room for improvement. For example, there is no method in the bitmap query API that returns the user IDs in the bitmap as a list. There is only one "BITMAP_FROM_STRING" method that can convert a bitmap to string form. But strings cannot be directly returned by sql query, because there may be a huge number of users of bitmap, which may be on the order of tens of millions or even hundreds of millions. If it is in the form of a list, the size of the user ID list can be intercepted by paging, and then the user details can be reversely checked and displayed on the front end, which is beneficial to the operation and tracking of the user details.

## 4. Summary
This article describes how the WeLab real-time big data platform integrates the Apache Doris engine, and how we think and deal with some problems encountered in the construction of the platform.

In the continuous evolution of the platform, we realize that the Hadoop ecosystem is the cornerstone of big data technology. However, with the development of technology, the development cost and operation and maintenance cost of the Hadoop ecosystem are difficult to meet the rapid iteration needs of today's Internet business. In fact, not all companies are suitable for the huge big data ecology of hadoop.

The MPP engine represents a trend in the future development of big data. Among them, Apache Doris is an excellent representative of the MPP engine. The original idea of ​​MPP architecture is to eliminate shared resources, each executor has separate CPU, memory and hard disk resources. One executor cannot directly access resources on another executor except through controlled data exchange over the network. This architecture perfectly solves the scalability problem.

But no matter what kind of technology is perfect, any technology must continue to improve and develop in order to better meet the needs of users and truly reflect the value of technology. I hope that all technicians will work together to continue to promote great technological development.