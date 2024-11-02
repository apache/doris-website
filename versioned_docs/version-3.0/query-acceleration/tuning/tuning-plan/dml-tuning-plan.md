---
{
    "title": "DML Tuning Plan",
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

DML Plan Tuning Includes Both Import Section (INSERT INTO SELECT) and Query Section (CREATE TABLE AS SELECT - CTAS). Next, will introduce the principles and tuning practices of these two parts separately.

## Loading

### Principles

Apache Doris offers a variety of flexible data import solutions to meet data access needs in different scenarios. Doris supports importing data from the following data sources:

1. Object storage (S3) and HDFS

2. Local files

3. Kafka

4. Relational databases (such as MySQL, PostgreSQL, Oracle, SQLServer, etc.)

5. Data sources connected via JDBC

6. JSON format data

**Doris provides the following main data import methods:**

1. Broker Load: Imports data from external storage systems through the Broker process

2. Stream Load: Streams data from local files or in-memory data

3. Routine Load: Continuously imports data from Kafka

4. INSERT INTO: Imports data through SQL insert statements

5. S3 Load: Directly imports data from object storage that supports the S3 protocol

6. MySQL Load: Uses MySQL clients to import local data

**Different import methods support slightly different data formats:**

1. Broker Load: Supports Parquet, ORC, CSV, and GZip formats

2. Stream Load: Supports CSV, JSON, Parquet, and ORC formats

3. Routine Load: Supports CSV and JSON formats

4. MySQL Load: Supports CSV format

**Data import has the following mechanisms:**

1. Atomicity guarantee: Each import job acts as a complete transaction, ensuring atomic data writes.

2. Import label: Each import job is assigned a unique label to ensure At-Most-Once semantics.

3. Synchronous/Asynchronous mode: Synchronous mode returns results immediately, while asynchronous mode requires separate querying of job status.

4. Array type support: Array type data can be imported using CAST and array functions.

5. Execution engine: Users can choose whether to use the Pipeline engine to execute import tasks based on configuration.

**In practicality, the following considerations are necessary:**

1. Reasonable selection of import methods: Choose the most appropriate import method for different data sources.

2. Utilization of label mechanism: Achieve Exactly-Once semantics guarantee.

3. Proper configuration of parallelism: Adjust the number of parallel imports based on cluster resources.

4. Monitoring of import status: For asynchronous imports, check the job's progress timely.

By flexibly using the various import functions provided by Doris, data from various sources can be efficiently imported into Doris for analysis. For more details, please refer to the [Data Loading Overview](../../../data-operate/import/import-way/load-manual).

### Loading Optimization

The Pipeline engine is a new query execution engine in Doris, designed to improve the efficiency of queries and data processing. During data import, the Pipeline engine can also be enabled to enhance overall performance. By default, the Pipeline engine is disabled during data import, but users can enable it through relevant configurations.

To enable the Pipeline engine during data import, configure the following variables:

**1. FE Configuration Item: enable_pipeline_load**

- Location: In the configuration file of the FE (Frontend)

- Function: When enabled, import tasks such as Stream Load will attempt to execute using the Pipeline engine

**2. Session Variable: enable_nereids_dml_with_pipeline**

- Location: Set at session level

- Function: When enabled, INSERT INTO statements will attempt to execute using the Pipeline engine

**3. Session Variable: enable_pipeline_engine**
   
- Location: Set at session level

- Function: Controls whether the Pipeline engine is actually enabled

## Querying

For details, please refer to other sections on [plan tuning](../../../query-acceleration/tuning/tuning-plan/optimizing-table-schema).