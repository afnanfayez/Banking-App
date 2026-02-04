"use server";

import { ID } from "node-appwrite";
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
    });

    return parseStringify(response);
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  }
};

export const signUp = async (userData: SignUpParams) => {
  const { email, password, firstName, lastName } = userData;
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
    });
    return parseStringify(newUser);
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
    const { account } = await createSessionClient();
    const user = await account.get();
    return parseStringify(user);
  } catch (error) {
    return null;
  }
}

export const loggoutAccount = async () => {
  try {
    const { account } = await createSessionClient();

    (await cookies()).delete("appwrite-session");
    await account.deleteSession("current");
    return true;
  } catch (error) {
    return null;
  }
};

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
      client_name: user.name,
      products: ["auth"] as Products[],
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
export const createBankingAccount = async ({
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
  } catch (error) {}
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

    const accountData = accountsResponse.data.accounts[0];
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse =
      await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });
    if (!fundingSourceUrl) throw Error;

    await createBankingAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });

    revalidatePath("/");

    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.log("An error occurred while creating exchange token :", error);
  }
};
