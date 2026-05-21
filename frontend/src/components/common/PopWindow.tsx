import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useMemo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PopWindowProps = {
    open: boolean;
    title?: string;
    onClose?: () => void;
    children: ReactNode;
};

const ensurePortalRoot = () => {
    if (typeof document === 'undefined') {
        return null;
    }
    let root = document.getElementById('pop-window-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'pop-window-root';
        document.body.appendChild(root);
    }
    return root;
};

export default function PopWindow({ open, title, onClose, children }: PopWindowProps) {
    const root = useMemo(() => ensurePortalRoot(), []);

    if (!open || !root) {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.2)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    {title ? <div className="text-lg font-semibold text-slate-900">{title}</div> : <span />}
                    {onClose ? (
                        <Button
                            type="text"
                            size="small"
                            aria-label="关闭"
                            icon={<CloseOutlined />}
                            onClick={onClose}
                        />
                    ) : null}
                </div>
                {children}
            </div>
        </div>,
        root
    );
}
