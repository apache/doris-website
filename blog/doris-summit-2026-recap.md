---
title: 'Doris Summit 2026 Recap: From Real-Time Analytics to Real-Time Intelligence'
summary: 'Explore Doris Summit 2026 keynotes and production stories from HubSpot, Sony Interactive Entertainment, Raiffeisen Bank Romania, and more as Apache Doris moves toward real-time intelligence.'
description: 'Doris Summit 2026 recap: Apache Doris 5.0, fresh data, multimodal analytics, AI agents, and production stories from HubSpot, Sony, and Raiffeisen Bank Romania.'
keywords:
  - 'Doris Summit 2026'
  - 'Apache Doris 5.0'
  - 'real-time intelligence'
  - 'multimodal analytics'
  - 'AI agents'
date: '2026-11-11'
author: 'Apache Doris · Mingyu Chen'
tags:
  - 'Top News'
image: '/images/blogs/doris-summit-2026-recap/cover.jpg'
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

> Apache Doris, an Apache Software Foundation project, is an open-source database for real-time analytics and search. Teams commonly use it for real-time reporting, log analytics, lakehouse queries, and serving data to AI agents. Doris Summit is the Apache Doris community's global technical conference, where users, contributors, and partners share how they run Doris in production and where the technology is going.

*How Apache Doris is moving from real-time analytics to real-time intelligence: the keynotes mapped out the path, and production stories from HubSpot, Sony Interactive Entertainment, Raiffeisen Bank Romania, and other teams made it concrete.*

At HubSpot, Apache Doris powers CRM object analytical queries across 33 clusters worldwide, and **P50 backend query latency has dropped from about 1.8 seconds to about 500 milliseconds**. At Raiffeisen Bank Romania, **AI agents are already real users of the analytics platform**: they query Doris through MCP tools, read governed model scores, and then explain risks and recommend next steps to bank employees. The first example is real-time analytics as it works today. The second points to what is changing: agents have joined the people reading reports as consumers of data, and they ask questions often and at any hour. That shift came up again and again at this year's Doris Summit. **Agents need up-to-date data, the right business definitions, and answers that can be traced back to their source.**

Doris Summit 2026 took place online on October 21–22, with 34 speakers presenting 31 sessions. The opening keynote started with exactly this shift. Apache Doris PMC Chair Mingyu Chen described it as a move [from real-time analytics to real-time intelligence](https://apache-doris-summit.org/watch/real-time-intelligence). Real-time analytics helps people see what is happening, faster. Real-time intelligence goes further: it lets AI continuously access fresh data, understand multimodal context, and make decisions based on the latest state of the business. **The question is no longer just how fast we can analyze data, but how fast data can turn into intelligence.**

That theme ran through the entire summit. The other five keynotes built on it, covering how Apache Doris 5.0 keeps results fresh, how it goes beyond tables, and how agents understand, access, and verify data. The remaining 25 sessions showed what these directions look like in practice. They came from teams in CRM, gaming, retail, telecom, banking, insurance, mobility, and online video, as well as ecosystem partners working on stream processing, lakehouses, semantic layers, and graph analytics.

**Recordings of all 31 sessions are free to watch on the [Doris Summit 2026 website](https://apache-doris-summit.org/watch).**

## Staying Fresh: Results That Keep Pace with the Business

![Two panels compare batch refresh and incremental processing. Batch refresh runs a full recompute at intervals, so results lag behind the business; incremental processing handles only the changes, so results keep pace.](/images/blogs/doris-summit-2026-recap/fig-1-staying-fresh.jpg)

Agents need more than fresh source data. They also need metrics and analytical results that keep up as the business changes. In the [incremental computing keynote](https://apache-doris-summit.org/watch/incremental-computing), VeloDB Solutions Architect Shilin Wu pointed out that maintaining these results through repeated batch refreshes introduces delays and costly recomputation. The upcoming Apache Doris 5.0 addresses this by **processing only what changes**. Changelog and Table Stream capture and consume changes, Flink-based pipelines handle downstream processing, and **incremental view maintenance (IVM)** automatically keeps analytical results up to date inside Doris. The talk demonstrated inserts, updates, and deletes flowing through to correctly updated results, and measured end-to-end latency. [Query Cache](https://apache-doris-summit.org/watch/query-cache), presented by Apache Druid PMC Member Jiayi Jin, applies the same idea: moving from full recomputation to incremental reuse.

User talks showed what fresh results mean in production. At Silpo, part of the Ukrainian retail group Fozzy Group, each pricing run recomputes about 15 million price cells across roughly 1,500 stores. Data Platform Lead Vitalii Kalmykov explained that the original calculation, built on SQL Server stored procedures, took about 10 minutes. With [Doris running the calculation](https://apache-doris-summit.org/watch/unified-data-platform) and Temporal orchestrating it, **each run now takes about 75 seconds**; across 286 runs, the average was 74 seconds, with zero failures. The same Doris cluster also handles CDC ingestion, API serving, and data catalog search.

Rumble lets the teams that use the data build their own processing chains. In [*Growing a Data Tree*](https://apache-doris-summit.org/watch/trusted-data-products), Jayson Minard described how Rumble's recommendations team moved from a centralized ClickHouse warehouse to Doris in compute-storage decoupled mode. The platform provides trusted base tables, and each team builds its own views and materialized views on top. It handles **about 10 billion events a month with 91 materialized views**; the longest processing chain is about 13 layers deep, and core views are ready within about 18 minutes.

Ishan Harkhani and Parmeetrai Lalwani of Armakuni built a [multi-tenant marketing attribution platform](https://apache-doris-summit.org/watch/multi-tenant-platform) for home services businesses, running all three transformation layers (Bronze, Silver, and Gold) inside Doris. According to the speakers, **processing time dropped from hours to minutes**, and customer dashboards now refresh every 10 minutes. GreenSM, a Vietnamese EV ride-hailing platform, computes its recommendations ahead of time. Thang Duc Bui said its [destination recommendation](https://apache-doris-summit.org/watch/real-time-recommendations) system **writes more than 1 million records per second in production and serves queries in under 100 milliseconds**.

## Beyond Tables: Agent Context Doesn't Always Fit in a Table

![Tables, custom attributes, logs and text, vectors and images, and live events all flow into Apache Doris, which passes the combined context to an agent.](/images/blogs/doris-summit-2026-recap/fig-2-beyond-tables.jpg)

The context that agents rely on often doesn't sit in neat tables. It includes customer-defined attributes, logs and text, vectors and images, and the latest events still in the stream. In the [multimodal lakehouse keynote](https://apache-doris-summit.org/watch/multimodal-lakehouse), Mingyu Chen and Lei Xu, co-founder and CTO of LanceDB, showed how **Apache Doris 5.0 extends the lakehouse to multimodal analytics and retrieval**. They started with how Kuaishou, the Chinese short-video platform, uses Doris with Apache Paimon, then explained how the Lance format, vector retrieval, and analytical engines work together so **the same open data can serve search, analytics, retrieval, and AI**.

CRM data at [HubSpot](https://apache-doris-summit.org/watch/hubspot) is far from a neat table. Customers can define their own objects and properties, some tenants have thousands of properties, about 90% of write traffic is updates, and queries range from search to analytics that join across objects. Staff Software Engineer Alvaro Tuso explained how HubSpot **maps arbitrary properties to typed VARIANT subpaths with inverted indexes**, uses Merge-on-Write to absorb frequent updates, and splits the deployment into many smaller clusters, each serving a group of customers. This design now powers object reporting on 33 clusters worldwide; search is still being tuned.

Fresh events and historical data also need to be queried together. Apache Fluss PMC Member Anton Borisov showed how Doris, through the Fluss Catalog, can query historical data in Apache Paimon and real-time data in Fluss that hasn't been tiered into the lake yet, [**all in a single SQL statement**](https://apache-doris-summit.org/watch/fluss-streaming-lakehouse). **This integration is coming in Apache Doris 5.0.** The talk also covered prototypes that improve scan and point-lookup performance. Fahad Shah of RisingWave told the story behind [iceberg-rust](https://apache-doris-summit.org/watch/iceberg-rust) and demonstrated RisingWave writing to Iceberg tables that Doris then queried.

Search can live in the same database, too. Daniel Adayev of Tabsdata used Doris inverted indexes to [handle event search and analytics together](https://apache-doris-summit.org/watch/tabsdata-event-search), with **no separate Elasticsearch cluster to maintain**. Ákos Zalaváry, founder of Logiqum, used 73 million rows of real logs to compare [several append-only logging designs](https://apache-doris-summit.org/watch/append-only-logging). The final design keeps the logs themselves immutable and stores the mutable noise-filtering decisions separately.

## Between Agents and Data: Understand, Access, Verify

![An agent's question goes through Understand (the business) and Access (the data) to reach Apache Doris, and the answer returns to the agent through Verify (the results).](/images/blogs/doris-summit-2026-recap/fig-3-agents-and-data.jpg)

Once the data is fresh and complete, agents still have to use it well. Three keynotes each took on one part of the problem: how agents understand the business, how they access the data, and how to tell whether they got it right.

**Understanding the business.** In [*Talk to Your Data*](https://apache-doris-summit.org/watch/talk-to-your-data), VeloDB Co-founder Owen Xiao described a three-layer architecture for enterprise analytics agents. The agent layer handles conversation, planning, and SQL execution, with support for multi-user collaboration, permissions, and auditing. **The context layer records schemas, metric definitions, and business rules in Markdown files** (for example, whether "revenue" means MRR or ARR); the files can be managed in Git and served to agents through MCP or APIs. The analytical database absorbs the bursty, highly concurrent queries that agents generate. Capy, the enterprise analytics agent presented in the talk, is expected to launch by the end of the year.

Raiffeisen Bank Romania lets **models produce the numbers and LLMs explain them**, hence the talk's title: [*ML Decides, LLMs Explain*](https://apache-doris-summit.org/watch/raiffeisen). Models for churn, default, fraud, and more are trained and governed separately, and each writes its scores and drivers into Doris. ARIA, the bank's agentic AI platform, reads those results through MCP-based tools, uses OpenMetadata as its semantic layer, and explains them to employees. Alin Nedelcu and Adrian Neagu said risk analysts can ask questions in natural language and **typically get back a chart and a CSV download link in under 2 seconds**.

Other talks approached understanding from different angles. Azhar Izzannada Elbachtiar's [reference implementation](https://apache-doris-summit.org/watch/metricflow-on-doris) uses MetricFlow to compile governed metrics into Doris SQL and returns an answer only when both freshness and provenance checks pass. It was validated on billion-scale event data. DatusAI Co-founder Harrison Zhao presented an [open semantic layer](https://apache-doris-summit.org/watch/open-semantic-layer) for data agents. PuppyGraph CEO Weimo Liu demonstrated an agent that generates an [ontology graph](https://apache-doris-summit.org/watch/ontology-graph) from thousands of tables and then queries the data in Doris directly as a graph. Dave Stokes of DBeaver warned that an agent's first answer can look plausible and still be wrong, and laid out [what to teach your AI](https://apache-doris-summit.org/watch/teach-your-ai) and which guardrails to set up in Doris.

**Accessing the data.** Getting results out of the database and into the agent's hands can also become a bottleneck. In [*The Agentic Data Plane*](https://apache-doris-summit.org/watch/agentic-data-plane), Kevin Shen, a product manager at VeloDB, and Ian Cook, co-founder and CEO of Columnar, pointed out that row-by-row conversion and lost type information slow the whole pipeline down. They split connectivity into two planes. Tools such as MCP and CLIs form the **control plane**, which decides what to query. Arrow and ADBC form the **data plane**, which moves results in columnar batches and preserves data types. Doris already offers an Arrow Flight SQL service, and the Doris ADBC driver and ADBC Catalog are expected by the end of the year.

Agents also query differently from traditional analytics workloads. Ganesh Kumar noted that **agents send large numbers of highly concurrent, narrow queries, often with latency budgets under 500 milliseconds**. The talk compared Amazon Athena, Amazon Redshift Serverless, and Doris, then proposed a reference architecture with [Doris as the hot data serving layer](https://apache-doris-summit.org/watch/agent-data-layer). Sijie Han of AWS demonstrated Amazon Quick agents [querying Doris through MCP](https://apache-doris-summit.org/watch/conversation-to-insight) and generating visualizations.

Because a single agent often acts on behalf of many users, Arpit Jain of MIT built a [custom access controller](https://apache-doris-summit.org/watch/custom-access-controller) on the AccessControllerFactory SPI in Doris, with OpenFGA as the policy engine. It authorizes each user individually and fails closed when the policy service is unavailable.

**Verifying the results.** In [*Observe the Agent*](https://apache-doris-summit.org/watch/observe-the-agent), Apache Doris Committer Jack Jiang reminded the audience that **an agent can run without a single error and still give the wrong answer**. The talk introduced [Litefuse](https://litefuse.ai/), an agent observability and evaluation platform that is now available. Litefuse is OpenTelemetry-native, compatible with the Langfuse SDK, and built on Apache Doris. Jack Jiang argued that **agent observability is fundamentally a real-time analytics problem**. Long-text search across massive volumes of traces, filtering on nested JSON, and cost aggregation all rely on inverted indexes, VARIANT, and compute-storage separation, the same capabilities that HubSpot and other users already run in production.

## Into Production: A Foundation That Stands Up to Real Workloads

![Many data streams flow into an Ingest workload while a separate Query workload serves dashboards and agents; both stand side by side on an Apache Doris foundation.](/images/blogs/doris-summit-2026-recap/fig-4-into-production.jpg)

The opening keynote named **production-ready infrastructure** as one of the core themes of Apache Doris 5.0. Real-time intelligence ultimately has to run on production systems, and production is where the user talks offered the most evidence.

At Sony Interactive Entertainment, Staff Software Engineer Derek Bradley is responsible for analyzing IPFIX traffic at the edge of PlayStation's global network. The previous in-memory database slowed down on writes and timed out on queries during anomalies such as DDoS attacks, which is exactly when network experts need the data most. The new design had to handle ingestion, cleanup, aggregation, and queries at the same time on limited hardware (some edge sites have only a single server). In [evaluation tests](https://apache-doris-summit.org/watch/million-rows-per-second), **a single Doris node ingested wide rows of more than 60 columns at 1.4 million rows per second**.

Malawian telecom operator TNM handles about 1.1 billion records a day. James Mandiza walked through the company's [migration from an Oracle data warehouse to Doris](https://apache-doris-summit.org/watch/telecom-lakehouse). TNM deployed Doris 3.1 in compute-storage decoupled mode on a private cloud, kept its existing Qlik reports, ran the old and new systems side by side for about a month to reconcile results one business domain at a time, and built a single unified subscriber profile that serves multiple business systems. In sample production jobs, **ingestion dropped from 50 minutes to 4 minutes, and one query went from 637 seconds to 4 seconds**. The talk also shared a lesson learned: before user queries were isolated, they slowed down Routine Load, so **the two workloads now run on separate compute groups**.

Turkish insurer HDI Sigorta took a different path. Kazım Cesur explained that Oracle 19c still handles core transactions, while data flows through GoldenGate CDC and Kafka into VeloDB, built on Apache Doris, for [real-time analytics](https://apache-doris-summit.org/watch/ai-ready-data-foundation). **More than 450 Routine Load jobs run in production**, and AI applications are the next step for this foundation.

Lessons from operations and ingestion matter just as much. Nilanjan Sarkar of Tesco shared practices for [running Doris in decoupled mode](https://apache-doris-summit.org/watch/decoupled-mode-on-aks) on Azure Kubernetes Service, covering node pool isolation, historical data migration, and metadata backup and recovery. Shekhar Rajak of Atlassian explained how [exactly-once ingestion](https://apache-doris-summit.org/watch/exactly-once-ingestion) works across three paths: Routine Load, Flink, and Spark. Kaiming Wan of AutoMQ introduced a streaming platform that [moves Kafka's storage layer onto object storage](https://apache-doris-summit.org/watch/automq), and EMQ CTO Ivan Dyachkov presented the integration that lets [EMQX batch-write MQTT device messages into Doris](https://apache-doris-summit.org/watch/emqx).

## What's Next

**Apache Doris 5.0 is coming soon.** Over the next few weeks, we'll publish deep dives on topics including HubSpot, Apache Fluss, incremental computing, Sony Interactive Entertainment, Silpo, and Raiffeisen Bank Romania.

Get involved with the community:

- Website: [https://doris.apache.org](https://doris.apache.org)
- Contribute: [https://doris.apache.org/community/how-to-contribute/contribute-to-doris](https://doris.apache.org/community/how-to-contribute/contribute-to-doris)
- GitHub: [github.com/apache/doris](https://github.com/apache/doris)
- Slack: [doris.apache.org/slack](https://doris.apache.org/slack)

Thanks to all 34 speakers and 27 community partners. Doris Summit 2026 was organized by VeloDB, with the Apache Software Foundation as Community Partner.

**Watch every session on demand at [apache-doris-summit.org/watch](https://apache-doris-summit.org/watch). Slides will be posted on the website as speakers approve them.**
