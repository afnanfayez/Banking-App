import HeaderBox from "@/components/ui/ui/HeaderBox";
import TotalBalanceBox from "@/components/ui/ui/TotalBalanceBox";
import React from "react";

const Home = () => {
  const loggedIn = { firstName: 'John' }
  return (
    <section className="home">
      <div className="home-content">
        <header className="header flex flex-col gap-8">
          <HeaderBox
            type='greeting'
            title='Welcome'
            user={loggedIn?.firstName || 'Guest'}
            subtext='Access and mange your account and transactions efficiently'
          />

          <TotalBalanceBox
            accounts={[]}
            totalBanks={1}
            totalCurrentBalance={1250.35} />

        </header>

      </div>
    </section>
  )
};
export default Home;
