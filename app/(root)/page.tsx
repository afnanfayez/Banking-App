import RightSidebar from "@/components/ui/RightSidebar";
import HeaderBox from "@/components/ui/HeaderBox";
import TotalBalanceBox from "@/components/ui/TotalBalanceBox";
import { getLoggedInUser } from "@/lib/actions/user.actions";


const Home = async () => {
  const loggedIn =await getLoggedInUser()
  return (
    <section className="home">
      <div className="home-content">
        <header className="header flex flex-col gap-8">
          <HeaderBox
            type='greeting'
            title='Welcome'
            user={loggedIn?.name|| 'Guest'}
            subtext='Access and mange your account and transactions efficiently'
          />

          <TotalBalanceBox
            accounts={[]}
            totalBanks={1}
            totalCurrentBalance={1250.35} />

        </header>

        RECENT TRANSACTIONS

      </div>
      <RightSidebar
        user={loggedIn}
        transactions={[]}
        banks={[]}
      />
    </section>
  )
};
export default Home;
