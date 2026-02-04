import HeaderBox from '@/components/ui/HeaderBox'
import BankCard from '@/components/ui/BankCard'
import { getAccounts } from '@/lib/actions/bank.actions'
import { getLoggedInUser } from '@/lib/actions/user.actions'
import PlaidLink from '@/components/ui/PlaidLink'
import React from 'react'

const MyBanks = async () => {
    const loggedIn = await getLoggedInUser();
    const accounts = await getAccounts({
        userId: loggedIn.$id
    })

    return (
        <section className='flex'>
            <div className="my-banks">
                <header className='my-banks-header'>
                    <div className='flex flex-row justify-between'>
                        <HeaderBox
                            title="My Bank Accounts"
                            subtext="Effortlessly manage your banking activities."
                            user={loggedIn?.firstName}
                            type="title"
                        />

                        <PlaidLink user={loggedIn} variant="primary" />
                    </div>
                </header>

                <div className="space-y-4">
                    <h2 className="header-2">
                        Your cards
                    </h2>
                    <div className="flex flex-wrap gap-6">
                        {accounts && accounts.data.map((a: Account) => (
                            <BankCard
                                key={a.id}
                                account={a}
                                userName={loggedIn?.firstName}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default MyBanks