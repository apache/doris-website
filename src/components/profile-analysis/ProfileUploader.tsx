import React, { ChangeEvent, DragEvent, JSX, useRef, useState } from 'react';
import { MAX_RAW_BYTES, prepareProfileFile } from './profile-analysis.file';

interface ProfileUploaderProps {
    file: File | null;
    disabled: boolean;
    onFileChange: (file: File | null) => void;
}

export function validateProfileFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith('.txt')) {
        return 'Select a .txt file. Other file types are not supported.';
    }
    if (file.size > MAX_RAW_BYTES) {
        return 'The selected file is larger than 100 MiB. Please provide a merged Profile.';
    }
    return null;
}

export function formatProfileFileSize(sizeInBytes: number): string {
    if (sizeInBytes < 1024) {
        return `${sizeInBytes} B`;
    }
    if (sizeInBytes < 1024 * 1024) {
        return `${(sizeInBytes / 1024).toFixed(1)} KiB`;
    }
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export function ProfileUploader({ file, disabled, onFileChange }: ProfileUploaderProps): JSX.Element {
    const [validationError, setValidationError] = useState<string | null>(null);
    const filePreparationIdRef = useRef(0);

    const acceptFile = async (nextFile: File | null) => {
        const preparationId = ++filePreparationIdRef.current;
        if (!nextFile) {
            setValidationError(null);
            onFileChange(null);
            return;
        }

        const nextError = validateProfileFile(nextFile);
        if (nextError) {
            setValidationError(nextError);
            onFileChange(null);
            return;
        }

        setValidationError(null);
        onFileChange(null);
        try {
            const preparedFile = await prepareProfileFile(nextFile);
            if (filePreparationIdRef.current !== preparationId) return;
            onFileChange(preparedFile);
        } catch (reason) {
            if (filePreparationIdRef.current !== preparationId) return;
            setValidationError(
                reason instanceof Error
                    ? reason.message
                    : 'The Profile could not be prepared for upload.',
            );
            onFileChange(null);
        }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        void acceptFile(event.currentTarget.files?.item(0) ?? null);
        event.currentTarget.value = '';
    };

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        if (disabled) {
            return;
        }
        if (event.dataTransfer.files.length > 1) {
            setValidationError('Select only one Profile file at a time.');
            onFileChange(null);
            return;
        }
        void acceptFile(event.dataTransfer.files.item(0));
    };

    return (
        <section className="profile-analysis__uploader" aria-labelledby="profile-analysis-upload-title">
            <h2 id="profile-analysis-upload-title">Choose a Query Profile</h2>
            <p id="profile-analysis-file-help" className="profile-analysis__help">
                Choose one UTF-8 .txt file up to 100 MiB. Files over 10 MiB are reduced to their aggregated
                Profile sections before local visualization or AI upload.
            </p>

            <div className="profile-analysis__version-notice" role="note">
                Use a Profile produced by Apache Doris 4.1 or later. Profiles from earlier versions may fail to
                parse.
            </div>

            <label
                className={`profile-analysis__drop-zone${
                    disabled ? ' profile-analysis__drop-zone--disabled' : ''
                }`}
                onDragOver={event => event.preventDefault()}
                onDrop={handleDrop}
            >
                <span className="profile-analysis__drop-zone-title">Choose a file or drag it here</span>
                <span className="profile-analysis__drop-zone-note">Apache Doris Query Profile in .txt format</span>
                <input
                    className="profile-analysis__file-input"
                    type="file"
                    accept=".txt,text/plain"
                    aria-label="Choose an Apache Doris Query Profile file"
                    aria-describedby="profile-analysis-file-help"
                    disabled={disabled}
                    onChange={handleInputChange}
                />
            </label>

            {validationError && (
                <div className="profile-analysis__validation-error" role="alert">
                    {validationError}
                </div>
            )}

            {file && (
                <div className="profile-analysis__file" aria-live="polite">
                    <span className="profile-analysis__file-name" title={file.name}>
                        {file.name}
                    </span>
                    <span className="profile-analysis__file-size">{formatProfileFileSize(file.size)}</span>
                </div>
            )}
        </section>
    );
}
