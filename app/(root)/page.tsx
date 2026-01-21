import RightSidebar from "@/components/RightSidebar";
import HeaderBox from "@/components/ui/ui/HeaderBox";
import TotalBalanceBox from "@/components/ui/ui/TotalBalanceBox";


const Home = () => {
  const loggedIn = {
    $id: '1',
    firstName: 'Afnan',
    lastName: 'Zeiti',
    email: 'afnanzeiti@gmail.com',
    userId: '1',
    dwollaCustomerUrl: '',
    dwollaCustomerId: '',
    address1: '',
    city: '',
    state: '',
    postalCode: '',
    dateOfBirth: '',
    ssn: ''
  }

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

        RECENT TRANSACTIONS

      </div>
      <RightSidebar
        user={loggedIn}
        transactions={[]}
        banks={[
          {
            $id: '1',
            accountId: '1',
            bankId: '1',
            accessToken: '',
            fundingSourceUrl: '',
            userId: '1',
            sharableId: '',
            id: '1',
            availableBalance: 123.50,
            currentBalance: 123.50,
            officialName: 'Main Account',
            mask: '1234',
            institutionId: '',
            name: 'Plaid Gold Standard',
            type: 'depository',
            subtype: 'checking',
            appwriteItemId: '1'
          },
          {
            $id: '2',
            accountId: '2',
            bankId: '2',
            accessToken: '',
            fundingSourceUrl: '',
            userId: '1',
            sharableId: '',
            id: '2',
            availableBalance: 500.50,
            currentBalance: 500.50,
            officialName: 'Savings Account',
            mask: '5678',
            institutionId: '',
            name: 'Plaid Silver Standard',
            type: 'depository',
            subtype: 'savings',
            appwriteItemId: '2'
          }
        ]}
      />
    </section>
  )
};
export default Home;
