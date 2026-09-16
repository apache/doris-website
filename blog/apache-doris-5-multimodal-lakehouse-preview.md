---
title: 'Apache Doris 5.0 Preview(1): A Unified Multimodal Lakehouse for Real-Time Analytics'
summary: 'A look at how Doris plans to extend unified search and real-time analytics across open lake formats and multimodal data.'
description: 'Explore the Apache Doris 5.0 multimodal lakehouse preview, including open-format integration, Variant and vector analytics, Physical AI, and agent use cases.'
picked: "true"
order: "1"
keywords:
  - 'Apache Doris 5.0'
  - 'multimodal lakehouse'
  - 'open table formats'
  - 'real-time analytics'
date: '2026-09-04'
author: 'Apache Doris · Mingyu Chen'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-5-multimodal-lakehouse-preview/cover.jpg'
---
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

> Overview
>
> This article covers the core changes planned for Apache Doris 5.0 for the multimodal lakehouse:
>
> 1. Core concept: Extend unified search to the open lakehouse and use Doris to build a unified platform for multimodal data analytics.
>
> 2. Integration with open formats: Provide read and write integration with mainstream open formats such as Iceberg, Paimon, and Lance.
>
> 3. Multimodal data analytics: Adapt Doris to multimodal data types such as Variant, Vector, GEO, and Blob.
>
> 4. Use cases: Build a unified real-time multimodal data analytics platform for more AI scenarios, including real-time context for agents and embodied intelligence.

---

For more than a decade, most data platforms have been organized around structured tables and SQL. Data is consolidated in a data warehouse, where stable batch processing and OLAP queries support reporting and business analysis.

AI changes the assumptions behind this architecture.

Enterprises now need to process business tables, JSON, logs, documents, images, audio, video, embeddings, and model outputs together. The set of data consumers has also grown beyond analysts to include applications and AI agents. A real-world request often combines structured filtering with full-text and vector retrieval, then joins the results with the latest business status, permissions, and historical metrics.

The traditional approach spreads these capabilities across separate systems. Object storage holds raw content, lakehouses hold table data and metadata, search engines handle full-text retrieval, vector databases provide semantic retrieval, OLAP systems perform metric analysis, and the application layer assembles the results. Each system solves a specific problem, but users are responsible for data consistency, version alignment, access governance, and result fusion across them.

Open formats are also expanding beyond structured data. AI workloads now include dynamic attributes, blobs, embeddings, and model results. Iceberg, Paimon, and Lance serve long-term analytical facts, real-time updated data, and AI datasets, respectively, so enterprises can select the appropriate format for each workload. In this article, a multimodal lakehouse refers to structured, semi-structured, and multimodal data stored collectively in these open formats.

For the multimodal lakehouse, Doris 5.0 will focus unification on query and execution instead of requiring users to move all data into one storage system. Data can remain in the open format best suited to it, while Doris provides unified search, analytics, and real-time serving.

![Apache Doris 5.0 unified query and compute architecture for the multimodal lakehouse](/images/blogs/apache-doris-5-multimodal-lakehouse-preview/unified-query-architecture.jpg)

Figure 1: Overall architecture of an open-format multimodal lakehouse. Iceberg, Paimon, Lance, and Fluss hold different types of open data assets. At the unified query and compute layer, Doris understands format semantics and connects hybrid search, cross-source joins, MPP OLAP, real-time serving, and access control in one execution pipeline.

> Availability: The Iceberg, Paimon, and Lance capabilities discussed here are in the Doris 4.2 release branch and are scheduled for public release at the end of September. The broader Doris 5.0 work remains a preview.

## From 4.x to 5.0: Extending unified search to the open lakehouse

Apache Doris 4.x already provides high-performance unified search and analytics for structured, semi-structured, and vector data in internal tables. Users can combine SQL analytics, full-text search, vector search, and real-time updates in one system. For open lake formats such as Iceberg and Paimon, Doris has primarily supported queries and analysis of structured data.

Doris 5.0 will continue this work by extending capabilities already proven on internal tables to the open lakehouse. Variant data in Iceberg and Paimon will become part of a unified read and write pipeline. Paimon and Lance will gain native full-text and vector search. A new Fluss Catalog will support joint queries across real-time data in Fluss and historical data tiered to Paimon, which will further improve data freshness for analytics.

![Evolution of Doris capabilities from 4.x to 5.0](/images/blogs/apache-doris-5-multimodal-lakehouse-preview/search-evolution.jpg)

Figure 2: Capability evolution from 4.x to 5.0. Doris 4.x provides unified search and OLAP on internal tables, along with structured SQL for Iceberg and Paimon. Doris 5.0 extends unified querying to the open lakehouse with Variant reads and writes, native vector search, and joint queries across real-time Fluss data and historical Paimon data.

Doris 5.0 will provide the following capabilities across open formats and the unified execution layer:

- Iceberg: Building on mature support for reads, writes, time travel, row-level updates, and table lifecycle management, Doris will add reads and writes for Iceberg V3 Variant data in both plain and shredded layouts.
- Paimon: The Paimon Catalog will move from read-only access to full read and write support, including `INSERT`, `INSERT OVERWRITE`, `UPDATE`, `DELETE`, `MERGE`, DDL, and reads and writes for Variant, full-text indexes, and vector indexes. It will provide a unified entry point for real-time lakehouses and evolving multimodal data.
- Lance: Doris will introduce native read and retrieval capabilities for multimodal AI, including Catalog support, parallel scans, column pruning, predicate pushdown, vector and full-text search, and vector index management.
- Fluss: A new Fluss Catalog will support reads from log tables and primary-key tables. Through Union Read, it will jointly query real-time incremental data in Fluss and historical data tiered to Paimon.
- Unified Doris execution: Doris will connect internal tables, open lake tables, full-text and vector retrieval, cross-source joins, aggregations, window calculations, and permission filtering in one SQL pipeline.

## From multiple systems to a unified platform

The difficulty of assembling multiple systems goes beyond the number of systems involved. The same business entity may have different update times, versions, and permission boundaries in each system. A product that has been delisted, a device currently under maintenance, or a document that has been withdrawn may still appear in a stale vector index and be passed to an agent.

Placing unification at the query and execution layer makes the division of responsibilities clearer. Open formats continue to store long-term data and multimodal assets. Doris internal tables hold real-time business facts that require high concurrency and low latency. The Doris MPP engine performs retrieval, filtering, joins, and analytics in one query, so applications no longer need to move and assemble results across multiple systems. The same layer evaluates business state and applies permission filters for each entity, preventing stale candidates from bypassing these checks and reaching an agent.

![Evolution from a traditional multi-system architecture to unified execution with Apache Doris](/images/blogs/apache-doris-5-multimodal-lakehouse-preview/unified-execution.jpg)

Figure 3: Evolution of the multimodal lakehouse data architecture. The architecture moves from traditional multi-system assembly to unified execution with Doris. Data remains in the appropriate open formats, while Doris unifies querying, computing, and serving.

### OLAP: From retrieving candidates to determining business outcomes

Vector or full-text search discovers candidates. Answering the business question usually requires joins, aggregations, window calculations, and multidimensional ranking as well.

For example, image-based product search cannot return products based only on visual similarity. It must also account for inventory, regional availability, price, conversion rate, and return rate. Equipment fault diagnosis cannot stop at finding similar logs. It must compare models, firmware versions, sensor metrics, and repair outcomes.

Whether candidates come from Doris internal tables or open lake tables, Doris can pass search results directly into its MPP OLAP execution pipeline. This allows the query to turn a "similar" result into a business conclusion that is currently valid, complies with the relevant rules, and is worth acting on.

### Variant, full text, and vector: Combining different forms of evidence in one SQL query

Model-generated data rarely fits a stable wide-table schema. OCR results, captions, labels, tool-call parameters, and evaluation results change as model versions evolve. Variant provides a flexible way to store semi-structured data. Full-text search supports precise keyword and rule matching, while vector search broadens semantic recall. Structured conditions constrain time, status, permissions, and business scope.

Doris 5.0 will make Variant data, full-text indexes, and vector indexes in open lake tables available within the same SQL query. Users will not need to copy multimodal data into additional indexing systems solely to make it searchable.

## Physical AI: From a single record to a complete episode

Data generated by autonomous driving systems, robots, and industrial equipment records a continuous process of observation, decision, action, and feedback rather than a collection of static documents. The smallest unit of analysis is therefore no longer an image. It is an Episode that contains time, space, device state, model version, and business outcome.

An Episode involving a robotic arm's failed grasp might contain RGB-D images, 3D poses, joint and torque data, planned trajectories, control commands, model outputs, device logs, and the final sorting result. Images describe the environment, trajectories describe the action, sensor data records the execution process, and the business outcome shows whether the task succeeded.

Open formats allow teams to retain this data over the long term, evolve it, and share it among different tools. Doris organizes these forms of evidence by Episode into an interactive query. The query first filters by time, device, and status, then retrieves similar situations through full-text and vector search, and finally joins model versions with business outcomes to compare failure rates, retry rates, and task duration.

![Closed-loop Physical AI Episode analysis](/images/blogs/apache-doris-5-multimodal-lakehouse-preview/physical-ai-episode.jpg)

Figure 4: Closed-loop Physical AI Episode analysis. Doris organizes multisensor evidence, model context, and business outcomes into a reusable data feedback loop.

## Agentic AI: Using real-time analytics to connect models with business context

Large language models can understand general knowledge, but they do not inherently know the enterprise's current state. They cannot know whether an order has been canceled, whether inventory is sufficient, whether a device is online, whether a customer still has permission, or whether a particular anomaly is currently surging without access to current enterprise data.

The challenge for an agent is therefore broader than generating SQL. It needs a continuous supply of fresh, trustworthy, explainable, and permission-compliant data context.

### Real-time writes: Bringing business changes directly into the open lakehouse

Doris integration with Iceberg has already progressed from querying a data source to writing efficiently to an open data foundation. `INSERT`, `INSERT OVERWRITE`, CTAS, and row-level updates are already available. Doris 5.0 will bring the same write capabilities to Paimon and add Variant writes for both Iceberg and Paimon.

Users will be able to use unified SQL to write structured and Variant data directly to open tables. They will not need to write the data to Doris internal tables first or build another synchronization pipeline. Real-time business events, tool-call parameters, and continuously changing model results can be stored directly as open data assets.

Within the execution pipeline, Doris BEs generate data files through distributed parallel execution. The FE coordinates snapshots and atomic commits, and it handles idempotent retries and failure cleanup. Doris manages efficient writes, commit consistency, and schema evolution through a common implementation, so applications do not need to assemble open-table transactions themselves.

### Real-time analytics: Building agent context from the latest open data

Orders, device states, behavioral events, and model-derived results written to Iceberg or Paimon can be shared among different compute engines. Doris queries the latest data directly, combines it with real-time business facts in internal tables, and applies cross-table joins and permission filtering to construct fresh, verifiable business context for agents.

For event streams with stricter freshness requirements, the new Fluss Catalog uses Union Read to combine real-time increments in Fluss with historical data tiered to Paimon and queries them as a single table. The resulting agent context includes both the complete history and changes that have just occurred.

![Real-time feedback loop for Agentic AI](/images/blogs/apache-doris-5-multimodal-lakehouse-preview/agent-data-loop.jpg)

Figure 5: A real-time Agentic AI feedback loop using open formats selected according to workload requirements. Doris provides read, write, and Variant capabilities for Iceberg or Paimon selected by the user, along with read and multimodal search capabilities for Lance. It then constructs agent context through unified SQL and MPP OLAP.

## Multimodal lakehouse use cases with Doris

### Scenario 1: Real-time decision-making for customer service agents

Knowledge documents, product images, and samples of similar faults are stored in Lance. Orders, support tickets, and historical service data are stored in Iceberg and Paimon. The latest inventory, warranty, and customer status data is loaded into Doris internal tables.

After an agent receives a customer question, Doris performs semantic retrieval, keyword matching, permission and status filtering, then joins the results with repair success rates and inventory data. The result is more than "the most similar document." It is a resolution that the current customer can act on.

### Scenario 2: Selecting high-value Episodes for Physical AI

Autonomous driving or robotics teams store video, point clouds, and embeddings in Lance. They write continuously changing model outputs and task results to Paimon as Variant data, while retaining historical evaluation results in Iceberg. These teams need to answer a question beyond "Which Episodes are similar?" They need to know, "Which Episodes are worth investing in for annotation, training, and review?"

After the query pipeline described above filters the Episodes, high-confidence anomalies enter training and regression datasets. Episodes with inconsistent evidence go to manual review. Failure and intervention rates aggregated by model version then show whether a new strategy has improved a specific scenario.

### Scenario 3: From similar defects to root-cause analysis in industrial quality inspection

A quality engineer uploads an image of a defect. Doris retrieves visually similar samples from Lance, matches defect descriptions in Variant and full-text fields, and joins the results with continuously updated equipment events in Paimon and with batch, process, and repair history in Iceberg.

The system then determines whether defects are occurring in clusters, which equipment and batches are affected, how accurately different model versions identify the defect, and whether yields recover in subsequent batches. This expands a similar-image search into a complete closed-loop quality analysis.

## Conclusion: Keep data in open formats and use Doris for search and analytics

Doris has one primary direction for the multimodal lakehouse: extend the unified search and real-time analytics capabilities already proven on internal tables to data in Iceberg, Paimon, Lance, and Fluss. Data can remain in open formats for search and analytics. Structured data, Variant data, full-text data, and vectors do not need to reside in separate systems. Doris will provide the unified execution and serving layer above this data:

- Use unified SQL to access Doris internal tables and multiple open formats.
- Use Variant, full-text search, vector search, and structured filtering to query different forms of data.
- Use MPP OLAP to turn retrieved results into business metrics and decisions.
- Use real-time writes to supply the latest business state that agents otherwise lack.
- Use unified permission filtering so applications and agents see only the data they are authorized to access.

A series of articles about Doris 5.0 will examine these capabilities for open formats such as Iceberg, Paimon, Lance, and Fluss. The articles will cover their technical principles, performance benchmarks, and representative implementation scenarios.

The multimodal lakehouse capabilities for Iceberg, Paimon, and Lance have been merged into the Doris 4.2 release branch and are scheduled for official release with version 4.2 at the end of September. Additional capabilities, including Fluss support, have also entered the Doris main branch and are planned for release with Doris 5.0 at the end of the year.
