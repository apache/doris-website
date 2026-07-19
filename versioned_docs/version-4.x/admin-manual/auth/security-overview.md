---
{
    "title": "Security Overview",
    "language": "en",
    "description": "Overview of Apache Doris enterprise-grade security: authentication, RBAC and Ranger authorization, row- and column-level access control, data masking, SSL transport encryption, audit logs, UDF security, and third-party package governance."
}
---

<!-- Knowledge type: Concept overview + Architecture selection decision -->
<!-- Applicable scenarios: Security architecture planning / Authentication and authorization solution selection / Security compliance review -->

Apache Doris provides complete security capabilities for enterprise-grade data platforms, covering authentication, authorization, data protection, transport encryption, and audit traceability. This document starts from security scenarios, introduces the overall security architecture, core concepts, and authentication and authorization framework of Doris, and provides entry points to each capability so that administrators can quickly establish a complete security protection plan.

## Applicable Scenarios

| Scenario | Capabilities to focus on | Entry document |
| --- | --- | --- |
| Centralized user management (integration with enterprise LDAP/AD) | LDAP authentication | [LDAP-based authentication](./authentication/ldap) |
| Internal user and password policy management | Built-in authentication, password policy, whitelist | [Built-in authentication](./authentication/internal) |
| Multi-team shared cluster, role-based authorization | RBAC, roles | [Built-in authorization](./authorization/internal) |
| Unified authorization governance with the big data ecosystem | Apache Ranger integration | [Ranger-based authorization](./authorization/ranger) |
| Sensitive data protection (row-level/column-level, masking) | Data access control | [Data access control](./authorization/data) |
| Encrypting the client-to-FE link | MySQL protocol SSL, FE HTTPS | [MySQL protocol SSL](./certificate), [FE HTTPS configuration](./fe-certificate) |
| Audit and compliance traceability | Audit log | [Audit log](../audit-plugin) |
| Data encryption and decryption | Encryption functions | [Data encryption functions](./encryption-function) |
| Deployment on AWS, integration with IAM | AWS authentication and authorization | [AWS authentication and authorization](./integrations/aws-authentication-and-authorization) |

## Security Capability Overview

<!-- Knowledge type: Capability list -->

Doris manages data security through the following mechanisms, covering five dimensions: identity, authorization, data, transport, and audit.

| Security dimension | Capability | Description |
| --- | --- | --- |
| Authentication | Built-in authentication | Doris provides built-in username/password authentication with customizable password policies. |
| Authentication | LDAP authentication | Centrally manages user credentials through the LDAP service, simplifying access control and improving system security. |
| Authorization | Role-Based Access Control (RBAC) | Restricts access to and operations on database resources based on user roles and privileges. |
| Authorization | Ranger authorization | Integrates with Apache Ranger to provide centralized authorization with fine-grained access control policies. |
| Data protection | Data encryption and masking | Encrypts and masks data in tables to prevent leakage of sensitive data caused by unauthorized access. |
| Data protection | Fine-grained access control | Configures row- and column-level access privileges based on rules. |
| Transport security | SSL encryption protocol | Secures data transmission between the client and the Doris server, preventing data from being stolen or tampered with. |
| Audit traceability | Audit log | Records all operations such as user login, queries, and data modifications, supporting post-event audit and issue tracking. |
| Extended security | Java UDF security | The root administrator must review the implementation of user UDFs to ensure operational safety and prevent high-risk operations such as deleting data or damaging the system. |
| Extended security | Third-party package governance | When introducing third-party packages through features such as JDBC Catalog and UDFs, administrators must ensure that the source is safe and trustworthy. Use only official channels or dependencies from trusted communities. |

## Core Concepts

<!-- Knowledge type: Concept overview -->

The Doris authorization system is modeled on the MySQL authorization mechanism. It supports row-level fine-grained access control, role-based access control, and a whitelist mechanism. Understanding the following four core concepts helps you quickly master the authentication and authorization model of Doris.

### User Identity

In the authorization system, a user is identified as a User Identity. A User Identity consists of two parts: `username` and `host`.

- `username`: The user name, composed of English letters in upper and lower case.
- `host`: The IP address from which the user connects.

A User Identity is represented as `username@'host'`, meaning `username` connecting from `host`.

Another representation of User Identity is `username@['domain']`, where `domain` is a domain name that can be resolved by DNS into a set of IP addresses, eventually represented as a set of `username@'host'`. The following sections use `username@'host'` uniformly.

### Privilege

A privilege acts on a node, data catalog, database, or table. Different privileges represent different operation permissions.

### Role

Doris allows you to create custom-named roles. A role can be regarded as a collection of privileges. A newly created user can be assigned a role and automatically obtains the privileges of that role. Subsequent changes to the privileges of the role are also reflected in the privileges of all users belonging to that role.

### User Property

User properties are attached directly to a user, not to a User Identity. That is, `user@'192.%'` and `user@['domain']` share the same set of user properties. The properties belong to the user `user`, not to `user@'192.%'` or `user@['domain']`.

User properties include, but are not limited to, the maximum number of connections for the user and load cluster configuration.

## Authentication and Authorization Framework

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenarios: Authentication and authorization solution selection -->

The process of logging in to Apache Doris consists of two parts: **authentication** and **authorization**.

- **Authentication**: Verifies the user's identity based on the credentials provided by the user (such as user name, client IP, and password). After verification passes, the individual user is mapped to a User Identity in the system.
- **Authorization**: Based on the obtained User Identity and its corresponding privileges, checks whether the user has permission to perform the requested operation.

For authentication, Doris supports two options: **built-in authentication** and **LDAP authentication**. For authorization, Doris supports two options: **built-in authorization based on RBAC** and **external authorization based on Apache Ranger**. The two sides can be combined freely. For example, you can use LDAP for authentication and Ranger for authorization.

The following table lists common combinations and their applicable scenarios:

| Authentication method | Authorization method | Applicable scenario |
| --- | --- | --- |
| Built-in authentication | Built-in RBAC | Small- to medium-sized cluster, standalone deployment, no external dependencies. |
| LDAP authentication | Built-in RBAC | Integration with enterprise LDAP/AD, while the authorization model is still managed by Doris. |
| Built-in authentication | Apache Ranger | An existing Ranger system, where you want unified authorization governance with the big data ecosystem. |
| LDAP authentication | Apache Ranger | Enterprise-grade best practice: unified identity, centralized authorization, and auditable. |

## Section Navigation

<!-- Knowledge type: Document index -->

Refer to the following documents by topic for details on Doris security capabilities:

| Topic | Document |
| --- | --- |
| Built-in authentication (password policy, whitelist, forgotten-password handling) | [Built-in authentication](./authentication/internal) |
| LDAP authentication | [LDAP-based authentication](./authentication/ldap) |
| Built-in RBAC authorization (privilege items, privilege hierarchy, roles) | [Built-in authorization](./authorization/internal) |
| Row- and column-level privileges and data masking | [Data access control](./authorization/data) |
| Centralized authorization with Apache Ranger | [Ranger-based authorization](./authorization/ranger) |
| Audit log | [Audit log](../audit-plugin) |
| MySQL protocol SSL transport encryption | [MySQL protocol SSL](./certificate) |
| FE HTTP/HTTPS transport encryption | [FE HTTPS configuration](./fe-certificate) |
| Encryption functions | [Data encryption functions](./encryption-function) |
| Integration with cloud vendors (AWS) | [AWS authentication and authorization](./integrations/aws-authentication-and-authorization) |
