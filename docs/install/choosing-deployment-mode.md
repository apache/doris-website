---
{
    "title": "Choosing the Right Deployment Mode",
    "language": "en",
    "sidebar_label": "Choosing a Deployment Mode",
    "description": "Choose between integrated storage-compute or decoupled mode, and between manual, Kubernetes, or cloud deployment."
}
---

## Quick Selection

Use your business scenario to quickly settle on a deployment plan:

| Scenario | Recommended plan |
|------|----------|
| Need elastic scaling, deployed in the cloud | Storage-compute decoupled + cloud platform deployment |
| Fixed scale, on-premise | Storage-compute integrated + manual deployment |
| Large-scale cluster, automated management required | Storage-compute decoupled + Kubernetes deployment |

---

## Storage-Compute Integrated vs Storage-Compute Decoupled

| Item | Storage-compute integrated | Storage-compute decoupled |
|--------|----------|----------|
| Architecture | Data and compute are tightly coupled; BE nodes handle both storage and queries | The compute layer (BE) and the storage layer (Shared Storage) are separated |
| Use cases | Fixed business scale, demanding query performance, environments without shared storage | Need elastic scaling, cloud deployment, big data analytics |
| Pros | Simple architecture, low latency, no external shared storage required | Compute resources can be scaled independently, lower storage cost, more flexible resource isolation |
| Cons | Compute resources cannot be scaled independently | More components, and a stable shared storage service is required |

---

## Deployment Methods

### Manual Deployment

Deploy manually with scripts and configuration files. Suitable for small to medium clusters and initial validation.

- Suitable for: quick validation, minimal deployments, getting familiar with the cluster architecture
- Not suitable for: large-scale clusters, environments that require frequent changes

For detailed steps, see [Manually Deploy a Storage-Compute Integrated Cluster](./deploy-manually/integrated-storage-compute-deploy-manually) or [Manually Deploy a Storage-Compute Decoupled Cluster](./deploy-manually/separating-storage-compute-deploy-manually).

### Kubernetes Deployment

Manage clusters on Kubernetes with Doris Operator. Suitable for large-scale production and automated scenarios.

- Suitable for: large-scale clusters, scenarios that need declarative management, hybrid cloud deployments
- Requirements: Kubernetes cluster, Doris Operator

For detailed steps, see [Kubernetes Deployment](./deploy-on-kubernetes/intro).

### Cloud Platform Deployment

Deploy on cloud platforms such as Alibaba Cloud and AWS, leveraging cloud-native infrastructure.

- Suitable for: cloud-based workloads, scenarios that require quick provisioning, environment isolation
- Supports: Alibaba Cloud ECI, AWS EKS, and others

For detailed steps, see [Cloud Platform Deployment](./deploy-on-cloud/doris-on-aws).

---

## Decision Recommendations

1. **First time trying Doris**: start with storage-compute integrated + manual deployment. The architecture is simple and easy to get started with.
2. **Production environment, small to medium scale**: storage-compute integrated + manual deployment or Kubernetes deployment.
3. **Cloud deployment with elasticity needs**: storage-compute decoupled + cloud platform deployment or Kubernetes deployment.
4. **Large-scale production cluster**: storage-compute decoupled + Kubernetes deployment, which simplifies automated operations.

---

## FAQ

### Q: Does the storage-compute decoupled architecture significantly affect query performance?

In most cases, the storage-compute decoupled architecture introduces some additional network overhead because the compute layer and storage layer are separated, but the impact is limited in most scenarios. The reasons are:
- Shared Storage is typically deployed in a high-speed network environment (such as 25Gbps RDMA).
- Data caching mechanisms can effectively reduce the frequency of remote reads.
- For some extreme low-latency scenarios, storage-compute integrated may be more suitable.

### Q: How do I migrate an existing cluster from storage-compute integrated to storage-compute decoupled?

The migration process is roughly as follows:
1. Deploy a storage-compute decoupled cluster in the new environment.
2. Migrate data using Broker Load or Stream Load.
3. Verify data consistency and query performance.
4. Decommission the old cluster.

### Q: Does Kubernetes deployment require a dedicated operations team?

It depends on the cluster size:
- Small-scale clusters (within 10 nodes): the additional complexity of Kubernetes deployment may not be worthwhile.
- Medium to large-scale clusters (10+ nodes): the automation capabilities of Kubernetes can significantly reduce operational costs.

### Q: How do I choose between cloud platform deployment and Kubernetes deployment?

| Item | Cloud platform deployment | Kubernetes deployment |
|--------|------------|------------------|
| Use cases | Quick deployment, elastic resources | Hybrid cloud, multi-cloud environments |
| Management complexity | Low | Medium |
| Flexibility | Limited by the cloud platform's capabilities | High, customizable |
| Cost | May incur additional cloud service fees | More controllable |


