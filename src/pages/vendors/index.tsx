import Layout from '../../theme/Layout';
import { VelodbLogo } from '../../components/Icons/velodb-logo';
import Link from '@docusaurus/Link';

export default function Vendors() {
    return (
        <Layout
            title="Vendors - Apache Doris"
            description="This page contains some of the vendors who support Apache Doris in their products."
        >
            <section className="bg-[#F7F9FE] px-4 lg:px-0 py-[6rem]">
                <div className="max-w-[1180px] mx-auto text-center">
                    <div className="text-[#1D1D1D] text-[2.75rem]/[2.5rem] mb-4 font-semibold tracking-[0.88px]">
                        Vendors
                    </div>
                    <p className="text-[#000] text-[1.25rem]/[2rem]">
                        This page contains some of the vendors who are supporting Apache Doris in their products
                    </p>
                </div>
            </section>
            <section className="max-w-[960px] px-4 lg:px-0 mx-auto my-8 lg:my-[5.5rem]">
                <div className="lg:flex gap-x-[5rem] py-[2.5rem]">
                    <VelodbLogo className="shrink-0" />
                    <div className="text-[1rem]/[180%] text-[#1D1D1D]">
                        <p className="mb-4">
                            <Link className="underline text-[#444FD9] font-medium" to="https://www.velodb.io">
                                VeloDB
                            </Link>{' '}
                            is a leading managed service for Apache Doris, offering fast, cost-effective,
                            enterprise-grade capabilities for real-time analytics use cases in today's AI-driven world.
                            It provides both cloud service and on-premise deployment.{' '}
                            <Link className="underline text-[#444FD9] font-medium" to="https://www.velodb.io/cloud">
                                VeloDB Cloud
                            </Link>{' '}
                            is a fully managed, cloud-native service available on AWS, Azure, GCP, along with SaaS and
                            BYOC models.{' '}
                            <Link
                                className="underline text-[#444FD9] font-medium"
                                to="https://www.velodb.io/enterprise"
                            >
                                VeloDB Enterprise
                            </Link>{' '}
                            is self-managed software ideal for on-premises, VM, or Kubernetes setups. It includes a
                            dependable Enterprise Core based on Apache Doris and an all-in-one database cluster
                            management tool, the Enterprise Manager. Learn more about how to leverage Apache Doris
                            capabilities{' '}
                            <Link
                                className="underline text-[#444FD9] font-medium"
                                to="https://www.velodb.io/get-started"
                            >
                                here
                            </Link>
                            .
                        </p>
                        <p>
                            Founded by Apache Doris' core members, VeloDB is dedicated to community growth through
                            technical contributions and support, and stands out as a leading contributor in code commits
                            and community development.
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
