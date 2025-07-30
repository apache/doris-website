---
{
   "title": "Tableau",
   "language": "en"
}
---

## Introduction
Tableau is a lightweight data visualization analysis platform that combines data operations with beautiful charts perfectly. It seamlessly combines data computation with visually appealing charts, requiring no coding from the user. By simply dragging and dropping, users can quickly gain insights into the data. They can explore different views and even easily combine multiple data sources to complete tasks such as data visualization, exploration, and analysis.
## Prerequisites
Regardless of whether your Mac is based on an Intel chips or Apple Silicon Chips, for Tableau Desktop on Mac, you need to download and install the Intel version. This is to ensure compatibility with the MySQL driver. You can select and download the Intel version from the [Support Releases](https://www.tableau.com/support/releases) page.  

## Driver Installation
1. iODBC Installation  
    1. Close Tableau Desktop  
    2. Download the latest Driver Manager (mxkozzz.dmg) from the official [iODBC website](https://www.iodbc.org/dataspace/doc/iodbc/wiki/iodbcWiki/Downloads#Mac%20OS%20X)
    3. Install the downloaded dmg file
2. Install the MySQL driver

When choosing the ODBC driver for MySQL to connect to Doris, you should install the MySQL 5.x ODBC driver. Using the latest MySQL driver may result in an "Unsupported command" error when connecting to Doris.
## Connection Configuration and Usage
1. Click the Tableau Desktop home page and select MySQL at the connection data source

   ![main page](/images/bi-tableau-en-1.png)

2. Fill in the Doris server address, port and other relevant information, and click sigin in button after correctly filling

   ![sign in page](/images/bi-tableau-en-2.png)

3. After entering Tableau, select the corresponding library table to carry out the relevant compass processing.

   ![usage page](/images/bi-tableau-en-3.png)  