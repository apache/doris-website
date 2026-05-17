---
{
    "title": "Cluster Planning",
    "language": "en",
    "description": "Before deploying Doris, choose an architecture mode and plan ports and node counts."
}
---

<!-- Knowledge type: Architecture selection + Configuration reference -->
<!-- Applicable scenarios: Deployment planning / Architecture selection / Capacity planning -->

## Architecture planning

<!-- Knowledge type: Architecture selection decision -->

Choose an architecture mode based on your business needs:

| Architecture mode | Applicable scenario | Dependency |
| ----------------- | ------------------- | ---------- |
| [Integrated storage and compute](../../features-architecture/system-architecture#coupled-architecture) | Extreme elastic scaling is not required | No shared storage required |
| [Decoupled storage and compute](../../features-architecture/system-architecture#decoupled-architecture) | Compute resources need to scale dynamically | Requires shared storage |

## Port planning

<!-- Knowledge type: Network configuration parameters -->

Doris instances communicate over the network. Administrators can adjust port configurations based on the environment:

| Instance | Port name | Default port | Communication direction | Description |
| -------- | --------- | ------------ | ----------------------- | ----------- |
| BE | be_port | 9060 | FE → BE | Thrift Server, receives requests from FE |
| BE | webserver_port | 8040 | BE ↔ BE | HTTP Server |
| BE | heartbeat_service_port | 9050 | FE → BE | Heartbeat service (Thrift) |
| BE | brpc_port | 8060 | FE ↔ BE, BE ↔ BE | BRPC communication |
| FE | http_port | 8030 | FE ↔ FE, Client ↔ FE | HTTP Server |
| FE | rpc_port | 9020 | BE → FE, FE ↔ FE | Thrift Server, must be consistent across FEs |
| FE | query_port | 9030 | Client ↔ FE | MySQL Server |
| FE | edit_log_port | 9010 | FE ↔ FE | bdbje communication |

## Node count planning

<!-- Knowledge type: Node capacity planning -->

### FE node count

FE handles user request ingress, query planning, metadata management, and node management.

| Node type | Role | Production recommendation |
| --------- | ---- | ------------------------- |
| Follower | Participates in elections; takes over when the Master goes down | ≥ 3 |
| Observer | Synchronizes metadata only; extends read service capacity | Add as needed |

### BE node count

BE handles data storage and computation. Production environments use 3 replicas to ensure reliability.

| Recommendation | Description |
| -------------- | ----------- |
| ≥ 3 BEs | Ensures reliable storage with 3 replicas (in integrated storage and compute mode. In decoupled storage and compute mode, the number of BEs can be 0 or more.) |
| Supports horizontal scaling | Adding nodes improves query performance and concurrency |

