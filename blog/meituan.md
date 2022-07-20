---
{
    'title': 'Best Practice of Apache Doris in Meituan',
    'summary': "Introduction: This paper mainly introduces a general method and practice of real-time data warehouse construction. The real-time data warehouse aims at end-to-end low latency, SQL standardization, rapid response to changes, and data unification. In practice, the best practice we summarize is: a common real-time production platform + a common interactive real-time analysis engine cooperate with each other to meet real-time and quasi-real-time business scenarios. The two have a reasonable division of labor and complement each other to form an easy-to-develop, easy-to-maintain, and most efficient assembly line, taking into account development efficiency and production costs, and satisfying diverse business needs with a better input-output ratio.",
    'date': '2022-07-20',
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

# Best Practice of Apache Doris in Meituan

Introduction: This paper mainly introduces a general method and practice of real-time data warehouse construction. The real-time data warehouse aims at end-to-end low latency, SQL standardization, rapid response to changes, and data unification. In practice, the best practice we summarize is: a common real-time production platform + a common interactive real-time analysis engine cooperate with each other to meet real-time and quasi-real-time business scenarios. The two have a reasonable division of labor and complement each other to form an easy-to-develop, easy-to-maintain, and most efficient assembly line, taking into account development efficiency and production costs, and satisfying diverse business needs with a better input-output ratio.

# real-time scene

There are many scenarios in which real-time data is delivered in Meituan, mainly including these following points:

- Operational level: Such as real-time business changes, real-time marketing effects, daily business status and daily real-time business trend analysis, etc.
- Production level: such as whether the real-time system is reliable, whether the system is stable, real-time monitoring of the health of the system, etc.
- C-end users: For example, search recommendation sorting requires real-time understanding of users' thoughts, behaviors and characteristics, and recommendation of more concerned content to users.
- Risk control: Food delivery and financial technology are used a lot. Real-time risk identification, anti-fraud, abnormal transactions, etc., are all scenarios where a large number of real-time data are applied

# Real-time technology and architecture

### 1.Real-time computing technology selection

At present, there are many open source real-time technologies, among which Storm, Spark Streaming and Flink are common. The specific selection depends on the business situation of different companies.

Meituan Takeaway relies on the overall construction of meituan's basic data system. In terms of technology maturity, It used Storm a few years ago, which was irreplaceable in terms of performance stability, reliability and scalability. As Flink becomes more and more mature, it has surpassed Storm in terms of technical performance and framework design advantages. In terms of trends, just like Spark replacing MR, Storm will be gradually replaced by Flink. Of course, there will be a process of migrating from Storm to Flink. We currently have some old tasks still on Storm, and we are constantly promoting task migration.

The comparison between Storm and Flink can refer to the form above.

### 2.Real-time Architecture

#### ① Lambda Architecture

The Lambda architecture is a relatively classic architecture. In the past, there were not many real-time scenarios, mainly offline. When a real-time scene is attached, the technical ecology is different due to the different timeliness of offline and real- time. The Lambda architecture is equivalent to attaching a real-time production link, which is integrated at the application level, and two-way production is independent of each other.This is also a logical approach to adopt in business applications.

There will be some problems in dual-channel production, such as double processing logic, double development and operation and maintenance, and resources will also become two resource links. Because of these problems,  Kappa architecture has been evolved.

#### ② Kappa Architecture

The Kappa architecture is relatively simple in terms of architecture design, unified in production, and a set of logic produces both offline and real time. However, there are relatively large limitations in practical application scenarios. There are few cases in the industry that directly use the Kappa architecture for production and implementation,  and the scene is relatively simple. These problems will also be encountered on our side, and we will also have some thoughts of our own, which will be discussed later.

# Business Pain Points

In the take-away business, we also encountered some problems.

In the early stage of the business, in order to meet the business needs, the requirements are generally completed case by case after the requirements are obtained. The business has high real-time requirements. From the perspective of timeliness, there is no opportunity for middle-level precipitation. In the scenario, the business logic is generally directly embedded. This is a simple and effective method that can be imagined. This development mode is relatively common in the early stage of business development.

As shown in the figure above, after getting the data source, it will go through data cleaning, dimension expansion, business logic processing through Storm or Flink, and finally direct business output. Taking this link apart, the data source will repeatedly refer to the same data source, and the operations such as cleaning, filtering, and dimension expansion must be repeated. The only difference is that the code logic of the business is different. IIf there is less business, this model is acceptable, but when the subsequent business volume increases, there will be a situation where whoever develops will be responsible for operation and maintenance, the maintenance workload will increase, and the operations cannot be managed in a unified manner. Moreover, everyone is applying for resources, resulting in a rapid expansion of resource costs, and resources cannot be used intensively and effectively. Therefore, it is necessary to think about how to construct real-time data from the whole data source.

# Data features and Application Scenario

So how to build a real-time data warehouse?

First of all, we need to disassemble this task into what data, what scenarios, and what features these scenarios have in common. For takeaway business scenarios, there are two categories, log class and business category.

- Log class: It is characterized by a large amount of data, semi-structured, and deeply nested.Log data has a great feature that once the log stream is formed, it will not change. It will collect all the logs of the platform by means of buried points, and then collect and distribute them uniformly. Just like a tree with really large roots.  The whole process of pushing to the front-end application is just like the process of a tree branching from the root to a branch (the decomposition process from 1 to n). If all businesses search for data from the root, although the path seems to be the shortest, because of the heavy burden,the data retrieval efficiency is low. Log data is generally used for production monitoring and user behavior analysis. The timeliness requirements are relatively high . Generally, the  time window will be 5 minutes or 10 minutes, or up to the current state. The main application is the real-time large screen and real-time features, such as behaviour can immediately perceive the need for waiting every time the user clicks.

- Business category: The business class is mainly about business transaction data. Business systems are usually self-contained and distribute data down in the form of Binlog logs. All business systems are transactional, mainly using paradigm modeling methods, which have a structured characteristic and the main part can be seen clearly. However, due to the large number of data tables, multi-table associations are required to express the complete business. So it's an integrated machining process from n to 1 .

Several difficulties faced by business real-time processing:

- Diversity of business: Business processes are constantly changing from the beginning to the end, such as from ordering -> payment -> delivery. The business database is changed  on the original basis,and Binlog will generate a lot of changed logs. Business analysis is more focused on the end state, which leads to the problem of data retraction calculation, such as placing an order at 10 o'clock and canceling it at 13 o'clock, but hoping to subtract the canceled order at 10 o'clock.

- Business integration: Business analysis data usually cannot be expressed by a single subject, and often many tables are associated to obtain the desired information. When confluent alignment of data is performed in real-time streaming, it often requires large cache processing and is complicated.

- The analysis is batch, and the processing process is streaming: for a single data, no analysis can be formed, so the analysis object must be batch, and the data processing is one by one.

The scenarios of log classes and business classes generally exist at the same time and are intertwined. Whether it is Lambda architecture or Kappa architecture, a single application will have some problems, so it is more meaningful to choose the architecture and practice according to the scenario.

# Architecture Design of Real-time Data Warehouse

### 1.Real-time Architecture: Exploration of Stream-Batch Combination

Based on the above problems, we have our own thinking and ideas，it is to deal with different business scenarios through the combination of flow and batch.

As shown in the figure above, the data is collected from the log to the message queue, and then to the ETL process of the data stream. The construction of the basic data stream is unified. Afterwards, for log real-time features, real-time large-screen applications use real-time stream computing. Real-time OLAP batch processing is used for Binlog business analysis.

What are the Pain Points of Stream Processing Analysis Business? For the paradigm business, both Storm and Flink require a large amount of external memory to achieve business alignment between data streams, which requires a lot of computing resources. Due to the limitation of external memory, the window limitation strategy must be carried out, and may eventually discard some data as a result. After calculation, it is generally stored in Redis as query support, and KV storage has many limitations in dealing with analytical query scenarios.

How to achieve real-time OLAP? Is there a real-time computing engine with its own storage, when the real-time data is entered,it can flexibly and freely calculate within a certain range, and has a certain data carrying capacity, and supports analysis of query responses at the same time? With the development of technology, the current MPP engine is developing very rapidly, and its performance is also improving rapidly, so there is a new possibility in this scenario, just like the Doris engine we use here.

This idea has been practiced in the industry and has become an important exploration direction. For example, Alibaba's real-time OLAP solution based on ADB, etc.

### 2.Architecture Design of Real-time Data Warehouse

From the perspective of the entire real-time data warehouse architecture, the first thing to consider is how to manage all real-time data, how to effectively integrate resources, and how to construct data.

In terms of methodology, the real-time and offline are very similar to each other. In the early stage of offline data warehouse, it is also case by case. Consider how to govern it when the scale of data increases to a certain amount. We all know that layering is a very effective way of data governing. So, on the issue of how to manage the real-time data warehouse, the first consideration is also the hierarchical processing logic, as follows:

- Data source: At the data source level, offline and real-time data sources are consistent. They are mainly divided into log classes and business classes. Log classes include user logs, DB logs, and server logs.

- Real-time detail layer: At the detail level, in order to solve the problem of repeated construction, a unified construction should be carried out.Using the offline data warehouse model to build a unified basic detailed data layer, managed according to the theme, the purpose of the detail layer is to provide directly available data downstream, so the basic layer should be processed uniformly, such as cleaning, filtering, and dimension expansion.

- Aggregation layer: The summary layer can directly calculate the result through the concise operator of Flink or Storm. And form a summary of indicators, all indicators are processed at the summary layer, and everyone manages and constructs according to unified specifications, forming a reusable summary result.

In conclusion, from the perspective of the construction of the entire real-time data warehouse,first of all, the data construction needs to be layered, build the framework first, and set the specifications includs  what extent each layer is processed and how each layer is used.The definition of specifications facilitates standardized processing in production.Due to the need to ensure timeliness, don't design too many layers when designing.For scenarios with high real-time requirements, you can basically refer to the left side of the figure above. For batch processing requirements, you can import from the real-time detail layer to the real-time OLAP engine, and perform fast retraction calculations based on the OLAP engine's own calculation and query capabilities, as shown in the data flow on the right side of the figure above.

# Real-time platform construction

After the architecture is determined, the next consideration is how to build a platform.The construction of the real-time platform is completely attached to the real-time data warehouse management.

First, abstract the functions and abstract them into components, so that standardized production can be achieved, and systematic guarantees can be further constructed. For the basic processing layer cleaning, filtering, confluence, dimension expansion, conversion, encryption, screening and other functions can be abstracted, and the base layer builds a directly usable data result stream in this componentized way. How to meet diverse needs and how to be compatible with users are the problems that we need to figure out. In this case it may occur problems with redundant processing. In terms of storage, real-time data does not have a history and will not consume too much storage. This redundancy is acceptable.The production efficiency can be improved by means of redundancy, which is an ideological application of changing space for time.

Through the processing of the base layer, all data is deposited in the IDL layer, and written to the base layer of the OLAP engine at the same time, and then the real-time summary layer is calculated. Based on Storm, Flink or Doris, multi-dimensional summary indicators are produced to form a unified summary layer for unified storage distribution.

When these functions are available, system capabilities such as metadata management, indicator management, data security, SLA, and data quality will be gradually built.

### 1.Real-time base layer functions

The construction of the real-time base layer needs to solve some problems.

The first is the problem of repeated reading of a stream. When a Binlog is called, it exists in the form of a DB package. Users may only use one of the tables. If everyone wants to use it, there may be a problem that everyone needs to access this stream. The solution can be deconstructed according to different businesses, restored to the basic data flow layer, made into a paradigm structure according to the needs of the business, and integrated with the theme construction according to the modeling method of the data warehouse.

Secondly, we need to encapsulate components, such as basic layer cleaning, filtering, and dimension expansion . Users can write logic by a very simple expression. Trans part is more flexible. For example, converting from one value to another value, for this custom logic expression, we also open custom components, which can develop custom scripts through Java or Python for data processing.

### 2.Real-time feature production capabilities

Feature production can be expressed logically through SQL syntax, and the underlying logic is adapted, and transparently transmitted to the computing engine, shielding the user's dependence on the computing engine.Just like for offline scenarios, currently large companies rarely develop through code, unless there are some special cases, so they can basically be expressed in SQL.

At the functional level, the idea of indicator management is integrated. Atomic indicators, derived indicators, standard calculation apertures, dimension selection, window settings and other operations can be configured in a configurable way.In this way, the production logic can be uniformly parsed and packaged uniformly.

Another question,with the same source code a lot of SQL is written, and each submission will have a data stream which is a waste of resources.Our solution is to produce dynamic metrics through the same data stream, so that metrics can be added dynamically without stopping the service.

So, during the construction of the real-time platform, engineers should consider more about how to use resources more effectively and which links can use resources more economically.

### 3.SLA construction

SLA mainly solves two problems, one is about the end-to-end SLA, the other is  about the SLA of job productivity. We adopt the method of burying points + reporting.Because the real-time stream is relatively large, the burying point should be as simple as possible, do not bury too many things,can express the business information is enough.The output of each job is reported to the SLA monitoring platform in a unified manner, and the required information is reported at each job point through a unified interface, and finally the end-to-end SLA can be counted.

In real-time production, because the process is very long, it is impossible to control all links, but it can control the efficiency of its own operations, so job SLA is also essential.

### 4.Real-time OLAP solution

Problems:

- Binlog business restoration is complex：There are many changes in the business, and changes at a certain point in time are required. Therefore, sorting and data storage are required, which consumes a lot of memory and CPU resources.

- Binlog business association is complex：In stream computing, the relationship between streams and streams is very difficult to express business logic.

solutions：

To solve the problem through the OLAP engine with computing power, there is no need to logically map a data stream, and only the problem of real-time and stable data storage needs to be solved.

We use Doris as a high-performance OLAP engine here.Due to the need for derivative calculations between the results generated by the business data and the results, Doris can quickly restore the business by using the unique model or the aggregation model, and can also perform aggregation at the summary layer while restoring the business,and is also designed for reuse.The application layer can be physical or logical view.

This mode focuses on solving the business rollback calculation. For example, when the business state changes, the value needs to be changed at a certain point in history. The cost of using flow calculation in this scenario is very high. The OLAP mode can solve this problem very well.

# Real-time use cases

In the end, we use a case to illustrate.For example, merchants want to offer discounts to users based on the number of historical orders placed by users. Merchants need to see how many orders they have placed in history. They must have historical T+1 data and real-time data today.This scenario is a typical Lambda architecture,You can design a partition table in Doris, one is the historical partition, and the other is the today partition. The historical partition can be produced offline. Today's indicators can be calculated in real time and written to today's partition. When querying, a simple summary.

This scenario seems relatively simple, but the difficulty lies in the fact that many simple problems will become complicated after the number of merchants increases.Therefore, in the future, we will use more business input to precipitate more business scenarios, abstract them to form a unified production plan and function, and support diversified business needs with minimized real-time computing resources, which is also what needs to be achieved in the future. 

That's all for today, thank you.

### about the author:

Zhu Liang, more than 5 years experience in data warehouse construction in traditional industries, 6 years experience in Internet data warehouse, technical direction involves offline, real-time data warehouse management, systematic capacity building, OLAP system and engine, big data related technologies, focusing on OLAP,and real-time technology frontier development trends.The business direction involves ad hoc query, operation analysis, strategy report product, user portrait, crowd recommendation, experimental evaluation, etc.