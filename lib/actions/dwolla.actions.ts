"use server";

import { Client } from "dwolla-v2";

const getEnvironment = (): "production" | "sandbox" => {
  const environment = process.env.DWOLLA_ENV as string;

  switch (environment) {
    case "sandbox":
      return "sandbox";
    case "production":
      return "production";
    default:
      throw new Error(
        "Dwolla environment should either be set to `sandbox` or `production`",
      );
  }
};

const dwollaClient = new Client({
  environment: getEnvironment(),
  key: process.env.DWOLLA_KEY as string,
  secret: process.env.DWOLLA_SECRET as string,
});

// Create a Dwolla Funding Source using a Plaid Processor Token
export const createFundingSource = async (
  options: CreateFundingSourceOptions,
) => {
  try {
    return await dwollaClient
      .post(`customers/${options.customerId}/funding-sources`, {
        name: options.fundingSourceName,
        plaidToken: options.plaidToken,
      })
      .then((res) => res.headers.get("location"));
  } catch (err) {
    console.error("Creating a Funding Source Failed: ", err);
  }
};

export const createOnDemandAuthorization = async () => {
  try {
    const onDemandAuthorization = await dwollaClient.post(
      "on-demand-authorizations",
    );
    const authLink = onDemandAuthorization.body._links;
    return authLink;
  } catch (err) {
    console.error("Creating an On Demand Authorization Failed: ", err);
  }
};

export const createDwollaCustomer = async (
  newCustomer: NewDwollaCustomerParams,
) => {
  try {
    console.log("Creating Dwolla customer with data:", {
      ...newCustomer,
      ssn: newCustomer.ssn ? "***" + newCustomer.ssn.slice(-4) : "missing",
    });

    const response = await dwollaClient.post("customers", newCustomer);
    const location = response.headers.get("location");

    console.log("Dwolla API response status:", response.status);
    console.log("Dwolla customer location:", location);

    if (!location) {
      console.error("Dwolla API did not return a location header");
      console.error("Full response:", response);
      throw new Error(
        "Dwolla API did not return customer URL. Please check your Dwolla credentials.",
      );
    }

    return location;
  } catch (err: any) {
    console.error("Creating a Dwolla Customer Failed");
    console.error("Error details:", {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      body: err.body,
    });

    // Log validation errors if they exist
    if (err.body && err.body._embedded && err.body._embedded.errors) {
      console.error("Dwolla validation errors:", err.body._embedded.errors);
    }

    throw err;
  }
};

export const createTransfer = async ({
  sourceFundingSourceUrl,
  destinationFundingSourceUrl,
  amount,
}: TransferParams) => {
  try {

    const requestBody = {
      _links: {
        source: {
          href: sourceFundingSourceUrl,
        },
        destination: {
          href: destinationFundingSourceUrl,
        },
      },
      amount: {
        currency: "USD",
        value: amount,
      },
    };
    const response = await dwollaClient.post("transfers", requestBody);
    const location = response.headers.get("location");
    return location;
  } catch (err: any) {
  }
};

export const addFundingSource = async ({
  dwollaCustomerId,
  processorToken,
  bankName,
}: AddFundingSourceParams) => {
  try {
    // create dwolla auth link
    const dwollaAuthLinks = await createOnDemandAuthorization();

    // add funding source to the dwolla customer & get the funding source url
    const fundingSourceOptions = {
      customerId: dwollaCustomerId,
      fundingSourceName: bankName,
      plaidToken: processorToken,
      _links: dwollaAuthLinks,
    };
    const url = await createFundingSource(fundingSourceOptions);
    return url;
  } catch (err: any) {
  }
};
