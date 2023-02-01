import { ProviderLabel } from './types.js';
export class ProviderRpcError extends Error {
    constructor(error) {
        super(error.message);
        this.message = error.message;
        this.code = error.code;
        this.data = error.data;
    }
}
export const remove = ({ detected, metamask }) => ({ label }) => !((label === ProviderLabel.Detected && detected) ||
    (label === ProviderLabel.MetaMask && metamask));
