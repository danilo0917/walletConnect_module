import { firstValueFrom, zip } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import { getRequestUrl } from './utils.js';
import { validateRequest } from './validation.js';
function get(options) {
    const invalid = validateRequest(options);
    if (invalid) {
        throw invalid;
    }
    const { chains, endpoint, apiKey } = options;
    const requestUrls = chains.map(chainId => getRequestUrl({ chainId, apiKey, endpoint }));
    return firstValueFrom(
    // get data
    zip(requestUrls.map(({ url, headers }) => ajax.getJSON(url, headers))));
}
export default get;
