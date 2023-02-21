

## 360 DigiTech

Fintech businesses have stricter requirements on data security, accuracy, and real-time performance. Early ClickHouse clusters had problems such as complex operation and maintenance, low stability, and slow JOIN queries. After conducting full-research on function, operation and maintenance, maturity, security and legal risks, etc., we decided to migrate to Apache Doris and build a new real-time data warehouse. At present, 360 DigiTech has multiple sets of clusters in production, realizing second-level real-time analysis of trillions of data. In the future, we will take Apache Doris into more business scenarios.

## Momenta

The construction of an automatic driving system relies on a large amount of vehicle road test data. Plus, the road test vehicles will always collect information from road conditions and related vehicles. Based on the data collected in the road test, we built a highly available real-time data warehouse based on Apache Doris and Flink, which has achieved a nearly 10x increase in business support. In the future, we will use Apache Doris in offline batch processing scenarios more often, and push it to more internal business departments. Finally, we will build a unified data analysis platform through Apache Doris.

## Tencent Music

Content profiling is an important method of recommendation. When facing a large amount of user data, how to accurately process and analyze is the key to the formation of content profiling, and it will also affect the user experience. In order to better meet business needs, Tencent Music has carried out 4 versions of architecture iterations, among which Apache Doris has become the solution for the analysis acceleration and plays an important role in the entire data architecture. In the grouping of millions of users, the performance has been improved by nearly 20 times. At the same time, with the help of hot and cold data separation, refined management and ease of use, our storage costs and maintenance costs have been reduced by more than 40%.

## ZONGTENG Group

The early technology stack based on multiple sets of CDH architecture was so complicated that it brought heavy pressure on development and maintenance, making it impossible to quickly adapt to the growth of enterprise data and business needs with high complexity. Therefore, ZONGTENG Group adopted Apache Doris in 2022. Doris' simple architecture, excellent performance, rich ecology and other advantages helped us quickly build a unified batch and streaming data architecture.

## Pocket Xianji Network Technology

The e-commerce SaaS has clear requirements for lightweight architecture, query flexibility, and resource isolation mechanism. However, with the increase in the amount of data, ClickHouse we used has significantly reduced JOIN performance and cannot meet the needs of flexible scaling out. Therefore, we introduced Apache Doris to replace ClickHouse, and migrated all the basic data previously stored in MySQL to Doris, which not only greatly improved the efficiency of ETL, but also greatly reduced storage costs. Further, the storage space was 40% less than before. At the same time, the performance of wide table JOIN is further improved.

## Meituan

As one of the Internet companies with the largest business volume in China, Meituan is facing the challenge of low-latency analysis of massive data, and the company's rich business forms raise higher requirements for the flexibility and versatility of the OLAP engine. Therefore, Meituan conducted research on a various OLAP engines including Kylin and Druid to solve problems in different scenarios, and finally established a unified OLAP engine with Apache Doris. With years of development, Apache Doris has provided services for more than ten business departments, such as Deliveries, Grocery, Meituan's Special, Finance, Grab-n-Go, and Hotel, with over 100 clusters and thousands of machines. Meituan is also deeply involved in the development of the Apache Doris community, and plays an indispensable role in generating multiple core features such as vectorized execution engine, query optimizer, and Pipeline engine.

## Bank of Hangzhou Consumer Finance Company

Financial risk control often has higher requirements for real-time data. The early risk control data mart based on Greenplum+CDH can no longer meet the high timeliness requirements of data. The T+1 data production mode seriously reduces the efficiency of daily analysis. Therefore, Bank of Hangzhou Consumer Finance Company introduced Apache Doris in 2022. Through the Multi-Catalog function of the latest version 1.2, it realizes federated analysis with data sources such as Hive/ES, which greatly improves query performance. At the same time, Apache Doris decouples daily batch processing and statistical analysis, reducing resource consumption and further enhancing system stability.

## Qigo-Tech

Manufacturing data is well-known for numerous sources, large data volumes, strong real-time performance requirements, non-standard heterogeneity, significant noise, and frequent changes. Apache Doris’ advantages in core performance, data ecological adaptation, and scenario adaptation can help the manufacturing industry users build a variety of data analysis architectures. In a leading clothing industry data platform, Apache Doris was used as a real-time data warehouse, which shortened the project delivery due time by 40%, reduced the development workload by 30%, increased the query speed by more than 10 times, upgraded the report timeliness from T+1 to real-time , and also reduced the operation and maintenance workload by 80%.

## Xiaomi

Xiaomi Group adopted Apache Doris for the first time in 2019 due to the need for growing analysis business. After three years of development, Apache Doris has been widely used in dozens of businesses such as A/B tests, user behavior analysis, advertising BI, Xiaomi Youpin, and Xiaomi Auto, with dozens of clusters and hundreds of nodes. This year, we further carried out in-depth cooperation with Apache Doris, and used the vectorized execution engine in the A/B test. The query performance has been improved by more than 50% and the stability is higher as well. In the future, we will bring Apache Doris to more core business scenarios, and gradually upgrade to the newest version.

## Mashang Consumer Finance

With the rapid growth of business volume and the upgrading of business models, there is a higher demand for real-time data analysis, which means it is neccessary to upgrade from offline data warehouse to real-time data warehouse. After comparing the popular open source data warehouses in the industry, we finally decided to build our real-time data warehouse based on Apache Doris. At present, Apache Doris has served the data applications of more than ten business departments. The P99 query response is within 5 seconds. From data production to data application, the latency does not exceed 1 minute, which greatly improves the timeliness of data. Different types of users, including business analysts, data developers, platform managers, and operation and maintenance teams, have all benefited from Apache Doris.

## Douyu

With the rapid development of Douyu's live-streaming business, the demand for business growth analysis and revenue analysis using user behavior data is becoming more and more urgent and sophisticated. To deal with the increasing demand, Douyu introduced Apache Doris to upgrade the real-time data warehouse, standardized and improved the real-time data warehouse, and established a unified HOLAP multi-dimensional analysis platform, which solved the difficulties caused by heavy architecture in the past. At the same time, Douyu rebuilt its tag platform using Apache Doris, realizing a grouping time from minutes to seconds, stable real-time tag tasks, and a 40% decrease in output time.

## JD.COM

JD.COM's Search & Push Project started in 2019. Its goal is to bring better exposure and clicks to the high-quality goods resources of merchants on the platform through traffic control. Since joining the project, Apache Doris has been responsible for the traffic in JD.COM's Double 11 and 6.18 promotions during the past three years, with the traffic peaks reaching 450 million per minute. The 1.1.5 version released by Apache Doris has made a major breakthrough in performance and stability. The query performance is 2-3 times higher than before, and the overall cluster import throughput is increased by 100%, which greatly solves the problems and optimizes the unity of cost, efficiency and user experience.

## LY Digital

The growing demand for analysis of real-time data has further made real-time data warehouse an important part of enterprise production systems. In order to achieve a complete real-time analysis capability, we have carried out iterations of various architectures, from offline data warehouses, to real-time data warehouses, and finally to streaming compute & batch processing's integration. Finally, we built a unified data warehouse with Apache Doris, realizing the unification of storage layer, computing layer and data access layer. It not only simplifies the data links and reduces the maintenance cost of the entire data production, but also brings an easier way to use big data just like using databases. In this way, the business team has the ability to self-develop, be efficient in development, and quickly launch new requirements.

## Yunda EX

In recent years, with the vigorous development of the express logistics industry, the amount of data has increased by hundreds of times. In 2022, the number of deliveries has exceeded 100 billion. Faced with such a large amount of data, Yunda has established a data platform based on the business center and data center to provide unified and diversified data services for the business. After detailed research and selection, we decided to build a unified real-time data warehouse with Apache Doris. In this way, the new data warehouse is able to serve multi-department reporting and respond to multi-table related queries in seconds, covering more than 90% of the core indicators. In the future, we will also allow Apache Doris to serve more businesses and further promote the real-time indicators. 

## Yiguanzhiku Network Technology

In the early days, Yiguanzhiku Network Technology introduced Greenplum as the OLAP database in query analysis scenarios. With business development and technology changes, Greenplum's performance cannot support real-time analysis of large amounts of data, and the introduction of other components such as Hive/ES has brought new pressure on operation and maintenance. So Yiguanzhiku Network Technology migrated to Apache Doris from Greenplum. With the advantages of Doris’ rich data ecology and ease of use, the daily query time is reduced by 30%, the efficiency of special scenarios is increased by 5 times, and the storage space is saved up to 40%. In the future, the company will look for more feasible solutions together with Apache Doris.

## Moka

As an industry-leading, data-driven intelligent HR SaaS service, Moka BI provides comprehensive data statistics and report support for enterprise human resources. In the research of BI report engine, real-time query, standard SQL and JOIN supports are what we are looking for. After comprehensive comparison of various databases, we finally chose Apache Doris. During more than two years of use, Moka has kept following the latest versions of Doris. The performance of the latest version has been greatly improved compared with the past, and the P95 query is within 3 seconds. In the future, Moka will always use the latest features.

## 360 Security

360 Security began to use Apache Doris sinced Version 0.13. In terms of OLAP storage engine, 360 Security experienced various databases. Currently, Apache Doris is the most ideal OLAP storage engine. The excellent query performance and easy-to-use features of Apache Doris make our real-time data warehouse architecture more concise, and ensure the end-to-end consistency of real-time data. In the future, we hope to bring Apache Doris to more business scenarios and we can deeply participate in the Apache Doris community.

## ZHIHU.COM

Refined operations can improve the operating efficiency of enterprises and bring more revenue to enterprises. Effective tools can bring more business value to enterprises. Therefore, the Zhihu data platform was created and became handy in data-driven decision-making for business personnel since it was born. With its outstanding query and data processing performance, Apache Doris meets our needs for fast data ingestion, second-level grouping and insight of hundreds of billions of feature data. At the same time, after the launch of the vectorized execution engine, the grouping performance of billion-level data has increased by 10 times, and the performance of single-table aggregation query and multi-table association query have also increased by 3-5 times. In the future, we also look forward to using Apache Doris to further support our data platform to achieve refined operations, cost reduction and efficiency increase.

## Linkedcare

Linkedcare is a leader in the medical technology industry. When building the store operation platform, we encountered the downtime problem caused by high concurrency, so we chose Apache Doris to replace ClickHouse. Doris can support thousands of concurrency and easily solve the concurrency problem of the report services. Then we introduced Doris to more business units and built a unified data warehouse. Brand-new architecture makes us no longer rely on the Hadoop ecosystem, reduces the pressure of operation and maintenance, and reduces server resource consumption while greatly improving performance.

## DuyanSoft

DuyanSoft's current database architecture of MySQL + MongoDB + Elasticsearch has the problems of slow response speed, high operation cost of dim-tables and does not support high-concurrency point queries. After the introduction of Apache Doris in 2022, the query performance has been improved by more than 10 times, and the most complex queries can be responded in seconds. Doris' Join function is outstanding and can easily store dim-tables in Doris for further maintenance, significantly improving development efficiency and meeting the needs for real-time updates. At the same time, Doris' simple system architecture and enriched system functions cover business scenarios that can only be realized with multiple technology stacks, greatly simplifying the big data architecture system.

## Advance Intelligence Group

Advance Intelligence Group is a technology group driven by AI technology in Singapore. In order to solve the problems of real-time report statistics and decision analysis of billions of data volumes, Advance Intelligence Group chose the real-time data warehouse solution of Flink + Doris. After the real-time data warehouse built by Flink + Doris is launched, the response speed of the report interface has been significantly improved. The response speed of the 1 billion-level aggregation query of a single table is 0.79 seconds for TP95 and 5.03 seconds for TP99. In the future, the group will gradually upgrade Doris with the new version of the community and participate in community building.