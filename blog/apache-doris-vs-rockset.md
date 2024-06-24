---
{
    'title': 'Why Apache Doris is the Best Open Source Alternative to Rockset',
    'summary': "Among of all the claim-to-be alternatives to Rockset, Apache Doris is one of the few that cover all the key features of Rockset.",
    'description': "Among of all the claim-to-be alternatives to Rockset, Apache Doris is one of the few that cover all the key features of Rockset.",
    'date': '2024-06-24',
    'author': 'Apache Doris',
    'tags': ['Top News'],
    'picked': "true",
    'order': "1",
    "image": '/images/doris-vs-rockset.jpeg'
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

OpenAI dropped a bomb on the data world by announcing [the acquisition of Rockset](https://openai.com/index/openai-acquires-rockset/), a cloud-based, fully managed analytical database. Among all the congratulating voices, one question is raised: **why [Rockset](https://rockset.com)**?

![OpenAI acquisition Rockset](/images/openai-twitter-rockset.png)

Founded in 2016 by Venkat Venkataramani, former Engineering Director at Meta, Rockset focuses on real-time search and data analytics. Compared to other DBMS, Rockset stands out by its:

- **Real-time data updates**: Rockset ensures data freshness for users by its capabilities in fetching and delivering the latest data. It supports real-time updates at the granularity of data fields, which can be performed within milliseconds.

- **Converged index**: It reaps the benefits of inverted index, columnar storage, and row-oriented storage, and provides efficient and flexible data querying services.

- **Native support for semi-structured data**: Rockset is well-suited to the growing demand for semi-structured data processing, hash joins, and nested loop joins.

- **SQL and JOIN compatibility**: The Search Index of Rockset is optimized for various join queries.

The news also gaves all Rockset users a ticking time bomb: they have to find an appropriate alternative to Rockset for their own use case within three months. This, of course, arises as an opportunity for other analytical databases on the market. However, of all the claim-to-be alternatives, only a few of them cover all the above-mentioned key features of Rockset. Among them, Apache Doris is worth looking into.

As an open-source real-time data warehouse, Apache Doris is trusted by over 4000 enterprise users worldwide with powerful functionalities including:

- **Real-time data updates**: Apache Doris supports not only [real-time updates](https://doris.apache.org/docs/table-design/data-model/unique) and deletion, but also real-time partial column updates, making it particularly useful in cases involving frequent data updates.

- **Row/column hybrid storage**: Apache Doris is a column-oriented data warehouse that achieves world-leading OLAP performance on [ClickBench](https://benchmark.clickhouse.com/). Additionally, it supports row-oriented storage to serve [high-concurrency point query scenarios](https://doris.apache.org/docs/query/high-concurrent-point-query/), which allows it to respond to almost a million query requests within milliseconds. 

- **[Inverted index](https://doris.apache.org/docs/table-design/index/inverted-index) and full-text searches**: Apache Doris provides high efficiency and flexibility in keyword searching. It allows index creation on all fields and a flexible combination of data fields for multi-dimensional data analysis.

- **Native support for semi-structured data**: Apache Doris has introduced the [VARIANT](https://doris.apache.org/docs/sql-manual/sql-types/Data-Types/VARIANT) data type to accommodate semi-structured data. It enables flexible data schema and high query speed on top of cost-efficient data storage. Compared to traditional JSON methods, VARIANT can bring a 10x performance improvement.

- **Support for various SQL and [join operations](https://doris.apache.org/docs/query/join-optimization/doris-join-optimization)**: Apache Doris is highly compatible with MySQL syntaxes and interfaces. It supports INNER JOIN, CROSS JOIN, and all types of OUTER JOIN. The best part is its capability of auto-optimization based on data types to guarantee optimal performance under different circumstances.

As a Top-Level Project of the Apache Software Foundation, Apache Doris is supported by a robust and fast-growing community. It has accumulated over 11.8K GitHub stars and 636 contributors so far.

If you are seeking a fully managed solution instead of an open source product, you might want to look into [VeloDB](https://www.velodb.io). As the commercial service provider of Apache Doris, VeloDB offers a wider range of products that are more tailored to the needs of enterprises. [VeloDB Cloud](https://www.velodb.io/cloud) decouples compute and storage on the basis of Apache Doris, thus realizing higher elastic scalability and cost efficiency. Like cloud-based Rockset, it frees users from tedious database operations and maintenance and redirects their focus to what drives their business growth.