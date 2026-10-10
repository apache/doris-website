---
{
    "title": "Deploy with Docker Compose",
    "sidebar_label": "Deploy with Docker Compose",
    "language": "en-US",
    "description": "How to deploy DOG Stack on a single host with Docker Compose? This article describes how to start the OpenTelemetry Collector, Apache Doris, and Grafana with the Doris App plugin, either with a built-in Doris or with an existing Doris cluster, and how to verify, access, and clean up the deployment.",
    "keywords": [
        "DOG Stack deployment",
        "Docker Compose",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Doris App plugin",
        "observability"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack single-host deployment -->

This article describes how to deploy DOG Stack on a single host with Docker Compose. The deployment starts the OpenTelemetry Collector, Grafana with the Doris App plugin, and optionally an all-in-one Doris. It is suited for local testing, development, and PoC. For production or Kubernetes environments, see [Deploy on Kubernetes](./kubernetes.md).

:::tip
To deploy the components without Docker, follow the [Doris deployment documentation](https://doris.apache.org/docs/4.x/install/preparation/env-checking), the [OpenTelemetry Collector installation documentation](https://opentelemetry.io/docs/collector/install/), and the [Grafana installation documentation](https://grafana.com/docs/grafana/latest/setup-grafana/installation/).
:::

## Prerequisites

- Docker Engine 20.10 or later
- Docker Compose 2.0 or later

## Deployment

1. Clone the repository:

   ```Bash
   git clone https://github.com/ai-observe/ai-observe-stack.git
   cd ai-observe-stack/docker
   ```

2. Start the services. Choose one of the following modes.

   - **Built-in Doris**: starts an all-in-one Doris together with the OpenTelemetry Collector and Grafana.

     ```Bash
     docker compose up -d
     ```

   - **Existing Doris**: starts only the OpenTelemetry Collector and Grafana, and writes data to your Doris cluster. Create the configuration file first:

     ```Bash
     cp .env.example .env
     ```

     Edit the Doris connection settings in `.env`:

     ```Bash
     DORIS_FE_HTTP_ENDPOINT=http://<DORIS_FE_HOST>:8030
     DORIS_FE_MYSQL_ENDPOINT=<DORIS_FE_HOST>:9030
     DORIS_USERNAME=root
     DORIS_PASSWORD=
     ```

     Then start the services:

     ```Bash
     docker compose -f docker-compose-without-doris.yaml up -d
     ```

     The account must have the `CREATE DATABASE` privilege. The OpenTelemetry Collector creates the database `otel` and its tables automatically.

     The OpenTelemetry Collector writes data through Stream Load: FE redirects each request to a BE at the address the BE registered in Doris (shown by `SHOW BACKENDS`). Therefore the BE addresses and the BE HTTP port (8040 by default) must also be reachable from the OpenTelemetry Collector container, not only the FE.

3. Verify that the services are running:

   ```Bash
   docker compose ps
   ```

   In the existing Doris mode, add `-f docker-compose-without-doris.yaml`. The `STATUS` column of every service should show `Up`. With the built-in Doris, the OpenTelemetry Collector starts only after Doris passes its health check.

4. Open http://localhost:3000 and log in to Grafana with `admin` / `admin`.

## Service Endpoints

| Service | Endpoint | Credentials |
| --- | --- | --- |
| Grafana | http://localhost:3000 | admin / admin |
| OTLP gRPC | localhost:4317 | - |
| OTLP HTTP | localhost:4318 | - |
| OpenTelemetry Collector health check | http://localhost:13133 | - |
| Doris FE Web UI (built-in Doris only) | http://localhost:8030 | root / empty password |
| Doris MySQL protocol (built-in Doris only) | localhost:9030 | root / empty password |

Applications instrumented with an OpenTelemetry SDK send data to `localhost:4317` (gRPC) or `localhost:4318` (HTTP).

## Stop and Clean Up

Stop the services and keep the data:

```Bash
docker compose down
```

Stop the services and remove all data:

```Bash
docker compose down -v
```

In the existing Doris mode, add `-f docker-compose-without-doris.yaml` to both commands. The data in your Doris cluster is not removed.
