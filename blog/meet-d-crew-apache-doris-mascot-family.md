---
title: 'Meet D-Crew, the Apache Doris Mascot Family'
summary: 'Meet Pip, Dori, and Flux—the three characters in D-Crew—and discover how they represent the query, compute, and data capabilities of Apache Doris.'
description: 'Introducing D-Crew, the Apache Doris mascot family: Pip, Dori, and Flux represent query execution, the core engine, and connected data for real-time analytics.'
keywords:
  - 'Apache Doris'
  - 'D-Crew'
  - 'Apache Doris mascot'
  - 'real-time analytics'
  - 'agentic data engine'
date: '2026-07-26'
author: 'Apache Doris'
tags:
  - 'Top News'
image: '/images/blogs/meet-d-crew-apache-doris-mascot-family/cover.jpg'
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

Apache Doris is **the fastest open source database project built for real-time analytics**. People often first encounter Doris through architecture diagrams, SQL, performance benchmarks, and technical documentation. But beyond its technical capabilities, we also want Doris to have a more vivid and approachable identity, one that helps more people understand it, remember it, and connect with the community.

Today, we are excited to introduce three new friends of Apache Doris: the **D-Crew**.

![This image introduces D-Crew, the new Apache Doris mascot family. At the top, under “From the Doris Logo,” it shows the three geometric elements in the Apache Doris logo. Arrows point down to “...To the D-Crew,” where those elements become three lively mascots with expressive faces and limbs: Pip, Dori, and Flux, from left to right. The image clearly shows how the new mascots evolved from the logo.](/images/blogs/meet-d-crew-apache-doris-mascot-family/d-crew-from-doris-logo.jpg)

D-Crew is the Apache Doris mascot family, made up of three members: Pip, Dori, and Flux. Each grew out of one of the three geometric elements in the Apache Doris logo. They are three distinct characters, but together they represent the capabilities that make Apache Doris powerful.

## Meet the D-Crew

D-Crew offers a lighter, more visual way to get to know Doris, understand how it works, and follow the story of this evolving open source project.

![This image introduces the three members of D-Crew: Pip, Dori, and Flux. Pip is a purple triangle known as the query runner. Pip gets things moving by executing queries, running SQL, and starting real-time analytics, represented by Query, SQL, and Trigger. Dori is a blue capsule and the core engine. Dori keeps everything fast and reliable, powering high-concurrency workloads and complex analytics, represented by Performance, Reliability, and Compute. Flux is a green pen-shaped data explorer. Flux connects lakehouses, search, vectors, and open data formats to provide data for modern applications and agents, represented by Lakehouse, Search, and AI. Together, they turn real-time data into insights.](/images/blogs/meet-d-crew-apache-doris-mascot-family/meet-d-crew.jpg)

### Flux

**Flux** is the streamlined green character and D-Crew's data explorer.

Flux connects different data worlds, including **lakehouses, search, vectors, open data formats, and more data modalities to come**. Flux makes data discoverable, understandable, and easier to use in different ways. This reflects how Doris is bringing these data capabilities together to provide context and analytics for Agents.

### Dori

**Dori** is the teal capsule and the character closest to the Doris core engine.

Dori is the dependable foundation. **Low-latency queries, high-concurrency access, complex analytics, and multi-tenant workloads** all rely on Dori's steady support behind the scenes. Dori's reliability represents the continued evolution of Doris as a powerful foundation for data analytics.

### Pip

**Pip** is the purple triangle. It looks like a play button and the starting point of a query.

Starting queries, running SQL, and launching real-time analytics are all Pip's domain. Pip represents the interface between Doris and its users and applications. It starts with the **standard SQL interface and extends to capabilities designed for AI Agents, including a semantic layer, CLI, MCP, and Skills**.

## Explore Apache Doris with D-Crew

Pip, Dori, and Flux are more than three separate characters. Their different roles and the way they work together offer a more intuitive view of how Apache Doris supports a range of use cases.

### **Real-time Analytics**

In a **Real-time Analytics** use case, Flux connects to real-time data, Dori handles high-concurrency and high-throughput data processing and storage, and Pip delivers low-latency query responses. Together, they create an end-to-end, low-latency data analytics pipeline.

![This image shows the Apache Doris real-time analytics architecture. It focuses on “Real-time Analytics” with “Low Latency, End-to-End” and “Sub-second Analytics.” On the left are four real-time data sources: Events, Apps, IoT, and Database. In the center are the three D-Crew components: Flux, the data explorer; Dori, the core engine; and Pip, the query runner. They connect real-time data, compute quickly, and run instant queries. On the right, a dashboard displays revenue, orders, active users, and other data. The bottom of the image highlights real-time data sources, low-latency compute, instant queries, and live updates.](/images/blogs/meet-d-crew-apache-doris-mascot-family/real-time-analytics.jpg)

### **Lakehouse Analytics**

In a **Lakehouse Analytics** use case, Flux connects directly to open data ecosystems such as Iceberg, Paimon, and Delta Lake. Dori efficiently analyzes structured data, text, and vectors through one engine, while Pip presents the resulting hybrid analytics and retrieval results to users.

![This image shows how Apache Doris works in a Lakehouse Analytics use case. On the left are data lakes such as Iceberg, Paimon, and Delta Lake, with Flux connecting to their data. In the center is Dori, a unified multimodal engine that supports SQL and tabular data, full-text indexes, and vector indexes. On the right, Pip uses SQL to query hybrid analytics and retrieval results. The Lakehouse Insights dashboard in the upper-right corner shows sales trends, total sales, order counts, and other data. The image illustrates the roles of Flux, Dori, and Pip in the Lakehouse Analytics workflow.](/images/blogs/meet-d-crew-apache-doris-mascot-family/lakehouse-analytics.jpg)

### **Agent Observability**

In an **Agent Observability** use case, Flux ingests observability data such as Log, Metric, and Trace data. Dori uses Variant and time-series data capabilities to organize and process JSON and time-series data efficiently. Pip presents detected system anomalies and behavioral patterns in real time, helping organizations evaluate Agent performance more efficiently and keep track of system health.

![In this Agent Observability use case, Flux ingests real-time observability signals from Logs, Metrics, and Traces. Dori organizes and processes the data using Variant, JSON, and time-series data capabilities. Pip displays anomaly detection results, trace latency, and Agent performance on a real-time health dashboard.](/images/blogs/meet-d-crew-apache-doris-mascot-family/agent-observability.jpg)

### **Agentic Data Engine**

Apache Doris is evolving into a data analytics system for Agents. In an **Agentic Data Engine** use case, Flux connects an Agent to real-time, trusted data and finds the context it needs. Pip receives the Agent's query and analytics requests, while Dori handles the computation and processing quickly behind the scenes.

![This image shows how Apache Doris works in an Agentic Data Engine use case. On the left are AI Agent requests from Claude Code Session, Codex Session, Agent Session, and others. In the center are Flux, Pip, and Dori. Flux assembles context and memory, Pip orchestrates queries and analytics, and Dori serves as the high-performance data engine. On the right are trusted answers, real-time metrics, fresh context, and other results. The image illustrates how the three characters work together in the Apache Doris data analytics system for Agents.](/images/blogs/meet-d-crew-apache-doris-mascot-family/agentic-data-engine.jpg)

From real-time analytics and lakehouses to hybrid search and Agent-oriented data analytics, the three characters will appear together in different ways. Through these visual stories, we hope to make it easier to understand what Apache Doris can do and how it works with real-world data.

## Join the Community

If you see Pip, Dori, and Flux in our documentation, blog posts, Meetups, or on stickers, remember to say hello.

**Welcome to the Apache Doris community, D-Crew. And everyone else, you are welcome to join us too**.

![This image welcomes people to the Apache Doris community. Three cartoon characters, green on the left, blue in the center, and purple on the right, hold signs that read “Welcome to Apache Doris” and “Welcome D-Crew!” Colorful streamers and balloons decorate the background as other cartoon figures celebrate around them. The cheerful scene welcomes D-Crew to the Apache Doris community.](/images/blogs/meet-d-crew-apache-doris-mascot-family/welcome-d-crew.jpg)
