---
{
    'title': 'Replacing Apache Hive, Elasticsearch and PostgreSQL with Apache Doris',
    'description': "How does a data service company build its data warehouse? Simplicity is the best policy. See how a due diligence platform increased data writing efficiency by 75%.",
    'date': '2023-07-01',
    'author': 'Tao Wang',
    'tags': ['Best Practice'],
    "image": '/images/replacing-apache-hive-es-and-postgresql-with-apache-doris.png'
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

How does a data service company build its data warehouse? I worked as a real-time computing engineer for a due diligence platform, which is designed to allow users to search for a company's business data, financial, and legal details. It has collected information of over 300 million entities in more than 300 dimensions. The duty of my colleagues and I is to ensure real-time updates of such data so we can provide up-to-date information for our registered users. That's the customer-facing function of our data warehouse. Other than that, it needs to support our internal marketing and operation team in ad-hoc queries and user segmentation, which is a new demand that emerged with our growing business. 

Our old data warehouse consisted of the most popular components of the time, including **Apache** **Hive**, **MySQL**, **Elasticsearch**, and **PostgreSQL**. They support the data computing and data storage layers of our data warehouse: 

- **Data Computing**: Apache Hive serves as the computation engine.
- **Data Storage**: **MySQL** provides data for DataBank, Tableau, and our customer-facing applications. **Elasticsearch** and **PostgreSQL** serve for our DMP user segmentation system: the former stores user profiling data, and the latter stores user group data packets. 

As you can imagine, a long and complicated data pipeline is high-maintenance and detrimental to development efficiency. Moreover, they are not capable of ad-hoc queries. So as an upgrade to our data warehouse, we replaced most of these components with [Apache Doris](https://github.com/apache/doris), a unified analytic database.

![replace-MySQL-Elasticsearch-PostgreSQL-with-Apache-Doris-before](/images/Tianyancha_1.png)

![replace-MySQL-Elasticsearch-PostgreSQL-with-Apache-Doris-after](/images/Tianyancha_2.png)

## Data Flow

This is a lateral view of our data warehouse, from which you can see how the data flows.

![data-flow](/images/Tianyancha_3.png)

For starters, binlogs from MySQL will be ingested into Kafka via Canal, while user activity logs will be transferred to Kafka via Apache Flume. In Kafka, data will be cleaned and organized into flat tables, which will be later turned into aggregated tables. Then, data will be passed from Kafka to Apache Doris, which serves as the storage and computing engine. 

We adopt different data models in Apache Doris for different scenarios: data from MySQL will be arranged in the [Unique model](https://doris.apache.org/docs/dev/data-table/data-model/#unique-model), log data will be put in the [Duplicate model](https://doris.apache.org/docs/dev/data-table/data-model/#duplicate-model), while data in the DWS layer will be merged in the [Aggregate model](https://doris.apache.org/docs/dev/data-table/data-model/#aggregate-model).

This is how Apache Doris replaces the roles of Hive, Elasticsearch, and PostgreSQL in our datawarehouse. Such transformation has saved us lots of efforts in development and maintenance. It also made ad-hoc queries possible and our user segmentation more efficient. 

## Ad-Hoc Queries

**Before**: Every time a new request was raised, we developed and tested the data model in Hive, and wrote the scheduling task in MySQL so that our customer-facing application platforms could read results from MySQL. It was a complicated process that took a lot of time and development work. 

**After**: Since Apache Doris has all the itemized data, whenever it is faced with a new request, it can simply pull the metadata and configure the query conditions. Then it is ready for ad-hoc queries. In short, it only requires low-code configuration to respond to new requests. 

![ad-hoc-queries](/images/Tianyancha_4.png)

## User Segmentation

**Before**: After a user segmentation task was created based on metadata, the relevant user IDs would be written into the PostgreSQL profile list and the MySQL task list. Meanwhile, Elasticsearch would execute the query according to the task conditions; after the results are produced, it would update status in the task list and write the user group bitmap package into PostgreSQL. (The PostgreSQL plug-in is capable of computing the intersection, union, and difference set of bitmap.) Then PostgreSQL would provide user group packets for downstream operation platforms.

Tables in Elasticsearch and PostgreSQL were unreusable, making this architecture cost-ineffective. Plus, we had to pre-define the user tags before we could execute a new type of query. That slowed things down.  

**After**: The user IDs will only be written into the MySQL task list. For first-time segmentation, Apache Doris will execute the **ad-hoc query** based on the task conditions. In subsequent segmentation tasks, Apache Doris will perform **micro-batch rolling** and compute the difference set compared with the previously produced user group packet, and notify downstream platforms of any updates. (This is realized by the [bitmap functions](https://doris.apache.org/docs/dev/sql-manual/sql-functions/bitmap-functions/bitmap_union) in Apache Doris.) 

In this Doris-centered user segmentation process, we don't have to pre-define new tags. Instead, tags can be auto-generated based on the task conditions. The processing pipeline has the flexibility that can make our user-group-based A/B testing easier. Also, as both the itemized data and user group packets are in Apache Doris, we don't have to attend to the read and write complexity between multiple components.

![user-segmentation-pipeline](/images/Tianyancha_5.png)

## Trick to Speed up User Segmentation by 70%

Due to risk aversion reasons, random generation of `user_id` is the choice for many companies, but that produces sparse and non-consecutive user IDs in user group packets. Using these IDs in user segmentation, we had to endure a long waiting time for bitmaps to be generated. 

To solve that, we created consecutive and dense mappings for these user IDs. **In this way, we decreased our user segmentation latency by 70%.**

![user-segmentation-latency-1](/images/Tianyancha_6.png)

![user-segmentation-latency-2](/images/Tianyancha_7.png)

### Example

**Step 1: Create a user ID mapping table:**

We adopt the Unique model for user ID mapping tables, where the user ID is the unique key. The mapped consecutive IDs usually start from 1 and are strictly increasing. 

![create-user-ID-mapping-table](/images/Tianyancha_8.png)

**Step 2: Create a user group table:**

We adopt the Aggregate model for user group tables, where user tags serve as the aggregation keys. 

![create-user-group-table](/images/Tianyancha_9.png)

Supposing that we need to pick out the users whose IDs are between 0 and 2000000. 

The following snippets use non-consecutive (`tyc_user_id`) and consecutive (`tyc_user_id_continuous`) user IDs for user segmentation, respectively. There is a big gap between their **response time:**

- Non-Consecutive User IDs: **1843ms**
- Consecutive User IDs: **543ms** 

![response-time-of-consecutive-and-non-consecutive-user-IDs](/images/Tianyancha_10.png)

## Conclusion

We have 2 clusters in Apache Doris accommodating tens of TBs of data, with almost a billion new rows flowing in every day. We used to witness a steep decline in data ingestion speed as data volume expanded. But after upgrading our data warehouse with Apache Doris, we increased our data writing efficiency by 75%. Also, in user segmentation with a result set of less than 5 million, it is able to respond within milliseconds. Most importantly, our data warehouse has been simpler and friendlier to developers and maintainers. 

![user-segmentation-latency-3](/images/Tianyancha_11.png)

Lastly, I would like to share with you something that interested us most when we first talked to the [Apache Doris community](https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-2unfw3a3q-MtjGX4pAd8bCGC1UV0sKcw):

- Apache Doris supports data ingestion transactions so it can ensure data is written **exactly once**.
- It is well-integrated with the data ecosystem and can smoothly interface with most data sources and data formats.
- It allows us to implement elastic scaling of clusters using the command line interface.
- It outperforms ClickHouse in **join queries**.

Find Apache Doris developers on [Slack](https://join.slack.com/t/apachedoriscommunity/shared_invite/zt-1t3wfymur-0soNPATWQ~gbU8xutFOLog)
