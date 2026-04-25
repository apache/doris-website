---
{
    "title": "Stream Load in Complex Network Environments",
    "language": "en",
    "description": "Best practices for Stream Load in complex network environments including public cloud, private cloud, and Kubernetes cross-cluster access scenarios."
}
---

## Overview

In complex network environments such as public cloud, private cloud, and Kubernetes cross-cluster deployments, data import faces unique challenges. Load balancers (LB) and network isolation (VPC internal/external access) can impact both request routing flexibility and batch processing efficiency.

Apache Doris addresses these challenges through two key features:
- **Stream Load Multi-Endpoint Support**: Enables flexible configuration of multiple network endpoints for BE nodes
- **Group Commit LB Scheduling Optimization**: Ensures efficient batch processing even when requests pass through load balancers

## Background

### Stream Load

Stream Load is an HTTP-based data import method that supports JSON, CSV, and other formats. As a push-based approach, clients send data directly to Backend nodes (BE) via HTTP requests, bypassing the MySQL protocol. This design enables high concurrency, low latency, and high throughput, making it ideal for small-batch, frequent write scenarios.

### Group Commit

Group Commit optimizes throughput by combining multiple small requests into larger batch operations on the server side, reducing disk I/O, lock contention, and compaction overhead. For maximum efficiency, Group Commit requires requests for the same table to be routed to the same BE node.

### The Challenge

In cloud environments, load balancers randomly distribute requests across BE nodes. This breaks the "node affinity" required by Group Commit, causing requests for the same table to scatter across different nodes. Tests show throughput can drop 20-50% in high-concurrency scenarios due to this issue.

## Stream Load Multi-Endpoint Support

### Address Types

Doris BE nodes support three address types to accommodate different network access scenarios:

| Address Type | Purpose | Example |
|-------------|---------|---------|
| `be_host` | Internal cluster communication | `192.168.1.1:9050` |
| `public_endpoint` | External public access via LB or public IP | `11.10.20.12:8010` |
| `private_endpoint` | Private access within VPC or Kubernetes Service IP | `10.10.10.9:8020` |

### Configuration

Configure endpoints using SQL statements:

```sql
-- Add BE node with endpoints
ALTER SYSTEM ADD BACKEND '192.168.1.1:9050' PROPERTIES(
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);

-- Modify existing BE node endpoints
ALTER SYSTEM MODIFY BACKEND '192.168.1.1:9050' SET (
    'tag.public_endpoint' = '11.10.20.12:8010',
    'tag.private_endpoint' = '10.10.10.9:8020'
);
```

### Redirect Policy

Control request routing using the `redirect-policy` HTTP header:

| Policy | Behavior | Use Case |
|--------|----------|----------|
| `direct` | Routes to `be_host` | Internal low-latency communication, Pod-to-Pod |
| `public` | Routes to `public_endpoint` | External access via public network |
| `private` | Routes to `private_endpoint` | VPC internal or cross-cluster access |
| Default (empty) | Auto-selects based on hostname matching | General use |

**Default behavior:**
1. If request hostname matches `public_endpoint` hostname, routes to `public_endpoint`
2. Else if `private_endpoint` is configured, routes to `private_endpoint`
3. Otherwise, falls back to `be_host`

**Example:**

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### How It Works

1. Client sends Stream Load request to FE with optional `redirect-policy` header
2. FE selects target address from BE's address pool based on the policy
3. FE returns HTTP redirect response to the selected endpoint

## Group Commit LB Scheduling Optimization

### Two-Phase Forwarding

To maintain Group Commit efficiency behind load balancers, Doris implements a two-phase forwarding mechanism:

**Phase 1: FE Redirect**
- FE selects the appropriate endpoint based on `redirect-policy`
- FE determines which BE node should handle the target table
- Request is redirected through LB, which randomly distributes to a BE node

**Phase 2: BE Forwarding**
- If the receiving BE (BE1) is not the designated node for the table
- BE1 forwards the request internally to the correct BE (BE2) via `be_host`
- This ensures all requests for the same table reach the same node

### Configuration Example

```bash
curl --location-trusted -u user:pass \
    -H "redirect-policy: private" \
    -H "group_commit: async_mode" \
    -T data.csv \
    http://doris.example.com:8030/api/db_name/table_name/_stream_load
```

### Performance

The two-phase forwarding introduces minimal overhead (millisecond-level), while Group Commit's batch processing provides 20-50% throughput improvement in high-concurrency scenarios.

## Use Cases

| Scenario | Configuration | Benefit |
|----------|--------------|---------|
| Real-time log ingestion | Group Commit + Multi-Endpoint | High throughput with flexible routing |
| Cloud-native BI | `public_endpoint` for external access | Secure external user access |
| Kubernetes cross-cluster | `private_endpoint` with Pod/Service IPs | Efficient cross-cluster communication |

## Considerations

- **Configuration planning**: Ensure endpoint addresses are correctly configured, especially in Kubernetes environments
- **Monitoring**: Use monitoring tools to track forwarding rates and performance
- **Version requirement**: These features require Doris 3.1.0 or later
