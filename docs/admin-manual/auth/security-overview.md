---
{
    "title": "Security Overview",
    "language": "en"
}
---

Doris provides the following mechanisms to manage data security:

**Authentication:** Doris supports both username/password and LDAP authentication methods.

- **Built-in Authentication:** Doris includes a built-in username/password authentication method, allowing customization of password policies.

- **LDAP Authentication:** Doris can centrally manage user credentials through LDAP services, simplifying access control and enhancing system security.

**Permission Management:** Doris supports role-based access control (RBAC) or can inherit Ranger to achieve centralized permission management.

- **Role-Based Access Control (RBAC):** Doris can restrict users' access to and operations on database resources based on their roles and permissions.

- **Ranger Permission Management:** By integrating with Ranger, Doris enables centralized permission management, allowing administrators to set fine-grained access control policies for different users and groups.

**Audit and Logging:** Doris can enable audit logs to record all user actions, including logins, queries, data modifications, and more, facilitating post-audit and issue tracking.

**Data Encryption and Masking:** Doris supports encryption and masking of data within tables to prevent unauthorized access and data leakage.

**Data Transmission Encryption:** Doris supports SSL encryption protocols to ensure secure data transmission between clients and Doris servers, preventing data from being intercepted or tampered with during transfer.

**Fine-Grained Access Control:** Doris allows configuring data row and column access permissions based on rules to control user access at a granular level.

**JAVA-UDF Security:** Doris supports user-defined function functionality, so root administrators need to review the implementation of user UDFs to ensure the operations in the logic are safe and prevent high-risk actions in UDFs, such as data deletion and system disruption.

**Third-Party Packages:** When using Doris features like JDBC Catalog or UDFs, administrators must ensure that any third-party packages are from trusted and secure sources. To reduce security risks, it is recommended to use dependencies only from official or reputable community sources.