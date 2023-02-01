export declare type LoginOptions = {
    walletName: string;
    brandingHTMLString: string;
    emailLoginFunction: EmailLoginFunction;
};
export declare type MagicInitOptions = {
    apiKey: string;
    userEmail?: string;
};
export declare type EmailLoginFunction = (emailAddress: string) => Promise<boolean>;
