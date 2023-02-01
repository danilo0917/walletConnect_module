export declare type RequestEndpoint = 'blockPrices';
export declare type RequestOptions = {
    chains: ChainId[];
    endpoint: RequestEndpoint;
    apiKey?: string;
};
export declare type StreamOptions = RequestOptions & {
    poll?: number;
};
export declare type ChainId = string;
export declare type GasPrice = {
    confidence: number;
    price: number | null;
    maxFeePerGas: number | null;
    maxPriorityFeePerGas: number | null;
};
export declare type BlockPrices = {
    blockNumber: number;
    estimatedTransactionCount: number;
    baseFeePerGas: number;
    estimatedPrices: GasPrice[];
};
export declare type EstimatedBaseFee = {
    confidence: number;
    baseFee: number;
};
export declare type EstimatedBaseFees = [
    {
        ['pending+1']: [EstimatedBaseFee];
    },
    {
        ['pending+2']: [EstimatedBaseFee];
    },
    {
        ['pending+3']: [EstimatedBaseFee];
    },
    {
        ['pending+4']: [EstimatedBaseFee];
    },
    {
        ['pending+5']: [EstimatedBaseFee];
    }
];
export declare type BlockPricesResponse = {
    system: string;
    network: string;
    unit: string;
    maxPrice: number;
    currentBlockNumber: number;
    msSinceLastBlock: number;
    blockPrices: BlockPrices[];
    estimatedBaseFees?: EstimatedBaseFees;
};
export declare type GasPlatformResponse = BlockPricesResponse;
