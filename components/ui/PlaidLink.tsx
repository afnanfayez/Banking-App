import { useCallback, useEffect, useState } from "react";
import { Button } from "./button";
import { StyledString } from "next/dist/build/swc/types";
import { useRouter } from "next/navigation";
import { PlaidLinkOnSuccess, usePlaidLink } from 'react-plaid-link'
import { createLinkToken } from "@/lib/actions/user.actions";

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
    const router = useRouter();
    const [token, setToken] = useState('')
    useEffect(() => {
        const getLinkToken = async () => {
            if (!user) return;
            const data = await createLinkToken(user);

            setToken(data?.linkToken);
        }
        getLinkToken();
    }, [user])
    const onSuccess = useCallback<PlaidLinkOnSuccess>(async (puplic_token: string) => {
        // await exchangePublicToken({public_token:puplic_token,user})

        router.push('/')

    }, [user])
    const config: PlaidLinkOptions = {
        token,
        onSuccess
    }

    const { open, ready } = usePlaidLink(config)
    return (
        <>
            {variant === 'primary' ? (
                <Button
                    onClick={() => open()}
                    disabled={!ready}
                    className="plalink-primary">
                    Connect bank
                </Button>
            ) : variant === 'ghost' ? (
                <Button>
                    Connect bank
                </Button>
            ) : (
                <Button>
                    Connect bank
                </Button>
            )}
        </>
    );
}
export default PlaidLink;