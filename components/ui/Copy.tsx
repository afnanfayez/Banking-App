"use client";
import { useState } from "react";

import { Button } from "./button";

const Copy = ({ title }: { title: string }) => {
    const [hasCopied, setHasCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(title);
        setHasCopied(true);

        setTimeout(() => {
            setHasCopied(false);
        }, 2000);
    };

    return (
        <Button
            data-state="closed"
            className="mt-3 flex max-w-[320px] gap-4"
            variant="secondary"
            onClick={copyToClipboard}
        >
            <p className="line-clamp-1 w-full max-w-full text-xs font-medium text-black-2">
                {title}
            </p>

            {!hasCopied ? (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                >
                    <path
                        d="M9 15C9 12.1716 9 10.7574 9.87868 9.87868C10.7574 9 12.1716 9 15 9L16 9C18.8284 9 20.2426 9 21.1213 9.87868C22 10.7574 22 12.1716 22 15V16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H15C12.1716 22 10.7574 22 9.87868 21.1213C9 20.2426 9 18.8284 9 16V15Z"
                        stroke="#2F80ED"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M15 9V8C15 5.17157 15 3.75736 14.1213 2.87868C13.2426 2 11.8284 2 9 2H8C5.17157 2 3.75736 2 2.87868 2.87868C2 3.75736 2 5.17157 2 8V9C2 11.8284 2 13.2426 2.87868 14.1213C3.75736 15 5.17157 15 8 15H9"
                        stroke="#2F80ED"
                        strokeWidth="1.5"
                    />
                </svg>
            ) : (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2"
                >
                    <path
                        d="M20 6L9 17L4 12"
                        stroke="#27AE60"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )}
        </Button>
    );
};

export default Copy;
