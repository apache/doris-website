---
{
    "title": "DOG Stack Open Observability Overview",
    "sidebar_label": "Overview",
    "language": "en-US",
    "description": "DOG Stack is an open observability solution built on Apache Doris, OpenTelemetry, and Grafana. This article introduces the core features, components, and overall architecture of DOG Stack.",
    "keywords": [
        "DOG Stack",
        "Apache Doris",
        "OpenTelemetry",
        "Grafana",
        "Elasticsearch",
        "ELK",
        "open-source observability",
        "Doris App plugin",
        "logs",
        "traces",
        "metrics"
    ]
}
---

<!-- Knowledge type: capability definition + architecture overview -->
<!-- Applicable scenario: observability platform / DOG Stack solution selection -->

**DOG Stack** is an open observability solution built on **D**oris, **O**penTelemetry (including the [Doris Exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter)), and **G**rafana (including the [Doris App plugin](https://github.com/velodb/grafana-doris-app)). It is designed to be:

- **Open**: All components are open source, avoiding vendor lock-in.
- **High-performance**: Write throughput up to hundreds of GB/s. Sub-second search and query response time over billions of records.
- **Cost-efficient**: Reduces observability cost by more than 50%, or even 80%, compared with ELK or Datadog.
- **Scalable**: Easily handles PB- or even EB-scale data volumes.

OpenTelemetry is the de-facto standard for observability data collection. Grafana is the de-facto standard for observability data visualization. That is why Doris chose to build an observability solution on top of them, rather than reinventing new collection and visualization tools. Doris focuses on efficient storage and fast querying of observability data.



## Features

DOG Stack offers rich functionality based on OpenTelemetry and Grafana.

1. **Collection of various observability data**
   1. OpenTelemetry SDKs provide out-of-the-box, even code-free instrumentation for applications in over 10 programming languages.
   2. The OpenTelemetry Collector ingests local files, host metrics, and container metrics.
   3. Integration with your existing collection tools such as Vector, Fluentbit, Node Exporter, Telegraf, Logstash, Filebeat, and more.
2. **Search experience beyond Kibana**
   1. Supports both Lucene-style search syntax and native SQL syntax.
   2. One-click correlation between logs and traces.
   3. View detailed records in table or JSON format.
   4. View data before and after a specific log or trace in time.
   5. Interactive time-range selection, field selection, and field filtering.
   6. Field value distribution statistics.
3. **Jaeger-like trace experience**
   1. Filter traces by service name, operation, tags, and duration range.
   2. Visualize traces by timeline, duration, and span count.
   3. Sort traces by timestamp, duration, or span count.
   4. Waterfall visualization for a specific trace.
   5. Filter spans within a trace by service name, span name, tags, and duration range.
4. **Dashboards**
   1. Over 20 visualization types, including line, bar, pie, gauge, heatmap, histogram, geomap, and more.
   2. Build dashboards via the visual builder or with raw SQL.
   3. Use Doris multi-table joins to build dashboards across logs, traces, and metrics.
5. **Alerting**
   1. Alert rules covering multiple conditions such as no-data / error, threshold, and composite threshold, across metrics such as count, sum, and ratio.
   2. Over 20 notification channels including email, PagerDuty, Slack, Discord, and Webhook.
   3. Alert templates for customizing, formatting, and reusing notification messages.
6. **More features supported by OpenTelemetry and Grafana.**

Below are a few quick-look screenshots from Grafana with the Doris App plugin installed.

- Log search

![Log search](https://cdnd.selectdb.com/images/upload/dogstack/overview_logs.png)

- Trace analysis

![Trace analysis](https://cdnd.selectdb.com/images/upload/dogstack/overview_traces.png)

- Metrics dashboard

![Metrics dashboard](https://cdnd.selectdb.com/images/upload/dogstack/overview_dashboard.png)



## Architecture

![DOG Stack Architecture](https://cdnd.selectdb.com/images/upload/dogstack/dogstack_architecture.png)

DOG Stack consists of the following components.

1. **Data collection tools**: They collect telemetry such as logs, traces, and metrics. OpenTelemetry provides two kinds of collection tools. One is the OpenTelemetry SDK supporting 10+ languages, used to instrument applications and AI agents — typically collecting trace data. The other is the OpenTelemetry Collector receivers, including the filelog receiver for local files, the hostmetrics receiver for host metrics (CPU, memory, etc.), and the podmetrics receiver for pod metrics in Kubernetes. Many third-party collectors such as Vector, Fluentbit, Node Exporter, and Telegraf can send data to the OpenTelemetry Collector over OTLP and other protocols.
2. **OpenTelemetry Collector (with Doris Exporter)**: It receives telemetry data from collection tools, processes it, and persists it into Doris via the Doris Exporter. Typical processing steps include filtering, transforming, enriching, queuing, and batching.
3. **Doris**: It receives telemetry data from the OpenTelemetry Collector and stores it efficiently in indexed columnar storage. Doris provides lightning-fast search through various indexes such as inverted index, bloom filter index, and zone map index. It also offers excellent native performance for analytical queries such as aggregation, sorting, and joins.
4. **Grafana (with Doris App plugin)**: It provides rich, easy-to-use visualizations for logs, traces, and metrics. On top of Grafana's strong base capabilities, the Doris App plugin adds practical features. The "Discover" feature delivers a first-class search experience appreciated by Kibana users. The "Traces" feature offers native trace exploration to surface traces worth investigating (such as slow ones), which will feel familiar to Jaeger users.
