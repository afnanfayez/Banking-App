import { useCallback, useEffect, useState } from "react";
import { Button } from "./button";
import { StyledString } from "next/dist/build/swc/types";
import { useRouter } from "next/router";
import {PlaidLinkOnSuccess} from 'react-plaid-link'

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
    const router =useRouter();
   const [token ,setToken]= useState('')
   useEffect(()=>{
   const getLinkToken = async () =>{
    // const data = await createLinkToken(user);

    // setToken(data?.linkToken);
   }
   getLinkToken();
   },[])
    const onSuccess =useCallback<PlaidLinkOnSuccess>(async (puplic_token:string) =>{
        // await exchangePublicToken({public_token:puplic_token,user})

        router.push('/')

    },{user})
const config:PlaidLinkOptions ={
    token,
    onSuccess
}
    return (
        <>
            {variant === 'primary' ? (
                <Button 

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