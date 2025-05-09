import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/Constant";
export const TransactionContext = React.createContext();

const { ethereum } = window;

export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem("transactionCount")
  );
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    connectWallet();
  }, []);

  const createEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    return transactionContract;
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        console.log(" Connected account:", accounts[0]);
        setCurrentAccount(accounts[0]); // Also update your state
      } else {
        console.warn("No accounts found.");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const sendTransaction = async (election_id, candidate_id, user_id) => {
    try {
      if (ethereum) {
        const transactionsContract = createEthereumContract();

        const transactionHash = await transactionsContract.addToBlockchain(
          currentAccount,
          user_id,
          election_id,
          candidate_id
        );

        console.log(`Loading - ${transactionHash.hash}`);
        await transactionHash.wait();
        console.log(`Success - ${transactionHash.hash}`);

        const transactionsCount =
          await transactionsContract.getTransactionCount();

        console.log(transactionCount);

        return { valid: true, mess: "Transaction Successfull" };
      } else {
        console.log("No ethereum object");
        return { valid: false, mess: "No ethereum object" };
      }
    } catch (error) {
      if (error.code === "ACTION_REJECTED") {
        return { valid: false, mess: "User Rejected Transaction" };
      } else {
        return { valid: false, mess: "Internal Send Transaction Error" };
      }
    }
  };

  const getAllTransactions = async () => {
    try {
      if (ethereum) {
        const transactionsContract = createEthereumContract();
        console.log("Connected to smart contract");
        const availableTransactions =
          await transactionsContract.getAllTransaction();
        console.log(
          "Raw transactions fetched from contract:",
          availableTransactions
        );

        const structuredTransactions = availableTransactions.map(
          (transaction) => ({
            addressFrom: transaction.from,
            timestamp: new Date(
              transaction.timestamp.toNumber() * 1000
            ).toLocaleString(),
            election_id: transaction.election_id,
            candidate_id: transaction.candidate_id,
            user_id: transaction.user_id,
          })
        );
        console.log(
          "Transactions structured successfully:",
          structuredTransactions
        );
        setTransactions(structuredTransactions);
        console.log("set transactions");

        return structuredTransactions;
      } else {
        console.log("Ethereum is not present");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <TransactionContext.Provider
        value={{
          connectWallet,
          currentAccount,
          sendTransaction,
          getAllTransactions,
          transactions,
        }}
      >
        {children}
      </TransactionContext.Provider>
    </>
  );
};
