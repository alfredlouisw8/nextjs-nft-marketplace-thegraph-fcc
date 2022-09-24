import axios from "axios"
import { useEffect, useState } from "react"
import { useMoralis, useWeb3Contract } from "react-moralis"
import NFTBox from "../components/NFTBox"
import networkMapping from "../constants/networkMapping.json"
import nftAbi from "../constants/BasicNft.json"
import { Button } from "web3uikit"

export default function MyNft() {
    const { chainId, account, isWeb3Enabled } = useMoralis()
    const chainString = chainId ? parseInt(chainId).toString() : "31337"
    const marketplaceAddress = networkMapping[chainString].NftMarketplace
    const basicNftAddress = networkMapping[chainString].BasicNft
    const [ownedNfts, setOwnedNfts] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    const { runContractFunction } = useWeb3Contract()

    async function getOwnedNft(nftAddress) {
        const ownedNft = []
        console.log("Fetching your nfts...")

        const balanceOfOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "balanceOf",
            params: {
                owner: account,
            },
        }

        const basicNftBalance = await runContractFunction({
            params: balanceOfOptions,
        })

        for (let i = 0; i < basicNftBalance; i++) {
            const tokenOfOwnerByIndexOptions = {
                abi: nftAbi,
                contractAddress: nftAddress,
                functionName: "tokenOfOwnerByIndex",
                params: {
                    owner: account,
                    index: i,
                },
            }

            const nftTokenId = await runContractFunction({
                params: tokenOfOwnerByIndexOptions,
            })

            ownedNft.push({
                price: null,
                nftAddress: nftAddress,
                tokenId: nftTokenId.toString(),
                seller: account,
            })
        }
        return ownedNft
    }

    async function getOwnedBothNfts() {
        setIsLoading(true)
        const ownedBasicNft = await getOwnedNft(basicNftAddress)

        setOwnedNfts([...ownedBasicNft])
        setIsLoading(false)
    }

    useEffect(() => {
        if (account) {
            getOwnedBothNfts()
        }
    }, [account, isWeb3Enabled])

    return (
        <div className="container mx-auto">
            <div className="flex justify-between">
                <h1 className="py-4 px-4 font-bold text-2xl">My NFT</h1>
                <Button
                    onClick={() => {
                        runContractFunction({
                            params: {
                                abi: nftAbi,
                                contractAddress: basicNftAddress,
                                functionName: "mintNft",
                                params: {},
                            },
                            onError: (error) => console.log(error),
                        })
                    }}
                    text="Mint NFT"
                    type="button"
                />
            </div>
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    isLoading || !ownedNfts ? (
                        <div>Loading...</div>
                    ) : (
                        ownedNfts.map((nft) => {
                            //console.log(nft)
                            const { price, nftAddress, tokenId, seller } = nft
                            return (
                                <NFTBox
                                    price={price}
                                    nftAddress={nftAddress}
                                    tokenId={tokenId}
                                    marketplaceAddress={marketplaceAddress}
                                    seller={seller}
                                    key={`${nftAddress}${tokenId}`}
                                />
                            )
                        })
                    )
                ) : (
                    <div>Web3 Currently Not Enabled</div>
                )}
            </div>
        </div>
    )
}
