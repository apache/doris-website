---
{
    "title": "Stream Load Practices in Complex Network Environments",
    "language": "en",
    "description": "How to use Doris Stream Load in complex networks such as public cloud, private cloud, and Kubernetes cross-cluster scenarios? Multi-endpoint configuration and Group Commit scheduling solutions.",
    "keywords": [
        "Stream Load",
        "Group Commit",
        "complex network",
        "public cloud ingestion",
        "Kubernetes data ingestion",
        "VPC cross-cluster",
        "load balancer",
        "public_endpoint",
        "private_endpoint",
        "redirect-policy"
    ]
}
---

<!-- Knowledge type: architecture decision + operational steps -->
<!-- Applicable scenarios: data ingestion configuration in public cloud / private cloud / Kubernetes cross-cluster environments -->

In complex network environments such as public cloud, private cloud, and Kubernetes cross-cluster deployments, data ingestion faces unique challenges. Load balancers (LB) and network isolation (intra-VPC and external access) affect both the flexibility of request routing and the efficiency of batch processing.

Apache Doris addresses these challenges with the following two features:

- **Multi-endpoint support for Stream Load**: allows you to flexibly configure multiple network endpoints for BE nodes.
- **Group Commit LB scheduling optimization**: ensures that requests can still be efficiently batched after passing through a load balancer.

> Version requirement: Doris 3.1.0 or later is required.

## Background

### Stream Load

Stream Load is an HTTP-based data ingestion method that supports formats such as JSON and CSV. As a push-based method, the client sends data directly to BE nodes through HTTP requests, bypassing the MySQL protocol. This design supports high concurrency, low latency, and high throughput, making it well suited for small-batch, high-frequency write scenarios.

### Group Commit

Group Commit optimizes throughput by merging multiple small requests into large batch operations on the server side, reducing disk I/O, lock contention, and Compaction overhead. To achieve the best efficiency, Group Commit requires that requests for the same table be routed to the same BE node.

### Core Challenges in Complex Network Environments

In cloud environments, load balancers distribute requests randomly across BE nodes, breaking the "node affinity" that Group Commit depends on. As a result, requests for the same table are scattered to different nodes. Tests show that throughput in high-concurrency scenarios can drop by 20-50% as a result.

## Multi-Endpoint Support for Stream Load

<!-- Knowledge type: configuration parameters -->

### Three Types of BE Addresses

A Doris BE node supports three types of addresses to fit different network access scenarios:

| Address type         | Purpose                                                | Example               |
| -------------------- | ------------------------------------------------------ | --------------------- |
| `be_host`            | Internal cluster communication                         | `192.168.1.1:9050`    |
| `public_endpoint`    | External public network access (via LB or public IP)   | `11.10.20.12:8010`    |
| `private_endpoint`   | Intra-VPC or Kubernetes Service IP access              | `10.10.10.9:8020`     |

### Configuring BE Endpoints

Use SQL statements to add or modify endpoint information for a BE node:

```sql
-- Add a BE node and configure its endpoints
ALTER SYSTEM ADD BACKEND '192.168.1.1:9050' PROPERTIES(
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);

-- Modify the endpoints of an existing BE node
ALTER SYSTEM MODIFY BACKEND '192.168.1.1:9050' SET (
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);
```

### Redirect Policy (redirect-policy)

By setting the `redirect-policy` HTTP header in a Stream Load request, you can control which endpoint the request is routed to:

| Policy        | Behavior                              | Applicable scenarios                              |
| ------------- | ------------------------------------- | ------------------------------------------------- |
| `direct`      | Routes to `be_host`                   | Internal low-latency communication, pod-to-pod   |
| `public`      | Routes to `public_endpoint`           | External public network access                    |
| `private`     | Routes to `private_endpoint`          | Intra-VPC or cross-cluster access                 |
| Default (empty) | Selects the endpoint automatically based on the host name | General scenarios |

When `redirect-policy` is not explicitly set, the FE selects an endpoint automatically in the following order:

1. If the request host name matches the host name of `public_endpoint`, route to `public_endpoint`.
2. Otherwise, if `private_endpoint` is configured, route to `private_endpoint`.
3. Otherwise, fall back to `be_host`.

### Request Example

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### How It Works

1. The client sends a Stream Load request to the FE, optionally carrying the `redirect-policy` header.
2. The FE selects a target address from the BE address pool according to the policy.
3. The FE returns an HTTP redirect response pointing to the selected endpoint.

## Group Commit LB Scheduling Optimization

<!-- Knowledge type: architecture mechanism -->

### Two-Stage Forwarding Mechanism

To preserve Group Commit efficiency behind a load balancer, Doris implements a two-stage forwarding mechanism:

**Stage 1: FE redirect**

- The FE selects an appropriate endpoint according to `redirect-policy`.
- The FE determines which BE node should handle the target table.
- The request is redirected through the LB, which distributes it randomly to a BE node.

**Stage 2: BE forwarding**

- If the BE that receives the request (BE1) is not the designated node for that table.
- BE1 internally forwards the request through `be_host` to the correct BE (BE2).
- This ensures that all requests for the same table reach the same node.

### Request Example with Group Commit Enabled

To enable the corresponding Group Commit mode, simply add the `group_commit` parameter to the request header:

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -H "group_commit: async_mode" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### Performance

The overhead introduced by two-stage forwarding is minimal (millisecond-level), while the batch optimization provided by Group Commit can improve throughput by 20-50% in high-concurrency scenarios.

## Typical Use Cases

<!-- Applicable scenarios: endpoint and Group Commit combinations for different business forms -->

| Scenario                | Configuration                                       | Benefits                              |
| ----------------------- | --------------------------------------------------- | ------------------------------------- |
| Real-time log ingestion | Group Commit + multi-endpoint                       | High throughput + flexible routing    |
| Cloud-native BI         | External access via `public_endpoint`               | Secure access for external users      |
| Kubernetes cross-cluster | `private_endpoint` together with Pod / Service IP   | Efficient cross-cluster communication |

## Notes

- **Configuration planning**: ensure that endpoint addresses are configured correctly. In Kubernetes environments in particular, they must be consistent with the Service / Pod IP plan.
- **Monitoring**: use monitoring tools to track the forwarding rate and performance metrics, paying attention to the hit rate of two-stage forwarding.
- **Version requirement**: Doris 3.1.0 or later is required.

## FAQ

**Q1: When do I need to configure `public_endpoint` and `private_endpoint`?**

When network isolation exists between clients and BE nodes (for example, inside vs. outside a VPC, or inside vs. outside a Kubernetes cluster), you need to configure `public_endpoint` (for public/external access) and `private_endpoint` (for internal/VPC access) separately, so that clients in different network locations can access BEs correctly.

**Q2: Does Group Commit still work behind a load balancer?**

Yes. Through the two-stage forwarding mechanism, Doris ensures that even when the LB distributes requests randomly, BEs forward requests for the same table to the same node, preserving the batch-processing benefits of Group Commit.

**Q3: What happens if `redirect-policy` is not set?**

The FE selects an endpoint automatically based on the request host name: it first tries to match `public_endpoint`, then `private_endpoint`, and finally falls back to `be_host`.

**Q4: Does two-stage forwarding significantly increase latency?**

No. Internal forwarding between BEs incurs only millisecond-level overhead, which is negligible compared with the 20-50% throughput improvement that Group Commit provides under high concurrency.

## Troubleshooting

| Symptom                                                | Possible cause                                                            | Solution                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Client cannot access the BE address after redirect     | `public_endpoint` / `private_endpoint` does not match the actual network  | Correct the endpoint configuration with `ALTER SYSTEM MODIFY BACKEND`                                 |
| Stream Load throughput falls short under high concurrency | Group Commit is not enabled, or requests do not go through two-stage forwarding | Add `group_commit: async_mode` to the request header and confirm network connectivity between BEs    |
| Cross-Kubernetes-cluster ingestion fails               | `private_endpoint` is missing or `redirect-policy` is not specified       | Configure `private_endpoint` as the Pod / Service IP and set `redirect-policy: private`               |
| Default redirect routes to the wrong endpoint          | The host name matching rule does not hit as expected                      | Explicitly specify `redirect-policy: public` or `private`                                             |
