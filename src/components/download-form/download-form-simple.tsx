import React from 'react';
import { Form } from 'antd';
import { Option } from '@site/src/constant/download.data';
import FormSelect from '../form-select/form-select';
import { useForm } from 'antd/es/form/Form';

interface DownloadFormSimpleProps {
    versions: Option[];
}
export default function DownloadFormSimple(props: DownloadFormSimpleProps) {
    const { versions } = props;
    const [form] = useForm();

    const getVersionLinkByKeys = (version: string) => {
        const node = versions.find(({ value }) => value === version);
        return node?.source || null;
    };

    return (
        <div className="rounded-lg border border-b-[0.375rem] border-[#0065FD] px-8 pt-[3.125rem] pb-[2.1875rem]">
            <div className="mb-8 text-xl font-medium">Downloads</div>
            <Form
                form={form}
                onFinish={val => {
                    window.open(getVersionLinkByKeys(val.version), '_blank');
                    return;
                }}
                initialValues={{
                    version: versions[0].value,
                }}
            >
                <Form.Item name="version" rules={[{ required: true }]}>
                    <FormSelect
                        placeholder="Version"
                        label="version"
                        isCascader={false}
                        // displayRender={label => {
                        //     return label.length > 0 ? label[label.length - 1] : '';
                        // }}
                        options={versions}
                    />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }} colon={false}>
                    <button type="submit" className="button-primary w-full text-lg">
                        Download
                    </button>
                </Form.Item>
            </Form>
        </div>
    );
}
