'use client';

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "./button";
import {
    PlaidLinkOnSuccess,
    PlaidLinkOptions,
    usePlaidLink,
} from "react-plaid-link";
import { useRouter } from "next/navigation";
import {
    createLinkToken,
    exchangePublicToken,
} from "@/lib/actions/user.actions";
import Image from "next/image";


const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
    const router = useRouter();

    const [token, setToken] = useState('');

    useEffect(() => {
        const getLinkToken = async () => {
            try {
                const data = await createLinkToken(user);
                setToken(data?.linkToken);
            } catch (error: any) {
                console.error("PLAID_DEBUG: Error getting link token:", error);
                alert(`Plaid Link Error: ${error?.message || "Unknown error"}`);
            }
        }

        getLinkToken();
    }, [user]);

    const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
        const data = await exchangePublicToken({
            publicToken: public_token,
            user,
        })

        if (data?.error) {
            console.error("Failed to connect bank:", data.error);
            alert(data.error);
            return;
        }

        window.location.href = "/";
    }, [user])

    const config: PlaidLinkOptions = {
        token,
        onSuccess
    }

    const { open, ready } = usePlaidLink(config);

    return (
        <>
            {variant === 'primary' ? (
                <Button
                    onClick={() => open()}
                    disabled={!ready}
                    className="plaidlink-primary"
                >
                    Connect bank
                </Button>
            ) : variant === 'ghost' ? (
                <Button onClick={() => open()} variant="ghost" className="plaidlink-ghost">
                    <Image
                        src="/icons/connect-bank.svg"
                        alt="connect bank"
                        width={24}
                        height={24}
                    />
                    <p className='hidden text-[16px] font-semibold text-black-2 xl:block'>Connect bank</p>
                </Button>
            ) : (
                <Button onClick={() => open()} disabled={!ready} variant="ghost" className="plaidlink-default">
                    <Image
                        src="/icons/connect-bank.svg"
                        alt="connect bank"
                        width={24}
                        height={24}
                    />
                    <p className='text-[16px] font-semibold text-black-2'>Connect bank</p>
                </Button>
            )}
        </>
    )
}

export default PlaidLink;
