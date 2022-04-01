import { ethers } from 'ethers';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import contractAbi from '../lib/contractABI.json';
import { networks } from '../lib/networks';

const tld = '.bunny';
const CONTRACT_ADDRESS = '0x3105DA132E1D844A50253d31d60E24608c9aED61'


export default function Domains() {
  const [currentAccount, setCurrentAccount] = useState('');
  const [network, setNetwork] = useState('');
  const [domain, setDomain] = useState('');
  const [record, setRecord] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mints, setMints] = useState([]);


  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

        const names = await contract.getAllNames();

        const mintRecords = await Promise.all(names.map(async (name) => {
          const mintRecord = await contract.records(name);
          const owner = await contract.domains(name);
          return {
            id: names.indexOf(name),
            name: name,
            record: mintRecord,
            owner: owner
          }
        }))

        console.log("Mints Fetched", mintRecords);
        setMints(mintRecords);
      }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (network == 'Polygon Mumbai Testnet') {
      fetchMints();
    }
  }, [currentAccount, network])

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className='h-screen flex items-center justify-center'>
          <div className='grid grid-cols-12 max-w-5xl gap-4'>
            {mints.map((mint, index) => {
              return (
                <div className="grid col-span-4 relative" key={index}>
                    <a className="group shadow-lg hover:shadow-2xl duration-200 delay-75 w-full bg-white rounded-sm py-6 pr-6 pl-9" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noreferrer">
                      <p className="text-2xl font-bold group-hover:text-grey-700">{' '}{mint.name}{tld}{' '}</p>
                      <p className='text-sm font-semibold text-white-500 group-hover:text-white-700 mt-2 leading-6'>
                      {mint.record}
                      </p>
                      {/* If mint.owner is currentAccount, add an "edit" button*/}
                      <div className="bg-blue-400 group-hover:bg-blue-600 h-full w-4 absolute top-0 left-0"> </div>
                    </a>
                    { mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
                      <button className="edit-button" onClick={() => editRecord(mint.name)}>
                        <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
                      </button>
                      :
                      null
                    }
                </div>
              )
            })}
          </div>
        </div>
      )
    }
  }

  const editRecord = (name) => {
    console.log("Editing record for: ", name)
    setEditing(true);
    setDomain(name);
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMAsk -> https://metamask.io/');
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log("Connected", accounts[0])
      setCurrentAccount(accounts[0])
    } catch (err) {
      console.log(err);
    }
  }
  
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have MetaMask!');
      return;
    } else {
      console.log('we have the ethereum object', ethereum)
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log(accounts)
      console.log('Found Authorized Account: ', account);
      setCurrentAccount(account);

    } else {
      console.log('No Authorized accocunt found')
    }

    const chainId = await ethereum.request({ method: 'eth_chainId' })
    setNetwork(networks[chainId])

    ethereum.on('chainChanged', handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  }

  const renderNotConnectedContainer = () => (
    <div className="connect-wallet-container">
      <button className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button" >
        <a className='btn btn-info' onClick={connectWallet} >
          Connect wallet
        </a>
      </button>
    </div>
    );
  
  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }],
        });
      } catch (err) {
        if (err.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x13881',
                  chainName: 'Polygon Mumbain Testnet',
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                  nativeCurrency: {
                    name: 'Mumbai Matic',
                    symbol: "MATIC",
                    decimals: 18
                  },
                  blockExplorerUrls: ['https://mumbai.polygonscan.com/']
                },
              ],
            });
          } catch (err) {
            console.log(err)
          }
        }
        console.log(err)
      }
    } else {
      alert('Metamask is not installed. Please install it to use this app https://metamask.io/download.html')
    }
  }

  const renderInputForm = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div className='connect-wallet-container'>
          <p>Please connect to the Polygon Mumbai Testnet</p>
          <button className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button" >
            <a className='btn btn-info' onClick={switchNetwork} >
              Switch Network
            </a>
          </button>
        </div>
      )
    }
    return (
      <form className="w-full max-w-sm">
        <div className="md:flex md:items-center mb-6">
          <div className="md:w-1/3">
            <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="inline-full-name">
              domain
            </label>
          </div>
          <div className="md:w-2/3">
            <input 
              className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
              id="inline-domain"
              type="text"
              placeholder="purple"
              onChange={e => setDomain(e.target.value)}
            />
          </div>
        </div>
        <div className="md:flex md:items-center mb-6">
          <div className="md:w-1/3">
            <label className="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" htmlFor="inline-password">
              Bunny Info
            </label>
          </div>
          <div className="md:w-2/3">
            <input 
              className="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" 
              id="inline-info"
              type="text"
              placeholder="Bunny Power"
              onChange={e => setRecord(e.target.value)}
            />
          </div>
        </div>
        { editing ? (
          <div className="md:flex md:items-center">
          <div className="md:w-1/3"></div>
          <div className="md:w-2/3">
            <button className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button" >
              <a className='btn btn-info' disabled={loading} onClick={updateDomain} >
                Set Record
              </a>
            </button>
            <button className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button" >
              <a className='btn btn-info' onClick={() => {setEditing(false)}} >
                Cancel
              </a>
            </button>
          </div>
        </div>
        ) : (
          <div className="md:flex md:items-center">
          <div className="md:w-1/3"></div>
          <div className="md:w-2/3">
            <button className="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button" >
              <a className='btn btn-info' onClick={mintDomain} >
                Mint
              </a>
            </button>
          </div>
        </div>
        )}
        
      </form>
		);
  }

  function ethLogo() {
    return <Image src="/ethlogo.png" alt="me" width="64" height="64" />
  }

  function polyLogo() {
    return <Image src="/polygonlogo.png" alt="me" width="64" height="64" />
  }

  const mintDomain = async () => {
    // Don't run if the domain is empty
    if (!domain) { return }
    // Alert the user if the domain is too short
    if (domain.length < 3) {
      alert('Domain must be at least 3 characters long');
      return;
    }
    // Calculate price based on length of domain (change this to match your contract)	
    // 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
    const price = domain.length === 3 ? '0.05' : domain.length === 4 ? '0.1' : '0.3';
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
  
        console.log("Going to pop wallet now to pay gas...")
        let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
        // Wait for the transaction to be mined
        const receipt = await tx.wait();
  
        // Check if the transaction was successfully completed
        if (receipt.status === 1) {
          console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
          
          // Set the record for the domain
          tx = await contract.setRecord(domain, record);
          await tx.wait();
  
          console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);

          setTimeout(() => {
            fetchMints();
          }, 2000);
          
          setRecord('');
          setDomain('');
        }
        else {
          alert("Transaction failed! Please try again");
        }
      }
    }
    catch(error){
      console.log(error);
    }
  }

  const updateDomain = async () => {
    if (!record || !domain) { return }
    setLoading(true);

    console.log("Updating Domain", domain, "with record", record);

    try {
      const {ethereum} = window;
      if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.signer;
          const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

          let tx = await contract.setRecord(domain, record);
          await tx.wait();
          console.log('Record set https://mumbai.polygonscan.com/tx/'+tx.hash)

          fetchMints();
          setRecord('');
          setDomain('');
        }
      } catch (err) {
        console.log(err)
    }
    setLoading(false);
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])
  // Constants
  
  return (
    <div className="mx-auto max-w-md">
      <div>
        { network.includes("Polygon") ? polyLogo() : ethLogo()}
        { currentAccount ? <p>Wallet: {currentAccount.slice(0,6)}...{currentAccount.slice(-4)}</p> : <p>Not Connected</p> }
        </div>
      <div className='flex items-center justify-center min-h-screen '>
        <div>
          <div className="bg-slate-700 shadow-md  rounded rounded-xl m-16 border border-indigo-500/50 shadow-xl shadow-indigo-500/50">
            <div className="flex flex-col p-10  px-16 space-y-6 items-center text-center">
              <h1 className="font-light md:text-6xl text-5xl text-white tracking-wide ">Bunny Name Service</h1>
              <p className="text-gray-400 md:text-2xl text-xl px-18"> Stake your claim on the blockchain!</p>
              {!currentAccount && renderNotConnectedContainer()}
              {currentAccount && renderInputForm()}
              
              </div>
          </div>
        </div>
      </div>
      {mints && renderMints()}
  </div>
	);
}

