import type { SelectAccountOptions, Account } from './types.js';
declare const accountSelect: (options: SelectAccountOptions) => Promise<Account[]>;
export default accountSelect;
