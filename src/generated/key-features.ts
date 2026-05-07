/* AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY. */
export type KeyFeatureCard = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  span: 's' | 'm' | 'l' | 't';
  href: string;
  order: number;
};

export const keyFeatureCards: KeyFeatureCard[] = [
  {
    "id": "key-features-real-time-analytics",
    "title": "Real-time Analytics",
    "description": "Analyze fresh data with low latency as it arrives in Apache Doris.",
    "tags": [
      "streaming",
      "low-latency"
    ],
    "span": "l",
    "href": "/docs-next/dev/key-features/real-time-analytics",
    "order": 10
  },
  {
    "id": "key-features-lakehouse-analytics",
    "title": "Lakehouse Analytics",
    "description": "Query data across lakehouse sources with Apache Doris as an analytical engine.",
    "tags": [
      "iceberg",
      "hudi",
      "delta"
    ],
    "span": "m",
    "href": "/docs-next/dev/key-features/lakehouse-analytics",
    "order": 20
  },
  {
    "id": "key-features-hybrid-search",
    "title": "Hybrid Search",
    "description": "Combine vector search and keyword search in one SQL engine.",
    "tags": [
      "vector",
      "bm25"
    ],
    "span": "m",
    "href": "/docs-next/dev/key-features/hybrid-search",
    "order": 30
  },
  {
    "id": "key-features-mpp-engine",
    "title": "MPP Query Engine",
    "description": "Run distributed SQL with parallel execution across many compute nodes.",
    "tags": [
      "parallel",
      "scale-out"
    ],
    "span": "s",
    "href": "/docs-next/dev/key-features/mpp-engine",
    "order": 40
  },
  {
    "id": "key-features-vectorized-execution",
    "title": "Vectorized Execution",
    "description": "Process data in batches to reduce CPU overhead and improve throughput.",
    "tags": [
      "simd",
      "cpu"
    ],
    "span": "m",
    "href": "/docs-next/dev/key-features/vectorized-execution",
    "order": 50
  },
  {
    "id": "key-features-materialized-views",
    "title": "Materialized Views",
    "description": "Precompute and rewrite queries to accelerate repeated analytical access.",
    "tags": [
      "acceleration",
      "rewrite"
    ],
    "span": "s",
    "href": "/docs-next/dev/key-features/materialized-views",
    "order": 60
  },
  {
    "id": "key-features-inverted-index",
    "title": "Inverted Index",
    "description": "Support text-oriented filtering and search-friendly access patterns.",
    "tags": [
      "text",
      "search"
    ],
    "span": "t",
    "href": "/docs-next/dev/key-features/inverted-index",
    "order": 70
  },
  {
    "id": "key-features-stream-load",
    "title": "Stream Load",
    "description": "Load data into Doris over HTTP with a synchronous ingestion path.",
    "tags": [
      "ingest",
      "http"
    ],
    "span": "t",
    "href": "/docs-next/dev/key-features/stream-load",
    "order": 80
  },
  {
    "id": "key-features-routine-load",
    "title": "Routine Load",
    "description": "Continuously ingest events from Kafka and other streaming sources.",
    "tags": [
      "kafka",
      "streaming"
    ],
    "span": "s",
    "href": "/docs-next/dev/key-features/routine-load",
    "order": 90
  },
  {
    "id": "key-features-compute-storage",
    "title": "Compute-Storage Separation",
    "description": "Scale compute and storage independently with a decoupled Doris architecture.",
    "tags": [
      "cloud",
      "elastic"
    ],
    "span": "l",
    "href": "/docs-next/dev/key-features/compute-storage",
    "order": 100
  },
  {
    "id": "key-features-cbo",
    "title": "Cost-Based Optimizer",
    "description": "Let Doris choose efficient plans using statistics and cost estimation.",
    "tags": [
      "planner",
      "statistics"
    ],
    "span": "m",
    "href": "/docs-next/dev/key-features/cbo",
    "order": 110
  },
  {
    "id": "key-features-pipeline-execution",
    "title": "Pipeline Execution",
    "description": "Execute queries in pipelined tasks to improve parallelism and scheduling.",
    "tags": [
      "parallel",
      "morsel"
    ],
    "span": "s",
    "href": "/docs-next/dev/key-features/pipeline-execution",
    "order": 120
  },
  {
    "id": "key-features-workload-management",
    "title": "Workload Management",
    "description": "Isolate workloads and control resource usage for different query groups.",
    "tags": [
      "isolation",
      "qos"
    ],
    "span": "m",
    "href": "/docs-next/dev/key-features/workload-management",
    "order": 130
  },
  {
    "id": "key-features-high-availability",
    "title": "High Availability",
    "description": "Keep Doris available through replication, failover, and fault tolerance.",
    "tags": [
      "fault-tolerance",
      "replica"
    ],
    "span": "t",
    "href": "/docs-next/dev/key-features/high-availability",
    "order": 140
  },
  {
    "id": "key-features-multi-catalog",
    "title": "Multi-Catalog Federation",
    "description": "Access multiple external systems through a single catalog layer.",
    "tags": [
      "external",
      "jdbc",
      "hive"
    ],
    "span": "m",
    "href": "/docs-next/dev/key-features/multi-catalog",
    "order": 150
  },
  {
    "id": "key-features-multi-catalog2",
    "title": "Multi-Catalog Federation2",
    "description": "Access multiple external systems through a single catalog layer.",
    "tags": [
      "external",
      "jdbc",
      "hive"
    ],
    "span": "m",
    "href": "/docs-next/dev/key-features/multi-catalog2",
    "order": 150
  }
];

