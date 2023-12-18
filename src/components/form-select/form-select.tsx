import { Cascader, Select } from 'antd';
import React, { ReactNode } from 'react';
import { ArrowDownIcon } from '../Icons/arrow-down-icon';
import { Option } from '@site/src/constant/download.data';
import './form-select.scss';

export interface FormSelectProps {
    value?: string | string[];
    onChange?: (value: string | string[]) => void;
    placeholder: string;
    label: string;
    options: Option[];
    isCascader?: boolean;
    displayRender?: (label, selectedOptions) => ReactNode;
}

export default function FormSelect({
    value = '',
    onChange,
    label,
    placeholder,
    options,
    isCascader = false,
    displayRender = label => {
        return label.length > 0 ? label[0] : '';
    },
}: FormSelectProps) {
    return (
        <div className="group relative z-0 w-full form-select">
            {isCascader ? (
                <Cascader
                    displayRender={displayRender}
                    suffixIcon={<ArrowDownIcon />}
                    allowClear={false}
                    value={value as string[]}
                    onChange={e => {
                        return onChange && onChange(e as string[]);
                    }}
                    options={options}
                    className={`peer block h-[3.5rem] w-full appearance-none rounded-lg  bg-transparent text-sm text-[#1D1D1D] focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500`}
                    popupClassName="form-cascader"
                />
            ) : (
                <Select
                    suffixIcon={<ArrowDownIcon />}
                    popupClassName="form-select-select"
                    value={value}
                    onChange={e => onChange && onChange(e || '')}
                    className={`peer block h-[3.5rem] w-full appearance-none rounded-lg  bg-transparent text-sm text-[#1D1D1D] focus:border-blue-600 focus:outline-none focus:ring-0 dark:border-gray-600 dark:text-white dark:focus:border-blue-500`}
                    options={options}
                />
            )}
            <label
                htmlFor={label}
                className="absolute left-2 top-4 z-10 origin-[0] -translate-y-7 scale-75 transform bg-[#fff]  px-1 text-sm text-[#8592A6] duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100  peer-hover:text-blue peer-focus:-translate-y-7 peer-focus:scale-75 peer-focus:font-medium peer-focus:text-blue-600 peer-[.ant-input-status-error]:text-[#ff4d4f] peer-[.ant-select-open]:text-blue-500  dark:text-gray-400"
            >
                {placeholder}
            </label>
        </div>
    );
}
