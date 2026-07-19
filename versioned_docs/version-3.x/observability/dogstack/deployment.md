---
{
    "title": "Deployment",
    "sidebar_label": "Deployment",
    "language": "en-US",
    "description": "How to deploy DOG Stack in production? This article introduces deployment options and selection guidance for the three core components: OpenTelemetry Collector, Apache Doris, and Grafana with the Doris App plugin.",
    "keywords": [
        "DOG Stack deployment",
        "OpenTelemetry Collector",
        "Apache Doris deployment",
        "Grafana deployment",
        "Doris App plugin",
        "Docker Compose",
        "Kubernetes",
        "observability"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack production deployment -->

As shown in the architecture diagram, DOG Stack consists of four components: the data collection tools, the OpenTelemetry Collector, Doris, and Grafana with the Doris App plugin. This deployment document focuses on the latter three components; the data collection tools are covered in the data collection document.

DOG Stack offers multiple deployment options for different environments and purposes.



## Docker Compose

Best suited for local testing, development, and PoC.

### Prerequisites

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)



### Deployment

1. Clone the repository:

   `git clone https://github.com/ai-observe/ai-observe-stack.git cd ai-observe-stack/docker`

   

2. Start all services:

   `docker compose up -d`

   

3. Verify that services are running:

   `docker compose ps`

   All services should show the `running` status.

   

4. Access Grafana at http://localhost:3000 and log in with the default credentials `admin` / `admin`.



### Service endpoints

| Service   | Endpoint              | Credentials   |
| --------- | --------------------- | ------------- |
| Grafana   | http://localhost:3000 | admin / admin |
| OTel gRPC | localhost:4317        | -             |
| OTel HTTP | localhost:4318        | -             |

### Stop and clean up

Stop services while keeping data:

```Bash
docker compose down
```

Stop services and remove all data:

```Bash
docker compose down -v
```



## Kubernetes

Best suited for production deployment, development environments, and scalable setups.

### Prerequisites

- Kubernetes cluster (v1.20+)
- Helm (v3.0+)
- kubectl configured to access your cluster
- PersistentVolume provisioner (for data persistence)

### Deployment

1. Add the DOG Stack and Doris Helm repositories:
   
   `helm repo add dogstack https://charts.velodb.io helm repo update`
   
   
   
2. Create a namespace for DOG Stack:
   
   `kubectl create namespace dogstack`
   
   
   
3. Install DOG Stack:
   
   If you already have a Doris cluster, you can specify how to connect to it.
   
   `helm install my-dogstack dogstack/dogstack -n dogstack \  --set doris.mode=external \  --set doris.external.host=<DORIS_FE_HOST> \  --set doris.external.port=9030 \  --set doris.external.feHttpPort=8030 \  --set doris.internal.operator.enabled=false`
   
   
   
   If you want to deploy a new Doris cluster, just install directly with no extra options.
   
   `helm install my-dogstack dogstack/dogstack -n dogstack`
   
   
   
4. Verify that all pods are running:
   
   `kubectl get pods -n dogstack`
   
   Wait until all pods show the `Running` status.
   
   
   
5. Access Grafana:
   
   `kubectl port-forward svc/my-dogstack-grafana 3000:3000 -n dogstack`
   
   Open http://localhost:3000 and log in with `admin` / `admin`.



### Service endpoints

| Service     | Port-forward command                                         |
| ----------- | ------------------------------------------------------------ |
| Grafana     | `kubectl port-forward svc/my-dogstack-grafana 3000:3000 -n dogstack` |
| Doris FE UI | `kubectl port-forward svc/my-dogstack-doris-fe 8030:8030 -n dogstack` |
| Doris MySQL | `kubectl port-forward svc/my-dogstack-doris-fe 9030:9030 -n dogstack` |

### Uninstall

```Bash
helm uninstall my-dogstack -n dogstack
kubectl delete namespace dogstack
```



## Manual deployment

1. Deploy a Doris cluster by following the Doris [deployment documentation](https://doris.apache.org/docs/4.x/install/preparation/env-checking). Skip this step if you already have a Doris cluster.

1. Deploy the OpenTelemetry Collector by following the [OpenTelemetry deployment documentation](https://opentelemetry.io/docs/collector/install/).

1. Deploy Grafana by following the [Grafana deployment documentation](https://grafana.com/docs/grafana/latest/setup-grafana/installation/).

1. Open the DOG Stack web UI in your browser.

Visit http://localhost:3000 to access the Grafana UI inside DOG Stack.
