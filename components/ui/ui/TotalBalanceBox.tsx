"use client";

import AnimatedCounter from "../ui/AnimatedCounter"; 
import DoughnutChart from "../ui/DoughnutChart";
const TotalBalanceBox = ({
    accounts = [],
    totalBanks,
    totalCurrentBalance
}: TotalBalanceBoxProps) => (
    <section className="total-balance">
        <div className="total-balance-chart">
<DoughnutChart accounts={accounts}/>
        </div>
        <div className="flex flex-col gap-6">
            <h2 className='header-2'>
                Bank Accounts {totalBanks}
            </h2>
            <div className='flex flex-col gap-2'>
                <p className="total-balance-label">Current Balance</p>
                <div className="total-balance-amount flex-center gap-2">
                    <AnimatedCounter amount={totalCurrentBalance} />
                </div>
            </div>
        </div>
    </section>
);
export default TotalBalanceBox;