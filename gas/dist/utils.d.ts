import { ChainId, RequestEndpoint } from './types.js';
export declare function getRequestUrl({ chainId, endpoint, apiKey }: {
    chainId: ChainId;
    endpoint: RequestEndpoint;
    apiKey?: string;
}): {
    url: string;
    headers: {
        authorization?: string;
    };
};
