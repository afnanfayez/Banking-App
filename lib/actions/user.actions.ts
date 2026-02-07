"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../server/appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from "plaid";
import { plaidClient } from "../plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();

    const response = await account.createEmailPasswordSession(email, password);

    (await cookies()).set("appwrite-session", response.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });

    return parseStringify(response);
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

export const signUp = async (params: SignUpParams) => {
  const { password, ...userData } = params;
  const { email, firstName, lastName } = userData;
  let newUserAccount;
  try {
    const { account, database, user } = await createAdminClient();

    // Check if user already exists and clean up incomplete registrations
    try {
      const users = await user.list([`email="${email}"`]);
      if (users.users.length > 0) {
        const existingUserId = users.users[0].$id;
        console.log(
          `Found existing user with email: ${email}, ID: ${existingUserId}`,
        );

        // Check if they have a complete registration in database
        const existingUserDoc = await database.listDocuments(
          DATABASE_ID!,
          USER_COLLECTION_ID!,
          [`userId="${existingUserId}"`],
        );

        if (existingUserDoc.documents.length > 0) {
          // Complete registration exists
          console.log("Complete registration found - user should sign in");
          throw new Error("Account already exists. Please sign in.");
        } else {
          // Incomplete registration - delete the orphaned Appwrite account
          console.log(
            `Found orphaned account without database entry. Deleting...`,
          );
          try {
            await user.delete(existingUserId);
            console.log(
              `Successfully deleted orphaned account: ${existingUserId}`,
            );
            // Wait a moment for the deletion to propagate
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (deleteErr: any) {
            console.error(`Failed to delete orphaned account:`, deleteErr);
            throw new Error(
              `Please contact support. Account exists but is incomplete. Error: ${deleteErr.message}`,
            );
          }
        }
      }
    } catch (err: any) {
      if (
        err.message === "Account already exists. Please sign in." ||
        err.message?.includes("Please contact support")
      ) {
        throw err;
      }
      // Continue with registration if check fails for other reasons
      console.log(
        "User existence check encountered an error, continuing:",
        err.message,
      );
    }

    console.log("Creating new Appwrite account...");
    newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`,
    );
    if (!newUserAccount) throw new Error("User creation failed");
    console.log(`Appwrite account created successfully: ${newUserAccount.$id}`);

    let dwollaCustomerUrl;
    try {
      console.log("Attempting to create Dwolla customer...");
      dwollaCustomerUrl = await createDwollaCustomer({
        ...userData,
        address1: userData.address,
        type: "personal",
      });

      console.log("Dwolla customer creation response:", dwollaCustomerUrl);

      // Check if we got a valid response
      if (!dwollaCustomerUrl) {
        throw new Error(
          "Dwolla API returned empty response. Please check your Dwolla credentials and try again.",
        );
      }
    } catch (dwollaError: any) {
      console.error("Dwolla error details:", dwollaError);

      // Delete the Appwrite user account if Dwolla fails
      try {
        await user.delete(newUserAccount.$id);
        console.log("Cleaned up Appwrite account after Dwolla failure");
      } catch (deleteError) {
        console.error("Failed to delete user account:", deleteError);
      }

      // Extract detailed error message from Dwolla
      let errorMessage = "Failed to create payment account. ";

      if (dwollaError?.body?._embedded?.errors) {
        const errors = dwollaError.body._embedded.errors;
        errorMessage += errors
          .map((e: any) => `${e.path}: ${e.message}`)
          .join(", ");
      } else if (dwollaError?.body?.message) {
        errorMessage += dwollaError.body.message;
      } else if (dwollaError?.message) {
        errorMessage += dwollaError.message;
      } else {
        errorMessage += "Please check your information and try again.";
      }

      throw new Error(errorMessage);
    }

    if (!dwollaCustomerUrl) {
      // Clean up the Appwrite account
      try {
        await user.delete(newUserAccount.$id);
      } catch (deleteError) {
        console.error("Failed to delete user account:", deleteError);
      }
      throw new Error("Dwolla customer creation failed");
    }

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        ...userData,
        userId: newUserAccount.$id,
        dwollaCustomerUrl,
        dwollaCustomerId,
      },
    );
    const session = await account.createEmailPasswordSession(email, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });
    return parseStringify({
      ...newUser,
      $id: newUserAccount.$id,
      name: `${firstName} ${lastName}`
    });
  } catch (error) {
    console.error("Sign up error:", error);

    const appwriteError = error as {
      code?: number;
      message?: string;
      type?: string;
    };

    if (
      appwriteError?.code === 409 ||
      appwriteError?.message?.toLowerCase().includes("already exists")
    ) {
      throw new Error("Account already exists. Please sign in.");
    }

    throw error;
  }
};

export async function getLoggedInUser() {
  try {
    const sessionClient = await createSessionClient();

    if (!sessionClient) {
      return null;
    }

    const { account, database } = sessionClient;
    const authUser = await account.get();

    // Fetch the complete user info from the database
    const userDocs = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal("userId", authUser.$id)]
    );

    if (userDocs.documents.length === 0) {
      console.error("No user document found for authenticated user");
      return null;
    }

    // Merge the auth user data with database user data
    const userData = {
      ...userDocs.documents[0],
      $id: authUser.$id,
      email: authUser.email,
      name: authUser.name,
    };

    return parseStringify(userData);
  } catch (error) {
    console.error("Error fetching logged in user:", error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const sessionClient = await createSessionClient();

    (await cookies()).delete("appwrite-session");

    if (sessionClient) {
      const { account } = sessionClient;
      await account.deleteSession("current");
    }

    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    return true;
  }
};

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
      client_name: user.name,
      products: ["auth", "transactions"] as Products[],
      language: "en",
      country_codes: ["US"] as CountryCode[],
    };
    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.error("Error creating link token:", error);
    throw error;
  }
};
export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();
    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      },
    );
    return parseStringify(bankAccount);
  } catch (error) {
    console.error("Error creating bank account in Appwrite:", error);
  }
};

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;


    for (const accountData of accounts) {

      const request: ProcessorTokenCreateRequest = {
        access_token: accessToken,
        account_id: accountData.account_id,
        processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
      };

      const processorTokenResponse = await plaidClient.processorTokenCreate(request);
      const processorToken = processorTokenResponse.data.processor_token;

      const fundingSourceUrl = await addFundingSource({
        dwollaCustomerId: user.dwollaCustomerId,
        processorToken,
        bankName: accountData.name,
      });

      if (!fundingSourceUrl) {
        continue;
      }

      await createBankAccount({
        userId: user.$id,
        bankId: itemId,
        accountId: accountData.account_id,
        accessToken,
        fundingSourceUrl,
        shareableId: encryptId(accountData.account_id),
      });
    }

    revalidatePath("/");

    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error: any) {
    console.error("An error occurred while exchanging public token and creating bank:", error);
    return parseStringify({ error: error?.message || "Internal Server Error" });
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();

    let banks;
    let retries = 3;
    while (retries > 0) {
      try {
        banks = await database.listDocuments(
          DATABASE_ID!,
          BANK_COLLECTION_ID!,
          [Query.equal("userId", userId)],
        );
        break;
      } catch (error: any) {
        console.error(`Error fetching banks(retry ${4 - retries}): `, error.message);
        retries--;
        if (retries === 0) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!banks) return null;

    return parseStringify(banks.documents);
  } catch (error) {
    console.error("Error fetching banks:", error);
    return null;
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    if (!documentId) {
      console.error("Error fetching bank: documentId is required");
      return null;
    }

    const { database } = await createAdminClient();

    let bank;
    let retries = 3;
    while (retries > 0) {
      try {
        bank = await database.getDocument(
          DATABASE_ID!,
          BANK_COLLECTION_ID!,
          documentId,
        );
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (!bank) return null;

    return parseStringify(bank);
  } catch (error: any) {
    console.error("Critical error in getBank:", {
      message: error.message,
      cause: error.cause,
      stack: error.stack
    });
    return null;
  }
};

export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('accountId', [accountId])]
    )

    if (bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error)
  }
}